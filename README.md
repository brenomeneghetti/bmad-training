# URL Workbench

**URL Piece Management** is a browser-local tool for inspecting and editing
complex URLs without accidentally changing their encoding, separators, duplicate
parameters, or ordering.

It is intended for developers working with long, state-bearing URLs who need a
clearer alternative to editing one large string. The complete URL and its
structured pieces stay synchronized, accepted changes can be undone, and Copy
uses the latest valid URL.

> **Under construction.** As of October 9, 2026, the core editing, Undo, Copy and
> fixed-dark workbench are implemented and accepted. The remaining UI redesign
> is planned, not delivered. Current automated browser evidence is Chromium-only;
> this is not a general release-readiness claim.

## What works today

- Inspect a complete HTTP or HTTPS URL as a Full URL and an ordered Structured
  View containing Domain, Path Segments and Query Parameters.
- Edit either the Unicode or ASCII/Punycode Domain representation.
- Search Managed Pieces across the Domain, Path Segments, query keys and values.
- Edit or remove individual Path Segments and Query Parameters, add query
  entries from either list boundary, and reorder queries with Move Up/Move Down.
- Edit the Full URL continuously, with valid changes published immediately.
- Undo committed URL changes step by step, restoring exact URL snapshots.
- Copy the Current URL, with truthful failure feedback and an exact attempted-URL
  field for manual copy when clipboard access fails.
- Use the fixed-dark layout with Copy beside Full URL and Undo below it, keyboard
  controls, responsive reflow and accessible feedback.

The tool preserves distinctions that ordinary URL normalization can erase:
duplicate keys, absent versus empty values, empty entries, encoded delimiters,
and untouched raw text. Scheme, userinfo, port and Fragment content are preserved;
they are not separate structured editors.

The supported capacity is **20,000 URL characters and at least 250 query
parameters**. Automated capacity fixtures include 260 query entries. Performance
targets are an initial parse within one second and local interactions within
100 milliseconds; the evidence documentation explains what has actually been
measured.

## A typical workflow

1. Paste a complete URL into **Full URL**, for example:

   ```text
   https://example.com/a%2Fb?dup=one&dup=two&flag&empty=#section
   ```

2. Inspect the pieces or use **Search Managed Pieces** to find an entry. Each
   duplicate query remains a distinct piece.
3. Edit a structured field or the Full URL. Valid changes update the committed
   URL immediately; Enter or leaving Full URL closes that edit as one Undo step.
4. Use **Undo** to reverse a committed change, or **Copy** to take the latest
   valid URL.

**Invalid text is not silently discarded.** An incomplete or invalid Full URL
remains a Draft while Structured View and Copy use the Last Valid URL. Structured
changes can still update that valid state without overwriting the Draft. The UI
identifies which source is being used.

Undo History records committed URL changes, not Search or every raw keystroke.
Keyboard Undo respects native text-editing and composition guards.

## Privacy and boundaries

URL processing and session state stay in the browser. The application does not
fetch or navigate to the URL being edited, send its contents to a backend, or
save sessions in browser storage. Reloading or closing the page clears the
application session.

Copy intentionally writes to the device clipboard. Copied text may remain there
after the application session ends. Clipboard availability depends on browser
permissions and a secure context, such as HTTPS or localhost.

This is not an API client, URL shortener or collaboration service. There are no
accounts, saved/shared sessions, bulk operations or Redo. Only complete
HTTP/HTTPS absolute URLs with a host are supported; relative URLs, domain-only
input and other schemes cannot start a session.

## Run locally

Prerequisites: **Node.js 24.x or 26+** and **pnpm 12.5.1**, as declared in
[`package.json`](package.json).

From the repository root, prepare the checkout-local environment before package
commands:

```sh
mkdir -p .cache/{home,tmp,browsers,config,data,runtime,npm,pnpm}
export HOME="$PWD/.cache/home" TMPDIR="$PWD/.cache/tmp"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export XDG_CACHE_HOME="$PWD/.cache" XDG_CONFIG_HOME="$PWD/.cache/config"
export XDG_DATA_HOME="$PWD/.cache/data" XDG_RUNTIME_DIR="$PWD/.cache/runtime"
export npm_config_cache="$PWD/.cache/npm" PNPM_HOME="$PWD/.cache/pnpm"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/browsers"

pnpm install --frozen-lockfile
pnpm run dev
```

Open the local address printed by Vite. Use a dedicated development/testing
shell for these exports: changing `HOME` also changes where tools such as Git
look for user configuration.

To build and preview the static application:

```sh
pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 4173
```

The production build is written to `dist/`. Production delivery must preserve
the security policy described in
[`deployment/static-delivery.json`](deployment/static-delivery.json); a local
build alone does not establish deployment or release readiness.

## Verification

Use the same checkout-local environment for these commands:

| Command | Purpose |
|---------|---------|
| `pnpm run typecheck` | TypeScript checks |
| `pnpm run lint` | Source, test and evidence linting |
| `pnpm test` | Unit tests and evidence-gate regression tests |
| `pnpm run test:e2e:install` | Install the test-only Chromium browser |
| `pnpm run build && pnpm run test:e2e` | Browser tests against the built application |
| `pnpm run evidence:run` | Fresh build, lint and full test execution with retained evidence |
| `pnpm run evidence:validate` | Validate current source/build-bound MVP evidence |

The evidence runner configures local paths for its children. Test identities and
coverage mappings are reviewed contracts, not expectations inferred from test
counts. See [the evidence guide](evidence/README.md) for integrity rules, retained
reports and release evaluation.

Passing Chromium evidence does **not** establish Firefox, WebKit, released
browser/OS/mobile coverage, real OS IME or native clipboard behavior, manual
screen-reader checks, actual 400% zoom, or representative-user usability.
Those remain separate verification obligations.

## Planned work

The current UI retains one complete Managed Piece list, two Add controls and
permanent Move controls. Remaining Epic 4 work includes independent detail
disclosures, bottom-only Add and long-list navigation, clearer query-shape
descriptions, focus/selection-driven Move controls, accessible query dragging,
and integrated redesign validation at supported limits.

Epic 5 covers deferred additional-browser and external/manual verification.
These are roadmap items, not current capabilities.

## Project structure and contracts

The application uses React, TypeScript, Vite and native CSS Modules, with no
backend. URL semantics and immutable session transitions live in `src/core/`;
browser effects such as clipboard and focus live in `src/platform/`; the
workbench UI lives in `src/app/`. Automated browser tests are in `tests/`, and
execution contracts and reports are in `evidence/`.

- [Canonical product spec](_bmad-output/specs/spec-bmad-training/SPEC.md)
- [Architecture spine](_bmad-output/planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md)
- [Sprint status](_bmad-output/implementation-artifacts/sprint-status.yaml)

The product spec describes the intended product contract. Sprint tracking and
execution evidence distinguish implemented work from planned or unverified
capabilities.
