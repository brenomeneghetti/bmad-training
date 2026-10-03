import { caseFold } from "unicode-case-folding";
import type { LosslessUrl, PathPiece, QueryPiece } from "../../core/url";

export type ManagedPiece =
  | {
      readonly kind: "domain";
      readonly id: LosslessUrl["domainId"];
      readonly sourcePosition: 1;
      readonly sourceTotal: 1;
      readonly unicode: string;
      readonly ascii: string;
    }
  | {
      readonly kind: "path";
      readonly id: PathPiece["id"];
      readonly sourcePosition: number;
      readonly sourceTotal: number;
      readonly piece: PathPiece;
    }
  | {
      readonly kind: "query";
      readonly id: QueryPiece["id"];
      readonly sourcePosition: number;
      readonly sourceTotal: number;
      readonly duplicatePosition: number;
      readonly duplicateTotal: number;
      readonly piece: QueryPiece;
    };

export function buildManagedPieces(snapshot: LosslessUrl): readonly ManagedPiece[] {
  const queryTotals = new Map<string, number>();
  const querySeen = new Map<string, number>();
  for (const piece of snapshot.query) {
    queryTotals.set(piece.rawKey, (queryTotals.get(piece.rawKey) ?? 0) + 1);
  }

  return [
    {
      kind: "domain",
      id: snapshot.domainId,
      sourcePosition: 1,
      sourceTotal: 1,
      unicode: snapshot.domain.unicode,
      ascii: snapshot.domain.ascii,
    },
    ...snapshot.path.map((piece, index) => ({
      kind: "path" as const,
      id: piece.id,
      sourcePosition: index + 1,
      sourceTotal: snapshot.path.length,
      piece,
    })),
    ...snapshot.query.map((piece, index) => {
      const duplicatePosition = (querySeen.get(piece.rawKey) ?? 0) + 1;
      querySeen.set(piece.rawKey, duplicatePosition);
      return {
        kind: "query" as const,
        id: piece.id,
        sourcePosition: index + 1,
        sourceTotal: snapshot.query.length,
        duplicatePosition,
        duplicateTotal: queryTotals.get(piece.rawKey) ?? 1,
        piece,
      };
    }),
  ];
}

export function filterManagedPieces(
  pieces: readonly ManagedPiece[],
  searchTerm: string,
): readonly ManagedPiece[] {
  if (searchTerm === "") return pieces;

  const foldedTerm = caseFold(searchTerm);
  return pieces.filter((piece) => {
    const fields =
      piece.kind === "domain"
        ? [piece.unicode, piece.ascii]
        : piece.kind === "path"
          ? [piece.piece.rawSegment]
          : [piece.piece.rawKey, piece.piece.rawValue];
    return fields.some((field) => caseFold(field).includes(foldedTerm));
  });
}
