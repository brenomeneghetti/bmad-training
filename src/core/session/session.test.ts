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
    expect(second.snapshot?.domainId).toBe(first.snapshot?.domainId);
    expect(secondIds.filter((id) => id !== first.snapshot?.domainId)
      .every((id) => !firstIds.has(id))).toBe(true);
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

  it("removes against the Last Valid snapshot while Full URL text is an unsynced draft or invalid, but still rejects a stale ID", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const pathPiece = active.snapshot?.path[0];
    const queryPiece = active.snapshot?.query[0];
    if (!pathPiece || !queryPiece) throw new Error("Missing fixture pieces");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const removedWhileEditing = sessionReducer(editing, {
      type: "removePiece",
      removal: { kind: "path", pieceId: pathPiece.id },
    });
    expect(removedWhileEditing.input).toBe(editing.input);
    expect(removedWhileEditing.snapshot?.path).not.toContainEqual(pathPiece);
    expect(removedWhileEditing.history).not.toBe(active.history);
    expect(removedWhileEditing.structuredProblem).toBeNull();

    const invalid = apply(active, "/relative");
    const invalidRemoval = sessionReducer(invalid, {
      type: "removePiece",
      removal: { kind: "query", pieceId: queryPiece.id },
    });
    expect(invalidRemoval.snapshot?.query).toHaveLength(0);
    expect(invalidRemoval.structuredProblem).toBeNull();

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

  it("removes against the Last Valid snapshot while a replacement URL is still parsing", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing query piece");
    const changed = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/b?x=1",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const removed = sessionReducer(parsing, {
      type: "removePiece",
      removal: { kind: "query", pieceId: target.id },
    });

    expect(parsing.phase).toBe("parsing");
    expect(removed.snapshot?.query).toHaveLength(0);
    expect(removed.structuredProblem).toBeNull();
    expect(removed.history).not.toBe(active.history);
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

  it("adds against the Last Valid snapshot even while Full URL text is an unsynced draft, invalid, or parsing", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const addedWhileEditing = sessionReducer(editing, { type: "addQueryPiece" });
    expect(addedWhileEditing.snapshot?.query).toHaveLength(2);
    expect(addedWhileEditing.input).toBe(editing.input);
    expect(addedWhileEditing.structuredProblem).toBeNull();

    const invalid = apply(active, "/relative");
    const invalidAdd = sessionReducer(invalid, { type: "addQueryPiece" });
    expect(invalidAdd.snapshot?.query).toHaveLength(2);
    expect(invalidAdd.structuredProblem).toBeNull();

    const changed = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/b?x=1",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const addedWhileParsing = sessionReducer(parsing, { type: "addQueryPiece" });
    expect(addedWhileParsing.snapshot?.query).toHaveLength(2);
    expect(addedWhileParsing.structuredProblem).toBeNull();
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

  it("rejects missing and over-capacity Domain commands, but succeeds against Last Valid while text is an unsynced draft", () => {
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
      const stillEnabled = sessionReducer(editing, {
        type: "structuredEdit",
        command: { ...base, pieceId: active.snapshot.domainId },
      });
      expect(stillEnabled.structuredProblem).toBeNull();
      expect(stillEnabled.input).toBe(editing.input);
      expect(stillEnabled.snapshot?.domain.unicode).toBe("faß.de");

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

  it("clears prior Domain success for no-op attempts but succeeds against Last Valid despite an unsynced draft", () => {
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

    const stillEnabled = sessionReducer(
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
    expect(stillEnabled.structuredSuccess).not.toBeNull();
    expect(stillEnabled.snapshot?.domain.unicode).toBe("example.com");
    expect(stillEnabled.history).not.toBe(committed.history);
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

  it("applies structured commands against the Last Valid snapshot while Full URL text is an unsynced draft", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=draft",
    });
    const applied = sessionReducer(editing, {
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
    expect(applied.input).toBe(editing.input);
    expect(applied.snapshot?.query[0]?.rawValue).toBe("2");
    expect(applied.history).not.toBe(active.history);
    expect(applied.structuredProblem).toBeNull();
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

  it("swaps a Query Parameter with its next neighbor and records one history entry", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/a?x=1&y=2&z=3",
    );
    const target = active.snapshot?.query[1];
    if (!target) throw new Error("Missing fixture query piece");

    const moved = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: target.id,
      direction: "down",
    });

    expect(moved.input).toBe("https://example.com/a?x=1&z=3&y=2");
    expect(moved.snapshot).toBe(moved.lastValidSnapshot);
    expect(moved.snapshot?.query.map((piece) => piece.id)).toEqual([
      active.snapshot?.query[0]?.id,
      active.snapshot?.query[2]?.id,
      target.id,
    ]);
    expect(moved.history).toHaveLength(1);
    expect(moved.history[0]).toEqual({
      before: active.snapshot,
      after: moved.snapshot,
      pieceId: target.id,
      field: "reorder-query",
    });
    expect(moved.revision).toBe(active.revision + 1);
    expect(moved.structuredSuccess).toContain('"y=2" moved from position 2 to position 3 of 3');
  });

  it("swaps a Query Parameter with its previous neighbor", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/a?x=1&y=2&z=3",
    );
    const target = active.snapshot?.query[2];
    if (!target) throw new Error("Missing fixture query piece");

    const moved = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: target.id,
      direction: "up",
    });

    expect(moved.input).toBe("https://example.com/a?x=1&z=3&y=2");
    expect(moved.structuredSuccess).toContain('"z=3" moved from position 3 to position 2 of 3');
  });

  it("creates no mutation, history, or announcement for a boundary no-op", () => {
    const active = apply(
      initialSessionState,
      "https://example.com/a?x=1&y=2",
    );
    const first = active.snapshot?.query[0];
    const last = active.snapshot?.query[1];
    if (!first || !last) throw new Error("Missing fixture query pieces");

    const upAtTop = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: first.id,
      direction: "up",
    });
    expect(upAtTop).toBe(active);

    const downAtBottom = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: last.id,
      direction: "down",
    });
    expect(downAtBottom).toBe(active);
  });

  it("moves against the Last Valid snapshot while Full URL text is an unsynced draft or still parsing, but still rejects a stale ID", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1&y=2");
    const target = active.snapshot?.query[0];
    if (!target) throw new Error("Missing fixture query piece");

    const editing = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/a?x=1&y=draft",
    });
    const movedWhileEditing = sessionReducer(editing, {
      type: "moveQueryPiece",
      pieceId: target.id,
      direction: "down",
    });
    expect(movedWhileEditing.snapshot?.query[1]?.id).toBe(target.id);
    expect(movedWhileEditing.structuredProblem).toBeNull();

    const stale = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: "missing" as typeof target.id,
      direction: "down",
    });
    expect(stale.snapshot).toBe(active.snapshot);
    expect(stale.history).toBe(active.history);
    expect(stale.structuredSuccess).toBeNull();
    expect(stale.structuredProblem?.code).toBe("missing-piece");

    const changed = sessionReducer(active, {
      type: "inputChanged",
      value: "https://example.com/b?x=1&y=2",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const movedWhileParsing = sessionReducer(parsing, {
      type: "moveQueryPiece",
      pieceId: target.id,
      direction: "down",
    });
    expect(parsing.phase).toBe("parsing");
    expect(movedWhileParsing.snapshot?.query[1]?.id).toBe(target.id);
    expect(movedWhileParsing.structuredProblem).toBeNull();
  });

  it("moves within a 250+ parameter URL within the local response target", () => {
    const active = apply(initialSessionState, createCapacityFixture());
    const target = active.snapshot?.query[100];
    if (!target) throw new Error("Missing capacity target");
    const start = performance.now();
    const moved = sessionReducer(active, {
      type: "moveQueryPiece",
      pieceId: target.id,
      direction: "down",
    });
    expect(performance.now() - start).toBeLessThan(100);
    expect(moved.snapshot?.query).toHaveLength(260);
    expect(moved.snapshot?.query[101]?.id).toBe(target.id);
  });
});

describe("Story 2.6: Full URL focus session", () => {
  it("cancels a scheduled initial intake when editing closes before its first snapshot", () => {
    const changed = sessionReducer(initialSessionState, {
      type: "inputChanged", value: "https://example.com/a",
    });
    const parse = prepareParse(changed);
    const pending = sessionReducer(changed, parse.start);
    const closed = sessionReducer(pending, { type: "closeFullUrlEdit", reason: "blur" });
    expect(sessionReducer(closed, parse.complete())).toBe(closed);
    expect(closed.phase).toBe("no-session");
    expect(closed.snapshot).toBeNull();
  });
  it("rejects old Domain revisions after Full URL changes the host but retains its identity", () => {
    const initial = apply(initialSessionState, "https://example.com/a");
    const edited = apply(initial, "https://example.org/a");
    if (!initial.snapshot) throw new Error("Missing initial snapshot");
    expect(edited.snapshot?.domainId).toBe(initial.snapshot.domainId);
    const stale = sessionReducer(edited, {
      type: "structuredEdit",
      command: { pieceId: initial.snapshot.domainId, field: "domain-ascii",
        tokenRevision: 0, value: "stale.example" },
    });
    expect(stale.structuredProblem?.code).toBe("stale-token-revision");
    expect(stale.snapshot).toBe(edited.snapshot);
    expect(stale.history).toBe(edited.history);
  });
  it("keeps first-intake identities without requiring blur and refocus", () => {
    const focused = sessionReducer(initialSessionState, { type: "fullUrlFocusBegin" });
    const first = apply(focused, "https://example.com/a?x=1");
    const next = apply(first, "https://example.com/ab?x=1");
    expect(next.snapshot?.domainId).toBe(first.snapshot?.domainId);
    expect(next.snapshot?.query[0]?.id).toBe(first.snapshot?.query[0]?.id);
    expect(next.fullUrlFocus?.baseline).toBe(first.snapshot);
  });

  it("preserves prior history and rebases when typing after Enter without refocusing", () => {
    const initial = apply(initialSessionState, "https://example.com/a?x=1");
    const changed = apply(initial, "https://example.com/b?x=1");
    const closed = sessionReducer(changed, { type: "closeFullUrlEdit", reason: "enter" });
    const next = apply(closed, "https://example.com/c?x=1");
    expect(next.history).toBe(closed.history);
    expect(next.snapshot?.domainId).toBe(closed.snapshot?.domainId);
    expect(next.fullUrlFocus?.baseline).toBe(closed.snapshot);
    const final = sessionReducer(next, { type: "closeFullUrlEdit", reason: "blur" });
    expect(final.history.map((entry) => [entry.before.serialized, entry.after.serialized]))
      .toEqual([
        ["https://example.com/a?x=1", "https://example.com/b?x=1"],
        ["https://example.com/b?x=1", "https://example.com/c?x=1"],
      ]);
  });

  it.each(["add", "remove", "move", "path", "domain"] as const)(
    "retains invalid Draft, validation, and chronological snapshots during %s",
    (operation) => {
      const initial = apply(initialSessionState, "https://example.com/a?x=1&y=2");
      const valid = apply(initial, "https://example.com/b?x=1&y=2");
      const invalid = apply(valid, "https://");
      const snapshot = invalid.snapshot;
      if (!snapshot) throw new Error("Missing fixture snapshot");
      const action = operation === "add"
        ? { type: "addQueryPiece" } as const
        : operation === "remove"
          ? { type: "removePiece", removal: { kind: "query", pieceId: snapshot.query[0]!.id } } as const
          : operation === "move"
            ? { type: "moveQueryPiece", pieceId: snapshot.query[0]!.id, direction: "down" } as const
            : operation === "path"
              ? { type: "structuredEdit", command: { pieceId: snapshot.path[0]!.id,
                field: "path", tokenRevision: 0, start: 0, end: 1, insertedText: "c" } } as const
              : { type: "structuredEdit", command: { pieceId: snapshot.domainId,
                field: "domain-ascii", tokenRevision: 0, value: "example.org" } } as const;
      const mutated = sessionReducer(invalid, action);
      expect(mutated.input).toBe(invalid.input);
      expect(mutated.problem).toBe(invalid.problem);
      expect(mutated.phase).toBe("invalid-intake");
      expect(mutated.snapshot).not.toBe(snapshot);
      expect(mutated.history).toHaveLength(2);
      expect(mutated.history[0]?.before).toBe(initial.snapshot);
      expect(mutated.history[0]?.after).toBe(snapshot);
      expect(mutated.history[1]?.before).toBe(snapshot);
      expect(mutated.history[1]?.after).toBe(mutated.snapshot);
      const corrected = apply(mutated, "https://corrected.example/final");
      expect(corrected.fullUrlFocus?.baseline).toBe(mutated.snapshot);
      expect(corrected.history).toBe(mutated.history);
    },
  );

  it.each(["blur", "enter"] as const)("invalidates pending parsing when closing by %s", (reason) => {
    const initial = apply(initialSessionState, "https://example.com/a");
    const changed = sessionReducer(initial, { type: "inputChanged", value: "https://example.com/b" });
    const parse = prepareParse(changed);
    const pending = sessionReducer(changed, parse.start);
    const closed = sessionReducer(pending, { type: "closeFullUrlEdit", reason });
    expect(sessionReducer(closed, parse.complete())).toBe(closed);
    expect(closed.phase).not.toBe("parsing");
  });

  it("captures a baseline/last-accepted snapshot only when a committed session already exists", () => {
    const active = apply(initialSessionState, "https://example.com/a?x=1");
    const focused = sessionReducer(active, { type: "fullUrlFocusBegin" });
    expect(focused.fullUrlFocus?.baseline).toBe(active.snapshot);
    expect(focused.fullUrlFocus?.lastAccepted).toBe(active.snapshot);

    const noSnapshot = sessionReducer(initialSessionState, {
      type: "fullUrlFocusBegin",
    });
    expect(noSnapshot.fullUrlFocus).toBeNull();
  });

  it("publishes every valid reparse immediately without appending history until the session closes", () => {
    const start = apply(initialSessionState, "https://example.com/a?x=1");
    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });

    const typed1 = apply(focused, "https://example.com/ab?x=1");
    expect(typed1.snapshot?.serialized).toBe("https://example.com/ab?x=1");
    expect(typed1.history).toBe(start.history);
    expect(typed1.fullUrlFocus?.baseline).toBe(start.snapshot);
    expect(typed1.fullUrlFocus?.lastAccepted).toBe(typed1.snapshot);

    const typed2 = apply(typed1, "https://example.com/abc?x=1&y=2");
    expect(typed2.snapshot?.serialized).toBe(
      "https://example.com/abc?x=1&y=2",
    );
    expect(typed2.history).toBe(start.history);

    const closed = sessionReducer(typed2, {
      type: "closeFullUrlEdit",
      reason: "blur",
    });
    expect(closed.fullUrlFocus).toBeNull();
    expect(closed.history).toHaveLength(1);
    expect(closed.history[0]).toEqual({
      before: start.snapshot,
      after: typed2.snapshot,
      pieceId: start.snapshot?.domainId,
      field: "full-url",
    });
  });

  it("keeps Domain ID unconditionally and reconciles Path/Query IDs by exact-token LCS across a reparse", () => {
    const start = apply(initialSessionState, "https://example.com/a/c?x=1&y=2");
    const domainId = start.snapshot?.domainId;
    const aId = start.snapshot?.path[0]?.id;
    const cId = start.snapshot?.path[1]?.id;
    const xId = start.snapshot?.query[0]?.id;
    const yId = start.snapshot?.query[1]?.id;

    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });
    // Removes "b"-free segment "a", inserts new "x0"/"c"-ordered segments
    // around the retained "a" and "c", and removes "x"/"y" while inserting a
    // new "z" between them -- relative order of retained tokens is preserved
    // so the LCS match is unambiguous.
    const reparsed = apply(
      focused,
      "https://example.com/x0/a/c/x1?x=1&z=3&y=2",
    );

    expect(reparsed.snapshot?.domainId).toBe(domainId);
    const pathIds = reparsed.snapshot?.path.map((piece) => piece.id) ?? [];
    expect(pathIds[1]).toBe(aId);
    expect(pathIds[2]).toBe(cId);
    expect(pathIds[0]).not.toBe(aId);
    expect(pathIds[0]).not.toBe(cId);
    expect(pathIds[3]).not.toBe(aId);
    expect(pathIds[3]).not.toBe(cId);

    const queryIds = reparsed.snapshot?.query.map((piece) => piece.id) ?? [];
    expect(queryIds[0]).toBe(xId);
    expect(queryIds[2]).toBe(yId);
    expect(queryIds[1]).not.toBe(xId);
    expect(queryIds[1]).not.toBe(yId);
    expect(reparsed.history).toBe(start.history);
  });

  it("carries over tokenRevisions for retained IDs and resets freshly minted ones to 0", () => {
    const start = apply(initialSessionState, "https://example.com/a?x=1");
    const pathId = start.snapshot?.path[0]?.id;
    if (!pathId) throw new Error("Missing path piece");
    const edited = sessionReducer(start, {
      type: "structuredEdit",
      command: {
        pieceId: pathId,
        field: "path",
        tokenRevision: 0,
        start: 1,
        end: 1,
        insertedText: "b",
      },
    });
    expect(edited.snapshot?.path[0]?.rawSegment).toBe("ab");
    expect(edited.tokenRevisions[`${pathId}:path`]).toBe(1);

    const focused = sessionReducer(edited, { type: "fullUrlFocusBegin" });
    const reparsed = apply(focused, "https://example.com/ab?x=1&y=2");
    expect(reparsed.snapshot?.path[0]?.id).toBe(pathId);
    expect(reparsed.tokenRevisions[`${pathId}:path`]).toBe(1);
    const newQueryId = reparsed.snapshot?.query[1]?.id;
    expect(newQueryId).toBeDefined();
    expect(reparsed.tokenRevisions[`${newQueryId}:query-key`]).toBe(0);
    expect(reparsed.tokenRevisions[`${newQueryId}:query-value`]).toBe(0);
  });

  it("appends no history entry when nothing changed before close", () => {
    const start = apply(initialSessionState, "https://example.com/a?x=1");
    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });
    const closed = sessionReducer(focused, {
      type: "closeFullUrlEdit",
      reason: "blur",
    });
    expect(closed.history).toBe(start.history);
    expect(closed.fullUrlFocus).toBeNull();
  });

  it("closes the Full URL session and appends its entry before a structured mutation applies, as a separate chronological entry", () => {
    const start = apply(initialSessionState, "https://example.com/a?x=1");
    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });
    const typed = apply(focused, "https://example.com/ab?x=1");
    expect(typed.history).toHaveLength(0);

    const targetQuery = typed.snapshot?.query[0];
    if (!targetQuery) throw new Error("Missing query piece");
    const afterMutation = sessionReducer(typed, {
      type: "removePiece",
      removal: { kind: "query", pieceId: targetQuery.id },
    });

    expect(afterMutation.fullUrlFocus).toBeNull();
    expect(afterMutation.history).toHaveLength(2);
    expect(afterMutation.history[0]).toEqual({
      before: start.snapshot,
      after: typed.snapshot,
      pieceId: start.snapshot?.domainId,
      field: "full-url",
    });
    expect(afterMutation.history[1]?.field).toBe("remove-query");
    expect(afterMutation.history[1]?.before).toBe(typed.snapshot);
  });

  it("discards a stale scheduled parse completion that arrives after newer input or a mutation", () => {
    const start = apply(initialSessionState, "https://example.com/a?x=1");
    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });
    const changed = sessionReducer(focused, {
      type: "inputChanged",
      value: "https://example.com/ab?x=1",
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);

    const supersededByNewInput = sessionReducer(parsing, {
      type: "inputChanged",
      value: "https://example.com/abc?x=1",
    });
    const stale = sessionReducer(supersededByNewInput, parse.complete());
    expect(stale).toBe(supersededByNewInput);
    expect(stale.snapshot).toBe(start.snapshot);
    expect(stale.fullUrlFocus?.lastAccepted).toBe(start.snapshot);
  });

  it("reconciles a 250+ parameter, 20,000-character capacity edit within the local response target", () => {
    const fixture = createCapacityFixture();
    const [schemeAndPath, rest] = fixture.split("?");
    const [queryPart, fragmentPart] = rest.split("#");
    const entries = queryPart.split("&");
    // Drop the first entry and append a new one; every other entry keeps its
    // relative order, so the LCS match stays unambiguous at full capacity.
    const modifiedEntries = [...entries.slice(1), "extra=1"];
    const modified = `${schemeAndPath}?${modifiedEntries.join("&")}#${fragmentPart}`;

    const start = apply(initialSessionState, fixture);
    const focused = sessionReducer(start, { type: "fullUrlFocusBegin" });
    const changed = sessionReducer(focused, {
      type: "inputChanged",
      value: modified,
    });
    const parse = prepareParse(changed);
    const parsing = sessionReducer(changed, parse.start);
    const startTime = performance.now();
    const reparsed = sessionReducer(parsing, parse.complete());
    expect(performance.now() - startTime).toBeLessThan(100);
    expect(reparsed.history).toBe(start.history);
    expect(reparsed.snapshot?.query).toHaveLength(260);
    for (let index = 0; index < 259; index += 1) {
      expect(reparsed.snapshot?.query[index]?.id).toBe(
        start.snapshot?.query[index + 1]?.id,
      );
    }
    expect(reparsed.snapshot?.query[259]?.id).not.toBe(
      start.snapshot?.query[0]?.id,
    );
  });
});
