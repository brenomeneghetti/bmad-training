import { useReducer } from "react";
import {
  initialSessionState,
  prepareParse,
  sessionReducer,
} from "../../core/session";
import { ValidationMessage } from "../feedback/ValidationMessage";
import { StructuredView } from "../pieces/StructuredView";
import styles from "../../styles/workbench.module.css";

export function Workbench() {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  const apply = () => {
    const parse = prepareParse(state);
    dispatch(parse.start);
    dispatch(parse.complete());
  };

  return (
    <main className={styles.workbench}>
      <h1>URL Workbench</h1>
      <p className={styles.privacyNotice}>
        Your URL stays in this browser and is cleared when you reload or close
        this page.
      </p>

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
        <button type="button" disabled>
          Add Query Parameter
        </button>
        <p id="actions-note">
          URL-changing actions and Copy are unavailable in this inspection-only
          version.
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

      <StructuredView snapshot={state.snapshot} busy={state.phase === "parsing"} />
    </main>
  );
}
