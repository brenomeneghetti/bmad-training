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
import type { ClipboardOutcome, CopyEffect, CopySource, SessionEffect, FocusTarget } from "./effects";
import { advanceFeedback, announceValidation, enqueueFeedback, initialFeedback, promoteDelayedFeedback, type FeedbackState } from "./feedback";

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
  readonly direction?: "up" | "down";
  readonly before: LosslessUrl;
  readonly beforeTokenRevisions: Readonly<Record<string, number>>;
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
  readonly feedback: FeedbackState;
  readonly effects: readonly SessionEffect[];
  readonly latestCopyAttempt: number;
  readonly copySuccess: string | null;
  readonly copyFailure: { readonly source: CopySource; readonly outcome: ClipboardOutcome } | null;
  readonly copyRecovery: {
    readonly serialized: string;
    readonly source: CopySource;
    readonly epoch: number;
    readonly stateRevision: number;
    readonly attemptId: number;
  } | null;
  readonly draftRevision: number;
  readonly nextEffectId: number;
  readonly lastAcknowledgedEffectId: number;
  readonly interaction: number;
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
    readonly baselineTokenRevisions: Readonly<Record<string, number>>;
    readonly lastAccepted: LosslessUrl;
  } | null;
}

export type SessionAction = (
  | { readonly type: "feedbackTick" }
  | { readonly type: "feedbackPresented"; readonly id: number }
  | { readonly type: "feedbackSearch"; readonly message: string }
  | { readonly type: "feedbackComposition"; readonly composing: boolean }
  | { readonly type: "validateField"; readonly key: string }
  | { readonly type: "copy" }
  | { readonly type: "claimCopy"; readonly effectId: number }
  | { readonly type: "acknowledgeCopy"; readonly effectId: number; readonly outcome: ClipboardOutcome }
  | { readonly type: "cancelFocus" }
  | { readonly type: "claimFocus"; readonly effectId: number }
  | { readonly type: "acknowledgeFocus"; readonly effectId: number; readonly filtered?: boolean }
  | { readonly type: "undo"; readonly revision: number }
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
    }) & { readonly now?: number };

export const initialSessionState: SessionState = {
  feedback: initialFeedback,
  effects: [],
  latestCopyAttempt: 0,
  copySuccess: null,
  copyFailure: null,
  copyRecovery: null,
  draftRevision: 0,
  nextEffectId: 1,
  lastAcknowledgedEffectId: 0,
  interaction: 0,
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
        beforeTokenRevisions: focus.baselineTokenRevisions,
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
    : "Last Valid URL and Structured View updated. Draft URL is unchanged.";

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

export const canUndo = (state: SessionState): boolean =>
  state.history.length > 0 ||
  (state.fullUrlFocus !== null &&
    state.fullUrlFocus.baseline !== state.fullUrlFocus.lastAccepted);

const fieldValues = (snapshot: LosslessUrl): Readonly<Record<string, string>> =>
  Object.fromEntries([
    [structuredFieldKey(snapshot.domainId, "domain-unicode"), snapshot.rawHost],
    [structuredFieldKey(snapshot.domainId, "domain-ascii"), snapshot.rawHost],
    ...snapshot.path.map((piece) => [structuredFieldKey(piece.id, "path"), piece.rawSegment]),
    ...snapshot.query.flatMap((piece) => [
      [structuredFieldKey(piece.id, "query-key"), piece.rawKey],
      [structuredFieldKey(piece.id, "query-value"), `${piece.equalsPresent}:${piece.rawValue}`],
    ]),
  ]);

const undoLabels: Record<MutationEntry["field"], string> = {
  "domain-unicode": "Unicode Domain edit",
  "domain-ascii": "ASCII/Punycode Domain edit",
  path: "Path Segment edit",
  "query-key": "Query Parameter key edit",
  "query-value": "Query Parameter value edit",
  "remove-path": "Path Segment removal",
  "remove-query": "Query Parameter removal",
  "add-query": "Query Parameter addition",
  "reorder-query": "Query Parameter reorder",
  "full-url": "Full URL edit",
};

const undoTarget = (entry: MutationEntry): FocusTarget => {
  if (entry.field === "full-url") return { kind: "full-url" };
  const order = [entry.before.domainId, ...entry.before.path.map((piece) => piece.id),
    ...entry.before.query.map((piece) => piece.id)];
  if (entry.field === "add-query") {
    const afterOrder = [entry.after.domainId, ...entry.after.path.map((piece) => piece.id),
      ...entry.after.query.map((piece) => piece.id)];
    const index = afterOrder.indexOf(entry.pieceId);
    const candidates = [...afterOrder.slice(index + 1), ...afterOrder.slice(0, index).reverse()]
      .filter((id) => order.includes(id));
    return { kind: "nearest", candidates };
  }
  return {
    kind: "piece", pieceId: entry.pieceId, order,
    control: entry.field === "remove-path" || entry.field === "remove-query" ? "remove"
      : entry.field === "reorder-query" ? entry.direction ?? "up" : entry.field,
  };
};

const sessionTransition = (
  state: SessionState,
  action: SessionAction,
): SessionState => {
  switch (action.type) {
    case "feedbackTick":
    case "feedbackPresented":
    case "feedbackSearch":
    case "feedbackComposition":
    case "validateField":
      return state;
    case "copy": {
      if (!state.snapshot) return state;
      return { ...state, latestCopyAttempt: state.latestCopyAttempt + 1,
        copySuccess: null, copyFailure: null, copyRecovery: null,
        nextEffectId: state.nextEffectId + 1,
        effects: [...state.effects, {
          kind: "clipboard", effectId: state.nextEffectId,
          attemptId: state.latestCopyAttempt + 1, epoch: state.epoch,
          stateRevision: state.revision, serialized: state.snapshot.serialized,
          draftRevision: state.draftRevision, interaction: state.interaction,
          source: copySource(state), status: "pending",
        }] };
    }
    case "claimCopy": {
      const effect = state.effects[0];
      if (!effect || effect.kind !== "clipboard" || effect.effectId !== action.effectId ||
        effect.status !== "pending") return state;
      return { ...state, effects: [{ ...effect,
        status: currentCopy(state, effect) ? "claimed" : "rejected" }, ...state.effects.slice(1)] };
    }
    case "acknowledgeCopy": {
      const effect = state.effects[0];
      if (!effect || effect.kind !== "clipboard" || effect.effectId !== action.effectId ||
        effect.status === "pending") return state;
      const current = effect.status === "claimed" && currentCopy(state, effect);
      const failed = current && action.outcome !== "success" && action.outcome !== "superseded";
      return { ...state, effects: [...state.effects.slice(1), ...(failed ? [{
          kind: "focus" as const, effectId: state.nextEffectId, epoch: effect.epoch,
          stateRevision: effect.stateRevision, interaction: effect.interaction,
          target: { kind: "copy-recovery" as const, attemptId: effect.attemptId },
          status: "pending" as const,
        }] : [])], lastAcknowledgedEffectId: effect.effectId,
        nextEffectId: state.nextEffectId + (failed ? 1 : 0),
        copyRecovery: failed ? {
          serialized: effect.serialized, source: effect.source, epoch: effect.epoch,
          stateRevision: effect.stateRevision, attemptId: effect.attemptId,
        } : state.copyRecovery,
        copySuccess: current && action.outcome === "success"
          ? effect.source === "current" ? "Current URL copied."
            : "Last Valid URL copied; Draft URL is unchanged." : state.copySuccess,
        copyFailure: failed
          ? { source: effect.source, outcome: action.outcome } : state.copyFailure };
    }
    case "cancelFocus":
      return { ...state, interaction: state.interaction + 1 };
    case "claimFocus": {
      const effect = state.effects[0];
      if (!effect || effect.kind !== "focus" || effect.effectId !== action.effectId || effect.status !== "pending") return state;
      const target = effect.target;
      const mountedIds = new Set(state.snapshot
        ? [state.snapshot.domainId, ...state.snapshot.path.map((piece) => piece.id),
            ...state.snapshot.query.map((piece) => piece.id)] as readonly string[]
        : []);
      const valid = effect.epoch === state.epoch && effect.stateRevision === state.revision &&
        effect.interaction === state.interaction && state.snapshot !== null &&
        (target.kind === "copy-recovery"
          ? state.copyRecovery?.attemptId === target.attemptId &&
            state.latestCopyAttempt === target.attemptId
          : target.kind === "full-url" || (target.kind === "piece"
          ? mountedIds.has(target.pieceId) && target.order.every((id) => mountedIds.has(id))
          : target.candidates.every((id) => mountedIds.has(id))));
      return { ...state, effects: [{ ...effect, status: valid ? "claimed" : "rejected" }, ...state.effects.slice(1)] };
    }
    case "acknowledgeFocus": {
      const effect = state.effects[0];
      if (!effect || effect.kind !== "focus" || effect.effectId !== action.effectId || effect.status === "pending") return state;
      return { ...state, effects: state.effects.slice(1), lastAcknowledgedEffectId: effect.effectId,
        structuredSuccess: action.filtered && effect.status === "claimed"
          ? `${state.structuredSuccess} Restored target is hidden by Search. Focus moved to the nearest visible field or Full URL; Search is unchanged.`
          : state.structuredSuccess };
    }
    case "undo": {
      if (action.revision !== state.revision || !canUndo(state)) return state;
      const closed = closeFullUrlEditIfOpen(state, "mutation");
      const entry = closed.history.at(-1)!;
      const previousValues = fieldValues(state.snapshot!);
      const restoredValues = fieldValues(entry.before);
      const structuredDrafts = Object.fromEntries(
        Object.entries(state.structuredDrafts).filter(([key]) =>
          restoredValues[key] !== undefined &&
          restoredValues[key] === previousValues[key] &&
          entry.beforeTokenRevisions[key] === state.tokenRevisions[key]),
      );
      const structuredProblem = Object.values(structuredDrafts)
        .find((draft) => draft.problem === state.structuredProblem)?.problem ?? null;
      const preservesDraft = state.input !== state.snapshot!.serialized;
      return {
        ...closed,
        ...structuredPublication(closed, entry.before),
        tokenRevisions: entry.beforeTokenRevisions,
        structuredDrafts,
        structuredProblem,
        structuredSuccess: `Undid: ${undoLabels[entry.field]}. ${
          preservesDraft
            ? "Last Valid URL and Structured View updated; Draft URL is unchanged."
            : "Full URL and Structured View updated."
        }`,
        history: closed.history.slice(0, -1),
        revision: state.revision + 1,
        effects: [...state.effects, {
          kind: "focus", effectId: state.nextEffectId, epoch: state.epoch,
          stateRevision: state.revision + 1, interaction: state.interaction,
          target: undoTarget(entry), status: "pending",
        }],
        nextEffectId: state.nextEffectId + 1,
      };
    }
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
          ? { baseline: state.snapshot, baselineTokenRevisions: state.tokenRevisions, lastAccepted: state.snapshot }
          : null),
        generation: state.generation + 1,
        pendingInput: null,
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
      const intakeTokenRevisions = revisionsFor(action.result.value);
      return {
        ...state,
        phase: "active",
        snapshot: action.result.value,
        lastValidSnapshot: action.result.value,
        fullUrlFocus: {
          baseline: action.result.value,
          baselineTokenRevisions: intakeTokenRevisions,
          lastAccepted: action.result.value,
        },
        pendingInput: null,
        problem: null,
        structuredProblem: null,
        structuredSuccess: null,
        structuredDrafts: {},
        tokenRevisions: intakeTokenRevisions,
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
            beforeTokenRevisions: state.tokenRevisions,
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
            beforeTokenRevisions: state.tokenRevisions,
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
      const total = result.value.query.length;
      const closed = closeFullUrlEditIfOpen(state, "mutation");

      return {
        ...closed,
        ...structuredPublication(closed, result.value),
        structuredProblem: null,
        structuredSuccess: `Moved Query Parameter ${sourceIndex + 1} of ${total} to position ${destinationIndex + 1} of ${total}. ${structuredUpdateMessage(state)}`,
        revision: state.revision + 1,
        history: [
          ...closed.history,
          {
            before: state.snapshot,
            beforeTokenRevisions: state.tokenRevisions,
            after: result.value,
            pieceId: action.pieceId,
            field: "reorder-query",
            direction: action.direction,
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
              : "Last Valid URL updated. Draft URL is unchanged."
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
              beforeTokenRevisions: state.tokenRevisions,
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
        const problem: UrlProblem = {
          code: "url-capacity-exceeded",
          field: "component",
          message: "This edit would exceed the 20,000-character URL limit.",
        };
        return {
          ...state,
          structuredProblem: problem,
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
            beforeTokenRevisions: state.tokenRevisions,
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
          baselineTokenRevisions: state.tokenRevisions,
          lastAccepted: state.snapshot,
        },
      };
    }
    case "closeFullUrlEdit":
      return closeFullUrlEditIfOpen(state, action.reason);
  }
};

const validationErrors = (state: SessionState): Readonly<Record<string, string>> => ({
  ...(state.problem ? { "full-url": state.snapshot
    ? `Draft URL is not valid. Structured View changes use the Last Valid URL. ${state.problem.message}`
    : state.problem.message } : {}),
  ...Object.fromEntries(Object.entries(state.structuredDrafts).map(([key, draft]) => [key, draft.problem.message])),
});

export const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  let next = sessionTransition(state, action);
  if (next.revision !== state.revision || next.epoch !== state.epoch ||
    copySource(next) !== copySource(state) ||
    (action.type === "inputChanged" && next.input !== state.input)) {
    next = { ...next, copySuccess: null, copyFailure: null, copyRecovery: null };
  }
  if (action.type === "inputChanged" && next.input !== state.input) {
    next = { ...next, draftRevision: state.draftRevision + 1 };
  }
  if (next !== state && ["inputChanged", "structuredEdit", "removePiece", "addQueryPiece",
    "moveQueryPiece", "fullUrlFocusBegin"].includes(action.type)) {
    next = { ...next, interaction: state.interaction + 1 };
  }
  let feedback = advanceFeedback(action.type === "feedbackComposition"
    ? { ...state.feedback, composing: action.composing } : state.feedback,
    action.now ?? state.feedback.now);
  if (action.type === "feedbackPresented" && feedback.current?.id === action.id &&
    !feedback.current.presented) {
    feedback = { ...feedback, current: { ...feedback.current, started: feedback.now, presented: true } };
    feedback = promoteDelayedFeedback(feedback);
  }
  const errors = validationErrors(next);
  const previousErrors = validationErrors(state);
  const changedErrors = Object.keys(errors).filter((key) => errors[key] !== previousErrors[key]);
  const changedInvalidInput = Object.keys(errors).some((key) =>
    key === "full-url" ? next.input !== state.input :
      next.structuredDrafts[key]?.value !== state.structuredDrafts[key]?.value);
  if (changedErrors.length || (feedback.validationPending && changedInvalidInput)) {
    feedback = { ...feedback, validationPending: {
      message: Object.values(errors).join(" "), due: feedback.now + 300,
    } };
  } else if (Object.keys(errors).length === 0 &&
    (feedback.validation !== null || feedback.validationPending !== null)) {
    feedback = { ...feedback, validation: null, validationPending: null };
  } else if (Object.keys(previousErrors).some((key) => !(key in errors))) {
    feedback = { ...feedback, validation: null, validationPending: feedback.validationPending
      ? { message: Object.values(errors).join(" "), due: feedback.now + 300 } : null };
  }
  const explicitKey = action.type === "validateField" ? action.key :
    action.type === "closeFullUrlEdit" && action.reason !== "mutation" ? "full-url" : null;
  if (explicitKey && errors[explicitKey]) feedback = announceValidation(feedback, errors[explicitKey]);
  if (action.type === "feedbackSearch") {
    feedback = enqueueFeedback(feedback, action.message, "search");
  }
  if (next !== state && action.type === "parseCompleted" && action.result.ok &&
    next.pendingInput === null && action.generation === state.generation &&
    action.input === state.pendingInput && action.epoch === state.epoch && action.revision === state.revision) {
    feedback = enqueueFeedback(feedback, `URL parsed. ${1 + next.snapshot!.path.length + next.snapshot!.query.length} Managed Pieces available.`,
      state.snapshot ? "synchronization" : "committed");
  }
  if (state.fullUrlFocus && next.fullUrlFocus === null &&
    state.fullUrlFocus.baseline !== state.fullUrlFocus.lastAccepted) {
    feedback = enqueueFeedback(feedback,
      `Full URL edit committed. ${structuredUpdateMessage(state)}`, "committed");
  }
  if (next.revision !== state.revision && action.type !== "parseCompleted") {
    const message = next.structuredSuccess ??
      `Edited piece ${action.type === "structuredEdit" ? action.command.pieceId : ""}. ${structuredUpdateMessage(state)}`;
    feedback = enqueueFeedback(feedback, message, "committed");
  }
  if (action.type === "acknowledgeCopy" && next.copySuccess && next !== state) {
    feedback = enqueueFeedback(feedback, next.copySuccess, "committed");
  }
  if (action.type === "acknowledgeFocus" && action.filtered && next.structuredSuccess !== state.structuredSuccess) {
    feedback = enqueueFeedback(feedback,
      "Restored target is hidden by Search. Focus moved to the nearest visible field or Full URL; Search is unchanged.",
      "committed");
  }
  return feedback === next.feedback ? next : { ...next, feedback };
};

const copySource = (state: SessionState): CopySource =>
  state.input === state.snapshot?.serialized ? "current" : "last-valid";
const currentCopy = (state: SessionState, effect: CopyEffect): boolean =>
  effect.epoch === state.epoch && effect.stateRevision === state.revision &&
  effect.attemptId === state.latestCopyAttempt &&
  effect.draftRevision === state.draftRevision &&
  effect.serialized === state.snapshot?.serialized && effect.source === copySource(state);

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
