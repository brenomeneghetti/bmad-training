import { createIdAllocator, type UrlProblem } from "../contracts";
import {
  editLosslessToken,
  parseLosslessUrl,
  replaceLosslessDomain,
  type DomainFieldKind,
  type EditableFieldKind,
  type LosslessUrl,
  type TokenEdit,
} from "../url";

export interface StructuredEditCommand extends TokenEdit {
  readonly tokenRevision: number;
}

export interface DomainEditCommand {
  readonly pieceId: LosslessUrl["domainId"];
  readonly field: DomainFieldKind;
  readonly tokenRevision: number;
  readonly value: string;
}

export type StructuredCommand = StructuredEditCommand | DomainEditCommand;

export interface StructuredDraft {
  readonly value: string;
  readonly problem: UrlProblem;
}

export interface MutationEntry {
  readonly before: LosslessUrl;
  readonly after: LosslessUrl;
  readonly pieceId: StructuredCommand["pieceId"];
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
  readonly structuredSuccess: string | null;
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
  | { readonly type: "structuredEdit"; readonly command: StructuredCommand };

export const initialSessionState: SessionState = {
  phase: "no-session",
  input: "",
  snapshot: null,
  lastValidSnapshot: null,
  problem: null,
  structuredProblem: null,
  structuredSuccess: null,
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
  pieceId: StructuredCommand["pieceId"],
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

const correctionFromDraft = (
  raw: string,
  desired: string,
  command: StructuredEditCommand,
): StructuredEditCommand => {
  let start = 0;
  while (
    start < raw.length &&
    start < desired.length &&
    raw[start] === desired[start]
  ) {
    start += 1;
  }

  let rawEnd = raw.length;
  let desiredEnd = desired.length;
  while (
    rawEnd > start &&
    desiredEnd > start &&
    raw[rawEnd - 1] === desired[desiredEnd - 1]
  ) {
    rawEnd -= 1;
    desiredEnd -= 1;
  }

  const splitsPercentTriplet = (value: string, boundary: number) => {
    for (
      let percent = Math.max(0, boundary - 2);
      percent < Math.min(boundary, value.length);
      percent += 1
    ) {
      if (
        value[percent] === "%" &&
        /^[0-9A-Fa-f]{2}$/.test(value.slice(percent + 1, percent + 3)) &&
        boundary > percent &&
        boundary < percent + 3
      ) {
        return percent;
      }
    }
    return -1;
  };
  const startTriplet = splitsPercentTriplet(raw, start);
  if (startTriplet >= 0) {
    start = startTriplet;
  }
  const endTriplet = splitsPercentTriplet(raw, rawEnd);
  if (endTriplet >= 0) {
    const expandedEnd = endTriplet + 3;
    desiredEnd += expandedEnd - rawEnd;
    rawEnd = expandedEnd;
  }
  const splitsSurrogatePair = (value: string, boundary: number) =>
    boundary > 0 &&
    boundary < value.length &&
    value.charCodeAt(boundary - 1) >= 0xd800 &&
    value.charCodeAt(boundary - 1) <= 0xdbff &&
    value.charCodeAt(boundary) >= 0xdc00 &&
    value.charCodeAt(boundary) <= 0xdfff;
  if (splitsSurrogatePair(raw, start)) {
    start -= 1;
  }
  if (splitsSurrogatePair(raw, rawEnd)) {
    rawEnd += 1;
    desiredEnd += 1;
  }

  return {
    ...command,
    start,
    end: rawEnd,
    insertedText: desired.slice(start, desiredEnd),
  };
};

const revisionsFor = (snapshot: LosslessUrl): Readonly<Record<string, number>> =>
  Object.fromEntries([
    [structuredFieldKey(snapshot.domainId, "domain-unicode"), 0],
    [structuredFieldKey(snapshot.domainId, "domain-ascii"), 0],
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
        phase:
          state.snapshot && action.value === state.snapshot.serialized
            ? "active"
            : state.snapshot
              ? "editing"
              : "no-session",
        input: action.value,
        generation: state.generation + 1,
        pendingInput: null,
        problem: null,
        structuredProblem: null,
        structuredSuccess: null,
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
        structuredSuccess: null,
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
          structuredSuccess: null,
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
        structuredSuccess: null,
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
      if (
        state.phase !== "active" ||
        state.input !== state.snapshot.serialized
      ) {
        return {
          ...state,
          structuredProblem: {
            code: "structured-edit-unavailable",
            field: "component",
            message:
              "Apply the current Full URL text before editing structured fields.",
          },
        };
      }
      const key = structuredFieldKey(
        action.command.pieceId,
        action.command.field,
      );
      const currentRevision = state.tokenRevisions[key];
      const isDomain =
        action.command.field === "domain-unicode" ||
        action.command.field === "domain-ascii";
      if (isDomain) {
        const domainDrafts = { ...state.structuredDrafts };
        delete domainDrafts[
          structuredFieldKey(
            state.snapshot.domainId,
            action.command.field === "domain-unicode"
              ? "domain-ascii"
              : "domain-unicode",
          )
        ];
        if (action.command.pieceId !== state.snapshot.domainId) {
          return {
            ...state,
            structuredProblem: {
              code: "missing-piece",
              field: "domain",
              message:
                "This Domain is no longer available. Review the current URL and try again.",
            },
            structuredSuccess: null,
          };
        }
        if (
          currentRevision === undefined ||
          action.command.tokenRevision !== currentRevision
        ) {
          const structuredProblem: UrlProblem = {
            code: "stale-token-revision",
            field: "domain",
            message:
              "This Domain changed before the edit arrived. Review it and try again.",
          };
          return {
            ...state,
            structuredProblem,
            structuredSuccess: null,
            structuredDrafts: {
              ...domainDrafts,
              [key]: {
                value: action.command.value,
                problem: structuredProblem,
              },
            },
          };
        }
        if (action.command.value.length > 20_000) {
          return {
            ...state,
            structuredProblem: {
              code: "url-capacity-exceeded",
              field: "domain",
              message: "This edit would exceed the 20,000-character URL limit.",
            },
            structuredSuccess: null,
            structuredDrafts: {
              ...domainDrafts,
              [key]: {
                value: action.command.value,
                problem: {
                  code: "url-capacity-exceeded",
                  field: "domain",
                  message: "This edit would exceed the 20,000-character URL limit.",
                },
              },
            },
          };
        }
        const result = replaceLosslessDomain(state.snapshot, action.command);
        if (!result.ok) {
          return {
            ...state,
            structuredProblem: result.error,
            structuredSuccess: null,
            structuredDrafts: {
              ...domainDrafts,
              [key]: { value: action.command.value, problem: result.error },
            },
          };
        }
        const structuredDrafts = { ...state.structuredDrafts };
        delete structuredDrafts[
          structuredFieldKey(state.snapshot.domainId, "domain-unicode")
        ];
        delete structuredDrafts[
          structuredFieldKey(state.snapshot.domainId, "domain-ascii")
        ];
        if (result.value.serialized === state.snapshot.serialized) {
          const hadDomainDraft =
            state.structuredDrafts[
              structuredFieldKey(state.snapshot.domainId, "domain-unicode")
            ] !== undefined ||
            state.structuredDrafts[
              structuredFieldKey(state.snapshot.domainId, "domain-ascii")
            ] !== undefined;
          if (!hadDomainDraft && state.structuredProblem === null) return state;
          return {
            ...state,
            structuredProblem: null,
            structuredSuccess: null,
            structuredDrafts,
          };
        }
        return {
          ...state,
          input: result.value.serialized,
          snapshot: result.value,
          lastValidSnapshot: result.value,
          problem: null,
          structuredProblem: null,
          structuredSuccess: `Domain synchronized at revision ${
            state.revision + 1
          }: Unicode Domain, ASCII/Punycode Domain, and Full URL updated.`,
          structuredDrafts,
          tokenRevisions: {
            ...state.tokenRevisions,
            [structuredFieldKey(state.snapshot.domainId, "domain-unicode")]:
              (state.tokenRevisions[
                structuredFieldKey(state.snapshot.domainId, "domain-unicode")
              ] ?? 0) + 1,
            [structuredFieldKey(state.snapshot.domainId, "domain-ascii")]:
              (state.tokenRevisions[
                structuredFieldKey(state.snapshot.domainId, "domain-ascii")
              ] ?? 0) + 1,
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
      const tokenCommand = action.command as StructuredEditCommand;
      const raw = rawFieldValue(state.snapshot, tokenCommand);
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
        tokenCommand.tokenRevision !== currentRevision
      ) {
        const structuredProblem: UrlProblem = {
          code: "stale-token-revision",
          field: "component",
          message: "This field changed before the edit arrived. Review it and try again.",
        };
        return {
          ...state,
          structuredProblem,
          structuredSuccess: null,
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
      if (tokenCommand.insertedText.length > 20_000) {
        return {
          ...state,
          structuredProblem: {
            code: "url-capacity-exceeded",
            field: "component",
            message: "This edit would exceed the 20,000-character URL limit.",
          },
        };
      }
      const editCommand = existingDraft
        ? correctionFromDraft(
            raw,
            draftValue(existingDraft.value, tokenCommand),
            tokenCommand,
          )
        : tokenCommand;
      const result = editLosslessToken(state.snapshot, editCommand);
      if (!result.ok) {
        return {
          ...state,
          structuredProblem: result.error,
          structuredSuccess: null,
          structuredDrafts: {
            ...state.structuredDrafts,
            [key]: {
              value: draftValue(existingDraft?.value ?? raw, tokenCommand),
              problem: result.error,
            },
          },
        };
      }

      const structuredDrafts = { ...state.structuredDrafts };
      delete structuredDrafts[key];
      if (result.value.serialized === state.snapshot.serialized) {
        return {
          ...state,
          structuredProblem: null,
          structuredSuccess: null,
          structuredDrafts,
        };
      }
      return {
        ...state,
        phase: "active",
        input: result.value.serialized,
        snapshot: result.value,
        lastValidSnapshot: result.value,
        problem: null,
        structuredProblem: null,
        structuredSuccess: null,
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
