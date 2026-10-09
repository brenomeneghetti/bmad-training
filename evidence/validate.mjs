import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { evaluateGate, hashFile, safePath } from "./validation.mjs";

const root = resolve(import.meta.dirname, "..");
try {
  const args = process.argv.slice(2);
  let scope = "mvp", inputPath = "evidence/release-evidence.json";
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--release" && scope === "mvp") scope = "release";
    else if (args[index] === "--story" && scope === "mvp" && args[index + 1]) {
      scope = args[++index];
      if (scope === "release" || scope === "mvp") throw new Error();
    }
    else if (args[index] === "--input" && args[index + 1]) inputPath = args[++index];
    else throw new Error();
  }
  const options = { scope, inputPath };
  let result = await evaluateGate(root, options);
  if (!result.satisfied) {
    for (const diagnostic of result.diagnostics) console.error(`${diagnostic.code}${diagnostic.cellId ? `:${diagnostic.cellId}` : ""}`);
    process.exitCode = 1;
  } else if (scope === "mvp") {
    console.log(`MVP_PASS: ${result.execution.cellCount} cells, ${result.execution.testCount} exact tests, Chromium only; RELEASE_NOT_EVALUATED.`);
  } else if (result.provenance === "synthetic") {
    console.error(scope === "release" ? "SYNTHETIC_NOT_RELEASE_PROOF" : "SYNTHETIC_NOT_STORY_PROOF");
    process.exitCode = 1;
  } else if (scope !== "release") {
    console.log(`STORY_GATE_PASS:${scope}; RELEASE_NOT_AUTHORIZED.`);
  } else {
    // Recheck all referenced bytes before publishing an immutable authorization.
    const previous = result.authorization;
    result = await evaluateGate(root, options);
    if (!result.releaseEligible || result.authorization.digest !== previous.digest) throw new Error();
    try { await safePath(root, "evidence/authorizations", "directory"); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      await mkdir(resolve(root, "evidence/authorizations"));
    }
    await safePath(root, "evidence/authorizations", "directory");
    const authorization = result.authorization;
    try { await writeFile(resolve(root, authorization.path), authorization.bytes, { flag: "wx", mode: 0o600 }); }
    catch (error) {
      if (error.code !== "EEXIST" || await hashFile(root, authorization.path) !== authorization.digest) throw error;
    }
    console.log(`RELEASE_AUTHORIZED:${authorization.path}`);
  }
} catch {
  console.error("GATE_INPUT_OR_PUBLICATION_INVALID");
  process.exitCode = 1;
}
