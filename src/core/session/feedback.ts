export type FeedbackClass = "committed" | "search" | "synchronization" | "summary";
export interface Outcome {
  readonly id: number;
  readonly message: string;
  readonly kind: FeedbackClass;
  readonly enqueued: number;
  readonly promoted?: boolean;
}
export interface FeedbackState {
  readonly now: number;
  readonly nextId: number;
  readonly current: (Outcome & { readonly started: number; readonly presented?: true }) | null;
  readonly pending: readonly Outcome[];
  readonly history: readonly Outcome[];
  readonly validation: { readonly id: number; readonly message: string } | null;
  readonly validationPending: { readonly message: string; readonly due: number } | null;
  readonly composing: boolean;
}
export const initialFeedback: FeedbackState = {
  now: 0, nextId: 1, current: null, pending: [], history: [],
  validation: null, validationPending: null, composing: false,
};

const priority = (outcome: Outcome) =>
  outcome.kind === "committed" || outcome.kind === "summary";

export function promoteDelayedFeedback(state: FeedbackState): FeedbackState {
  let delay = state.current ? Math.max(0, 2_000 - (state.now - state.current.started)) : 0;
  const exceeds = state.pending.filter(priority).some((item) => {
    const late = item.kind === "committed" && state.now + delay - item.enqueued > 6_000;
    delay += 2_000;
    return late;
  }) || (state.current?.kind === "committed" && !state.current.promoted &&
    state.current.started - state.current.enqueued > 6_000);
  if (!exceeds) return state;
  const promoted = [
    ...(state.current?.kind === "committed" && !state.current.promoted ? [state.current] : []),
    ...state.pending.filter((item) => item.kind === "committed"),
  ];
  const summary: Outcome = { id: state.nextId, kind: "summary", enqueued: state.now,
    message: `${promoted.length} operation outcomes added to feedback history.` };
  return {
    ...state, nextId: state.nextId + 1,
    current: state.current?.kind === "committed" ? { ...state.current, promoted: true } : state.current,
    pending: [...state.pending.filter((item) => item.kind !== "committed"), summary],
    history: [...state.history, ...promoted.map((item) => ({ ...item, promoted: true }))]
      .sort((a, b) => a.id - b.id),
  };
}

export function advanceFeedback(state: FeedbackState, now: number): FeedbackState {
  if (now <= state.now &&
    !(state.validationPending && !state.composing && state.validationPending.due <= state.now) &&
    !(state.pending.length && (!state.current || state.now - state.current.started >= 2_000))) return state;
  let next = { ...state, now: Math.max(state.now, now) };
  if (next.validationPending && !next.composing && next.validationPending.due <= next.now) {
    next = { ...next, validation: { id: next.nextId, message: next.validationPending.message },
      nextId: next.nextId + 1, validationPending: null };
  }
  next = promoteDelayedFeedback(next);
  if (next.pending.length && (!next.current || next.now - next.current.started >= 2_000)) {
    const index = next.pending.findIndex(priority);
    const selected = index < 0 ? 0 : index;
    next = { ...next, current: { ...next.pending[selected], started: next.now },
      pending: next.pending.filter((_, i) => i !== selected) };
  }
  return promoteDelayedFeedback(next);
}

export function enqueueFeedback(state: FeedbackState, message: string, kind: FeedbackClass): FeedbackState {
  let next = advanceFeedback(state, state.now);
  const outcome: Outcome = { id: next.nextId, message, kind, enqueued: next.now };
  next = { ...next, nextId: next.nextId + 1 };
  if (!next.current || (next.pending.length === 0 && next.now - next.current.started >= 2_000)) {
    return { ...next, current: { ...outcome, started: next.now } };
  }
  const coalesced = kind === "search" || kind === "synchronization"
    ? next.pending.filter((item) => item.kind !== kind || next.now - item.enqueued > 300)
    : next.pending;
  return promoteDelayedFeedback({ ...next, pending: [...coalesced, outcome] });
}

export function announceValidation(state: FeedbackState, message: string): FeedbackState {
  if (state.composing) return state;
  return { ...state, nextId: state.nextId + 1,
    validation: { id: state.nextId, message }, validationPending: null };
}
