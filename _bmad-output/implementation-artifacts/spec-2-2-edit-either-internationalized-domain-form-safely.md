---
title: 'Story 2.2: Edit Either Internationalized Domain Form Safely'
type: 'feature'
created: '2026-10-04'
status: 'done'
route: 'dispatch'
review_loop_iteration: 2
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

- `src/core/idn/index.ts` -- reuse TR46 options, IP handling, and WHATWG validation; return typed bidirectional results without adding a homograph policy.
- `src/core/url/model.ts`, `src/core/url/parser.ts` -- add Domain fields and host-only replacement using `authorityParts`, `rawHost`, `domainId`, and `serializeParts`.
- `src/core/session/session.ts` -- extend ID/revision commands, focused-form drafts, guards, code-point capacity checks, Last Valid, journaling, and success feedback; validate before clearing the opposite draft and share one problem instance per rejection.
- `src/app/pieces/StructuredView.tsx` -- replace read-only Domain controls with labeled bidi-isolated editors using exact stable error IDs, shared help, composition-aware status, delayed-event-safe IME fencing, normalization-aware caret restoration, focus, and associated-error behavior, not the percent codec.
- `src/app/workbench/Workbench.tsx` -- wire Domain commands through existing availability, Search clearing, announcements, and reducer authority; success is polite and invalid field feedback is not duplicated.
- `src/test/fixtures/semantic.ts`, `evidence/manifest.json` -- extend IDN fixtures and Story 2.2 evidence.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/idn/index.ts`, `src/core/idn/index.test.ts` -- add typed bidirectional conversion and prove ASCII-form Unicode rejection plus deviation, combining-equivalent, Arabic, Hebrew, valid confusable mixed-script, invalid Punycode, bidi/joiner, empty-label, and IP cases.
- [x] `src/core/url/model.ts`, `src/core/url/parser.ts`, `src/core/url/parser.test.ts`, `src/core/contracts/problems.ts` -- implement exact Domain replacement/failures and prove unrelated bytes/IDs plus IPv6-with-port serialization stay exact.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- add focused drafts, revisions, atomic commits/status, correction, no-op, and stale/missing/obsolete/capacity guards; preserve either-form drafts, count capacity by code point, reuse one field problem, and leave no success for rejected/no-op attempts.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/app/workbench/Workbench.test.tsx` -- add exact error targets, shared help, composition/invalid-safe status, polite semantics, a fence lasting until a matching post-composition event, and caret mapping that handles canonicalization before or inside the raw suffix.
- [x] `src/test/fixtures/semantic.ts`, `tests/workbench.spec.ts` -- cover the full AG-2 matrix plus repeated correction, opposite-form stale rejection, astral capacity, invalid duplicate feedback, prior-success clearing, live-region semantics, decomposed-suffix caret correction, later-task IME input, Search, bidi, reflow, forced colors, privacy, and near-limit timing.
- [x] `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs` -- add independently mapped Story 2.2 conversion, exactness, accessibility/status, privacy, and capacity cells; accessibility evidence must exercise invalid state and the live-region lifecycle.

**Acceptance Criteria:**
- Given one form owns an unsettled/invalid draft, when it renders, then only that field shows it/error while the counterpart and committed state stay unchanged.
- Given valid Unicode or ASCII input, when submitted, then both forms, lowercase host, Full URL, Current/Last Valid, future Copy source, revision, and one exact mutation publish atomically.
- Given a commit, when snapshots are compared, then only host/derived Domain representations differ; unrelated bytes, IDs, and positions stay exact.
- Given a successful commit, when feedback settles, then visible and polite status identifies both Domain forms and the URL as synchronized without moving focus or the intended caret.
- Given invalid input, when guidance renders, then the focused form uses shared help plus stable `error-{itemId}-{field}`, `aria-invalid`, and one associated validation channel while success status is absent.
- Given a stale, missing-ID, obsolete-session, no-op, over-capacity, or disabled command, when evaluated, then neither form's current local draft is lost, committed state/revision/journal/focus do not change, and no success status remains for that rejected or no-op attempt.
- Given the AG-2 Unicode, ASCII/Punycode, combining, RTL, mixed-script, correction, Search, IME, accessibility, privacy, and capacity fixtures, when evidence runs, then editing is operable, responsive, associated, and free of URL-bearing sinks.

## Implementation Notes

- Added form-aware strict TR46 conversion with ASCII-form enforcement and canonical lowercase serialized hosts.
- Added lossless Domain replacement and reducer-owned per-form drafts, synchronized revisions, exact history entries, and guards for stale, missing, disabled, no-op, and capacity cases.
- Replaced read-only Domain fields with accessible controlled editors that preserve focus, suppress IME commits, isolate invalid drafts, and reuse reducer availability.
- Extended unit, component, browser, privacy, accessibility, performance, and cumulative evidence coverage through Story 2.2.
- Review loop 1 reverted the implementation tree to baseline after feedback, rejected-draft, caret, and fixture gaps were verified; the expanded tasks now govern re-derivation.
- Review loop 2 reverted the re-derived tree after opposite-form draft loss, duplicate capacity guidance, delayed IME, normalization-caret, and status-lifecycle gaps were verified.
- Re-derived the implementation after review loop 2 with guarded draft preservation, code-point capacity checks, shared rejection problems, event-matched IME fencing, composition-safe status, normalization-aware caret restoration, and lifecycle evidence.

## Spec Change Log

- 2026-10-04: Implemented Story 2.2 and completed all execution tasks.
- 2026-10-04: Review found missing exact error/help/status contracts, draft loss on stale/capacity rejection, caret loss after canonicalization, and incomplete AG-2/Search/IME coverage. Code Map, tasks, and acceptance were expanded to avoid those states. KEEP host-only lossless serialization, reducer-owned atomic snapshots/history, focused-form draft exclusivity, dual revisions, existing Full URL guards, and cumulative evidence validation.
- 2026-10-04: Review pass 2 found opposite-form draft deletion before guards, UTF-16 capacity drift, duplicate field/section errors, composition-time false status, timer-limited IME fencing, normalization-sensitive caret drift, and ambiguous rejected-success wording. Tasks and acceptance now require those exact corrections and evidence. KEEP exact error/help IDs, host-only mutation, full AG-2 fixtures, Search restoration, polite success, and the prior lossless/reducer/evidence invariants.
## Review Triage Log

- No verified findings remained after the implementation diff and matrix coverage audit.
- `medium` → patch (verification-gap V1): the ASCII-only guard lacks an otherwise-valid Unicode regression case, so removing it would not fail the current suite.
- `medium` → patch (verification-gap V2): IP conversion is tested only at the helper boundary; host replacement with an IPv6 address and port is not covered.
- `medium` → patch (verification-gap V3): Domain editing under active Search is not exercised, so focus-preserving Search clearing is unverified for the new editors.
- `false` (blind B1): the two generated `node_modules` files were dirty before the recorded baseline and remain preserved user/environment changes, not deliverable content.
- `medium` → bad_spec (blind B2): Domain error IDs are associated but do not implement the required stable `error-{itemId}-{field}` contract.
- `medium` → bad_spec (blind B3): the editable Domain forms have no shared help or `aria-describedby` linkage required by the story.
- `medium` → bad_spec (blind B4): successful Domain commits do not publish the required changing polite status identifying both synchronized representations and the URL.
- `medium` → bad_spec (blind B5): static “Validated domain forms” remains visible beside invalid input and contradicts the field validation state.
- `medium` → bad_spec (blind B6): stale-revision rejection replaces the submitted local draft with the committed value, violating the no-draft-loss contract.
- `medium` → bad_spec (blind B7): over-capacity Domain rejection drops the attempted local draft and exposes only generic section feedback.
- `medium` → bad_spec (blind B8): Chromium reproduction confirmed mixed-case mid-string input canonicalizes correctly but moves the caret from offset 4 to the field end.
- `false` (blind B9): noncanonical IP spellings are not Unicode or ASCII/Punycode Domain forms promised by Story 2.2; the story does not require editing alternate IP lexemes.
- `medium` → patch (blind B10): combining-equivalent Domain edits are required but absent from edit-path coverage.
- `medium` → patch (blind B11): Arabic and Hebrew fixtures cover intake conversion only, not Domain edit publication.
- `medium` → patch (blind B12): no standards-valid confusable mixed-script Domain edit proves the adopted no-extra-policy contract.
- `medium` → patch (blind B13): the browser IME scenario omits the post-`compositionend` input ordering used by some engines; a same-order Chromium reproduction passed, but the regression remains untested.
- `false` (edge E1): noncanonical IP text is outside the story's editable Unicode/ASCII-Punycode Domain-form contract; rejecting alternate IP lexemes does not violate a documented Story 2.2 outcome.
- `false` (edge E2): carried E1; the valid-input acceptance criterion concerns Unicode and ASCII/Punycode Domain forms, not canonicalizable IP spelling variants.
- `medium` → patch (verification-gap R2-V1): invalid Domain coverage does not prove a preceding synchronization success is removed.
- `medium` → patch (verification-gap R2-V2): Domain success tests assert visible text but not the required `role=status` and polite live-region semantics.
- `medium` → patch (verification-gap R2-V3): a stale command for the opposite Domain form deletes the current draft before the revision guard; existing coverage uses only the same form.
- `false` (blind R2-B1): carried B1; generated `node_modules` state predates the baseline and remains preserved, uncommitted environment data.
- `medium` → patch (blind R2-B2): independently confirms R2-V3; opposite-form draft deletion occurs before stale rejection.
- `medium` → patch (blind R2-B3): the early capacity guard counts UTF-16 code units while the URL limit uses Unicode code points, rejecting bounded astral input prematurely.
- `medium` → patch (blind R2-B4): capacity rejection allocates two equivalent problem objects, defeating reference-based duplicate-message suppression.
- `false` (blind R2-B5): Search clearing before dispatch is the inherited Story 2.1 contract for the first attempted structured edit, including rejected and no-op attempts.
- `false` (blind R2-B6): entering the unavailable Full URL state goes through `inputChanged`/parse transitions that already clear prior structured success, so the claimed stale success state is unreachable.
- `medium` → bad_spec (blind R2-B7): the static synchronized label remains visible during an incomplete IME composition because component-local composition state is not reflected in row status.
- `medium` → bad_spec (blind R2-B8): a zero-delay composition fence can expire before a later-task `insertFromComposition`, causing a duplicate no-op that clears fresh success.
- `medium` → bad_spec (blind R2-B9): suffix-length caret restoration fails when correcting an invalid draft causes TR46 normalization inside the suffix.
- `medium` → patch (blind R2-B10): the accessibility evidence does not exercise invalid-state duplicate feedback or the Domain live-region lifecycle.
- `low` → patch (blind R2-B11): the implementation note records the review-loop reversion but not the subsequent re-derivation, leaving chronology incomplete.
- `false` (blind R2-B12): “No verified findings remained” records the earlier internal audit chronologically; later rows document the subsequent external findings and dispositions.
- `medium` → patch (edge R2-E1): independently confirms R2-V3/R2-B2; stale opposite-form commands erase the active draft.
- `false` (edge R2-E2): draft ownership transfers when the newly focused form begins editing, matching the story's combined focus-and-edit trigger; focus alone creates no draft.
- `medium` → bad_spec (edge R2-E3): independently confirms R2-B9; suffix-only caret mapping breaks when successful correction normalizes the suffix.
- `medium` → bad_spec (edge R2-E4): independently confirms R2-B8; later-task post-composition input escapes the timer fence.
- `medium` → patch (edge R2-E5): independently confirms R2-B4; distinct capacity-problem instances duplicate guidance.
- `medium` → bad_spec (edge R2-E6): the amended acceptance wording says guarded commands do not change success while source intent requires no success to remain for a rejected/no-op attempt; the spec must state the intended absence explicitly.
- `medium` → patch (direct R3-D1): serialized near-limit capacity rejection occurred after opposite-draft clearing; capacity failures now preserve both current drafts before adding the rejected focused value.
- `medium` → patch (direct R3-D2): a delayed normalized `insertFromComposition` event could restore the raw DOM value while its duplicate reducer command was fenced; the fence now restores the current controlled canonical value.

## Design Notes

Domain edits bypass the component insertion codec: convert the complete focused draft, then splice only validated lowercase ASCII into the preserved authority. Invalid input stays local; the unfocused form derives from the last commit.

## Verification

**Commands:**
- `pnpm test --run` -- expected: IDN, parser, reducer, component, fixture, and evidence-validator suites pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- expected: typed production artifact builds without diagnostics.
- `pnpm exec playwright test tests/workbench.spec.ts` -- expected: focused Domain editing, correction, accessibility, privacy, and capacity scenarios pass.
- `pnpm run evidence:validate` -- expected: cumulative Epic 2 manifest including distinct Story 2.2 cells validates.

**Results:**
- `pnpm test --run` -- passed: 121 Vitest tests and 4 evidence-validator tests.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- passed without diagnostics; Vite production build completed.
- `pnpm exec playwright test tests/workbench.spec.ts --reporter=line` -- passed: 8 Chromium tests.
- `pnpm run evidence:validate` -- passed: 16 mandatory cells through Story 2.2.
