import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = resolve(import.meta.dirname, "..");
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
const manifest = await readJson("evidence/manifest.json");
const schema = await readJson("evidence/schema.json");
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
if (!ajv.validate(schema, manifest)) {
  throw new Error(`Invalid evidence manifest: ${ajv.errorsText(ajv.errors)}`);
}

const requiredCells = new Map([
  ["story-1-1-static-foundation", "1.1"],
  ["story-1-2-supported-intake", "1.2"],
  ["story-1-3-lossless-pieces", "1.3"],
  ["story-1-4-idn-forms", "1.4"],
  ["story-1-5-complete-structured-view", "1.5"],
]);
for (const cell of manifest.cells) {
  if (requiredCells.get(cell.id) !== cell.story) {
    throw new Error(`Unexpected mandatory evidence cell: ${cell.id}`);
  }
  requiredCells.delete(cell.id);
  for (const item of cell.evidence) {
    await access(resolve(root, item));
  }
}
if (requiredCells.size > 0) {
  throw new Error(`Missing mandatory evidence cells: ${[...requiredCells.keys()].join(", ")}`);
}

const delivery = await readJson(manifest.artifact.delivery);
const csp = delivery.headers?.["Content-Security-Policy"] ?? "";
for (const directive of [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
]) {
  if (!csp.includes(directive)) {
    throw new Error(`Delivery CSP is missing ${directive}.`);
  }
}

const digest = createHash("sha256");
const addTree = async (directory) => {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
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
await addTree(resolve(root, manifest.artifact.path));
const deliveryPath = resolve(root, manifest.artifact.delivery);
digest.update(relative(root, deliveryPath));
digest.update("\0");
digest.update(await readFile(deliveryPath));
const actualDigest = digest.digest("hex");
if (actualDigest !== manifest.artifact.digest) {
  throw new Error(
    `Artifact digest mismatch: expected ${manifest.artifact.digest}, received ${actualDigest}.`,
  );
}

console.log(
  `Validated ${manifest.cells.length} mandatory Epic 1 evidence cells for artifact ${actualDigest}.`,
);
