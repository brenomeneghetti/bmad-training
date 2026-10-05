import { describe, expect, it } from "vitest";
import {
  domainEditFixtures,
  idnFixtures,
  invalidIdnFixtures,
} from "../../test/fixtures/semantic";
import { convertDomain, convertDomainEdit } from ".";

describe("TR46 domain conversion", () => {
  it.each(idnFixtures)("converts %s deterministically", (input, ascii, unicode) => {
    const result = convertDomain(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ ascii, unicode });
  });

  it.each(invalidIdnFixtures)("rejects invalid domain %s", (input) => {
    expect(convertDomain(input).ok).toBe(false);
  });

  it("converts complete Unicode and mixed-case Punycode edits bidirectionally", () => {
    expect(convertDomainEdit(domainEditFixtures.unicode, "unicode")).toEqual({
      ok: true,
      value: {
        ascii: "xn--fa-hia.de",
        unicode: "faß.de",
        serializedHost: "xn--fa-hia.de",
      },
    });
    expect(
      convertDomainEdit(domainEditFixtures.mixedCaseAscii, "ascii"),
    ).toEqual({
      ok: true,
      value: {
        ascii: "xn--fa-hia.de",
        unicode: "faß.de",
        serializedHost: "xn--fa-hia.de",
      },
    });
  });

  it.each([domainEditFixtures.ipv4, domainEditFixtures.ipv6])(
    "preserves valid IP host edits: %s",
    (input) => {
      const result = convertDomainEdit(input, "ascii");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.serializedHost).toBe(input);
    },
  );

  it.each(["", "a..b", "xn--", "a\u200Db.example", "abcא.example"])(
    "rejects malformed, joiner, bidi, and non-ASCII ASCII-form edits: %s",
    (input) => expect(convertDomainEdit(input, "ascii").ok).toBe(false),
  );
});
