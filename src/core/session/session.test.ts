import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  prepareParse,
  sessionReducer,
  type SessionState,
} from ".";
import { createCapacityFixture } from "../../test/fixtures/semantic";

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

  it("invalidates a pending parse as soon as the editor changes", () => {
    const entered = sessionReducer(initialSessionState, {
      type: "inputChanged",
      value: "https://first.example/",
    });
    const first = prepareParse(entered);
    const parsing = sessionReducer(entered, first.start);
    const edited = sessionReducer(parsing, {
      type: "inputChanged",
      value: "https://second.example/",
    });
    expect(sessionReducer(edited, first.complete())).toBe(edited);
    expect(edited.snapshot).toBeNull();
  });

  it("ignores duplicate parse starts after publication", () => {
    const entered = sessionReducer(initialSessionState, {
      type: "inputChanged",
      value: "https://example.com/",
    });
    const parse = prepareParse(entered);
    const parsing = sessionReducer(entered, parse.start);
    const settled = sessionReducer(parsing, parse.complete());
    expect(sessionReducer(settled, parse.start)).toBe(settled);
  });

  it("preserves the trusted snapshot when IDN validation rejects replacement", () => {
    const active = apply(initialSessionState, "https://example.com/");
    const rejected = apply(active, "https://a..b/");
    expect(rejected.problem?.code).toBe("invalid-domain");
    expect(rejected.snapshot).toBe(active.snapshot);
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

  it("commits an exact structured edit atomically with one history entry", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/a%2fb?dup=1&dup=2#frag",
    );
    const target = active.snapshot?.query[1];
    if (!target) throw new Error("Missing fixture query piece");
    const edited = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-key",
        tokenRevision: 0,
        start: 0,
        end: 3,
        insertedText: "d&😀",
      },
    });
    expect(edited.input).toBe(
      "https://example.com/a%2fb?dup=1&d%26%F0%9F%98%80=2#frag",
    );
    expect(edited.snapshot).toBe(edited.lastValidSnapshot);
    expect(edited.history).toHaveLength(1);
    expect(edited.history[0]?.before).toBe(active.snapshot);
    expect(edited.history[0]?.after).toBe(edited.snapshot);
    expect(edited.snapshot?.query[0]).toBe(active.snapshot?.query[0]);
    expect(edited.snapshot?.query[1]?.id).toBe(target.id);
    expect(edited.tokenRevisions[`${target.id}:query-key`]).toBe(1);
  });

  it("keeps invalid text as a correctable local draft", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const invalid = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "%",
      },
    });
    expect(invalid.snapshot).toBe(active.snapshot);
    expect(invalid.history).toEqual([]);
    expect(invalid.tokenRevisions).toBe(active.tokenRevisions);
    expect(invalid.structuredDrafts[`${target.id}:query-value`]?.value).toBe("%");

    const corrected = sessionReducer(invalid, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "%2F",
      },
    });
    expect(corrected.snapshot?.serialized).toBe("https://example.com/a?x=%2F");
    expect(corrected.structuredDrafts).toEqual({});
    expect(corrected.history).toHaveLength(1);
  });

  it("preserves accepted malformed percent text when correcting a new invalid draft", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=%zzA");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const invalid = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 4,
        end: 4,
        insertedText: "%",
      },
    });
    expect(invalid.structuredDrafts[`${target.id}:query-value`]?.value).toBe(
      "%zzA%",
    );

    const corrected = sessionReducer(invalid, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 4,
        end: 5,
        insertedText: "%20",
      },
    });
    expect(corrected.snapshot?.serialized).toBe(
      "https://example.com/a?x=%zzA%20",
    );
    expect(corrected.structuredDrafts).toEqual({});
    expect(corrected.history).toHaveLength(1);
  });

  it.each([
    {
      name: "stale revision",
      command: { tokenRevision: 9, start: 0, end: 1 },
      code: "stale-token-revision",
    },
    {
      name: "out-of-range selection",
      command: { tokenRevision: 0, start: 0, end: 9 },
      code: "invalid-edit-range",
    },
  ])("rejects $name without committed side effects", ({ command, code }) => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const rejected = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        insertedText: "z",
        ...command,
      },
    });
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.input).toBe(active.input);
    expect(rejected.history).toBe(active.history);
    expect(rejected.tokenRevisions).toBe(active.tokenRevisions);
    expect(rejected.structuredProblem?.code).toBe(code);
    if (code === "stale-token-revision") {
      expect(rejected.structuredDrafts[`${target.id}:query-value`]?.value).toBe("1");
    }
  });

  it("reports a missing piece without publishing content", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const rejected = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: "piece-missing" as NonNullable<
          SessionState["snapshot"]
        >["domainId"],
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "secret",
      },
    });
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.history).toBe(active.history);
    expect(rejected.structuredProblem).toEqual({
      code: "missing-piece",
      field: "component",
      message:
        "This URL piece is no longer available. Review the current URL and try again.",
    });
    expect(JSON.stringify(rejected.structuredProblem)).not.toContain("secret");
  });

  it("edits a 250+ parameter URL within the local response target", () => {
    const input = createCapacityFixture();
    expect(input).toHaveLength(20_000);
    const active = apply(initialSessionState, input);
    const target = active.snapshot?.query[259];
    if (!target) throw new Error("Missing capacity target");
    const start = performance.now();
    const edited = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "y",
      },
    });
    expect(performance.now() - start).toBeLessThan(100);
    expect(edited.snapshot?.query).toHaveLength(260);
    expect(edited.snapshot?.query[259]?.rawValue.startsWith("y")).toBe(true);
  });
});
