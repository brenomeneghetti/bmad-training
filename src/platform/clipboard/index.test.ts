import { afterEach, expect, it, vi } from "vitest";
import { createBrowserClipboard } from ".";

afterEach(() => vi.useRealTimers());

it("Story 3.3 clipboard returns content-free typed boundary outcomes and exact writes", async () => {
  const writeText = vi.fn(async () => {});
  expect(await createBrowserClipboard(() => ({ writeText })).write("https://EXAMPLE.com/%2f?flag")).toBe("success");
  expect(writeText).toHaveBeenCalledExactlyOnceWith("https://EXAMPLE.com/%2f?flag");
  expect(await createBrowserClipboard(() => undefined).write("private")).toBe("unavailable");
  expect(await createBrowserClipboard(() => { throw new Error("private"); }).write("private")).toBe("throw");
  expect(await createBrowserClipboard(() => ({ writeText: () => { throw new Error("private"); } })).write("private")).toBe("throw");
  const retry = vi.fn().mockRejectedValueOnce(new Error("private")).mockResolvedValueOnce(undefined);
  const clipboard = createBrowserClipboard(() => ({ writeText: retry }));
  expect(await clipboard.write("private")).toBe("rejected");
  expect(await clipboard.write("retry")).toBe("success");
});

it("Story 3.3 clipboard timeout fences unresolved writes until settlement without late success", async () => {
  vi.useFakeTimers();
  for (const rejected of [false, true]) {
    let settle!: (value?: unknown) => void;
    const writeText = vi.fn(() => new Promise<void>((resolve, reject) => {
      settle = rejected ? reject : () => resolve();
    }));
    const clipboard = createBrowserClipboard(() => ({ writeText }));
    const first = clipboard.write("private");
    expect(await clipboard.write("overlap")).toBe("fenced");
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await first).toBe("timeout");
    expect(await clipboard.write("new")).toBe("fenced");
    settle();
    await Promise.resolve();
    expect(await first).toBe("timeout");
    const retry = clipboard.write("retry");
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(await clipboard.write("overlap-retry")).toBe("fenced");
    settle();
    expect(await retry).toBe(rejected ? "rejected" : "success");
  }
});
