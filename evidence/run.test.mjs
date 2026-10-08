import assert from "node:assert/strict";
import { access, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { createFixture } from "./fixture.mjs";
import { acquireOwner, executeRun, owns, releaseOwner, stopChild } from "./run.mjs";

const producer = (root, manifest) => async ({ runId, directory }) => {
  const oldDirectory = `evidence/runs/${manifest.runId}`;
  const { cp } = await import("node:fs/promises");
  await cp(resolve(root, oldDirectory), resolve(root, directory), { recursive: true });
  manifest.runId = runId;
  for (const execution of manifest.executions) for (const object of [execution.log, execution.report].filter(Boolean)) {
    object.path = object.path.replace(oldDirectory, directory);
  }
  for (const observation of manifest.observations) observation.path = observation.path.replace(oldDirectory, directory);
  return manifest;
};

test("overlap leaves active owner and existing publication untouched", async (context) => {
  const { root } = await createFixture(context);
  const before = await readFile(resolve(root, "evidence/manifest.json"));
  const token = await acquireOwner(root);
  await assert.rejects(executeRun(root), (error) => error.code === "OWNED");
  assert.deepEqual(await readFile(resolve(root, "evidence/manifest.json")), before);
  assert.equal(await owns(root, token), true);
  await releaseOwner(root, token);
});

test("token checked cleanup cannot delete a replacement owner", async (context) => {
  const { root } = await createFixture(context);
  const token = await acquireOwner(root);
  await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({ token: "replacement", pid: process.pid }));
  await releaseOwner(root, token);
  assert.equal(await owns(root, "replacement"), true);
});

test("stale owner requires explicit recovery; active and unverifiable owners remain untouched", async (context) => {
  const { root } = await createFixture(context);
  await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({ token: "stale", pid: 123, commandInProgress: false }));
  await assert.rejects(acquireOwner(root), (error) => error.code === "OWNED");
  await assert.rejects(acquireOwner(root, true, () => {}), (error) => error.code === "OWNED");
  await assert.rejects(acquireOwner(root, true, () => { throw Object.assign(new Error(), { code: "EPERM" }); }), (error) => error.code === "STALE_UNSAFE");
  const token = await acquireOwner(root, true, () => { throw Object.assign(new Error(), { code: "ESRCH" }); });
  assert.equal(await owns(root, token), true);
  await releaseOwner(root, token);
});

test("exited children and ESRCH during shutdown do not replace the original failure", () => {
  let calls = 0;
  const kill = () => { calls++; throw Object.assign(new Error(), { code: "ESRCH" }); };
  stopChild({ pid: 123, exitCode: 0, signalCode: null }, "SIGTERM", kill);
  assert.equal(calls, 0);
  stopChild({ pid: 123, exitCode: null, signalCode: null }, "SIGTERM", kill);
  assert.equal(calls, 1);
});

for (const phase of ["before", "after"]) {
  test(`signal cancellation ${phase} atomic rename exposes no success`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const controller = new AbortController();
    await assert.rejects(executeRun(root, {
      controller, produce: producer(root, manifest),
      [phase === "before" ? "beforePublish" : "afterRename"]: async () => { process.emit("SIGTERM"); },
    }), (error) => error.code === "CANCELLED");
    await assert.rejects(access(resolve(root, "evidence/manifest.json")));
    await assert.rejects(access(resolve(root, "evidence/.owner.json")));
  });
}

  test("successful owned publication validates before rename and survives clean relocation", async (context) => {
    const { root, manifest } = await createFixture(context);
    const result = await executeRun(root, { produce: producer(root, manifest) });
    const { validateEvidence } = await import("./validation.mjs");
    assert.equal((await validateEvidence(root)).cellCount, 48);
    assert.equal(JSON.parse(await readFile(resolve(root, "evidence/manifest.json"))).runId, result.runId);
    await assert.rejects(access(resolve(root, "evidence/.owner.json")));
  });

  test("source mutation at publication is rejected and cannot leave current success", async (context) => {
    const { root, manifest } = await createFixture(context);
    await assert.rejects(executeRun(root, {
      produce: producer(root, manifest),
      beforePublish: async () => { await writeFile(resolve(root, "src/changed.ts"), "changed"); },
    }), (error) => error.code === "STALE_SOURCE");
    await assert.rejects(access(resolve(root, "evidence/manifest.json")));
  });

  test("simultaneous explicit stale recovery cannot remove the new active owner", async (context) => {
    const { root } = await createFixture(context);
    await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({ token: "stale", pid: 123, commandInProgress: false }));
    const dead = (pid) => {
      if (pid === 123) throw Object.assign(new Error(), { code: "ESRCH" });
    };
    const results = await Promise.allSettled([acquireOwner(root, true, dead), acquireOwner(root, true, dead)]);
    const winners = results.filter((item) => item.status === "fulfilled");
    assert.equal(winners.length, 1);
    assert.equal(await owns(root, winners[0].value), true);
    await releaseOwner(root, winners[0].value);
  });

test("owned command failure invalidates old success and releases only its token", async (context) => {
  const { root } = await createFixture(context);
  await assert.rejects(executeRun(root, { produce: async () => { throw Object.assign(new Error("failed"), { code: "COMMAND_FAILED" }); } }), /failed/);
  await assert.rejects(access(resolve(root, "evidence/manifest.json")));
  await assert.rejects(access(resolve(root, "evidence/.owner.json")));
});

test("rejects symlinked build output before a producer can follow it", async (context) => {
  const { root } = await createFixture(context);
  const { rm } = await import("node:fs/promises");
  await rm(resolve(root, "dist"), { recursive: true });
  await symlink(resolve(root, "src"), resolve(root, "dist"));
  let invoked = false;
  await assert.rejects(executeRun(root, { produce: async () => { invoked = true; } }), /symlink/);
  assert.equal(invoked, false);
});

test("cancellation during final ownership checking cannot retain published success", async (context) => {
  const { root, manifest } = await createFixture(context);
  const controller = new AbortController();
  await assert.rejects(executeRun(root, {
    controller,
    produce: producer(root, manifest),
    afterRename: async () => { setImmediate(() => controller.abort()); },
  }), (error) => error.code === "CANCELLED");
  await assert.rejects(access(resolve(root, "evidence/manifest.json")));
  await assert.rejects(access(resolve(root, "evidence/.owner.json")));
});

test("stale recovery rejects interrupted commands with potentially live descendants", async (context) => {
  const { root } = await createFixture(context);
  await writeFile(resolve(root, "evidence/.owner.json"), JSON.stringify({
    token: "interrupted", pid: 123, commandInProgress: true,
  }));
  await assert.rejects(acquireOwner(root, true, () => {
    throw Object.assign(new Error(), { code: "ESRCH" });
  }), (error) => error.code === "STALE_UNSAFE");
  assert.equal(await owns(root, "interrupted"), true);
});

test("cancelling an executing command escalates past an exited leader and releases ownership", { timeout: 12000 }, async (context) => {
  const { root } = await createFixture(context);
  const controller = new AbortController();
  context.after(() => controller.abort());
  const ready = resolve(root, "child-ready.json");
  const childScript = `
    const fs = require("node:fs");
    process.on("SIGTERM", () => {});
    fs.writeFileSync(${JSON.stringify(ready)}, JSON.stringify({ pid: process.pid }));
    setInterval(() => {}, 1000);
    setTimeout(() => process.exit(0), 10000);
  `;
  const leaderScript = `
    require("node:child_process").spawn(process.execPath, ["-e", ${JSON.stringify(childScript)}], { stdio: "inherit" });
    process.on("SIGTERM", () => process.exit(0));
    setInterval(() => {}, 1000);
  `;
  const run = executeRun(root, {
    controller,
    produce: async ({ invoke }) => { await invoke([process.execPath, "-e", leaderScript]); },
  });
  const rejected = assert.rejects(run, (error) => error.code === "CANCELLED");
  let descendant;
  for (let tries = 0; tries < 100; tries++) {
    try { descendant = JSON.parse(await readFile(ready, "utf8")).pid; break; }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    await new Promise((done) => setTimeout(done, 20));
  }
  assert.ok(descendant, "Controlled descendant started");
  const started = Date.now();
  controller.abort();
  await rejected;
  assert.ok(Date.now() - started < 7000, "Cancellation settles within the escalation bound");
  try {
    process.kill(descendant, 0);
    const stat = await readFile(`/proc/${descendant}/stat`, "utf8");
    assert.equal(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[0], "Z", "Descendant is no longer executing");
  } catch (error) {
    if (error.code !== "ESRCH" && error.code !== "ENOENT") throw error;
  }
  await assert.rejects(access(resolve(root, "evidence/manifest.json")));
  await assert.rejects(access(resolve(root, "evidence/.owner.json")));
});

test("source changes during an executing command reject its claimed snapshot", async (context) => {
  const { root } = await createFixture(context);
  await assert.rejects(executeRun(root, {
    produce: async ({ invoke }) => {
      await invoke([process.execPath, "-e", "require('node:fs').writeFileSync('src/changed.ts', 'changed')"]);
    },
  }), (error) => error.code === "STALE_SOURCE");
  await assert.rejects(access(resolve(root, "evidence/manifest.json")));
});

test("failed Vitest without JSON retains its command outcome and typed diagnostics", async (context) => {
  const { root } = await createFixture(context);
  const bin = resolve(root, "fake-bin");
  await mkdir(bin);
  await writeFile(resolve(bin, "pnpm"), `#!${process.execPath}
const args = process.argv.slice(2);
if (args.includes("--version")) {
  console.log(args.includes("vitest") ? "5.0.1" : args.includes("playwright") ? "1.63.0" : "12.5.1");
} else if (args.includes("vitest")) {
  console.error("controlled Vitest failure");
  process.exitCode = 17;
}
`, { mode: 0o700 });
  const previous = process.env.PATH;
  process.env.PATH = `${bin}:${previous}`;
  context.after(() => { process.env.PATH = previous; });
  await assert.rejects(executeRun(root), (error) => error.code === "COMMAND_FAILED");
  const { readdir } = await import("node:fs/promises");
  const runs = await readdir(resolve(root, "evidence/runs"));
  const directory = resolve(root, "evidence/runs", runs.find((id) => id !== "11111111-1111-1111-1111-111111111111"));
  const attempt = JSON.parse(await readFile(resolve(directory, "attempt.json"), "utf8"));
  assert.equal(attempt.executions.at(-1).runner, "vitest");
  assert.equal(attempt.executions.at(-1).exitCode, 17);
  assert.equal(attempt.executions.at(-1).report, undefined);
  assert.match(await readFile(resolve(directory, "vitest.txt"), "utf8"), /controlled Vitest failure/);
  await assert.rejects(access(resolve(directory, "vitest.json")));
});
