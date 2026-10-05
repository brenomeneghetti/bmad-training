import { describe, expect, it } from "vitest";
import { insertRawComponent } from "./codec";

describe("raw component insertion codec", () => {
  it("splices UTF-16 ranges without changing untouched text", () => {
    expect(
      insertRawComponent({
        raw: "pre%2fsuffix",
        start: 3,
        end: 3,
        insertedText: "😀 +%3a",
        profile: "path-segment",
      }),
    ).toEqual({ ok: true, value: "pre%F0%9F%98%80%20+%3a%2fsuffix" });
  });

  it.each([
    ["path-segment", "/?&#=", "%2F%3F&%23="],
    ["query-key", "&=", "%26%3D"],
    ["query-value", "&=", "%26="],
  ] as const)("uses the %s profile", (profile, insertedText, expected) => {
    expect(
      insertRawComponent({ raw: "", start: 0, end: 0, insertedText, profile }),
    ).toEqual({ ok: true, value: expected });
  });

  it.each(["%", "%2", "%zz"])("rejects incomplete percent text: %s", (insertedText) => {
    const result = insertRawComponent({
      raw: "abc",
      start: 1,
      end: 1,
      insertedText,
      profile: "path-segment",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-percent-edit");
  });

  it("rejects ranges that split existing percent triplets", () => {
    for (const [start, end] of [
      [1, 1],
      [2, 2],
      [0, 2],
      [1, 3],
    ]) {
      const result = insertRawComponent({
        raw: "%2F",
        start,
        end,
        insertedText: "x",
        profile: "path-segment",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("split-percent-triplet");
    }
  });

  it("rejects invalid UTF-16 ranges", () => {
    const result = insertRawComponent({
      raw: "abc",
      start: -1,
      end: 4,
      insertedText: "x",
      profile: "query-key",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-edit-range");
  });

  it("rejects a UTF-16 boundary inside a surrogate pair", () => {
    const result = insertRawComponent({
      raw: "😀",
      start: 1,
      end: 1,
      insertedText: "x",
      profile: "query-value",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-edit-range");
  });
});
