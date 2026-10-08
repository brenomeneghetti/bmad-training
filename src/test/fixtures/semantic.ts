export const semanticFixture =
  "https://user:pass@faß.de:8443/a%2Fb//tail/?dup=1&dup=2&key&key=&=empty&&encoded=a%26b%3Dc&bad=%zz#frag%23ment";

export const structuredEditFixture =
  "https://User@example.com:044/a%2fb//tail?dup=1&dup=2&flag&empty=#Frag%2f";

export const undoFocusFixture = "https://xn--fa-hia.de/a?x=1&y=2#Frag%2f";
export const undoFocusKinds = [
  "domain-unicode", "domain-ascii", "path", "query-key", "query-value",
  "add", "remove-path", "remove-query", "move-up", "move-down", "full-url",
] as const;

export const structuredEditExpected = {
  pathUnicode:
    "https://User@example.com:044/a%2fb/%F0%9F%98%80%2Ftail?dup=1&dup=2&flag&empty=#Frag%2f",
  duplicate:
    "https://User@example.com:044/a%2fb//tail?dup=1&dup=x%26y&flag&empty=#Frag%2f",
  emptyValue:
    "https://User@example.com:044/a%2fb//tail?dup=1&dup=2&flag=&empty=#Frag%2f",
} as const;

export const removalFixtures = {
  duplicateQuery:
    "https://example.com/a?dup=1&dup=&dup=3#Frag%2f",
  pathAndDuplicates:
    "https://example.com/a%2fb//tail/?dup=1&dup=&dup=3#Frag%2f",
  mixedQuery:
    "https://example.com/a?dup=1&dup=2&&flag=&absent#Frag%2f",
  clearSearchFallback: "https://example.com/a?example.com=1",
  headingFallback: "https://example.com/a?needle=1&other=2",
} as const;

export const idnFixtures = [
  ["faß.de", "xn--fa-hia.de", "faß.de"],
  ["XN--FA-HIA.DE", "xn--fa-hia.de", "faß.de"],
  ["مثال.إختبار", "xn--mgbh0fb.xn--kgbechtv", "مثال.إختبار"],
  ["עברית.example", "xn--5dbqzzl.example", "עברית.example"],
] as const;

export const invalidIdnFixtures = [
  "xn--",
  "a..b",
  "\u0301example.com",
  "a\u200Db.example",
  "abcא.example",
] as const;

export const domainEditFixtures = {
  unicode: "faß.de",
  ascii: "xn--fa-hia.de",
  mixedCaseAscii: "XN--FA-HIA.DE",
  ipv4: "127.0.0.1",
  ipv6: "[::1]",
} as const;

export const unsupportedFixtures = [
  { input: "", code: "empty", message: "Enter a complete HTTP or HTTPS" },
  { input: "example.com/path", code: "invalid-url", message: "Enter a complete HTTP or HTTPS" },
  { input: "/relative", code: "invalid-url", message: "Enter a complete HTTP or HTTPS" },
  { input: "ftp://example.com/file", code: "unsupported-scheme", message: "Enter a complete HTTP or HTTPS" },
  { input: "https:///", code: "invalid-url", message: "Enter a complete HTTP or HTTPS" },
  { input: "https://example.com/a\nb", code: "line-break", message: "Remove line breaks" },
  { input: "https://exa\tmple.com/", code: "control-character", message: "Remove control characters" },
  { input: "https://exa\u0085mple.com/", code: "control-character", message: "Remove control characters" },
  { input: " https://example.com/", code: "invalid-url", message: "Remove leading or trailing whitespace" },
] as const;

export const createCapacityFixture = () => {
  const entries = Array.from(
    { length: 260 },
    (_, index) => `parameter-${index}=${"x".repeat(58)}-${index}`,
  );
  const prefix = "https://example.com/deep/path?";
  const fragment = "#capacity";
  const unpadded = `${prefix}${entries.join("&")}${fragment}`;
  entries[entries.length - 1] += "x".repeat(20_000 - unpadded.length);
  return `${prefix}${entries.join("&")}${fragment}`;
};
