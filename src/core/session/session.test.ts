import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  prepareParse,
  sessionReducer,
  type SessionState,
} from ".";

const apply = (state: SessionState, input: string) => {
  const changed = sessionReducer(state, { type: "inputChanged", value: input });
  const parse = prepareParse(changed);
  return sessionReducer(sessionReducer(changed, parse.start), parse.complete());
};

describe("session authority", () => {
  it("publishes valid intake atomically and preserves it after rejection", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    expect(active.phase).toBe("active");
    expect(active.snapshot?.serialized).toBe("https://example.com/a?x=1");

    const rejected = apply(active, "/relative");
    expect(rejected.phase).toBe("invalid-intake");
    expect(rejected.input).toBe("/relative");
    expect(rejected.snapshot).toBe(active.snapshot);
  });

  it("discards stale parse completions", () => {
    const entered = sessionReducer(initialSessionState, {
      type: "inputChanged",
      value: "https://first.example/",
    });
    const first = prepareParse(entered);
    const parsingFirst = sessionReducer(entered, first.start);
    const secondInput = sessionReducer(parsingFirst, {
      type: "inputChanged",
      value: "https://second.example/",
    });
    const second = prepareParse(secondInput);
    const parsingSecond = sessionReducer(secondInput, second.start);
    expect(sessionReducer(parsingSecond, first.complete())).toBe(parsingSecond);
    const settled = sessionReducer(parsingSecond, second.complete());
    expect(settled.snapshot?.serialized).toBe("https://second.example/");
  });

  it("never recycles piece identities after a valid replacement", () => {
    const first = apply(initialSessionState, "https://example.com/a?x=1");
    const firstIds = new Set([
      first.snapshot?.domainId,
      ...(first.snapshot?.path.map((piece) => piece.id) ?? []),
      ...(first.snapshot?.query.map((piece) => piece.id) ?? []),
    ]);
    const second = apply(first, "https://example.com/b?y=2");
    const secondIds = [
      second.snapshot?.domainId,
      ...(second.snapshot?.path.map((piece) => piece.id) ?? []),
      ...(second.snapshot?.query.map((piece) => piece.id) ?? []),
    ];
    expect(secondIds.every((id) => !firstIds.has(id))).toBe(true);
  });
});
