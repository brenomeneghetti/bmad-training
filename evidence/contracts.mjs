export const engines = ["chromium"];
export const commands = {
  build: ["pnpm", "run", "build"],
  lint: ["pnpm", "run", "lint"],
  vitest: ["pnpm", "exec", "vitest", "run", "--reporter=json", "--outputFile=.cache/evidence-vitest.json"],
  node: ["node", "--test", "--test-reporter=./evidence/node-reporter.mjs", "evidence/validate.test.mjs", "evidence/run.test.mjs"],
  playwright: ["pnpm", "exec", "playwright", "test", "tests/workbench.spec.ts", "--reporter=json"],
};

export const sourcePaths = [
  "src", "tests", "evidence/contracts.mjs", "evidence/validation.mjs",
  "evidence/validate.mjs", "evidence/validate.test.mjs", "evidence/run.mjs",
  "evidence/run.test.mjs", "evidence/node-reporter.mjs", "evidence/adapters.mjs",
  "evidence/fixture.mjs",
  "evidence/schema.json", "evidence/inventory.json", "evidence/coverage.json",
  "package.json", "pnpm-lock.yaml", "playwright.config.ts", "vite.config.ts",
  "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "index.html", "AGENTS.md",
];
