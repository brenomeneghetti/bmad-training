export const semanticFixture =
  "https://user:pass@faß.de:8443/a%2Fb//tail/?dup=1&dup=2&key&key=&=empty&&encoded=a%26b%3Dc&bad=%zz#frag%23ment";

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
    (_, index) => `parameter-${index}=${"x".repeat(64)}-${index}`,
  );
  const base = `https://example.com/deep/path?${entries.join("&")}#capacity`;
  return base + "x".repeat(Math.max(0, 20_000 - base.length));
};
