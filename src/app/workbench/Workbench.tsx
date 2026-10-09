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
  canUndo,
  initialSessionState,
  prepareParse,
  sessionReducer,
  structuredUpdateMessage,
} from "../../core/session";
import type { ManagedPieceRemoval, QueryPiece } from "../../core/url";
import { ValidationMessage } from "../feedback/ValidationMessage";
import { StructuredView } from "../pieces/StructuredView";
import { buildManagedPieces, filterManagedPieces } from "../pieces/search";
import styles from "../../styles/workbench.module.css";
import { flushSync } from "react-dom";
import { routeUndo } from "./inputArbiter";
import { createSessionExecutor } from "../../platform/effects";
import { createBrowserClipboard } from "../../platform/clipboard";
import { focusRestoredTarget } from "../../platform/focus";
import type { SessionAction } from "../../core/session";

export function Workbench() {
  const [state, rawDispatch] = useReducer(sessionReducer, initialSessionState);
  const dispatch = useCallback((action: SessionAction) =>
    rawDispatch({ ...action, now: action.now ?? performance.now() }), []);
  const stateRef = useRef(state);
  stateRef.current = state;
  const adapterFocusing = useRef(false);
  const executor = useRef(createSessionExecutor());
  const clipboard = useRef(createBrowserClipboard());
  const mounted = useRef(true);
  const visiblePiecesRef = useRef<ReturnType<typeof buildManagedPieces>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const workbenchRef = useRef<HTMLElement>(null);
  const composingTarget = useRef<EventTarget | null>(null);
  const [workbenchComposing, setWorkbenchComposing] = useState(false);
  const [fullUrlComposition, setFullUrlComposition] = useState<string | null>(null);
  const fullUrlComposing = useRef(false);
  const fullUrlEditorRef = useRef<HTMLTextAreaElement>(null);
  const copyRecoveryRef = useRef<HTMLTextAreaElement>(null);
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
  visiblePiecesRef.current = visiblePieces;
  const editorsDisabled =
    !state.lastValidSnapshot ||
    state.phase === "no-session" ||
    state.phase === "parsing";
  const invalidDraft = state.snapshot !== null && state.problem !== null;
  const operationFailure = state.structuredProblem &&
    !Object.values(state.structuredDrafts).some((draft) => draft.problem === state.structuredProblem)
    ? state.structuredProblem : null;

  const cancelPendingOperationFocus = () => {
    pendingRemovalFocus.current = null;
    pendingAddFocus.current = null;
    pendingMoveFocus.current = null;
    pendingFocusAfterSearchClear.current = null;
    if (!adapterFocusing.current) {
      stateRef.current = sessionReducer(stateRef.current, { type: "cancelFocus" });
      dispatch({ type: "cancelFocus" });
    }
  };

  const undo = () => {
    if (composingTarget.current !== null || !canUndo(stateRef.current)) return;
    pendingRemovalFocus.current = null;
    pendingAddFocus.current = null;
    pendingMoveFocus.current = null;
    pendingFocusAfterSearchClear.current = null;
    flushSync(() => dispatch({ type: "undo", revision: stateRef.current.revision }));
  };

  useLayoutEffect(() => {
    const send = (action: SessionAction) => {
      action = { ...action, now: performance.now() };
      stateRef.current = sessionReducer(stateRef.current, action);
      dispatch(action);
    };
    executor.current.run({
      current: () => stateRef.current.effects,
      active: () => mounted.current,
      ready: (effect) => effect.kind !== "focus" || effect.target.kind !== "copy-recovery" ||
        stateRef.current.copyRecovery?.attemptId !== effect.target.attemptId ||
        copyRecoveryRef.current?.dataset.attemptId === String(effect.target.attemptId),
      claim: (effect) => send({ type: effect.kind === "focus" ? "claimFocus" : "claimCopy", effectId: effect.effectId }),
      copy: (effect) => clipboard.current.write(effect.serialized),
      focus: (effect) => {
        adapterFocusing.current = true;
        try {
          if (effect.target.kind === "copy-recovery") {
            const recovery = copyRecoveryRef.current;
            if (composingTarget.current === null && recovery?.isConnected &&
              recovery.dataset.attemptId === String(effect.target.attemptId)) {
              recovery.focus();
              recovery.setSelectionRange(0, recovery.value.length);
            }
            return false;
          }
          return focusRestoredTarget(effect.target, visiblePiecesRef.current, document);
        } finally {
          adapterFocusing.current = false;
        }
      },
      acknowledge: (effect, outcome) => {
        const action: SessionAction = effect.kind === "focus"
          ? { type: "acknowledgeFocus", effectId: effect.effectId, filtered: outcome === true }
          : { type: "acknowledgeCopy", effectId: effect.effectId,
              outcome: typeof outcome === "boolean" ? "superseded" : outcome };
        if (mounted.current) send(action);
        else stateRef.current = sessionReducer(stateRef.current, action);
      },
    });
  }, [state, visiblePieces]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useLayoutEffect(() => {
    const outsideInteraction = (event: Event) => {
      if (event.target instanceof Node && !workbenchRef.current?.contains(event.target)) {
        cancelPendingOperationFocus();
      }
    };
    for (const type of ["pointerdown", "keydown", "focusin"]) {
      document.addEventListener(type, outsideInteraction, true);
    }
    window.addEventListener("blur", cancelPendingOperationFocus);
    document.addEventListener("visibilitychange", cancelPendingOperationFocus);
    document.addEventListener("wheel", cancelPendingOperationFocus, { capture: true, passive: true });
    return () => {
      for (const type of ["pointerdown", "keydown", "focusin"]) {
        document.removeEventListener(type, outsideInteraction, true);
      }
      window.removeEventListener("blur", cancelPendingOperationFocus);
      document.removeEventListener("visibilitychange", cancelPendingOperationFocus);
      document.removeEventListener("wheel", cancelPendingOperationFocus, true);
    };
  }, []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = composingTarget.current;
      if (target instanceof Node && !target.isConnected) {
        composingTarget.current = null;
        dispatch({ type: "feedbackComposition", composing: false });
        setWorkbenchComposing(false);
      }
      routeUndo(event, {
        platform: /Mac|iPhone|iPad/.test(navigator.platform) ? "mac" : "other",
        composing: composingTarget.current !== null,
        available: canUndo(stateRef.current), document, undo,
      });
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  });

  useLayoutEffect(() => {
    const workbench = document;
    const start = (event: CompositionEvent) => {
      composingTarget.current = event.target;
      dispatch({ type: "feedbackComposition", composing: true });
      dispatch({ type: "cancelFocus" });
      setWorkbenchComposing(true);
    };
    const end = (event: CompositionEvent) => {
      if (composingTarget.current !== event.target) return;
      composingTarget.current = null;
      dispatch({ type: "feedbackComposition", composing: false });
      setWorkbenchComposing(false);
    };
    workbench.addEventListener("compositionstart", start, true);
    workbench.addEventListener("compositionend", end, true);
    return () => {
      workbench.removeEventListener("compositionstart", start, true);
      workbench.removeEventListener("compositionend", end, true);
    };
  }, []);

  useLayoutEffect(() => {
    const target = composingTarget.current;
    if (target instanceof Node && !target.isConnected) {
      composingTarget.current = null;
      dispatch({ type: "feedbackComposition", composing: false });
      setWorkbenchComposing(false);
    }
  });

  useEffect(() => {
    if (!workbenchComposing) return;
    const observer = new MutationObserver(() => {
      if (composingTarget.current instanceof Node && !composingTarget.current.isConnected) {
        composingTarget.current = null;
        dispatch({ type: "feedbackComposition", composing: false });
        setWorkbenchComposing(false);
      }
    });
    observer.observe(document, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [workbenchComposing]);

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
    // Native input/change pairs can arrive before React's next render in Firefox.
    flushSync(() => {
      dispatch({ type: "inputChanged", value });
      dispatch(parse.start);
      dispatch(completion);
    });
  };

  const handleFullUrlFocus = () => {
    if (adapterFocusing.current) return;
    dispatch({ type: "fullUrlFocusBegin" });
  };

  const handleFullUrlBlur = () => {
    if (adapterFocusing.current) return;
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

  const announce = useCallback((message: string, _preserveAcrossSnapshot = false) => {
    dispatch({ type: "feedbackSearch", message });
  }, [dispatch]);

  useLayoutEffect(() => {
    if (state.feedback.current && !state.feedback.current.presented) {
      dispatch({ type: "feedbackPresented", id: state.feedback.current.id });
    }
  }, [state.feedback.current, dispatch]);

  useEffect(() => {
    const deadlines = [
      ...(state.feedback.pending.length && state.feedback.current
        ? [state.feedback.current.started + 2_000] : []),
      ...(state.feedback.validationPending && !state.feedback.composing
        ? [state.feedback.validationPending.due] : []),
    ];
    if (!deadlines.length) return;
    const timer = window.setTimeout(() => dispatch({ type: "feedbackTick" }),
      Math.max(0, Math.min(...deadlines) - performance.now()));
    return () => window.clearTimeout(timer);
  }, [state.feedback, dispatch]);

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
        pendingMoveFocus.current = {
          epoch: state.epoch,
          revision: state.revision,
          pieceId,
          direction,
          successMessage: `Moved Query Parameter ${target.sourcePosition} of ${target.sourceTotal} to position ${destinationPosition} of ${target.sourceTotal}. ${structuredUpdateMessage(state)}`,
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
    if (!state.snapshot || workbenchComposing) return;
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
        visiblePieces.length === 0
          ? `0 of ${allPieces.length} Managed Pieces shown. No Managed Piece matches ‘${searchTerm}’.`
          : `${visiblePieces.length} of ${allPieces.length} Managed Pieces shown.`,
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    allPieces.length,
    announce,
    searchTerm,
    state.snapshot,
    visiblePieces.length,
    workbenchComposing,
  ]);

  return (
    <main
      ref={workbenchRef}
      className={styles.workbench}
      onFocusCapture={cancelPendingOperationFocus}
      onChangeCapture={cancelPendingOperationFocus}
      onCompositionStartCapture={cancelPendingOperationFocus}
      onPointerDownCapture={cancelPendingOperationFocus}
      onKeyDownCapture={cancelPendingOperationFocus}
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
        <div id="full-url-validation">
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
        <button
          type="button"
          aria-disabled={workbenchComposing || !canUndo(state)}
          aria-describedby="undo-help"
          onPointerDown={(event) => event.preventDefault()}
          onClick={undo}
        >
          Undo
        </button>
        <button type="button" aria-disabled={!state.snapshot}
          aria-describedby="copy-help"
          onPointerDown={(event) => {
            if (document.activeElement !== copyRecoveryRef.current) event.preventDefault();
          }}
          onClick={() => flushSync(() => dispatch({ type: "copy" }))}>
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
        <p id="undo-help">
          {workbenchComposing
            ? "Undo inactive: finish text composition first."
            : canUndo(state) ? "Undo the latest URL change." : "Undo inactive: no URL changes to undo."}
        </p>
        <p id="copy-help">{state.snapshot
          ? "Copy the Current URL, or Last Valid URL while the Draft differs."
          : "Copy inactive: enter a valid URL first."}</p>
        <div id="operation-status" role="status" aria-live="polite" aria-atomic="true">
          {state.feedback.current ? <span key={state.feedback.current.id}>{state.feedback.current.message}</span> : null}
        </div>
        <div id="actionable-failure" role={state.copyFailure || operationFailure ? "alert" : undefined} aria-atomic="true">
        {state.copyFailure ? <p className={styles.copyFailure}>
          Couldn’t copy the {state.copyFailure.source === "current" ? "Current URL" : "Last Valid URL"}.
          {" "}Select the {state.copyFailure.source === "current" ? "Current URL" : "Last Valid URL"} below, then use Copy from your device or press Ctrl+C/Command+C.
          {" "}{state.copyFailure.outcome === "timeout" || state.copyFailure.outcome === "fenced"
            ? "The attempt timed out or was blocked by a pending clipboard write. That write cannot be cancelled and may overwrite text you copy manually. Activate Copy to retry after that write settles."
            : "Check clipboard access and activate Copy to retry."}
          {" "}The attempted URL is available below for native copy.
        </p> : null}
        {operationFailure ? <p className={styles.copyFailure}>{operationFailure.message}</p> : null}
        </div>
        {state.copyRecovery ? <div className={styles.copyRecovery}>
          <label htmlFor="copy-recovery">
            {state.copyRecovery.source === "current" ? "Current URL" : "Last Valid URL"} — copy recovery
          </label>
          <p id="copy-recovery-help">
            This is the exact URL from the failed attempt. Copy the selected text using
            {" "}Ctrl+C (Windows/Linux), Command+C (Mac), or your device’s native Copy menu.
            {" "}If needed, select all of this field first. Native copy is not verified here;
            {" "}activate Copy to retry clipboard access.
          </p>
          <textarea id="copy-recovery" ref={copyRecoveryRef}
            data-attempt-id={state.copyRecovery.attemptId}
            value={state.copyRecovery.serialized} readOnly dir="ltr"
            onBlur={(event) => {
              if (event.relatedTarget !== fullUrlEditorRef.current) handleFullUrlBlur();
            }}
            aria-describedby="copy-recovery-help" />
        </div> : null}
        {state.feedback.history.length ? <div className={styles.feedbackHistory}>
          <h3>Feedback history</h3>
          <ol aria-label="Feedback history">
            {state.feedback.history.map((outcome) => <li key={outcome.id}>{outcome.message}</li>)}
          </ol>
        </div> : null}
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
        structuredProblem={operationFailure ? null : state.structuredProblem}
        structuredSuccess={state.feedback.current?.message === state.structuredSuccess ||
          state.feedback.history.some((item) => item.message === state.structuredSuccess)
          ? null : state.structuredSuccess}
        onValidateField={(key) => dispatch({ type: "validateField", key })}
        editorsDisabled={editorsDisabled}
      />
      <div id="validation-announcer" className={styles.visuallyHidden}
        aria-live="assertive" aria-atomic="true">
        {state.feedback.validation
          ? <span key={state.feedback.validation.id}>{state.feedback.validation.message}</span> : null}
      </div>
    </main>
  );
}
