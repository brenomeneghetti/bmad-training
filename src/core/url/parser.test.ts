import { describe, expect, it } from "vitest";
import {
  createCapacityFixture,
  semanticFixture,
  unsupportedFixtures,
} from "../../test/fixtures/semantic";
import {
  addLosslessQueryPiece,
  editLosslessToken,
  moveLosslessQueryPiece,
  parseLosslessUrl,
  removeLosslessPiece,
  replaceLosslessDomain,
  serializeLosslessUrl,
} from ".";

describe("lossless URL parser", () => {
  it("preserves exact serialization and every structural distinction", () => {
    const result = parseLosslessUrl(semanticFixture);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(serializeLosslessUrl(result.value)).toBe(semanticFixture);
    expect(result.value.rawHost).toBe("faß.de");
    expect(result.value.domain).toEqual({
      unicode: "faß.de",
      ascii: "xn--fa-hia.de",
    });
    expect(result.value.path.map((piece) => piece.rawSegment)).toEqual([
      "a%2Fb",
      "",
      "tail",
      "",
    ]);
    expect(result.value.path.map((piece) => piece.separatorBefore)).toEqual([
      "/",
      "/",
      "/",
      "/",
    ]);
    expect(
      result.value.query.map(({ rawKey, equalsPresent, rawValue }) => ({
        rawKey,
        equalsPresent,
        rawValue,
      })),
    ).toEqual([
      { rawKey: "dup", equalsPresent: true, rawValue: "1" },
      { rawKey: "dup", equalsPresent: true, rawValue: "2" },
      { rawKey: "key", equalsPresent: false, rawValue: "" },
      { rawKey: "key", equalsPresent: true, rawValue: "" },
      { rawKey: "", equalsPresent: true, rawValue: "empty" },
      { rawKey: "", equalsPresent: false, rawValue: "" },
      { rawKey: "encoded", equalsPresent: true, rawValue: "a%26b%3Dc" },
      { rawKey: "bad", equalsPresent: true, rawValue: "%zz" },
    ]);
    expect(result.value.rawFragment).toBe("frag%23ment");
    expect(result.value.problems).toHaveLength(1);
    expect(result.value.problems[0]?.code).toBe("malformed-percent");
    expect(new Set(result.value.query.map((piece) => piece.id)).size).toBe(8);
  });

  it.each(unsupportedFixtures)("rejects unsupported intake without throwing: $input", ({
    input,
    code,
    message,
  }) => {
    const result = parseLosslessUrl(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe("full-url");
      expect(result.error.code).toBe(code);
      expect(result.error.message).toContain(message);
    }
  });

  it.each([
    "https:example.com",
    "https:////example.com/a",
    "https:\\\\example.com\\a",
  ])("preserves every supported WHATWG special URL form: %s", (input) => {
    const result = parseLosslessUrl(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.serialized).toBe(input);
  });

  it("reports malformed percent positions by Unicode code point", () => {
    const result = parseLosslessUrl("https://example.com/😀%zz");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.problems.map((problem) => problem.message)).toContain(
        "Malformed percent text at character 22.",
      );
    }
  });

  it("rejects input beyond the supported 20,000-character boundary", () => {
    const result = parseLosslessUrl(`https://example.com/${"x".repeat(20_000)}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("20,000");
  });

  it("reports invalid Punycode as a domain conversion problem", () => {
    const result = parseLosslessUrl("https://xn--/");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid-domain");
  });

  it("scans many malformed percent signs within the parse target", () => {
    const input = `https://example.com/?bad=${"%".repeat(5_000)}`;
    const start = performance.now();
    const result = parseLosslessUrl(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.problems).toHaveLength(5_000);
    expect(performance.now() - start).toBeLessThan(1_000);
  });

  it("parses the 20,000 character 250+ parameter fixture completely", () => {
    const fixture = createCapacityFixture();
    const start = performance.now();
    const result = parseLosslessUrl(fixture);
    const duration = performance.now() - start;
    expect(Array.from(fixture)).toHaveLength(20_000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.query).toHaveLength(260);
    expect(result.value.query[259]?.rawKey).toBe("parameter-259");
    expect(result.value.serialized).toBe(fixture);
    expect(duration).toBeLessThan(1_000);
  });

  it("supports IP hosts without applying IDN mapping", () => {
    const ipv4 = parseLosslessUrl("http://127.0.0.1:8080/");
    const ipv6 = parseLosslessUrl("https://[::1]/");
    expect(ipv4.ok && ipv4.value.domain.ascii).toBe("127.0.0.1");
    expect(ipv6.ok && ipv6.value.domain.ascii).toBe("[::1]");
  });

  it("replaces an IPv6 host without changing its port or surrounding bytes", () => {
    const parsed = parseLosslessUrl("https://User@[::1]:8443/a%2fb?x=1#Frag");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const edited = replaceLosslessDomain(parsed.value, {
      pieceId: parsed.value.domainId,
      field: "domain-ascii",
      value: "[2001:db8::1]",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.serialized).toBe(
      "https://User@[2001:db8::1]:8443/a%2fb?x=1#Frag",
    );
    expect(edited.value.authorityPrefix).toBe("User@");
    expect(edited.value.authoritySuffix).toBe(":8443");
    expect(edited.value.path).toBe(parsed.value.path);
    expect(edited.value.query).toBe(parsed.value.query);
  });

  it("replaces only the exact host while preserving every unrelated byte and ID", () => {
    const parsed = parseLosslessUrl(
      "https://User:Pass@Example.COM:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const edited = replaceLosslessDomain(parsed.value, {
      pieceId: parsed.value.domainId,
      field: "domain-unicode",
      value: "faß.de",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.serialized).toBe(
      "https://User:Pass@xn--fa-hia.de:044/a%2fb//?dup=1&dup=2#Frag%2f",
    );
    expect(edited.value.domain).toEqual({
      unicode: "faß.de",
      ascii: "xn--fa-hia.de",
    });
    expect(edited.value.domainId).toBe(parsed.value.domainId);
    expect(edited.value.path).toBe(parsed.value.path);
    expect(edited.value.query).toBe(parsed.value.query);
    expect(edited.value.authorityPrefix).toBe("User:Pass@");
    expect(edited.value.authoritySuffix).toBe(":044");
  });

  it("preserves the exact snapshot when an edit converts to the committed host", () => {
    const parsed = parseLosslessUrl("https://faß.de/a");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const unchanged = replaceLosslessDomain(parsed.value, {
      pieceId: parsed.value.domainId,
      field: "domain-ascii",
      value: "XN--FA-HIA.DE",
    });
    expect(unchanged).toEqual({ ok: true, value: parsed.value });
    if (unchanged.ok) expect(unchanged.value).toBe(parsed.value);
  });

  it("rejects missing, invalid, and over-capacity Domain replacements atomically", () => {
    const parsed = parseLosslessUrl(`https://a.de/${"x".repeat(19_987)}`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      replaceLosslessDomain(parsed.value, {
        pieceId: "missing" as typeof parsed.value.domainId,
        field: "domain-unicode",
        value: "faß.de",
      }),
    ).toMatchObject({ ok: false, error: { code: "missing-piece" } });
    expect(
      replaceLosslessDomain(parsed.value, {
        pieceId: parsed.value.domainId,
        field: "domain-ascii",
        value: "xn--",
      }),
    ).toMatchObject({ ok: false, error: { code: "invalid-domain" } });
    expect(
      replaceLosslessDomain(parsed.value, {
        pieceId: parsed.value.domainId,
        field: "domain-unicode",
        value: "longer.example",
      }),
    ).toMatchObject({ ok: false, error: { code: "url-capacity-exceeded" } });
  });

  it("uses WHATWG special-URL backslashes as exact path separators", () => {
    const result = parseLosslessUrl("https://example.com\\one/two\\");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rawHost).toBe("example.com");
    expect(result.value.pathRaw).toBe("\\one/two\\");
    expect(
      result.value.path.map(({ separatorBefore, rawSegment }) => ({
        separatorBefore,
        rawSegment,
      })),
    ).toEqual([
      { separatorBefore: "\\", rawSegment: "one" },
      { separatorBefore: "/", rawSegment: "two" },
      { separatorBefore: "\\", rawSegment: "" },
    ]);
    expect(result.value.serialized).toBe("https://example.com\\one/two\\");
  });

  it.each([
    ["https:example.com/a", "https:example.com/z"],
    ["https:////example.com/a", "https:////example.com/z"],
    ["https:\\\\example.com\\a", "https:\\\\example.com\\z"],
    ["https://example.com\\one/two\\", "https://example.com\\z/two\\"],
  ])("preserves special URL syntax while editing: %s", (input, expected) => {
    const parsed = parseLosslessUrl(input);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.path[0];
    if (!target) throw new Error("Missing special-form path piece");
    const edited = editLosslessToken(parsed.value, {
      pieceId: target.id,
      field: "path",
      start: 0,
      end: target.rawSegment.length,
      insertedText: "z",
    });
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.value.serialized).toBe(expected);
  });

  it("edits one addressed token without rewriting any other bytes", () => {
    const parsed = parseLosslessUrl(
      "https://User@example.com:044/a%2fb?dup=1&dup=2&flag#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[1];
    if (!target) throw new Error("Missing fixture query piece");

    const edited = editLosslessToken(parsed.value, {
      pieceId: target.id,
      field: "query-value",
      start: 0,
      end: 1,
      insertedText: "x&😀",
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    expect(edited.value.serialized).toBe(
      "https://User@example.com:044/a%2fb?dup=1&dup=x%26%F0%9F%98%80&flag#Frag%2f",
    );
    expect(edited.value.query[0]).toBe(parsed.value.query[0]);
    expect(edited.value.query[1]?.id).toBe(target.id);
    expect(edited.value.domainId).toBe(parsed.value.domainId);
  });

  it.each([
    [0, "https://example.com//tail/?x=%2f#Frag%2f"],
    [1, "https://example.com/a%2fb/tail/?x=%2f#Frag%2f"],
    [2, "https://example.com/a%2fb//?x=%2f#Frag%2f"],
    [3, "https://example.com/a%2fb//tail?x=%2f#Frag%2f"],
  ])("removes only the addressed path segment at index %i", (index, expected) => {
    const parsed = parseLosslessUrl(
      "https://example.com/a%2fb//tail/?x=%2f#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.path[index];
    if (!target) throw new Error("Missing fixture path piece");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "path",
      pieceId: target.id,
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.serialized).toBe(expected);
    expect(removed.value.path.map((piece) => piece.id)).toEqual(
      parsed.value.path.filter((piece) => piece.id !== target.id).map((piece) => piece.id),
    );
    expect(removed.value.query).toBe(parsed.value.query);
  });

  it("removes the final non-empty path segment without retaining its delimiter", () => {
    const parsed = parseLosslessUrl("https://example.com/one/two/three?x=1#Frag");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.path.at(-1);
    if (!target) throw new Error("Missing final path piece");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "path",
      pieceId: target.id,
    });
    expect(removed.ok && removed.value.serialized).toBe(
      "https://example.com/one/two?x=1#Frag",
    );
  });

  it("removes the sole empty root path segment without changing authority", () => {
    const parsed = parseLosslessUrl("https://example.com/");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.path[0];
    if (!target) throw new Error("Missing root path segment");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "path",
      pieceId: target.id,
    });

    expect(removed.ok && removed.value.serialized).toBe("https://example.com");
    if (removed.ok) expect(removed.value.path).toEqual([]);
  });

  it("removes one exact query entry and resets only the first surviving separator", () => {
    const parsed = parseLosslessUrl(
      "https://example.com/a?dup=1&dup=2&&flag=&absent#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "query",
      pieceId: target.id,
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.serialized).toBe(
      "https://example.com/a?dup=2&&flag=&absent#Frag%2f",
    );
    expect(removed.value.query.map((piece) => piece.id)).toEqual(
      parsed.value.query.slice(1).map((piece) => piece.id),
    );
    expect(removed.value.path).toBe(parsed.value.path);
  });

  it.each([
    [1, "https://example.com/a?dup=1&&flag=&absent#Frag%2f"],
    [2, "https://example.com/a?dup=1&dup=2&flag=&absent#Frag%2f"],
    [3, "https://example.com/a?dup=1&dup=2&&absent#Frag%2f"],
    [4, "https://example.com/a?dup=1&dup=2&&flag=#Frag%2f"],
  ])("removes query entry index %i without rewriting survivors", (index, expected) => {
    const parsed = parseLosslessUrl(
      "https://example.com/a?dup=1&dup=2&&flag=&absent#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[index];
    if (!target) throw new Error("Missing fixture query piece");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "query",
      pieceId: target.id,
    });
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.serialized).toBe(expected);
    expect(removed.value.query.map((piece) => piece.id)).toEqual(
      parsed.value.query.filter((piece) => piece.id !== target.id).map((piece) => piece.id),
    );
  });

  it("removes the query marker with the last query entry", () => {
    const parsed = parseLosslessUrl("https://example.com/a?only=#Frag");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");

    const removed = removeLosslessPiece(parsed.value, {
      kind: "query",
      pieceId: target.id,
    });
    expect(removed.ok && removed.value.serialized).toBe(
      "https://example.com/a#Frag",
    );
    if (removed.ok) {
      expect(removed.value.queryPresent).toBe(false);
      expect(removed.value.query).toEqual([]);
    }
  });

  it("rejects missing and wrong-kind removal IDs", () => {
    const parsed = parseLosslessUrl("https://example.com/a?x=1");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const pathPiece = parsed.value.path[0];
    const queryPiece = parsed.value.query[0];
    if (!pathPiece || !queryPiece) throw new Error("Missing fixture pieces");

    expect(
      removeLosslessPiece(parsed.value, {
        kind: "path",
        pieceId: "missing" as typeof pathPiece.id,
      }),
    ).toMatchObject({ ok: false, error: { code: "missing-piece" } });
    expect(
      removeLosslessPiece(parsed.value, {
        kind: "query",
        pieceId: pathPiece.id,
      }),
    ).toMatchObject({ ok: false, error: { code: "missing-piece" } });
  });

  it("appends an empty Query Parameter with a `?` marker when none is present", () => {
    const parsed = parseLosslessUrl("https://example.com/a");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const added = addLosslessQueryPiece(
      parsed.value,
      "piece-new" as (typeof parsed.value.query)[number]["id"],
    );
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.serialized).toBe("https://example.com/a?");
    expect(added.value.queryPresent).toBe(true);
    expect(added.value.query).toEqual([
      {
        id: "piece-new",
        separatorBefore: "",
        rawKey: "",
        equalsPresent: false,
        rawValue: "",
      },
    ]);
  });

  it("reuses an existing empty `?` marker when appending", () => {
    const parsed = parseLosslessUrl("https://example.com/a?");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const added = addLosslessQueryPiece(
      parsed.value,
      "piece-new" as (typeof parsed.value.query)[number]["id"],
    );
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.serialized).toBe("https://example.com/a?");
    expect(added.value.query).toHaveLength(1);
    expect(added.value.query[0]?.separatorBefore).toBe("");
  });

  it("appends after existing Query Parameters with an `&` separator and preserves identity", () => {
    const parsed = parseLosslessUrl("https://example.com/a?x=1");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const existing = parsed.value.query[0];
    if (!existing) throw new Error("Missing fixture query piece");

    const added = addLosslessQueryPiece(
      parsed.value,
      "piece-new" as typeof existing.id,
    );
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.serialized).toBe("https://example.com/a?x=1&");
    expect(added.value.query[0]).toBe(existing);
    expect(added.value.query[1]).toEqual({
      id: "piece-new",
      separatorBefore: "&",
      rawKey: "",
      equalsPresent: false,
      rawValue: "",
    });
    expect(added.value.path).toBe(parsed.value.path);
  });

  it("rejects an append that would exceed the 20,000-character URL limit", () => {
    const parsed = parseLosslessUrl(createCapacityFixture());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const added = addLosslessQueryPiece(
      parsed.value,
      "piece-new" as (typeof parsed.value.query)[number]["id"],
    );
    expect(added).toMatchObject({
      ok: false,
      error: { code: "url-capacity-exceeded" },
    });
  });

  it("keeps an absent query value absent for an empty no-op", () => {
    const parsed = parseLosslessUrl("https://example.com/?flag");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const edited = editLosslessToken(parsed.value, {
      pieceId: target.id,
      field: "query-value",
      start: 0,
      end: 0,
      insertedText: "",
    });
    expect(edited.ok && edited.value.serialized).toBe("https://example.com/?flag");
  });

  it("rejects a structured edit beyond the supported capacity", () => {
    const parsed = parseLosslessUrl(createCapacityFixture());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const edited = editLosslessToken(parsed.value, {
      pieceId: target.id,
      field: "query-value",
      start: 0,
      end: 0,
      insertedText: "extra",
    });
    expect(edited.ok).toBe(false);
    if (!edited.ok) {
      expect(edited.error.code).toBe("url-capacity-exceeded");
      expect(edited.error.message).not.toContain(parsed.value.serialized);
    }
  });

  it("refreshes malformed-percent problems after an exact correction", () => {
    const parsed = parseLosslessUrl("https://example.com/?value=%zz");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");
    const edited = editLosslessToken(parsed.value, {
      pieceId: target.id,
      field: "query-value",
      start: 0,
      end: 3,
      insertedText: "%2F",
    });
    expect(edited.ok).toBe(true);
    if (edited.ok) expect(edited.value.problems).toEqual([]);
  });

  it("swaps two adjacent query entries and recomputes only the affected separators", () => {
    const parsed = parseLosslessUrl(
      "https://example.com/a?dup=1&dup=2&&flag=&absent#Frag%2f",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const [first, second, third, fourth, fifth] = parsed.value.query;
    if (!first || !second || !third || !fourth || !fifth) {
      throw new Error("Missing fixture query pieces");
    }

    const moved = moveLosslessQueryPiece(parsed.value, second.id, "up");
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.serialized).toBe(
      "https://example.com/a?dup=2&dup=1&&flag=&absent#Frag%2f",
    );
    expect(moved.value.query.map((piece) => piece.id)).toEqual([
      second.id,
      first.id,
      third.id,
      fourth.id,
      fifth.id,
    ]);
    expect(moved.value.query[0]).toEqual({ ...second, separatorBefore: "" });
    expect(moved.value.query[1]).toEqual({ ...first, separatorBefore: "&" });
    expect(moved.value.query[2]).toBe(third);
    expect(moved.value.query[3]).toBe(fourth);
    expect(moved.value.query[4]).toBe(fifth);
    expect(moved.value.path).toBe(parsed.value.path);
  });

  it("moves a non-boundary pair down without disturbing untouched entries", () => {
    const parsed = parseLosslessUrl("https://example.com/a?a=1&b=2&c=3&d=4");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const [first, second, third, fourth] = parsed.value.query;
    if (!first || !second || !third || !fourth) {
      throw new Error("Missing fixture query pieces");
    }

    const moved = moveLosslessQueryPiece(parsed.value, second.id, "down");
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.serialized).toBe(
      "https://example.com/a?a=1&c=3&b=2&d=4",
    );
    expect(moved.value.query[0]).toBe(first);
    expect(moved.value.query[1]).toBe(third);
    expect(moved.value.query[2]).toBe(second);
    expect(moved.value.query[3]).toBe(fourth);
  });

  it("no-ops at the first-row up boundary and last-row down boundary", () => {
    const parsed = parseLosslessUrl("https://example.com/a?a=1&b=2");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const [first, second] = parsed.value.query;
    if (!first || !second) throw new Error("Missing fixture query pieces");

    const movedUp = moveLosslessQueryPiece(parsed.value, first.id, "up");
    expect(movedUp).toEqual({ ok: true, value: parsed.value });

    const movedDown = moveLosslessQueryPiece(parsed.value, second.id, "down");
    expect(movedDown).toEqual({ ok: true, value: parsed.value });
  });

  it("rejects a move for a piece ID that is no longer present", () => {
    const parsed = parseLosslessUrl("https://example.com/a?x=1");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const target = parsed.value.query[0];
    if (!target) throw new Error("Missing fixture query piece");

    expect(
      moveLosslessQueryPiece(
        parsed.value,
        "missing" as typeof target.id,
        "up",
      ),
    ).toMatchObject({ ok: false, error: { code: "missing-piece" } });
  });

  it("preserves identity and byte-for-byte content at 250+ entry capacity within 100 ms", () => {
    const parsed = parseLosslessUrl(createCapacityFixture());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.query.length).toBeGreaterThanOrEqual(250);
    const target = parsed.value.query[100];
    if (!target) throw new Error("Missing fixture query piece");

    const start = performance.now();
    const moved = moveLosslessQueryPiece(parsed.value, target.id, "down");
    const elapsed = performance.now() - start;
    expect(moved.ok).toBe(true);
    expect(elapsed).toBeLessThan(100);
    if (!moved.ok) return;
    expect(moved.value.query).toHaveLength(parsed.value.query.length);
    expect(new Set(moved.value.query.map((piece) => piece.id)).size).toBe(
      parsed.value.query.length,
    );
    expect(moved.value.query[100]).toEqual(parsed.value.query[101]);
    expect(moved.value.query[101]?.rawKey).toBe(target.rawKey);
    expect(moved.value.query[101]?.rawValue).toBe(target.rawValue);
  });
});
