import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { commands, engines, sourcePaths } from "./contracts.mjs";
import { inventoryOf, normalizeReport } from "./adapters.mjs";
import { calculateArtifactDigest, calculateSourceDigest, calculateTreeDigest, hashFile, releaseCells, requiredCells, safePath } from "./validation.mjs";

export const writeManifest = (root, manifest) =>
  writeFile(resolve(root, "evidence/manifest.json"), JSON.stringify(manifest, null, 2));

export async function createFixture(context, existingRoot) {
  const root = existingRoot ?? await mkdtemp(resolve(process.cwd(), ".url-evidence-"));
  if (!existingRoot) context.after(() => rm(root, { recursive: true, force: true }));
  const runId = "11111111-1111-1111-1111-111111111111";
  const directory = `evidence/runs/${runId}`;
  await mkdir(resolve(root, directory), { recursive: true });
  for (const path of sourcePaths.filter((item) => !["evidence/inventory.json", "evidence/coverage.json"].includes(item))) {
    const source = await safePath(process.cwd(), path, "any");
    await mkdir(resolve(root, path, ".."), { recursive: true });
    await cp(source, resolve(root, path), { recursive: true });
  }
  await mkdir(resolve(root, "deployment"), { recursive: true });
  await cp(await safePath(process.cwd(), "deployment/static-delivery.json"), resolve(root, "deployment/static-delivery.json"));
  await mkdir(resolve(root, "dist"), { recursive: true });
  await writeFile(resolve(root, "dist/index.html"), "<main>clean build</main>");
  const reports = {
    vitest: { success: true, testResults: [{ name: `${root}/src/core/session/session.test.ts`, assertionResults: [{ fullName: "session exactness", status: "passed" }] }] },
    node: { tests: [{ file: `${root}/evidence/validate.test.mjs`, title: "proof integrity", project: "node", status: "passed" }] },
    playwright: { config: { version: "1.63.0", rootDir: `${root}/tests` }, errors: [], stats: { unexpected: 0, skipped: 0, flaky: 0 }, suites: [{
      title: "workbench.spec.ts", file: "workbench.spec.ts", specs: [{
        title: "browser contracts", file: "workbench.spec.ts", tests: engines.map((projectName) => ({
          projectName, expectedStatus: "passed", annotations: [{ type: "engine", description: `${projectName}:123.0` }],
          results: [{ status: "passed", retry: 0 }],
        })),
      }],
    }] },
  };
  const inventory = Object.entries(reports).flatMap(([runner, report]) => inventoryOf(runner, normalizeReport(root, runner, report)));
  await writeFile(resolve(root, "evidence/inventory.json"), JSON.stringify(inventory));
  await writeFile(resolve(root, "evidence/coverage.json"), JSON.stringify([...requiredCells].map(([id, story]) => ({
    id, story, tests: inventory.filter((item) => item.runner === "playwright"),
  }))));
  const executions = [];
  for (const [runner, argv] of Object.entries(commands)) {
    const log = `${directory}/${runner}.txt`;
    await writeFile(resolve(root, log), `argv: ${JSON.stringify(argv)}\nexitCode: 0\nsignal: null\nsuccessful execution`);
    const execution = { runner, argv: [...argv], exitCode: 0, signal: null, checkoutRoot: root, log: { path: log, hash: await hashFile(root, log) } };
    if (reports[runner]) {
      const path = `${directory}/${runner}.json`;
      await writeFile(resolve(root, path), JSON.stringify(reports[runner]));
      execution.report = { path, hash: await hashFile(root, path) };
    }
    executions.push(execution);
  }
  const packages = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const manifest = {
    schemaVersion: 2, runId, recordedAt: "2026-10-07T00:00:00.000Z",
    sourceDigest: await calculateSourceDigest(root), artifact: { path: "dist", delivery: "deployment/static-delivery.json", digest: "" },
    toolVersions: { node: process.versions.node, pnpm: "12.5.1", vitest: packages.devDependencies.vitest, playwright: packages.devDependencies["@playwright/test"] },
    executions,
  };
  manifest.artifact.digest = await calculateArtifactDigest(root, manifest.artifact);
  for (const execution of executions) {
    execution.sourceDigest = manifest.sourceDigest;
    execution.artifactDigest = manifest.artifact.digest;
  }
  manifest.observations = [];
  for (const [tool, version] of Object.entries(manifest.toolVersions)) {
    const argv = tool === "node" ? ["node", "--version"] :
      tool === "pnpm" ? ["pnpm", "--version"] : ["pnpm", "exec", tool, "--version"];
    const path = `${directory}/version-${tool}.json`;
    await writeFile(resolve(root, path), JSON.stringify({ argv, stdout: version, stderr: "", exitCode: 0, signal: null }));
    manifest.observations.push({ tool, path, hash: await hashFile(root, path) });
  }
  await writeManifest(root, manifest);
  return { root, manifest };
}

export async function createReleaseFixture(context) {
  const { root, manifest } = await createFixture(context);
  const now = Date.now();
  const date = new Date(now - 1000).toISOString();
  manifest.recordedAt = date;
  await mkdir(resolve(root, "dist/assets"));
  await writeFile(resolve(root, "dist/assets/app-12345678.js"), "synthetic artifact");
  manifest.artifact.digest = await calculateArtifactDigest(root, manifest.artifact);
  for (const execution of manifest.executions) execution.artifactDigest = manifest.artifact.digest;
  await writeManifest(root, manifest);
  const contract = JSON.parse(await readFile(resolve(root, "evidence/release-contract.json"), "utf8"));
  const cells = releaseCells(contract);
  const zero = () => Object.fromEntries(contract.criticalKinds.map((kind) => [kind, 0]));
  const checks = (keys) => Object.fromEntries(keys.map((key) => [key, true]));
  const signOff = (attestor) => ({ attestor, date, approval: "approved", signature: "synthetic-not-authenticated" });
  const input = {
    schemaVersion: 1, matrixVersion: contract.matrixVersion, evaluatorVersion: contract.evaluatorVersion,
    provenance: "synthetic", runId: manifest.runId, sourceDigest: manifest.sourceDigest,
    artifactDigest: manifest.artifact.digest, records: [],
  };
  const records = new Map();
  const majors = { chrome: 200, firefox: 200, edge: 200, safari: 50 };
  const attachment = async (bytes, extension) => {
    const hash = createHash("sha256").update(bytes).digest("hex");
    const path = `evidence/attachments/${hash}.${extension}`;
    await mkdir(resolve(root, "evidence/attachments"), { recursive: true });
    await writeFile(resolve(root, path), bytes);
    return { path, hash };
  };
  const priorArtifact = await attachment("synthetic prior bundle", "bin");
  const priorHeaders = await attachment('{"synthetic":"prior headers"}', "json");
  const headers = JSON.parse(await readFile(resolve(root, manifest.artifact.delivery), "utf8")).headers;
  const bundleDigest = await calculateTreeDigest(root, ["dist"]);
  const headersDigest = createHash("sha256").update(JSON.stringify(headers)).digest("hex");
  const channels = {
    requirement: "manual", baseline: "browser", browser: "browser", manual: "manual",
    keyboard: "manual", performance: "performance", study: "study", critical: "summary",
    privacy: "privacy", delivery: "delivery",
  };
  for (const cell of cells) {
    const browser = cell.browser ?? "chrome";
    const version = `${majors[browser] - (cell.slot === "previous" ? 1 : 0)}.0.0`;
    const testedVersions = [{
      browser, version, os: cell.os ?? (browser === "safari" ? "macos" : "windows"),
      osVersion: "synthetic", at: cell.at ?? "none", ...(cell.at ? { atVersion: "synthetic" } : {}),
    }];
    let details;
    switch (cell.kind) {
      case "requirement": details = { verified: true, observation: "Synthetic evaluator branch only; not release proof." }; break;
      case "baseline": details = { latestMajors: majors, checkedAt: date }; break;
      case "browser": details = checks(["releasedBrowser", "wholeJourney"]); break;
      case "manual": details = checks(contract.manualChecks); break;
      case "keyboard": details = checks(["keyboard-only", ...contract.manualChecks]); break;
      case "performance":
        details = {
          hardware: { logicalCpus: 4, ramBytes: 8_000_000_000, model: "synthetic" },
          fixture: { characters: 20000, queryEntries: 260 }, initialParseMs: 1000,
          measurementMethod: "Synthetic boundary values for evaluator tests; no real measurements.",
          operationsMs: Object.fromEntries(contract.operations.map((operation) => [operation, 100])),
        }; break;
      case "study": {
        const roster = Array.from({ length: 5 }, (_, index) => `synthetic-developer-${index}`);
        details = {
          journey: "UJ-1", roster, totalParticipants: roster.length, unassistedCompleters: roster.length,
          participants: roster.map((id) => ({
            id, representativeDeveloper: true, completed: true, assistance: "none",
            steps: Object.fromEntries(contract.journeySteps.map((step) => [step, { completed: true, assisted: false }])),
            signOff: signOff(id),
          })),
        }; break;
      }
      case "critical":
        details = { totals: zero(), channels: [...new Set(Object.values(channels).filter((channel) => channel !== "summary"))].sort() }; break;
      case "privacy": details = { checks: checks(contract.privacyChecks), clipboardSources: contract.clipboardSources }; break;
      case "delivery":
        details = {
          transport: "https", testedBundleDigest: bundleDigest, deliveredBundleDigest: bundleDigest,
          testedHeadersDigest: headersDigest, deliveredHeadersDigest: headersDigest,
          deliveryDigest: await hashFile(root, manifest.artifact.delivery), htmlCacheControl: "no-cache",
          assets: [{ path: "dist/assets/app-12345678.js", hash: await hashFile(root, "dist/assets/app-12345678.js"),
            cacheControl: "public, max-age=31536000, immutable" }],
          promotion: "identical-tested-bytes-no-rebuild",
          rollback: { priorArtifact, priorHeaders, restoredArtifactHash: priorArtifact.hash,
            restoredHeadersHash: priorHeaders.hash, atomic: true, observed: true },
        }; break;
    }
    const record = {
      schemaVersion: 1, matrixVersion: contract.matrixVersion, evaluatorVersion: contract.evaluatorVersion,
      cellId: cell.id, kind: cell.kind, requirements: cell.requirements, stories: cell.stories,
      provenance: "synthetic",
      fixture: cell.fixture, owner: `synthetic-${cell.ownerRole}`, ownerRole: cell.ownerRole,
      result: "pass", channel: channels[cell.kind], runId: manifest.runId, sourceDigest: manifest.sourceDigest,
      artifactDigest: manifest.artifact.digest, recordedAt: date, signOff: signOff(`synthetic-${cell.ownerRole}`),
      testedVersions, criticalFailures: zero(), details,
    };
    records.set(cell.id, record);
  }
  const saveInput = () => writeFile(resolve(root, "evidence/release-evidence.json"), JSON.stringify(input));
  const saveRecord = async (id) => {
    const bytes = JSON.stringify(records.get(id));
    const hash = createHash("sha256").update(bytes).digest("hex");
    const path = `evidence/observations/${hash}.json`;
    await mkdir(resolve(root, "evidence/observations"), { recursive: true });
    await writeFile(resolve(root, path), bytes);
    const reference = { cellId: id, path, hash };
    const index = input.records.findIndex((item) => item.cellId === id);
    if (index < 0) input.records.push(reference);
    else input.records[index] = reference;
    await saveInput();
  };
  for (const cell of cells) await saveRecord(cell.id);
  return { root, manifest, contract, cells, records, input, saveRecord, saveInput, now };
}
