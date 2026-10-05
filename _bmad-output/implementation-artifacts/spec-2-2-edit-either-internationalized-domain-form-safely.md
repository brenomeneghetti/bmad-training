---
title: 'Story 2.2: Edit Either Internationalized Domain Form Safely'
type: 'feature'
created: '2026-10-04'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'aaa2b4fab6fdcdf569c3853c5d23bf209d611ccc'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Developers can inspect Unicode and ASCII/Punycode Domains but cannot safely edit either form without risking unrelated URL text or synchronized state.

**Approach:** Add reducer-owned Domain drafts and bidirectional TR46 conversion, committing validated input as one host-only mutation across both forms and all committed surfaces.

## Boundaries & Constraints

**Always:** Only the focused form owns a draft; its counterpart shows the last commit. Validate with adopted strict non-transitional TR46 and WHATWG HTTP/HTTPS host rules. Accepted hosts serialize as lowercase ASCII/Punycode and atomically update both forms, Full URL, Current/Last Valid, future Copy source, revision, and one exact mutation entry. Preserve Domain identity and every unrelated byte/ID/order. Keep invalid drafts correctable, IME-safe, focus-preserving, field-specific, associated, and private.

**Never:** Reparse/canonicalize the complete URL for host replacement; live-update the unfocused form; use transitional IDN, extra mixed-script policy, index identity, or ID recycling. Do not implement Full URL rebase, Undo, Copy, Domain removal, or edits while Full URL text is unapplied/invalid.

**Submission decision:** Evaluate each input operation immediately. Commit whenever the complete focused draft is valid; otherwise keep it local for correction. This matches Story 2.1 while the counterpart and URL remain last-committed until a valid operation succeeds.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Unicode commit | `faß.de` in Unicode form | Commit `xn--fa-hia.de`; show both forms; preserve non-host bytes | Keep prior commit if conversion/validation fails |
| ASCII commit | Valid mixed-case Punycode | Commit lowercase ASCII and readable Unicode | Keep invalid draft with associated guidance |
| Invalid correction | Empty label, invalid Punycode, bidi/joiner, or rejected host | No committed change | Preserve draft and stable field error |
| Duplicate/no-op | Submitted form converts to the committed ASCII host | Preserve exact state and focus | Create no mutation or success feedback |
| Full URL draft | Full URL is unapplied/invalid | Disable both editors | Reject commands without replacing Draft/Last Valid |

</frozen-after-approval>

## Code Map

- `src/core/idn/index.ts` -- reuse TR46 options, IP handling, and WHATWG validation; return typed bidirectional results.
- `src/core/url/model.ts`, `src/core/url/parser.ts` -- add Domain fields and host-only replacement using `authorityParts`, `rawHost`, `domainId`, and `serializeParts`.
- `src/core/session/session.ts` -- extend ID/revision commands, drafts, guards, no-op/capacity rejection, Last Valid, and journaling.
- `src/app/pieces/StructuredView.tsx` -- replace read-only Domain controls with labeled bidi-isolated editors reusing IME, caret, focus, and error behavior, not the percent codec.
- `src/app/workbench/Workbench.tsx` -- wire Domain commands through existing availability and reducer authority.
- `src/test/fixtures/semantic.ts`, `evidence/manifest.json` -- extend IDN fixtures and Story 2.2 evidence.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/idn/index.ts`, `src/core/idn/index.test.ts` -- add typed bidirectional edit conversion and valid, invalid, IP, bidi/joiner, empty-label, and malformed-Punycode cases.
- [x] `src/core/url/model.ts`, `src/core/url/parser.ts`, `src/core/url/parser.test.ts`, `src/core/contracts/problems.ts` -- implement exact Domain replacement/failures and prove all unrelated serialization and IDs stay exact.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- add drafts, revisions, stale/missing guards, atomic commits, correction, capacity/no-op handling, and one mutation entry.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/app/workbench/Workbench.test.tsx` -- add accessible Domain editors with IME/focus safety, associated errors, availability guards, and synchronized commits.
- [x] `src/test/fixtures/semantic.ts`, `tests/workbench.spec.ts` -- cover both directions, keyboard/IME, bidi isolation, reflow, forced colors, privacy, and near-limit render timing.
- [x] `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs` -- add independently mapped Story 2.2 cells without weakening cumulative validation.

**Acceptance Criteria:**
- Given one form owns an unsettled/invalid draft, when it renders, then only that field shows it/error while the counterpart and committed state stay unchanged.
- Given valid Unicode or ASCII input, when submitted, then both forms, lowercase host, Full URL, Current/Last Valid, future Copy source, revision, and one exact mutation publish atomically.
- Given a commit, when snapshots are compared, then only host/derived Domain representations differ; unrelated bytes, IDs, and positions stay exact.
- Given a stale, missing-ID, no-op, over-capacity, or disabled command, when evaluated, then committed state, revision, journal, success status, and unrelated focus do not change.
- Given keyboard, IME, accessibility, privacy, and capacity fixtures, when evidence runs, then editing is operable, responsive, associated, and free of URL-bearing sinks.

## Implementation Notes

- Added form-aware strict TR46 conversion with ASCII-form enforcement and canonical lowercase serialized hosts.
- Added lossless Domain replacement and reducer-owned per-form drafts, synchronized revisions, exact history entries, and guards for stale, missing, disabled, no-op, and capacity cases.
- Replaced read-only Domain fields with accessible controlled editors that preserve focus, suppress IME commits, isolate invalid drafts, and reuse reducer availability.
- Extended unit, component, browser, privacy, accessibility, performance, and cumulative evidence coverage through Story 2.2.

## Spec Change Log

- 2026-10-04: Implemented Story 2.2 and completed all execution tasks.
## Review Triage Log

- No verified findings remained after the implementation diff and matrix coverage audit.

## Design Notes

Domain edits bypass the component insertion codec: convert the complete focused draft, then splice only validated lowercase ASCII into the preserved authority. Invalid input stays local; the unfocused form derives from the last commit.

## Verification

**Commands:**
- `pnpm test --run` -- expected: IDN, parser, reducer, component, fixture, and evidence-validator suites pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- expected: typed production artifact builds without diagnostics.
- `pnpm exec playwright test tests/workbench.spec.ts` -- expected: focused Domain editing, correction, accessibility, privacy, and capacity scenarios pass.
- `pnpm run evidence:validate` -- expected: cumulative Epic 2 manifest including distinct Story 2.2 cells validates.

**Results:**
- `pnpm test --run` -- passed: 110 Vitest tests and 4 evidence-validator tests.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- passed without diagnostics; Vite production build completed.
- `pnpm exec playwright test tests/workbench.spec.ts --reporter=line` -- passed: 8 Chromium tests.
- `pnpm run evidence:validate` -- passed: 16 mandatory cells through Story 2.2.
