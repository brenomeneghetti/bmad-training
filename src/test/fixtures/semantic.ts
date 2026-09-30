export const semanticFixture =
  "https://user:pass@faß.de:8443/a%2Fb//tail/?dup=1&dup=2&key&key=&=empty&&encoded=a%26b%3Dc&bad=%zz#frag%23ment";

export const unsupportedFixtures = [
  "",
  "example.com/path",
  "/relative",
  "ftp://example.com/file",
  "https:///missing-host",
  "https://example.com/a\nb",
  "https://exa\tmple.com/",
  " https://example.com/",
] as const;

export const createCapacityFixture = () => {
  const entries = Array.from(
    { length: 260 },
    (_, index) => `parameter-${index}=${"x".repeat(64)}-${index}`,
  );
  const base = `https://example.com/deep/path?${entries.join("&")}#capacity`;
  return base + "x".repeat(Math.max(0, 20_000 - base.length));
};
