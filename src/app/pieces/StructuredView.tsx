import type {
  LosslessUrl,
  ManagedPieceRemoval,
  QueryPiece,
} from "../../core/url";
import type {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ManagedPiece } from "./search";
import {
  structuredFieldKey,
  type DomainEditCommand,
  type StructuredDraft,
  type StructuredEditCommand,
  type StructuredCommand,
} from "../../core/session";
import type { UrlProblem } from "../../core/contracts";
import styles from "../../styles/workbench.module.css";

interface StructuredViewProps {
  readonly sourceDescription: string | null;
  readonly snapshot: LosslessUrl | null;
  readonly busy: boolean;
  readonly pieces: readonly ManagedPiece[];
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly structuredDrafts: Readonly<Record<string, StructuredDraft>>;
  readonly tokenRevisions: Readonly<Record<string, number>>;
  readonly onStructuredEdit: (command: StructuredCommand) => void;
  readonly onRemovePiece: (removal: ManagedPieceRemoval) => void;
  readonly onAddQueryPiece: () => void;
  readonly onMoveQueryPiece: (
    pieceId: QueryPiece["id"],
    direction: "up" | "down",
  ) => void;
  readonly structuredProblem: UrlProblem | null;
  readonly structuredSuccess: string | null;
  readonly editorsDisabled: boolean;
}

interface DomainEditorProps {
  readonly id: string;
  readonly label: string;
  readonly pieceId: DomainEditCommand["pieceId"];
  readonly field: DomainEditCommand["field"];
  readonly committedValue: string;
  readonly draft: StructuredDraft | undefined;
  readonly tokenRevision: number;
  readonly onEdit: (command: StructuredCommand) => void;
  readonly onCompositionChange: (field: DomainEditCommand["field"] | null) => void;
  readonly disabled: boolean;
}

function DomainEditor({
  id,
  label,
  pieceId,
  field,
  committedValue,
  draft,
  tokenRevision,
  onEdit,
  onCompositionChange,
  disabled,
}: DomainEditorProps) {
  const [compositionValue, setCompositionValue] = useState<string | null>(null);
  const composing = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<{
    readonly submittedValue: string;
    readonly selectionStart: number;
  } | null>(null);
  const caretFrame = useRef<number | null>(null);
  const ignorePostCompositionValue = useRef<string | null>(null);
  const value = compositionValue ?? draft?.value ?? committedValue;
  const errorId = `error-${pieceId}-${field}`;
  const helpId = `help-${pieceId}-domain`;

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return;
    const { submittedValue, selectionStart } = pendingCaret.current;
    const normalizedPrefix =
      field === "domain-unicode"
        ? submittedValue.slice(0, selectionStart).normalize("NFC").toLowerCase()
        : submittedValue.slice(0, selectionStart).toLowerCase();
    const caret =
      value === submittedValue
        ? selectionStart
        : Math.min(normalizedPrefix.length, value.length);
    inputRef.current.setSelectionRange(caret, caret);
    pendingCaret.current = null;
    if (caretFrame.current !== null) {
      window.cancelAnimationFrame(caretFrame.current);
    }
    caretFrame.current = window.requestAnimationFrame(() => {
      if (inputRef.current?.selectionStart !== inputRef.current?.selectionEnd) {
        caretFrame.current = null;
        return;
      }
      inputRef.current?.setSelectionRange(caret, caret);
      caretFrame.current = null;
    });
  }, [value]);

  useEffect(
    () => () => {
      if (caretFrame.current !== null) window.cancelAnimationFrame(caretFrame.current);
    },
    [],
  );

  const submit = (nextValue: string, selectionStart: number | null) => {
    pendingCaret.current = {
      submittedValue: nextValue,
      selectionStart: selectionStart ?? nextValue.length,
    };
    onEdit({ pieceId, field, tokenRevision, value: nextValue });
    if (caretFrame.current !== null) {
      window.cancelAnimationFrame(caretFrame.current);
    }
    caretFrame.current = window.requestAnimationFrame(() => {
      if (!inputRef.current || pendingCaret.current === null) return;
      const { submittedValue, selectionStart: submittedCaret } =
        pendingCaret.current;
      const normalizedPrefix =
        field === "domain-unicode"
          ? submittedValue.slice(0, submittedCaret).normalize("NFC").toLowerCase()
          : submittedValue.slice(0, submittedCaret).toLowerCase();
      const caret =
        inputRef.current.value === submittedValue
          ? submittedCaret
          : Math.min(normalizedPrefix.length, inputRef.current.value.length);
      inputRef.current.setSelectionRange(caret, caret);
      pendingCaret.current = null;
      caretFrame.current = null;
    });
  };

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        className={styles.urlValue}
        dir="ltr"
        value={value}
        aria-invalid={draft ? true : undefined}
        aria-errormessage={draft ? errorId : undefined}
        aria-describedby={draft ? `${helpId} ${errorId}` : helpId}
        disabled={disabled}
        onCompositionStart={(event) => {
          composing.current = true;
          onCompositionChange(field);
          setCompositionValue(event.currentTarget.value);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          onCompositionChange(null);
          setCompositionValue(null);
          ignorePostCompositionValue.current = event.currentTarget.value;
          submit(event.currentTarget.value, event.currentTarget.selectionStart);
        }}
        onChange={(event) => {
          if (
            composing.current ||
            (event.nativeEvent as InputEvent).isComposing
          ) {
            setCompositionValue(event.currentTarget.value);
            return;
          }
          const inputType = (event.nativeEvent as InputEvent).inputType;
          if (
            inputType === "insertFromComposition" &&
            ignorePostCompositionValue.current === event.currentTarget.value
          ) {
            ignorePostCompositionValue.current = null;
            event.currentTarget.value = value;
            return;
          }
          ignorePostCompositionValue.current = null;
          submit(event.currentTarget.value, event.currentTarget.selectionStart);
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <div
        id={`${errorId}-feedback`}
        className={draft ? undefined : styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {draft ? (
          <p id={errorId} className={styles.validation}>
            {draft.problem.message}
          </p>
        ) : null}
      </div>
    </>
  );
}

interface EditableTokenProps {
  readonly id: string;
  readonly label: string;
  readonly accessibleLabel: string;
  readonly pieceId: StructuredEditCommand["pieceId"];
  readonly field: StructuredEditCommand["field"];
  readonly committedValue: string;
  readonly draft: StructuredDraft | undefined;
  readonly tokenRevision: number;
  readonly onEdit: (command: StructuredEditCommand) => void;
  readonly disabled: boolean;
}

const percentTripletAt = (value: string, index: number) => {
  for (
    let percent = Math.max(0, index - 2);
    percent <= index && percent < value.length;
    percent += 1
  ) {
    if (
      value[percent] === "%" &&
      /^[0-9A-Fa-f]{2}$/.test(value.slice(percent + 1, percent + 3)) &&
      index >= percent &&
      index < percent + 3
    ) {
      return { start: percent, end: percent + 3 };
    }
  }
  return null;
};

const previousCodePointStart = (value: string, index: number) => {
  if (index <= 0) return 0;
  const last = value.charCodeAt(index - 1);
  const previous = index > 1 ? value.charCodeAt(index - 2) : 0;
  return last >= 0xdc00 &&
    last <= 0xdfff &&
    previous >= 0xd800 &&
    previous <= 0xdbff
    ? index - 2
    : index - 1;
};

const nextCodePointEnd = (value: string, index: number) => {
  if (index >= value.length) return value.length;
  const first = value.charCodeAt(index);
  const next = index + 1 < value.length ? value.charCodeAt(index + 1) : 0;
  return first >= 0xd800 &&
    first <= 0xdbff &&
    next >= 0xdc00 &&
    next <= 0xdfff
    ? index + 2
    : index + 1;
};

const expandAtomicRange = (
  value: string,
  start: number,
  end: number,
): { start: number; end: number } => {
  let expandedStart = start;
  let expandedEnd = end;
  const startTriplet = percentTripletAt(value, expandedStart);
  if (startTriplet && expandedStart > startTriplet.start) {
    expandedStart = startTriplet.start;
  }
  const endTriplet = percentTripletAt(value, Math.max(0, expandedEnd - 1));
  if (endTriplet && expandedEnd < endTriplet.end) {
    expandedEnd = endTriplet.end;
  }
  if (
    expandedStart > 0 &&
    expandedStart < value.length &&
    value.charCodeAt(expandedStart - 1) >= 0xd800 &&
    value.charCodeAt(expandedStart - 1) <= 0xdbff &&
    value.charCodeAt(expandedStart) >= 0xdc00 &&
    value.charCodeAt(expandedStart) <= 0xdfff
  ) {
    expandedStart -= 1;
  }
  if (
    expandedEnd > 0 &&
    expandedEnd < value.length &&
    value.charCodeAt(expandedEnd - 1) >= 0xd800 &&
    value.charCodeAt(expandedEnd - 1) <= 0xdbff &&
    value.charCodeAt(expandedEnd) >= 0xdc00 &&
    value.charCodeAt(expandedEnd) <= 0xdfff
  ) {
    expandedEnd += 1;
  }
  return { start: expandedStart, end: expandedEnd };
};

const minimalReplacement = (before: string, after: string) => {
  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start += 1;
  }
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > start &&
    afterEnd > start &&
    before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }
  const expanded = expandAtomicRange(before, start, beforeEnd);
  if (
    after.length < before.length &&
    (expanded.start !== start || expanded.end !== beforeEnd)
  ) {
    return {
      start: expanded.start,
      end: expanded.end,
      insertedText: "",
    };
  }
  afterEnd += expanded.end - beforeEnd;
  const afterStart =
    after.length < before.length && expanded.start < start
      ? start
      : expanded.start;
  return {
    start: expanded.start,
    end: expanded.end,
    insertedText: after.slice(afterStart, afterEnd),
  };
};

function EditableToken({
  id,
  label,
  accessibleLabel,
  pieceId,
  field,
  committedValue,
  draft,
  tokenRevision,
  onEdit,
  disabled,
}: EditableTokenProps) {
  const [compositionValue, setCompositionValue] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const compositionBase = useRef("");
  const pendingSuffixLength = useRef<number | null>(null);
  const caretFrame = useRef<number | null>(null);
  const suppressBeforeInput = useRef(false);
  const value = compositionValue ?? draft?.value ?? committedValue;
  const errorId = `${id}-error`;

  useEffect(() => setCompositionValue(null), [pieceId, field, committedValue]);
  useLayoutEffect(() => {
    if (pendingSuffixLength.current === null || !inputRef.current) return;
    const caret = Math.max(0, value.length - pendingSuffixLength.current);
    inputRef.current.setSelectionRange(caret, caret);
    pendingSuffixLength.current = null;
    if (caretFrame.current !== null) {
      window.cancelAnimationFrame(caretFrame.current);
    }
    caretFrame.current = window.requestAnimationFrame(() => {
      if (inputRef.current?.selectionStart !== inputRef.current?.selectionEnd) {
        caretFrame.current = null;
        return;
      }
      inputRef.current?.setSelectionRange(caret, caret);
      caretFrame.current = null;
    });
  }, [value]);
  useEffect(() => {
    return () => {
      if (caretFrame.current !== null) {
        window.cancelAnimationFrame(caretFrame.current);
      }
    };
  }, []);

  const cancelCaretFrame = () => {
    if (caretFrame.current === null) return;
    window.cancelAnimationFrame(caretFrame.current);
    caretFrame.current = null;
  };

  const dispatch = (
    start: number,
    end: number,
    insertedText: string,
    suffixLength = value.length - end,
  ) => {
    pendingSuffixLength.current = suffixLength;
    onEdit({ pieceId, field, tokenRevision, start, end, insertedText });
  };

  const selection = (input: HTMLInputElement) => ({
    start: input.selectionStart ?? value.length,
    end: input.selectionEnd ?? value.length,
  });

  const beforeInput = (event: FormEvent<HTMLInputElement>) => {
    cancelCaretFrame();
    const native = event.nativeEvent as InputEvent;
    if (suppressBeforeInput.current) {
      event.preventDefault();
      return;
    }
    if (native.isComposing || compositionValue !== null) return;
    const inputType = native.inputType ?? "";
    const range = selection(event.currentTarget);
    let start = range.start;
    let end = range.end;
    let insertedText = native.data ?? "";
    if (start === end && inputType === "deleteContentBackward") {
      if (start === 0) return;
      start = previousCodePointStart(value, start);
    } else if (start === end && inputType === "deleteContentForward") {
      if (end === value.length) return;
      end = nextCodePointEnd(value, end);
    } else if (
      inputType === "deleteWordBackward" ||
      inputType === "deleteWordForward"
    ) {
      return;
    } else if (inputType.startsWith("insert") && native.data === null) {
      return;
    }
    if (inputType.startsWith("delete")) {
      if (
        inputType !== "deleteContentBackward" &&
        inputType !== "deleteContentForward" &&
        inputType !== "deleteWordBackward" &&
        inputType !== "deleteWordForward"
      ) {
        return;
      }
      ({ start, end } = expandAtomicRange(value, start, end));
      insertedText = "";
    }
    event.preventDefault();
    dispatch(start, end, insertedText);
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    cancelCaretFrame();
    event.preventDefault();
    const range = selection(event.currentTarget);
    dispatch(range.start, range.end, event.clipboardData.getData("text"));
  };

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    cancelCaretFrame();
    if (
      compositionValue !== null ||
      (event.key !== "Backspace" && event.key !== "Delete")
    ) {
      return;
    }
    const range = selection(event.currentTarget);
    let { start, end } = range;
    const word = event.ctrlKey || event.altKey || event.metaKey;
    if (word || event.shiftKey) return;
    if (start === end && event.key === "Backspace") {
      if (start === 0) {
        event.preventDefault();
        return;
      }
      start = previousCodePointStart(value, start);
    } else if (start === end && event.key === "Delete") {
      if (end === value.length) {
        event.preventDefault();
        return;
      }
      end = nextCodePointEnd(value, end);
    }
    ({ start, end } = expandAtomicRange(value, start, end));
    event.preventDefault();
    suppressBeforeInput.current = true;
    dispatch(start, end, "");
  };

  const fallbackChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (compositionValue !== null) {
      setCompositionValue(event.currentTarget.value);
      return;
    }
    const next = event.currentTarget.value;
    const replacement = minimalReplacement(value, next);
    dispatch(
      replacement.start,
      replacement.end,
      replacement.insertedText,
      next.length - (event.currentTarget.selectionStart ?? next.length),
    );
  };

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        className={styles.urlValue}
        dir="ltr"
        value={value}
        aria-label={accessibleLabel}
        aria-invalid={draft ? true : undefined}
        aria-errormessage={draft ? errorId : undefined}
        aria-describedby={draft ? errorId : undefined}
        disabled={disabled}
        onKeyDown={keyDown}
        onSelect={cancelCaretFrame}
        onKeyUp={() => {
          suppressBeforeInput.current = false;
        }}
        onBlur={() => {
          suppressBeforeInput.current = false;
        }}
        onBeforeInput={beforeInput}
        onPaste={paste}
        onCut={(event) => {
          cancelCaretFrame();
          let { start, end } = selection(event.currentTarget);
          if (start === end) return;
          ({ start, end } = expandAtomicRange(value, start, end));
          event.preventDefault();
          event.clipboardData.setData("text/plain", value.slice(start, end));
          dispatch(start, end, "");
        }}
        onCompositionStart={(event) => {
          cancelCaretFrame();
          compositionBase.current = event.currentTarget.value;
          setCompositionValue(event.currentTarget.value);
        }}
        onCompositionEnd={(event) => {
          const next = event.currentTarget.value;
          const replacement = minimalReplacement(compositionBase.current, next);
          setCompositionValue(null);
          dispatch(
            replacement.start,
            replacement.end,
            replacement.insertedText,
            next.length - (event.currentTarget.selectionStart ?? next.length),
          );
        }}
        onChange={fallbackChange}
        autoComplete="off"
        spellCheck={false}
      />
      <div
        id={`${errorId}-feedback`}
        className={draft ? undefined : styles.visuallyHidden}
        aria-live="polite"
        aria-atomic="true"
      >
        {draft ? (
          <p id={errorId} className={styles.validation}>
            {draft.problem.message}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function StructuredView({
  sourceDescription,
  snapshot,
  busy,
  pieces,
  searchTerm,
  onSearchChange,
  onClearSearch,
  searchInputRef,
  structuredDrafts,
  tokenRevisions,
  onStructuredEdit,
  onRemovePiece,
  onAddQueryPiece,
  onMoveQueryPiece,
  structuredProblem,
  structuredSuccess,
  editorsDisabled,
}: StructuredViewProps) {
  const [composingDomainField, setComposingDomainField] = useState<
    DomainEditCommand["field"] | null
  >(null);
  const managedCount = snapshot ? 1 + snapshot.path.length + snapshot.query.length : 0;
  const visibleCount = pieces.length;
  const activeSearch = searchTerm !== "";
  const summary = `${visibleCount} of ${managedCount} Managed Pieces shown`;

  return (
    <section
      aria-labelledby="structured-heading"
      aria-describedby={sourceDescription ? "structured-source" : undefined}
      className={styles.panel}
    >
      <h2 id="structured-heading" tabIndex={-1}>
        Structured View
      </h2>
      {sourceDescription ? <p id="structured-source">{sourceDescription}</p> : null}
      <div className={styles.searchControls}>
        <label htmlFor="managed-piece-search">Search Managed Pieces</label>
        <input
          id="managed-piece-search"
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.preventDefault();
          }}
          disabled={!snapshot}
          autoComplete="off"
        />
        <button
          id="clear-managed-piece-search"
          type="button"
          onClick={onClearSearch}
          disabled={!activeSearch}
        >
          Clear Search
        </button>
      </div>
      <p id="piece-summary" className={styles.position}>
        {summary}
      </p>
      <div aria-busy={busy} aria-describedby="piece-summary">
        {!snapshot ? (
          <p>No session. Enter a supported URL to inspect its pieces.</p>
        ) : (
          <>
            {visibleCount === 0 ? (
              <div className={styles.noResults}>
                <p>
                  {summary}. No Managed Piece matches <bdi>‘{searchTerm}’</bdi>.
                </p>
              </div>
            ) : null}
            <ol id="managed-pieces" className={styles.pieceList}>
              {pieces.map((managedPiece, index) => {
              const filteredPosition = `Filtered position ${index + 1} of ${visibleCount}`;
              if (managedPiece.kind === "domain") {
                return (
                  <li
                    className={styles.pieceRow}
                    data-piece-id={managedPiece.id}
                    key={managedPiece.id}
                    aria-posinset={index + 1}
                    aria-setsize={visibleCount}
                  >
                    <span className={styles.typeLabel}>Domain</span>
                    <p className={styles.position}>Domain, 1 of 1</p>
                    <p className={styles.position}>{filteredPosition}</p>
                    <p id={`help-${managedPiece.id}-domain`}>
                      Edit either form. Valid input synchronizes both Domain forms and
                      {sourceDescription ? " the Last Valid URL." : " the Full URL."}
                    </p>
                    <DomainEditor
                      id={`unicode-${managedPiece.id}`}
                      label="Unicode Domain"
                      pieceId={managedPiece.id}
                      field="domain-unicode"
                      committedValue={managedPiece.unicode}
                      draft={
                        structuredDrafts[
                          structuredFieldKey(managedPiece.id, "domain-unicode")
                        ]
                      }
                      tokenRevision={
                        tokenRevisions[
                          structuredFieldKey(managedPiece.id, "domain-unicode")
                        ] ?? 0
                      }
                      onEdit={onStructuredEdit}
                      onCompositionChange={setComposingDomainField}
                      disabled={editorsDisabled}
                    />
                    <DomainEditor
                      id={`ascii-${managedPiece.id}`}
                      label="ASCII/Punycode Domain"
                      pieceId={managedPiece.id}
                      field="domain-ascii"
                      committedValue={managedPiece.ascii}
                      draft={
                        structuredDrafts[
                          structuredFieldKey(managedPiece.id, "domain-ascii")
                        ]
                      }
                      tokenRevision={
                        tokenRevisions[
                          structuredFieldKey(managedPiece.id, "domain-ascii")
                        ] ?? 0
                      }
                      onEdit={onStructuredEdit}
                      onCompositionChange={setComposingDomainField}
                      disabled={editorsDisabled}
                    />
                    {!structuredDrafts[
                      structuredFieldKey(managedPiece.id, "domain-unicode")
                    ] &&
                    !structuredDrafts[
                      structuredFieldKey(managedPiece.id, "domain-ascii")
                    ] &&
                    composingDomainField === null ? (
                      <p className={styles.conversionStatus}>
                        Domain forms are synchronized.
                      </p>
                    ) : null}
                  </li>
                );
              }
              if (managedPiece.kind === "path") {
                return (
                  <li
                    className={styles.pieceRow}
                    data-piece-id={managedPiece.id}
                    key={managedPiece.id}
                    aria-posinset={index + 1}
                    aria-setsize={visibleCount}
                  >
                    <span className={styles.typeLabel}>Path Segment</span>
                    <p className={styles.position}>{filteredPosition}</p>
                    <EditableToken
                      id={`path-${managedPiece.id}`}
                      label={`Path Segment ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}`}
                      accessibleLabel={`Path Segment ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}`}
                      pieceId={managedPiece.id}
                      field="path"
                      committedValue={managedPiece.piece.rawSegment}
                      draft={structuredDrafts[structuredFieldKey(managedPiece.id, "path")]}
                      tokenRevision={
                        tokenRevisions[structuredFieldKey(managedPiece.id, "path")] ?? 0
                      }
                      onEdit={onStructuredEdit}
                      disabled={editorsDisabled}
                    />
                    <button
                      id={`remove-${managedPiece.id}`}
                      className={styles.removeButton}
                      type="button"
                      aria-label={`Remove Path Segment at position ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}, piece ${managedPiece.id}`}
                      disabled={editorsDisabled}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() =>
                        onRemovePiece({ kind: "path", pieceId: managedPiece.id })
                      }
                    >
                      Remove
                    </button>
                  </li>
                );
              }
              const occurrence =
                managedPiece.duplicateTotal > 1
                  ? `, occurrence ${managedPiece.duplicatePosition} of ${managedPiece.duplicateTotal}`
                  : "";
              return (
                <li
                  className={styles.pieceRow}
                  data-piece-id={managedPiece.id}
                  key={managedPiece.id}
                  aria-posinset={index + 1}
                  aria-setsize={visibleCount}
                >
                  <span className={styles.typeLabel}>Query Parameter</span>
                  <p className={styles.position}>
                    Query Parameter {managedPiece.sourcePosition} of{" "}
                    {managedPiece.sourceTotal}
                    {occurrence}
                  </p>
                  <p className={styles.position}>{filteredPosition}</p>
                  <EditableToken
                    id={`query-key-${managedPiece.id}`}
                    label="Key"
                    accessibleLabel={`Key, Query Parameter ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}${occurrence}`}
                    pieceId={managedPiece.id}
                    field="query-key"
                    committedValue={managedPiece.piece.rawKey}
                    draft={
                      structuredDrafts[
                        structuredFieldKey(managedPiece.id, "query-key")
                      ]
                    }
                    tokenRevision={
                      tokenRevisions[
                        structuredFieldKey(managedPiece.id, "query-key")
                      ] ?? 0
                    }
                    onEdit={onStructuredEdit}
                    disabled={editorsDisabled}
                  />
                  <EditableToken
                    id={`query-value-${managedPiece.id}`}
                    label={managedPiece.piece.equalsPresent ? "Value" : "Value absent"}
                    accessibleLabel={`${managedPiece.piece.equalsPresent ? "Value" : "Value absent"}, Query Parameter ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}${occurrence}`}
                    pieceId={managedPiece.id}
                    field="query-value"
                    committedValue={managedPiece.piece.rawValue}
                    draft={
                      structuredDrafts[
                        structuredFieldKey(managedPiece.id, "query-value")
                      ]
                    }
                    tokenRevision={
                      tokenRevisions[
                        structuredFieldKey(managedPiece.id, "query-value")
                      ] ?? 0
                    }
                    onEdit={onStructuredEdit}
                    disabled={editorsDisabled}
                  />
                  <div className={styles.rowActions}>
                    <button
                      id={`move-up-${managedPiece.id}`}
                      type="button"
                      aria-label={`Move Query Parameter at position ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal} up, piece ${managedPiece.id}`}
                      disabled={editorsDisabled || managedPiece.sourcePosition === 1}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => onMoveQueryPiece(managedPiece.id, "up")}
                    >
                      Move Up
                    </button>
                    <button
                      id={`move-down-${managedPiece.id}`}
                      type="button"
                      aria-label={`Move Query Parameter at position ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal} down, piece ${managedPiece.id}`}
                      disabled={
                        editorsDisabled ||
                        managedPiece.sourcePosition === managedPiece.sourceTotal
                      }
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => onMoveQueryPiece(managedPiece.id, "down")}
                    >
                      Move Down
                    </button>
                    <button
                      id={`remove-${managedPiece.id}`}
                      className={styles.removeButton}
                      type="button"
                      aria-label={`Remove Query Parameter at position ${managedPiece.sourcePosition} of ${managedPiece.sourceTotal}, piece ${managedPiece.id}`}
                      disabled={editorsDisabled}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() =>
                        onRemovePiece({ kind: "query", pieceId: managedPiece.id })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
              })}
            </ol>
            <button
              id="add-query-after"
              type="button"
              aria-label="Add Query Parameter after the list"
              className={styles.addAfterButton}
              disabled={editorsDisabled}
              onPointerDown={(event) => event.preventDefault()}
              onClick={onAddQueryPiece}
            >
              Add Query Parameter
            </button>
          </>
        )}
      </div>
      {snapshot?.problems.map((problem) => (
        <p className={styles.validation} key={`${problem.code}-${problem.message}`}>
          {problem.message}
        </p>
      ))}
      <div id="structured-validation" role="status" aria-live="polite" aria-atomic="true">
        {structuredProblem &&
        !Object.values(structuredDrafts).some(
          (draft) => draft.problem === structuredProblem,
        ) ? (
          <p className={styles.validation}>
            {structuredProblem.message}
          </p>
        ) : null}
      </div>
      {structuredSuccess && composingDomainField === null ? (
        <p className={styles.conversionStatus} role="status" aria-live="polite">
          {structuredSuccess}
        </p>
      ) : null}
    </section>
  );
}
