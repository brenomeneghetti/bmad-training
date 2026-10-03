---
title: 'Story 1.6: Find and Clear Managed Pieces'
type: 'feature'
created: '2026-10-02'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'b8aa57625da7da6dcff11cba24479406e06d5fa5'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Developers cannot narrow a large Structured View to the Domain, Path Segment, Query Parameter key, or Query Parameter value they need without manually scanning every Managed Piece.

**Approach:** Add a persistently labeled, non-mutating Search filter and an activation-safe Clear Search action that preserve the complete committed model while exposing stable source identity, filtered position, settled result counts, and accessible no-result feedback.

## Boundaries & Constraints

**Always:** Search both validated Domain forms and raw path/key/value text with full Unicode case folding and no normalization; filter only the rendered view while preserving exact serialization, snapshot, epoch, immutable IDs, source ordinals, duplicate occurrences, and canonical source order. Keep all rows in the underlying full-DOM model, meet the 100 ms local-response target at 20,000 characters and 250+ Query Parameters, and preserve keyboard, screen-reader, forced-colors, reduced-motion, text-spacing, 320px, 400%-zoom, privacy, and list-boundary behavior.

**Never:** Dispatch a session command, parse again, mutate URL or History state, allocate new Piece IDs, normalize source text, reorder or virtualize rows, reuse validation feedback for Search status, clear on pointer-down/cancel or Escape, move focus into results, animate filtering, or emit URL-bearing network, storage, log, telemetry, or trace output.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Matching search | Mixed-case term matching either Domain form, raw path text, key, or value | Show only matches in source order; summary says “N of M Managed Pieces shown”; source identity remains unchanged and filtered position is separate visible text plus correct list ARIA | No validation state or URL mutation |
| No results | Active session and unmatched term | Show “0 of M Managed Pieces shown. No Managed Piece matches ‘term’.” with reachable Clear Search; surrounding landmarks and boundaries remain reachable | No modal or focus move |
| Clear activation | Active filter cleared by keyboard, click/up, or assistive technology | Restore every row and original IDs/order, focus Search, and politely announce the restored count | Pointer-down alone, cancelled pointer release, and Escape do nothing |
| Rapid updates | Fast typing, repeated terms, or alternating counts | Coalesce only a newer result-count message inside 300 ms; insert settled status within 100 ms and expose it for at least 2 seconds | Identical repeats replace the live-region child or use the tested clear/reinsert sequence |
| Capacity fixture | Near-20,000-character URL with 250+ mixed and duplicate entries | Domain/path/key/value/no-result searches and clear complete within the 100 ms target without freeze, overflow, missing results, or identity drift | Preserve the complete model and privacy invariants |

</frozen-after-approval>

## Code Map

- `package.json`, `pnpm-lock.yaml` -- pin `unicode-case-folding@1.1.2`, the ESM/TypeScript-ready default Unicode case-folding implementation; do not add normalization or locale-sensitive behavior.
- `src/app/workbench/Workbench.tsx` (`Workbench`, status region) -- own ephemeral Search state, clear activation/focus behavior, settled announcements, and snapshot-gated controls without dispatching session actions.
- `src/app/pieces/search.ts`, `src/app/pieces/StructuredView.tsx` (`StructuredView`, managed-piece rendering) -- case-fold and match the complete canonical display model, filter presentation only, retain `key`/`data-piece-id`/source labels, and add visible filtered position with list ARIA.
- `src/core/session/session.ts` (`SessionState`, reducer, publication guards) -- invariant boundary only; do not add Search state or alter generation, epoch, revision, snapshot, or ID allocation.
- `src/styles/workbench.module.css` -- extend existing panel, action, focus-visible, row, responsive, and reduced-motion patterns for Search/result UI without changing row layout.
- `src/app/workbench/Workbench.test.tsx` -- cover all match fields, identity/order preservation, no results, activation semantics, focus restoration, list metadata, and settled/repeated announcements.
- `tests/workbench.spec.ts` -- exercise keyboard/pointer Search and Clear Search, capacity response, responsive/accessibility states, and existing privacy probes.
- `evidence/manifest.json`, `evidence/validate.mjs`, `evidence/validate.test.mjs` -- add and enforce the mandatory Story 1.6 evidence mapping without weakening schema, CSP, path-safety, or artifact-digest checks.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `pnpm-lock.yaml`, `src/app/pieces/search.ts` -- pin `unicode-case-folding@1.1.2` and implement pure full-fold matching without Unicode normalization.
- [x] `src/app/workbench/Workbench.tsx`, `src/app/pieces/StructuredView.tsx` -- implement view-only matching, exact visible/total summaries, source-versus-filtered positions, one unambiguous Clear Search control, activation-safe clearing, focus restoration, and the specified announcement lifecycle.
- [x] `src/styles/workbench.module.css` -- make Search, summary, Clear Search, and filtered rows operable across committed responsive and accessibility modes.
- [x] `src/app/workbench/Workbench.test.tsx` -- test the matrix, immutable model/identity guarantees, no-normalization behavior, every filtered row's visible/ARIA position, clear/manual-empty restoration announcements, overlapping and repeated status lifetimes, snapshot replacement, focus, and pointer cancellation.
- [x] `tests/workbench.spec.ts` -- prove end-to-end Search/Clear behavior, capacity target, accessibility/reflow, and absence of privacy side effects.
- [x] `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.mjs`, `evidence/validate.test.mjs` -- register and enforce executable FR4/FR5, NFR8-NFR10, UX, capacity, and accessibility evidence for Story 1.6.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize `1-6-find-and-clear-managed-pieces` through implementation and review states.

**Acceptance Criteria:**
- Given any active session, when Search or Clear Search is used, then the committed URL, session epoch, full model, source order, IDs, ordinals, duplicate context, and serialization remain byte-for-byte and identity-for-identity unchanged.
- Given filtered results, when the view and accessibility tree are inspected, then the exact visible summary, persistent label, source identity, separate filtered position, `aria-posinset`, and `aria-setsize` agree.
- Given rapid or repeated searches, when announcements settle, then only eligible count messages coalesce within 300 ms and every exposed status is polite, atomic, repeatable, timely, and focus-neutral.
- Given the large shared fixture and required browser/accessibility modes, when Search scenarios run, then response, full-DOM completeness, privacy, focus, clipping, overflow, motion, and announcement requirements pass.

## Implementation Notes

- Search derives a canonical display sequence from the committed snapshot and applies Unicode full case folding only to comparison strings. The reducer-owned session model is unchanged.
- The result summary updates synchronously; the separate polite live region settles after 300 ms, replaces repeated messages, remains exposed for two seconds, and never receives focus.
- Native Search Escape clearing is explicitly suppressed so only click/up, keyboard activation, or assistive-technology activation of Clear Search can clear the filter.
- Review loop 1 requires a lifecycle coordinator rather than a single replaceable status slot: pending result-count candidates debounce for 300 ms, each settled/clear/restored count is inserted as a distinct atomic polite status, and each inserted status remains exposed for at least two seconds while newer statuses may coexist.

## Spec Change Log

- Iteration 1 — Review found that a single replaceable live-region value could disappear before its two-second minimum, remain stale across a new snapshot, and omit restoration when the user manually deletes the final term. The Workbench task and design now require distinct time-bounded status entries, explicit empty-term/snapshot transitions, one unambiguous clear control, and regressions for clear announcements, no normalization, all filtered positions, overlap, and replacement. Avoid the known-bad single-slot timer design. KEEP full Unicode folding without normalization, the immutable complete model, stable IDs/source order, source-versus-filtered positions, the persistent no-results boundary, activation-safe focus, capacity performance, privacy, responsive/accessibility behavior, and executable evidence.

## Review Triage Log

- `medium` / `patch` — The native `type="search"` affordance could clear the term without running the specified Clear Search focus and announcement behavior. Replaced it with a text input while retaining the persistent Search label and explicit activation path.
- `medium` / `patch` — The no-results branch removed the `#managed-pieces` skip target, making the Structured View results boundary unreachable from the existing skip link. The empty ordered list now remains mounted beside no-result feedback.
- `false` / BH-1 — The 300 ms timer defines the coalescing settlement window; the status is inserted in that timer callback, not 300 ms after settlement, so the 100 ms post-settlement bound is not exceeded.
- `medium` / BH-2 — A published search status survives a snapshot replacement until another timer fires or its two-second removal, so a new session can temporarily expose the old session's count.
- `low` / BH-3 — No-results renders a second enabled Clear Search button with the same accessible name as the persistent control, adding a redundant ambiguous tab stop.
- `false` / BH-4 — The integration test's `ß` case already exercises a multi-code-point full fold; exhaustive Unicode-table correctness belongs to the pinned case-folding dependency rather than this adapter.
- `medium` / BH-5 — No test distinguishes precomposed from decomposed Unicode, so normalization could be added accidentally while all current Search tests still pass.
- `false` / BH-6 — Search owns only component state, never dispatches, and filters immutable objects whose IDs and order are asserted; epoch, revision, snapshot, and serialization have no mutation path in the changed code.
- `low` / BH-7 — A failed capacity mutation waits for Playwright's test timeout rather than a local diagnostic timeout; this affects failure clarity, not product behavior, and adding timeout machinery is disproportionate.
- `false` / BH-8 — Component tests exercise the live-region DOM replacement, timing, and focus semantics; Playwright cannot verify actual assistive-technology speech and a second DOM-level browser assertion would not strengthen that claim.
- `false` / BH-9 — The evidence cell references executable integration/browser tests and the artifact digest binds the built implementation, so omitting component source paths does not leave behavior untraced.
- `low` / BH-10 — Sprint tracking remains `in-progress` after the spec entered `in-review`, producing a temporary lifecycle mismatch.
- `false` / BH-11 — The `node_modules` metadata changes predate Story 1.6, remain unstaged and uncommitted, and are excluded from the story commits as the user required.
- `medium` / EC-1 — Deleting the last Search character restores every row but the empty-term guard suppresses the restored-count announcement, leaving stale filtered status until removal.
- `false` / EC-2 — The 300 ms interval is the required coalescing window; insertion occurs immediately when that window settles and therefore satisfies the separate post-settlement deadline.
- `medium` / EC-3 — Replacing `searchStatus` starts a new removal timer and removes the prior message before its guaranteed two-second exposure; overlapping settled updates can violate the minimum lifetime.
- `false` / EC-4 — Nonmatching rows leave the rendered result set as required but remain in the immutable `allPieces` complete model; the unfiltered 250+ source list is still full-DOM and no virtualization occurs.
- `low` / EC-5 — Sprint tracking is still `in-progress` while the spec is `in-review`, confirming BH-10's lifecycle mismatch.
- `medium` / VG-1 — Clear Search's restored-count announcement is implemented but untested; removing the call would leave all existing clear/focus assertions passing.
- `medium` / VG-2 — The no-normalization contract is untested; normalizing both operands would make canonically equivalent raw strings match without failing the current suite.
- `medium` / VG-3 — Only the first filtered row's position metadata is asserted, so later rows could all expose position one without a test failure.

## Design Notes

Search state belongs to the Workbench presentation layer because it must not enter the reducer-owned URL/session authority or future History. Build one canonical display sequence from the snapshot, retain it as the total set, and derive visible entries from it so source identity and filtered position cannot be conflated.

Treat status as an event stream, not current state. Debounce only pending result-count candidates for 300 ms. Insert each settled, explicit-clear, or manual-empty restoration message immediately as its own keyed `role="status"`/polite/atomic entry, retain that entry for at least two seconds even when a newer entry arrives, and expire entries independently. Snapshot replacement cancels pending candidates and starts from counts derived only from the replacement snapshot; no prior count may be presented as its current result.

## Verification

**Commands:**
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` -- expected: types, lint, unit/component suites, evidence validator tests, and production build pass.
- `pnpm test:e2e` -- expected: Search/Clear, privacy, accessibility, responsive, and capacity journeys pass.
- `pnpm evidence:validate` -- expected: the Story 1.6 mandatory evidence cells and existing artifact/delivery contract validate.

**Result:** All commands passed on 2026-10-02: 45 Vitest tests, 4 evidence-validator tests, 5 Chromium end-to-end tests, typecheck, lint, production build, and six-cell evidence validation.
