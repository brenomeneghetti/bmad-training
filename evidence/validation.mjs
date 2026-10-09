import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { commands, engines, sourcePaths } from "./contracts.mjs";
import { identity, inventoryOf, normalizeReport } from "./adapters.mjs";

export const requiredCells = new Map([
  ["story-4-1-dark-foundation", "4.1"],
  ["story-4-1-contextual-actions", "4.1"],
  ["story-4-1-accessible-reflow", "4.1"],
  ["story-4-1-private-capacity", "4.1"],
  ["story-3-5-scheduling-overflow", "3.5"],
  ["story-3-5-validation-repeat", "3.5"],
  ["story-3-5-independent-channels", "3.5"],
  ["story-3-5-private-capacity", "3.5"],
  ["story-1-1-static-foundation", "1.1"],
  ["story-1-2-supported-intake", "1.2"],
  ["story-1-3-lossless-pieces", "1.3"],
  ["story-1-4-idn-forms", "1.4"],
  ["story-1-5-complete-structured-view", "1.5"],
  ["story-1-6-find-and-clear-managed-pieces", "1.6"],
  ["story-2-1-fr6-exact-structured-editing", "2.1"],
  ["story-2-1-ag1-component-codec", "2.1"],
  ["story-2-1-accessibility", "2.1"],
  ["story-2-1-privacy", "2.1"],
  ["story-2-1-performance", "2.1"],
  ["story-2-2-domain-conversion", "2.2"],
  ["story-2-2-host-only-exactness", "2.2"],
  ["story-2-2-accessibility-status", "2.2"],
  ["story-2-2-privacy", "2.2"],
  ["story-2-2-capacity", "2.2"],
  ["story-2-3-identity-exact-removal", "2.3"],
  ["story-2-3-guard-drafts-history", "2.3"],
  ["story-2-3-accessibility-focus", "2.3"],
  ["story-2-3-privacy-capacity", "2.3"],
  ["story-2-4-identity-exact-append", "2.4"],
  ["story-2-4-atomic-history-guard", "2.4"],
  ["story-2-4-accessibility-focus-skip-link", "2.4"],
  ["story-2-4-privacy-capacity", "2.4"],
  ["story-2-5-identity-adjacent-swap", "2.5"],
  ["story-2-5-atomic-history-guard", "2.5"],
  ["story-2-5-accessibility-focus-boundary", "2.5"],
  ["story-2-5-privacy-capacity", "2.5"],
  ["story-2-6-reconciled-identity-lcs", "2.6"],
  ["story-2-6-focus-session-history-squash", "2.6"],
  ["story-2-6-ime-safe-keyboard-loosened-gating", "2.6"],
  ["story-2-6-privacy-capacity", "2.6"],
  ["story-2-7-invalid-draft-last-valid-source", "2.7"],
  ["story-2-7-reversible-chronology", "2.7"],
  ["story-2-7-feedback-focus-races", "2.7"],
  ["story-2-7-privacy-capacity", "2.7"],
  ["story-3-1-exact-history", "3.1"],
  ["story-3-1-guard-draft", "3.1"],
  ["story-3-1-accessible-action", "3.1"],
  ["story-3-1-privacy-capacity", "3.1"],
  ["story-3-2-input-arbiter", "3.2"],
  ["story-3-2-logical-focus", "3.2"],
  ["story-3-2-draft-filter", "3.2"],
  ["story-3-2-serial-effects", "3.2"],
  ["story-3-3-exact-source", "3.3"],
  ["story-3-3-stale-serial", "3.3"],
  ["story-3-3-typed-failure", "3.3"],
  ["story-3-3-private-capacity", "3.3"],
  ["story-3-4-exact-recovery", "3.4"],
  ["story-3-4-recovery-lifecycle", "3.4"],
  ["story-3-4-race-focus", "3.4"],
  ["story-3-4-private-capacity", "3.4"],
]);

const requiredCsp = new Map([
  ["default-src", "'self'"],
  ["script-src", "'self'"],
  ["style-src", "'self'"],
  ["img-src", "'self' data:"],
  ["connect-src", "'none'"],
  ["object-src", "'none'"],
  ["base-uri", "'none'"],
  ["form-action", "'none'"],
  ["frame-ancestors", "'none'"],
]);

export const safePath = async (root, path, kind = "file") => {
  if (isAbsolute(path) || path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`Path escapes repository or is not canonical: ${path}`);
  }
  let current = resolve(root);
  for (const [index, part] of path.split("/").entries()) {
    current = resolve(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
      throw new Error(`Unsafe symlink/special-file path: ${path}`);
    }
    if (index < path.split("/").length - 1 && !stat.isDirectory()) {
      throw new Error(`Non-directory ancestor: ${path}`);
    }
    if (index === path.split("/").length - 1 && kind !== "any" && (kind === "directory" ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error(`Wrong path type: ${path}`);
    }
  }
  return current;
};

export const readJson = async (root, path) =>
  JSON.parse(await readFile(await safePath(root, path), "utf8"));
export const hashFile = async (root, path) =>
  createHash("sha256").update(await readFile(await safePath(root, path))).digest("hex");

export const parseCsp = (value) => {
  const directives = new Map();
  for (const part of value.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(" ");
    const name = separator < 0 ? trimmed : trimmed.slice(0, separator);
    const sources = separator < 0 ? "" : trimmed.slice(separator + 1).trim();
    if (directives.has(name)) {
      throw new Error(`Delivery CSP repeats ${name}.`);
    }
    directives.set(name, sources);
  }
  return directives;
};

export const calculateArtifactDigest = async (root, artifact) => {
  if (artifact.path !== "dist" || artifact.delivery !== "deployment/static-delivery.json") {
    throw new Error("Artifact paths violate the pinned contract.");
  }
  return calculateTreeDigest(root, [artifact.path, artifact.delivery]);
};

export const calculateTreeDigest = async (root, paths) => {
  const digest = createHash("sha256");
  const add = async (path) => {
    // Inspect every ancestor before traversing or reading bytes.
    const absolute = resolve(root, path);
    const fromRoot = relative(root, absolute);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(path)) {
      throw new Error(`Path escapes repository: ${path}`);
    }
    const stat = await lstat(await safePath(root, path, "any"));
    digest.update(`${path}\0${stat.isDirectory() ? "directory" : "file"}\0`);
    if (stat.isDirectory()) {
      for (const entry of (await readdir(absolute)).sort()) {
        await add(`${path}/${entry}`);
      }
    } else {
      const bytes = await readFile(await safePath(root, path));
      digest.update(`${bytes.length}\0`);
      digest.update(bytes);
      digest.update("\0");
    }
  };
  for (const path of [...paths].sort()) await add(path);
  return digest.digest("hex");
};

export const calculateSourceDigest = async (root) => {
  const optionalInputs = (await readdir(root)).filter((name) => name === "public" || name === ".env" || name.startsWith(".env."));
  return calculateTreeDigest(root, [...sourcePaths, ...optionalInputs]);
};

export const validateEvidence = async (root, manifestPath = "evidence/manifest.json") => {
  const manifest = await readJson(root, manifestPath);
  const schema = await readJson(root, "evidence/schema.json");
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  if (!ajv.validate(schema, manifest)) {
    throw new Error(`Invalid evidence manifest: ${ajv.errorsText(ajv.errors)}`);
  }

  if (manifest.sourceDigest !== await calculateSourceDigest(root)) {
    throw new Error("Source digest mismatch: stale/tampered inputs.");
  }
  const inventory = await readJson(root, "evidence/inventory.json");
  const coverage = await readJson(root, "evidence/coverage.json");
  if (!Array.isArray(inventory) || !inventory.length) throw new Error("Empty/malformed test inventory.");
  const inventoryKeys = new Set();
  for (const item of inventory) {
    const key = `${item.runner}:${identity(item)}`;
    if (!["vitest", "node", "playwright"].includes(item.runner) || !Number.isSafeInteger(item.multiplicity) ||
      item.multiplicity < 1 || !item.title || inventoryKeys.has(key) ||
      (item.runner === "playwright" ? !engines.includes(item.project) : item.project !== item.runner)) {
      throw new Error("Invalid/duplicate exact inventory identity.");
    }
    inventoryKeys.add(key);
    await safePath(root, item.file);
  }
  const executions = new Map();
  if (manifest.executions.length !== Object.keys(commands).length) throw new Error("Incomplete command inventory.");
  for (const execution of manifest.executions) {
    if (!commands[execution.runner] || executions.has(execution.runner) ||
      JSON.stringify(execution.argv) !== JSON.stringify(commands[execution.runner])) {
      throw new Error(`Wrong/duplicate command argv: ${execution.runner}`);
    }
    if (execution.exitCode !== 0 || execution.signal !== null) throw new Error(`Nonpassing command: ${execution.runner}`);
    if (execution.sourceDigest !== manifest.sourceDigest || execution.artifactDigest !== manifest.artifact.digest) {
      throw new Error(`Command identity mismatch: ${execution.runner}`);
    }
    for (const object of [execution.log, execution.report].filter(Boolean)) {
      if (!object.path.startsWith(`evidence/runs/${manifest.runId}/`)) throw new Error("Report belongs to another run.");
      if (object.hash !== await hashFile(root, object.path)) throw new Error(`Report/log hash mismatch: ${object.path}`);
    }
    const diagnostic = await readFile(await safePath(root, execution.log.path), "utf8");
    const prefix = `argv: ${JSON.stringify(execution.argv)}\nexitCode: 0\nsignal: null\n`;
    if (!diagnostic.startsWith(prefix)) throw new Error(`Command diagnostic/outcome mismatch: ${execution.runner}`);
    if (["vitest", "node", "playwright"].includes(execution.runner)) {
      if (!execution.report) throw new Error(`Missing structured report: ${execution.runner}`);
      const report = await readJson(root, execution.report.path);
      if (execution.runner === "playwright" && report.config?.version !== manifest.toolVersions.playwright) {
        throw new Error("Playwright observed report version mismatch.");
      }
      const tests = normalizeReport(execution.checkoutRoot, execution.runner, report);
      if (!tests.length || tests.some((item) => item.status !== "passed")) {
        throw new Error(`Missing/skipped/nonpassing tests: ${execution.runner}`);
      }
      const expected = inventory.filter((item) => item.runner === execution.runner)
        .sort((a, b) => identity(a).localeCompare(identity(b)));
      if (JSON.stringify(inventoryOf(execution.runner, tests)) !== JSON.stringify(expected)) {
        throw new Error(`Exact inventory/multiplicity mismatch: ${execution.runner}`);
      }
      const engineVersions = new Map();
      for (const item of tests) {
        if (execution.runner === "playwright" && (!engines.includes(item.project) ||
          !item.engine?.startsWith(`${item.project}:`) || !item.engine.split(":")[1])) {
          throw new Error(`Wrong/missing observed engine: ${item.project}`);
        }
        if (execution.runner === "playwright") {
          if (engineVersions.has(item.project) && engineVersions.get(item.project) !== item.engine) throw new Error("Inconsistent observed engine versions.");
          engineVersions.set(item.project, item.engine);
        }
      }
      executions.set(execution.runner, tests);
    } else executions.set(execution.runner, []);
  }
  if (inventory.some((item) => !executions.has(item.runner))) throw new Error("Unmapped inventory runner.");
  const remainingCells = new Map(requiredCells);
  for (const cell of coverage) {
    if (remainingCells.get(cell.id) !== cell.story) {
      throw new Error(`Unexpected mandatory evidence cell: ${cell.id}`);
    }
    remainingCells.delete(cell.id);
    if (!cell.tests?.length || !cell.tests.some((item) => item.runner === "playwright")) {
      throw new Error(`Cell lacks executed browser evidence: ${cell.id}`);
    }
    for (const mapping of cell.tests) {
      if (!executions.get(mapping.runner)?.some((item) => identity(item) === identity(mapping))) {
        throw new Error(`Unmapped test identity in ${cell.id}: ${identity(mapping)}`);
      }
    }
    for (const engine of engines) {
      if (!cell.tests.some((item) => item.runner === "playwright" && item.project === engine)) {
        throw new Error(`Cell lacks ${engine} evidence: ${cell.id}`);
      }
    }
  }
  if (remainingCells.size > 0) {
    throw new Error(
      `Missing mandatory evidence cells: ${[...remainingCells.keys()].join(", ")}`,
    );
  }

  const delivery = await readJson(root, manifest.artifact.delivery);
  const directives = parseCsp(
    delivery.headers?.["Content-Security-Policy"] ?? "",
  );
  for (const [name, sources] of requiredCsp) {
    if (directives.get(name) !== sources) {
      throw new Error(`Delivery CSP has an invalid ${name} directive.`);
    }
  }

  const artifactDigest = await calculateArtifactDigest(root, manifest.artifact);
  if (artifactDigest !== manifest.artifact.digest) {
    throw new Error(
      `Artifact digest mismatch: expected ${manifest.artifact.digest}, received ${artifactDigest}.`,
    );
  }

  if (!manifest.toolVersions.node || !manifest.toolVersions.pnpm || !manifest.toolVersions.vitest || !manifest.toolVersions.playwright) {
    throw new Error("Missing observed tool versions.");
  }
  const packages = await readJson(root, "package.json");
  const nodeRange = packages.engines?.node?.match(/^\^(\d+)\.0\.0 \|\| >=(\d+)\.0\.0$/);
  const nodeMajor = Number(manifest.toolVersions.node.split(".")[0]);
  if (!nodeRange || (nodeMajor !== Number(nodeRange[1]) && nodeMajor < Number(nodeRange[2]))) {
    throw new Error("Observed Node version violates the supported package engine range.");
  }
  for (const tool of ["vitest", "playwright"]) {
    const expected = packages.devDependencies[tool === "playwright" ? "@playwright/test" : tool];
    if (manifest.toolVersions[tool] !== expected) throw new Error(`Observed ${tool} version violates package pin.`);
  }
  if (manifest.toolVersions.pnpm !== packages.packageManager.match(/pnpm@([^+]+)/)?.[1]) throw new Error("Observed pnpm version violates package pin.");
  const observed = new Set();
  for (const observation of manifest.observations) {
    if (observed.has(observation.tool) || !observation.path.startsWith(`evidence/runs/${manifest.runId}/`) ||
      observation.hash !== await hashFile(root, observation.path)) throw new Error("Version observation hash/identity mismatch.");
    observed.add(observation.tool);
    const result = await readJson(root, observation.path);
    const argv = observation.tool === "node" ? ["node", "--version"] :
      observation.tool === "pnpm" ? ["pnpm", "--version"] : ["pnpm", "exec", observation.tool, "--version"];
    if (JSON.stringify(result.argv) !== JSON.stringify(argv) || result.exitCode !== 0 || result.signal !== null ||
      result.stdout.match(/\d+\.\d+\.\d+/)?.[0] !== manifest.toolVersions[observation.tool]) {
      throw new Error(`Wrong observed version command/outcome: ${observation.tool}`);
    }
  }
  return { artifactDigest, cellCount: coverage.length, testCount: inventory.reduce((total, item) => total + item.multiplicity, 0) };
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const digestBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const exactKeys = (value, keys) => value && typeof value === "object" && !Array.isArray(value) &&
  same(Object.keys(value).sort(), [...keys].sort());
const allChecks = (value, keys) => exactKeys(value, keys) && keys.every((key) => value[key] === true);
const channelFor = {
  requirement: "manual", baseline: "browser", browser: "browser", manual: "manual",
  keyboard: "manual", performance: "performance", study: "study", critical: "summary",
  privacy: "privacy", delivery: "delivery",
};

// Numbered requirements are conservatively shared, not inferred from test counts.
// The reviewed contract can narrow mappings in a later matrix version.
export function releaseCells(contract) {
  const cells = contract.requirements.map((requirement) => ({
    id: `release-${requirement.toLowerCase()}`, kind: "requirement", requirements: [requirement],
    stories: contract.stories, ownerRole: "requirement-owner",
  }));
  for (const browser of contract.browsers) for (const slot of contract.majorSlots) cells.push({
    id: `release-browser-${browser}-${slot}`, kind: "browser", browser, slot,
    requirements: contract.requirements, stories: contract.stories, ownerRole: "browser-owner",
  });
  for (const platform of contract.platforms) for (const slot of contract.majorSlots) cells.push({
    ...platform, id: `release-manual-${platform.id}-${slot}`, kind: "manual", slot,
    requirements: contract.requirements, stories: contract.stories, ownerRole: "accessibility-owner",
  });
  for (const cell of contract.specialCells) cells.push({
    ...cell, requirements: contract.requirements,
    stories: cell.scope === "gate" ? ["3.6"] : contract.stories,
  });
  return cells.map((cell) => ({ ...cell, fixture: `${cell.id}-v${contract.matrixVersion}` }));
}

function fresh(date, earliest, now, days) {
  const time = Date.parse(date);
  return Number.isFinite(time) && time >= Date.parse(earliest) && time <= now &&
    now - time <= days * 86400000;
}

function validBaseline(details, contract) {
  if (!exactKeys(details, ["latestMajors", "checkedAt"]) ||
    !exactKeys(details.latestMajors, contract.browsers)) return false;
  return contract.browsers.every((browser) =>
    Number.isSafeInteger(details.latestMajors[browser]) && details.latestMajors[browser] >= 2);
}

function supportedVersion(version, baseline) {
  if (!baseline) return false;
  const latest = baseline.details.latestMajors[version.browser];
  const major = Number(version.version.split(".")[0]);
  return major === latest || major === latest - 1;
}

function exactTarget(record, cell, baseline) {
  const versions = record.testedVersions;
  if (versions.length !== 1 || !baseline) return false;
  const target = versions[0];
  const major = baseline.details.latestMajors[cell.browser] - (cell.slot === "previous" ? 1 : 0);
  return target.browser === cell.browser && Number(target.version.split(".")[0]) === major &&
    (!cell.os || target.os === cell.os) && (!cell.at || (target.at === cell.at && Boolean(target.atVersion)));
}

function validPerformance(details, contract) {
  if (!exactKeys(details, ["hardware", "fixture", "measurementMethod", "initialParseMs", "operationsMs"]) ||
    !exactKeys(details.hardware, ["logicalCpus", "ramBytes", "model"]) ||
    !exactKeys(details.fixture, ["characters", "queryEntries"]) ||
    !exactKeys(details.operationsMs, contract.operations)) return false;
  return Number.isSafeInteger(details.hardware.logicalCpus) && details.hardware.logicalCpus >= 4 &&
    Number.isSafeInteger(details.hardware.ramBytes) && details.hardware.ramBytes >= 8_000_000_000 &&
    typeof details.hardware.model === "string" && details.hardware.model.length > 0 &&
    details.fixture.characters === 20000 && details.fixture.queryEntries === 260 &&
    typeof details.measurementMethod === "string" && details.measurementMethod.trim().length > 0 &&
    Number.isFinite(details.initialParseMs) && details.initialParseMs >= 0 && details.initialParseMs <= 1000 &&
    contract.operations.every((operation) => Number.isFinite(details.operationsMs[operation]) &&
      details.operationsMs[operation] >= 0 && details.operationsMs[operation] <= 100);
}

function validStudy(details, contract, validateSignOff, earliest, now) {
  if (!exactKeys(details, ["journey", "roster", "participants", "unassistedCompleters", "totalParticipants"]) ||
    details.journey !== "UJ-1" || !Array.isArray(details.roster) || !Array.isArray(details.participants)) return false;
  const count = details.roster.length;
  if (count < 5 || count > 8 || new Set(details.roster).size !== count ||
    details.roster.some((id) => typeof id !== "string" || !id) || details.participants.length !== count) return false;
  const seen = new Set();
  let successes = 0;
  for (const participant of details.participants) {
    if (!exactKeys(participant, ["id", "representativeDeveloper", "completed", "assistance", "steps", "signOff"]) ||
      !details.roster.includes(participant.id) || seen.has(participant.id) ||
      participant.representativeDeveloper !== true || typeof participant.completed !== "boolean" ||
      !["none", "provided"].includes(participant.assistance) ||
      !exactKeys(participant.steps, contract.journeySteps) || !validateSignOff(participant.signOff) ||
      participant.signOff.attestor !== participant.id ||
      !fresh(participant.signOff.date, earliest, now, contract.maxAgeDays)) return false;
    seen.add(participant.id);
    const steps = contract.journeySteps.map((step) => participant.steps[step]);
    if (steps.some((step) => !exactKeys(step, ["completed", "assisted"]) ||
      typeof step.completed !== "boolean" || typeof step.assisted !== "boolean")) return false;
    if (participant.completed !== steps.every((step) => step.completed) ||
      (steps.some((step) => step.assisted) && participant.assistance !== "provided")) return false;
    if (participant.completed && participant.assistance === "none" && steps.every((step) => !step.assisted)) successes++;
  }
  return details.totalParticipants === count && details.unassistedCompleters === successes &&
    successes * 10 >= count * 9;
}

async function attachment(root, reference) {
  if (!exactKeys(reference, ["path", "hash"]) ||
    typeof reference.path !== "string" || !/^evidence\/attachments\/[a-f0-9]{64}\.[a-z0-9]+$/.test(reference.path) ||
    !/^[a-f0-9]{64}$/.test(reference.hash) ||
    reference.path.split("/").at(-1).split(".")[0] !== reference.hash) return false;
  return reference.hash === await hashFile(root, reference.path);
}

async function validDelivery(root, details, manifest) {
  const keys = ["transport", "testedBundleDigest", "deliveredBundleDigest", "testedHeadersDigest",
    "deliveredHeadersDigest", "deliveryDigest", "htmlCacheControl", "assets", "promotion", "rollback"];
  if (!exactKeys(details, keys)) return false;
  const policy = await readJson(root, manifest.artifact.delivery);
  const headersDigest = digestBytes(JSON.stringify(policy.headers));
  const bundleDigest = await calculateTreeDigest(root, ["dist"]);
  if (details.transport !== "https" || policy.transport !== "https" ||
    policy.promotion !== "copy-tested-artifact" || policy.rollback !== "restore-prior-artifact-and-headers" ||
    policy.authorization?.rebuild !== false || policy.authorization?.atomicArtifactAndHeaders !== true ||
    policy.authorization?.adapter !== null || policy.authorization?.schemaVersion !== 1 ||
    policy.authorization?.contract !== "evidence/release-contract.json" ||
    policy.authorization?.objects !== "evidence/authorizations/<sha256>.json" ||
    policy.cache?.["index.html"] !== "no-cache" ||
    policy.cache?.["assets/*"] !== "public, max-age=31536000, immutable" ||
    details.testedBundleDigest !== bundleDigest || details.deliveredBundleDigest !== bundleDigest ||
    details.testedHeadersDigest !== headersDigest || details.deliveredHeadersDigest !== headersDigest ||
    details.deliveryDigest !== await hashFile(root, manifest.artifact.delivery) ||
    details.htmlCacheControl !== "no-cache" || details.promotion !== "identical-tested-bytes-no-rebuild" ||
    !Array.isArray(details.assets) || !details.assets.length) return false;
  const files = [];
  const collect = async (path) => {
    for (const entry of await readdir(await safePath(root, path, "directory"), { withFileTypes: true })) {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) await collect(child);
      else { await safePath(root, child); files.push(child); }
    }
  };
  await collect("dist");
  const expected = files.filter((path) => path !== "dist/index.html").sort();
  if (!files.includes("dist/index.html") ||
    !same(details.assets.map((asset) => asset.path).sort(), expected)) return false;
  for (const asset of details.assets) {
    if (!exactKeys(asset, ["path", "hash", "cacheControl"]) ||
      !/^dist\/assets\/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/.test(asset.path) ||
      asset.hash !== await hashFile(root, asset.path) ||
      asset.cacheControl !== "public, max-age=31536000, immutable") return false;
  }
  const rollback = details.rollback;
  return exactKeys(rollback, ["priorArtifact", "priorHeaders", "restoredArtifactHash", "restoredHeadersHash", "atomic", "observed"]) &&
    rollback.atomic === true && rollback.observed === true &&
    await attachment(root, rollback.priorArtifact) && await attachment(root, rollback.priorHeaders) &&
    rollback.restoredArtifactHash === rollback.priorArtifact.hash &&
    rollback.restoredHeadersHash === rollback.priorHeaders.hash;
}

export async function evaluateGate(root, {
  scope = "release", inputPath = "evidence/release-evidence.json",
  manifestPath = "evidence/manifest.json", now = Date.now(),
} = {}) {
  const diagnostics = [];
  const fail = (code, cellId = null) => {
    if (!diagnostics.some((item) => item.code === code && item.cellId === cellId)) diagnostics.push({ code, cellId });
  };
  let execution;
  try { execution = await validateEvidence(root, manifestPath); }
  catch { fail("EXECUTION_PROOF_INVALID"); }
  if (scope === "mvp") return { scope, satisfied: !diagnostics.length, releaseEligible: false, diagnostics, execution };
  let manifest, manifestDigest, schema, contract, cells;
  try {
    const manifestBytes = await readFile(await safePath(root, manifestPath));
    manifest = JSON.parse(manifestBytes);
    manifestDigest = digestBytes(manifestBytes);
    schema = await readJson(root, "evidence/schema.json");
    contract = await readJson(root, "evidence/release-contract.json");
    cells = releaseCells(contract);
  } catch {
    fail("GATE_INPUT_INVALID");
    return { scope: "invalid", satisfied: false, releaseEligible: false, diagnostics, authorization: null };
  }
  if (scope !== "release" && !contract.stories.includes(scope)) {
    fail("UNSUPPORTED_SCOPE");
    return { scope: "invalid", satisfied: false, releaseEligible: false, diagnostics, authorization: null };
  }
  const selected = cells.filter((cell) => scope === "release" || cell.stories.includes(scope));
  const byId = new Map(cells.map((cell) => [cell.id, cell]));
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const compile = (name) => ajv.compile({ $ref: `#/$defs/${name}`, $defs: schema.$defs });
  const validateInput = compile("releaseEvidence");
  const validateRecord = compile("releaseRecord");
  const validateSignOff = compile("signOff");
  const validateAuthorization = compile("promotionAuthorization");
  let input, inputDigest;
  try {
    const bytes = await readFile(await safePath(root, inputPath));
    input = JSON.parse(bytes);
    inputDigest = digestBytes(bytes);
    if (!validateInput(input)) { fail("RELEASE_INPUT_MALFORMED"); input = null; }
  } catch { fail("RELEASE_INPUT_MISSING_OR_INVALID"); }
  if (input && (input.matrixVersion !== contract.matrixVersion || input.evaluatorVersion !== contract.evaluatorVersion)) fail("UNSUPPORTED_VERSION");
  if (input && (input.artifactDigest !== manifest.artifact.digest ||
    input.sourceDigest !== manifest.sourceDigest || input.runId !== manifest.runId)) fail("RELEASE_BINDING_MISMATCH");
  const records = new Map();
  for (const reference of input?.records ?? []) {
    const cell = byId.get(reference.cellId);
    if (!cell) { fail("UNSUPPORTED_CELL"); continue; }
    if (records.has(cell.id)) { fail("DUPLICATE_RECORD", cell.id); continue; }
    records.set(cell.id, null);
    let record;
    try {
      const bytes = await readFile(await safePath(root, reference.path));
      if (reference.path.split("/").at(-1) !== `${reference.hash}.json` ||
        reference.hash !== digestBytes(bytes)) { fail("RECORD_INTEGRITY", cell.id); continue; }
      record = JSON.parse(bytes);
    } catch { fail("RECORD_INTEGRITY", cell.id); continue; }
    if (!validateRecord(record)) { fail("RECORD_MALFORMED", cell.id); continue; }
    if (record.cellId !== cell.id || record.kind !== cell.kind ||
      !same(record.requirements, cell.requirements) || !same(record.stories, cell.stories) ||
      record.fixture !== cell.fixture || record.ownerRole !== cell.ownerRole ||
      record.channel !== channelFor[cell.kind]) { fail("RECORD_MAPPING_MISMATCH", cell.id); continue; }
    if (record.matrixVersion !== contract.matrixVersion || record.evaluatorVersion !== contract.evaluatorVersion) fail("UNSUPPORTED_VERSION", cell.id);
    if (record.provenance !== input.provenance) fail("PROVENANCE_MISMATCH", cell.id);
    if (record.artifactDigest !== manifest.artifact.digest || record.sourceDigest !== manifest.sourceDigest ||
      record.runId !== manifest.runId) fail("RECORD_BINDING_MISMATCH", cell.id);
    if (!fresh(record.recordedAt, manifest.recordedAt, now, contract.maxAgeDays) ||
      !fresh(record.signOff.date, record.recordedAt, now, contract.maxAgeDays)) fail("STALE_RECORD", cell.id);
    if (record.signOff.attestor !== record.owner) fail("OWNER_SIGNOFF_MISMATCH", cell.id);
    if (selected.some((item) => item.id === cell.id) && record.result !== "pass") fail("RECORD_NOT_PASS", cell.id);
    if (contract.criticalKinds.some((kind) => record.criticalFailures[kind] !== 0)) fail("CRITICAL_FAILURE", cell.id);
    records.set(cell.id, record);
  }
  for (const cell of selected) if (!records.get(cell.id)) fail("REQUIRED_RECORD_MISSING", cell.id);
  const baseline = records.get("release-version-baseline");
  const baselineValid = baseline && validBaseline(baseline.details, contract) &&
    fresh(baseline.details.checkedAt, manifest.recordedAt, now, contract.baselineMaxAgeDays);
  if (baseline && !baselineValid) fail("BROWSER_BASELINE_INVALID", "release-version-baseline");
  for (const [id, record] of records) {
    if (!record) continue;
    const cell = byId.get(id);
    if (!baselineValid || record.testedVersions.some((version) => !supportedVersion(version, baseline))) {
      fail("TESTED_VERSION_UNSUPPORTED", id);
    }
    if (!selected.some((item) => item.id === id)) continue;
    const details = record.details;
    let valid = true, code = "RECORD_DETAILS_INVALID";
    try {
      switch (cell.kind) {
        case "requirement":
          valid = exactKeys(details, ["verified", "observation"]) && details.verified === true &&
            typeof details.observation === "string" && details.observation.length > 0;
          break;
        case "baseline": valid = baselineValid; code = "BROWSER_BASELINE_INVALID"; break;
        case "browser":
          valid = exactTarget(record, cell, baseline) && allChecks(details, ["releasedBrowser", "wholeJourney"]);
          code = "BROWSER_OBSERVATION_INVALID"; break;
        case "manual":
          valid = exactTarget(record, cell, baseline) && allChecks(details, contract.manualChecks);
          code = "MANUAL_OBSERVATION_INVALID"; break;
        case "keyboard":
          valid = record.testedVersions.every((version) => version.os === cell.os && version.at === "none") &&
            allChecks(details, ["keyboard-only", ...contract.manualChecks]);
          code = "KEYBOARD_OBSERVATION_INVALID"; break;
        case "performance": valid = validPerformance(details, contract); code = "PERFORMANCE_INVALID"; break;
        case "study":
          valid = validStudy(details, contract, validateSignOff, manifest.recordedAt, now);
          code = "STUDY_INVALID"; break;
        case "critical": {
          const others = [...records.values()].filter((item) => item && item !== record);
          valid = exactKeys(details, ["totals", "channels"]) && exactKeys(details.totals, contract.criticalKinds) &&
            same(details.channels, [...new Set(others.map((item) => item.channel))].sort()) &&
            contract.criticalKinds.every((kind) =>
              details.totals[kind] === others.reduce((sum, item) => sum + item.criticalFailures[kind], 0) &&
              details.totals[kind] === record.criticalFailures[kind]);
          code = "CRITICAL_SUMMARY_CONTRADICTION"; break;
        }
        case "privacy":
          valid = exactKeys(details, ["checks", "clipboardSources"]) &&
            allChecks(details.checks, contract.privacyChecks) && same(details.clipboardSources, contract.clipboardSources);
          code = "PRIVACY_LIFECYCLE_INVALID"; break;
        case "delivery": valid = await validDelivery(root, details, manifest); code = "DELIVERY_PROOF_INVALID"; break;
      }
    } catch { valid = false; }
    if (!valid) fail(code, id);
  }
  if (!diagnostics.length && scope === "release" && input.provenance === "observed") {
    try {
      await validateEvidence(root, manifestPath);
      if (await hashFile(root, manifestPath) !== manifestDigest ||
        await hashFile(root, inputPath) !== inputDigest) fail("PROOF_CHANGED_DURING_EVALUATION");
      for (const reference of input.records) {
        if (await hashFile(root, reference.path) !== reference.hash) fail("RECORD_INTEGRITY", reference.cellId);
      }
      if (!await validDelivery(root, records.get("release-delivery-promotion").details, manifest)) {
        fail("DELIVERY_PROOF_INVALID", "release-delivery-promotion");
      }
    } catch { fail("PROOF_CHANGED_DURING_EVALUATION"); }
  }
  const satisfied = diagnostics.length === 0;
  const releaseEligible = satisfied && scope === "release" && input.provenance === "observed";
  let authorization = null;
  if (releaseEligible) {
    const policy = await readJson(root, manifest.artifact.delivery);
    const body = {
      schemaVersion: 1, matrixVersion: contract.matrixVersion, evaluatorVersion: contract.evaluatorVersion,
      action: "promote-identical-tested-artifact-and-headers", rebuild: false,
      artifactDigest: manifest.artifact.digest, sourceDigest: manifest.sourceDigest, runId: manifest.runId,
      bundleDigest: await calculateTreeDigest(root, ["dist"]),
      headersDigest: digestBytes(JSON.stringify(policy.headers)),
      deliveryDigest: await hashFile(root, manifest.artifact.delivery),
      manifestDigest,
      contractDigest: await hashFile(root, "evidence/release-contract.json"),
      evidenceDigest: inputDigest,
      records: [...input.records].sort((a, b) => a.cellId.localeCompare(b.cellId)),
      transport: "https", htmlCacheControl: "no-cache", assetsCacheControl: "public, max-age=31536000, immutable",
      rollback: records.get("release-delivery-promotion").details.rollback,
      expiresAt: new Date(Math.min(...[...records.values()].flatMap((record) => [
        Date.parse(record.recordedAt) + contract.maxAgeDays * 86400000,
        Date.parse(record.signOff.date) + contract.maxAgeDays * 86400000,
      ]), ...records.get("release-uj-1-study").details.participants.map((participant) =>
        Date.parse(participant.signOff.date) + contract.maxAgeDays * 86400000),
      Date.parse(baseline.details.checkedAt) + contract.baselineMaxAgeDays * 86400000)).toISOString(),
    };
    if (!validateAuthorization(body)) {
      fail("AUTHORIZATION_CONTRACT_INVALID");
      return { scope, satisfied: false, releaseEligible: false, diagnostics, execution, authorization: null };
    }
    const bytes = `${JSON.stringify(body, null, 2)}\n`;
    const digest = digestBytes(bytes);
    authorization = { digest, path: `evidence/authorizations/${digest}.json`, bytes };
  }
  return {
    scope, satisfied, releaseEligible, diagnostics, execution,
    matrixVersion: contract.matrixVersion, evaluatorVersion: contract.evaluatorVersion,
    requiredCellCount: selected.length, provenance: input?.provenance ?? null, authorization,
  };
}
