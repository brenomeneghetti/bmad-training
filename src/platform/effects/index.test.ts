import { expect, it, vi } from "vitest";
import { executeFocusEffects, type FocusEffect } from ".";
import { createSessionExecutor } from ".";
import { initialSessionState, prepareParse, sessionReducer, type SessionAction } from "../../core/session";

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

it("Story 3.3 shared executor serializes Copy and Undo claims rejects stale heads and ignores duplicates", async () => {
  let state = sessionReducer(initialSessionState, { type: "inputChanged", value: "https://example.com/a" });
  const parse = prepareParse(state);
  state = sessionReducer(sessionReducer(state, parse.start), parse.complete());
  const send = (action: SessionAction) => { state = sessionReducer(state, action); };
  send({ type: "copy" });
  const events: string[] = [];
  let settle!: () => void;
  const executor = createSessionExecutor();
  const port = {
    current: () => state.effects, active: () => true,
    claim: (effect: (typeof state.effects)[number]) => {
      events.push(`claim-${effect.effectId}`);
      send({ type: effect.kind === "focus" ? "claimFocus" : "claimCopy", effectId: effect.effectId });
    },
    focus: () => { events.push("focus"); return false; },
    copy: () => { events.push("copy"); return new Promise<"success">((resolve) => { settle = () => resolve("success"); }); },
    acknowledge: (effect: (typeof state.effects)[number], outcome: boolean | import("../../core/session").ClipboardOutcome) => {
      events.push(`ack-${effect.effectId}`);
      send(effect.kind === "focus" ? { type: "acknowledgeFocus", effectId: effect.effectId }
        : { type: "acknowledgeCopy", effectId: effect.effectId, outcome: typeof outcome === "boolean" ? "superseded" : outcome });
    },
  };
  executor.run(port);
  send({ type: "copy" });
  send({ type: "addQueryPiece" });
  send({ type: "undo", revision: state.revision });
  executor.run(port);
  expect(events).toEqual(["claim-1", "copy"]);
  settle();
  await Promise.resolve();
  expect(events).toEqual(["claim-1", "copy", "ack-1", "claim-2", "ack-2", "claim-3", "focus", "ack-3"]);
  expect(state.effects).toHaveLength(0);
  expect(state.copySuccess).toBeNull();
  executor.run(port);
  expect(events).toHaveLength(8);
});

it("Story 3.3 shared executor stops DOM work and queued writes after unmount", async () => {
  let active = true;
  let effects: import("../../core/session").SessionEffect[] = [1, 2].map((effectId) => ({
    kind: "clipboard", effectId, attemptId: effectId, epoch: 1, stateRevision: 1,
    draftRevision: 0, interaction: 0,
    source: "current", serialized: "private", status: "pending",
  }));
  let settle!: () => void;
  const copy = vi.fn(() => new Promise<"success">((resolve) => { settle = () => resolve("success"); }));
  const acknowledge = vi.fn(() => { effects = effects.slice(1); });
  const executor = createSessionExecutor();
  const port = { current: () => effects, active: () => active,
    claim: () => { effects[0] = { ...effects[0]!, status: "claimed" }; },
    focus: vi.fn(() => false), copy, acknowledge };
  executor.run(port);
  active = false;
  settle();
  await Promise.resolve();
  executor.run(port);
  expect(copy).toHaveBeenCalledTimes(1);
  expect(port.focus).not.toHaveBeenCalled();
  expect(acknowledge).toHaveBeenCalledTimes(1);
});

it("Story 3.4 executor waits for recovery render then claims and acknowledges focus exactly once", async () => {
  let state = sessionReducer(initialSessionState, { type: "inputChanged", value: "https://example.com/a" });
  const parse = prepareParse(state);
  state = sessionReducer(sessionReducer(state, parse.start), parse.complete());
  const send = (action: SessionAction) => { state = sessionReducer(state, action); };
  send({ type: "copy" });
  let rendered = false;
  const events: string[] = [];
  const executor = createSessionExecutor();
  const port = {
    current: () => state.effects, active: () => true,
    ready: (effect: (typeof state.effects)[number]) => effect.kind !== "focus" || rendered,
    claim: (effect: (typeof state.effects)[number]) => {
      events.push(`claim-${effect.effectId}`);
      send({ type: effect.kind === "focus" ? "claimFocus" : "claimCopy", effectId: effect.effectId });
    },
    focus: () => { events.push("focus"); return false; },
    copy: async () => "unavailable" as const,
    acknowledge: (effect: (typeof state.effects)[number], outcome: boolean | import("../../core/session").ClipboardOutcome) => {
      events.push(`ack-${effect.effectId}`);
      send(effect.kind === "focus" ? { type: "acknowledgeFocus", effectId: effect.effectId }
        : { type: "acknowledgeCopy", effectId: effect.effectId, outcome: typeof outcome === "boolean" ? "superseded" : outcome });
    },
  };
  executor.run(port);
  await Promise.resolve();
  expect(events).toEqual(["claim-1", "ack-1"]);
  expect(state.copyRecovery?.serialized).toBe("https://example.com/a");
  executor.run(port);
  expect(events).toHaveLength(2);
  rendered = true;
  executor.run(port);
  executor.run(port);
  expect(events).toEqual(["claim-1", "ack-1", "claim-2", "focus", "ack-2"]);
  expect(state.effects).toHaveLength(0);
});

it("Story 3.4 executor acknowledges obsolete or unmounted recovery without touching DOM", async () => {
  for (const interruption of ["interaction", "mutation", "attempt", "unmount"] as const) {
    let state = sessionReducer(initialSessionState, { type: "inputChanged", value: "https://example.com/a" });
    const parse = prepareParse(state);
    state = sessionReducer(sessionReducer(state, parse.start), parse.complete());
    const send = (action: SessionAction) => { state = sessionReducer(state, action); };
    send({ type: "copy" });
    let rendered = false, active = true;
    let settle!: () => void;
    const focus = vi.fn(() => false);
    const acknowledged: number[] = [];
    const executor = createSessionExecutor();
    const port = {
      current: () => state.effects, active: () => active,
      ready: (effect: (typeof state.effects)[number]) => effect.kind !== "focus" || rendered,
      claim: (effect: (typeof state.effects)[number]) => {
        send({ type: effect.kind === "focus" ? "claimFocus" : "claimCopy", effectId: effect.effectId });
      }, focus,
      copy: () => new Promise<"rejected">((resolve) => { settle = () => resolve("rejected"); }),
      acknowledge: (effect: (typeof state.effects)[number], outcome: boolean | import("../../core/session").ClipboardOutcome) => {
        acknowledged.push(effect.effectId);
        send(effect.kind === "focus" ? { type: "acknowledgeFocus", effectId: effect.effectId }
          : { type: "acknowledgeCopy", effectId: effect.effectId, outcome: typeof outcome === "boolean" ? "superseded" : outcome });
      },
    };
    executor.run(port);
    if (interruption === "unmount") active = false;
    settle();
    await Promise.resolve();
    if (interruption === "interaction") send({ type: "cancelFocus" });
    else if (interruption === "mutation") send({ type: "addQueryPiece" });
    else if (interruption === "attempt") send({ type: "copy" });
    rendered = true;
    executor.run(port);
    expect(focus).not.toHaveBeenCalled();
    expect(acknowledged).toEqual(interruption === "unmount" ? [1] : [1, 2]);
  }
});
