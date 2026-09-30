import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("./manifest.json", import.meta.url), "utf8"),
);
const requiredStories = new Set(["1.1", "1.2", "1.3", "1.4", "1.5"]);

if (manifest.schemaVersion !== 1 || manifest.epic !== 1) {
  throw new Error("Unsupported evidence manifest.");
}

for (const cell of manifest.cells) {
  if (!cell.id || !requiredStories.has(cell.story) || cell.status !== "pass") {
    throw new Error(`Invalid mandatory evidence cell: ${cell.id ?? "unknown"}`);
  }
  if (!cell.owner || !Array.isArray(cell.evidence) || cell.evidence.length === 0) {
    throw new Error(`Incomplete evidence metadata: ${cell.id}`);
  }
  for (const item of cell.evidence) {
    if (item.startsWith("pnpm ")) continue;
    await access(new URL(`../${item}`, import.meta.url));
  }
  requiredStories.delete(cell.story);
}

if (requiredStories.size > 0) {
  throw new Error(`Missing mandatory story evidence: ${[...requiredStories].join(", ")}`);
}

const dist = new URL("../dist/", import.meta.url);
const html = await readFile(new URL("index.html", dist), "utf8");
for (const directive of [
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
]) {
  if (!html.includes(directive)) throw new Error(`Built CSP is missing ${directive}.`);
}

const assets = await readdir(new URL("assets/", dist));
const digest = createHash("sha256");
digest.update(html);
for (const asset of assets.sort()) {
  digest.update(await readFile(new URL(`assets/${asset}`, dist)));
}

console.log(
  `Validated ${manifest.cells.length} mandatory Epic 1 evidence cells for artifact ${digest.digest("hex").slice(0, 16)}.`,
);
