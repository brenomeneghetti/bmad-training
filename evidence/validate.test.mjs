import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  calculateArtifactDigest,
  parseCsp,
  validateEvidence,
} from "./validation.mjs";

const delivery = {
  headers: {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  },
};

const createFixture = async (context) => {
  const root = await mkdtemp(join(process.cwd(), ".url-evidence-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([
    mkdir(join(root, "evidence"), { recursive: true }),
    mkdir(join(root, "deployment"), { recursive: true }),
    mkdir(join(root, "dist", "assets"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(
      join(root, "evidence", "schema.json"),
      await readFile(new URL("./schema.json", import.meta.url)),
    ),
    writeFile(
      join(root, "deployment", "static-delivery.json"),
      JSON.stringify(delivery),
    ),
    writeFile(join(root, "dist", "index.html"), "<main>artifact</main>"),
    writeFile(join(root, "dist", "assets", "app.js"), "export {};"),
    writeFile(join(root, "proof.txt"), "verified"),
  ]);

  const manifest = {
    schemaVersion: 1,
    epic: 2,
    matrixVersion: "epic-2-v1",
    evaluatorVersion: "1.0.0",
    artifact: {
      path: "dist",
      digest: "",
      delivery: "deployment/static-delivery.json",
    },
    toolVersions: {
      node: "24.13.1",
      pnpm: "12.5.1",
      vitest: "5.0.1",
      playwright: "1.63.0",
    },
    signOff: {
      owner: "test",
      recordedAt: "2026-09-30T00:00:00.000Z",
    },
    cells: [
      ["story-1-1-static-foundation", "1.1"],
      ["story-1-2-supported-intake", "1.2"],
      ["story-1-3-lossless-pieces", "1.3"],
      ["story-1-4-idn-forms", "1.4"],
      ["story-1-5-complete-structured-view", "1.5"],
      ["story-1-6-find-and-clear-managed-pieces", "1.6"],
      ["story-2-1-exact-structured-editing", "2.1"],
    ].map(([id, story]) => ({
      id,
      story,
      status: "pass",
      owner: "test",
      evidence: ["proof.txt"],
    })),
  };
  manifest.artifact.digest = await calculateArtifactDigest(root, manifest.artifact);
  await writeFile(
    join(root, "evidence", "manifest.json"),
    JSON.stringify(manifest),
  );
  return { root, manifest };
};

const writeManifest = (root, manifest) =>
  writeFile(join(root, "evidence", "manifest.json"), JSON.stringify(manifest));

test("accepts a complete valid evidence fixture", async (context) => {
  const { root } = await createFixture(context);
  assert.equal((await validateEvidence(root)).cellCount, 7);
});

test("rejects schema and fixed-cell violations", async (context) => {
  const schemaFixture = await createFixture(context);
  schemaFixture.manifest.matrixVersion = "invalid";
  await writeManifest(schemaFixture.root, schemaFixture.manifest);
  await assert.rejects(validateEvidence(schemaFixture.root), /Invalid evidence manifest/);

  const mappingFixture = await createFixture(context);
  mappingFixture.manifest.cells[0].story = "1.2";
  await writeManifest(mappingFixture.root, mappingFixture.manifest);
  await assert.rejects(
    validateEvidence(mappingFixture.root),
    /Unexpected mandatory evidence cell/,
  );
});

test("rejects ineffective CSP and missing or escaping evidence", async (context) => {
  const cspFixture = await createFixture(context);
  await writeFile(
    join(cspFixture.root, "deployment", "static-delivery.json"),
    JSON.stringify({
      headers: {
        "Content-Security-Policy":
          delivery.headers["Content-Security-Policy"].replace(
            "frame-ancestors",
            "x-frame-ancestors",
          ),
      },
    }),
  );
  await assert.rejects(validateEvidence(cspFixture.root), /frame-ancestors/);

  const missingFixture = await createFixture(context);
  missingFixture.manifest.cells[0].evidence = ["missing.txt"];
  await writeManifest(missingFixture.root, missingFixture.manifest);
  await assert.rejects(validateEvidence(missingFixture.root));

  const escapeFixture = await createFixture(context);
  escapeFixture.manifest.cells[0].evidence = ["../outside.txt"];
  await writeManifest(escapeFixture.root, escapeFixture.manifest);
  await assert.rejects(validateEvidence(escapeFixture.root), /escapes repository root/);
});

test("rejects an artifact digest mismatch and duplicate CSP directives", async (context) => {
  const { root, manifest } = await createFixture(context);
  manifest.artifact.digest = "0".repeat(64);
  await writeManifest(root, manifest);
  await assert.rejects(validateEvidence(root), /Artifact digest mismatch/);
  assert.throws(
    () => parseCsp("frame-ancestors 'none'; frame-ancestors 'self'"),
    /repeats frame-ancestors/,
  );
});
