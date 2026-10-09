export interface EffectIntentBoundary {
  readonly effectId: number;
  readonly stateRevision: number;
  readonly kind: "clipboard" | "focus";
}

import type { ClipboardOutcome, CopyEffect, FocusEffect, SessionEffect } from "../../core/session/effects";
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
    if (effect.kind !== "focus" || effect.status !== "pending") return;
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

export interface SessionExecutionPort {
  current(): readonly SessionEffect[];
  claim(effect: SessionEffect): void;
  focus(effect: FocusEffect): boolean;
  copy(effect: CopyEffect): Promise<ClipboardOutcome>;
  acknowledge(effect: SessionEffect, outcome: ClipboardOutcome | boolean): void;
  active(): boolean;
  ready?(effect: SessionEffect): boolean;
}

export const createSessionExecutor = () => {
  let running = false;
  return {
    run(port: SessionExecutionPort): void {
      if (running || !port.active()) return;
      const next = () => {
        if (!port.active()) { running = false; return; }
        const effect = port.current()[0];
        if (!effect || effect.status !== "pending") { running = false; return; }
        if (port.ready && !port.ready(effect)) { running = false; return; }
        running = true;
        port.claim(effect);
        const claimed = port.current()[0];
        if (!claimed || claimed.effectId !== effect.effectId || claimed.status === "pending") {
          running = false;
          return;
        }
        const finish = (outcome: ClipboardOutcome | boolean) => {
          port.acknowledge(claimed, outcome);
          next();
        };
        if (claimed.kind === "focus") {
          let filtered = false;
          try { if (claimed.status === "claimed") filtered = port.focus(claimed); }
          finally {
            port.acknowledge(claimed, filtered);
            running = false;
          }
          next();
        } else if (claimed.status === "rejected") finish("superseded");
        else {
          try { void port.copy(claimed).then(finish, () => finish("rejected")); }
          catch { finish("throw"); }
        }
      };
      next();
    },
  };
};
