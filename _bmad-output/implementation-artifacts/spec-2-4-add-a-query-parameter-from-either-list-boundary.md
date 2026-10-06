---
title: 'Story 2.4: Add a Query Parameter from Either List Boundary'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '957a95e18db6d2708eca4adc3a401c3dc0ef9fcc'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no way to add a Query Parameter today. The Workbench has a disabled "Add Query Parameter" placeholder in Actions, and extending a long URL requires manually retyping the Full URL textarea, which risks rewriting untouched bytes.

**Approach:** Add one lossless `addLosslessQueryPiece` core operation and a `addQueryPiece` session command that append exactly one new Query Parameter (fresh non-recycled ID, correct `?`/`&` structure) after existing entries, atomically updating snapshot/history. Wire two identically-behaving "Add Query Parameter" controls (Actions region before the list, and a new control mounted before the Structured View heading after the list) plus a "Skip to Add Query Parameter" skip link, Search-clearing-then-add as one operation, and deterministic focus to the new key field. Extend Remove's focus fallback to land on the after-list Add control, and add Story 2.4 evidence cells. New rows initially use the same implicit `equalsPresent`-on-edit behavior as existing rows (an explicit value-presence toggle is deferred — see `deferred-work.md`).

## Boundaries & Constraints

**Always:**
- Allocate the new Piece ID via the existing `nextPieceId` counter (mirrors parse-time allocation); never recycle an ID.
- Preserve every existing Domain/Path/Query/Fragment byte and identity; only append-side separators (`?` marker, leading `&`) may change.
- Reuse `insertRawComponent` with the `query-key`/`query-value` profiles for any typed text on the new row; never bypass field-specific encoding.
- Gate `addQueryPiece` on `phase === "active" && input === snapshot.serialized`, exactly like `removePiece`; reject stale/unavailable sessions with no mutation, no history entry, no Search change, no focus change.
- Produce exactly one `MutationEntry` (`field: "add-query"`) per accepted Add, with full before/after snapshots.
- Clearing an active Search and adding the row must be one deterministic reducer-driven operation (no separate dispatch for the clear).
- Apply pointer-cancel-safe activation (`onPointerDown` preventDefault + `onClick`) identical to existing Remove controls.
- New row starts with `rawKey: ""`, `equalsPresent: false`, `rawValue: ""`; the existing `query-key`/`query-value` `EditableToken` editors and `editLosslessToken` handle all further edits, same as any other row — empty and duplicate keys remain permitted.

**Never:**
- Do not touch Path add, Reorder, Undo, or Copy — those stay disabled placeholders (later stories).
- Do not add a dedicated value-presence toggle control (deferred to a follow-up spec).
- Do not use `URLSearchParams` or any generic delimiter join for serialization.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No query present | `https://example.com/a` | Appends `?` marker + one empty entry with `separatorBefore: ""` | N/A |
| Empty query marker | `https://example.com/a?` | Reuses existing `?`; appends entry with `separatorBefore: ""` | N/A |
| Existing query entries | `https://example.com/a?x=1` | Appends entry after `x=1` with `separatorBefore: "&"` | N/A |
| Developer edits new row | Key/value typed on new row | Behaves like any other row via `editLosslessToken` (empty key, empty/absent value, duplicate key all permitted) | N/A |
| Search active when Add invoked | Search term set, Add clicked | Search clears, full list returns, new row focuses by ID in one operation | N/A |
| Stale/unavailable session | Full URL unapplied/invalid, or pointer canceled before up | No row, no mutation, no history, no Search change, no focus change | Structured problem set as with `removePiece`'s guard branch |
| 250+ entries | Query already has 250+ params | Add remains reachable from either control without row traversal; completes within 100 ms | N/A |

</frozen-after-approval>

## Code Map

- `src/core/url/model.ts` -- no new public type needed; the session layer allocates a `PieceId` directly and passes it plus the target kind to the new parser function.
- `src/core/url/parser.ts:330-380` (`removeLosslessPiece`) -- mirror structure for new `addLosslessQueryPiece(url, pieceId)`: push a fresh empty `QueryPiece` (`rawKey: ""`, `equalsPresent: false`, `rawValue: ""`, `separatorBefore` `""` if first else `"&"`), set `queryPresent: true`, reserialize via the existing `serializeParts` pattern at `:233-246`.
- `src/core/session/session.ts:68-79` (`SessionAction`) -- add `{ type: "addQueryPiece" }`; `:291-367` (`removePiece` case) -- mirror for new `addQueryPiece` case: same active/snapshot/input guard, allocate ID via `createIdAllocator(state.nextPieceId).next()`, increment `nextPieceId` by 1, call `addLosslessQueryPiece`, push one `MutationEntry` with `field: "add-query"`, set `structuredSuccess` message.
- `src/core/session/session.ts:14-33` (`MutationEntry`) -- extend `field` union with `"add-query"`.
- `src/app/workbench/Workbench.tsx:239-263` (Actions region) -- enable the existing disabled "Add Query Parameter" button; dispatch `addQueryPiece` through the same clear-search-then-dispatch path used for `onStructuredEdit` (`:277-287`).
- `src/app/workbench/Workbench.tsx:200-205` (skip-link pattern) -- add a second skip link "Skip to Add Query Parameter" targeting the new after-list control's id (`add-query-after`).
- `src/app/workbench/Workbench.tsx:50-111` (`pendingRemovalFocus`/fallback effect) -- extend fallback chain: same-subcontrol row -> `clear-managed-piece-search` -> new `add-query-after` button -> `structured-heading`.
- `src/app/pieces/StructuredView.tsx:600-814` (list region) -- add the after-list "Add Query Parameter" button (`id="add-query-after"`) immediately after the closing `</ol>` of `managed-pieces`, so it follows the rows in DOM/reading order per epic-2-context's "rows → after-list Add" sequence; focus the new row's key field (`query-key-{id}`) after commit.
- `src/styles/workbench.module.css:29-41,228-231` -- reuse existing 44px button and skip-link classes; no new classes expected.
- `evidence/schema.json:36-69` -- extend `id` pattern to `2-[1234]`, `story` enum to include `"2.4"`, `minItems`/`maxItems` to `24`.
- `evidence/manifest.json` -- add 4 Story 2.4 cells (identity/exact-append, atomic-history/guard, accessibility/focus/skip-link, privacy/capacity).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance `2-4-add-a-query-parameter-from-either-list-boundary` through implementation.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/url/parser.ts`, `src/core/url/parser.test.ts` -- implement `addLosslessQueryPiece`; test no-query, empty-marker, existing-query, and exact byte preservation of untouched pieces.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- implement guarded atomic `addQueryPiece` reducer case; test ID non-recycling, one history entry, stale/unavailable rejection, 250+ capacity.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/styles/workbench.module.css`, `src/app/workbench/Workbench.test.tsx` -- wire both Add controls, skip link, Search-clear-then-add, new-row focus, and extended Remove fallback; test keyboard/cancel/focus behavior.
- [x] `src/test/fixtures/semantic.ts`, `tests/workbench.spec.ts` -- cover new-entry add at 0/1/250+ existing entries, keyboard/touch/AT/responsive/performance.
- [x] `evidence/schema.json`, `evidence/manifest.json`, `evidence/validate.test.mjs` -- require 4 new Story 2.4 cells, reject missing/non-pass evidence.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize Story 2.4 after acceptance checks pass.

**Acceptance Criteria:**
- Given no query, an empty marker, or existing Query Parameters, when either Add control is activated, then exactly one new Query Parameter with a fresh ID is appended with correct marker/separator structure and all other bytes unchanged.
- Given Search is active when Add is invoked, when the mutation runs, then Search clears, the full list returns, and focus moves to the new key field in one deterministic operation.
- Given Add commits, when state publishes, then Full URL, Structured View, snapshots, Copy source, and exactly one history entry update atomically without interrupting the focused key field.
- Given a Remove leaves no same-subcontrol survivor and no filtered Clear Search target, when focus resolves, then it lands on the after-list Add control.
- Given a pointer cancels before up, the command is stale, or the session is unavailable, when Add activation ends, then no row, mutation, history, Search change, or focus change occurs.

## Implementation Notes

- Implemented `addLosslessQueryPiece` (parser.ts) and the `addQueryPiece` session reducer case, mirroring `removePiece`'s atomic active/applied guard, non-recycled ID allocation (`createIdAllocator(state.nextPieceId)`), and single `MutationEntry` per accepted Add.
- Wired `add-query-before` (Actions region, always enabled when editors are) and `add-query-after` (StructuredView, after the rows) to the same `addQueryPiece` handler, which pre-clears an active Search and pre-computes the predicted new Piece ID (mirroring the reducer's own allocator against the same `nextPieceId`) to drive deterministic post-commit focus of the new key field.
- Extended Remove's focus-fallback chain to: same-subcontrol row -> Clear Search -> `add-query-after` -> `structured-heading`.
- **Review fix:** the implementing subagent originally mounted `add-query-after` *before* the `<ol>` rows (contradicting epic-2-context.md's explicit "rows → after-list Add" reading order and the "after-list" naming itself). Moved the button to immediately after the closing `</ol>` during acceptance audit; re-ran the full suite (160 vitest + 6 evidence + typecheck/lint/build + 11 Playwright) — all pass — and recomputed/updated the evidence artifact digest in `manifest.json` to match the rebuilt `dist` after the fix.
- Added 4 Story 2.4 evidence cells (`story-2-4-identity-exact-append`, `-atomic-history-guard`, `-accessibility-focus-skip-link`, `-privacy-capacity`); extended `evidence/schema.json` to 24 cells and the `2-[1234]` ID pattern; fixed a stale "through Story 2.3" log string in `evidence/validate.mjs`.
- Did not add a new fixture to `src/test/fixtures/semantic.ts`; Playwright tests use inline fixtures instead since the existing capacity fixture is padded to exactly the 20,000-char cap and can't accept an append without tripping the capacity guard.

## Review Triage Log

Three parallel review layers (blind-hunter, edge-case-hunter, verification-gap) ran against the diff since baseline `957a95e`. All three independently surfaced the same root defect (search-clear not gated on success); two independently surfaced the same code-quality smell (duplicated ID-prediction logic). No findings required a loopback (`intent_gap`/`bad_spec`); `review_loop_iteration` remains `0`.

| # | Finding | Source(s) | Verdict | Disposition | Resolution |
|---|---------|-----------|---------|-------------|------------|
| 1 | `addQueryPiece` cleared the active Search term unconditionally *before* dispatch, so a capacity-exceeded rejection silently wiped the user's Search filter even though no row was added | edge-case-hunter, verification-gap (regression gap), blind-hunter ("speculative `pendingAddFocus` population before success is known") | high | patch | Deferred the Search-clear into the existing `pendingAddFocus` `useLayoutEffect`, gated on `state.structuredSuccess === pending.successMessage` (same success-gate already used for focus); added a second effect to focus the new key field only after the deferred clear's re-render. Added `Workbench.test.tsx` regression test ("leaves an active Search unchanged when Add is rejected for exceeding URL capacity") using a single-parameter at-capacity fixture. |
| 2 | Untested capacity-exceeded UI path for Add | blind-hunter | high | patch | Covered by the same new regression test as #1. |
| 3 | Both "Add Query Parameter" controls share one identical accessible name, making them indistinguishable to screen-reader/assistive-tech users navigating by name | blind-hunter | high | patch | Added distinguishing `aria-label`s ("Add Query Parameter before the list" / "...after the list") to `add-query-before` and `add-query-after`; updated existing tests that queried by the shared visible name to use the new accessible names or element `id`. |
| 4 | New `add-query-after` button has no CSS class (unlike `removeButton`), leaving it flush against the preceding `</ol>` with no spacing | blind-hunter | low | patch | Added `.addAfterButton { margin-block-start: 1rem; }` and applied it to the button. |
| 5 | Duplicated client-side ID-prediction logic: `Workbench.tsx`'s handler and `session.ts`'s reducer both independently call `createIdAllocator(state.nextPieceId).next()` against the same state to predict the new piece's ID for focus targeting | blind-hunter, verification-gap (Other findings) | medium | defer | Correct today only because React batches the prediction and dispatch in the same tick; a real fix requires the reducer to expose the committed ID back to the caller, a moderate state-shape change out of scope for this story. Logged in `deferred-work.md`. |
| 6 | Asymmetric test coverage between the before-list and after-list Add controls (each exercises a different subset of scenarios) | blind-hunter | low | false | Both controls call the identical `addQueryPiece` handler; verified the full scenario set (no-query append, after-list append + focus, search-clear-then-add, pointer-cancel, stale-session rejection, disabled-state) is covered in aggregate across the two controls, matching this codebase's existing per-row test convention (e.g. Remove). No functional gap. |
| 7 | Duplicated query-serialization logic (`queryRaw` map/join + `serializeParts` pattern) repeated across `parser.ts` functions | blind-hunter | low | false | Verified against baseline commit `957a95e`: this duplication pattern pre-dates Story 2.4 (present in `removeLosslessPiece` et al. before this story). `addLosslessQueryPiece` mirrors the established convention per the spec's own Code Map instruction; not a regression introduced by this diff, out of scope to refactor here. |
| 8 | Undocumented rationale for new rows defaulting to `equalsPresent: false` | blind-hunter | low | false | Already documented: spec `Approach`/`Boundaries & Constraints` sections and the corresponding `deferred-work.md` entry both state new rows use the same implicit `equalsPresent`-on-edit behavior as existing rows, pending the deferred value-presence-toggle work. |
| 9 | No evidence cell for duplicate-label discoverability | blind-hunter | low | false | Moot: the underlying duplicate-name defect (#3) is fixed directly, not deferred, so there is no remaining gap needing a dedicated evidence cell. |
| 10 | Final fallback branch in `pendingRemovalFocus`'s focus-chain effect (`#structured-heading`) appears unreachable in practice, since `add-query-after` is disabled only when `editorsDisabled`, which cannot be true immediately after a successful removal | verification-gap (Other findings) | low | false | Intentional defensive fallback consistent with the rest of the same four-tier chain; harmless dead code today, not a correctness issue, and guards against future changes that could disable the button for other reasons. |

## Verification

**Commands:**
- `pnpm test` -- expected: all unit and evidence tests pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- expected: clean checks and production build.
- `pnpm exec playwright test tests/workbench.spec.ts --reporter=line` -- expected: add flows pass.
- `pnpm run evidence:validate` -- expected: manifest and schema pass with 24 cells.
- Re-ran all of the above after the review-triage patches (aria-labels, deferred Search-clear, CSS class, new capacity+Search regression test): `pnpm test` (160 vitest unit + 6 evidence, all pass), `pnpm run typecheck && pnpm run lint && pnpm run build` (clean), `pnpm exec playwright test tests/workbench.spec.ts` (11/11 pass), `pnpm run evidence:validate` (24 cells, digest `a7014dfa6b74b9e43a16f6abf8e90484050d878c16036379bdd49fed7bff0571`).
