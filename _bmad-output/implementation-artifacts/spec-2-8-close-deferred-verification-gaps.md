---
title: 'Story 2.8: Close Deferred Verification Gaps'
type: 'chore'
created: '2026-10-07'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'b71a5abd4d9d964efc4b6dd58dac20900ec31547'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The 36-cell gate proves source references, not execution. Chromium behavior needs execution-bound MVP proof; additional browsers remain deferred to Epic 4.

**Approach:** Restart from committed code; bind real regressions to evidence on Chromium. Additional-browser validation belongs to Epic 4, per the user's 2026-10-07 scope change. Discarded work proves nothing.

## Boundaries & Constraints

**Always:**
- Follow `AGENTS.md`. The user removed the working-folder-only restriction on 2026-10-07 and authorized retrying necessary external runtime/tool access and test-only browser prerequisites. Prefer local caches/artifacts; report permission or compatibility blockers explicitly.
- Bind all 36 cells to Chromium reports, exact commands/outcomes, observed versions and source/build/delivery identities. Independently maintain complete approved-run inventory, including unmapped tests; counts/source references cannot prove coverage.
- Preserve exact Draft/selection, IDs, validation, focus, Search, privacy, IME, `<100ms` and 20,000-character/260-entry contracts. Repair only reproduced application defects; do not claim deferred engines passed.
- Cover immediate/delayed composition final input and later edits. Retain 320px, text-spacing, forced-colors and axe checks without zoom/manual-AT equivalence.
- Defer Firefox/WebKit and released-browser latest-two-major Windows/macOS/mobile validation to Epic 4. Retain observed screen-reader operator checklists; real 400% zoom is post-MVP. Story 3.6 consumes the Chromium evidence foundation for release gating.

**Never:** Add production dependencies, persistence, application network/logging, Undo/Copy, virtualization, per-engine relaxations or unrelated refactors. Local integrity is not signed attestation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Complete run | Exact approved inventory, Chromium, passing reports | All cells resolve to successful exact identities | Explicit incomplete/nonpassing diagnostic |
| Invalid proof | Missing/skipped/unmapped test, wrong argv/engine, stale/tampered input | Reject despite matching counts/source references | Identify failed contract |
| Relocation/path attack | Same bytes in moved checkout; escaping path/symlink | Relocation remains valid; escape rejected | No external access |
| Ownership/cancellation | Overlap, exited child, stale workspace, signal at publication | Active owner untouched; cancelled owner cannot publish success | Typed failure and token-checked cleanup |
| Composition/capacity | Immediate/delayed final input, later Domain edit, dense Add | One publication, exact caret/state/focus and response | Reproduce before repairing |

</frozen-after-approval>

## Code Map

- `evidence/validation.mjs`: reuse `requiredCells`/CSP checks; extend `validateEvidence`; harden `calculateArtifactDigest`.
- `evidence/schema.json`, `manifest.json`, `validate.mjs`, `validate.test.mjs`: v1 proves no execution. Fixtures need valid commands/inventory/reports before isolated mutations.
- `playwright.config.ts`, `tests/workbench.spec.ts`: Chromium-only; replace CDP/DPR and clipboard-permission assumptions portably.
- `src/app/pieces/StructuredView.tsx`: Domain caret/final-input and token composition. `src/app/workbench/Workbench.tsx`: synchronous publication/focus guards. Existing caret fallback is not a reproduced defect.
- `src/app/workbench/Workbench.test.tsx`, `src/test/fixtures/semantic.ts`: reuse composition/capacity fixtures; preserve reducer chronology.

## Tasks & Acceptance

**Execution:**
- [x] `evidence/{inventory,coverage,schema}.json` -- complete exact file/full-title/project identities and multiplicities for all runners; map every cell.
- [x] `evidence/validation.mjs`, `validate.mjs`, `manifest.json` -- validate outcomes, pinned contracts, hashes, normalized identities and digests; reject escaping/symlink/special-file paths before access.
- [x] `evidence/run.mjs`, `package.json` -- fresh build/lint/full suites, structured reports, text diagnostics, observed versions, exclusive ownership and validated publication.
- [x] `evidence/validate.test.mjs`, `evidence/run.test.mjs` -- matrix, clean-checkout/relocation fixtures, isolated mutations, overlap, signal/rename races, exited-child `ESRCH` and stale recovery.
- [x] `playwright.config.ts`, `tests/workbench.spec.ts`, `src/app/workbench/Workbench.test.tsx` -- approved Chromium project/engine metadata; immediate/delayed/stale Domain regressions. Reproduce caret/dense Add before repairing mapped application files/styles.
- [x] `AGENTS.md`, `evidence/README.md`, `_bmad-output/implementation-artifacts/{sprint-status.yaml,deferred-work.md}` -- folder-local setup/deferred checks; track 2.8 only. Retain current reports under `evidence/runs/`; regenerate if independent review changes hashed inputs.

**Acceptance Criteria:**
- Given a complete run, when evaluated, then all inventory/cells pass with observed versions and content-bound reports.
- Given stale/invalid proof, when evaluated, then rejection identifies the violated contract despite counts/pass flags.
- Given relocated/concurrent/cancelled runs, when evaluated, then portability/ownership hold and cancellation exposes no success.
- Given Chromium, when regressions execute, then exact semantic/performance contracts hold; additional-browser execution is deferred to Epic 4.
- Given completion reporting, when reviewed, then deferred browser/manual/zoom checks remain unverified.

## Implementation Notes

- Independent review produced 19 findings: 18 patch findings addressed, one unverified command-deadline risk deferred with settlement evidence. Repairs cover final beforeinput/selection, ordinary Domain no-op caret, actual child-group cancellation, conservative interrupted-command recovery, final ownership cancellation, supported Node, optional Vite inputs, per-command source checks, typed missing-report diagnostics, native nested skip/todo reporting and evidence lint coverage.
- Parent acceptance audit reproduced stale Domain suppression after composing `EXAMPLE.ORG`, editing the Unicode form to `example.net`, then ordinarily re-entering `EXAMPLE.ORG`. Bound suppression to the published field value; strengthened both existing browser timings and added a unit regression. Immediate/delayed final input and later edits pass unchanged.
- The approved MVP inventory contains 252 Vitest, 37 Node and 30 Chromium browser executions, with unmapped tests retained independently. All 36 cells map exact Chromium identities. Firefox/WebKit are deliberately outside this approved run, not reported passing or silently skipped.
- Reproduced same-turn Firefox input/change publication races and delayed normalized Domain final-input feedback loss. Added synchronous publication, native cancellable `beforeinput`, native composition/ref guards and final-input suppression. The old state-only token guard also reproduced premature publication on both installed engines before repair.
- Kept native listeners stable after reproduced Firefox dense Search/reorder responses exceeded 100 ms. Final Chromium/Firefox suites pass the unchanged performance thresholds. Existing Domain caret fallback and dense Add behavior passed; neither was rewritten.
- Replaced CDP/DPR assumptions with portable 320px checks. Synthetic clipboard events carry test-owned data consistently across engines; native clipboard/manual IME coverage remains an operator check. Firefox's `fill()` produced native composition start/end during an artificially open composition; the Full URL test now uses explicit native setters/input events for the same unchanged composition expectations on every engine.
- Removed the obsolete v1 success manifest. A failed owned run leaves no success pointer; its immutable native reports, command logs, version observations, source/build identities and explicit incomplete attempt remain under `evidence/runs/`.
- Earlier checked implementation tasks described delivered code, not acceptance of full cross-engine proof. The original all-engine run remained incomplete; the user subsequently approved Chromium-only MVP verification, with additional browsers deferred to Epic 4.
- This resumed implementation must generate a fresh Chromium-only publication; the earlier incomplete run remains diagnostic history, not current success.

## Spec Change Log

- 2026-10-07: Created Story 2.8 from the cancelled verification follow-up by explicit user request. All execution tasks are pending; no old generated proof or implementation is retained. Original Story 2.7 stays done at its committed scope.
- 2026-10-07: User discarded current work and restarted 2.8 with folder-only instructions. Consolidated inherited backlog into executable contracts; preserve passing semantics.
- 2026-10-07: User removed the folder-only restriction and requested completion. Renegotiated the frozen access constraint accordingly; retry missing browser/runtime prerequisites without changing semantic contracts or deferred coverage.
- 2026-10-07: User rejected the additional-browser prerequisite retry and approved basic Chrome validation for now. Renegotiated browser scope to installed Chromium, retained the complete integrity/regression gate, and deferred additional-browser validation to Epic 4.

## Review Triage Log

The system-temp diff was inaccessible to all three reviewers; the repository-local retry completed all lenses. File-access failures are not code findings.

| Finding | Verdict | Route | Evidence and disposition |
|---------|---------|-------|--------------------------|
| Blind B1: final token beforeinput duplicates composition | high | patch | Cancelable final beforeinput bypasses the fallback guard and inserts an already-published result. Suppress this demonstrated event ordering and cover it. |
| Blind B2: delayed final input loses caret | medium | patch | Replacing the raw final value with normalization resets the selection. Preserve the published selection in both editors. |
| Blind B3: exited leader prevents group escalation | medium | patch | Escalation uses leader exit state although pipe-holding descendants remain. Signal the known group independently and add real-child coverage. |
| Blind B4: stale recovery ignores surviving children | medium | patch | A dead runner does not establish that its groups stopped. Persist command-in-progress state and refuse unsafe automatic recovery. |
| Blind B5: unsupported Node observation passes | medium | patch | Observation consistency does not enforce the declared engine range. Validate the current range and isolate the negative case. |
| Blind B6: public/env build inputs omitted | medium | patch | Vite consumes optional public and environment files but the source contract ignores membership. Include present optional inputs and test additions. |
| Blind B7: command source snapshot unchecked | medium | patch | Commands inherit a digest measured only at run boundaries. Measure source before/after each invocation; reject observed changes. Transient changes entirely within a command remain outside local attestation. |
| Blind B8: missing Vitest report masks failure | medium | patch | Report reading precedes recording exit/signal. Preserve failed execution first, distinguish missing structured proof and keep console diagnostics typed. |
| Blind B9: evidence code outside lint | medium | patch | The new gate implementation is omitted by the existing lint selector. Include evidence MJS files. |
| Blind B10: command deadline absent | maybe-false | defer | No supported command hang was reproduced. A controlled long-running child establishes cancellation coverage, not a natural runner deadline requirement. Defer an unverified medium risk pending reproducible stalls/timeout policy. |
| Edge E1: cancellation during final ownership await | medium | patch | Abort is checked before an await, not after it; cleanup also awaits before success. Recheck after ownership and make the final success release synchronous. |
| Edge E2: group escalation skips exited leader | medium | patch | Same demonstrated root cause as B3; preserve separate finding and share the group cleanup correction. |
| Edge E3: missing Vitest JSON masks exit outcome | medium | patch | Same execution-record ordering as B8; retain separate disposition. |
| Edge E4: cancelable composition final beforeinput | high | patch | Same event path as B1; share the final-input guard and test. |
| Edge E5: nested Node skips disappear | medium | patch | Reporter records only nesting zero, so skipped children can disappear under a passing suite. Record nested identities and nonpassing status. |
| Edge E6: cancellation contradicts success claim | medium | patch | Same final await race as E1. The claim is accurate only after the cancellation boundary is repaired. |
| Verification V1: actual child cancellation untested | medium | patch | Hook fixtures never invoke a process; add a pipe-holding, signal-resistant descendant test with bounded cancellation and cleanup assertions. |
| Verification V2: reporter skips/todos untested | medium | patch | Existing Node fixtures bypass the native reporter. Exercise pass/fail/skip/todo and nested events at that boundary. |
| Verification V3: missing Vitest report loses outcome | medium | patch | Same proven ordering defect as B8/E3; add a no-report command-failure regression. |

## Design Notes

Use existing Node/Ajv/Vitest/Playwright, zero retries and repository-relative identities. Independently pin commands/contracts. Hash `src`, `tests`, evidence code/contracts, package/lock/config and `AGENTS.md` separately from build/delivery; exclude generated reports/manifest/tracking/docs. Recheck before publishing immutable report objects and an atomic manifest pointer.

Overlap cannot touch the owner's publication. Owned failure/cancellation invalidates current success; token-check cleanup and conservative explicit stale recovery. Test cancellation at publication. Keep native structured reports separate from console logs; test normalization adapters.

## Verification

- `pnpm test`, `pnpm run lint`, `pnpm run build` -- complete suites, lint/build pass.
- `pnpm exec playwright test tests/workbench.spec.ts` -- Chromium project passes with its observed engine version.
- `pnpm run evidence:run`, `node evidence/validate.mjs` -- current proof validates complete cells/inventory.
- Prefer repository-local temporary/cache/browser paths; necessary external prerequisites are authorized by the updated access constraint.

### Earlier incomplete all-engine attempt (superseded scope, diagnostic only)

- `pnpm run evidence:run` ran fresh build, lint, full Vitest (252 passing) and full Node (37 passing), then the pinned complete Playwright command with zero retries.
- Retained reports: [final attempt](../../evidence/runs/db5e7c77-8061-45e7-af67-c9b6a7011671/attempt.json), [native browser report](../../evidence/runs/db5e7c77-8061-45e7-af67-c9b6a7011671/playwright.json), [command diagnostics](../../evidence/runs/db5e7c77-8061-45e7-af67-c9b6a7011671/playwright.txt).
- Chromium 153.0.8010.12: 30/30 pass. Firefox 155.0: 30/30 pass. WebKit: 0/30 execute successfully; missing host-library prerequisites block launch. Test-only browser downloads are repository-local; no system-library installation was attempted.
- Observed CLI versions: Node 22.20.0, pnpm 12.5.1, Vitest 5.0.1, Playwright 1.63.0. The producer's observed Node version differs from the package's declared supported Node 24/26 range; retain this as an environment compatibility risk, not a claim of supported-runtime coverage.
- Source digest: `896bdaf668fa4fb154a8f60543189ddaf7adfb8e3d5eb887ca0a3657a928cb8e`. Build/delivery digest: `9fbe16bf24a7321a2a2156a4e09914a71a62a3968656ab19fac3ac145fec517e`.
- `pnpm run evidence:run` exits nonzero with `COMMAND_FAILED`. `node evidence/validate.mjs` exits nonzero with `INCOMPLETE`; there is deliberately no current success manifest. Complete-run/all-engine acceptance remains unmet, while complete passing synthetic proof fixtures and invalid-proof/lifecycle matrices pass.
- Additional-browser and released-browser latest-two-major Windows/macOS/mobile validation belongs to Epic 4. Real native clipboard/IME and observed screen readers remain unverified. Real 400% browser zoom remains post-MVP; Story 3.6 consumes the Chromium proof foundation.

### Current approved Chromium MVP verification

- `PATH="/home/blackdude/.local/share/mise/installs/node/24.21.0/bin:$PATH" pnpm run evidence:run` -- exit 0; fresh build, lint, 252 Vitest tests, 37 Node integrity/lifecycle tests and 30 Chromium browser tests all pass, with no skipped tests or retries.
- `node evidence/validate.mjs` -- exit 0; validates all 36 mandatory cells and all 319 exact executed tests against the current source/build/delivery identities.
- Current publication: [manifest](../../evidence/manifest.json); retained [native browser report](../../evidence/runs/8d8f1a21-8830-4cfa-b29d-873fb452ebdb/playwright.json) and [command diagnostics](../../evidence/runs/8d8f1a21-8830-4cfa-b29d-873fb452ebdb/playwright.txt), alongside build/lint/Vitest/Node reports and version observations.
- Observed versions: Node 24.21.0 (supported package range), pnpm 12.5.1, Vitest 5.0.1, Playwright 1.63.0, Chromium 153.0.8010.12.
- Source digest: `cee0bd49555d0cb30cfe9b0121818e62f5f7b9bc1320d5cc57b01222e22080c6`. Build/delivery digest: `9fbe16bf24a7321a2a2156a4e09914a71a62a3968656ab19fac3ac145fec517e`.
- Matrix audit: complete proof and relocation pass; isolated missing/skipped/unmapped/wrong-engine/argv/stale/tampered/path mutations reject; overlap, exited-child, stale recovery and cancellation before/after publication pass. Immediate/delayed composition, later Domain selection, dense Add and unchanged performance/capacity regressions pass on Chromium.
- Implementation is ready for independent review, not a claim of additional-browser or manual coverage. Firefox/WebKit and released-browser OS/mobile validation remain Epic 4 work; real native clipboard/IME, observed screen readers and actual 400% zoom remain unverified. No host prerequisite installation was performed.

### Parent acceptance audit and regenerated proof

- Confirmed Chromium-only MVP/Epic 4 deferral directly with the user. All five matrix rows have passing executed coverage, including isolated invalid-proof/path mutations, relocation, overlap/stale recovery and cancellation before/after publication.
- After the reproduced stale-suppression repair, the complete producer and validator pass: 253 Vitest, 37 Node and 30 Chromium tests; 36 mandatory cells and 320 exact executions. Fresh build/lint pass on Node 24.21.0.
- Current [manifest](../../evidence/manifest.json) refers to [run ce12b272](../../evidence/runs/ce12b272-873b-46ab-8ded-87e51d419312/playwright.json), source `c554dbed0c56aac02556e7fd1df65bc1da0d9b8341cf5ed675bd781f8d38defd`, artifact `a736243b7441404977fe0f0d3eb73e3d56ecc47a9cbb2ed3d1143dffb4a136f9`. Earlier runs remain historical, not current proof.

### Final post-review verification

- The complete producer and validator pass after all source changes: 253 Vitest, 45 Node and 31 Chromium tests, no skipped tests/retries; 36 mandatory cells and 329 exact executions. Build, expanded evidence lint and supported Node 24.21.0 pass.
- Current [manifest](../../evidence/manifest.json) binds [run 2e697cf0](../../evidence/runs/2e697cf0-d565-4833-818a-9952d6d539b0/playwright.json), source `84a2fb7bca9c33990bcac17473b4f191c89b8475e2ea17a5f9c196f5ec3b9ea5`, artifact `969b7e194f270c8833873597529ad0d69e0501db6a042ba1bca67c884ee633c8`. Prior reports remain historical only.
- Real subprocess tests exercise leader exit plus signal-resistant pipe-holding descendants, bounded SIGKILL escalation, ownership release, source mutation and Vitest failure without JSON. Reporter tests cover nested pass/fail/skip/todo. Browser fixtures explicitly preserve engine-specific final input types and exact normalized prefix selection without claiming real OS IME coverage.
- All matrix rows and approved MVP acceptance criteria have passing executed coverage. Independent review fixes are complete; the unverified deadline risk and browser/manual/zoom deferrals remain explicit. Sprint status remains `review` for human acceptance; this spec's build workflow is `done`.

## Human Acceptance

- 2026-10-07 20:58 -03:00: The user accepted Story 2.8 as reviewed. Sprint tracking advances from `review` to `done`; the approved Chromium MVP scope and all documented deferrals remain unchanged.
