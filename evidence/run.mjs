import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { lstatSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { commands } from "./contracts.mjs";
import { calculateArtifactDigest, calculateSourceDigest, calculateTreeDigest, hashFile, readJson, safePath, validateEvidence } from "./validation.mjs";

export class RunError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const safeRunCode = (error) => [
  "OWNED", "STALE_UNSAFE", "OWNERSHIP_LOST", "CANCELLED", "STALE_SOURCE",
  "STALE_ARTIFACT", "PREREQUISITE", "COMMAND_FAILED", "MISSING_REPORT",
].includes(error.code) ? error.code : "VALIDATION_FAILED";

export function stopChild(child, signal = "SIGTERM", kill = process.kill) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  signalGroup(child.pid, signal, kill);
}

function signalGroup(pid, signal, kill = process.kill) {
  try { kill(-pid, signal); } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

export async function acquireOwner(root, recover = false, probe = process.kill) {
  await safePath(root, "evidence", "directory");
  const path = resolve(root, "evidence/.owner.json");
  const token = randomUUID();
  const claim = async () => {
    const handle = await open(path, "wx", 0o600);
    await handle.writeFile(JSON.stringify({ token, pid: process.pid, commandInProgress: false }));
    await handle.close();
    return token;
  };
  try { return await claim(); } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  if (!recover) throw new RunError("OWNED", "Evidence workspace already owned; no publication changed.");
  const recoveryPath = resolve(root, "evidence/.recovery");
  let recovery;
  try { recovery = await open(recoveryPath, "wx", 0o600); }
  catch (error) {
    if (error.code === "EEXIST") throw new RunError("STALE_UNSAFE", "Another recovery is active or abandoned; operator investigation required.");
    throw error;
  }
  try {
    const owner = await readJson(root, "evidence/.owner.json");
    if (!Number.isSafeInteger(owner.pid) || owner.pid < 1 || typeof owner.token !== "string") {
      throw new RunError("STALE_UNSAFE", "Malformed owner; explicit operator investigation required.");
    }
    try { probe(owner.pid, 0); } catch (error) {
      if (error.code !== "ESRCH") throw new RunError("STALE_UNSAFE", "Owner liveness cannot be established.");
      if (owner.commandInProgress !== false) {
        throw new RunError("STALE_UNSAFE", "Interrupted or unknown command may have surviving descendants; operator investigation required.");
      }
      // Recheck the exact token before conservative stale recovery.
      if ((await readJson(root, "evidence/.owner.json")).token !== owner.token) throw new RunError("OWNED", "Owner changed during recovery.");
      await rm(path);
      return claim();
    }
    throw new RunError("OWNED", "Active owner cannot be recovered.");
  } finally {
    await recovery.close();
    await rm(recoveryPath);
  }
}

export async function owns(root, token) {
  try { return (await readJson(root, "evidence/.owner.json")).token === token; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

export async function releaseOwner(root, token) {
  if (await owns(root, token)) await rm(resolve(root, "evidence/.owner.json"));
}

function releaseOwnerSync(root, token) {
  const path = resolve(root, "evidence/.owner.json");
  if (!lstatSync(path).isFile() || JSON.parse(readFileSync(path, "utf8")).token !== token) {
    throw new RunError("OWNERSHIP_LOST", "Evidence owner changed at completion.");
  }
  unlinkSync(path);
}

export const localEnvironment = (root) => ({
  ...process.env, HOME: resolve(root, ".cache/home"), TMPDIR: resolve(root, ".cache/tmp"),
  TMP: resolve(root, ".cache/tmp"), TEMP: resolve(root, ".cache/tmp"),
  XDG_CACHE_HOME: resolve(root, ".cache"), XDG_CONFIG_HOME: resolve(root, ".cache/config"),
  XDG_DATA_HOME: resolve(root, ".cache/data"), PLAYWRIGHT_BROWSERS_PATH: resolve(root, ".cache/browsers"),
  XDG_RUNTIME_DIR: resolve(root, ".cache/runtime"),
  npm_config_cache: resolve(root, ".cache/npm"), PNPM_HOME: resolve(root, ".cache/pnpm"),
});

async function runCommand(root, argv, env, controller, onChild) {
  if (controller.signal.aborted) throw new RunError("CANCELLED", "Run cancelled.");
  return new Promise((done, reject) => {
    // A managed process group lets cancellation terminate the preview/browser descendants.
    const child = spawn(argv[0], argv.slice(1), { cwd: root, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
    onChild(child);
    let stdout = "", stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    let forcedStop;
    const abort = () => {
      stopChild(child);
      forcedStop = setTimeout(() => signalGroup(child.pid, "SIGKILL"), 3000);
      forcedStop.unref();
    };
    controller.signal.addEventListener("abort", abort, { once: true });
    child.once("error", reject);
    child.once("close", (exitCode, signal) => {
      controller.signal.removeEventListener("abort", abort);
      clearTimeout(forcedStop);
      onChild(null);
      done({ exitCode, signal, stdout, stderr });
    });
  });
}

export async function executeRun(root, { recover = false, controller = new AbortController(), beforePublish = async () => {}, afterRename = async () => {}, produce } = {}) {
  const token = await acquireOwner(root, recover);
  const runId = randomUUID();
  const directory = `evidence/runs/${runId}`;
  const candidate = `evidence/.manifest-${token}.json`;
  let child = null;
  let attempt;
  let completed = false;
  const assertActive = async () => {
    if (controller.signal.aborted) throw new RunError("CANCELLED", "Cancelled owner cannot publish success.");
    if (!await owns(root, token)) throw new RunError("OWNERSHIP_LOST", "Evidence owner token changed.");
    if (controller.signal.aborted) throw new RunError("CANCELLED", "Cancelled owner cannot publish success.");
  };
  const abort = () => controller.abort();
  process.on("SIGINT", abort);
  process.on("SIGTERM", abort);
  try {
    await assertActive();
    // A new owned attempt invalidates stale success even if its build later fails.
    try { await safePath(root, "evidence/manifest.json"); await rm(resolve(root, "evidence/manifest.json")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    try { await safePath(root, "evidence/runs", "directory"); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(resolve(root, "evidence/runs"));
    }
    await safePath(root, "evidence/runs", "directory");
    await mkdir(resolve(root, directory));
    for (const path of [".cache/home", ".cache/tmp", ".cache/config", ".cache/data", ".cache/runtime", ".cache/browsers", ".cache/npm", ".cache/pnpm"]) {
      // Check existing ancestors before mkdir, and reject symlink cache paths.
      let prefix = "";
      for (const part of path.split("/")) {
        prefix = prefix ? `${prefix}/${part}` : part;
        try { await safePath(root, prefix, "directory"); }
        catch (error) {
          if (error.code !== "ENOENT") throw error;
          await mkdir(resolve(root, prefix), { mode: 0o700 });
        }
      }
    }
    const sourceDigest = await calculateSourceDigest(root);
    for (const path of ["dist", "test-results", "playwright-report", "tsconfig.app.tsbuildinfo", "tsconfig.node.tsbuildinfo", ".cache/evidence-vitest.json"]) {
      try { await safePath(root, path, "any"); await calculateTreeDigest(root, [path]); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
    }
    const env = localEnvironment(root);
    const invoke = async (argv, extra = {}) => {
      await assertActive();
      if (sourceDigest !== await calculateSourceDigest(root)) throw new RunError("STALE_SOURCE", "Inputs changed before command execution.");
      await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({ token, pid: process.pid, commandInProgress: true }));
      const result = await runCommand(root, argv, { ...env, ...extra }, controller, (value) => { child = value; });
      await assertActive();
      if (sourceDigest !== await calculateSourceDigest(root)) throw new RunError("STALE_SOURCE", "Inputs changed during command execution.");
      await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({ token, pid: process.pid, commandInProgress: false }));
      return result;
    };
    let manifest;
    if (produce) manifest = await produce({ runId, sourceDigest, directory, invoke });
    else {
      const toolVersions = {};
      const observations = [];
      const executions = [];
      attempt = { schemaVersion: 2, status: "incomplete", runId, sourceDigest, toolVersions, observations, executions };
      for (const [name, argv] of [
        ["node", ["node", "--version"]],
        ["pnpm", ["pnpm", "--version"]], ["vitest", ["pnpm", "exec", "vitest", "--version"]],
        ["playwright", ["pnpm", "exec", "playwright", "--version"]],
      ]) {
        const result = await invoke(argv);
        const path = `${directory}/version-${name}.json`;
        await writeFile(resolve(root, path), JSON.stringify({ argv, ...result }));
        observations.push({ tool: name, path, hash: await hashFile(root, path) });
        if (result.exitCode !== 0) throw new RunError("PREREQUISITE", `Unable to observe ${name} version.`);
        toolVersions[name] = result.stdout.match(/\d+\.\d+\.\d+/)?.[0] ?? "";
      }
      let buildDigest;
      for (const [runner, argv] of Object.entries(commands)) {
        await assertActive();
        if (buildDigest && buildDigest !== await calculateArtifactDigest(root, { path: "dist", delivery: "deployment/static-delivery.json" })) {
          throw new RunError("STALE_ARTIFACT", "Build/delivery changed before command execution.");
        }
        if (runner === "vitest") await rm(resolve(root, ".cache/evidence-vitest.json"), { force: true });
        const result = await invoke(argv, runner === "playwright" ? { PLAYWRIGHT_JSON_OUTPUT_FILE: resolve(root, `${directory}/playwright.json`) } : {});
        const logPath = `${directory}/${runner}.txt`;
        await writeFile(resolve(root, logPath), `argv: ${JSON.stringify(argv)}\nexitCode: ${result.exitCode}\nsignal: ${result.signal}\n${runner === "node" ? "Native Node results captured in node.json." : result.stdout}\n${result.stderr}`, { flag: "wx" });
        if (runner === "build" && result.exitCode === 0) buildDigest = await calculateArtifactDigest(root, { path: "dist", delivery: "deployment/static-delivery.json" });
        const execution = { runner, argv, exitCode: result.exitCode, signal: result.signal, checkoutRoot: root, sourceDigest, artifactDigest: buildDigest, log: { path: logPath, hash: await hashFile(root, logPath) } };
        if (runner === "vitest") {
          try {
            await writeFile(resolve(root, `${directory}/vitest.json`), await readFile(await safePath(root, ".cache/evidence-vitest.json")), { flag: "wx" });
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
          }
        }
        if (runner === "node") await writeFile(resolve(root, `${directory}/node.json`), result.stdout, { flag: "wx" });
        if (["vitest", "node", "playwright"].includes(runner)) {
          const reportPath = `${directory}/${runner}.json`;
          try { execution.report = { path: reportPath, hash: await hashFile(root, reportPath) }; }
          catch (error) { if (error.code !== "ENOENT") throw error; }
        }
        executions.push(execution);
        attempt.artifact = { path: "dist", delivery: "deployment/static-delivery.json", digest: buildDigest };
        if (result.exitCode !== 0 || result.signal !== null) {
          throw new RunError("COMMAND_FAILED", `${runner} incomplete/nonpassing; see ${logPath}.`);
        }
        if (["vitest", "node", "playwright"].includes(runner) && !execution.report) {
          throw new RunError("MISSING_REPORT", `${runner} produced no structured report; see ${logPath}.`);
        }
      }
      manifest = {
        schemaVersion: 2, runId, sourceDigest, recordedAt: new Date().toISOString(), toolVersions, observations, executions,
        artifact: { path: "dist", delivery: "deployment/static-delivery.json", digest: buildDigest },
      };
    }
    await writeFile(resolve(root, candidate), JSON.stringify(manifest, null, 2), { flag: "wx" });
    await validateEvidence(root, candidate);
    await beforePublish({ root, token, controller });
    await assertActive();
    if (sourceDigest !== await calculateSourceDigest(root)) throw new RunError("STALE_SOURCE", "Inputs changed during execution.");
    await validateEvidence(root, candidate);
    await assertActive();
    await rename(resolve(root, candidate), resolve(root, "evidence/manifest.json"));
    await afterRename({ root, token, controller });
    await assertActive();
    releaseOwnerSync(root, token);
    completed = true;
    return { runId, directory };
  } catch (error) {
    stopChild(child);
    if (await owns(root, token)) {
      await rm(resolve(root, "evidence/manifest.json"), { force: true });
      const failure = { code: safeRunCode(error) };
      try {
        await writeFile(resolve(root, `${directory}/failure.json`), JSON.stringify(failure), { flag: "wx" });
        if (attempt) await writeFile(resolve(root, `${directory}/attempt.json`), JSON.stringify({ ...attempt, failure }, null, 2), { flag: "wx" });
      } catch {
        console.error("DIAGNOSTIC_FAILED");
      }
    }
    throw error;
  } finally {
    if (!completed) {
      if (await owns(root, token)) await rm(resolve(root, candidate), { force: true });
      await releaseOwner(root, token);
    }
    process.off("SIGINT", abort);
    process.off("SIGTERM", abort);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(import.meta.dirname, "..");
  try {
    const result = await executeRun(root, { recover: process.argv.includes("--recover-stale") });
    console.log(`Validated immutable execution objects: ${result.directory}`);
  } catch (error) {
    console.error(safeRunCode(error));
    process.exitCode = 1;
  }
}
