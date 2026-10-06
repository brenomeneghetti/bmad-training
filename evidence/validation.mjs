import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const requiredCells = new Map([
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

const readJson = async (root, path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));

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
  const digest = createHash("sha256");
  const addTree = async (directory) => {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
      (left, right) => left.name.localeCompare(right.name),
    )) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await addTree(path);
      } else {
        digest.update(relative(root, path));
        digest.update("\0");
        digest.update(await readFile(path));
        digest.update("\0");
      }
    }
  };

  await addTree(resolve(root, artifact.path));
  const deliveryPath = resolve(root, artifact.delivery);
  digest.update(relative(root, deliveryPath));
  digest.update("\0");
  digest.update(await readFile(deliveryPath));
  return digest.digest("hex");
};

export const validateEvidence = async (root) => {
  const manifest = await readJson(root, "evidence/manifest.json");
  const schema = await readJson(root, "evidence/schema.json");
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  if (!ajv.validate(schema, manifest)) {
    throw new Error(`Invalid evidence manifest: ${ajv.errorsText(ajv.errors)}`);
  }

  const remainingCells = new Map(requiredCells);
  for (const cell of manifest.cells) {
    if (remainingCells.get(cell.id) !== cell.story) {
      throw new Error(`Unexpected mandatory evidence cell: ${cell.id}`);
    }
    remainingCells.delete(cell.id);
    for (const item of cell.evidence) {
      const path = resolve(root, item);
      const fromRoot = relative(root, path);
      if (
        fromRoot === ".." ||
        fromRoot.startsWith(`..${sep}`) ||
        isAbsolute(fromRoot)
      ) {
        throw new Error(`Evidence path escapes repository root: ${item}`);
      }
      await access(path);
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

  return { artifactDigest, cellCount: manifest.cells.length };
};
