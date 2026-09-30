export interface EffectIntentBoundary {
  readonly effectId: number;
  readonly stateRevision: number;
  readonly kind: "clipboard" | "focus";
}
