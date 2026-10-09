import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { createReleaseFixture, writeManifest } from "./fixture.mjs";
import { calculateSourceDigest, evaluateGate, hashFile } from "./validation.mjs";

const evaluate = (fixture, options = {}) => evaluateGate(fixture.root, { now: fixture.now, ...options });
const failed = (result, code, cellId) => {
  assert.equal(result.satisfied, false);
  assert.equal(result.releaseEligible, false);
  assert.equal(result.authorization, null);
  assert.ok(result.diagnostics.some((item) => item.code === code && (cellId === undefined || item.cellId === cellId)),
    `${code}:${cellId ?? ""} in ${JSON.stringify(result.diagnostics)}`);
};
const mutate = async (fixture, id, changes, code) => {
  const original = structuredClone(fixture.records.get(id));
  for (const change of changes) {
    const record = structuredClone(original);
    change(record);
    fixture.records.set(id, record);
    await fixture.saveRecord(id);
    failed(await evaluate(fixture), code, id);
  }
  fixture.records.set(id, original);
  await fixture.saveRecord(id);
};

test("release separates intact Chromium MVP proof from missing external cells", async (context) => {
  const fixture = await createReleaseFixture(context);
  fixture.input.records = [];
  await fixture.saveInput();
  assert.equal((await evaluate(fixture, { scope: "mvp" })).satisfied, true);
  const result = await evaluate(fixture);
  failed(result, "REQUIRED_RECORD_MISSING", "release-uj-1-study");
  assert.equal(result.diagnostics.filter((item) => item.code === "REQUIRED_RECORD_MISSING").length, fixture.cells.length);
  assert.equal((await evaluate(fixture, { scope: "mvp" })).releaseEligible, false);
});

test("release complete synthetic fixtures satisfy the oracle but never authorize promotion", async (context) => {
  const fixture = await createReleaseFixture(context);
  const result = await evaluate(fixture);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.satisfied, true);
  assert.equal(result.requiredCellCount, 92);
  assert.equal(result.releaseEligible, false);
  assert.equal(result.authorization, null);
  const { stderr } = await promisify(execFile)(process.execPath, [resolve(fixture.root, "evidence/validate.mjs"), "--release"])
    .catch((error) => error);
  assert.match(stderr, /^SYNTHETIC_NOT_RELEASE_PROOF\n$/);
  await assert.rejects(readdir(resolve(fixture.root, "evidence/authorizations")));
});

test("release observed fixture authorization binds content addresses without deploying or rebuilding", async (context) => {
  const fixture = await createReleaseFixture(context);
  fixture.input.provenance = "observed";
  await fixture.saveInput();
  failed(await evaluate(fixture), "PROVENANCE_MISMATCH", "release-fr1");
  for (const record of fixture.records.values()) {
    record.provenance = "observed";
    await fixture.saveRecord(record.cellId);
  }
  const result = await evaluate(fixture);
  assert.equal(result.releaseEligible, true);
  const authorization = result.authorization;
  assert.equal(authorization.digest, createHash("sha256").update(authorization.bytes).digest("hex"));
  const body = JSON.parse(authorization.bytes);
  assert.equal(body.artifactDigest, fixture.manifest.artifact.digest);
  assert.equal(body.sourceDigest, fixture.manifest.sourceDigest);
  assert.equal(body.rebuild, false);
  assert.equal(body.records.length, fixture.cells.length);
  assert.equal(body.manifestDigest, await hashFile(fixture.root, "evidence/manifest.json"));
  const runCli = () => promisify(execFile)(process.execPath, [resolve(fixture.root, "evidence/validate.mjs"), "--release"]);
  const first = await runCli();
  assert.equal(first.stdout.trim(), `RELEASE_AUTHORIZED:${authorization.path}`);
  assert.equal(await hashFile(fixture.root, authorization.path), authorization.digest);
  assert.equal((await runCli()).stdout, first.stdout);
  const before = await readFile(resolve(fixture.root, "dist/index.html"));
  fixture.records.get("release-delivery-promotion").details.deliveredBundleDigest = "0".repeat(64);
  await fixture.saveRecord("release-delivery-promotion");
  await assert.rejects(runCli(), (error) => error.code === 1 && !error.stdout && /DELIVERY_PROOF_INVALID/.test(error.stderr));
  assert.equal((await readdir(resolve(fixture.root, "evidence/authorizations"))).length, 1);
  assert.deepEqual(await readFile(resolve(fixture.root, "dist/index.html")), before);
});

test("release story scope evaluates only reviewed mapped mandatory cells and cannot authorize", async (context) => {
  const fixture = await createReleaseFixture(context);
  fixture.input.records = fixture.input.records.filter((item) =>
    !["release-uj-1-study", "release-delivery-promotion"].includes(item.cellId));
  const summary = fixture.records.get("release-critical-summary");
  summary.details.channels = summary.details.channels.filter((channel) => !["study", "delivery"].includes(channel));
  await fixture.saveRecord("release-critical-summary");
  const story = await evaluate(fixture, { scope: "3.5" });
  assert.equal(story.satisfied, true);
  assert.equal(story.requiredCellCount, 90);
  assert.equal(story.authorization, null);
  await assert.rejects(
    promisify(execFile)(process.execPath, [resolve(fixture.root, "evidence/validate.mjs"), "--story", "3.5"]),
    (error) => error.code === 1 && !error.stdout && error.stderr === "SYNTHETIC_NOT_STORY_PROOF\n",
  );
  failed(await evaluate(fixture), "REQUIRED_RECORD_MISSING", "release-delivery-promotion");
  failed(await evaluate(fixture, { scope: "3.6" }), "REQUIRED_RECORD_MISSING", "release-uj-1-study");
  const invalid = await evaluate(fixture, { scope: "submitted-private-content" });
  assert.equal(invalid.scope, "invalid");
  assert.deepEqual(invalid.diagnostics, [{ code: "UNSUPPORTED_SCOPE", cellId: null }]);
});

test("release every individual mandatory cell and mixed missing combinations fail closed", async (context) => {
  const fixture = await createReleaseFixture(context);
  const all = [...fixture.input.records];
  for (const cell of fixture.cells) {
    fixture.input.records = all.filter((reference) => reference.cellId !== cell.id);
    await fixture.saveInput();
    failed(await evaluate(fixture), "REQUIRED_RECORD_MISSING", cell.id);
  }
  for (const ids of [
    ["release-fr1", "release-nfr17", "release-ux-dr28", "release-ag-3"],
    ["release-manual-ios-safari-voiceover-latest", "release-keyboard-windows", "release-uj-1-study"],
    ["release-performance-reference", "release-privacy-lifecycle", "release-delivery-promotion"],
  ]) {
    fixture.input.records = all.filter((reference) => !ids.includes(reference.cellId));
    await fixture.saveInput();
    const result = await evaluate(fixture);
    for (const id of ids) failed(result, "REQUIRED_RECORD_MISSING", id);
  }
});

test("release rejects duplicate malformed unsupported source-file and nonpassing records", async (context) => {
  const fixture = await createReleaseFixture(context);
  const original = structuredClone(fixture.input);
  fixture.input.records.push(fixture.input.records[0]);
  await fixture.saveInput();
  failed(await evaluate(fixture), "DUPLICATE_RECORD", "release-fr1");
  fixture.input.records = [...original.records, { ...original.records[0], cellId: "private-unknown-id" }];
  await fixture.saveInput();
  const unsupported = await evaluate(fixture);
  failed(unsupported, "UNSUPPORTED_CELL");
  assert.ok(!JSON.stringify(unsupported.diagnostics).includes("private-unknown-id"));
  fixture.input.records = structuredClone(original.records);
  fixture.input.records[0].path = "src/core/session/session.test.ts";
  await fixture.saveInput();
  failed(await evaluate(fixture), "RELEASE_INPUT_MALFORMED");
  fixture.input.records = structuredClone(original.records);
  await fixture.saveInput();
  await mutate(fixture, "release-fr1", [
    (record) => { record.result = "fail"; },
    (record) => { record.result = "skip"; },
    (record) => { record.result = "waived"; },
    (record) => { record.result = "deferred"; },
  ], "RECORD_NOT_PASS");
  await mutate(fixture, "release-fr1", [
    (record) => { delete record.signOff; },
    (record) => { record.signOff.approval = "pending"; },
    (record) => { record.signOff.signature = ""; },
    (record) => { record.unreviewed = true; },
    (record) => { record.testedVersions = []; },
  ], "RECORD_MALFORMED");
});

test("release rejects tampering even with matching pass flags and identifies reviewed cells", async (context) => {
  const fixture = await createReleaseFixture(context);
  const reference = fixture.input.records.find((item) => item.cellId === "release-fr1");
  await writeFile(resolve(fixture.root, reference.path), "private submitted content");
  failed(await evaluate(fixture), "RECORD_INTEGRITY", "release-fr1");
  await fixture.saveRecord("release-fr1");
  await mutate(fixture, "release-fr1", [
    (record) => { record.cellId = "release-fr2"; },
    (record) => { record.requirements = ["FR2"]; },
    (record) => { record.stories = ["3.6"]; },
    (record) => { record.fixture = "source-file-not-proof"; },
    (record) => { record.ownerRole = "delivery-owner"; },
    (record) => { record.channel = "summary"; },
  ], "RECORD_MAPPING_MISMATCH");
});

test("release rejects stale future unsupported version owner and artifact bindings", async (context) => {
  const fixture = await createReleaseFixture(context);
  await mutate(fixture, "release-fr1", [
    (record) => { record.recordedAt = "2000-01-01T00:00:00Z"; },
    (record) => { record.signOff.date = "2000-01-01T00:00:00Z"; },
    (record) => { record.recordedAt = new Date(fixture.now + 100000).toISOString(); },
  ], "STALE_RECORD");
  await mutate(fixture, "release-fr1", [
    (record) => { record.matrixVersion++; },
    (record) => { record.evaluatorVersion = "unsupported"; },
  ], "UNSUPPORTED_VERSION");
  await mutate(fixture, "release-fr1", [
    (record) => { record.artifactDigest = "0".repeat(64); },
    (record) => { record.sourceDigest = "0".repeat(64); },
    (record) => { record.runId = "22222222-2222-2222-2222-222222222222"; },
  ], "RECORD_BINDING_MISMATCH");
  await mutate(fixture, "release-fr1", [(record) => { record.owner = "different"; }], "OWNER_SIGNOFF_MISMATCH");
  fixture.input.artifactDigest = "0".repeat(64);
  await fixture.saveInput();
  failed(await evaluate(fixture), "RELEASE_BINDING_MISMATCH");
  fixture.input.artifactDigest = fixture.manifest.artifact.digest;
  fixture.input.matrixVersion++;
  await fixture.saveInput();
  failed(await evaluate(fixture), "UNSUPPORTED_VERSION");
});

test("release reference hardware fixture operation inventory and exact performance boundaries are enforced", async (context) => {
  const fixture = await createReleaseFixture(context);
  assert.equal((await evaluate(fixture)).satisfied, true);
  const changes = [
    (record) => { record.details.hardware.logicalCpus = 3; },
    (record) => { record.details.hardware.logicalCpus = 4.5; },
    (record) => { record.details.hardware.ramBytes--; },
    (record) => { delete record.details.hardware.model; },
    (record) => { delete record.details.measurementMethod; },
    (record) => { record.details.measurementMethod = ""; },
    (record) => { record.details.measurementMethod = " \t\n"; },
    (record) => { record.details.measurementMethod = 123; },
    (record) => { record.details.fixture.characters = 19999; },
    (record) => { record.details.fixture.queryEntries = 250; },
    (record) => { record.details.initialParseMs = 1000.000001; },
    (record) => { record.details.initialParseMs = -1; },
    ...fixture.contract.operations.flatMap((operation) => [
      (record) => { record.details.operationsMs[operation] = 100.000001; },
      (record) => { delete record.details.operationsMs[operation]; },
    ]),
  ];
  await mutate(fixture, "release-performance-reference", changes, "PERFORMANCE_INVALID");
});

test("release browser baseline latest two majors and every native manual check are enforced", async (context) => {
  const fixture = await createReleaseFixture(context);
  await mutate(fixture, "release-version-baseline", [
    (record) => { delete record.details.latestMajors.firefox; },
    (record) => { record.details.latestMajors.chrome = 1; },
    (record) => { record.details.checkedAt = "2000-01-01T00:00:00Z"; },
  ], "BROWSER_BASELINE_INVALID");
  await mutate(fixture, "release-browser-edge-previous", [
    (record) => { record.testedVersions[0].version = "198.0.0"; },
    (record) => { record.testedVersions[0].browser = "chrome"; },
    (record) => { record.details.releasedBrowser = false; },
  ], "BROWSER_OBSERVATION_INVALID");
  await mutate(fixture, "release-manual-ios-safari-voiceover-latest", [
    (record) => { record.testedVersions[0].os = "macos"; },
    (record) => { record.testedVersions[0].at = "nvda"; },
    (record) => { delete record.testedVersions[0].atVersion; },
    ...fixture.contract.manualChecks.map((check) => (record) => { record.details[check] = false; }),
  ], "MANUAL_OBSERVATION_INVALID");
  await mutate(fixture, "release-keyboard-windows", [
    (record) => { record.testedVersions[0].os = "macos"; },
    (record) => { record.details["keyboard-only"] = false; },
  ], "KEYBOARD_OBSERVATION_INVALID");
});

test("release approved deferrals block release and story gates but never change MVP", async (context) => {
  const fixture = await createReleaseFixture(context);
  const id = "release-manual-android-chrome-talkback-previous";
  fixture.records.get(id).result = "deferred";
  await fixture.saveRecord(id);
  failed(await evaluate(fixture), "RECORD_NOT_PASS", id);
  failed(await evaluate(fixture, { scope: "3.5" }), "RECORD_NOT_PASS", id);
  assert.equal((await evaluate(fixture, { scope: "mvp" })).satisfied, true);
});

test("release UJ-1 requires all unique representative signed participants and complete outcomes", async (context) => {
  const fixture = await createReleaseFixture(context);
  await mutate(fixture, "release-uj-1-study", [
    (record) => { record.details.participants.pop(); },
    (record) => { record.details.roster.push("missing-participant"); },
    (record) => { record.details.roster[1] = record.details.roster[0]; },
    (record) => { record.details.participants[1].id = record.details.participants[0].id; },
    (record) => { record.details.participants[0].representativeDeveloper = false; },
    (record) => { delete record.details.participants[0].signOff; },
    (record) => { record.details.participants[0].signOff.approval = "pending"; },
    (record) => { record.details.participants[0].signOff.attestor = "different-participant"; },
    (record) => { delete record.details.participants[0].assistance; },
    (record) => { delete record.details.participants[0].steps.copy; },
    (record) => { record.details.participants[0].steps.copy.completed = false; },
    (record) => { record.details.unassistedCompleters = 4; },
    (record) => { record.details.totalParticipants = 6; },
  ], "STUDY_INVALID");
});

test("release UJ-1 population bounds assistance denominator and unrounded 90 percent ratio are exact", async (context) => {
  const fixture = await createReleaseFixture(context);
  const id = "release-uj-1-study";
  const original = structuredClone(fixture.records.get(id));
  for (const count of [4, 5, 6, 7, 8, 9]) {
    const record = structuredClone(original);
    record.details.roster = Array.from({ length: count }, (_, index) => `participant-${index}`);
    record.details.participants = record.details.roster.map((id) => ({
      ...structuredClone(original.details.participants[0]), id,
      signOff: { ...original.details.participants[0].signOff, attestor: id },
    }));
    record.details.totalParticipants = count;
    record.details.unassistedCompleters = count;
    fixture.records.set(id, record);
    await fixture.saveRecord(id);
    if (count < 5 || count > 8) failed(await evaluate(fixture), "STUDY_INVALID", id);
    else {
      assert.equal((await evaluate(fixture)).satisfied, true);
      record.details.participants[0].assistance = "provided";
      record.details.participants[0].steps.copy.assisted = true;
      record.details.unassistedCompleters = count - 1;
      await fixture.saveRecord(id);
      failed(await evaluate(fixture), "STUDY_INVALID", id);
      record.details.participants[0].assistance = "none";
      record.details.unassistedCompleters = count;
      await fixture.saveRecord(id);
      failed(await evaluate(fixture), "STUDY_INVALID", id);
      record.details.participants[0].steps.copy.assisted = false;
      record.details.participants[0].steps.copy.completed = false;
      record.details.participants[0].completed = false;
      record.details.unassistedCompleters = count - 1;
      await fixture.saveRecord(id);
      failed(await evaluate(fixture), "STUDY_INVALID", id);
    }
  }
});

test("release critical failures in every evidence channel override contradictory passing summaries", async (context) => {
  const fixture = await createReleaseFixture(context);
  for (const id of [
    "release-fr1", "release-browser-chrome-latest", "release-performance-reference",
    "release-uj-1-study", "release-privacy-lifecycle", "release-delivery-promotion",
  ]) {
    for (const kind of fixture.contract.criticalKinds) {
      const record = fixture.records.get(id);
      record.criticalFailures[kind] = 1;
      await fixture.saveRecord(id);
      const result = await evaluate(fixture);
      failed(result, "CRITICAL_FAILURE", id);
      failed(result, "CRITICAL_SUMMARY_CONTRADICTION", "release-critical-summary");
      failed(await evaluate(fixture, { scope: "3.5" }), "CRITICAL_FAILURE", id);
      record.criticalFailures[kind] = 0;
      await fixture.saveRecord(id);
    }
  }
  await mutate(fixture, "release-critical-summary", [
    (record) => { record.details.totals["stale-copy"] = 1; },
    (record) => { record.details.channels.pop(); },
  ], "CRITICAL_SUMMARY_CONTRADICTION");
});

test("release privacy lifecycle Clipboard sources and prohibited sink observations are mandatory", async (context) => {
  const fixture = await createReleaseFixture(context);
  await mutate(fixture, "release-privacy-lifecycle", [
    ...fixture.contract.privacyChecks.flatMap((check) => [
      (record) => { record.details.checks[check] = false; },
      (record) => { delete record.details.checks[check]; },
    ]),
    (record) => { record.details.clipboardSources.pop(); },
  ], "PRIVACY_LIFECYCLE_INVALID");
});

test("release delivery rejects different bytes headers insecure transport caching rebuild and non-atomic rollback", async (context) => {
  const fixture = await createReleaseFixture(context);
  await mutate(fixture, "release-delivery-promotion", [
    (record) => { record.details.deliveredBundleDigest = "0".repeat(64); },
    (record) => { record.details.testedBundleDigest = "0".repeat(64); },
    (record) => { record.details.deliveredHeadersDigest = "0".repeat(64); },
    (record) => { record.details.testedHeadersDigest = "0".repeat(64); },
    (record) => { record.details.transport = "http"; },
    (record) => { record.details.htmlCacheControl = "immutable"; },
    (record) => { record.details.assets[0].cacheControl = "no-cache"; },
    (record) => { record.details.assets[0].hash = "0".repeat(64); },
    (record) => { record.details.assets = []; },
    (record) => { record.details.promotion = "rebuild"; },
    (record) => { record.details.rollback.atomic = false; },
    (record) => { record.details.rollback.observed = false; },
    (record) => { record.details.rollback.restoredHeadersHash = "0".repeat(64); },
    (record) => { record.details.rollback.priorArtifact.path = "src/core/session/session.test.ts"; },
  ], "DELIVERY_PROOF_INVALID");
  const prior = fixture.records.get("release-delivery-promotion").details.rollback.priorArtifact;
  await writeFile(resolve(fixture.root, prior.path), "tampered");
  failed(await evaluate(fixture), "DELIVERY_PROOF_INVALID", "release-delivery-promotion");
});

test("release rejects changed source build delivery and CSP even when external records claim pass", async (context) => {
  const fixture = await createReleaseFixture(context);
  await writeFile(resolve(fixture.root, "dist/index.html"), "modified build");
  failed(await evaluate(fixture), "EXECUTION_PROOF_INVALID");
  const sourceFixture = await createReleaseFixture(context);
  const path = resolve(sourceFixture.root, "evidence/release-contract.json");
  await writeFile(path, `${await readFile(path, "utf8")}\n`);
  failed(await evaluate(sourceFixture), "EXECUTION_PROOF_INVALID");
  const cspFixture = await createReleaseFixture(context);
  const deliveryPath = resolve(cspFixture.root, "deployment/static-delivery.json");
  const policy = JSON.parse(await readFile(deliveryPath, "utf8"));
  policy.headers["Content-Security-Policy"] = policy.headers["Content-Security-Policy"].replace("connect-src 'none'", "connect-src 'self'");
  await writeFile(deliveryPath, JSON.stringify(policy));
  failed(await evaluate(cspFixture), "EXECUTION_PROOF_INVALID");
});

test("release diagnostics never expose submitted content paths participants or raw exceptions", async (context) => {
  const fixture = await createReleaseFixture(context);
  const secret = "PRIVATE_SUBMITTED_URL_OR_PARTICIPANT";
  fixture.records.get("release-fr1").owner = secret;
  await fixture.saveRecord("release-fr1");
  const result = await evaluate(fixture);
  assert.ok(!JSON.stringify(result.diagnostics).includes(secret));
  const runCli = (args) => promisify(execFile)(process.execPath, [resolve(fixture.root, "evidence/validate.mjs"), ...args]);
  await assert.rejects(runCli(["--release", "--input", secret]), (error) =>
    error.code === 1 && !error.stdout && !error.stderr.includes(secret) && !error.stderr.includes("ENOENT"));
  await assert.rejects(runCli(["--story", secret]), (error) =>
    error.code === 1 && error.stderr === "UNSUPPORTED_SCOPE\n");
  fixture.manifest.sourceDigest = "0".repeat(64);
  await writeManifest(fixture.root, fixture.manifest);
  await assert.rejects(runCli([]), (error) => error.code === 1 && error.stderr === "EXECUTION_PROOF_INVALID\n");
});

test("release all numbered requirement families and reviewed versions are source bound", async (context) => {
  const fixture = await createReleaseFixture(context);
  for (const [prefix, count] of [["FR", 16], ["NFR", 17], ["UX-DR", 28], ["AG-", 3]]) {
    assert.equal(fixture.cells.filter((cell) => cell.kind === "requirement" && cell.requirements[0].startsWith(prefix)).length, count);
  }
  const before = await calculateSourceDigest(fixture.root);
  await writeFile(resolve(fixture.root, "evidence/release-contract.json"), "{}");
  assert.notEqual(await calculateSourceDigest(fixture.root), before);
});
