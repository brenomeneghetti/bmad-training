---
title: 'Story 2.8: Close Deferred Verification Gaps'
type: 'chore'
created: '2026-10-07'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '39ba84aca82cb9f0021f99e71048de5f269707e0'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

## Intent

**Problem:** Committed Story 2.7 has passing configured Chromium regressions, but source-file references do not prove executed evidence, and broader browser/accessibility verification remains incomplete.

**Approach:** Build reproducible execution-bound evidence for the existing editing experience. This is a fresh draft, not a continuation of delivered follow-up code: the user cancelled and explicitly discarded the uncommitted 2.7 verification follow-up on 2026-10-07, closed original 2.7, and moved all follow-up work here. Re-investigate and approve a complete implementation plan before building.

## Boundaries & Constraints

- Bind all 36 mandatory cells to real reports, exit codes, exact source/build/delivery identities, tool versions, explicit cell mapping and an independently maintained complete regression inventory. Existing source files or manually declared pass flags are insufficient.
- Reject absent, failed, skipped, incomplete, wrong-command, wrong-engine, stale, tampered and escaping-path evidence explicitly. Do not replace full regression coverage with only mapped tests.
- Use existing Vitest, Playwright, Node and Ajv tooling. Test-only browser/runtime installations are authorized by the prior scope decision; no production dependencies, application network/persistence, Undo/Copy features, virtualization or unrelated refactors.
- MVP automated targets are installed Playwright Chromium, Firefox and WebKit. Record actual engine versions; do not claim released Safari, two browser majors or OS/mobile coverage from these engines.
- Keep identical exact Draft/selection, immutable-ID, validation, focus, Search, privacy, IME, 100 ms, 20,000-character and 260-entry assertions across targets. Repair reproduced engine defects instead of relaxing expectations.
- Preserve both immediate and delayed native final-input behavior; composition-result suppression must not swallow later legitimate edits.
- Released-browser latest-two-major Windows/macOS/mobile and observed manual screen-reader checks remain explicitly deferred for MVP with operator checklists. Real 400% browser zoom is post-MVP. Retain 320px, text-spacing and forced-colors checks without asserting zoom or manual-AT equivalence.
- Integrity is repository-local, not signed attestation against an actor who can replace the producer and recompute hashes. Story 3.6 remains the broader promotion/release gate and consumes this foundation.

## Code Map

- `evidence/validation.mjs`, `evidence/schema.json`, `evidence/manifest.json`, `evidence/validate.mjs`: committed source-reference/CSP/artifact gate; extend to executed proof and strict identities.
- `evidence/validate.test.mjs`: existing fixture and rejection tests; add valid execution fixtures, independent inventory, report tampering, relocation, runner lifecycle and negative coverage cases.
- `evidence/run.mjs`, `evidence/coverage.json`, `evidence/inventory.json`, `evidence/runs/`, `evidence/README.md`: proposed new producer, cell mapping, complete inventory, generated reports and truthful operator documentation. None is delivered by cancelled follow-up work.
- `package.json`, `playwright.config.ts`, `tests/workbench.spec.ts`: verification entry point, three approved projects, observed engine metadata, portable browser coverage.
- `src/app/workbench/Workbench.tsx`, `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.test.tsx`, `src/styles/workbench.module.css`: investigate reproduced composition/caret/capacity differences; change application code only for demonstrated defects.
- `_bmad-output/implementation-artifacts/sprint-status.yaml`, `deferred-work.md`: own Story 2.8 tracking without reopening original 2.7 or erasing historical results.

## Tasks & Acceptance

- [ ] Investigate and finalize the producer, evaluator, expected inventory and lifecycle contracts in the files above; approve this draft before implementation.
- [ ] Implement cell-to-test mapping and complete file/full-name unit, file/suite/title browser and validator identities; include every required inventory file in clean checkouts and fixtures.
- [ ] Produce real execution records and content-addressed reports; normalize checkout-specific paths, bind current identities and fail closed with explicit diagnostics.
- [ ] Exercise overlapping runs, signals, exiting children, failed structured-report commands and abandoned workspaces without deleting another owner's publication.
- [ ] Execute all three engines with unchanged semantic/performance contracts; repair confirmed composition/caret/capacity defects and cover stale Domain composition-result suppression.
- [ ] Document runtime setup, observed versions and deferred operator checks; regenerate evidence only after final changes, validate it and complete independent review.

**Acceptance Criteria:**

- Given a required cell or inventory identity, when a mapped or unmapped regression is missing/nonpassing, then validation rejects it despite existing source files or matching aggregate counts.
- Given a passing execution, when source, build, delivery, report or proof changes, then the old proof fails; when only checkout location changes, then unchanged retained evidence remains valid.
- Given concurrent or interrupted execution, when ownership or cancellation is evaluated, then stale success is not reused, cancelled work cannot publish success and another active runner's state remains intact.
- Given approved engines and composition/capacity fixtures, when exercised, then exact semantic, selection, feedback, identity, focus and response requirements hold without per-engine weakened expectations.
- Given deferred released-browser or manual checks, when completion is reported, then they remain explicitly deferred rather than inferred passing evidence.

## Review Backlog

These findings came from review of the cancelled tree, not the restored implementation. Re-verify against the new design; do not treat suggested fixes or discarded passing runs as evidence.

| ID | Layer | Issue / required investigation |
|---|---|---|
| B1 | Blind | Required `evidence/inventory.json` was missing from the diff/checkout and fixtures; clean-checkout validation failed. |
| B2 | Blind | Retained source digest did not match reviewed source; regenerate proof after all final changes. |
| B3 | Blind | Concurrent-run test expected manifest deletion while producer preserved the owner's publication; define and test ownership consistently. |
| B4 | Blind | Validator-skip fixture also replaced the command, failing before the intended skip check; isolate negative mutations. |
| B5 | Blind | Absolute Vitest suite paths made retained reports checkout-location dependent; normalize at publication or bind execution root. |
| B6 | Blind | Browser inventory compared only leaf titles; require file and full suite/title identity, including unmapped regressions. |
| B7 | Blind | Cancellation during awaited manifest rename could leave success published; cover the publication boundary. |
| B8 | Blind | Signal forwarding could throw `ESRCH` after child exit and bypass cleanup; handle that real lifecycle race. |
| B9 | Blind | Failed JSON-reporting commands stored console output as `.json`; retain correctly typed failure diagnostics. |
| B10 | Blind | Abandoned `.evidence-work/` blocked later runs; document safe stale-owner recovery without disturbing active processes. |
| E1 | Edge | Missing inventory prevented execution validation/publication; same root cause as B1. |
| E2 | Edge | Fixture report commands were `["fixture"]` while evaluator required exact runner commands; valid fixtures must reach intended guards. |
| E3 | Edge | Failed workspace acquisition could retain previous success; distinguish rejected overlapping invocation from a failed owned run. |
| E4 | Edge | Moved checkout broke absolute-path report matching; same root cause as B5. |
| E5 | Edge | Published Playwright reports lacked newly required browser-engine annotations; final reports must match current evaluator metadata. |
| V1 | Verification | No regression covered Domain guard expiry after composing `EXAMPLE.ORG`, changing Unicode Domain to `example.net`, then ordinarily entering `EXAMPLE.ORG`; prove publication plus immediate/delayed final-input compatibility. |
| V2 | Verification | Missing inventory made the valid fixture fail before report checks; same root cause as B1. |

Also carry the original inherited gaps: execution-bound cell proof, cross-engine/native IME and browser/version coverage, real zoom/manual accessibility observations. Prior follow-up reproduction notes identified Firefox duplicate final-input publication, Domain no-op caret restoration and WebKit capacity Add latency; reproduce them afresh before changing code.

## Spec Change Log

- 2026-10-07: Created Story 2.8 from the cancelled verification follow-up by explicit user request. All execution tasks are pending; no old generated proof or implementation is retained. Original Story 2.7 stays done at its committed scope.

## Verification

Planned commands, not current results: `pnpm test`, `pnpm run lint`, `pnpm run build`, three-engine Playwright execution, the new producer entry point and `node evidence/validate.mjs`. Add lifecycle, relocation, isolated rejection and Domain composition regressions before claiming completion.

Historical follow-up run/version/digest claims are not deliverable evidence for this draft. The restored original implementation retains its own documented Chromium-only verification.
