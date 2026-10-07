import { isAbsolute, join, relative } from "node:path";

const fileIdentity = (root, path) => {
  const normalized = (isAbsolute(path) ? relative(root, path) : path).replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("../") || normalized.includes("/../") || isAbsolute(normalized)) {
    throw new Error(`Report file identity escapes repository: ${path}`);
  }
  return normalized;
};

export function normalizeReport(root, runner, report) {
  if (runner === "vitest") {
    if (!report.success || report.numFailedTests || report.numPendingTests || report.numTodoTests) {
      throw new Error("Vitest report is incomplete/nonpassing.");
    }
    return report.testResults.flatMap((suite) => suite.assertionResults.map((item) => ({
      file: fileIdentity(root, suite.name), title: item.fullName, project: "vitest", status: item.status,
    })));
  }
  if (runner === "node") {
    return report.tests.map((item) => ({ ...item, file: fileIdentity(root, item.file) }));
  }
  if (runner === "playwright") {
    if (report.errors?.length || report.stats?.unexpected || report.stats?.skipped || report.stats?.flaky) {
      throw new Error("Playwright report is incomplete/nonpassing.");
    }
    const results = [];
    const visit = (suite, parents = []) => {
      const titles = suite.file === suite.title || suite.title?.endsWith(".spec.ts") ? parents : [...parents, suite.title];
      for (const spec of suite.specs ?? []) {
        for (const item of spec.tests) {
          if (item.expectedStatus !== "passed" || item.results.length !== 1 || item.results[0].retry !== 0) {
            throw new Error(`Playwright test did not execute exactly once: ${spec.title}`);
          }
          const engine = item.annotations?.find((entry) => entry.type === "engine")?.description;
          results.push({
            file: fileIdentity(root, isAbsolute(spec.file) ? spec.file : join(fileIdentity(root, report.config.rootDir), spec.file)), title: [...titles, spec.title].join(" "),
            project: item.projectName, status: item.results[0].status, engine,
          });
        }
      }
      for (const child of suite.suites ?? []) visit(child, titles);
    };
    for (const suite of report.suites) visit(suite);
    return results;
  }
  throw new Error(`Unknown runner: ${runner}`);
}

export const identity = ({ file, title, project }) => JSON.stringify([file, title, project]);

export function inventoryOf(runner, tests) {
  const counts = new Map();
  for (const item of tests) {
    const key = identity(item);
    const old = counts.get(key);
    counts.set(key, { runner, file: item.file, title: item.title, project: item.project, multiplicity: (old?.multiplicity ?? 0) + 1 });
  }
  return [...counts.values()].sort((a, b) => identity(a).localeCompare(identity(b)));
}
