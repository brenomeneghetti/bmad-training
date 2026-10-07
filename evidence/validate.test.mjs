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
  assert.equal((await validateEvidence(root)).cellCount, 32);
});

test("requires every Story 2.4 cell to remain mandatory and passing", async (context) => {
  const missingFixture = await createFixture(context);
  missingFixture.manifest.cells.splice(
    missingFixture.manifest.cells.findIndex(
      (cell) => cell.id === "story-2-4-accessibility-focus-skip-link",
    ),
    1,
  );
  await writeManifest(missingFixture.root, missingFixture.manifest);
  await assert.rejects(
    validateEvidence(missingFixture.root),
    /Invalid evidence manifest/,
  );

  const statusFixture = await createFixture(context);
  const statusCell = statusFixture.manifest.cells.find(
    (cell) => cell.id === "story-2-4-accessibility-focus-skip-link",
  );
  if (!statusCell) throw new Error("Missing Story 2.4 accessibility cell");
  statusCell.status = "incomplete";
  await writeManifest(statusFixture.root, statusFixture.manifest);
  await assert.rejects(
    validateEvidence(statusFixture.root),
    /Invalid evidence manifest/,
  );
});

test("requires every Story 2.5 cell to remain mandatory and passing", async (context) => {
  const missingFixture = await createFixture(context);
  missingFixture.manifest.cells.splice(
    missingFixture.manifest.cells.findIndex(
      (cell) => cell.id === "story-2-5-accessibility-focus-boundary",
    ),
    1,
  );
  await writeManifest(missingFixture.root, missingFixture.manifest);
  await assert.rejects(
    validateEvidence(missingFixture.root),
    /Invalid evidence manifest/,
  );

  const statusFixture = await createFixture(context);
  const statusCell = statusFixture.manifest.cells.find(
    (cell) => cell.id === "story-2-5-accessibility-focus-boundary",
  );
  if (!statusCell) throw new Error("Missing Story 2.5 accessibility cell");
  statusCell.status = "incomplete";
  await writeManifest(statusFixture.root, statusFixture.manifest);
  await assert.rejects(
    validateEvidence(statusFixture.root),
    /Invalid evidence manifest/,
  );
});

test("requires every Story 2.6 cell to remain mandatory and passing", async (context) => {
  for (const cellId of [
    "story-2-6-reconciled-identity-lcs",
    "story-2-6-focus-session-history-squash",
    "story-2-6-ime-safe-keyboard-loosened-gating",
    "story-2-6-privacy-capacity",
  ]) {
  const missingFixture = await createFixture(context);
  missingFixture.manifest.cells.splice(
    missingFixture.manifest.cells.findIndex(
      (cell) => cell.id === cellId,
    ),
    1,
  );
  await writeManifest(missingFixture.root, missingFixture.manifest);
  await assert.rejects(
    validateEvidence(missingFixture.root),
    /Invalid evidence manifest/,
  );

  const statusFixture = await createFixture(context);
  const statusCell = statusFixture.manifest.cells.find(
    (cell) => cell.id === cellId,
  );
  if (!statusCell) throw new Error("Missing Story 2.6 accessibility cell");
  statusCell.status = "incomplete";
  await writeManifest(statusFixture.root, statusFixture.manifest);
  await assert.rejects(
    validateEvidence(statusFixture.root),
    /Invalid evidence manifest/,
  );
  }
});

test("requires every Story 2.3 cell to remain mandatory and passing", async (context) => {
  const missingFixture = await createFixture(context);
  missingFixture.manifest.cells.splice(
    missingFixture.manifest.cells.findIndex(
      (cell) => cell.id === "story-2-3-accessibility-focus",
    ),
    1,
  );
  await writeManifest(missingFixture.root, missingFixture.manifest);
  await assert.rejects(
    validateEvidence(missingFixture.root),
    /Invalid evidence manifest/,
  );

  const statusFixture = await createFixture(context);
  const statusCell = statusFixture.manifest.cells.find(
    (cell) => cell.id === "story-2-3-accessibility-focus",
  );
  if (!statusCell) throw new Error("Missing Story 2.3 accessibility cell");
  statusCell.status = "incomplete";
  await writeManifest(statusFixture.root, statusFixture.manifest);
  await assert.rejects(
    validateEvidence(statusFixture.root),
    /Invalid evidence manifest/,
  );
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
