import {
  createIdAllocator,
  err,
  intakeMessage,
  ok,
  type IdAllocator,
  type Result,
  type UrlProblem,
} from "../contracts";
import { convertDomain } from "../idn";
import type { LosslessUrl, PathPiece, QueryPiece } from "./model";

const intakeProblem = (
  code: UrlProblem["code"],
  message = intakeMessage,
): UrlProblem => ({ code, field: "full-url", message });

const authorityParts = (
  authority: string,
): { prefix: string; host: string; suffix: string } | null => {
  const at = authority.lastIndexOf("@");
  const prefix = authority.slice(0, at + 1);
  const hostAndPort = authority.slice(at + 1);
  if (!hostAndPort) return null;

  if (hostAndPort.startsWith("[")) {
    const close = hostAndPort.indexOf("]");
    if (close < 0) return null;
    return {
      prefix,
      host: hostAndPort.slice(0, close + 1),
      suffix: hostAndPort.slice(close + 1),
    };
  }

  const colon = hostAndPort.lastIndexOf(":");
  const hasPort = colon >= 0 && /^[0-9]*$/.test(hostAndPort.slice(colon + 1));
  return {
    prefix,
    host: hasPort ? hostAndPort.slice(0, colon) : hostAndPort,
    suffix: hasPort ? hostAndPort.slice(colon) : "",
  };
};

const scanPath = (raw: string, ids: IdAllocator): readonly PathPiece[] => {
  if (raw === "") return [];
  const pieces: PathPiece[] = [];
  let start = 0;
  let separatorBefore: PathPiece["separatorBefore"] = "";
  if (raw[0] === "/" || raw[0] === "\\") {
    separatorBefore = raw[0];
    start = 1;
  }
  for (let index = start; index < raw.length; index += 1) {
    const character = raw[index];
    if (character !== "/" && character !== "\\") continue;
    pieces.push({
      id: ids.next(),
      separatorBefore,
      rawSegment: raw.slice(start, index),
    });
    separatorBefore = character;
    start = index + 1;
  }
  pieces.push({
    id: ids.next(),
    separatorBefore,
    rawSegment: raw.slice(start),
  });
  return pieces;
};

const scanQuery = (raw: string, ids: IdAllocator): readonly QueryPiece[] => {
  if (raw === "") return [];
  return raw.split("&").map((entry, index) => {
    const equals = entry.indexOf("=");
    return {
      id: ids.next(),
      separatorBefore: index === 0 ? "" : "&",
      rawKey: equals < 0 ? entry : entry.slice(0, equals),
      equalsPresent: equals >= 0,
      rawValue: equals < 0 ? "" : entry.slice(equals + 1),
    };
  });
};

export const parseLosslessUrl = (
  input: string,
  ids: IdAllocator = createIdAllocator(),
): Result<LosslessUrl, UrlProblem> => {
  if (input.length === 0) return err(intakeProblem("empty"));
  if (/[\r\n]/.test(input)) {
    return err(intakeProblem("line-break", "Remove line breaks and enter one complete URL."));
  }
  if (
    [...input].some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code <= 0x1f || code === 0x7f;
    })
  ) {
    return err(
      intakeProblem(
        "control-character",
        "Remove control characters and enter one complete URL.",
      ),
    );
  }
  if (input.trim() !== input) {
    return err(
      intakeProblem(
        "invalid-url",
        "Remove leading or trailing whitespace and enter one complete URL.",
      ),
    );
  }

  let oracle: URL;
  try {
    oracle = new URL(input);
  } catch {
    return err(intakeProblem("invalid-url"));
  }

  if (oracle.protocol !== "http:" && oracle.protocol !== "https:") {
    return err(intakeProblem("unsupported-scheme"));
  }
  if (!oracle.hostname) return err(intakeProblem("missing-host"));

  const schemeEnd = input.indexOf("://");
  if (schemeEnd < 0) return err(intakeProblem("invalid-url"));
  const authorityStart = schemeEnd + 3;
  const authorityEndCandidate = input.slice(authorityStart).search(/[/?#\\]/);
  const authorityEnd =
    authorityEndCandidate < 0 ? input.length : authorityStart + authorityEndCandidate;
  const authority = input.slice(authorityStart, authorityEnd);
  const parts = authorityParts(authority);
  if (!parts?.host) return err(intakeProblem("missing-host"));

  const queryIndex = input.indexOf("?", authorityEnd);
  const fragmentIndex = input.indexOf("#", authorityEnd);
  const pathEndCandidates = [queryIndex, fragmentIndex].filter((value) => value >= 0);
  const pathEnd = pathEndCandidates.length ? Math.min(...pathEndCandidates) : input.length;
  const pathRaw = input.slice(authorityEnd, pathEnd);
  const queryPresent = queryIndex >= 0 && (fragmentIndex < 0 || queryIndex < fragmentIndex);
  const queryEnd = fragmentIndex >= 0 ? fragmentIndex : input.length;
  const queryRaw = queryPresent ? input.slice(queryIndex + 1, queryEnd) : "";
  const fragmentPresent = fragmentIndex >= 0;
  const rawFragment = fragmentPresent ? input.slice(fragmentIndex + 1) : "";

  const domain = convertDomain(oracle.hostname);
  if (!domain.ok) return domain;

  const malformed: string[] = [];
  for (const match of input.matchAll(/%(?![0-9A-Fa-f]{2})/g)) {
    malformed.push(`Malformed percent text at character ${(match.index ?? 0) + 1}.`);
  }

  return ok({
    serialized: input,
    scheme: input.slice(0, schemeEnd),
    authorityPrefix: parts.prefix,
    rawHost: parts.host,
    authoritySuffix: parts.suffix,
    pathRaw,
    path: scanPath(pathRaw, ids),
    queryPresent,
    queryRaw,
    query: scanQuery(queryRaw, ids),
    fragmentPresent,
    rawFragment,
    domainId: ids.next(),
    domain: domain.value,
    problems: malformed,
  });
};

export const serializeLosslessUrl = (url: LosslessUrl): string => url.serialized;
