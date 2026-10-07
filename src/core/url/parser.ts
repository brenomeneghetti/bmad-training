import {
  createIdAllocator,
  err,
  intakeMessage,
  ok,
  type IdAllocator,
  type Result,
  type UrlProblem,
} from "../contracts";
import { convertDomain, convertDomainEdit } from "../idn";
import type {
  DomainEdit,
  LosslessUrl,
  ManagedPieceRemoval,
  PathPiece,
  QueryPiece,
} from "./model";
import { insertRawComponent, type ComponentProfile } from "./codec";
import type { TokenEdit } from "./model";

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
  const pieces: QueryPiece[] = [];
  let start = 0;
  let separatorBefore: QueryPiece["separatorBefore"] = "";
  for (let index = 0; index <= raw.length; index += 1) {
    if (index < raw.length && raw[index] !== "&") continue;
    const entry = raw.slice(start, index);
    const equals = entry.indexOf("=");
    pieces.push({
      id: ids.next(),
      separatorBefore,
      rawKey: equals < 0 ? entry : entry.slice(0, equals),
      equalsPresent: equals >= 0,
      rawValue: equals < 0 ? "" : entry.slice(equals + 1),
    });
    separatorBefore = "&";
    start = index + 1;
  }
  return pieces;
};

const scanMalformedPercent = (input: string): readonly UrlProblem[] => {
  const malformed: UrlProblem[] = [];
  let sourcePosition = 1;
  for (let index = 0; index < input.length; sourcePosition += 1) {
    const codePoint = input.codePointAt(index) ?? 0;
    if (
      input[index] === "%" &&
      !/^[0-9A-Fa-f]{2}$/.test(input.slice(index + 1, index + 3))
    ) {
      malformed.push({
        code: "malformed-percent",
        field: "component",
        message: `Malformed percent text at character ${sourcePosition}.`,
      });
    }
    index += codePoint > 0xffff ? 2 : 1;
  }
  return malformed;
};

export const parseLosslessUrl = (
  input: string,
  ids: IdAllocator = createIdAllocator(),
): Result<LosslessUrl, UrlProblem> => {
  if (input.length === 0) return err(intakeProblem("empty"));
  const characters = Array.from(input);
  if (characters.length > 20_000) {
    return err(
      intakeProblem(
        "invalid-url",
        "Enter a URL containing no more than 20,000 characters.",
      ),
    );
  }
  if (/[\r\n]/.test(input)) {
    return err(intakeProblem("line-break", "Remove line breaks and enter one complete URL."));
  }
  if (
    characters.some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
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

  const schemeEnd = input.indexOf(":");
  let authorityStart = schemeEnd + 1;
  while (input[authorityStart] === "/" || input[authorityStart] === "\\") {
    authorityStart += 1;
  }
  const authorityEndCandidate = input.slice(authorityStart).search(/[/?#\\]/);
  const authorityEnd =
    authorityEndCandidate < 0 ? input.length : authorityStart + authorityEndCandidate;
  const authority = input.slice(authorityStart, authorityEnd);
  const parts = authorityParts(authority);

  let oracle: URL;
  try {
    oracle = new URL(input);
  } catch {
    const rawScheme = input.slice(0, schemeEnd).toLowerCase();
    if (
      (rawScheme === "http" || rawScheme === "https") &&
      parts?.host
        .split(".")
        .some((label) => label.toLowerCase().startsWith("xn--"))
    ) {
      const invalidDomain = convertDomain(parts.host);
      if (!invalidDomain.ok) return invalidDomain;
    }
    return err(intakeProblem("invalid-url"));
  }

  if (oracle.protocol !== "http:" && oracle.protocol !== "https:") {
    return err(intakeProblem("unsupported-scheme"));
  }
  if (!oracle.hostname) return err(intakeProblem("missing-host"));

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

  return ok({
    serialized: input,
    scheme: input.slice(0, schemeEnd),
    authorityMarker: input.slice(schemeEnd + 1, authorityStart),
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
    problems: scanMalformedPercent(input),
  });
};

const reconcileTokens = <T extends { readonly id: string }>(
  previous: readonly T[],
  rescanned: readonly T[],
  keyOf: (piece: T) => string,
  ids: IdAllocator,
): readonly T[] => {
  const previousKeys = previous.map(keyOf);
  const rescannedKeys = rescanned.map(keyOf);
  const previousCount = previous.length;
  const rescannedCount = rescanned.length;

  const matchedPreviousIndexByRescannedIndex = new Map<number, number>();
  let previousIndex = 0;
  let rescannedIndex = 0;
  while (
    previousIndex < previousCount &&
    rescannedIndex < rescannedCount &&
    previousKeys[previousIndex] === rescannedKeys[rescannedIndex]
  ) {
    matchedPreviousIndexByRescannedIndex.set(rescannedIndex, previousIndex);
    previousIndex += 1;
    rescannedIndex += 1;
  }

  // Each bit records a one-unit increase in a suffix LCS row. BigInt computes
  // the row in word-sized batches, rather than allocating a number per cell.
  const masks = new Map<string, bigint>();
  const positions = new Map<string, number[]>();
  for (let index = rescannedIndex; index < rescannedCount; index += 1) {
    const key = rescannedKeys[index]!;
    const bit = 1n << BigInt(rescannedCount - index - 1);
    masks.set(key, (masks.get(key) ?? 0n) | bit);
    const occurrences = positions.get(key) ?? [];
    occurrences.push(index);
    positions.set(key, occurrences);
  }
  const rows: bigint[] = [];
  let row = 0n;
  for (let index = previousCount - 1; index >= previousIndex; index -= 1) {
    const matches = masks.get(previousKeys[index]!) ?? 0n;
    const union = matches | row;
    row = union & ~(union - ((row << 1n) | 1n));
    rows[index] = row;
  }
  const suffixLength = (bits: bigint, width: number) => {
    const hex = (bits & ((1n << BigInt(width)) - 1n)).toString(16);
    const counts = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
    let length = 0;
    for (const digit of hex) length += counts[Number.parseInt(digit, 16)]!;
    return length;
  };
  let remaining = suffixLength(row, rescannedCount - rescannedIndex);
  while (remaining > 0 && previousIndex < previousCount && rescannedIndex < rescannedCount) {
    if (previousKeys[previousIndex] === rescannedKeys[rescannedIndex]) {
      matchedPreviousIndexByRescannedIndex.set(rescannedIndex, previousIndex);
      previousIndex += 1;
      rescannedIndex += 1;
      remaining -= 1;
    } else {
      const occurrences = positions.get(previousKeys[previousIndex]!) ?? [];
      let low = 0;
      let high = occurrences.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (occurrences[middle]! < rescannedIndex) low = middle + 1;
        else high = middle;
      }
      const candidate = occurrences[low];
      // If the earliest new match cannot complete an optimal subsequence,
      // later matches cannot either. Prefer the earliest feasible old token.
      if (candidate !== undefined &&
        suffixLength(rows[previousIndex + 1] ?? 0n, rescannedCount - candidate - 1) === remaining - 1) {
        matchedPreviousIndexByRescannedIndex.set(candidate, previousIndex);
        rescannedIndex = candidate + 1;
        remaining -= 1;
      }
      previousIndex += 1;
    }
  }

  return rescanned.map((piece, index) => {
    const matched = matchedPreviousIndexByRescannedIndex.get(index);
    const id = matched === undefined ? ids.next() : previous[matched]!.id;
    return { ...piece, id };
  });
};

export const reconcileLosslessUrl = (
  previous: LosslessUrl,
  rescanned: LosslessUrl,
  ids: IdAllocator,
): LosslessUrl => {
  if (rescanned.serialized === previous.serialized) {
    return previous;
  }
  const path = reconcileTokens(
    previous.path,
    rescanned.path,
    (piece) => piece.rawSegment,
    ids,
  );
  const query = reconcileTokens(
    previous.query,
    rescanned.query,
    (piece) => `${piece.rawKey}\u0000${piece.equalsPresent ? "1" : "0"}\u0000${piece.rawValue}`,
    ids,
  );
  return {
    ...rescanned,
    domainId: previous.domainId,
    path,
    query,
  };
};

export const serializeLosslessUrl = (url: LosslessUrl): string => url.serialized;

const serializeParts = (url: Omit<LosslessUrl, "serialized">): string =>
  `${url.scheme}:${url.authorityMarker}${url.authorityPrefix}${url.rawHost}${
    url.authoritySuffix
  }${url.path.map((piece) => `${piece.separatorBefore}${piece.rawSegment}`).join("")}${
    url.queryPresent
      ? `?${url.query
          .map(
            (piece) =>
              `${piece.separatorBefore}${piece.rawKey}${
                piece.equalsPresent ? `=${piece.rawValue}` : ""
              }`,
          )
          .join("")}`
      : ""
  }${url.fragmentPresent ? `#${url.rawFragment}` : ""}`;

export const editLosslessToken = (
  url: LosslessUrl,
  edit: TokenEdit,
): Result<LosslessUrl, UrlProblem> => {
  const pathIndex = url.path.findIndex((piece) => piece.id === edit.pieceId);
  const queryIndex = url.query.findIndex((piece) => piece.id === edit.pieceId);
  if (
    (edit.field === "path" && pathIndex < 0) ||
    (edit.field !== "path" && queryIndex < 0)
  ) {
    return err({
      code: "missing-piece",
      field: "component",
      message: "This URL piece is no longer available. Review the current URL and try again.",
    });
  }

  const raw =
    edit.field === "path"
      ? url.path[pathIndex]?.rawSegment ?? ""
      : edit.field === "query-key"
        ? url.query[queryIndex]?.rawKey ?? ""
        : url.query[queryIndex]?.rawValue ?? "";
  const profile: ComponentProfile =
    edit.field === "path"
      ? "path-segment"
      : edit.field === "query-key"
        ? "query-key"
        : "query-value";
  const inserted = insertRawComponent({ raw, ...edit, profile });
  if (!inserted.ok) return inserted;

  const path =
    edit.field === "path"
      ? url.path.map((piece, index) =>
          index === pathIndex ? { ...piece, rawSegment: inserted.value } : piece,
        )
      : url.path;
  const query =
    edit.field === "path"
      ? url.query
      : url.query.map((piece, index) => {
          if (index !== queryIndex) return piece;
          return edit.field === "query-key"
            ? { ...piece, rawKey: inserted.value }
            : {
                ...piece,
                rawValue: inserted.value,
                equalsPresent:
                  piece.equalsPresent || inserted.value !== piece.rawValue,
              };
        });
  const nextWithoutSerialization = {
    ...url,
    path,
    pathRaw: path.map((piece) => `${piece.separatorBefore}${piece.rawSegment}`).join(""),
    query,
    queryRaw: query
      .map(
        (piece) =>
          `${piece.separatorBefore}${piece.rawKey}${
            piece.equalsPresent ? `=${piece.rawValue}` : ""
          }`,
      )
      .join(""),
  };
  const serialized = serializeParts(nextWithoutSerialization);
  if (Array.from(serialized).length > 20_000) {
    return err({
      code: "url-capacity-exceeded",
      field: "component",
      message: "This edit would exceed the 20,000-character URL limit.",
    });
  }
  return ok({
    ...nextWithoutSerialization,
    serialized,
    problems: scanMalformedPercent(serialized),
  });
};

export const removeLosslessPiece = (
  url: LosslessUrl,
  removal: ManagedPieceRemoval,
): Result<LosslessUrl, UrlProblem> => {
  const index =
    removal.kind === "path"
      ? url.path.findIndex((piece) => piece.id === removal.pieceId)
      : url.query.findIndex((piece) => piece.id === removal.pieceId);
  if (index < 0) {
    return err({
      code: "missing-piece",
      field: "component",
      message:
        "This URL piece is no longer available. Review the current URL and try again.",
    });
  }

  const path =
    removal.kind === "path"
      ? url.path.filter((piece) => piece.id !== removal.pieceId)
      : url.path;
  const query =
    removal.kind === "query"
      ? url.query
          .filter((piece) => piece.id !== removal.pieceId)
          .map((piece, pieceIndex) =>
            pieceIndex === 0 && piece.separatorBefore !== ""
              ? { ...piece, separatorBefore: "" as const }
              : piece,
          )
      : url.query;
  const nextWithoutSerialization = {
    ...url,
    path,
    pathRaw: path
      .map((piece) => `${piece.separatorBefore}${piece.rawSegment}`)
      .join(""),
    queryPresent: removal.kind === "query" ? query.length > 0 : url.queryPresent,
    query,
    queryRaw: query
      .map(
        (piece) =>
          `${piece.separatorBefore}${piece.rawKey}${
            piece.equalsPresent ? `=${piece.rawValue}` : ""
          }`,
      )
      .join(""),
  };
  const serialized = serializeParts(nextWithoutSerialization);
  return ok({
    ...nextWithoutSerialization,
    serialized,
    problems: scanMalformedPercent(serialized),
  });
};

export const addLosslessQueryPiece = (
  url: LosslessUrl,
  pieceId: QueryPiece["id"],
): Result<LosslessUrl, UrlProblem> => {
  const piece: QueryPiece = {
    id: pieceId,
    separatorBefore: url.query.length === 0 ? "" : "&",
    rawKey: "",
    equalsPresent: false,
    rawValue: "",
  };
  const query = [...url.query, piece];
  const nextWithoutSerialization = {
    ...url,
    queryPresent: true,
    query,
    queryRaw: query
      .map(
        (queryPiece) =>
          `${queryPiece.separatorBefore}${queryPiece.rawKey}${
            queryPiece.equalsPresent ? `=${queryPiece.rawValue}` : ""
          }`,
      )
      .join(""),
  };
  const serialized = serializeParts(nextWithoutSerialization);
  if (Array.from(serialized).length > 20_000) {
    return err({
      code: "url-capacity-exceeded",
      field: "component",
      message: "This edit would exceed the 20,000-character URL limit.",
    });
  }
  return ok({
    ...nextWithoutSerialization,
    serialized,
    problems: scanMalformedPercent(serialized),
  });
};

export const moveLosslessQueryPiece = (
  url: LosslessUrl,
  pieceId: QueryPiece["id"],
  direction: "up" | "down",
): Result<LosslessUrl, UrlProblem> => {
  const index = url.query.findIndex((piece) => piece.id === pieceId);
  if (index < 0) {
    return err({
      code: "missing-piece",
      field: "component",
      message:
        "This URL piece is no longer available. Review the current URL and try again.",
    });
  }

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= url.query.length) {
    return ok(url);
  }

  const query = url.query.slice();
  [query[index], query[neighborIndex]] = [query[neighborIndex], query[index]];
  const withSeparator = (position: number): QueryPiece => {
    const piece = query[position]!;
    const separatorBefore: QueryPiece["separatorBefore"] =
      position === 0 ? "" : "&";
    return piece.separatorBefore === separatorBefore
      ? piece
      : { ...piece, separatorBefore };
  };
  query[index] = withSeparator(index);
  query[neighborIndex] = withSeparator(neighborIndex);

  const nextWithoutSerialization = {
    ...url,
    query,
    queryRaw: query
      .map(
        (piece) =>
          `${piece.separatorBefore}${piece.rawKey}${
            piece.equalsPresent ? `=${piece.rawValue}` : ""
          }`,
      )
      .join(""),
  };
  const serialized = serializeParts(nextWithoutSerialization);
  return ok({
    ...nextWithoutSerialization,
    serialized,
    problems: scanMalformedPercent(serialized),
  });
};

export const replaceLosslessDomain = (
  url: LosslessUrl,
  edit: DomainEdit,
): Result<LosslessUrl, UrlProblem> => {
  if (edit.pieceId !== url.domainId) {
    return err({
      code: "missing-piece",
      field: "domain",
      message: "This Domain is no longer available. Review the current URL and try again.",
    });
  }
  const converted = convertDomainEdit(
    edit.value,
    edit.field === "domain-ascii" ? "ascii" : "unicode",
  );
  if (!converted.ok) return converted;
  if (converted.value.ascii === url.domain.ascii) return ok(url);
  const nextWithoutSerialization = {
    ...url,
    rawHost: converted.value.serializedHost,
    domain: {
      ascii: converted.value.ascii,
      unicode: converted.value.unicode,
    },
  };
  const serialized = serializeParts(nextWithoutSerialization);
  if (Array.from(serialized).length > 20_000) {
    return err({
      code: "url-capacity-exceeded",
      field: "domain",
      message: "This edit would exceed the 20,000-character URL limit.",
    });
  }
  return ok({
    ...nextWithoutSerialization,
    serialized,
  });
};
