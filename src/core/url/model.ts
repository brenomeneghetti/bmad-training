import type { PieceId, UrlProblem } from "../contracts";
import type { DomainForms } from "../idn";

export interface PathPiece {
  readonly id: PieceId;
  readonly separatorBefore: "" | "/" | "\\";
  readonly rawSegment: string;
}

export interface QueryPiece {
  readonly id: PieceId;
  readonly separatorBefore: "" | "&";
  readonly rawKey: string;
  readonly equalsPresent: boolean;
  readonly rawValue: string;
}

export interface LosslessUrl {
  readonly serialized: string;
  readonly scheme: string;
  readonly authorityMarker: string;
  readonly authorityPrefix: string;
  readonly rawHost: string;
  readonly authoritySuffix: string;
  readonly pathRaw: string;
  readonly path: readonly PathPiece[];
  readonly queryPresent: boolean;
  readonly queryRaw: string;
  readonly query: readonly QueryPiece[];
  readonly fragmentPresent: boolean;
  readonly rawFragment: string;
  readonly domainId: PieceId;
  readonly domain: DomainForms;
  readonly problems: readonly UrlProblem[];
}

export type TokenFieldKind = "path" | "query-key" | "query-value";
export type DomainFieldKind = "domain-unicode" | "domain-ascii";
export type EditableFieldKind = TokenFieldKind | DomainFieldKind;

export interface TokenEdit {
  readonly pieceId: PieceId;
  readonly field: TokenFieldKind;
  readonly start: number;
  readonly end: number;
  readonly insertedText: string;
}

export interface DomainEdit {
  readonly pieceId: PieceId;
  readonly field: DomainFieldKind;
  readonly value: string;
}

export type ManagedPieceRemoval =
  | { readonly kind: "path"; readonly pieceId: PathPiece["id"] }
  | { readonly kind: "query"; readonly pieceId: QueryPiece["id"] };
