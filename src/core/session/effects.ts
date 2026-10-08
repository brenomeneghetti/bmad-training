export type FocusTarget =
  | { readonly kind: "full-url" }
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
