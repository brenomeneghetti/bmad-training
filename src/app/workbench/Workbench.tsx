import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createIdAllocator } from "../../core/contracts";
import {
  initialSessionState,
  prepareParse,
  sessionReducer,
  structuredUpdateMessage,
} from "../../core/session";
import type { LosslessUrl, ManagedPieceRemoval, QueryPiece } from "../../core/url";
import { ValidationMessage } from "../feedback/ValidationMessage";
import { StructuredView } from "../pieces/StructuredView";
import { buildManagedPieces, filterManagedPieces } from "../pieces/search";
import styles from "../../styles/workbench.module.css";
import { flushSync } from "react-dom";

export function Workbench() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const [searchTerm, setSearchTerm] = useState("");
  const [fullUrlComposition, setFullUrlComposition] = useState<string | null>(null);
  const fullUrlComposing = useRef(false);
  const fullUrlEditorRef = useRef<HTMLTextAreaElement>(null);
  const [searchStatuses, setSearchStatuses] = useState<readonly {
    readonly id: number;
    readonly message: string;
    readonly snapshot: LosslessUrl | null;
    readonly epoch: number | null;
  }[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingRemovalFocus = useRef<{
    readonly epoch: number;
    readonly revision: number;
    readonly pieceId: string;
    readonly candidates: readonly string[];
    readonly hasFilteredSurvivors: boolean;
    readonly successMessage: string;
  } | null>(null);
  const pendingAddFocus = useRef<{
    readonly epoch: number;
    readonly revision: number;
    readonly pieceId: string;
    readonly successMessage: string;
    readonly shouldClearSearch: boolean;
  } | null>(null);
  const pendingMoveFocus = useRef<{
    readonly epoch: number;
    readonly revision: number;
    readonly pieceId: string;
    readonly direction: "up" | "down";
    readonly successMessage: string;
  } | null>(null);
  const pendingFocusAfterSearchClear = useRef<{
    readonly pieceId: string;
    readonly revision: number;
    readonly epoch: number;
  } | null>(null);
  const announcementId = useRef(0);
  const announcementTimers = useRef(new Map<number, number>());
  const explicitClear = useRef(false);
  const previousSearchTerm = useRef("");
  const allPieces = useMemo(
    () => (state.snapshot ? buildManagedPieces(state.snapshot) : []),
    [state.snapshot],
  );
  const visiblePieces = useMemo(
    () => filterManagedPieces(allPieces, searchTerm),
    [allPieces, searchTerm],
  );
  const editorsDisabled =
    !state.lastValidSnapshot ||
    state.phase === "no-session" ||
    state.phase === "parsing";
  const invalidDraft = state.snapshot !== null && state.problem !== null;

  const cancelPendingOperationFocus = () => {
    pendingRemovalFocus.current = null;
    pendingAddFocus.current = null;
    pendingMoveFocus.current = null;
    pendingFocusAfterSearchClear.current = null;
  };

  useLayoutEffect(() => {
    const pending = pendingRemovalFocus.current;
    if (!pending) return;
    pendingRemovalFocus.current = null;
    if (
      state.revision !== pending.revision + 1 ||
      state.epoch !== pending.epoch ||
      state.structuredSuccess !== pending.successMessage ||
      allPieces.some((piece) => piece.id === pending.pieceId)
    ) {
      return;
    }

    for (const pieceId of pending.candidates) {
      const button = document.getElementById(`remove-${pieceId}`);
      if (button instanceof HTMLButtonElement && !button.disabled) {
        button.focus();
        return;
      }
    }
    if (pending.hasFilteredSurvivors) {
      document.getElementById("clear-managed-piece-search")?.focus();
      return;
    }
    const addButton = document.getElementById("add-query-after");
    if (addButton instanceof HTMLButtonElement && !addButton.disabled) {
      addButton.focus();
      return;
    }
    document.getElementById("structured-heading")?.focus();
  }, [allPieces, state]);

  useLayoutEffect(() => {
    const pending = pendingAddFocus.current;
    if (!pending) return;
    pendingAddFocus.current = null;
    if (
      state.revision !== pending.revision + 1 ||
      state.epoch !== pending.epoch ||
      state.structuredSuccess !== pending.successMessage
    ) {
      return;
    }
    if (pending.shouldClearSearch) {
      explicitClear.current = true;
      setSearchTerm("");
      clearAnnouncements();
      announce(
        `${allPieces.length} of ${allPieces.length} Managed Pieces shown.`,
        true,
      );
      pendingFocusAfterSearchClear.current = {
        pieceId: pending.pieceId,
        revision: state.revision,
        epoch: state.epoch,
      };
      return;
    }
    document.getElementById(`query-key-${pending.pieceId}`)?.focus();
  }, [allPieces, state]);

  useLayoutEffect(() => {
    const pending = pendingMoveFocus.current;
    if (!pending) return;
    pendingMoveFocus.current = null;
    if (
      state.revision !== pending.revision + 1 ||
      state.epoch !== pending.epoch ||
      state.structuredSuccess !== pending.successMessage
    ) {
      return;
    }
    const activatedButton = document.getElementById(
      `move-${pending.direction}-${pending.pieceId}`,
    );
    if (activatedButton instanceof HTMLButtonElement && !activatedButton.disabled) {
      activatedButton.focus();
      return;
    }
    const oppositeDirection = pending.direction === "up" ? "down" : "up";
    const oppositeButton = document.getElementById(
      `move-${oppositeDirection}-${pending.pieceId}`,
    );
    if (oppositeButton instanceof HTMLButtonElement && !oppositeButton.disabled) {
      oppositeButton.focus();
      return;
    }
    document.getElementById(`query-key-${pending.pieceId}`)?.focus();
  }, [allPieces, state]);

  useLayoutEffect(() => {
    const pending = pendingFocusAfterSearchClear.current;
    if (!pending) return;
    if (state.revision !== pending.revision || state.epoch !== pending.epoch) {
      pendingFocusAfterSearchClear.current = null;
      return;
    }
    if (searchTerm !== "") return;
    pendingFocusAfterSearchClear.current = null;
    document.getElementById(`query-key-${pending.pieceId}`)?.focus();
  }, [searchTerm, visiblePieces, state.revision, state.epoch]);

  const removePiece = (removal: ManagedPieceRemoval) => {
    const target = allPieces.find((piece) => piece.id === removal.pieceId);
    if (target && target.kind === removal.kind) {
      const visibleIndex = visiblePieces.findIndex(
        (piece) => piece.id === removal.pieceId,
      );
      const removable = (piece: (typeof visiblePieces)[number]) =>
        piece.kind !== "domain";
      const candidates =
        visibleIndex >= 0
          ? [
              ...visiblePieces.slice(visibleIndex + 1).filter(removable),
              ...visiblePieces.slice(0, visibleIndex).reverse().filter(removable),
            ].map((piece) => piece.id)
          : [];
      const label = removal.kind === "path" ? "Path Segment" : "Query Parameter";
      pendingRemovalFocus.current = {
        epoch: state.epoch,
        revision: state.revision,
        pieceId: removal.pieceId,
        candidates,
        hasFilteredSurvivors: visiblePieces.some(
          (piece) => piece.id !== removal.pieceId,
        ),
        successMessage: `${label} ${target.sourcePosition} removed. ${structuredUpdateMessage(state)}`,
      };
    } else {
      pendingRemovalFocus.current = null;
    }
    dispatch({ type: "removePiece", removal });
  };

  const handleFullUrlChange = (value: string) => {
    // Compute the reducer transitions locally (mirroring the synchronous
    // `inputChanged` -> `parseStarted` -> `parseCompleted` chain) so each
    // keystroke parses and publishes immediately without waiting for a
    // re-render to read back the dispatched state.
    const afterInputChanged = sessionReducer(state, {
      type: "inputChanged",
      value,
    });
    const parse = prepareParse(afterInputChanged);
    const completion = parse.complete();
    if (value !== state.input && completion.result.ok) clearAnnouncements();
    // Native input/change pairs can arrive before React's next render in Firefox.
    flushSync(() => {
      dispatch({ type: "inputChanged", value });
      dispatch(parse.start);
      dispatch(completion);
    });
  };

  const handleFullUrlFocus = () => {
    dispatch({ type: "fullUrlFocusBegin" });
  };

  const handleFullUrlBlur = () => {
    dispatch({ type: "closeFullUrlEdit", reason: "blur" });
  };

  const handleFullUrlKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Enter") return;
    if (fullUrlComposing.current || event.nativeEvent.isComposing || event.keyCode === 229) {
      // Let the IME confirm composition natively: no apply, no close, no
      // newline insertion, no mutation entry.
      return;
    }
    event.preventDefault();
    if (!event.shiftKey) {
      dispatch({ type: "closeFullUrlEdit", reason: "enter" });
    }
  };

  useLayoutEffect(() => {
    const editor = fullUrlEditorRef.current;
    if (!editor) return;
    const start = () => {
      fullUrlComposing.current = true;
      setFullUrlComposition(editor.value);
    };
    const end = () => {
      fullUrlComposing.current = false;
      setFullUrlComposition(null);
      handleFullUrlChange(editor.value);
    };
    editor.addEventListener("compositionstart", start);
    editor.addEventListener("compositionend", end);
    return () => {
      editor.removeEventListener("compositionstart", start);
      editor.removeEventListener("compositionend", end);
    };
  });

  const announce = useCallback((message: string, preserveAcrossSnapshot = false) => {
    announcementId.current += 1;
    const id = announcementId.current;
    setSearchStatuses((statuses) => [
      ...statuses,
      {
        id,
        message,
        snapshot: preserveAcrossSnapshot ? null : state.snapshot,
        epoch: preserveAcrossSnapshot ? state.epoch : null,
      },
    ]);
    announcementTimers.current.set(
      id,
      window.setTimeout(() => {
        setSearchStatuses((statuses) =>
          statuses.filter((status) => status.id !== id),
        );
        announcementTimers.current.delete(id);
      }, 2_100),
    );
  }, [state.epoch, state.snapshot]);

  const clearAnnouncements = () => {
    setSearchStatuses([]);
    for (const timer of announcementTimers.current.values()) {
      window.clearTimeout(timer);
    }
    announcementTimers.current.clear();
  };

  const clearSearch = () => {
    if (searchTerm === "") return;
    explicitClear.current = true;
    setSearchTerm("");
    searchInputRef.current?.focus();
    announce(`${allPieces.length} of ${allPieces.length} Managed Pieces shown.`);
  };

  const addQueryPiece = () => {
    if (!state.snapshot) {
      dispatch({ type: "addQueryPiece" });
      return;
    }
    const pieceId = createIdAllocator(state.nextPieceId).next();
    const position = state.snapshot.query.length + 1;
    pendingAddFocus.current = {
      epoch: state.epoch,
      revision: state.revision,
      pieceId,
      successMessage: `Query Parameter ${position} added. ${structuredUpdateMessage(state)}`,
      shouldClearSearch: searchTerm !== "",
    };
    dispatch({ type: "addQueryPiece" });
  };

  const moveQueryPiece = (pieceId: QueryPiece["id"], direction: "up" | "down") => {
    const target = allPieces.find(
      (piece) => piece.id === pieceId && piece.kind === "query",
    );
    if (target && target.kind === "query") {
      const destinationPosition =
        direction === "up" ? target.sourcePosition - 1 : target.sourcePosition + 1;
      if (destinationPosition >= 1 && destinationPosition <= target.sourceTotal) {
        const identity = target.piece.equalsPresent
          ? `${target.piece.rawKey}=${target.piece.rawValue}`
          : target.piece.rawKey;
        pendingMoveFocus.current = {
          epoch: state.epoch,
          revision: state.revision,
          pieceId,
          direction,
          successMessage: `Query Parameter "${identity}" moved from position ${target.sourcePosition} to position ${destinationPosition} of ${target.sourceTotal}. ${structuredUpdateMessage(state)}`,
        };
      } else {
        pendingMoveFocus.current = null;
      }
    } else {
      pendingMoveFocus.current = null;
    }
    dispatch({ type: "moveQueryPiece", pieceId, direction });
  };

  useEffect(() => {
    if (!state.snapshot) return;
    if (searchTerm === "") {
      if (explicitClear.current) {
        explicitClear.current = false;
      } else if (previousSearchTerm.current !== "") {
        announce(`${allPieces.length} of ${allPieces.length} Managed Pieces shown.`);
      }
      previousSearchTerm.current = searchTerm;
      return;
    }
    previousSearchTerm.current = searchTerm;
    const timer = window.setTimeout(() => {
      announce(
        `${visiblePieces.length} of ${allPieces.length} Managed Pieces shown.`,
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    allPieces.length,
    announce,
    searchTerm,
    state.snapshot,
    visiblePieces.length,
  ]);

  useEffect(
    () => () => {
      for (const timer of announcementTimers.current.values()) {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  return (
    <main
      className={styles.workbench}
      onFocusCapture={cancelPendingOperationFocus}
      onChangeCapture={cancelPendingOperationFocus}
      onCompositionStartCapture={cancelPendingOperationFocus}
    >
      <h1>URL Workbench</h1>
      <p className={styles.privacyNotice}>
        Your URL stays in this browser and is cleared when you reload or close
        this page.
      </p>
      {state.snapshot ? (
        <a className={styles.skipLink} href="#managed-pieces">
          Skip to Structured View results
        </a>
      ) : null}
      {state.snapshot ? (
        <a className={styles.skipLink} href="#add-query-after">
          Skip to Add Query Parameter
        </a>
      ) : null}

      <section aria-labelledby="full-url-heading" className={styles.panel}>
        <h2 id="full-url-heading">Full URL</h2>
        <label htmlFor="full-url-editor">Complete HTTP or HTTPS Absolute URL</label>
        <p id="full-url-help">
          Paste or type one complete URL. Every valid change publishes
          immediately to the Structured View. Enter or leaving this field
          commits one edit; Shift+Enter does not insert a line break.
        </p>
        <textarea
          id="full-url-editor"
          ref={fullUrlEditorRef}
          value={fullUrlComposition ?? state.input}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (fullUrlComposing.current) setFullUrlComposition(value);
            else handleFullUrlChange(value);
          }}
          onFocus={handleFullUrlFocus}
          onBlur={handleFullUrlBlur}
          onKeyDown={handleFullUrlKeyDown}
          aria-describedby={state.problem ? "full-url-help error-full-url" : "full-url-help"}
          aria-invalid={state.problem ? true : undefined}
          aria-errormessage={state.problem ? "error-full-url" : undefined}
          maxLength={20_000}
          dir="ltr"
        />
        <div id="full-url-validation" aria-live="polite" aria-atomic="true">
          {state.problem ? (
            <ValidationMessage id="error-full-url">
              {invalidDraft
                ? `Draft URL is not valid. Structured View changes use the Last Valid URL. ${state.problem.message}`
                : state.problem.message}
            </ValidationMessage>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="actions-heading"
        className={`${styles.panel} ${styles.actionBar}`}
      >
        <h2 id="actions-heading">Actions</h2>
        <button type="button" disabled>
          Undo
        </button>
        <button type="button" disabled>
          Copy
        </button>
        <button
          id="add-query-before"
          type="button"
          aria-label="Add Query Parameter before the list"
          disabled={editorsDisabled}
          onPointerDown={(event) => event.preventDefault()}
          onClick={addQueryPiece}
        >
          Add Query Parameter
        </button>
        <p id="actions-note">
          Undo and Copy are not available yet.
        </p>
        <div role="status" aria-live="polite" aria-atomic="true">
          {state.phase === "active"
            ? `URL parsed. ${
                1 +
                (state.snapshot?.path.length ?? 0) +
                (state.snapshot?.query.length ?? 0)
              } Managed Pieces available.`
            : ""}
        </div>
      </section>

      <StructuredView
        sourceDescription={invalidDraft ? "Source: Last Valid URL." : null}
        snapshot={state.snapshot}
        busy={state.phase === "parsing"}
        pieces={visiblePieces}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={clearSearch}
        searchInputRef={searchInputRef}
        structuredDrafts={state.structuredDrafts}
        tokenRevisions={state.tokenRevisions}
        onStructuredEdit={(command) => {
          if (searchTerm !== "") {
            explicitClear.current = true;
            setSearchTerm("");
            clearAnnouncements();
            announce(
              `${allPieces.length} of ${allPieces.length} Managed Pieces shown.`,
              true,
            );
          }
          flushSync(() => dispatch({ type: "structuredEdit", command }));
        }}
        onRemovePiece={removePiece}
        onAddQueryPiece={addQueryPiece}
        onMoveQueryPiece={moveQueryPiece}
        structuredProblem={state.structuredProblem}
        structuredSuccess={state.structuredSuccess}
        editorsDisabled={editorsDisabled}
      />
      <div
        id="search-status"
        className={styles.visuallyHidden}
      >
        {searchStatuses
          .filter(
            (status) =>
              status.snapshot === state.snapshot ||
              (status.snapshot === null && status.epoch === state.epoch),
          )
          .map((status) => (
            <span
              key={status.id}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {status.message}
            </span>
          ))}
      </div>
    </main>
  );
}
