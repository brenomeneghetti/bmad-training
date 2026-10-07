export default async function* reporter(events) {
  const tests = [];
  const ancestors = new Map();
  for await (const event of events) {
    if (event.type === "test:dequeue" && event.data.file) {
      const names = ancestors.get(event.data.file) ?? [];
      names[event.data.nesting] = event.data.name;
      names.length = event.data.nesting + 1;
      ancestors.set(event.data.file, names);
    }
    if (event.type === "test:pass" || event.type === "test:fail") {
      const data = event.data;
      if (data.file) {
        tests.push({
          file: data.file,
          title: [...(ancestors.get(data.file) ?? []).slice(0, data.nesting), data.name].join(" "),
          project: "node",
          status: event.type === "test:pass" && !data.skip && !data.todo ? "passed" : "failed",
        });
      }
    }
  }
  yield JSON.stringify({ tests });
}
