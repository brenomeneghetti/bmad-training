---
title: 'Story 3.1: Undo Every Committed URL Change Exactly'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '3baeac299ec44ac44c81340991a221bf92acd15f'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The mutation journal already retains exact URL models, but visible Undo is permanently disabled. Developers cannot reverse edits or recover their Initial URL.

**Approach:** Enrich each journal entry with the prior token revisions, then restore the newest complete prior snapshot through one guarded reducer transaction. Enable persistent visible Undo with truthful operation feedback, retaining invalid Full URL Drafts and active Search.

## Boundaries & Constraints

**Always:**
- Restore the stored model by reference, including serialization, Domain forms, IDs, separators, presence flags, percent casing, order and Fragment, plus exact prior token revisions.
- Close a meaningful Full URL edit before Undo atomically; reverse its coalesced change first. Availability includes journal entries or a changed open edit, never initial intake or unchanged focus.
- Guard Undo with the originating session revision before closing anything. Empty/stale commands return the identical state without status or effects. Undo pops exactly one entry and never journals restoration.
- Keep session revision, generation and allocation monotonic; invalidate pending parsing, clear the open edit, never recycle IDs. New mutations branch from restored state.
- Preserve differing/invalid Full URL Draft text, selection, direction and validation while restoring Current/Last Valid and Copy source. Say “Draft URL is unchanged.” Never restore invalid or intermediate coalesced text.
- Keep Search active and derive rows/results from the restored model. Preserve unrelated structured drafts; discard drafts for removed or changed/restored fields so they cannot mask restored values.
- Activate on click/up only. Keep Undo focus even when inactive; prevent pointer focus changes disturbing Draft selection. Expose explicit non-color and programmatic inactivity.
- While any Workbench editor is composing, visible Undo is inactive and activation cannot restore state. Re-enable after composition settles without discarding unfinished text, per the user's 2026-10-08 decision.
- Retain browser-local privacy and existing 20,000-character/260-entry, under-100-ms response contracts. Record execution-bound evidence on the approved Chromium MVP target.

**Never:** Implement product keyboard shortcuts, operation-specific focus/effect execution (3.2), Copy/recovery, shared feedback scheduling, Redo, persistence, production dependencies, release certification or additional-browser claims.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Undo each mutation | Path/key/value/Domain edit, Add, Remove, Reorder, Full URL | Pop one intent; exact prior model/revisions restored | No reparse |
| Open Full URL edit | Several valid states since baseline | Close and reverse one coalesced intent atomically | No intermediate restoration |
| Invalid Draft chronology | A→C→D→E→F plus invalid X | Restore E, D, C, A; X/validation/selection unchanged | Source-aware feedback |
| Empty/stale/cancelled | No history, outdated revision, pointer-down only | No mutation, journal change or success | Identical reducer state |
| Branch after Undo | Undo Add, then add/edit again | Fresh IDs; latest restored baseline; no forward history | Existing validation |
| Local field draft | Draft on unaffected versus restored field | Preserve unaffected draft; restored field displays snapshot | Clear obsolete field error |
| Capacity/privacy | 20,000 characters, 260 parameters | Exact restoration under 100 ms, no sinks/overflow | Existing capacity contract |

</frozen-after-approval>

## Code Map

- `src/core/session/session.ts`: `MutationEntry`, `fullUrlFocus`, six history writers and `closeFullUrlEditIfOpen`; capture missing revision maps. Reuse `structuredPublication` and guards; share availability.
- `src/app/workbench/Workbench.tsx`: disabled Actions placeholders, synchronous publication, pending-focus cancellation, `flushSync`, snapshot-derived Search.
- `src/app/pieces/StructuredView.tsx`: local composition/caret refs; change only for reproduced restoration defects.
- Existing session/Workbench/browser suites and `src/test/fixtures/semantic.ts`: reusable lifecycle, semantic and capacity fixtures. Existing reversal assertions manually walk entries, not actual Undo.
- `evidence/`: extend mandatory-cell mappings and reviewed inventory, preserving integrity contracts; schema v2 needs no story-count change.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/session/session.ts` -- capture prior revisions at every history writer/baseline; add availability, guarded Undo, obsolete-draft cleanup and operation status.
- [x] `src/app/workbench/Workbench.tsx` -- wire Undo, focus/inactivity, status/help, Search/Draft preservation and obsolete-focus cancellation.
- [x] `src/core/session/session.test.ts` -- actual Undo for every matrix row, mutation kind, revision map, stale parsing, chronology and branching.
- [x] `src/app/workbench/Workbench.test.tsx`, `tests/workbench.spec.ts` -- visible reversal, IDs/IDN/empty values, Draft selection/errors, Search, pointer cancellation, accessibility, privacy/capacity.
- [x] `evidence/{validation.mjs,coverage.json,inventory.json,validate.test.mjs,README.md,validate.mjs}` -- mandatory 3.1 exact-history, guard/Draft, accessible-action and privacy/capacity cells, exact identities and negative tests; retain existing cells.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance Story 3.1 and parent Epic 3 during implementation; leave 3.2–3.6 in backlog.

**Acceptance Criteria:**
- Given any supported mutation sequence, when visible Undo reverses it repeatedly, then every stored prior model and token revision map restores exactly, all derived surfaces agree, and final state is Initial URL with inactive Undo.
- Given an invalid Draft and active Search, when Undo restores Last Valid, then Draft text/selection/validation and Search remain exact, filtered results update, and status names the operation without claiming Draft synchronization.
- Given stale, empty or cancelled activation, when evaluated, then no restoration or success occurs; given a new mutation after Undo, then allocation never reuses IDs and no Redo exists.
- Given the approved Chromium evidence run, when evaluated, then all existing and Story 3.1 cells bind passing exact executions without weakening thresholds or claiming deferred coverage.

## Implementation Notes

- Journal entries and Full URL baselines retain immutable prior revision-map references. `canUndo` includes changed open edits; revision-guarded Undo closes/pops atomically and restores model/revisions without parsing or allocating.
- Restoration compares field values and revisions to retain only unaffected structured drafts. Current/Last Valid and serialized export source restore together; differing Full URL text and validation remain untouched.
- Visible Undo uses `aria-disabled` and explicit help rather than native disabled, remains in the tab order, and prevents pointer-down focus changes. Existing pending mutation focus is cancelled before restoration; no operation-specific Undo focus routing or shortcut was added.
- Updated existing exact-history assertions for the new revision metadata and the browser tab-order assertion for persistent focusable Undo. Evidence integrity fixtures now require 40 cells; schema remains v2.
- Parent review reproduced stale Domain composition completion overwriting restoration. Native capture listeners now gate visible Undo throughout composition in every editor, including same-turn programmatic activation; unfinished text remains intact. Added component/browser settlement regressions.
- Added nonzero revision-map and unusual/malformed accepted-source reversal coverage. Retained native report whitespace unchanged and scoped `.gitattributes` whitespace exemption to generated command logs only.

## Spec Change Log

- 2026-10-08, iteration 1: Direct review reproduced composition-end overwriting a just-undone Domain. The user authorized direct review/repairs and chose inactive Undo until composition settles. Amend the UI gate and native composition regressions in place, preserving exact snapshot/revision restoration, invalid Drafts, Search, monotonic allocation and existing composition final-input handling.

## Review Triage Log

The three independent reviewers could not access the system-temp diff. Repository-local follow-up was refused because the runtime does not resume synchronous agents. These tool failures are not code findings. The user explicitly authorized direct review and repairs; no independent-review success is claimed.

| Finding | Verdict | Evidence and disposition |
|---------|---------|--------------------------|
| Direct D1: in-progress composition can overwrite Undo | high | Component reproduction restored `example.com`, then the old Domain composition end replaced it with `example.net`. User chose inactive visible Undo until composition settles. Added native capture/ref gating and component/browser checks for Domain, token and Full URL. Repaired in place by explicit user authorization. |
| Direct D2: exact-revision tests only undo zero baselines | medium | Original per-kind fixtures initialized revision maps at zero; a default-zero restoration could escape those checks. Added a normal-suite regression with nonzero Domain/query revisions, Full URL rebasing, branched reversal and malformed accepted source. |
| Direct D3: staged native logs fail whitespace checks | low | Staged diff exposed original tool output trailing whitespace and final blank lines, although the implementation report claimed a clean check. Keep immutable native report bytes/hashes and exempt only `evidence/runs/*/*.txt` through `.gitattributes`; source remains checked. |
| Direct D4: Undo could reuse IDs after branching | false | The reducer preserves `nextPieceId`; core and browser branch-after-Undo tests assert the next Add ID differs from the undone ID. |
| Direct D5: stale Undo could close an open edit | false | Revision guard precedes close-and-pop; the executed stale-action test asserts identical state with open/pending work retained. |
| Direct D6: restoring history could admit stale parsing | false | Close/publication invalidate generation and clear pending input; the executed test delivers the prior completion and asserts identical restored state. |
| Direct D7: inactive Undo could lose focus or clear Draft selection | false | `aria-disabled` leaves the control focusable; pointer-down prevents focus changes. Component/browser checks prove inactive keyboard focus and backward Full URL selection preserved. |
| Direct D8: composition gate remains latched after editor removal | medium | The new native gate reproduced inactive Undo after removing a composing Query Parameter without `compositionend`. Release the gate after the target detaches from the Workbench; the added component regression asserts restoration works again without discarding any live editor text. |

## Verification

- Targeted Vitest session/Workbench suites and Chromium Undo tests first, using repository-local caches and supported Node.
- `pnpm run evidence:run` and `node evidence/validate.mjs` -- fresh build/lint/full suites and complete exact execution-bound proof after reviewed inventory changes.
- `git diff --check` -- clean patch.
- Executed with Node 24.15.0 and repository-local environment: targeted suites passed 175 tests; targeted Chromium passed all 3 Story 3.1 scenarios.
- Full evidence run `b3d15ee2-52c3-4219-9739-265baa8c91b9` passed build, lint, all 269 Vitest tests, 49 Node integrity/lifecycle tests and 34 Chromium tests (352 total). Validator passed all 40 mandatory cells for artifact `e456ed90eebdec22d83c8160645cb77bda0e52c0821f945a5f9744c70875a2fa`.
- The first full attempt failed the old tab-order expectation because Undo now remains focusable. The corrected assertion explicitly verifies inactive Undo before Add; the complete gate was rerun successfully, not merely the failed test.
- All matrix rows have executed coverage: ten supported mutation variants and coalescing; guarded empty/stale commands and pending parse cancellation; invalid chronology; fresh-ID branching and draft cleanup; visible cancellation/inactivity, Draft selection and Search; exact capacity restoration below 100 ms with no observed sinks.
- Chromium-only MVP evidence: additional browsers, released OS/mobile targets, manual assistive technology, native IME/clipboard and real 400% zoom remain unverified/deferred. Copy, keyboard Undo and operation-specific focus remain out of scope.
- Final parent verification after direct-review repairs: `pnpm run evidence:run` and `node evidence/validate.mjs` pass on Node 24.21.0. Run [a4465d2f](../../evidence/runs/a4465d2f-ffe5-4dac-9dda-b15d3bf08199/playwright.json) binds 274 Vitest, 49 Node and 35 Chromium executions (358 total), all passing, to 40 mandatory cells. Source digest `34e11b85c0c78e57114beb1f09a83f31bc1178cec6a3c6eabcade86b82fc9788`; artifact digest `b4e8c5d85e9be8862aeac5cac914337db04cb188cea61bf60c4537a664db28db`.
- Parent matrix audit checked every Story 3.1 identity against the final native reports: all mutation variants, coalesced chronology, nonzero revisions, empty/stale commands, parse invalidation, draft cleanup, fresh-ID branching, invalid Draft selection/Search, native-event composition/settlement, detached-editor cleanup, pointer cancellation, accessibility and exact capacity restoration passed. No synthetic event test claims real OS IME coverage.
- Intermediate run `f9a81983-5433-4310-817f-f3f91683eb7b` rejected the independently edited inventory's noncanonical ordering. Exact identities/multiplicities matched; canonical sorting of that reviewed inventory (not learning identities from the report) resolved the contract violation. Its retained attempt remains failure diagnostics, not current proof.
- Both working-tree and staged `git diff --check` pass with the narrowly scoped native-log attributes. Direct review was authorized after independent-review tool failures; verified defects are repaired, and sprint status is `review` pending human acceptance.
