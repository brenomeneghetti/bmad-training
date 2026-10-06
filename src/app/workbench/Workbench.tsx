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
} from "../../core/session";
import type { LosslessUrl, ManagedPieceRemoval } from "../../core/url";
import { ValidationMessage } from "../feedback/ValidationMessage";
import { StructuredView } from "../pieces/StructuredView";
import { buildManagedPieces, filterManagedPieces } from "../pieces/search";
import styles from "../../styles/workbench.module.css";

export function Workbench() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatuses, setSearchStatuses] = useState<readonly {
    readonly id: number;
    readonly message: string;
    readonly snapshot: LosslessUrl | null;
    readonly epoch: number | null;
  }[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingRemovalFocus = useRef<{
    readonly revision: number;
    readonly pieceId: string;
    readonly candidates: readonly string[];
    readonly hasFilteredSurvivors: boolean;
    readonly successMessage: string;
  } | null>(null);
  const pendingAddFocus = useRef<{
    readonly revision: number;
    readonly pieceId: string;
    readonly successMessage: string;
    readonly shouldClearSearch: boolean;
  } | null>(null);
  const pendingFocusAfterSearchClear = useRef<string | null>(null);
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
    state.phase !== "active" || state.input !== state.snapshot?.serialized;

  useLayoutEffect(() => {
    const pending = pendingRemovalFocus.current;
    if (!pending) return;
    pendingRemovalFocus.current = null;
    if (
      state.revision <= pending.revision ||
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
      state.revision <= pending.revision ||
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
      pendingFocusAfterSearchClear.current = pending.pieceId;
      return;
    }
    document.getElementById(`query-key-${pending.pieceId}`)?.focus();
  }, [allPieces, state]);

  useLayoutEffect(() => {
    const pieceId = pendingFocusAfterSearchClear.current;
    if (!pieceId || searchTerm !== "") return;
    pendingFocusAfterSearchClear.current = null;
    document.getElementById(`query-key-${pieceId}`)?.focus();
  }, [searchTerm, visiblePieces]);

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
        revision: state.revision,
        pieceId: removal.pieceId,
        candidates,
        hasFilteredSurvivors: visiblePieces.some(
          (piece) => piece.id !== removal.pieceId,
        ),
        successMessage: `${label} ${target.sourcePosition} removed. Full URL and Structured View updated.`,
      };
    } else {
      pendingRemovalFocus.current = null;
    }
    dispatch({ type: "removePiece", removal });
  };

  const apply = () => {
    if (
      state.phase === "active" &&
      state.snapshot &&
      state.input === state.snapshot.serialized
    ) {
      return;
    }
    const parse = prepareParse(state);
    dispatch(parse.start);
    dispatch(parse.complete());
  };

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
    if (
      !state.snapshot ||
      state.phase !== "active" ||
      state.input !== state.snapshot.serialized
    ) {
      dispatch({ type: "addQueryPiece" });
      return;
    }
    const pieceId = createIdAllocator(state.nextPieceId).next();
    const position = state.snapshot.query.length + 1;
    pendingAddFocus.current = {
      revision: state.revision,
      pieceId,
      successMessage: `Query Parameter ${position} added. Full URL and Structured View updated.`,
      shouldClearSearch: searchTerm !== "",
    };
    dispatch({ type: "addQueryPiece" });
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
    <main className={styles.workbench}>
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
        >
          <label htmlFor="full-url-editor">Complete HTTP or HTTPS Absolute URL</label>
          <p id="full-url-help">
            Paste one complete URL. Applying publishes all pieces together.
          </p>
          <textarea
            id="full-url-editor"
            value={state.input}
            onChange={(event) =>
              dispatch({ type: "inputChanged", value: event.currentTarget.value })
            }
            aria-describedby="full-url-help"
            aria-invalid={state.problem ? true : undefined}
            aria-errormessage={state.problem ? "error-full-url" : undefined}
            maxLength={20_000}
            dir="ltr"
          />
          <button type="submit">Apply URL</button>
        </form>
        {state.problem ? (
          <ValidationMessage id="error-full-url">
            {state.problem.message}
          </ValidationMessage>
        ) : null}
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
          Undo, Copy, and Reorder are not available yet.
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
          dispatch({ type: "structuredEdit", command });
        }}
        onRemovePiece={removePiece}
        onAddQueryPiece={addQueryPiece}
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
