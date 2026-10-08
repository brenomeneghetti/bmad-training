---
title: 'Story 3.2: Keep Keyboard Undo and Focus Predictable'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'eb9aa4a06c582eb962175d010b7ecd47a9633292'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Undo restores state but lacks keyboard routing and logical focus recovery.

**Approach:** One input arbiter routes shortcuts to existing Undo. Reducer-owned focus effects execute serially after render.

## Boundaries & Constraints

**Always:**
- Intercept lowercase `event.key === "z"` with Ctrl on Windows/Linux or Meta on macOS, without Shift/Alt/AltGraph, outside native editing/composition, with available Undo. Ignore prevented events; prevent default exactly once for product Undo.
- Native Undo wins when target, active element or either selection endpoint belongs to input, textarea, select or contenteditable host/descendant. Honor inherited editability/noneditable islands; test platform policy independently of host OS.
- Preserve 3.1 snapshots, revisions, monotonic IDs, chronology and guarded no-ops. Composition anywhere disables both Undo paths until settlement/detachment; visible Undo otherwise remains explicit.
- Undo Add: nearest survivor. Remove: recreated Remove control. Edit: original field/Domain representation. Reorder: activated direction's enabled Move, opposite Move, then first editable field. Full URL: textarea.
- Nearest-row resolution uses restored source order, next then previous, otherwise Full URL. Search-hidden targets use nearest visible row's first editable field or Full URL; retain Search and explain filtering.
- Preserve invalid Draft text, selection/direction and validation through focus movement. Retain "Draft URL is unchanged." feedback.
- Monotonic effect IDs carry epoch/revision and typed preconditions. Claim immediately before invocation; acknowledge exactly once before starting the next. Stale/missing/precondition failures touch no DOM and enqueue no replacement.
- Mount/scroll before focus. Newer user focus/input/composition/mutations cancel obsolete focus; adapter focus must not cancel itself or create unintended history.
- Preserve forward-action focus/Search, pointer cancellation, privacy, complete 20,000-character/260-entry rendering and below-100-ms Undo response.

**Never:** Redo, Copy, feedback scheduling, virtualization, persistence, new dependencies or release certification. Chromium MVP proof cannot establish real IME/manual AT/OS/mobile/additional-browser coverage.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Shortcut | Eligible primary+z | One Undo/focus/status | Empty history: untouched |
| Native/excluded | Editor/selection/IME or excluded chord | No product changes | Event untouched |
| Restoration | Every mutation type | Exact state; operation destination | Enabled fallback |
| Filtering | Hidden target/no results | Visible neighbor/Full URL; explanation | Search retained |
| Invalid Draft | Backward selection/error | Exact Draft through focus movement | Last Valid restores |
| Races | New revision/missing ID/interaction/duplicate ack | One acknowledgement; no stale DOM changes | No replacement |
| Capacity | 20,000 characters/260 parameters | Complete rows/focus below 100 ms | No privacy sinks |

</frozen-after-approval>

## Code Map

- `src/core/session/session.ts`: reuse `MutationEntry`, `canUndo` and closure/publication; add missing reorder direction.
- `src/app/workbench/Workbench.tsx`: composition gate, pending-focus refs and Search; no shortcut.
- `src/app/pieces/{StructuredView.tsx,search.ts}`: mounted rows/IDs/source order; preserve caret/composition.
- `src/platform/{effects,focus}/index.ts`: interface-only boundaries; keep DOM outside core.
- Existing suites cover reversal/Drafts/capacity; update intentional focus expectations only.
- `evidence/`: reviewed identities/cells, never runner-generated expectations.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/workbench/inputArbiter{.ts,.test.ts}` -- implement/test routing matrix.
- [x] `src/core/session/session{.ts,.test.ts}` -- targets/metadata, effect queue/claim/ack and race tests.
- [x] `src/platform/{effects,focus}/index.ts` and adjacent tests -- serial execution/render-ready focus.
- [x] `src/app/workbench/Workbench{.tsx,.test.tsx}` -- wire both Undo paths, filtering, selection/cancellation; retain forward focus.
- [x] `tests/workbench.spec.ts`, `src/test/fixtures/semantic.ts` -- exercise every matrix row through visible/shortcut paths, including private dense response.
- [x] `evidence/{validation.mjs,coverage.json,inventory.json,validate.test.mjs,README.md,validate.mjs}` -- 3.2 arbiter/focus/Draft/effect cells, exact identities, negative tests.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance 3.2; keep Epic 3 active.

**Acceptance Criteria:**
- Given the routing matrix, when activated, then native Undo is untouched and eligible product Undo restores once with one focus/status outcome.
- Given Search/invalid Draft, when restoration renders, then logical focus moves without losing selection, identity or validation.
- Given queued effects/newer work, when claimed, then stale effects never touch DOM and serial exactly-once acknowledgement holds.
- Given fresh Chromium evidence, when validated, then existing/3.2 cells pass without weakened thresholds or deferred-coverage claims.

## Implementation Notes

- Added DOM-free typed focus intents in `src/core/session/effects.ts`; the reducer owns monotonic IDs, operation metadata, epoch/revision/interaction preconditions, serial claims and acknowledgement guards.
- One document keyboard arbiter protects native targets, active editors, selection endpoints, inherited contenteditable/noneditable islands and composition. Explicit Undo shares the same reducer/effect path.
- Render-ready adapters scroll then focus immutable-ID controls, retain Search, explain hidden-target fallback and preserve invalid Draft selection/validation. Adapter focus does not begin Full URL history.
- Preserved forward-action focus and pointer cancellation. Composition across the document settles on compositionend or detachment.
- Added four reviewed Story 3.2 evidence cells and exact new test identities. Updated the directly related runner publication test from 40 to 44 cells without relaxing proof.
- Parent direct review was authorized after independent-review tool failures. Added application-level platform detection regressions for MacIntel/Win32/Linux and both-path filtered Add reversal with a visible earlier survivor/no-results fallback. Both gaps passed without production-code changes; reviewed inventory and routing coverage explicitly include the new identities.

## Spec Change Log

## Review Triage Log

Independent review is incomplete: blind and edge-case reviewers refused the system-temp diff. An identical repository-local copy was provided, but the runtime rejected same-agent continuation because synchronous agents cannot receive follow-up messages. These are tool blockers, not code findings; neither layer claims a successful review.

| Finding | Verdict | Evidence and disposition |
|---------|---------|--------------------------|
| Verification V1: Workbench macOS platform selection lacks regression coverage | medium | Helper tests inject `mac`, but integration/browser tests used Ctrl and never exercised Workbench's platform detection. Added passing MacIntel/Win32/Linux integration assertions for primary/excluded modifiers, exact restoration and focus; explicit evidence identities pin all three. Repaired. |
| Verification V2: filtered Undo Add lacks nearest-visible regression coverage | medium | Unfiltered Add exercised `nearest`; filtering tests exercised Remove's `piece` branch. Extended both-path Chromium filtering coverage to Add with an earlier visible survivor and no-results fallback, retaining Search, backward Draft selection/error and explanation. Repaired; no production behavior defect reproduced. |

Authorized direct review traced both activation paths, native target/active/selection ownership, composition settlement/detachment, operation metadata, rendered destination resolution, reducer claim/acknowledgement and cancellation, and forward-focus/Draft preservation. No further demonstrated production defect was found. This does not substitute for a successful independent blind/edge-case review or manual OS/AT coverage.

## Design Notes

No intent gaps/irreversibles. Cross-layer footprint requires dispatch. Reuse mounted rows; share plumbing only to prevent competing focus.

## Verification

- Targeted Vitest/Chromium 3.2 suites with local caches and supported Node.
- `pnpm run evidence:run`; `node evidence/validate.mjs` -- fresh exact-execution proof.
- `git diff --check` -- clean patch.
- Fresh passing publication: `evidence/runs/d075c0f3-1b9a-474c-b814-1748c0bcbcd0`, Node 24.15.0, 307 Vitest + 53 Node + 39 Chromium tests; all 44 mandatory cells validated with zero skips/retries.
- Matrix audit: arbiter/native/excluded/composition rows covered by `inputArbiter.test.ts` and Chromium routing; restoration by both-path operation focus; filtering/invalid Draft by both-path backward-selection tests; races by reducer/effect/adapter guards; capacity/privacy by dense shortcut and existing visible-Undo browser tests, with unchanged below-100-ms checks.
- An initial evidence run failed on the existing runner publication test's 40-cell assertion. That coupled assertion was corrected to 44, and a new full run passed; failed-attempt diagnostics remain retained.
- Ready for review, not human acceptance or release certification. Real IME, manual AT, OS/mobile and additional browsers remain unverified/deferred as specified.
- Final parent verification after authorized direct review/repairs: `pnpm run evidence:run` and `node evidence/validate.mjs` pass. Run [86e55871](../../evidence/runs/86e55871-e1cc-428a-85fe-777267ec623f/playwright.json) binds 310 Vitest, 53 Node and 39 Chromium executions (402 total), all passing, to 44 mandatory cells. Source digest `aaef70366a3ddf785137c809a91f00fab57942f5d69e7fc231a88c17556eb1fa`; artifact digest `b72896ba0e23de2c49ed3112b686471496af2cfad8a19ea7bafa022ddf3c2aa5`.
- Final matrix audit includes actual platform detection and both-path filtered Add, in addition to every mutation destination, native ownership/excluded chords, composition settlement/detachment, invalid backward Draft selection/validation, guarded serial effects and private complete capacity restoration below 100 ms. No new behavior defect was reproduced; both verification gaps are repaired.
- Build workflow complete; sprint tracking remains `review` pending human acceptance. Independent blind/edge-case layers remain blocked, with direct review explicitly authorized by the user. No new work was deferred; existing Epic 4/manual coverage deferrals remain.
