---
title: 'Story 4.1 — Use a Polished Dark Workbench with Contextual Copy'
type: 'feature'
created: '2026-10-09'
status: 'done'
route: 'dispatch'
baseline_commit: 'd3a7b3e968fd967bdb2862813dad698f760f82ed'
review_loop_iteration: 0
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-4-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The light workbench separates Copy from Full URL and lacks the approved dark identity.

**Approach:** Apply finalized tokens, put Copy beside Full URL and Undo below, retire Actions and reconcile handoff contracts without changing URL behavior.

## Boundaries & Constraints

**Always:** Use existing native React/CSS Modules and exact DESIGN tokens. Preserve URL/Draft/Last Valid/History/Copy, IDs, native editing/IME, focus, feedback, privacy, CSP and reset. Keep 20,000-character/260-entry fixtures, one-second parse/100ms interaction thresholds and fresh execution-bound Chromium proof with reviewed exact mappings.

**Never:** Add dependencies/fonts/themes/icons/gradients/shadows, mock annotations, network/storage or relaxed gates. Implement disclosures, sole-bottom Add, shape descriptions, on-demand moves, dragging or feedback redesign; those belong to 4.2–4.6. Tokens do not establish later behavior. Chromium is not broader-browser/device/real-zoom/manual AT or release proof.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Wide layout | Above 700 CSS px; long URL | Wrapping labeled textarea, minimum 100px; adjacent Copy; Undo below; two named sections | No clipping or page overflow |
| Narrow layout | 320–700px; spacing overrides | Copy may wrap below in stable reading/tab order; all required actions/values remain reachable | Only essential value fields scroll internally |
| Recovery | Invalid Draft; failed/timed-out Copy | Exact Current/Last Valid attempted source, truthful feedback and selected recovery; unchanged Draft/History | Preserve attempt fencing and existing focus rules |
| Accessibility | Error/selected/inactive states; keyboard/forced colors | Persistent labels; 3px outline/offset; text/state rather than color alone | No lost focus or hidden action |
| Baseline operations | Search/edit/Add/Remove/reorder/Undo/Copy | Existing semantics, identities and capacity remain intact | No fabricated success or accepted invalid mutation |

</frozen-after-approval>

## Code Map

- `src/styles/workbench.module.css` — light globals and responsive rules; retain isolation/reflow.
- `src/app/workbench/Workbench.tsx` — Full URL then Actions; reuse handlers, refs, reducer/effect/composition logic.
- `src/app/pieces/StructuredView.tsx` — retain single list, duplicate Add and permanent Move behavior.
- `src/app/workbench/Workbench.test.tsx`, `tests/workbench.spec.ts` — landmark/order plus Copy/recovery/Undo/privacy/capacity contracts.
- `evidence/validation.mjs` (`requiredCells`), `evidence/coverage.json`, `evidence/inventory.json` — explicit cells/exact test identities; reviewed, not automatically regenerated.

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md`, `_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/reconcile-redesign.md`, `_bmad-output/specs/spec-bmad-training/SPEC.md` — reconcile grouped full DOM, two-section layout, ordinary blur, presentation-aware focus and completed gestures before handoff; replace dark exclusion with no theme switching. Preserve history/semantic decisions; distinguish planned later behavior.
- [x] `src/styles/workbench.module.css` — implement exact tokens, fields/actions, responsive layout, contrast/focus/system-color fallback; no fake later controls.
- [x] `src/app/workbench/Workbench.tsx`, `src/app/pieces/StructuredView.tsx` — contextual Copy/Undo and style hooks; retain behavior/IDs.
- [x] `src/app/workbench/Workbench.test.tsx`, `tests/workbench.spec.ts` — test matrix, revised landmarks/order, measured sizing/contrast and capacity; preserve existing titles, add exact 4.1 identities.
- [x] `evidence/validation.mjs`, `evidence/coverage.json`, `evidence/inventory.json`, `evidence/README.md` — map new Chromium executions, retain mandatory identities/external obligations; runner publishes manifests.

**Acceptance Criteria:**
- Given finalized tokens, when rendered, then all 14 colors, eight typography roles, radii and component definitions match, with no unapproved visual features.
- Given actual styled surfaces, when evaluated, then main reading contrast reaches 7:1, normal text 4.5:1 and functional boundary/focus 3:1; targets meet the 24px minimum/spacing exception and 44px control contract.
- Given matrix states, when operated, then layout/focus/exact-source/errors hold without regression.
- Given reviewed mappings, when fresh Chromium evidence runs, then mandatory mapped tests execute/pass; missing/failed execution blocks completion, not waived broader release.

## Implementation Notes

- Applied the 14 exact colors, eight typography roles and 10px/16px radii using
  native CSS Modules. Copy is next to the 100px-minimum Full URL above 700px,
  wrapping below at narrow widths; Undo, feedback and recovery share that panel.
  The existing pre-list Add moved into Structured View, retaining both Add
  actions and their IDs. Single-list rendering and permanent Move remain.
- No reducer, scanner, codec, IDN, history, clipboard/effect, CSP, dependency,
  font, persistence or network changes. Historical mockup/review files remain
  unchanged; upstream contracts distinguish future grouped/gesture behavior.
- New exact identities cover tokens/rendered contrast/sizing, contextual order
  and completed pointer cancellation, selected Last Valid recovery/Undo,
  320/700/701px reflow with text spacing/system colors, and private exact
  20,000-character/260-query reorder/Copy/Undo. Existing recovery timeout/race
  and baseline operation tests also executed in the fresh complete run.
- Verification used installed Node 24.21.0 and repository-local caches:
  targeted Vitest (121 passing), build, four new Chromium tests, then full
  `evidence:run` and `evidence:validate`. Final run
  `234b8156-002d-4138-86ff-5ed2b561acf1` passed 60 mandatory cells and 497 exact
  tests (337 Vitest, 104 Node, 56 Chromium), with zero retries/skips/failures.
  The first full run caught one historical Undo-before-Copy tab expectation;
  its existing title was retained and expectation reconciled to the approved
  textarea → Copy → Undo order before the fresh passing run.
- This is Chromium MVP proof only. No external observation, native clipboard/
  IME, manual AT, real 400% zoom, device/additional-browser or release acceptance
  is claimed. Later Stories 4.2–4.6 remain intentionally unimplemented.
- Parent acceptance audit completed the shared spacing and all 22 component
  token definitions, including the future 52px disclosure target without adding
  later controls. Existing row/list/target/layout rules reuse the foundation.
  The existing dark-foundation identity now checks every component property
  and spacing value, not just palette and rendered baseline samples. CSS hex
  case is normalized without changing approved color values.
- Final publication after that completion is
  `3943dbc5-9208-4070-9129-a066b8e2967a`: all four changed Chromium identities
  and the full 60-cell/497-test inventory pass with no skipped, retried or failed
  tests. Wide/narrow/accessibility matrix rows map to the dark-foundation and
  reflow executions; recovery maps to contextual-actions and existing 3.4
  timeout/race executions; baseline operations map to the retained full suite
  and private-capacity execution. The earlier publication is superseded, not
  proof for the final source.
- Three independent review layers produced 11 findings: nine verified
  verification/accessibility findings were patched (eight root causes), two
  were refuted, and none were deferred. Typography now uses rem at the approved
  16px-default pixel equivalents with inherited browser root sizing. The
  same exact browser identities additionally verify rendered colors/families,
  forward/reverse Add navigation, system-color surfaces, complete focus rings,
  enlarged root text, independent exact reorder serialization/IDs and
  publication/focus plus two-frame timing boundaries.
- Post-review verification passed the 121 targeted component/arbiter tests,
  build and all four changed Chromium tests, then published
  `18a5eb8e-79e8-4fdb-a0dc-0de19dcb5598` with all 60 mandatory cells and 497 exact
  tests passing. This supersedes both earlier publications for final-source
  proof. Browser-root enlargement is simulated, not manual browser/AT evidence.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and route |
|---------|---------|--------------------|
| Blind: browser text-size preferences | medium | New root `16px` and pixel typography replace the former rem inheritance, preventing Workbench text from following larger browser defaults. Patch: retain the approved nominal sizes using rem and root `100%`; check enlarged root text without claiming actual browser/AT observations. |
| Blind: declared versus rendered component tokens | medium | Root declarations alone permit Copy or existing fields to use different colors while contrast passes. Patch: compare actual enabled/disabled actions, fields, panels and rows with their approved colors and spacing; future-only definitions remain distinct. |
| Blind: missing rendered font-family checks | medium | The dark-foundation test originally recorded only sizes/weights/line heights; UI/URL family substitutions could pass. Patch: assert system sans versus monospace on actual consumers and the group-title role. |
| Blind: event-only response timings | medium | Capacity timers ended at dispatch/click, without demonstrating layout/focus publication or a rendering opportunity. Patch: include two animation frames and assert the final URL, row order and active control within the measured operation. |
| Blind: dependent reordered-value oracle | medium | Comparing “changed” against the source and then copying that same value cannot detect a wrong adjacent swap. Patch: construct the expected exact query swap independently and verify all serialized bytes and reordered IDs before Copy. |
| Blind: relocated Add keyboard traversal | medium | Revised accessibility traversal stops at Search; it does not protect the relocated pre-list Add route. Patch: exercise forward/reverse Search, Clear, Add and first-row traversal. |
| Blind: forced-color surface coverage | medium | Existing checks cover recovery boundaries but not rewritten action, disabled, validation or row colors. Patch: compare these actual surfaces with native system-color probes. |
| Blind: focus-outline geometry | medium | Outline properties and viewport membership do not verify the complete ring or clipping ancestors. Patch: check ring extents and ancestor clipping for focused actions at the breakpoint widths. |
| Blind: unsupported external Story 4.1 gate | false | No verification command promises `evidence:story -- 4.1` success. Its scope is presently unsupported by the unchanged external release contract; this story adds explicit MVP cells only. Expanding release scope is not needed for the approved Chromium deliverable, and a proposed edit to this Build spec is rejected by review rules. |
| Blind: context/sprint handoff inconsistency | false | Planning edits make the earlier compiled context stale, so the next epic-story activation must regenerate it under the cache-validity rule. The review step changes spec state only; sprint remains in-progress until the presentation transition. Neither record bypasses the prescribed handoff/state gates. |
| Verification-gap: Copy primary colors | medium | Pre-verified removal of Copy's primary class would keep root tokens, contrast and behavioral assertions passing. Patch: assert its actual approved action background/foreground; this shares the rendered-token verification root cause above. |

## Design Notes

No intent gaps or irreversible operations. UI/tests/evidence/handoff footprint requires dispatch. Retain reducer authority. New tests need exact inventory/coverage. `evidence:story -- 4.1` requires external observations, not Chromium MVP; do not manufacture observations or expand release scope to obtain success.

## Verification

**Commands:**
- `pnpm exec vitest run src/app/workbench/Workbench.test.tsx src/app/workbench/inputArbiter.test.ts` — component behavior and native-editing guards pass.
- `pnpm run build && pnpm exec playwright test tests/workbench.spec.ts --grep 'Story 4.1'` — changed rendered contracts pass.
- `pnpm run evidence:run && pnpm run evidence:validate` — fresh full execution and reviewed exact identities produce Chromium MVP proof, not release authorization.

Use repository-local cache/environment paths and supported Node per AGENTS.md; install missing test-only prerequisites only after an explicit missing-tool failure.
