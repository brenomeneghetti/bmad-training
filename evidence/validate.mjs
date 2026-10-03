import { resolve } from "node:path";
import { validateEvidence } from "./validation.mjs";

const root = process.env.EVIDENCE_ROOT
  ? resolve(process.env.EVIDENCE_ROOT)
  : resolve(import.meta.dirname, "..");
const result = await validateEvidence(root);

console.log(
  `Validated ${result.cellCount} mandatory Epic 1 evidence cells through Story 1.6 for artifact ${result.artifactDigest}.`,
);
