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

export type EditableFieldKind = "path" | "query-key" | "query-value";

export interface TokenEdit {
  readonly pieceId: PieceId;
  readonly field: EditableFieldKind;
  readonly start: number;
  readonly end: number;
  readonly insertedText: string;
}
