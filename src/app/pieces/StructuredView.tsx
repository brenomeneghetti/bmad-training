import type { LosslessUrl } from "../../core/url";
import type {
  ClipboardEvent,
  FormEvent,
  RefObject,
} from "react";
import { useEffect, useState } from "react";
import type { ManagedPiece } from "./search";
import {
  structuredFieldKey,
  type StructuredDraft,
  type StructuredEditCommand,
} from "../../core/session";
import type { UrlProblem } from "../../core/contracts";
import styles from "../../styles/workbench.module.css";

interface StructuredViewProps {
  readonly snapshot: LosslessUrl | null;
  readonly busy: boolean;
  readonly pieces: readonly ManagedPiece[];
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly onClearSearch: () => void;
  readonly searchInputRef: RefObject<HTMLInputElement | null>;
  readonly structuredDrafts: Readonly<Record<string, StructuredDraft>>;
  readonly tokenRevisions: Readonly<Record<string, number>>;
  readonly onStructuredEdit: (command: StructuredEditCommand) => void;
  readonly structuredProblem: UrlProblem | null;
}

interface EditableTokenProps {
  readonly id: string;
  readonly label: string;
  readonly pieceId: StructuredEditCommand["pieceId"];
  readonly field: StructuredEditCommand["field"];
  readonly committedValue: string;
  readonly draft: StructuredDraft | undefined;
  readonly tokenRevision: number;
  readonly onEdit: (command: StructuredEditCommand) => void;
}

function EditableToken({
  id,
  label,
  pieceId,
  field,
  committedValue,
  draft,
  tokenRevision,
  onEdit,
}: EditableTokenProps) {
  const [compositionValue, setCompositionValue] = useState<string | null>(null);
  const value = compositionValue ?? draft?.value ?? committedValue;
  const errorId = `${id}-error`;

  useEffect(() => setCompositionValue(null), [pieceId, field, committedValue]);

  const dispatch = (start: number, end: number, insertedText: string) =>
    onEdit({ pieceId, field, tokenRevision, start, end, insertedText });

  const selection = (input: HTMLInputElement) => ({
    start: input.selectionStart ?? value.length,
    end: input.selectionEnd ?? value.length,
  });

  const beforeInput = (event: FormEvent<HTMLInputElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.isComposing || compositionValue !== null) return;
    const inputType = native.inputType ?? "";
    const range = selection(event.currentTarget);
    let start = range.start;
    let end = range.end;
    let insertedText = native.data ?? "";
    if (inputType === "deleteContentBackward" && start === end && start > 0) {
      start -= 1;
    } else if (
      inputType === "deleteContentForward" &&
      start === end &&
      end < value.length
    ) {
      end += 1;
    } else if (inputType.startsWith("insert") && native.data === null) {
      return;
    }
    event.preventDefault();
    dispatch(start, end, insertedText);
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const range = selection(event.currentTarget);
    dispatch(range.start, range.end, event.clipboardData.getData("text"));
  };

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className={styles.urlValue}
        dir="ltr"
        value={value}
        aria-invalid={draft ? true : undefined}
        aria-errormessage={draft ? errorId : undefined}
        onBeforeInput={beforeInput}
        onPaste={paste}
        onCompositionStart={(event) => setCompositionValue(event.currentTarget.value)}
        onCompositionEnd={(event) => {
          const next = event.currentTarget.value;
          setCompositionValue(null);
          dispatch(0, (draft?.value ?? committedValue).length, next);
        }}
        onChange={(event) => {
          if (compositionValue !== null) {
            setCompositionValue(event.currentTarget.value);
          } else {
            dispatch(0, value.length, event.currentTarget.value);
          }
        }}
        autoComplete="off"
        spellCheck={false}
      />
      {draft ? (
        <p id={errorId} className={styles.validation}>
          {draft.problem.message}
        </p>
      ) : null}
    </>
  );
}

export function StructuredView({
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
  structuredProblem,
}: StructuredViewProps) {
  const managedCount = snapshot ? 1 + snapshot.path.length + snapshot.query.length : 0;
  const visibleCount = pieces.length;
  const activeSearch = searchTerm !== "";
  const summary = `${visibleCount} of ${managedCount} Managed Pieces shown`;

  return (
    <section aria-labelledby="structured-heading" className={styles.panel}>
      <h2 id="structured-heading" tabIndex={-1}>
        Structured View
      </h2>
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
        <button type="button" onClick={onClearSearch} disabled={!activeSearch}>
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
                    <label htmlFor={`unicode-${managedPiece.id}`}>Unicode Domain</label>
                    <input
                      id={`unicode-${managedPiece.id}`}
                      className={styles.urlValue}
                      dir="ltr"
                      value={managedPiece.unicode}
                      readOnly
                    />
                    <label htmlFor={`ascii-${managedPiece.id}`}>
                      ASCII/Punycode Domain
                    </label>
                    <input
                      id={`ascii-${managedPiece.id}`}
                      className={styles.urlValue}
                      dir="ltr"
                      value={managedPiece.ascii}
                      readOnly
                    />
                    <p className={styles.conversionStatus}>Validated domain forms</p>
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
                      pieceId={managedPiece.id}
                      field="path"
                      committedValue={managedPiece.piece.rawSegment}
                      draft={structuredDrafts[structuredFieldKey(managedPiece.id, "path")]}
                      tokenRevision={
                        tokenRevisions[structuredFieldKey(managedPiece.id, "path")] ?? 0
                      }
                      onEdit={onStructuredEdit}
                    />
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
                  />
                  <EditableToken
                    id={`query-value-${managedPiece.id}`}
                    label={managedPiece.piece.equalsPresent ? "Value" : "Value absent"}
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
                  />
                </li>
              );
              })}
            </ol>
          </>
        )}
      </div>
      {snapshot?.problems.map((problem) => (
        <p className={styles.validation} key={`${problem.code}-${problem.message}`}>
          {problem.message}
        </p>
      ))}
      {structuredProblem &&
      !Object.values(structuredDrafts).some(
        (draft) => draft.problem === structuredProblem,
      ) ? (
        <p className={styles.validation} role="status">
          {structuredProblem.message}
        </p>
      ) : null}
    </section>
  );
}
