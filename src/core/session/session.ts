import { createIdAllocator, type IdAllocator, type UrlProblem } from "../contracts";
import {
  addLosslessQueryPiece,
  editLosslessToken,
  moveLosslessQueryPiece,
  parseLosslessUrl,
  reconcileLosslessUrl,
  removeLosslessPiece,
  replaceLosslessDomain,
  type DomainFieldKind,
  type EditableFieldKind,
  type LosslessUrl,
  type ManagedPieceRemoval,
  type QueryPiece,
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
  readonly field:
    | EditableFieldKind
    | "remove-path"
    | "remove-query"
    | "add-query"
    | "reorder-query"
    | "full-url";
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
  readonly fullUrlFocus: {
    readonly baseline: LosslessUrl;
    readonly lastAccepted: LosslessUrl;
  } | null;
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
  | { readonly type: "structuredEdit"; readonly command: StructuredCommand }
  | { readonly type: "removePiece"; readonly removal: ManagedPieceRemoval }
  | { readonly type: "addQueryPiece" }
  | {
      readonly type: "moveQueryPiece";
      readonly pieceId: QueryPiece["id"];
      readonly direction: "up" | "down";
    }
  | { readonly type: "fullUrlFocusBegin" }
  | {
      readonly type: "closeFullUrlEdit";
      readonly reason: "blur" | "enter" | "mutation";
    };

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
  fullUrlFocus: null,
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

const reconciledTokenRevisions = (
  previous: Readonly<Record<string, number>>,
  previousSnapshot: LosslessUrl,
  reconciled: LosslessUrl,
): Readonly<Record<string, number>> => {
  const retainedIds = new Set([
    ...previousSnapshot.path.map((piece) => piece.id),
    ...previousSnapshot.query.map((piece) => piece.id),
  ]);
  const carryOver = (key: string) => previous[key] ?? 0;
  const domainChange = previousSnapshot.rawHost !== reconciled.rawHost ? 1 : 0;
  return Object.fromEntries([
    [
      structuredFieldKey(reconciled.domainId, "domain-unicode"),
      carryOver(structuredFieldKey(previousSnapshot.domainId, "domain-unicode")) + domainChange,
    ],
    [
      structuredFieldKey(reconciled.domainId, "domain-ascii"),
      carryOver(structuredFieldKey(previousSnapshot.domainId, "domain-ascii")) + domainChange,
    ],
    ...reconciled.path.map((piece) => {
      const key = structuredFieldKey(piece.id, "path");
      return [key, retainedIds.has(piece.id) ? carryOver(key) : 0];
    }),
    ...reconciled.query.flatMap((piece) => {
      const keyKey = structuredFieldKey(piece.id, "query-key");
      const valueKey = structuredFieldKey(piece.id, "query-value");
      const retained = retainedIds.has(piece.id);
      return [
        [keyKey, retained ? carryOver(keyKey) : 0],
        [valueKey, retained ? carryOver(valueKey) : 0],
      ];
    }),
  ]);
};

const reconciledStructuredDrafts = (
  drafts: Readonly<Record<string, StructuredDraft>>,
  previous: LosslessUrl,
  reconciled: LosslessUrl,
): Readonly<Record<string, StructuredDraft>> => {
  const retainedIds = new Set([
    reconciled.domainId,
    ...reconciled.path.map((piece) => piece.id),
    ...reconciled.query.map((piece) => piece.id),
  ]);
  const next: Record<string, StructuredDraft> = {};
  for (const [key, draft] of Object.entries(drafts)) {
    if (previous.rawHost !== reconciled.rawHost &&
      (key === structuredFieldKey(previous.domainId, "domain-unicode") ||
        key === structuredFieldKey(previous.domainId, "domain-ascii"))) continue;
    const pieceId = key.slice(0, key.lastIndexOf(":"));
    if (retainedIds.has(pieceId as LosslessUrl["domainId"])) {
      next[key] = draft;
    }
  }
  return next;
};

const closeFullUrlEditIfOpen = (
  state: SessionState,
  reason: "blur" | "enter" | "mutation",
): SessionState => {
  void reason;
  const focus = state.fullUrlFocus;
  if (!focus && state.pendingInput === null) return state;
  const closed = {
    ...state,
    fullUrlFocus: null,
    pendingInput: null,
    generation: state.generation + 1,
    phase: state.phase === "parsing"
      ? state.snapshot ? "editing" as const : "no-session" as const
      : state.phase,
  };
  if (!focus) return closed;
  if (focus.baseline === focus.lastAccepted) return closed;
  return {
    ...closed,
    history: [
      ...state.history,
      {
        before: focus.baseline,
        after: focus.lastAccepted,
        pieceId: focus.baseline.domainId,
        field: "full-url",
      },
    ],
  };
};

export const structuredUpdateMessage = (state: SessionState): string =>
  state.input === state.snapshot?.serialized
    ? "Full URL and Structured View updated."
    : "Last Valid URL and Structured View updated. Draft unchanged.";

const structuredPublication = (state: SessionState, snapshot: LosslessUrl) => {
  const preservesDraft = state.input !== state.snapshot?.serialized;
  return {
    phase: preservesDraft
      ? state.phase === "parsing" ? "editing" as const : state.phase
      : "active" as const,
    input: preservesDraft ? state.input : snapshot.serialized,
    snapshot,
    lastValidSnapshot: snapshot,
    problem: preservesDraft ? state.problem : null,
    pendingInput: null,
    generation: state.generation + 1,
  };
};

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
        fullUrlFocus: state.fullUrlFocus ?? (state.snapshot
          ? { baseline: state.snapshot, lastAccepted: state.snapshot }
          : null),
        generation: state.generation + 1,
        pendingInput: null,
        problem: null,
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
      if (state.fullUrlFocus) {
        const previousAccepted = state.fullUrlFocus.lastAccepted;
        let mintedCount = 0;
        const allocator = createIdAllocator(state.nextPieceId);
        const trackingAllocator: IdAllocator = {
          next: () => {
            mintedCount += 1;
            return allocator.next();
          },
        };
        const reconciled = reconcileLosslessUrl(
          previousAccepted,
          action.result.value,
          trackingAllocator,
        );
        if (reconciled === previousAccepted) {
          return {
            ...state,
            phase: "active",
            pendingInput: null,
            problem: null,
            structuredProblem: null,
            structuredSuccess: null,
          };
        }
        return {
          ...state,
          phase: "active",
          snapshot: reconciled,
          lastValidSnapshot: reconciled,
          fullUrlFocus: { ...state.fullUrlFocus, lastAccepted: reconciled },
          pendingInput: null,
          problem: null,
          structuredProblem: null,
          structuredSuccess: null,
          structuredDrafts: reconciledStructuredDrafts(
            state.structuredDrafts,
            previousAccepted,
            reconciled,
          ),
          tokenRevisions: reconciledTokenRevisions(
            state.tokenRevisions,
            previousAccepted,
            reconciled,
          ),
          revision: state.revision + 1,
          nextPieceId: state.nextPieceId + mintedCount,
        };
      }
      return {
        ...state,
        phase: "active",
        snapshot: action.result.value,
        lastValidSnapshot: action.result.value,
        fullUrlFocus: {
          baseline: action.result.value,
          lastAccepted: action.result.value,
        },
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
    case "removePiece": {
      if (!state.snapshot) return state;

      const sourceIndex =
        action.removal.kind === "path"
          ? state.snapshot.path.findIndex(
              (piece) => piece.id === action.removal.pieceId,
            )
          : state.snapshot.query.findIndex(
              (piece) => piece.id === action.removal.pieceId,
            );
      const result = removeLosslessPiece(state.snapshot, action.removal);
      if (!result.ok) {
        return {
          ...state,
          structuredProblem: result.error,
          structuredSuccess: null,
        };
      }

      const field =
        action.removal.kind === "path" ? "remove-path" : "remove-query";
      const structuredDrafts = { ...state.structuredDrafts };
      const tokenRevisions = { ...state.tokenRevisions };
      const fields =
        action.removal.kind === "path"
          ? (["path"] as const)
          : (["query-key", "query-value"] as const);
      for (const editableField of fields) {
        const key = structuredFieldKey(action.removal.pieceId, editableField);
        delete structuredDrafts[key];
        delete tokenRevisions[key];
      }
      const label =
        action.removal.kind === "path" ? "Path Segment" : "Query Parameter";
      const closed = closeFullUrlEditIfOpen(state, "mutation");

      return {
        ...closed,
        ...structuredPublication(closed, result.value),
        structuredProblem: null,
        structuredSuccess: `${label} ${sourceIndex + 1} removed. ${structuredUpdateMessage(state)}`,
        structuredDrafts,
        tokenRevisions,
        revision: state.revision + 1,
        history: [
          ...closed.history,
          {
            before: state.snapshot,
            after: result.value,
            pieceId: action.removal.pieceId,
            field,
          },
        ],
      };
    }
    case "addQueryPiece": {
      if (!state.snapshot) return state;

      const pieceId = createIdAllocator(state.nextPieceId).next();
      const result = addLosslessQueryPiece(state.snapshot, pieceId);
      if (!result.ok) {
        return {
          ...state,
          structuredProblem: result.error,
          structuredSuccess: null,
        };
      }

      const position = state.snapshot.query.length + 1;
      const closed = closeFullUrlEditIfOpen(state, "mutation");

      return {
        ...closed,
        ...structuredPublication(closed, result.value),
        structuredProblem: null,
        structuredSuccess: `Query Parameter ${position} added. ${structuredUpdateMessage(state)}`,
        tokenRevisions: {
          ...state.tokenRevisions,
          [structuredFieldKey(pieceId, "query-key")]: 0,
          [structuredFieldKey(pieceId, "query-value")]: 0,
        },
        nextPieceId: state.nextPieceId + 1,
        revision: state.revision + 1,
        history: [
          ...closed.history,
          {
            before: state.snapshot,
            after: result.value,
            pieceId,
            field: "add-query",
          },
        ],
      };
    }
    case "moveQueryPiece": {
      if (!state.snapshot) return state;

      const sourceIndex = state.snapshot.query.findIndex(
        (piece) => piece.id === action.pieceId,
      );
      const result = moveLosslessQueryPiece(
        state.snapshot,
        action.pieceId,
        action.direction,
      );
      if (!result.ok) {
        return {
          ...state,
          structuredProblem: result.error,
          structuredSuccess: null,
        };
      }
      if (result.value === state.snapshot) {
        return state;
      }

      const destinationIndex =
        action.direction === "up" ? sourceIndex - 1 : sourceIndex + 1;
      const moved = result.value.query[destinationIndex];
      const total = result.value.query.length;
      const identity =
        moved && moved.equalsPresent
          ? `${moved.rawKey}=${moved.rawValue}`
          : (moved?.rawKey ?? "");
      const closed = closeFullUrlEditIfOpen(state, "mutation");

      return {
        ...closed,
        ...structuredPublication(closed, result.value),
        structuredProblem: null,
        structuredSuccess: `Query Parameter "${identity}" moved from position ${
          sourceIndex + 1
        } to position ${destinationIndex + 1} of ${total}. ${structuredUpdateMessage(state)}`,
        revision: state.revision + 1,
        history: [
          ...closed.history,
          {
            before: state.snapshot,
            after: result.value,
            pieceId: action.pieceId,
            field: "reorder-query",
          },
        ],
      };
    }
    case "structuredEdit": {
      if (!state.snapshot) return state;
      const key = structuredFieldKey(
        action.command.pieceId,
        action.command.field,
      );
      const currentRevision = state.tokenRevisions[key];
      const isDomain =
        action.command.field === "domain-unicode" ||
        action.command.field === "domain-ascii";
      if (isDomain) {
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
              ...state.structuredDrafts,
              [key]: {
                value: action.command.value,
                problem: structuredProblem,
              },
            },
          };
        }
        if (Array.from(action.command.value).length > 20_000) {
          const structuredProblem: UrlProblem = {
            code: "url-capacity-exceeded",
            field: "domain",
            message: "This edit would exceed the 20,000-character URL limit.",
          };
          return {
            ...state,
            structuredProblem,
            structuredSuccess: null,
            structuredDrafts: {
              ...state.structuredDrafts,
              [key]: {
                value: action.command.value,
                problem: structuredProblem,
              },
            },
          };
        }
        const domainDrafts = { ...state.structuredDrafts };
        delete domainDrafts[
          structuredFieldKey(
            state.snapshot.domainId,
            action.command.field === "domain-unicode"
              ? "domain-ascii"
              : "domain-unicode",
          )
        ];
        const result = replaceLosslessDomain(state.snapshot, action.command);
        if (!result.ok) {
          const preservedDrafts =
            result.error.code === "url-capacity-exceeded"
              ? state.structuredDrafts
              : domainDrafts;
          return {
            ...state,
            structuredProblem: result.error,
            structuredSuccess: null,
            structuredDrafts: {
              ...preservedDrafts,
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
          if (
            !hadDomainDraft &&
            state.structuredProblem === null &&
            state.structuredSuccess === null
          ) {
            return state;
          }
          return {
            ...state,
            structuredProblem: null,
            structuredSuccess: null,
            structuredDrafts,
          };
        }
        const closed = closeFullUrlEditIfOpen(state, "mutation");
        return {
          ...closed,
          ...structuredPublication(closed, result.value),
          structuredProblem: null,
          structuredSuccess: `Domain synchronized at revision ${
            state.revision + 1
          }: Unicode Domain, ASCII/Punycode Domain, and ${
            state.input === state.snapshot.serialized
              ? "Full URL updated."
              : "Last Valid URL updated. Draft unchanged."
          }`,
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
            ...closed.history,
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
        return { ...state, structuredProblem, structuredSuccess: null };
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
          structuredSuccess: null,
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
      const closed = closeFullUrlEditIfOpen(state, "mutation");
      return {
        ...closed,
        ...structuredPublication(closed, result.value),
        structuredProblem: null,
        structuredSuccess: null,
        structuredDrafts,
        tokenRevisions: {
          ...state.tokenRevisions,
          [key]: currentRevision + 1,
        },
        revision: state.revision + 1,
        history: [
          ...closed.history,
          {
            before: state.snapshot,
            after: result.value,
            pieceId: action.command.pieceId,
            field: action.command.field,
          },
        ],
      };
    }
    case "fullUrlFocusBegin": {
      if (!state.snapshot || state.fullUrlFocus) return state;
      return {
        ...state,
        fullUrlFocus: {
          baseline: state.snapshot,
          lastAccepted: state.snapshot,
        },
      };
    }
    case "closeFullUrlEdit":
      return closeFullUrlEditIfOpen(state, action.reason);
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
