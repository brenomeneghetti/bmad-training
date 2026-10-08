import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { commands, engines, sourcePaths } from "./contracts.mjs";
import { identity, inventoryOf, normalizeReport } from "./adapters.mjs";

export const requiredCells = new Map([
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
      const expected = inventory.filter((item) => item.runner === execution.runner);
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
