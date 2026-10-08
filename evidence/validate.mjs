import { resolve } from "node:path";
import { validateEvidence } from "./validation.mjs";

const root = resolve(import.meta.dirname, "..");
try {
  const result = await validateEvidence(root);
  console.log(
    `Validated ${result.cellCount} mandatory evidence cells (including Story 3.3 truthful Copy) and ${result.testCount} exact executed tests on the approved Chromium MVP target for artifact ${result.artifactDigest}.`,
  );
} catch (error) {
  console.error(error.code === "ENOENT"
    ? `INCOMPLETE: Required current evidence input is missing (${error.path}).`
    : `INVALID_EVIDENCE: ${error.message}`);
  process.exitCode = 1;
}
