---
title: 'Story 3.4: Recover Safely from Clipboard Failure and Races'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'df5c429be8df70dfa9129f4319411b3a01b4dc6e'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Failed Copy offers no selectable native-copy recovery. Obsolete writes must not replace newer recovery or steal focus.

**Approach:** Add reducer-owned exact attempted recovery, guarded focus/selection and native-copy instructions; reuse the serial clipboard boundary/fence.

## Boundaries & Constraints

**Always:**
- Capture failed `serialized`, source, epoch/revision and attempt ID; never use DOM, later snapshot or invalid Draft.
- Handle unavailable API, throw, rejection, timeout and fence with typed non-content outcomes. Separate actionable failure, validation and polite success.
- Focus/select the entire labeled read-only recovery when a current failure settles. Guard delayed focus against newer attempts, source changes, user interaction/composition and unmount.
- Preserve Draft/backward selection, validation, Search, snapshots, IDs, Structured View and History. Recovery focus intentionally leaves the editor; it creates no edit/History.
- Retain recovery until another Copy or URL mutation. Clear obsolete classification/feedback atomically; newer failed attempts own recovery.
- Serial invocation and exactly one terminal acknowledgement remain mandatory. Timeout exposes recovery but retains unresolved-write ownership. Fenced attempts expose their captured source without overlap. Late settlement releases the fence, never changes recovery/focus or announces success.
- Provide native keyboard/device-copy instructions without claiming success or adding another clipboard writer. Keep actions/editing available.
- Keep content browser-local/session-only; no URL, Draft, recovery, History or raw exceptions in logs, telemetry, requests, storage, cookies or diagnostics.
- Retain complete 20,000-character/260-query rendering and sub-100-ms recovery publication/focus after settlement. At 320px, labels/help remain outside internal scrolling; no page/action overflow.

**Never:** Outcome scheduling (3.5), release certification (3.6), Redo, dependencies, persistence, broad clipboard permissions or deprecated copy commands. Chromium is not native clipboard/manual AT/IME/OS/mobile/additional-browser proof.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected behavior |
|----------|---------------|-------------------|
| Current failure | Missing API, throw or rejection | Exact attempted Current URL, labeled selected recovery and retry/native-copy guidance |
| Invalid Draft | Failed Last Valid Copy | Exact Last Valid recovery; Draft, selection and validation retained |
| Timeout/fence | Unresolved native write, later Copy | Immediate terminal recovery; latest attempt owns value; no overlap |
| Late result | Older write resolves/rejects | Fence releases only on settlement; no stale success/recovery/focus |
| Interruption | Mutation, Undo, newer attempt, interaction or unmount | Stale effects acknowledge without changing newer recovery/DOM |
| Recovery lifecycle | Search/focus, retry, mutation, reload | Retain across Search/focus; clear on retry/mutation; reload clears session |
| Capacity/reflow | Dense URL, 260 queries, 320px | Exact selectable bytes, complete private responsive view and accessible actions |

</frozen-after-approval>

## Code Map

- `src/core/session/{session.ts,effects.ts,index.ts}` -- reuse Copy claim/ack, `currentCopy`, revision/epoch invalidation and monotonic effects.
- `src/platform/effects/index.ts` -- shared serial executor, render-ready DOM and unmount guards.
- `src/platform/clipboard/index.ts` -- existing three-second timeout/native-settlement fence.
- `src/app/workbench/Workbench.tsx` -- state-ref orchestration, composition/interactions and editor/feedback; mount before selection.
- `src/styles/workbench.module.css` -- existing textarea, focus, forced-colors/reflow tokens.
- `src/test/fixtures/semantic.ts` -- shared semantic/capacity fixtures; preserve thresholds.
- `evidence/{coverage.json,inventory.json,validation.mjs}` -- reviewed 48-cell contract, not runner-generated expectations.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/session/{session.ts,effects.ts,index.ts,session.test.ts}` -- implement recovery ownership/focus guards; test matrix and unchanged History.
- [x] `src/platform/{effects,clipboard}/{index.ts,index.test.ts}` -- wire serial recovery; prove timeout/fence/late resolve/reject/unmount.
- [x] `src/app/workbench/Workbench{.tsx,.test.tsx}`, `src/styles/workbench.module.css` -- labeled recovery/instructions and guarded selection; update superseded 3.3 failure-focus assertions.
- [x] `tests/workbench.spec.ts` -- failure/race matrix, native selection/reload, density/privacy/timing and 320px/axe.
- [x] `evidence/{coverage.json,inventory.json,validation.mjs,validate.test.mjs,run.test.mjs,validate.mjs,README.md}` -- pin recovery/lifecycle/race/capacity identities and negative tests; retain existing cells.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance only 3.4; acceptance remains separate.

**Acceptance Criteria:**
- Given current Copy failure, when recovery renders, then exact Current/Last Valid bytes are labeled, read-only, selected and native-copyable.
- Given interrupted/timed-out writes, when newer/late outcomes settle, then serial acknowledgement prevents overlap, stale feedback and obsolete focus.
- Given invalid Draft/Search, when recovery appears or Undo invalidates it, then Draft/selection/validation, IDs and History retain existing semantics.
- Given dense Chromium execution, when evidence validates, then exact private recovery, accessibility/reflow and unchanged thresholds pass without deferred-coverage claims.

## Implementation Notes

- Reducer recovery captures exact attempted serialization, source, epoch/revision and attempt ID. A separate Draft revision invalidates pending outcomes even when invalid-to-invalid changes leave Last Valid untouched.
- Failure acknowledgements enqueue monotonic guarded recovery-focus effects. The shared executor waits for the matching mounted recovery field before claiming; obsolete effects acknowledge without DOM work. Pointer, keyboard, focus and composition interactions, including outside the workbench, invalidate delayed focus without removing recovery.
- The labeled read-only field uses native selection and keyboard/device-copy instructions, without another clipboard writer. Adapter-driven blur does not close Full URL editing or add History; a component regression proves continued edits still Undo to the original baseline.
- The existing clipboard adapter and three-second unresolved-write fence are reused unchanged. Timeout/fenced attempts publish their own exact recovery; late resolve/reject only releases native ownership. Existing barrel exports expose the added state/effect types without changes.
- Recovery labels/help stay outside textarea scrolling. Four Story 3.4 evidence cells extend the retained 48-cell contract to 52; superseded Story 3.3 failure-focus identities now reference recovery behavior.
- Independent review patches retain Copy as a connected pointer-retry focus target, close suspended Full URL edits when deliberately leaving recovery for another control, cancel delayed focus on window/visibility/wheel interaction, and warn about irrevocable pending-write overwrite risk. Direct return to Full URL still preserves the open intent.
- Existing registered tests now cover external programmatic focus, window/visibility/wheel cancellation, separate post-recovery edit Undo boundaries, Enter/Space failures, pointer retry, forced-color outlines, and dense Current/Last Valid recovery below 100 ms with 320px already active. No execution identities or thresholds changed.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and disposition |
|---|---|---|
| Blind B1: pointer retry removes focused recovery without a destination | medium | Copy prevents default pointer focus while retry removes recovery; the active textarea becomes disconnected. Patch: allow ordinary Copy pointer focus only when recovery owns focus. |
| Blind B2: switching applications/tabs does not invalidate recovery focus | medium | Cancellation listens to document pointer/key/focus but not window blur/visibility; a pending failure retains its interaction token. Patch: cancel on blur/visibility and extend interruption assertions. |
| Blind B3: wheel scrolling permits delayed recovery to scroll back | medium | No wheel cancellation exists and recovery uses ordinary focus scrolling. Patch: cancel delayed focus on deliberate wheel input, with a regression. |
| Blind B4: native copy guidance omits unresolved-write overwrite risk | medium | Timeout retains an irrevocable native write, so its later settlement may overwrite manually copied bytes. Patch: explain that risk in timeout/fenced guidance. |
| Blind B5: keyboard failure activation lacks coverage | medium | Enter/Space currently verify successful Copy only. Patch: exercise both in the existing Current failure matrix, including selection and subsequent Tab navigation. |
| Blind B6: Ctrl+C adapter-count assertion does not prove native paste-back | low | True verification limitation, but the field uses browser-native read-only selection with no copy handler or cancellation; native clipboard remains explicitly unverified. Reject additional clipboard-permission/integration complexity; do not claim native execution proof. |
| Blind B7: forced-color border check misses recovery focus outline | medium | Existing assertion verifies the border, not the focused indicator. Patch: assert visible outline and retained complete selection in the existing dense test; this still does not prove manual selected-text perception. |
| Blind B8: dense latency measured before narrow viewport | medium | Measurement precedes viewport resize, leaving narrow-layout timing unverified. Patch: enter 320px before the measured failure. |
| Blind B9: dense Last Valid recovery lacks execution coverage | medium | Dense test covers Current only; Last Valid uses a shorter fixture elsewhere. Patch: extend the dense test with invalid Draft/backward selection, exact Last Valid recovery and unchanged validation/rows. |
| Blind B10: supplemental raw runs lack individual manifests | false | These retained reports are not accepted proof or referenced as independently passing publications; only current `manifest.json` binds and validates source/build/report identities. Preserving diagnostics is intentional and does not weaken the gate. |
| Edge E1: recovery then Search leaves a Full URL edit open | medium | Adapter blur correctly avoids creating History, but subsequent recovery-to-Search blur never closes that intent; returning to Full URL reuses the prior baseline. Patch: close on deliberate recovery departure except direct return to Full URL, preserving recovery-only coalescing. |
| Verification V1: external programmatic focus is untested | medium | Pre-verified gap: outside cases use pointerdown and focus cases use internal Search. Patch: extend the component race matrix with a real external input `.focus()` before pending rejection. |

All surviving findings are direct corrections or assertions of demonstrated states, with no new public surface; route `patch`. No intent/spec re-derivation or deferred work is required.

Patch disposition: B1–B5, B7–B9, E1 and V1 are repaired and covered by the existing executed component/Chromium identities. The implementation dispatch was synchronous and cannot receive follow-up turns, so the parent applied the patches and reran full verification. B6 remains an explicitly unverified native-clipboard limitation; B10 remains rejected on the publication contract.

## Design Notes

No intent gaps/irreversible repository operations. Cross-layer authority/DOM effects require dispatch. Invoked clipboard writes cannot be revoked. Failure focus intentionally changes 3.3 behavior; successful Copy still never moves focus.

## Verification

- Targeted Vitest reducer/adapter/executor/component suites and Chromium recovery scenarios.
- `pnpm run evidence:run` and `node evidence/validate.mjs` -- fresh complete exact-identity publication, zero skips/retries and all mandatory cells.
- `git diff --check` -- clean patch. Use supported Node and repository-local environment/caches.

### Executed verification — 2026-10-08

- Targeted reducer, clipboard, executor and component suites: **212 passed**; TypeScript check passed.
- Targeted Chromium Story 3.4 suite: **5 passed**, including settlement-to-selected recovery below 100 ms, complete 20,000-character/260-query rendering, axe, forced colors, text spacing and 320px reflow.
- Final `pnpm run evidence:run` and `node evidence/validate.mjs`: **52 mandatory cells, 441 exact executed tests** (328 Vitest, 66 Node integrity/lifecycle, 47 Chromium); complete build/lint and zero skipped/retried tests. Supported Node 24.21.0 and repository-local verification paths used.
- Current proof: [run e000ff12-4653-4897-9430-f0d4d70ce265](../../evidence/runs/e000ff12-4653-4897-9430-f0d4d70ce265/). Artifact digest: `4c880bd032ffc6ced7c50e6896b7ea1b1eba6244d8a8fd8671ca14c296ce274a`.
- `git diff --check`: passed. Earlier validation exposed accidental nested test identities; registration was corrected to the reviewed identities, not learned from execution. An inline-style test was corrected to modify the same-origin stylesheet without weakening CSP.

| Matrix row | Executed covering proof |
|---|---|
| Current failure | Reducer typed-failure matrix; Chromium Current recovery lifecycle and Last Valid failure matrix |
| Invalid Draft | Component Draft/backward-selection/validation/Search/IDs/open-History regression; Chromium Current/Last Valid lifecycle |
| Timeout/fence | Clipboard terminal-ownership tests; component and Chromium newest fenced recovery |
| Late result | Clipboard, component and Chromium late resolve/reject fence-release tests |
| Interruption | Reducer delayed-focus/stale-outcome guards; render-ready executor rejection/unmount tests; component and Chromium interaction/mutation/newer-Copy/Undo matrix |
| Recovery lifecycle | Reducer clear/retain tests; component Search/Undo; Chromium native selection, retry, mutation and reload |
| Capacity/reflow | Chromium dense selected recovery/privacy/timing/axe/320px/forced-colors/text-spacing test |

Implementation and build review are complete; sprint status remains `review` pending human acceptance. Chromium/injected clipboard and synthetic events do not certify native OS clipboard, real IME, manual AT, OS/mobile, additional browsers or release readiness. Stories 3.5 and 3.6 remain untouched.

### Final post-review verification

- Parent executed all 98 component tests and all five Story 3.4 Chromium scenarios after patching. The separate-edit Undo regression initially required wrapping programmatic focus in React `act`; the corrected test passes without changing production expectations.
- Fresh full `pnpm run evidence:run`, `node evidence/validate.mjs` and `git diff --check` pass: 52 mandatory cells and 441 exact executed tests (328 Vitest, 66 Node, 47 Chromium), zero skips/retries.
- Final proof: [9777c6f5-2aed-4944-b31d-456f67e0bcd6](../../evidence/runs/9777c6f5-2aed-4944-b31d-456f67e0bcd6/). Artifact digest `11c4e9360cddb7860d2687944ceb907cea822e547f601e6a29241a576e1e433a`.
- All three independent review layers completed; every finding was triaged separately above. Review patches are resolved, with no new deferred work. Human acceptance remains pending.
