export type FocusTarget =
  | { readonly kind: "full-url" }
  | { readonly kind: "copy-recovery"; readonly attemptId: number }
  | { readonly kind: "nearest"; readonly candidates: readonly string[] }
  | { readonly kind: "piece"; readonly pieceId: string; readonly order: readonly string[];
      readonly control: "remove" | "up" | "down" | "path" | "query-key" | "query-value" | "domain-unicode" | "domain-ascii" };

export interface FocusEffect {
  readonly kind: "focus";
  readonly effectId: number;
  readonly stateRevision: number;
  readonly epoch: number;
  readonly interaction: number;
  readonly target: FocusTarget;
  readonly status: "pending" | "claimed" | "rejected";
}

export type CopySource = "current" | "last-valid";
export type ClipboardOutcome = "success" | "unavailable" | "throw" | "rejected" | "timeout" | "fenced" | "superseded";
export interface CopyEffect {
  readonly kind: "clipboard";
  readonly effectId: number;
  readonly attemptId: number;
  readonly stateRevision: number;
  readonly epoch: number;
  readonly draftRevision: number;
  readonly interaction: number;
  readonly serialized: string;
  readonly source: CopySource;
  readonly status: "pending" | "claimed" | "rejected";
}
export type SessionEffect = FocusEffect | CopyEffect;
