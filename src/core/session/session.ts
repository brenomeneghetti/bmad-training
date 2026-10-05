import { createIdAllocator, type UrlProblem } from "../contracts";
import {
  editLosslessToken,
  parseLosslessUrl,
  type EditableFieldKind,
  type LosslessUrl,
  type TokenEdit,
} from "../url";

export interface StructuredEditCommand extends TokenEdit {
  readonly tokenRevision: number;
}

export interface StructuredDraft {
  readonly value: string;
  readonly problem: UrlProblem;
}

export interface MutationEntry {
  readonly before: LosslessUrl;
  readonly after: LosslessUrl;
  readonly pieceId: StructuredEditCommand["pieceId"];
  readonly field: EditableFieldKind;
}

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
  readonly lastValidSnapshot: LosslessUrl | null;
  readonly problem: UrlProblem | null;
  readonly structuredProblem: UrlProblem | null;
  readonly structuredDrafts: Readonly<Record<string, StructuredDraft>>;
  readonly tokenRevisions: Readonly<Record<string, number>>;
  readonly history: readonly MutationEntry[];
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
    }
  | { readonly type: "structuredEdit"; readonly command: StructuredEditCommand };

export const initialSessionState: SessionState = {
  phase: "no-session",
  input: "",
  snapshot: null,
  lastValidSnapshot: null,
  problem: null,
  structuredProblem: null,
  structuredDrafts: {},
  tokenRevisions: {},
  history: [],
  generation: 0,
  epoch: 0,
  revision: 0,
  nextPieceId: 1,
  pendingInput: null,
};

export const structuredFieldKey = (
  pieceId: StructuredEditCommand["pieceId"],
  field: EditableFieldKind,
) => `${pieceId}:${field}`;

const rawFieldValue = (
  snapshot: LosslessUrl,
  command: StructuredEditCommand,
): string | null => {
  if (command.field === "path") {
    return (
      snapshot.path.find((piece) => piece.id === command.pieceId)?.rawSegment ??
      null
    );
  }
  const piece = snapshot.query.find((candidate) => candidate.id === command.pieceId);
  if (!piece) return null;
  return command.field === "query-key" ? piece.rawKey : piece.rawValue;
};

const draftValue = (raw: string, command: StructuredEditCommand): string => {
  if (
    !Number.isInteger(command.start) ||
    !Number.isInteger(command.end) ||
    command.start < 0 ||
    command.end < command.start ||
    command.end > raw.length
  ) {
    return raw;
  }
  return `${raw.slice(0, command.start)}${command.insertedText}${raw.slice(command.end)}`;
};

const revisionsFor = (snapshot: LosslessUrl): Readonly<Record<string, number>> =>
  Object.fromEntries([
    ...snapshot.path.map((piece) => [structuredFieldKey(piece.id, "path"), 0]),
    ...snapshot.query.flatMap((piece) => [
      [structuredFieldKey(piece.id, "query-key"), 0],
      [structuredFieldKey(piece.id, "query-value"), 0],
    ]),
  ]);

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
        structuredProblem: null,
      };
    case "parseStarted":
      if (
        action.generation <= state.generation ||
        action.input !== state.input
      ) {
        return state;
      }
      return {
        ...state,
        phase: "parsing",
        generation: action.generation,
        pendingInput: action.input,
        problem: null,
        structuredProblem: null,
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
        lastValidSnapshot: action.result.value,
        pendingInput: null,
        problem: null,
        structuredProblem: null,
        structuredDrafts: {},
        tokenRevisions: revisionsFor(action.result.value),
        history: [],
        epoch: state.epoch + 1,
        revision: state.revision + 1,
        nextPieceId:
          state.nextPieceId +
          1 +
          action.result.value.path.length +
          action.result.value.query.length,
      };
    }
    case "structuredEdit": {
      if (!state.snapshot) return state;
      const key = structuredFieldKey(
        action.command.pieceId,
        action.command.field,
      );
      const currentRevision = state.tokenRevisions[key];
      const raw = rawFieldValue(state.snapshot, action.command);
      if (raw === null) {
        const structuredProblem: UrlProblem = {
          code: "missing-piece",
          field: "component",
          message:
            "This URL piece is no longer available. Review the current URL and try again.",
        };
        return { ...state, structuredProblem };
      }
      if (
        currentRevision === undefined ||
        action.command.tokenRevision !== currentRevision
      ) {
        const structuredProblem: UrlProblem = {
          code: "stale-token-revision",
          field: "component",
          message: "This field changed before the edit arrived. Review it and try again.",
        };
        return {
          ...state,
          structuredProblem,
          structuredDrafts: {
            ...state.structuredDrafts,
            [key]: {
              value: raw,
              problem: structuredProblem,
            },
          },
        };
      }

      const existingDraft = state.structuredDrafts[key];
      const editCommand = existingDraft
        ? {
            ...action.command,
            start: 0,
            end: raw.length,
            insertedText: draftValue(existingDraft.value, action.command),
          }
        : action.command;
      const result = editLosslessToken(state.snapshot, editCommand);
      if (!result.ok) {
        return {
          ...state,
          structuredProblem: result.error,
          structuredDrafts: {
            ...state.structuredDrafts,
            [key]: {
              value: draftValue(existingDraft?.value ?? raw, action.command),
              problem: result.error,
            },
          },
        };
      }

      const structuredDrafts = { ...state.structuredDrafts };
      delete structuredDrafts[key];
      return {
        ...state,
        phase: "active",
        input: result.value.serialized,
        snapshot: result.value,
        lastValidSnapshot: result.value,
        problem: null,
        structuredProblem: null,
        structuredDrafts,
        tokenRevisions: {
          ...state.tokenRevisions,
          [key]: currentRevision + 1,
        },
        revision: state.revision + 1,
        history: [
          ...state.history,
          {
            before: state.snapshot,
            after: result.value,
            pieceId: action.command.pieceId,
            field: action.command.field,
          },
        ],
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
