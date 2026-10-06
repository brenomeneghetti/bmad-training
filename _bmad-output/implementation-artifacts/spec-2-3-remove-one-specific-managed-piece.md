---
title: 'Story 2.3: Remove One Specific Managed Piece'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'cb4b7cc49d2e894e8b7b06c4896fcf176049caaa'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Developers cannot remove one Path Segment or Query Parameter without risking a duplicate sibling, unrelated URL bytes, or loss of focus.

**Approach:** Add an identity-targeted structured removal that reconstructs only the required path/query boundaries, commits one exact snapshot transition, and restores focus predictably after the row leaves the DOM.

## Boundaries & Constraints

**Always:** Remove one Path Segment or Query Parameter by immutable Piece ID; Domain has no Remove action. Require an active session with applied Full URL text. Commit exact before/after snapshots atomically across Full URL, Current/Last Valid, and Copy source. Preserve survivors' IDs, raw text, order, percent casing, equality state, and drafts; discard only target drafts. Retain path separators; reset the first surviving query separator and remove `?` only when empty. Keep all other URL bytes and Search unchanged. Focus the next then previous visible Remove control, then Clear Search if filtered survivors remain, otherwise the Structured View heading. Announce type and original source position without stealing focus. Mutate only on click/up.

**Never:** Target by index/text, recycle IDs, normalize/merge pieces, clear Search, add unrelated features, or mutate while Full URL is unapplied/invalid. Pointer-down, cancellation, or stale/missing targets cause no commit, History entry, success, or focus change.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Path boundary | First, middle, last, empty, or trailing segment | Remove target; preserve surviving separators and other URL bytes | Reject missing/wrong-kind ID |
| Query boundary | Single, duplicate, empty, absent/empty-value entry | Remove exact entry; retain survivors; remove `?` only when empty | Reject missing/wrong-kind ID |
| Filtered focus | Search active; target removed | Keep filter; focus next, previous, then Clear Search if survivors remain | Never focus hidden/detached row |
| Guard/cancel | Full URL unapplied/invalid, stale ID, or canceled pointer | No mutation, feedback success, or focus change | Preserve committed and draft state |

</frozen-after-approval>

## Code Map

- `src/core/url/model.ts`, `src/core/url/parser.ts` -- immutable-ID removal and exact delimiters; retain scanning/edit/IDN behavior.
- `src/core/session/session.ts` -- active/applied guard, atomic journal entry, targeted draft cleanup.
- `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/app/pieces/search.ts` -- controls, retained Search, post-render focus.
- `src/styles/workbench.module.css` -- 44px controls and responsive/forced-colors focus.
- `src/core/url/parser.test.ts`, `src/core/session/session.test.ts`, `src/app/workbench/Workbench.test.tsx`, `tests/workbench.spec.ts`, `src/test/fixtures/semantic.ts` -- exactness, guards, focus, activation, and required evidence.
- `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs` -- mandatory Story 2.3 cells; retain prior and digest checks.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance Story 2.3 through implementation.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/url/model.ts`, `src/core/url/parser.ts`, `src/core/url/parser.test.ts` -- implement typed-ID removal; test boundaries, exact serialization, and wrong/missing IDs.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- implement guarded atomic journaled removal; test draft preservation/cleanup and rejection invariants.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/styles/workbench.module.css`, `src/app/workbench/Workbench.test.tsx` -- add accessible controls, retain Search, resolve focus, and test keyboard/cancel/fallback behavior.
- [x] `src/test/fixtures/semantic.ts`, `tests/workbench.spec.ts` -- cover duplicates, empty values, filtered/unfiltered removal, accessibility, privacy, responsive behavior, and 250+ entry timing.
- [x] `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs` -- require Story 2.3 cells and reject missing/non-pass evidence without weakening digest checks.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize Story 2.3 after acceptance checks pass.

**Acceptance Criteria:**
- Given duplicate pieces, when one ID is removed, then only its piece/drafts disappear and survivors retain IDs, text, drafts, and order.
- Given a path/query boundary is removed, when serialized, then only target and necessary delimiters/marker change; other bytes remain exact.
- Given a valid removal commits, when state publishes, then Full URL, Structured View, Current/Last Valid, Copy source, and one exact journal entry agree atomically.
- Given Search is active, when its visible target is removed, then the filter remains and focus follows the post-removal next/previous/fallback order.
- Given Full URL is unapplied/invalid or activation is stale/canceled, when removal is attempted, then committed state, drafts, History, Search, success, and focus remain unchanged.
- Given browser and capacity evidence runs, when Story 2.3 cells are evaluated, then exactness, focus, accessibility, privacy, and performance pass.

## Implementation Notes

- Added immutable-ID path/query removal with lossless surviving delimiters and query-marker cleanup only after the final entry.
- Reducer removal is gated on an active applied URL, atomically updates snapshots and one history entry, and clears only the removed piece's drafts.
- Added accessible path/query Remove actions, retained Search, and post-render next/previous/fallback focus with non-interrupting outcome status.
- Added four mandatory Story 2.3 evidence cells. Browser testing caught and fixed an accessible-name collision with path/query text fields.
- Review follow-up added explicit root-path, later-source-position, path draft/history, rejected-draft, and pending-parse coverage; sprint tracking now shows `review`.

## Spec Change Log

## Review Triage Log

- `false` (blind-hunter): The pnpm metadata is pre-existing local install state, predates Story 2.3, and remains excluded from product changes per the user's instruction.
- `low -> patch` (blind-hunter): The sprint tracker lagged the spec's review state; synchronized the Story 2.3 entry to `review` and refreshed `last_updated`.
- `false` (blind-hunter): The committed snapshot/Last Valid state is the future Copy source; Copy itself is an Epic 3 capability and remains intentionally disabled here.
- `false` (blind-hunter): Remove names include type, source position, and immutable Piece ID, satisfying the approved stable-identity requirement and distinguishing duplicates.
- `medium -> patch` (blind-hunter): Existing status coverage used only source position 1; added a filtered source-position-2 removal assertion for the announcement.
- `medium -> patch` (blind-hunter): Root `/` is represented by one empty path piece; added an exact test for removing that sole piece.
- `medium -> patch` (blind-hunter): Rejected-removal tests did not assert local draft preservation; added a stale wrong-kind rejection assertion that checks the draft object and value remain unchanged.
- `medium -> patch` (blind-hunter): The pending-parse guard lacked direct coverage; added a reducer test proving a removal cannot mutate the retained snapshot during parsing.
- `false` (edge-case-hunter): A stale/missing removal clears `structuredSuccess` to `null` in the reducer's rejection branch, so the previous success announcement does not remain.
- `medium -> patch` (verification-gap): Path removal's specific target-draft cleanup and `remove-path` history type were untested; added assertions for target cleanup, survivor draft retention, and exact before/after journal data.

## Design Notes

Keep surviving raw path separators; never regenerate decoded text. Reset the first query separator, preserve empty survivors, and remove `?` only after the last entry.

## Verification

**Commands:**
- `pnpm test` -- expected: all unit and evidence tests pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- expected: clean checks and production build.
- `pnpm exec playwright test tests/workbench.spec.ts --reporter=line` -- expected: removal flows pass.
- `pnpm run evidence:validate` -- expected: manifest and digest pass.

**Results:** All checks passed with Node 24.21.0 and pnpm 12.5.1: 146 Vitest tests, 5 evidence-validator tests, typecheck, lint, production build, 9 Chromium scenarios, and 20 mandatory evidence cells. Artifact digest: `d6ce1922ddb53d454dd69527062067de7eef9af99a2783f56ae993cd6b1ca505`. Build emitted the large-chunk advisory.