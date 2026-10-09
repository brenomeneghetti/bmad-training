---
title: 'Story 3.6: Enforce the Trusted Release Evidence Gate'
type: 'feature'
created: '2026-10-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '6893447dc1dfd832442c7ff825b6ef624ef1f82a'
context:
  - '{project-root}/AGENTS.md'
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Chromium MVP execution proof does not evaluate release requirements, manual observations, ownership, hardware, studies or promotion.

**Approach:** Extend the existing evaluator into one versioned, fail-closed story/release oracle. Distinguish MVP success from release eligibility.

## Boundaries & Constraints

**Always:**
- Preserve reviewed execution identities/coverage, hashes, source/build/delivery bindings, runner ownership and Chromium MVP behavior.
- Define stable cells covering FR1-FR16, NFR1-NFR17, UX-DR1-UX-DR28 and AG-1-AG-3. Record requirement/story/fixture, owner/sign-off, result, evidence reference, tested versions, matrix/evaluator version and artifact digest. Story decisions evaluate mapped requirements; release evaluates all release cells.
- Only `pass` satisfies mandatory evidence. Reject missing, duplicate, malformed, waived, skipped, failing, stale or unsupported records. Evidence references must resolve to digest-verified records, not source files or test counts.
- Hash artifact-bound external observations and record attestor/date/approval; self-reported signatures are not independently authenticated.
- Require exact hardware and measurement records: at least four logical CPUs and 8 GB RAM, 20,000-character/260-query fixtures, initial parse at most one second, and Search/edit/Add/Remove/Reorder/Undo/Copy at most 100 ms.
- Require latest-two-major Chrome/Firefox/Edge/Safari; Windows Chrome/Edge/Firefox+NVDA, macOS/iOS Safari+VoiceOver, Android Chrome+TalkBack and Windows/macOS keyboard-only observations. Cover native keyboard/IME/clipboard, focus, feedback/failures, pointer/touch, 320px/400% reflow, colors/spacing/contrast/reduced motion and WCAG 2.2 AA. Approved deferrals block broader release, not MVP validation.
- Require complete signed UJ-1 records for 5-8 unique representative developers, including all participants and assistance/outcomes. Compare whole-journey unassisted completers/all participants against 0.90 without rounding.
- Require zero critical synchronization, Undo/identity/focus or stale-Copy failures across every evidence channel; reject contradictory summaries.
- Require privacy/lifecycle evidence for prohibited network/logging/storage/traces/error hooks, Clipboard sources and reload/close. Preserve CSP including `connect-src 'none'`.
- Promotion authorization binds identical tested bundle and headers, HTTPS, immutable fingerprinted assets, no-cache HTML and atomic prior-artifact/header rollback. Missing delivery proof blocks authorization.
- Emit stable non-content codes and reviewed cell identifiers, never submitted content or raw exceptions.

**Never:** Fabricate proof, relax requirements, deploy without authorization, rebuild on promotion, change application behavior or mark Story 3.5 accepted.

**Delivery decision:** Implement only the local gate and content-addressed promotion-authorization contract. Do not deploy or implement a hosting adapter. Actual HTTPS promotion and atomic rollback remain unproven and release-blocking until concrete delivery evidence is supplied.

**Approved evidence amendment:** Performance observations must record a nonempty measurement method, describing how durations were collected. On 2026-10-09 the user authorized this format amendment and focused review fixes while preserving the existing implementation instead of full re-derivation.

## I/O & Edge-Case Matrix

| Scenario | Input/state | Expected result |
|----------|-------------|-----------------|
| MVP vs release | Valid Chromium run; absent external proof | MVP passes; release fails with specific missing-cell codes |
| Complete fixture | Synthetic evaluator fixture with every required record | Gate passes only for matching artifact; fixture is not release proof |
| Integrity | Missing/duplicate/stale/waived/skipped/malformed evidence | Nonzero gate result; no authorization output |
| Study | 5-8 records; missing participant, assistance or inadequate ratio | Reject invalid population/records; count assisted journeys as unsuccessful; compare exact ratio |
| Performance | Inadequate hardware, missing operation or exceeded bound | Required performance cell fails |
| Critical failure | Failure in any channel despite a passing summary | Story/release decision fails as mapped |
| Delivery | Different bytes/headers, absent HTTPS or rollback proof | No promotion authorization; stable failure code |

</frozen-after-approval>

## Code Map

- `evidence/validation.mjs`, `schema.json`, `validate.mjs` -- execution oracle/schema/CLI; extend, not duplicate.
- `evidence/contracts.mjs`, `coverage.json`, `inventory.json` -- commands/source bindings/reviewed identities; preserve producer separation.
- `evidence/run.mjs`, `run.test.mjs` -- ownership/cancellation/atomic publication safeguards.
- `evidence/validate.test.mjs` -- reusable integrity negatives.
- `deployment/static-delivery.json` -- declarative delivery policy; no host adapter.
- `package.json`, `evidence/README.md` -- command/documentation integration.
- Story 3.5 continuity: preserve completed feedback, execution proof and pending acceptance.

## Tasks & Acceptance

**Execution:**
- [x] `evidence/{schema.json,contracts.mjs,release-contract.json}` -- define reviewed requirements, record shapes and source bindings.
- [x] `evidence/{validation.mjs,validate.mjs}` -- evaluate scoped proof, study arithmetic, performance and critical failures; emit safe diagnostics.
- [x] `evidence/{run.mjs,run.test.mjs}` -- integrate any manifest-version changes without weakening ownership or publication.
- [x] `evidence/{validate.test.mjs,release.test.mjs}` -- test all matrix rows, exact thresholds, missing combinations, contradictions and authorization suppression.
- [x] `evidence/{coverage.json,inventory.json,contracts.mjs}` -- deliberately register changed exact test identities; never generate reviewed expectations from execution.
- [x] `package.json`, `deployment/static-delivery.json`, `evidence/README.md` -- wire commands/delivery contract; document provenance and unproven coverage.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance only 3.6 with truthful implementation/review status, distinct from release eligibility.

**Acceptance Criteria:**
- Given intact proof, when MVP evaluation runs, then prior behavior passes without claiming release readiness.
- Given incomplete external proof, when release evaluates, then it exits nonzero with safe codes and no authorization.
- Given complete evaluator fixtures, when decisions run, then only scoped all-pass artifact-bound records satisfy the gate.
- Given tampered required evidence, when evaluated, then success is blocked and the reviewed failing cell identified.

## Implementation Notes

- Extended the existing oracle with schema-1 external records, matrix 1/evaluator `3.6.1`, 92 reviewed cells, safe scoped decisions and content-addressed promotion authorization. Execution manifests remain version 2 and retain all 56 Chromium MVP cells.
- Numbered requirement/native/performance/privacy/critical cells conservatively map to all reviewed stories; UJ-1 and delivery map to 3.6/release. No narrower requirement mapping is inferred from test counts. Any narrowing requires deliberate matrix review/versioning.
- Records and attachments are digest-verified, artifact/source/run-bound and dated/approved. Latest released major baselines are attested by browser owners, not independently queried/authenticated. Signatures are self-reported, not cryptographically authenticated.
- Synthetic envelope and record provenance cannot authorize promotion. Observed-path unit fixtures also remain synthetic test data, not actual release proof. No hosting adapter, deployment or promotion rebuild was implemented.
- Deliberately registered 19 release-oracle tests and two lifecycle tests. Existing application behavior, prior identities, runner ownership/cancellation/atomic manifest publication and Story 3.5 pending acceptance remain unchanged.

## Spec Change Log

- 2026-10-09, D3: require `details.measurementMethod` in performance observations; matrix 2/evaluator `3.6.2` distinguish the amended contract. Prevent admitting unexplained duration claims. KEEP exact execution/digest bindings, Chromium MVP separation, manual deferral blockers and local-only delivery. The user approved focused amendment/patching instead of reverting/re-deriving the implementation.

## Review Triage Log

All three independent layers were blocked from reading the system-temp diff.
The runtime also refused same-agent continuation for synchronous reviewers.
The user explicitly authorized direct review and waived independent reviewers.
No independent layer is recorded as passing.

| Finding | Verdict | Evidence and route |
|---|---|---|
| D1: participant approval is not tied to participant identity | medium | A digest-verified study whose first participant is signed by `different-person` still returns `satisfied: true`. Existing participant/sign-off fields support an identity equality check; route: patch. |
| D2: synthetic observations produce CLI story success | high | `--story 3.5` prints `STORY_GATE_PASS` for the synthetic fixture. Pure fixtures may exercise evaluator branches, but the operational CLI must not claim completion from synthetic observations; route: patch using the existing provenance guard. |
| D3: performance evidence omits measurement method | medium | Accepted performance details contain only hardware, fixture and durations; Story 3.6 requires a recorded measurement method. Adding a required evidence field changes the input contract; route: bad_spec, pending human approval of a focused format amendment. |

The user approved the D3 amendment and focused D1-D3 fixes while retaining the
implementation. D1 binds each participant attestor to its identity; D2 rejects
synthetic records in the operational story CLI; D3 requires a nonempty method
under matrix 2/evaluator `3.6.2`. Existing exact test identities are extended,
not renamed or generated from reports.

## Design Notes

No remaining intent gaps or irreversible actions. Footprint: evidence/contracts/tests, commands/docs/tracking. Synthetic fixtures prove evaluator behavior, not actual release readiness. Current release evaluation must fail until missing observations exist.

## Verification

- Run targeted Node integrity/release/lifecycle tests with repository-local verification paths.
- Run fresh `pnpm run evidence:run` and existing MVP validation after deliberately updating exact inventories.
- Run release evaluation against current evidence: expect nonzero, named missing cells and no authorization output.
- Run `git diff --check`; independent review and human acceptance remain separate.

### Executed implementation verification

- Targeted integrity/release/lifecycle run: 95/95 passed before final provenance/publication refinements.
- Final fresh `pnpm run evidence:run` using Node 24.21.0 and repository-local verification paths: build and lint succeeded; 336 Vitest, 96 Node and 52 Chromium tests passed with exact reviewed identities, zero skips/retries and all 56 MVP cells.
- Persistent run: `evidence/runs/090908d6-d82f-4f8b-8682-5a05e1a19983`; artifact digest `28f2191467152571a02e648a19470469968ce7754eacf670d4bd422d8bed5757`.
- `pnpm run evidence:validate`: `MVP_PASS`, 484 exact tests; release explicitly not evaluated.
- Current `node evidence/validate.mjs --release`: expected exit 1, all 92 missing reviewed external cells named, empty stdout and no authorization directory/object. Actual release observations and HTTPS/atomic rollback proof remain absent.
- `git diff --check` passed. Every I/O matrix row is covered by executed release tests; individual mandatory-cell omissions, mixed omissions, exact thresholds, contradictions, scoped decisions and authorization suppression are exercised.
- Implementation is ready for independent review; independent review and human acceptance have not been claimed by this implementation handoff.

### Final direct-review verification

- The user waived the blocked independent reviewers and authorized direct review.
  D1-D3 are corrected and covered by the existing exact release-test identities.
  Review is complete; human acceptance remains separate.
- Fresh full execution: [def18398-74b1-4c21-be0a-45f31c13a984](../../evidence/runs/def18398-74b1-4c21-be0a-45f31c13a984/),
  with build/lint, 336 Vitest, 96 integrity/lifecycle/release and 52 Chromium tests
  passing, zero skips/retries, all 56 mandatory MVP cells and 484 exact identities.
- The parent also ran all 19 release tests before the fresh full run, and checked
  their passing identities in the resulting report. Matrix rows map to the
  executed MVP/missing-cell, synthetic/observed authorization, integrity,
  UJ-1 population/signature/ratio, performance-bound/method, critical-summary
  contradiction and delivery-rejection scenarios.
- `node evidence/validate.mjs` passes. The real `--release` evaluation exits 1,
  emits all 92 missing reviewed cell identifiers, has empty stdout and leaves
  no authorization directory. `git diff --check` passes.
- Matrix 2/evaluator `3.6.2` require the approved measurement-method amendment.
  Artifact digest: `28f2191467152571a02e648a19470469968ce7754eacf670d4bd422d8bed5757`.
  No new deferred code findings remain. External/manual/browser/AT/study and
  actual HTTPS/rollback evidence remain unproven and release-blocking; nothing
  was deployed. Sprint 3.6 stays in review pending human acceptance, and 3.5's
  pending acceptance is unchanged.
