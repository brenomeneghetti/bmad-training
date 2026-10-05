---
title: 'Story 2.1: Edit Path and Query Text Without Rewriting Untouched Content'
type: 'feature'
created: '2026-10-04'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '8716db16edf048bd76ed07e00435dc78d135729a'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Developers can inspect Path Segments and Query Parameters, but cannot edit one field without risking normalization, delimiter damage, duplicate ambiguity, or unrelated byte changes.

**Approach:** Add reducer-owned raw component editing backed by a pure insertion codec and exact token mutation, preserving all unaffected URL text and identities while invalid local drafts remain correctable.

## Boundaries & Constraints

**Always:** Address edits by immutable Piece ID, field kind, token revision, UTF-16 selection range, and inserted text. Commit each valid input operation immediately and atomically while invalid text remains a local correctable draft. Preserve untouched bytes, separators, percent casing, authority, Fragment, order, duplicate identity, and absent-versus-empty values. Accepted edits update Current/Last Valid snapshot, Full URL, Structured View, Copy source, token revision, and one exact before/after mutation entry. Keep validation field-specific, persistent, associated, IME-safe, and focus-preserving.

**Never:** Decode fields for editing; use `URLSearchParams`, generic round-trip splitting, canonical serialization, index identity, ID recycling, or stale-command rebasing. Do not implement Domain editing, Add, Remove, Reorder, Full URL close-and-rebase, Undo, or Copy behavior. Do not move Search into reducer state or emit URL content to external sinks or diagnostics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Path insertion | Reserved text, Unicode, `+`, or complete percent triplets | Encode only inserted text with the path profile; preserve `+`, complete triplets, untouched prefix/suffix, and all unrelated bytes | Reject bare/partial `%` and ranges splitting an existing triplet |
| Query edit | Key or value with delimiters, Unicode, duplicates, empty/absent value | Apply the field-specific query profile to the target Piece ID only; preserve `equalsPresent`, siblings, separators, and order | Keep invalid draft local; committed snapshot and journal stay unchanged |
| Stale command | Missing ID, old token revision, or invalid UTF-16 range | No committed mutation, history entry, success status, or unrelated focus movement | Show a safe non-content explanation without rebasing |
| Capacity edit | Near-20,000-character URL with 250+ query entries | Commit within the 100 ms target with stable identity and exact serialization | No partial publication, freeze, omission, layout blockage, or URL-bearing diagnostics |

</frozen-after-approval>

## Code Map

- `src/core/url/model.ts` and `src/core/url/parser.ts` -- preserve raw path/query tokens, separators, exact serialization, and immutable IDs; extend mutation behavior without changing scanner acceptance.
- `src/core/url/codec.ts` -- add the pure UTF-16 range-aware component insertion codec and field-specific encoding profiles.
- `src/core/contracts/problems.ts` -- add stable non-content structured-edit problem codes.
- `src/core/session/session.ts` -- reducer authority for local drafts, token revisions, Current/Last Valid snapshots, atomic structured edits, and exact mutation entries; retain existing epoch/generation/revision guards.
- `src/app/pieces/search.ts` -- continue deriving presentation-only Managed Pieces in canonical source order; do not make Search mutative.
- `src/app/pieces/StructuredView.tsx` -- replace read-only Path/key/value controls with stable controlled editors and associated validation.
- `src/app/workbench/Workbench.tsx` -- dispatch structured edit commands with DOM selection data while preserving focus and existing intake/Search behavior.
- `src/test/fixtures/semantic.ts` and `evidence/manifest.json` -- add shared Story 2.1 semantic fixtures and mapped FR6/AG-1/accessibility/privacy/performance evidence.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/url/codec.ts`, `src/core/url/codec.test.ts` -- implement and exhaustively test range validation, percent-triplet preservation, literal `+`, uppercase UTF-8 insertion, and path/query encoding profiles.
- [x] `src/core/url/model.ts`, `src/core/url/parser.ts`, `src/core/contracts/problems.ts` -- add exact target-token mutation and typed rejection contracts without changing parser round trips.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- add reducer-owned drafts, token revisions, Last Valid/current state, atomic accepted transitions, exact before/after journal entries, and no-op rejection guarantees.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/app/workbench/Workbench.test.tsx` -- wire accessible controlled editors, selection-aware dispatch, persistent validation, IME suppression, and focus retention while preserving Search/list semantics.
- [x] `src/test/fixtures/semantic.ts`, `src/core/url/parser.test.ts`, `tests/workbench.spec.ts` -- cover duplicates, encoded delimiters, percent case, Unicode, malformed percent text, empty/absent values, privacy, accessibility, and capacity.
- [x] `evidence/manifest.json` -- map passing Story 2.1 FR6, AG-1 codec, accessibility, privacy, and performance cells to reproducible evidence.

**Acceptance Criteria:**
- Given a Path Segment, Query key, or Query value editor, when a valid edit is applied, then only the addressed token and explicitly changed delimiter presence differ and every synchronized surface publishes one coherent exact snapshot.
- Given an invalid, stale, missing-piece, out-of-range, or split-triplet edit, when the reducer evaluates it, then committed state, identities, token revisions, journal, and unrelated focus remain unchanged while the local draft exposes associated correction guidance.
- Given duplicate or identical-looking pieces, when one Piece ID is edited, then no sibling changes identity, content, position, validation, or serialization.
- Given IME, keyboard-only, 320px, 400% zoom, forced-colors, text-spacing, privacy, and capacity fixtures, when verification runs, then editing remains operable, responsive, exact, and free of prohibited URL sinks.

## Implementation Notes

- Added a pure raw-component insertion codec with UTF-16, surrogate-pair, and percent-triplet boundary validation plus distinct path, query-key, and query-value profiles.
- Added immutable ID-targeted token mutation, exact URL reconstruction, reducer-owned local drafts and token revisions, Last Valid/current snapshots, and complete before/after mutation entries.
- Converted Path and Query fields into accessible controlled editors with selection-aware input/paste handling, IME suppression, persistent associated errors, and focus-stable updates.
- Extended the shared semantic corpus, core/component/browser coverage, and evidence matrix through Story 2.1.

## Spec Change Log

- 2026-10-04: Implemented all Story 2.1 tasks and recorded passing automated evidence.

## Review Triage Log

- `medium` → patched: token edits rebuilt serialization but retained stale malformed-percent diagnostics; mutation now rescans the exact result and a regression test verifies correction clears the problem.
- `medium` → patched: stale-revision rejection applied old selection coordinates to the current token when constructing a draft, which was a local rebase; it now preserves the current raw field unchanged and attaches safe guidance.
- `medium` → patched: missing-piece rejections were reducer-visible but had no rendered feedback path; Structured View now exposes the non-content explanation without duplicating field-associated draft errors.

## Design Notes

The codec operates on raw component text: validate the UTF-16 replacement range, reject boundaries inside existing percent triplets, preserve complete inserted triplets and literal `+`, percent-encode other inserted code points with uppercase UTF-8 hex, then splice the untouched prefix and suffix byte-for-byte.

Structured invalid drafts remain keyed by immutable Piece ID and field. A correction is evaluated against the draft but commits as one replacement against the unchanged trusted token, preserving a single atomic journal entry.

## Verification

**Commands:**
- `pnpm test --run` -- all core, reducer, and component tests pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- static checks and production build pass.
- `pnpm exec playwright test tests/workbench.spec.ts` -- focused browser, accessibility, privacy, and capacity scenarios pass.

**Result:** 67 Vitest tests, 4 evidence-validator tests, typecheck, lint, production build, 6 Playwright scenarios, and final evidence validation passed.
