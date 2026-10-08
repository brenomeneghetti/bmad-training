export interface EffectIntentBoundary {
  readonly effectId: number;
  readonly stateRevision: number;
  readonly kind: "clipboard" | "focus";
}

import type { FocusEffect } from "../../core/session/effects";
export type { FocusEffect, FocusTarget } from "../../core/session/effects";

export interface EffectExecutionPort {
  current(): readonly FocusEffect[];
  claim(effectId: number): void;
  invoke(effect: FocusEffect): boolean;
  acknowledge(effectId: number, filtered: boolean): void;
}

export const executeFocusEffects = (port: EffectExecutionPort): void => {
  while (port.current().length > 0) {
    const effect = port.current()[0]!;
    if (effect.status !== "pending") return;
    port.claim(effect.effectId);
    const claimed = port.current()[0];
    if (!claimed || claimed.effectId !== effect.effectId || claimed.status === "pending") return;
    let filtered = false;
    try {
      if (claimed.status === "claimed") filtered = port.invoke(claimed);
    } finally {
      port.acknowledge(effect.effectId, filtered);
    }
  }
};
