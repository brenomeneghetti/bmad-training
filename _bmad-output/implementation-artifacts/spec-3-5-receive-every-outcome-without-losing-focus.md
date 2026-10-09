---
title: 'Story 3.5: Receive Every Outcome Without Losing Focus'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '33ef64c327348f5c84d5abed6dd58b27a47b24ff'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Fragmented feedback can overwrite rapid/repeated outcomes; validation lacks consistent assertive announcements and field associations.

**Approach:** Establish isolated reducer-owned feedback channels without changing mutation, Undo, Copy or recovery semantics.

## Boundaries & Constraints

**Always:**
- Keep inline validation, its dedicated assertive announcer, polite status, actionable failure and feedback history distinct. Feedback history is not mutation History and never affects Undo.
- Keep visible errors persistent; use `error-full-url` and `error-{itemId}-{fieldKind}`, `aria-invalid`, error references and retained help references. Clear corrected errors/references atomically. Announce committed validation, blur/Apply or settled input; suppress intermediate IME and unchanged-keystroke repeats.
- Publish settled parse, Search, synchronization, Edit, Add, Remove, Reorder, Undo and successful Copy outcomes into the polite channel within 100 ms. Its dedicated `role="status" aria-live="polite" aria-atomic="true"` exposes each selected outcome for at least two seconds.
- Coalesce only pending Search counts with Search counts, and synchronization with synchronization, within 300 ms. Preserve committed FIFO precedence without preempting current minimum exposure.
- When a committed outcome would start more than six seconds after enqueue, immediately promote all participating current/pending/incoming committed outcomes exactly once into visible persistent feedback history. Remove promoted pending outcomes, finish current minimum exposure and enqueue one summary with the exact promotion count. Handle repeated overflow without duplicates.
- Identical polite or explicit validation repeats replace the actual live-region child, preserving visible continuity; token/key/data changes alone are insufficient.
- Actionable failures use a persistent dedicated `role="alert" aria-atomic="true"` until retry, success or relevant state change. Preserve Story 3.4's exact attempted-source recovery, delayed-focus guards and unresolved-write warning.
- Use literal EXPERIENCE.md microcopy for Current/Last Valid Copy, invalid Draft, Undo, Reorder and Search; identify changed representation or immutable piece without claiming invalid Draft synchronization.
- Preserve Draft/selection, Search, IDs, complete rendering, History and operation-defined focus. No animation, modal, flashing, focus stealing or moving layout-critical controls.
- Keep feedback browser-local/session-only; no URL/piece/Draft/clipboard/History content or raw exceptions in diagnostics, requests or storage. Retain 20,000-character/260-query capacity and 320px operability.

**Never:** Redo, new persistence/dependencies, clipboard writers, release certification or Story 3.6. Chromium/synthetic DOM proof is not actual AT speech, native clipboard/IME, OS/mobile or additional-browser proof.

## I/O & Edge-Case Matrix

| Scenario | Input/state | Expected behavior |
|----------|-------------|-------------------|
| Validation | Invalid Full URL or structured field; correction; explicit identical Apply | Persistent associated error; assertive settled announcement; explicit repeat replaces node; correction clears atomically |
| Composition/race | Intermediate IME or superseded parse | No intermediate assertion or stale outcome; only latest accepted completion publishes |
| Rapid outcomes | Search/synchronization and committed mutations | Same-class bounded coalescing; committed FIFO precedence; minimum exposure |
| Overflow | Predicted committed delay over six seconds | Exact-once visible promotion including current; accurate one-summary count |
| Repeat | Identical Copy/Undo/Reorder or validation | Real announcer-child replacement with no visible gap |
| Failure isolation | Copy failure alongside invalid Draft and queued statuses | Persistent actionable guidance/recovery; validation and queue unchanged |
| Dense/reflow | Capacity URL, 320px, reduced motion | Complete private responsive feedback; stable controls and intended focus |

</frozen-after-approval>

## Code Map

- `src/core/session/session.ts` -- reuse `SessionState`, `SessionAction`, mutation metadata and guarded Copy lifecycle.
- `src/core/session/feedback.ts` -- pure monotonic scheduling, validation announcement identity, and exact-once persistent overflow promotion.
- `src/core/session/effects.ts`, `src/platform/effects/index.ts` -- retain serial effects/render-ready focus.
- `src/app/workbench/Workbench.tsx` -- replace local Search/live regions; retain composition, parse and recovery guards.
- `src/app/pieces/StructuredView.tsx`, `src/app/feedback/ValidationMessage.tsx` -- reuse token composition and validation presentation.
- `src/test/fixtures/semantic.ts` -- retain shared capacity fixtures.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/session/{session.ts,session.test.ts,index.ts}` -- implement feedback/scheduling/validation/promotion and all-outcome routing; test matrix with deterministic time.
- [x] `src/app/workbench/Workbench{.tsx,.test.tsx}` -- connect clock/composition events; render isolated channels/history; verify node replacement and focus.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/feedback/ValidationMessage.tsx` -- wire field errors/help/correction/resubmission; extend component tests.
- [x] `src/styles/workbench.module.css` -- stable readable feedback; narrow/forced-color/reduced-motion behavior.
- [x] `tests/workbench.spec.ts` -- Chromium timing/overflow/repeat, operation, validation/IME/race, privacy and dense/reflow regressions.
- [x] `evidence/{coverage.json,inventory.json,validation.mjs,validate.test.mjs,README.md}` -- register exact identities/cells and integrity negatives; retain prior contracts and limitations.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance only 3.5; acceptance remains separate.

**Acceptance Criteria:**
- Given mixed operation outcomes, when scheduling and overflow execute, then every committed result has bounded exposure or exact-once immediate visible promotion with accurate count.
- Given invalid fields/composition/repeated submissions, when feedback renders, then stable error associations and real announcement-node replacement satisfy the channel contract without stale or intermediate assertions.
- Given failure, invalid Draft and queued success together, when recovery or correction occurs, then channels remain independent and exact session/Undo/focus semantics survive.
- Given dense Chromium execution, when evidence validates, then timing, privacy, responsive accessibility and exact execution identities pass without claiming deferred release coverage.

## Implementation Notes

- Reducer feedback owns one selected polite outcome, prioritized pending classes, monotonic IDs, a separate validation announcement, and chronological overflow history. Presentation acknowledgement starts the two-second exposure at DOM publication; clock events recheck overdue predictions, including delayed timers.
- Settled validation debounces 300 ms, suppresses unchanged error keystrokes and composition, and replaces actual keyed announcement children on explicit submission. Inline errors retain help references and clear atomically on correction.
- Structured fields reuse `ValidationMessage`; no inline validation or latest conversion text is independently live. Copy recovery and its typed serial effects remain unchanged; field-independent operation failures share the dedicated actionable output without replacing validation or polite state.
- Evidence adds four Story 3.5 cells and exact identities, deliberately updates prior mappings for two renamed feedback tests, and compares reviewed inventory in canonical identity order without relaxing multiplicity or execution requirements.
- Direct-review patches suppress deadline-boundary IME validation before clock advancement and retain the Full URL commitment immediately preceding Undo. Native-copy guidance does not claim selection when interaction guards intentionally retain focus elsewhere; source labels and keyboard/device guidance remain explicit.

## Spec Change Log

## Review Triage Log

The three independent reviewers could not access the workflow diff under `/tmp`;
none completed review. The user explicitly authorized direct review and continuation
in this session. Independent review is waived, not passing.

| Finding | Verdict | Evidence and disposition |
|---|---|---|
| Direct D1: composition beginning exactly at validation deadline announces an intermediate error | medium | `sessionReducer` advanced the clock before setting composition state; a start at 300 ms published pending validation. Patch: apply composition state before advancing time; extend the existing deadline regression. |
| Direct D2: immediate Undo drops the Full URL close outcome | medium | Closing and immediately undoing the continuous edit leaves History length unchanged, so the length-increase gate omitted the committed close outcome. Patch: rely on the demonstrated changed baseline and closed intent, preserving FIFO before Undo; extend the all-outcome regression. |
| Direct D3: guarded clipboard failure falsely claims selection | medium | The guarded-recovery Chromium case keeps focus in Search, but new literal guidance said the URL was selected. Patch: retain the required source/native-copy guidance while saying to select the field, not claiming selection; assert this in existing channel-isolation tests. |

All three findings route to `patch`: direct corrections of demonstrated states,
with no new public surface. No deferred findings or intent gaps remain.

## Design Notes

No intent gaps or irreversible operations; cross-layer authority warrants dispatch. Use 300-ms settled validation, a shell monotonic clock feeding pure reducer events, and a non-live chronological overflow-history list below controls. Separate inline errors from the hidden assertive announcer.

## Verification

- Targeted Vitest session/feedback/workbench suites with controlled clocks and actual DOM-node identity assertions.
- Targeted Chromium Story 3.5 scenarios measuring 100-ms publication, two-second exposure, 300-ms coalescing and the strictly-greater-than-six-second overflow boundary.
- `pnpm run evidence:run`, `node evidence/validate.mjs`, `git diff --check` -- fresh complete exact-identity proof and clean patch, using supported Node and repository-local verification environment.

### Executed implementation proof

- Fresh run: [`431c090e-00aa-4520-81ee-9b5523a59791`](../../evidence/runs/431c090e-00aa-4520-81ee-9b5523a59791/); [`manifest`](../../evidence/manifest.json).
- `pnpm run evidence:run`: build, lint, 336 Vitest tests, 75 Node integrity/lifecycle tests and 52 Chromium tests all passed with zero skipped/retried tests.
- `node evidence/validate.mjs`: 56 mandatory cells and 463 exact executed identities passed; artifact digest `b182591dd4ca058025673cf4b0c932fb3e07c9a8284b1780e1b3cef80e206b54`.
- Matrix coverage includes strict six-second boundary/repeated overflow, 300 ms coalescing and validation, actual repeated child identity, synthetic composition and stale parse, independent failures/exact recovery, operation focus, and private 20,000-character/260-query 320px accessibility/reflow.
- Build retains its existing large-chunk advisory. Actual AT speech, native clipboard/IME, OS/mobile and additional-browser validation remain unproven; implementation review and human acceptance are separate.

### Final post-review proof

- User-authorized direct review completed; D1-D3 are patched and covered by existing exact test identities. The blocked independent layers remain explicitly waived.
- Parent executed 211 targeted session/component tests and all five Story 3.5 Chromium scenarios. The first targeted browser attempt used the old built artifact; rebuilding before rerunning resolved that stale-artifact failure.
- Fresh full `pnpm run evidence:run`, `node evidence/validate.mjs` and `git diff --check` pass: 56 mandatory cells, 463 exact tests (336 Vitest, 75 integrity/lifecycle, 52 Chromium), zero skips/retries, supported Node 24.21.0 and repository-local verification paths.
- Final proof: [`4f1135dd-dcee-45c3-b1b2-cf669a72eaa6`](../../evidence/runs/4f1135dd-dcee-45c3-b1b2-cf669a72eaa6/). Artifact digest `dc74374c13c258381a3b8018c4e70ed7d5e52f19799a220776a8b86498eca81b`.

| Matrix row | Executed covering proof |
|---|---|
| Validation | Reducer settled/repeated validation and component/Chromium error-help/node-identity/correction scenarios |
| Composition/race | Reducer 300-ms composition boundary and stale parse guards; component/Chromium synthetic IME correction |
| Rapid outcomes | Reducer class coalescing/FIFO and component/Chromium two-second exposure scenarios |
| Overflow | Reducer strict-six-second/repeated promotion and component/Chromium exact-count history scenarios |
| Repeat | Component/Chromium repeated Copy and explicit validation child-node identity assertions |
| Failure isolation | Reducer/channel-isolation component and Chromium interrupted Copy with exact recovery, retained Search focus and truthful guidance |
| Dense/reflow | Chromium real sub-100-ms publication, private complete capacity rendering, 320px, axe, reduced-motion, forced-color and text-spacing observations |

Build implementation/review are complete with no newly deferred findings. Sprint status remains `review` pending human acceptance; broader release/manual coverage remains unproven. Story 3.6 is untouched.
