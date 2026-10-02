import { describe, expect, it } from "vitest";
import {
  idnFixtures,
  invalidIdnFixtures,
} from "../../test/fixtures/semantic";
import { convertDomain } from ".";

describe("TR46 domain conversion", () => {
  it.each(idnFixtures)("converts %s deterministically", (input, ascii, unicode) => {
    const result = convertDomain(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ ascii, unicode });
  });

  it.each(invalidIdnFixtures)("rejects invalid domain %s", (input) => {
    expect(convertDomain(input).ok).toBe(false);
  });
});
