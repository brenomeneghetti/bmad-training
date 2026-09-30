import { describe, expect, it } from "vitest";
import { convertDomain } from ".";

describe("TR46 domain conversion", () => {
  it.each([
    ["faß.de", "xn--fa-hia.de", "faß.de"],
    ["XN--FA-HIA.DE", "xn--fa-hia.de", "faß.de"],
    ["مثال.إختبار", "xn--mgbh0fb.xn--kgbechtv", "مثال.إختبار"],
    ["עברית.example", "xn--5dbqzzl.example", "עברית.example"],
  ])("converts %s deterministically", (input, ascii, unicode) => {
    const result = convertDomain(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ ascii, unicode });
  });

  it.each(["xn--", "a..b", "\u0301example.com"])("rejects invalid domain %s", (input) => {
    expect(convertDomain(input).ok).toBe(false);
  });
});
