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

  it("removes exactly one piece and atomically records its original position", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/a%2fb?dup=1&dup=2#Frag%2f",
    );
    const target = active.snapshot?.query[0];
    const survivor = active.snapshot?.query[1];
    if (!target || !survivor) throw new Error("Missing duplicate query pieces");

    const removed = sessionReducer(active, {
      type: "removePiece",
      removal: { kind: "query", pieceId: target.id },
    });
    expect(removed.input).toBe(
      "https://example.com/a%2fb?dup=2#Frag%2f",
    );
    expect(removed.snapshot).toBe(removed.lastValidSnapshot);
    expect(removed.snapshot?.query).toMatchObject([
      { ...survivor, separatorBefore: "" },
    ]);
    expect(removed.history).toHaveLength(1);
    expect(removed.history[0]).toEqual({
      before: active.snapshot,
      after: removed.snapshot,
      pieceId: target.id,
      field: "remove-query",
    });
    expect(removed.revision).toBe(active.revision + 1);
    expect(removed.structuredSuccess).toContain("Query Parameter 1 removed");
  });

  it("clears only the removed piece drafts and preserves survivor drafts", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/?dup=1&dup=2",
    );
    const target = active.snapshot?.query[0];
    const survivor = active.snapshot?.query[1];
    if (!target || !survivor) throw new Error("Missing duplicate query pieces");
    const targetDraft = sessionReducer(active, {
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
    const survivorDraft = sessionReducer(targetDraft, {
      type: "structuredEdit",
      command: {
        pieceId: survivor.id,
        field: "query-value",
        tokenRevision: 0,
        start: 0,
        end: 1,
        insertedText: "%",
      },
    });

    const removed = sessionReducer(survivorDraft, {
      type: "removePiece",
      removal: { kind: "query", pieceId: target.id },
    });
    expect(removed.structuredDrafts[`${target.id}:query-value`]).toBeUndefined();
    expect(removed.structuredDrafts[`${survivor.id}:query-value`]?.value).toBe("%");
    expect(removed.snapshot?.query[0]?.id).toBe(survivor.id);
  });

  it("clears only the removed path draft and records a remove-path mutation", () => {
    const active = apply(initialSessionState, "https://example.com/one/two?x=1");
    const target = active.snapshot?.path[0];
    const survivor = active.snapshot?.path[1];
    if (!target || !survivor) throw new Error("Missing path pieces");
    const targetDraft = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: target.id,
        field: "path",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "%",
      },
    });
    const survivorDraft = sessionReducer(targetDraft, {
      type: "structuredEdit",
      command: {
        pieceId: survivor.id,
        field: "path",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "%",
      },
    });

    const removed = sessionReducer(survivorDraft, {
      type: "removePiece",
      removal: { kind: "path", pieceId: target.id },
    });

    expect(removed.structuredDrafts[`${target.id}:path`]).toBeUndefined();
    expect(removed.structuredDrafts[`${survivor.id}:path`]?.value).toBe("%two");
    expect(removed.snapshot?.path.map((piece) => piece.id)).toEqual([survivor.id]);
    expect(removed.history).toHaveLength(1);
    expect(removed.history[0]).toEqual({
      before: active.snapshot,
      after: removed.snapshot,
      pieceId: target.id,
      field: "remove-path",
    });
  });

  it("rejects removal while Full URL text is unapplied or the ID is stale", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const pathPiece = active.snapshot?.path[0];
    const queryPiece = active.snapshot?.query[0];
    if (!pathPiece || !queryPiece) throw new Error("Missing fixture pieces");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const unavailable = sessionReducer(editing, {
      type: "removePiece",
      removal: { kind: "path", pieceId: pathPiece.id },
    });
    expect(unavailable.input).toBe(editing.input);
    expect(unavailable.snapshot).toBe(active.snapshot);
    expect(unavailable.history).toBe(active.history);
    expect(unavailable.structuredSuccess).toBeNull();
    expect(unavailable.structuredProblem?.code).toBe(
      "structured-edit-unavailable",
    );

    const invalid = apply(active, "/relative");
    const invalidRemoval = sessionReducer(invalid, {
      type: "removePiece",
      removal: { kind: "query", pieceId: queryPiece.id },
    });
    expect(invalidRemoval.input).toBe(invalid.input);
    expect(invalidRemoval.snapshot).toBe(active.snapshot);
    expect(invalidRemoval.history).toBe(invalid.history);
    expect(invalidRemoval.structuredSuccess).toBeNull();
    expect(invalidRemoval.structuredProblem?.code).toBe(
      "structured-edit-unavailable",
    );

    const stale = sessionReducer(active, {
      type: "removePiece",
      removal: { kind: "path", pieceId: queryPiece.id },
    });
    expect(stale.snapshot).toBe(active.snapshot);
    expect(stale.input).toBe(active.input);
    expect(stale.history).toBe(active.history);
    expect(stale.revision).toBe(active.revision);
    expect(stale.structuredSuccess).toBeNull();
    expect(stale.structuredProblem?.code).toBe("missing-piece");
  });

  it("preserves existing drafts when a stale removal is rejected", () => {
    const active = apply(initialSessionState, "https://example.com/one?x=1");
    const pathPiece = active.snapshot?.path[0];
    if (!pathPiece) throw new Error("Missing path piece");
    const drafted = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: pathPiece.id,
        field: "path",
        tokenRevision: 0,
        start: 0,
        end: 0,
        insertedText: "%",
      },
    });
    const rejected = sessionReducer(drafted, {
      type: "removePiece",
      removal: { kind: "query", pieceId: pathPiece.id },
    });

    expect(rejected.snapshot).toBe(drafted.snapshot);
    expect(rejected.history).toBe(drafted.history);
    expect(rejected.structuredDrafts).toBe(drafted.structuredDrafts);
    expect(rejected.structuredDrafts[`${pathPiece.id}:path`]?.value).toBe("%one");
  });

  it("rejects removal while a replacement URL is still parsing", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing query piece");
    const changed = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/b?x=1",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const rejected = sessionReducer(parsing, {
      type: "removePiece",
      removal: { kind: "query", pieceId: target.id },
    });

    expect(parsing.phase).toBe("parsing");
    expect(rejected.phase).toBe("parsing");
    expect(rejected.input).toBe(changed.input);
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.history).toBe(active.history);
    expect(rejected.structuredSuccess).toBeNull();
  });

  it("removes from a 250+ parameter URL within the local response target", () => {
    const active = apply(initialSessionState, createCapacityFixture());
    const target = active.snapshot?.query[259];
    if (!target) throw new Error("Missing capacity target");
    const start = performance.now();
    const removed = sessionReducer(active, {
      type: "removePiece",
      removal: { kind: "query", pieceId: target.id },
    });
    expect(performance.now() - start).toBeLessThan(100);
    expect(removed.snapshot?.query).toHaveLength(259);
    expect(removed.snapshot?.query.some((piece) => piece.id === target.id)).toBe(
      false,
    );
  });

  it("appends one Query Parameter with a fresh non-recycled ID and one history entry", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const existingIds = new Set([
      active.snapshot?.domainId,
      ...(active.snapshot?.path.map((piece) => piece.id) ?? []),
      ...(active.snapshot?.query.map((piece) => piece.id) ?? []),
    ]);

    const added = sessionReducer(active, { type: "addQueryPiece" });

    expect(added.input).toBe("https://example.com/a?x=1&");
    expect(added.snapshot).toBe(added.lastValidSnapshot);
    expect(added.snapshot?.query).toHaveLength(2);
    const newPiece = added.snapshot?.query[1];
    if (!newPiece) throw new Error("Missing appended query piece");
    expect(existingIds.has(newPiece.id)).toBe(false);
    expect(newPiece).toEqual({
      id: newPiece.id,
      separatorBefore: "&",
      rawKey: "",
      equalsPresent: false,
      rawValue: "",
    });
    expect(added.snapshot?.query[0]).toBe(active.snapshot?.query[0]);
    expect(added.history).toHaveLength(1);
    expect(added.history[0]).toEqual({
      before: active.snapshot,
      after: added.snapshot,
      pieceId: newPiece.id,
      field: "add-query",
    });
    expect(added.revision).toBe(active.revision + 1);
    expect(added.nextPieceId).toBe(active.nextPieceId + 1);
    expect(added.structuredSuccess).toContain("Query Parameter 2 added");
    expect(added.tokenRevisions[`${newPiece.id}:query-key`]).toBe(0);
    expect(added.tokenRevisions[`${newPiece.id}:query-value`]).toBe(0);
  });

  it("appends a Query Parameter with no existing query and an empty `?` marker", () => {
    const active = apply(initialSessionState, "https://example.com/a");
    const added = sessionReducer(active, { type: "addQueryPiece" });
    expect(added.input).toBe("https://example.com/a?");
    expect(added.snapshot?.query).toHaveLength(1);
    expect(added.snapshot?.query[0]?.separatorBefore).toBe("");
  });

  it("rejects an add while Full URL text is unapplied or parsing", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const unavailable = sessionReducer(editing, { type: "addQueryPiece" });
    expect(unavailable.input).toBe(editing.input);
    expect(unavailable.snapshot).toBe(active.snapshot);
    expect(unavailable.history).toBe(active.history);
    expect(unavailable.structuredSuccess).toBeNull();
    expect(unavailable.structuredProblem?.code).toBe(
      "structured-edit-unavailable",
    );

    const invalid = apply(active, "/relative");
    const invalidAdd = sessionReducer(invalid, { type: "addQueryPiece" });
    expect(invalidAdd.input).toBe(invalid.input);
    expect(invalidAdd.snapshot).toBe(active.snapshot);
    expect(invalidAdd.history).toBe(invalid.history);
    expect(invalidAdd.structuredSuccess).toBeNull();
    expect(invalidAdd.structuredProblem?.code).toBe(
      "structured-edit-unavailable",
    );

    const changed = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/b?x=1",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const rejected = sessionReducer(parsing, { type: "addQueryPiece" });
    expect(rejected.phase).toBe("parsing");
    expect(rejected.input).toBe(changed.input);
    expect(rejected.snapshot).toBe(active.snapshot);
    expect(rejected.history).toBe(active.history);
    expect(rejected.structuredSuccess).toBeNull();
  });

  it("appends to a 250+ parameter URL within the local response target", () => {
    const entries = Array.from(
      { length: 260 },
      (_, index) => `parameter-${index}=value-${index}`,
    );
    const active = apply(
      initialSessionState,
      `https://example.com/deep/path?${entries.join("&")}`,
    );
    const start = performance.now();
    const added = sessionReducer(active, { type: "addQueryPiece" });
    expect(performance.now() - start).toBeLessThan(100);
    expect(added.snapshot?.query).toHaveLength(261);
    expect(added.snapshot?.query.at(-1)?.rawKey).toBe("");
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
      expect(edited.structuredSuccess).toContain(
        "Unicode Domain, ASCII/Punycode Domain, and Full URL updated",
      );
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
        expect(result.structuredSuccess).toBeNull();
        if (_name === "stale") {
          expect(
            result.structuredDrafts[
              `${active.snapshot.domainId}:domain-unicode`
            ]?.value,
          ).toBe("faß.de");
        }
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
      expect(
        tooLong.structuredDrafts[
          `${capacity.snapshot.domainId}:domain-unicode`
        ]?.value,
      ).toBe("longer.example");
      expect(
        tooLong.structuredDrafts[
          `${capacity.snapshot.domainId}:domain-unicode`
        ]?.problem,
      ).toBe(tooLong.structuredProblem);
  });

  it("preserves the opposite Domain draft across stale and capacity guards", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    if (!active.snapshot) throw new Error("Missing active snapshot");
    const asciiKey = `${active.snapshot.domainId}:domain-ascii`;
    const unicodeKey = `${active.snapshot.domainId}:domain-unicode`;
    const invalidAscii = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: active.snapshot.domainId,
        field: "domain-ascii",
        tokenRevision: 0,
        value: "xn--",
      },
    });
    const staleUnicode = sessionReducer(invalidAscii, {
      type: "structuredEdit",
      command: {
        pieceId: active.snapshot.domainId,
        field: "domain-unicode",
        tokenRevision: 9,
        value: "faß.de",
      },
    });
    expect(staleUnicode.structuredDrafts[asciiKey]?.value).toBe("xn--");
    expect(staleUnicode.structuredDrafts[unicodeKey]?.value).toBe("faß.de");

    const capacityUnicode = sessionReducer(invalidAscii, {
      type: "structuredEdit",
      command: {
        pieceId: active.snapshot.domainId,
        field: "domain-unicode",
        tokenRevision: 0,
        value: "a".repeat(20_001),
      },
    });
    expect(capacityUnicode.structuredDrafts[asciiKey]?.value).toBe("xn--");
    expect(capacityUnicode.structuredDrafts[unicodeKey]?.value).toHaveLength(20_001);
    expect(capacityUnicode.structuredDrafts[unicodeKey]?.problem).toBe(
      capacityUnicode.structuredProblem,
    );

    const nearLimit = apply(initialSessionState, createCapacityFixture());
    if (!nearLimit.snapshot) throw new Error("Missing capacity snapshot");
    const nearLimitAsciiKey = `${nearLimit.snapshot.domainId}:domain-ascii`;
    const nearLimitUnicodeKey = `${nearLimit.snapshot.domainId}:domain-unicode`;
    const nearLimitInvalidAscii = sessionReducer(nearLimit, {
      type: "structuredEdit",
      command: {
        pieceId: nearLimit.snapshot.domainId,
        field: "domain-ascii",
        tokenRevision: 0,
        value: "xn--",
      },
    });
    const serializedCapacity = sessionReducer(nearLimitInvalidAscii, {
      type: "structuredEdit",
      command: {
        pieceId: nearLimit.snapshot.domainId,
        field: "domain-unicode",
        tokenRevision: 0,
        value: "longer.example",
      },
    });
    expect(serializedCapacity.structuredProblem?.code).toBe(
      "url-capacity-exceeded",
    );
    expect(serializedCapacity.structuredDrafts[nearLimitAsciiKey]?.value).toBe(
      "xn--",
    );
    expect(
      serializedCapacity.structuredDrafts[nearLimitUnicodeKey]?.value,
    ).toBe("longer.example");
  });

  it("counts Domain capacity by Unicode code point instead of UTF-16 unit", () => {
    const active = apply(initialSessionState, "https://example.com/");
    if (!active.snapshot) throw new Error("Missing active snapshot");
    const result = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: active.snapshot.domainId,
        field: "domain-unicode",
        tokenRevision: 0,
        value: "😀".repeat(10_001),
      },
    });
    expect(result.structuredProblem?.code).not.toBe("url-capacity-exceeded");
    expect(result.structuredDrafts[
      `${active.snapshot.domainId}:domain-unicode`
    ]?.problem.code).not.toBe("url-capacity-exceeded");
  });

  it("clears prior Domain success for no-op and disabled attempts", () => {
    const active = apply(initialSessionState, "https://example.com/");
    if (!active.snapshot) throw new Error("Missing active snapshot");
    const committed = sessionReducer(active, {
      type: "structuredEdit",
      command: {
        pieceId: active.snapshot.domainId,
        field: "domain-unicode",
        tokenRevision: 0,
        value: "faß.de",
      },
    });
    if (!committed.snapshot) throw new Error("Missing committed snapshot");
    expect(committed.structuredSuccess).not.toBeNull();

    const noOp = sessionReducer(committed, {
      type: "structuredEdit",
      command: {
        pieceId: committed.snapshot.domainId,
        field: "domain-ascii",
        tokenRevision: 1,
        value: "XN--FA-HIA.DE",
      },
    });
    expect(noOp.structuredSuccess).toBeNull();
    expect(noOp.snapshot).toBe(committed.snapshot);
    expect(noOp.history).toBe(committed.history);

    const disabled = sessionReducer(
      { ...committed, input: `${committed.input}draft` },
      {
        type: "structuredEdit",
        command: {
          pieceId: committed.snapshot.domainId,
          field: "domain-unicode",
          tokenRevision: 1,
          value: "example.com",
        },
      },
    );
    expect(disabled.structuredSuccess).toBeNull();
    expect(disabled.snapshot).toBe(committed.snapshot);
    expect(disabled.history).toBe(committed.history);
  });

  it.each([
    ["cafe\u0301.example", "xn--caf-dma.example", "café.example"],
    ["مثال.إختبار", "xn--mgbh0fb.xn--kgbechtv", "مثال.إختبار"],
    ["עברית.example", "xn--5dbqzzl.example", "עברית.example"],
    ["раypal.example", "xn--ypal-43d9g.example", "раypal.example"],
  ] as const)(
    "publishes combining, RTL, and standards-valid mixed-script Domain edits: %s",
    (value, ascii, unicode) => {
      const active = apply(initialSessionState, "https://example.com/a?x=1");
      if (!active.snapshot) throw new Error("Missing active snapshot");
      const edited = sessionReducer(active, {
        type: "structuredEdit",
        command: {
          pieceId: active.snapshot.domainId,
          field: "domain-unicode",
          tokenRevision: 0,
          value,
        },
      });
      expect(edited.snapshot?.domain).toEqual({ ascii, unicode });
      expect(edited.snapshot?.serialized).toBe(`https://${ascii}/a?x=1`);
      expect(edited.history).toHaveLength(1);
    },
  );

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
