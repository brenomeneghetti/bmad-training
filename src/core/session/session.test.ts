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

  it("commits a Unicode Domain edit atomically across both forms and snapshots", () => {
      const active = apply(
        initialSessionState,
        "https://User@example.com:044/a%2fb?dup=1&dup=2#Frag%2f",
      );
      if (!active.snapshot) throw new Error("Missing active snapshot");
      const edited = sessionReducer(active, {
        type: "structuredEdit",
        command: {
          pieceId: active.snapshot.domainId,
          field: "domain-unicode",
          tokenRevision: 0,
          value: "faß.de",
        },
      });
      expect(edited.input).toBe(
        "https://User@xn--fa-hia.de:044/a%2fb?dup=1&dup=2#Frag%2f",
      );
      expect(edited.snapshot).toBe(edited.lastValidSnapshot);
      expect(edited.snapshot?.domain).toEqual({
        unicode: "faß.de",
        ascii: "xn--fa-hia.de",
      });
      expect(edited.snapshot?.domainId).toBe(active.snapshot.domainId);
      expect(edited.snapshot?.path).toBe(active.snapshot.path);
      expect(edited.snapshot?.query).toBe(active.snapshot.query);
      expect(edited.history).toHaveLength(1);
      expect(edited.history[0]).toMatchObject({
        before: active.snapshot,
        after: edited.snapshot,
        pieceId: active.snapshot.domainId,
        field: "domain-unicode",
      });
      expect(edited.revision).toBe(active.revision + 1);
      expect(
        edited.tokenRevisions[`${active.snapshot.domainId}:domain-unicode`],
      ).toBe(1);
      expect(
        edited.tokenRevisions[`${active.snapshot.domainId}:domain-ascii`],
      ).toBe(1);
  });

  it("keeps only the focused invalid Domain form as a correctable draft", () => {
      const active = apply(initialSessionState, "https://example.com/a?x=1");
      if (!active.snapshot) throw new Error("Missing active snapshot");
      const key = `${active.snapshot.domainId}:domain-ascii`;
      const invalid = sessionReducer(active, {
        type: "structuredEdit",
        command: {
          pieceId: active.snapshot.domainId,
          field: "domain-ascii",
          tokenRevision: 0,
          value: "xn--",
        },
      });
      expect(invalid.snapshot).toBe(active.snapshot);
      expect(invalid.input).toBe(active.input);
      expect(invalid.history).toBe(active.history);
      expect(invalid.structuredDrafts[key]?.value).toBe("xn--");
      expect(
        invalid.structuredDrafts[
          `${active.snapshot.domainId}:domain-unicode`
        ],
      ).toBeUndefined();
      const switched = sessionReducer(invalid, {
        type: "structuredEdit",
        command: {
          pieceId: active.snapshot.domainId,
          field: "domain-unicode",
          tokenRevision: 0,
          value: "a..b",
        },
      });
      expect(switched.structuredDrafts[key]).toBeUndefined();
      expect(
        switched.structuredDrafts[
          `${active.snapshot.domainId}:domain-unicode`
        ]?.value,
      ).toBe("a..b");

      const corrected = sessionReducer(switched, {
        type: "structuredEdit",
        command: {
          pieceId: active.snapshot.domainId,
          field: "domain-ascii",
          tokenRevision: 0,
          value: "XN--FA-HIA.DE",
        },
      });
      expect(corrected.snapshot?.serialized).toBe("https://xn--fa-hia.de/a?x=1");
      expect(corrected.structuredDrafts).toEqual({});
      expect(corrected.history).toHaveLength(1);
  });

  it.each([
      ["stale", "domain-unicode", 9, "faß.de", "stale-token-revision"],
      ["no-op", "domain-ascii", 0, "EXAMPLE.COM", null],
    ] as const)(
      "handles %s Domain commands without unrelated committed side effects",
      (_name, field, tokenRevision, value, code) => {
        const active = apply(initialSessionState, "https://example.com/a?x=1");
        if (!active.snapshot) throw new Error("Missing active snapshot");
        const result = sessionReducer(active, {
          type: "structuredEdit",
          command: {
            pieceId: active.snapshot.domainId,
            field,
            tokenRevision,
            value,
          },
        });
        expect(result.snapshot).toBe(active.snapshot);
        expect(result.input).toBe(active.input);
        expect(result.history).toBe(active.history);
        expect(result.revision).toBe(active.revision);
        expect(result.structuredProblem?.code ?? null).toBe(code);
        if (_name === "no-op") expect(result).toBe(active);
      },
  );

  it("rejects missing, disabled, and over-capacity Domain commands", () => {
      const active = apply(initialSessionState, "https://example.com/a?x=1");
      if (!active.snapshot) throw new Error("Missing active snapshot");
      const base = {
        field: "domain-unicode" as const,
        tokenRevision: 0,
        value: "faß.de",
      };
      const missing = sessionReducer(active, {
        type: "structuredEdit",
        command: {
          ...base,
          pieceId: "missing" as typeof active.snapshot.domainId,
        },
      });
      expect(missing.structuredProblem?.code).toBe("missing-piece");
      expect(missing.snapshot).toBe(active.snapshot);

      const editing = sessionReducer(active, {
        type: "inputChanged",
        value: "https://example.com/draft",
      });
      const disabled = sessionReducer(editing, {
        type: "structuredEdit",
        command: { ...base, pieceId: active.snapshot.domainId },
      });
      expect(disabled.structuredProblem?.code).toBe("structured-edit-unavailable");
      expect(disabled.input).toBe("https://example.com/draft");

      const capacity = apply(initialSessionState, createCapacityFixture());
      if (!capacity.snapshot) throw new Error("Missing capacity snapshot");
      const tooLong = sessionReducer(capacity, {
        type: "structuredEdit",
        command: {
          ...base,
          pieceId: capacity.snapshot.domainId,
          value: "longer.example",
        },
      });
      expect(tooLong.structuredProblem?.code).toBe("url-capacity-exceeded");
      expect(tooLong.snapshot).toBe(capacity.snapshot);
      expect(tooLong.history).toBe(capacity.history);
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

  it("corrects a draft without collapsing the trusted range inside a triplet", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=%2F");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const invalid = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 2,
        end: 3,
        insertedText: "%",
      },
    });
    const corrected = sessionReducer(invalid, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 3,
        insertedText: "%3A",
      },
    });
    expect(corrected.snapshot?.serialized).toBe("https://example.com/a?x=%3A");
    expect(corrected.structuredDrafts).toEqual({});
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

  it("rejects structured commands while Full URL text is unapplied", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const rejected = sessionReducer(editing, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "2",
      },
    });
    expect(rejected.input).toBe("https://example.com/a?x=draft");
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.history).toBe(active.history);
    expect(rejected.structuredProblem?.code).toBe("structured-edit-unavailable");
  });

  it("does not publish or journal serialized no-ops", () => {
    const active = apply(initialSessionState, "https://example.com/a?flag");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const unchanged = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "",
      },
    });
    expect(unchanged.snapshot).toBe(active.snapshot);
    expect(unchanged.history).toBe(active.history);
    expect(unchanged.revision).toBe(active.revision);
    expect(unchanged.tokenRevisions).toBe(active.tokenRevisions);
  });

  it("rejects an edit that would exceed supported capacity atomically", () => {
    const active = apply(initialSessionState, createCapacityFixture());
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing capacity target");
    const rejected = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "extra",
      },
    });
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.history).toBe(active.history);
    expect(rejected.structuredProblem?.code).toBe("url-capacity-exceeded");
  });

  it("does not retain an oversized insertion as a structured draft", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const rejected = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "x".repeat(20_001),
      },
    });
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.structuredProblem?.code).toBe("url-capacity-exceeded");
    expect(rejected.structuredDrafts).toEqual({});
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
