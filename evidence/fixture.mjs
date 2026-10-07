import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { commands, engines, sourcePaths } from "./contracts.mjs";
import { inventoryOf, normalizeReport } from "./adapters.mjs";
import { calculateArtifactDigest, calculateSourceDigest, hashFile, requiredCells, safePath } from "./validation.mjs";

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
