---
title: 'Story 3.3: Copy the Latest Valid URL Truthfully'
type: 'feature'
created: '2026-10-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c181c7bc82faeebd20e01eef3e32689e2b6d520a'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Copy is disabled; developers cannot export Current/Last Valid.

**Approach:** Reducer-owned intents and serial clipboard effects provide exact writes and truthful feedback without disturbing editing.

## Boundaries & Constraints

**Always:**
- Capture only `snapshot.serialized`, Current/Last Valid, epoch/revision and monotonic attempt/effect IDs. No reconstruction, normalization, DOM source or focus baseline.
- Persistent accessible Copy explains inactivity without a session. Completed activation only, never pointer-down/cancellation. Pointer activation retains editor focus/selection/open History.
- Preserve Draft/backward selection, validation, Structured View, Search, identities/History. Existing keyboard blur remains; Copy adds no History.
- Claim immediately before invocation; verify revision/epoch/latest attempt/exact source/classification. Superseded intents acknowledge without write/success/focus. Focus cancellation must not cancel valid Copy.
- Share serial ownership with Undo focus: n+1 starts after n's terminal acknowledgement. Use typed non-content outcomes for success, unavailable API, throw, rejection and timeout.
- Only current latest attempts report “Current URL copied.” or “Last Valid URL copied; Draft URL is unchanged.” Invoked writes cannot be revoked; stale completion cannot claim current success.
- Separate persistent source-specific actionable retry feedback from validation/polite success. Clear obsolete failure on retry/relevant source change; never steal focus.
- Timeout retains an unresolved-write fence: no overlap/late success. Later activations receive unique acknowledged non-success outcomes; recovery belongs to 3.4.
- Keep content browser-local/session-only; no raw exception logging or content in requests, telemetry, traces, storage, cookies or diagnostics.
- Retain complete 20,000-character/260-query rendering, below-100-ms activation, stable action order, 320px reflow and existing Undo.

**Never:** Safe-copy recovery (3.4), full feedback scheduling (3.5), Redo, dependencies, persistence or release certification. Chromium automation does not prove native clipboard/manual AT/IME/OS/mobile/additional browsers.

## I/O & Edge-Case Matrix

| Scenario | Input | Result |
|----------|-------|--------|
| Current/Last Valid | Valid snapshot/invalid Draft | Exact snapshot write, literal status, editing retained |
| Stale queued | Mutation/Undo/reclassification/newer Copy | Superseded acknowledgement, no write/success |
| Late result | Source/attempt changes after invocation | Acknowledge, suppress obsolete guidance |
| Failure | Missing API/throw/reject | Content-free typed failure, visible retry |
| Timeout | Unresolved write | Failure/fence; no overlap/late success |
| Activation | Keyboard/touch/cancellation/repetition | Unique completed intents, serial outcomes |
| Capacity | 20,000 characters/260 queries, edit/Copy/Undo | Exact writes, complete responsive private rows |

</frozen-after-approval>

## Code Map

- `src/core/session/{session.ts,effects.ts,index.ts}`: snapshot/History/revisions/focus queue. Invalid Draft retains Last Valid; reuse publication.
- `src/platform/effects/index.ts`: focus executor; avoid competing consumers/repeated invocation.
- `src/platform/clipboard/index.ts`: interface-only `ClipboardPort`; bounded browser adapter/fence.
- `src/app/workbench/Workbench.tsx`: disabled Copy/state-ref/focus orchestration; retain composition/destinations.
- `src/styles/workbench.module.css`: reuse action/status/error tokens.
- `src/test/fixtures/semantic.ts`: reuse semantic/capacity fixtures.
- `evidence/{validation.mjs,coverage.json,inventory.json}`: reviewed 44-cell/exact-identity contracts, not runner-generated expectations.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/session/{effects.ts,session.ts,session.test.ts,index.ts}` -- capture/claim/ack, precedence/feedback; test matrix/History.
- [x] `src/platform/clipboard/{index.ts,index.test.ts}` -- browser boundary, typed failures/timeout/fence; test late settlement.
- [x] `src/platform/effects/{index.ts,index.test.ts}` -- shared execution; test stale/duplicate heads, ordering/unmount.
- [x] `src/app/workbench/Workbench{.tsx,.test.tsx}`, `src/styles/workbench.module.css` -- accessible Copy/status/retry; preserve editing state.
- [x] `tests/workbench.spec.ts`, `src/test/fixtures/semantic.ts` -- exact writes/races/failures, activation/Draft/dense privacy/timing.
- [x] `evidence/{validation.mjs,coverage.json,inventory.json,validate.test.mjs,run.test.mjs,README.md,validate.mjs}` -- pin source, stale/serial, failure and capacity cells; update counts/negative tests.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance only 3.3.

**Acceptance Criteria:**
- Given Current/invalid Draft, when Copy completes, then exact snapshot bytes and literal feedback preserve editing state.
- Given races, when outcomes settle, then serial exactly-once acknowledgements prevent stale success/overlapping writes.
- Given failure/cancellation, when exercised, then truthful retry never leaks content or steals focus.
- Given fresh Chromium evidence, when validated, then all cells pass exact identities and unchanged thresholds.

## Implementation Notes

- Added reducer-owned monotonic Copy intents and source/revision/epoch/attempt claims, with isolated success and actionable failure state. Copy does not mutate snapshots or History.
- Shared serial executor handles asynchronous Copy and render-ready Undo focus. Browser adapter emits non-content failures and fences timed-out writes; persistent Copy preserves pointer editing and keyboard tab order.
- Reused existing semantic/capacity fixtures without changing their source. Added exact core, adapter, component and Chromium tests plus four mandatory evidence cells and deliberately reviewed identities.
- Implementation agent was accidentally cancelled before returning. Parent resumed the persisted changes and confirmed the current inventory matches all three runners; earlier failed attempts remain diagnostics, not passing proof.
- Authorized direct review repaired timeout ownership: the fence now releases only when the underlying write settles, while the old outcome remains timeout and never emits late success. Timeout/fenced guidance describes the attempted failure rather than falsely claiming the session can never retry. Adapter and Chromium regressions prove no overlap and successful fresh retry after late settlement.

## Spec Change Log

## Review Triage Log

Independent review is blocked, not complete. All three reviewers refused the required system-temp diff path before assessing findings. Parent provided a byte-identical repository-local copy, but the runtime rejected continuation because synchronous agents cannot receive follow-up messages. No layer claims a successful review; human guidance is required before substituting direct review or retrying fresh reviewers.

The user subsequently authorized direct review in this session. Parent traced snapshot/source capture, classification/revision/epoch/attempt checks, pointer/keyboard/History behavior, shared serial claims, duplicate acknowledgement, asynchronous render-ready focus, unmount, separate validation/feedback and clipboard privacy/timeout outcomes.

| Finding | Verdict | Evidence and disposition |
|---------|---------|--------------------------|
| Direct D1: timeout permanently prevents retry after the native write settles | medium | `createBrowserClipboard` checked terminal feedback before clearing ownership, so even a settled write retained its fence forever; UI also incorrectly claimed retry was impossible for the session. Moved fence release before the terminal guard, retained suppression of the old result, and corrected persistent guidance. Adapter tests cover late resolve/reject followed by a separately fenced retry; Chromium proves no late success and safe new successful activation. Minimal patch, repaired. |

No additional demonstrated production defect was found. Independent layers remain blocked and are not represented as passing; direct review was explicitly authorized. No new work was deferred.

## Design Notes

No intent gaps/irreversible repository changes. Clipboard writes cannot be revoked. Cross-layer footprint requires dispatch; choose a 3-second timeout/injected clocks. Fence only; recovery UX remains 3.4.

## Verification

- Targeted Vitest/Chromium matrix suites with supported Node/local caches.
- `pnpm run evidence:run`; `node evidence/validate.mjs` -- fresh all-cell proof, zero skips/retries, no manual-coverage claims.
- `git diff --check` -- clean patch.
- Fresh parent execution: [13d48869](../../evidence/runs/13d48869-a79f-4e51-b908-c16d0af04ac5/playwright.json), Node 24.21.0, 319 Vitest + 57 Node + 43 Chromium tests (419 total), all passing; 48 mandatory cells validate. Artifact digest `60aaaeef9aaadb6346f47508bc32406ded36063000fac64d810e588b409bca60`.
- Matrix audit: exact Current/Last Valid and Draft retention run in reducer/component/Chromium suites; queued/invoked races in reducer/executor/Chromium; missing API/throw/rejection/timeout/late settlement in adapter/Chromium; keyboard/pointer/touch/cancellation/repetition in Chromium; complete private dense edit/Copy/Undo response below 100 ms and 320px reflow in Chromium. Native clipboard/manual coverage remains unverified.
- Final post-repair publication: [b31fcfe7](../../evidence/runs/b31fcfe7-c33b-4499-8b49-21d147b3c36f/playwright.json), 319 Vitest + 57 Node + 43 Chromium tests, all 419 passing with zero skips/retries, and all 48 mandatory cells validated. Artifact digest `9cb0a7f3e85603b8ed78e4eb1b439ecf16875acf7d5d043d419e32afaf85d159`.
- The first post-repair full run failed the unchanged dense-path parser's 100-ms assertion at 196.22 ms. The exact parser test passed in isolation; the subsequent fresh full execution passed without changing code, thresholds, retries or contracts. That failed attempt remains retained as nonpassing diagnostics.
- Build workflow complete; sprint status remains `review` pending human acceptance. Story 3.4 recovery, Story 3.5 scheduling, and existing Epic 4/manual coverage boundaries remain unchanged.
