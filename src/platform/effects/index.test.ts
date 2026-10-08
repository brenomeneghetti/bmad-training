import { expect, it, vi } from "vitest";
import { executeFocusEffects, type FocusEffect } from ".";

it("Story 3.2 effects claim immediately and acknowledge serially exactly once including rejection", () => {
  let effects: readonly FocusEffect[] = [1, 2, 3].map((effectId) => ({
    kind: "focus", effectId, epoch: 1, stateRevision: 1, interaction: 0,
    target: { kind: "full-url" }, status: "pending",
  }));
  const events: string[] = [];
  const port = {
    current: () => effects,
    claim: (id: number) => {
      events.push(`claim-${id}`);
      effects = [{ ...effects[0]!, status: id === 2 ? "rejected" : "claimed" }, ...effects.slice(1)];
    },
    invoke: (effect: FocusEffect) => { events.push(`invoke-${effect.effectId}`); return false; },
    acknowledge: (id: number) => { events.push(`ack-${id}`); effects = effects.slice(1); },
  };
  executeFocusEffects(port);
  executeFocusEffects(port);
  expect(events).toEqual(["claim-1", "invoke-1", "ack-1", "claim-2", "ack-2", "claim-3", "invoke-3", "ack-3"]);
});

it("Story 3.2 effects acknowledge adapter failure without starting the next effect", () => {
  const effect: FocusEffect = { kind: "focus", effectId: 1, epoch: 1, stateRevision: 1,
    interaction: 0, target: { kind: "full-url" }, status: "pending" };
  let effects = [effect, { ...effect, effectId: 2 }];
  const acknowledge = vi.fn(() => { effects = effects.slice(1); });
  expect(() => executeFocusEffects({
    current: () => effects,
    claim: () => { effects[0] = { ...effect, status: "claimed" }; },
    invoke: () => { throw new Error("adapter-failure"); }, acknowledge,
  })).toThrow("adapter-failure");
  expect(acknowledge).toHaveBeenCalledTimes(1);
  expect(effects[0]?.effectId).toBe(2);
});
