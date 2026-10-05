import { err, ok, type Result, type UrlProblem } from "../contracts";

export type ComponentProfile = "path-segment" | "query-key" | "query-value";

export interface ComponentInsertion {
  readonly raw: string;
  readonly start: number;
  readonly end: number;
  readonly insertedText: string;
  readonly profile: ComponentProfile;
}

const problem = (
  code: UrlProblem["code"],
  message: string,
): UrlProblem => ({ code, field: "component", message });

const isHex = (value: string) => /^[0-9A-Fa-f]$/.test(value);

const splitsPercentTriplet = (raw: string, boundary: number): boolean => {
  for (
    let percent = Math.max(0, boundary - 2);
    percent < Math.min(boundary, raw.length);
    percent += 1
  ) {
    if (
      raw[percent] === "%" &&
      isHex(raw[percent + 1] ?? "") &&
      isHex(raw[percent + 2] ?? "") &&
      boundary > percent &&
      boundary < percent + 3
    ) {
      return true;
    }
  }
  return false;
};

const splitsSurrogatePair = (raw: string, boundary: number): boolean => {
  if (boundary <= 0 || boundary >= raw.length) return false;
  const before = raw.charCodeAt(boundary - 1);
  const after = raw.charCodeAt(boundary);
  return (
    before >= 0xd800 &&
    before <= 0xdbff &&
    after >= 0xdc00 &&
    after <= 0xdfff
  );
};

const allowedAscii = (character: string, profile: ComponentProfile): boolean => {
  if (/^[A-Za-z0-9\-._~]$/.test(character)) return true;
  if ("!$()*+,;:@".includes(character)) return true;
  if (profile === "path-segment" && character === "'") return true;
  if (profile === "path-segment" && (character === "&" || character === "=")) {
    return true;
  }
  if (profile !== "path-segment" && (character === "/" || character === "?")) {
    return true;
  }
  if (profile === "query-value" && character === "=") return true;
  return false;
};

const encodeInsertedText = (
  insertedText: string,
  profile: ComponentProfile,
): Result<string, UrlProblem> => {
  let encoded = "";
  for (let index = 0; index < insertedText.length; ) {
    const character = insertedText[index] ?? "";
    if (character === "%") {
      const triplet = insertedText.slice(index, index + 3);
      if (!/^%[0-9A-Fa-f]{2}$/.test(triplet)) {
        return err(
          problem(
            "invalid-percent-edit",
            "Enter percent text as a complete triplet such as %2F.",
          ),
        );
      }
      encoded += triplet;
      index += 3;
      continue;
    }

    const codePoint = insertedText.codePointAt(index);
    if (codePoint === undefined) break;
    const scalar = String.fromCodePoint(codePoint);
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      return err(
        problem("invalid-edit-range", "Complete the Unicode character before editing."),
      );
    }
    if (codePoint < 0x80 && allowedAscii(scalar, profile)) {
      encoded += scalar;
    } else {
      encoded += Array.from(new TextEncoder().encode(scalar), (byte) =>
        `%${byte.toString(16).toUpperCase().padStart(2, "0")}`,
      ).join("");
    }
    index += scalar.length;
  }
  return ok(encoded);
};

export const insertRawComponent = ({
  raw,
  start,
  end,
  insertedText,
  profile,
}: ComponentInsertion): Result<string, UrlProblem> => {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    end > raw.length
  ) {
    return err(
      problem("invalid-edit-range", "The selected text range is no longer available."),
    );
  }
  if (splitsSurrogatePair(raw, start) || splitsSurrogatePair(raw, end)) {
    return err(
      problem("invalid-edit-range", "Select the complete Unicode character before replacing it."),
    );
  }
  if (splitsPercentTriplet(raw, start) || splitsPercentTriplet(raw, end)) {
    return err(
      problem(
        "split-percent-triplet",
        "Select the complete percent triplet before replacing it.",
      ),
    );
  }
  if (insertedText.length > 20_000) {
    return err(
      problem(
        "url-capacity-exceeded",
        "This edit would exceed the 20,000-character URL limit.",
      ),
    );
  }
  const encoded = encodeInsertedText(insertedText, profile);
  if (!encoded.ok) return encoded;
  return ok(`${raw.slice(0, start)}${encoded.value}${raw.slice(end)}`);
};
