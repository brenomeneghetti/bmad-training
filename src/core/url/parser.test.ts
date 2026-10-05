import { describe, expect, it } from "vitest";
import {
  createCapacityFixture,
  semanticFixture,
  unsupportedFixtures,
} from "../../test/fixtures/semantic";
import { editLosslessToken, parseLosslessUrl, serializeLosslessUrl } from ".";

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
});
