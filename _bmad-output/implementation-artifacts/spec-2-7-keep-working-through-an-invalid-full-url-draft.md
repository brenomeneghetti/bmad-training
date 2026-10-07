---
title: 'Story 2.7: Keep Working Through an Invalid Full URL Draft'
type: 'feature'
created: '2026-10-07'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'bf1a70cab6690ce48c1bbdca2558bce2d92c3a06'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Story 2.6 preserves invalid Drafts and implements close-and-rebase, but the workbench does not persistently explain Last Valid as the structured source. Repeated corrections, independent feedback, stale work, and the complete reversible journal sequence need dedicated evidence.

**Approach:** Finish the invalid-Draft experience on the existing reducer authority: explicit source/error labels, independent feedback, and executable chronology/race/focus evidence. Preserve the repaired continuous-edit foundation rather than introduce another session state machine.

## Boundaries & Constraints

**Always:**
- Keep exact invalid Draft text, selection, and associated validation while every accepted structured mutation updates latest Last Valid, immutable identities, Search, and serialized Copy source atomically.
- During active-session invalidity show: "Draft URL is not valid. Structured View changes use the Last Valid URL." Preserve a more specific parser explanation when available. Keep no-session intake messaging unchanged.
- Label Structured View's source as Last Valid while Draft is invalid; never announce invalid Draft as synchronized. Clear the source/error state when corrected.
- Close any pending continuous intent before the first accepted structured mutation. The sequence `A -> B -> C -> X(invalid) -> D -> E -> F` stores exactly `[A->C, C->D, D->E, E->F]`. X and intermediate B never become journal snapshots.
- Preserve separate Full URL validation, structured field drafts/errors, operation status, and Search feedback. Full URL validation activity must not erase unrelated actionable structured errors.
- Corrections rebase from latest Last Valid, not stale focus-entry state. Journal entries retain exact before/after serialization, models, IDs, operation kind, and target identity sufficient for later operation-specific focus resolution.
- Verify stale parse completions, missing IDs, and stale field revisions publish nothing. Existing UI focus refs must not act on a newer unrelated transition. Keep established Add/Remove/Reorder and ordinary-edit focus rules.
- Retain IME buffering, exact LCS identity, non-recycled IDs, local-only privacy, keyboard activation, responsive layout, and the 20,000-character/250+ capacity response targets.

**Never:** Implement Undo, Copy adapters, new asynchronous effect executors, persistence, network operations, virtualization, or dependencies. Install nothing. Do not weaken passing Story 2.6 regressions or add architectural machinery for nonexistent async adapters.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Invalid intake vs active Draft | No snapshot vs valid session plus X | Original intake error vs explicit Last Valid explanation/source | Error remains associated with Full URL |
| Every structured operation | X with Domain/path/key/value edit, Add, Remove, or Move | X/selection/error unchanged; latest Last Valid and independent journal update | Invalid local edit stays field-local |
| Close/rebase chronology | A, B, C, X, S1 producing D, S2 producing E, correction F | Exact four entries; reverse snapshots restore F,E,D,C,A | No invalid or coalesced intermediate snapshot |
| Coexisting feedback/Search | X plus structured field error/status and filtering | Independent messages remain accurate; focus follows operation | Rejection creates no commit/success |
| Races | Old parse completion or missing/stale target | No Draft, journal, status, row, or focus publication | Existing explicit structured error channel |
| Capacity and IME | Invalid Draft with 260 entries; composition and correction | All rows retained, safe focus/reflow, response targets met | No intermediate composition validation |

</frozen-after-approval>

## Code Map

- `src/core/session/session.ts`: reuse `closeFullUrlEditIfOpen`, `structuredPublication`, `structuredUpdateMessage`, `fullUrlFocus`, and current parse guards. `inputChanged`, `parseStarted`, and invalid `parseCompleted` currently clear independent structured feedback; preserve actionable structured errors until their own operation or a valid reparse resolves them. Retain ID/revision rejection and publication semantics.
- `src/app/workbench/Workbench.tsx`: derive active invalid-Draft state from snapshot plus Full URL problem; render source-aware validation without changing intake copy. Keep composition buffering and pending focus refs. Associate explicit source description with Structured View.
- `src/app/pieces/StructuredView.tsx`: add a source-description prop/paragraph beside the heading without changing its accessible name, Search order, field error associations, or status region.
- `src/core/session/session.test.ts`, `src/app/workbench/Workbench.test.tsx`, `tests/workbench.spec.ts`: extend existing helpers/fixtures; assert snapshots and target IDs, not only row counts. Core commands are synchronous; test actual guards rather than invent an async structured-command adapter.
- `src/test/fixtures/semantic.ts`: reuse `createCapacityFixture`; preserve lossless duplicates/empty-value fixtures.
- `evidence/schema.json`, `evidence/manifest.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs`, `evidence/validate.mjs`: require four new 2.7 cells (Draft/source, chronology, feedback/focus/races, privacy/capacity), 36 total; validate each mandatory cell and pin the rebuilt digest.
- `_bmad-output/implementation-artifacts/sprint-status.yaml`: synchronize `2-7-keep-working-through-an-invalid-full-url-draft`.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- preserve independent errors; prove exact full chronology, repeated corrections, all mutation kinds, stale guards, IDs, and journal focus-resolution data.
- [x] `src/app/workbench/Workbench.tsx`, `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.test.tsx` -- wire persistent invalid-Draft/source messaging and independent feedback; cover focus, selection, Search, IME, correction, and stale focus intent.
- [x] `tests/workbench.spec.ts` -- cover invalid-Draft operations, source labels, accessibility/privacy, keyboard, 320px reflow, and 260-entry performance using existing fixtures.
- [x] `evidence/schema.json`, `evidence/manifest.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs`, `evidence/validate.mjs` -- register and verify four 2.7 cells and the built artifact.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize tracking after verification.

**Acceptance Criteria:**
- Given invalid X with Last Valid C, when structured operations commit, then X remains exact and all synchronized surfaces describe latest Last Valid truthfully.
- Given A,B,C,X,D,E,F, when the journal closes and is inspected backwards, then its full snapshots restore F,E,D,C,A with immutable IDs and operation targets, never X or B.
- Given independent field validation and Full URL invalidity, when typing/correction/status/Search continues, then feedback stays separate and focus does not move except for the established operation transition.
- Given stale work, IME, or capacity fixtures, when exercised, then existing publication guards, privacy, losslessness, accessibility, and measured response requirements remain satisfied.

## Implementation Notes

- Retained the synchronous reducer lifecycle and complete journal snapshots; invalid Full URL activity no longer clears independent structured feedback. Search announcements remain valid across invalid-only typing.
- Structured source and Domain help identify Last Valid while invalid; no-session intake copy is unchanged. Invalid Full URL and structured field errors now have accessible announcement associations.
- Pending operation focus requires the exact next committed revision and matching epoch; deferred Add focus also rejects newer transitions.
- Tests exercise all mutation kinds, repeated close/rebase corrections, exact four-entry chronology, immutable target identities, all parse guards, structured rejection, stale batched focus, IME, privacy and 320px capacity.
- Review fixes invalidate pending operation focus on newer focus, input, or composition events without changing committed session state. Persistent Full URL and field-local validation regions announce independent errors without duplicating messages in the global structured channel; Domain descriptions include both help and field-local errors.
- Chronology assertions now use independently specified serialized states and ID order. Capacity rejection and stale Add/navigation have dedicated core/component/browser regressions. Capacity response measurement checks committed DOM/order/focus and spans two animation frames with a forced layout read; this is a rendering-opportunity proxy, not a compositor paint timestamp.

## Spec Change Log

## Review Triage Log

- Initial review could not access the system-temp diff. The retry used a project-local diff and completed all three lenses.

| Finding | Verdict | Route | Evidence and disposition |
|---------|---------|-------|--------------------------|
| Edge: stale Add after newer Full URL interaction | medium | patch | A newer focus/input/composition event does not change the committed revision, so the old Add effect could clear Search or move focus. Capture-phase invalidation and three regressions prevent this. |
| Adversarial: stale Move after newer Search focus | medium | patch | The reviewer reproduced focus theft in one batch. New regressions cover Move, Add, and Remove; newer navigation cancels their pending focus refs. |
| Adversarial: Domain error missing from description | medium | patch | Domain aria-describedby previously contained only help. It now includes the field error while invalid, retaining help after correction. |
| Adversarial: Full URL validation not live | medium | patch | ValidationMessage had no announcement semantics. A persistent polite region now exists before the error is inserted; valid correction retains the existing parsed-status announcement. Actual screen-reader behavior remains part of manual coverage. |
| Adversarial: Path/query validation not live | medium | patch | Field errors suppressed the global error channel and had no live region. Persistent field-local regions now announce changes without duplicating messages in the global structured channel; visible errors remain independently associated. |
| Adversarial: source-only evidence can pass without execution | medium | defer | The inherited validator proves cell mapping, source existence, CSP, and artifact digest, not immutable run outcomes. This predates Story 2.7 and needs the shared trusted release-evidence gate rather than a story-only success-shaped attestation. |
| Adversarial: self-derived chronology expectations | medium | patch | History object equality alone can share serialization mistakes. Explicit A/C/D/E/F URL strings and immutable query/path/domain ID checks now accompany the complete snapshot assertions. |
| Adversarial: response timing stops before rendering | medium | patch | The new measurement previously stopped at the first animation frame. It now verifies the DOM outcome, reads layout, and waits through a second frame under the same 100 ms threshold; no actual paint timestamp is claimed. |
| Adversarial: missing invalid-Draft capacity rejection | medium | patch | Successful mutations did not cover rejection in this combined state. Core guards now assert unchanged history/open intent/IDs, with component and 260-entry browser checks for Draft, selection, validation, Search, and focus. Ordinary edits keep the established Search-clear rule. |
| Adversarial: browser/version matrix incomplete | medium | defer | Only Chromium is configured and installed; Firefox and WebKit executable checks returned unavailable. No installs are permitted by the approved intent. The inherited latest-two-major requirement remains unresolved and is not claimed as passing. |
| Adversarial: presentation/manual accessibility coverage incomplete | medium | defer | Added forced-colors and normative text-spacing checks at 320px. True browser zoom and manual assistive-technology checks cannot be established by axe or headless viewport emulation; these inherited checks remain explicitly pending. |
| Verification: stale Add revision guard lacks regression | medium | patch | The filed gap identifies a distinct effect not covered by the Move test. Batched Add/Remove/Add now asserts no stale Search clearing or focus movement despite matching final success text. |
| Verification: accessible error associations lack assertions | medium | patch | Tests now assert Full URL, Domain, path, key, and value error descriptions and their correction behavior, retaining Full URL/Domain help. |

## Verification

- `pnpm test` -- unit/component suites and every mandatory evidence-cell guard pass.
- `pnpm run lint && pnpm run build` -- clean lint/typecheck and rebuilt artifact.
- `pnpm exec playwright test tests/workbench.spec.ts` -- existing Chromium suite plus Story 2.7 cases pass; report configured-browser coverage honestly.
- `node evidence/validate.mjs` -- 36 mandatory cells and exact artifact digest pass.

### Executed 2026-10-07

- `pnpm test`: 238 unit/component tests and 9 evidence-validator tests passed; no skips.
- `pnpm run lint && pnpm run build`: passed. Existing >500 kB minified-chunk warning remains; no dependencies installed.
- `pnpm exec playwright test tests/workbench.spec.ts`: all 24 configured Chromium tests passed, including invalid-state axe checks and measured <100 ms edit/reorder response at 20,000 characters/260 entries.
- Browser coverage is Chromium only; latest-two-major multi-browser coverage and manual assistive-technology validation were not performed.
- `node evidence/validate.mjs`: 36 cells; digest `a4860cbb96aa7c5da8be242c668ddc412e9a9877440f15e523a1907322834f4c`.

### Review fixes verified 2026-10-07

- `pnpm test`: 248 unit/component tests and 9 evidence-validator tests passed, with no skips.
- `pnpm run lint && pnpm run build`: passed; the pre-existing minified-chunk size warning remains.
- `pnpm exec playwright test tests/workbench.spec.ts`: all 26 configured Chromium tests passed. All four Story 2.7 browser scenarios ran, including invalid-Draft capacity rejection, forced colors/text spacing, and two-frame DOM/layout response measurements below 100 ms.
- `node evidence/validate.mjs`: all 36 mandatory cells passed with rebuilt digest `fca2461405256da16e43c3e33fb241dc1787e371dd1aa18609618c7f05d49669`.
- All 13 review findings were triaged: 10 patch findings addressed; three inherited release/verification gaps recorded in deferred-work.md. No dependencies or browser tools were installed.
- This verification does not establish latest-two-major browser coverage, true 400% browser zoom, manual screen-reader announcements, or immutable execution-record binding. Sprint tracking remains `review`.
