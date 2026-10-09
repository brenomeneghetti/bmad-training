import assert from "node:assert/strict";
import { mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createFixture, writeManifest } from "./fixture.mjs";
import { calculateArtifactDigest, calculateSourceDigest, hashFile, parseCsp, requiredCells, safePath, validateEvidence } from "./validation.mjs";
import { inventoryOf, normalizeReport } from "./adapters.mjs";
import reporter from "./node-reporter.mjs";

test("accepts complete clean-checkout proof with exact inventory and all mandatory cells", async (context) => {
  const { root } = await createFixture(context);
  assert.deepEqual(await validateEvidence(root), {
    cellCount: requiredCells.size, testCount: 3,
    artifactDigest: await calculateArtifactDigest(root, { path: "dist", delivery: "deployment/static-delivery.json" }),
  });
});

test("same bytes remain valid after checkout relocation", async (context) => {
  const { root } = await createFixture(context);
  const relocated = `${root}-moved`;
  context.after(() => rm(relocated, { recursive: true, force: true }));
  await rename(root, relocated);
  assert.equal((await validateEvidence(relocated)).cellCount, requiredCells.size);
});

test("accepts reordered reviewed identities but still rejects missing multiplicity", async (context) => {
  const { root, manifest } = await createFixture(context);
  const execution = manifest.executions.find((item) => item.runner === "vitest");
  const report = JSON.parse(await readFile(resolve(root, execution.report.path), "utf8"));
  report.testResults[0].assertionResults.push({ fullName: "another exact unit", status: "passed" });
  await writeFile(resolve(root, execution.report.path), JSON.stringify(report));
  execution.report.hash = await hashFile(root, execution.report.path);
  const path = resolve(root, "evidence/inventory.json");
  const inventory = JSON.parse(await readFile(path, "utf8"));
  inventory.push({ ...inventory.find((item) => item.runner === "vitest"), title: "another exact unit" });
  await writeFile(path, JSON.stringify(inventory));
  manifest.sourceDigest = await calculateSourceDigest(root);
  for (const command of manifest.executions) command.sourceDigest = manifest.sourceDigest;
  await writeManifest(root, manifest);
  assert.equal((await validateEvidence(root)).testCount, 4);
  inventory.find((item) => item.title === "another exact unit").multiplicity = 2;
  await writeFile(path, JSON.stringify(inventory));
  manifest.sourceDigest = await calculateSourceDigest(root);
  for (const command of manifest.executions) command.sourceDigest = manifest.sourceDigest;
  await writeManifest(root, manifest);
  await assert.rejects(validateEvidence(root), /Exact inventory\/multiplicity mismatch/);
});

for (const cell of ["exact-history", "guard-draft", "accessible-action", "privacy-capacity"]) {
  test(`rejects missing Story 3.1 ${cell} evidence after rehashing`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify(coverage.filter((item) => item.id !== `story-3-1-${cell}`)));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Missing mandatory evidence cells: story-3-1-${cell}`));
  });
}

for (const [story, cells] of [
  ["3.5", ["scheduling-overflow", "validation-repeat", "independent-channels", "private-capacity"]],
  ["4.1", ["dark-foundation", "contextual-actions", "accessible-reflow", "private-capacity"]],
]) for (const cell of cells) {
  const cellId = `story-${story.replace(".", "-")}-${cell}`;
  test(`rejects missing Story ${story} ${cell} evidence after rehashing`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify(coverage.filter((item) => item.id !== cellId)));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Missing mandatory evidence cells: ${cellId}`));
  });
  test(`rejects unexecuted Story ${story} ${cell} identity despite other passing tests`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    const actual = JSON.parse(await readFile(resolve(process.cwd(), "evidence/coverage.json"), "utf8"));
    const mapping = actual.find((item) => item.id === cellId).tests.find((item) => item.runner === "playwright");
    coverage.find((item) => item.id === cellId).tests.push(mapping);
    await writeFile(path, JSON.stringify(coverage));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Unmapped test identity in ${cellId}`));
  });
}

for (const cell of ["input-arbiter", "logical-focus", "draft-filter", "serial-effects"]) {
  test(`rejects missing Story 3.2 ${cell} evidence after rehashing`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify(coverage.filter((item) => item.id !== `story-3-2-${cell}`)));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Missing mandatory evidence cells: story-3-2-${cell}`));
  });
}

for (const cell of ["exact-source", "stale-serial", "typed-failure", "private-capacity"]) {
  test(`rejects missing Story 3.3 ${cell} evidence after rehashing`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify(coverage.filter((item) => item.id !== `story-3-3-${cell}`)));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Missing mandatory evidence cells: story-3-3-${cell}`));
  });
}

for (const cell of ["exact-recovery", "recovery-lifecycle", "race-focus", "private-capacity"]) {
  test(`rejects missing Story 3.4 ${cell} evidence after rehashing`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify(coverage.filter((item) => item.id !== `story-3-4-${cell}`)));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), new RegExp(`Missing mandatory evidence cells: story-3-4-${cell}`));
  });

  test(`rejects unexecuted Story 3.4 ${cell} identity despite other passing tests`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = resolve(root, "evidence/coverage.json");
    const coverage = JSON.parse(await readFile(path, "utf8"));
    const actual = JSON.parse(await readFile(resolve(process.cwd(), "evidence/coverage.json"), "utf8"));
    const mapping = actual.find((item) => item.id === `story-3-4-${cell}`).tests.find((item) => item.runner === "playwright");
    coverage.find((item) => item.id === `story-3-4-${cell}`).tests.push(mapping);
    await writeFile(path, JSON.stringify(coverage));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), /Unmapped test identity in story-3-4-/);
  });
}

for (const mutation of ["missing-command", "wrong-argv", "nonzero", "signal", "missing-report", "hash", "source", "artifact", "tool-version"]) {
  test(`rejects isolated ${mutation} proof mutation`, async (context) => {
    const { root, manifest } = await createFixture(context);
    if (mutation === "missing-command") manifest.executions.pop();
    if (mutation === "wrong-argv") manifest.executions[0].argv.push("--filter=one");
    if (mutation === "nonzero") manifest.executions[0].exitCode = 1;
    if (mutation === "signal") manifest.executions[0].signal = "SIGTERM";
    if (mutation === "missing-report") delete manifest.executions[2].report;
    if (mutation === "hash") manifest.executions[2].report.hash = "0".repeat(64);
    if (mutation === "source") await writeFile(resolve(root, "src/tampered.ts"), "changed");
    if (mutation === "artifact") await writeFile(resolve(root, "dist/index.html"), "changed");
    if (mutation === "tool-version") manifest.toolVersions.playwright = "0.0.0";
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), /manifest|command|report|Report|digest|version/i);
  });
}

for (const mutation of ["missing", "skipped", "unmapped", "duplicate", "wrong-engine", "retried", "failed"]) {
  test(`rejects content-bound ${mutation} browser execution even with matching pass flags`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const execution = manifest.executions.find((item) => item.runner === "playwright");
    const report = JSON.parse(await readFile(resolve(root, execution.report.path), "utf8"));
    const tests = report.suites[0].specs[0].tests;
    if (mutation === "missing") tests.pop();
    if (mutation === "skipped") tests[0].results[0].status = "skipped";
    if (mutation === "failed") tests[0].results[0].status = "failed";
    if (mutation === "unmapped") report.suites[0].specs[0].title = "Unregistered test";
    if (mutation === "duplicate") tests.push(structuredClone(tests[0]));
    if (mutation === "wrong-engine") tests[0].annotations[0].description = "firefox:123";
    if (mutation === "retried") tests[0].results[0].retry = 1;
    await writeFile(resolve(root, execution.report.path), JSON.stringify(report));
    execution.report.hash = await hashFile(root, execution.report.path);
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), /inventory|engine|execute|nonpassing/i);
  });
}

for (const mutation of ["missing-cell", "story", "unmapped-title", "missing-engine", "unmapped-inventory"]) {
  test(`rejects independently rehashed ${mutation} contract`, async (context) => {
    const { root, manifest } = await createFixture(context);
    const path = mutation === "unmapped-inventory" ? "evidence/inventory.json" : "evidence/coverage.json";
    const contract = JSON.parse(await readFile(resolve(root, path), "utf8"));
    if (mutation === "missing-cell") contract.pop();
    if (mutation === "story") contract[0].story = "2.7";
    if (mutation === "unmapped-title") contract[0].tests[0].title = "not executed";
    if (mutation === "missing-engine") contract[0].tests.pop();
    if (mutation === "unmapped-inventory") contract.push({ runner: "none", file: "test.ts", title: "missing", project: "none", multiplicity: 1 });
    await writeFile(resolve(root, path), JSON.stringify(contract));
    manifest.sourceDigest = await calculateSourceDigest(root);
    for (const execution of manifest.executions) execution.sourceDigest = manifest.sourceDigest;
    await writeManifest(root, manifest);
    await assert.rejects(validateEvidence(root), /cell|inventory|mapping|engine|evidence|identity/i);
  });
}

test("rejects traversal, absolute, symlink ancestors and special files before reading", async (context) => {
  const { root, manifest } = await createFixture(context);
  for (const path of ["../outside", "/outside", "evidence/../manifest.json", "evidence//manifest.json"]) {
    await assert.rejects(safePath(root, path), /canonical|escapes/);
  }
  // Both ends are in the working folder; rejection must occur without following.
  await symlink(resolve(root, "dist"), resolve(root, "linked"));
  await assert.rejects(safePath(root, "linked/index.html"), /symlink/);
  await symlink("index.html", resolve(root, "dist/link"));
  await assert.rejects(calculateArtifactDigest(root, manifest.artifact), /symlink/);
  await promisify(execFile)("mkfifo", [resolve(root, "pipe")]);
  await assert.rejects(safePath(root, "pipe"), /special-file/);
});

test("rejects delivery CSP mutations and duplicate directives", async (context) => {
  const { root } = await createFixture(context);
  const path = resolve(root, "deployment/static-delivery.json");
  const delivery = JSON.parse(await readFile(path, "utf8"));
  delivery.headers["Content-Security-Policy"] = delivery.headers["Content-Security-Policy"].replace("connect-src 'none'", "connect-src 'self'");
  await writeFile(path, JSON.stringify(delivery));
  await assert.rejects(validateEvidence(root), /connect-src/);
  assert.throws(() => parseCsp("default-src 'none'; default-src 'self'"), /repeats/);
});

test("normalization preserves full titles, projects and duplicate multiplicities", () => {
  const report = { success: true, testResults: [{ name: "/checkout/src/a.test.ts", assertionResults: [
    { fullName: "suite title", status: "passed" }, { fullName: "suite title", status: "passed" },
  ] }] };
  assert.deepEqual(inventoryOf("vitest", normalizeReport("/checkout", "vitest", report)), [
    { runner: "vitest", file: "src/a.test.ts", title: "suite title", project: "vitest", multiplicity: 2 },
  ]);
});

test("unsupported observed Node versions cannot satisfy the engine contract", async (context) => {
  const { root, manifest } = await createFixture(context);
  manifest.toolVersions.node = "1.2.3";
  const observation = manifest.observations.find((item) => item.tool === "node");
  const path = resolve(root, observation.path);
  const result = JSON.parse(await readFile(path, "utf8"));
  result.stdout = "v1.2.3";
  await writeFile(path, JSON.stringify(result));
  observation.hash = await hashFile(root, observation.path);
  await writeManifest(root, manifest);
  await assert.rejects(validateEvidence(root), /Node.*engine range/);
});

test("optional public and environment inputs change source membership and identity", async (context) => {
  const { root } = await createFixture(context);
  const before = await calculateSourceDigest(root);
  await mkdir(resolve(root, "public"));
  await writeFile(resolve(root, "public/asset.txt"), "asset");
  const withPublic = await calculateSourceDigest(root);
  assert.notEqual(withPublic, before);
  await writeFile(resolve(root, ".env.production"), "VITE_LABEL=changed");
  assert.notEqual(await calculateSourceDigest(root), withPublic);
});

test("native Node reporter preserves nested identities and rejects skipped todo and failed events", async (context) => {
  const { root, manifest } = await createFixture(context);
  const file = `${root}/evidence/validate.test.mjs`;
  const events = [
    { type: "test:dequeue", data: { file, name: "parent", nesting: 0 } },
    ...["pass", "skip", "todo", "fail"].flatMap((name) => [
      { type: "test:dequeue", data: { file, name, nesting: 1 } },
      { type: name === "fail" ? "test:fail" : "test:pass", data: { file, name, nesting: 1, skip: name === "skip", todo: name === "todo" } },
    ]),
    { type: "test:pass", data: { file, name: "parent", nesting: 0 } },
  ];
  let output = "";
  for await (const chunk of reporter(events)) output += chunk;
  const report = JSON.parse(output);
  assert.deepEqual(report.tests.map((item) => [item.title, item.status]), [
    ["parent pass", "passed"], ["parent skip", "failed"], ["parent todo", "failed"], ["parent fail", "failed"], ["parent", "passed"],
  ]);
  const execution = manifest.executions.find((item) => item.runner === "node");
  await writeFile(resolve(root, execution.report.path), output);
  execution.report.hash = await hashFile(root, execution.report.path);
  await writeManifest(root, manifest);
  await assert.rejects(validateEvidence(root), /nonpassing/);
});
