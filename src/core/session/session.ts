import { createIdAllocator, type UrlProblem } from "../contracts";
import { parseLosslessUrl, type LosslessUrl } from "../url";

export type SessionPhase =
  | "no-session"
  | "editing"
  | "parsing"
  | "active"
  | "invalid-intake";

export interface SessionState {
  readonly phase: SessionPhase;
  readonly input: string;
  readonly snapshot: LosslessUrl | null;
  readonly problem: UrlProblem | null;
  readonly generation: number;
  readonly epoch: number;
  readonly revision: number;
  readonly nextPieceId: number;
  readonly pendingInput: string | null;
}

export type SessionAction =
  | { readonly type: "inputChanged"; readonly value: string }
  | { readonly type: "parseStarted"; readonly input: string; readonly generation: number }
  | {
      readonly type: "parseCompleted";
      readonly input: string;
      readonly generation: number;
      readonly epoch: number;
      readonly revision: number;
      readonly result: ReturnType<typeof parseLosslessUrl>;
    };

export const initialSessionState: SessionState = {
  phase: "no-session",
  input: "",
  snapshot: null,
  problem: null,
  generation: 0,
  epoch: 0,
  revision: 0,
  nextPieceId: 1,
  pendingInput: null,
};

export const sessionReducer = (
  state: SessionState,
  action: SessionAction,
): SessionState => {
  switch (action.type) {
    case "inputChanged":
      return {
        ...state,
        phase: state.snapshot ? "editing" : "no-session",
        input: action.value,
        generation: state.generation + 1,
        pendingInput: null,
        problem: null,
      };
    case "parseStarted":
      return {
        ...state,
        phase: "parsing",
        generation: action.generation,
        pendingInput: action.input,
        problem: null,
      };
    case "parseCompleted": {
      if (
        action.generation !== state.generation ||
        action.input !== state.pendingInput ||
        action.epoch !== state.epoch ||
        action.revision !== state.revision
      ) {
        return state;
      }
      if (!action.result.ok) {
        return {
          ...state,
          phase: "invalid-intake",
          pendingInput: null,
          problem: action.result.error,
        };
      }
      return {
        ...state,
        phase: "active",
        snapshot: action.result.value,
        pendingInput: null,
        problem: null,
        epoch: state.epoch + 1,
        revision: state.revision + 1,
        nextPieceId:
          state.nextPieceId +
          1 +
          action.result.value.path.length +
          action.result.value.query.length,
      };
    }
  }
};

export const prepareParse = (state: SessionState) => {
  const generation = state.generation + 1;
  const input = state.input;
  const epoch = state.epoch;
  const revision = state.revision;
  return {
    start: { type: "parseStarted", input, generation } as const,
    complete: () =>
      ({
        type: "parseCompleted",
        input,
        generation,
        epoch,
        revision,
        result: parseLosslessUrl(input, createIdAllocator(state.nextPieceId)),
      }) as const,
  };
};
