---
title: 'Story 2.1: Edit Path and Query Text Without Rewriting Untouched Content'
type: 'feature'
created: '2026-10-04'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '8716db16edf048bd76ed07e00435dc78d135729a'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Developers can inspect Path Segments and Query Parameters, but cannot edit one field without risking normalization, delimiter damage, duplicate ambiguity, or unrelated byte changes.

**Approach:** Add reducer-owned raw component editing backed by a pure insertion codec and exact token mutation, preserving all unaffected URL text and identities while invalid local drafts remain correctable.

## Boundaries & Constraints

**Always:** Address edits by immutable Piece ID, field kind, token revision, UTF-16 selection range, and inserted text. Commit each valid input operation immediately and atomically while invalid text remains a local correctable draft. Preserve untouched bytes, separators, percent casing, authority, Fragment, order, duplicate identity, and absent-versus-empty values. Accepted edits update Current/Last Valid snapshot, Full URL, Structured View, Copy source, token revision, and one exact before/after mutation entry. Keep structured editors disabled whenever Full URL has unapplied or invalid text; enable them only after that text is validly applied. On the first structured edit under active Search, clear Search, restore the complete source list, retain focus on the edited control, and announce the restored count. Keep validation field-specific, persistent, associated, IME-safe, and focus-preserving.

**Never:** Decode fields for editing; use `URLSearchParams`, generic round-trip splitting, canonical serialization, index identity, ID recycling, or stale-command rebasing. Do not implement Domain editing, Add, Remove, Reorder, Full URL close-and-rebase, Undo, or Copy behavior. Do not move Search into reducer state or emit URL content to external sinks or diagnostics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|---------------------------|----------------|
| Path insertion | Reserved text, Unicode, `+`, or complete percent triplets | Encode only inserted text with the path profile; preserve `+`, complete triplets, untouched prefix/suffix, and all unrelated bytes | Reject bare/partial `%` and ranges splitting an existing triplet |
| Query edit | Key or value with delimiters, Unicode, duplicates, empty/absent value | Apply the field-specific query profile to the target Piece ID only; preserve `equalsPresent`, siblings, separators, and order | Keep invalid draft local; committed snapshot and journal stay unchanged |
| Stale command | Missing ID, old token revision, or invalid UTF-16 range | No committed mutation, history entry, success status, or unrelated focus movement | Show a safe non-content explanation without rebasing |
| Capacity edit | Near-20,000-character URL with 250+ query entries | Commit within the 100 ms target with stable identity and exact serialization | No partial publication, freeze, omission, layout blockage, or URL-bearing diagnostics |
| Full URL draft | Full URL differs from the applied snapshot or is invalid | Structured editors remain disabled until valid Apply publishes the text | Preserve the exact Full URL draft; do not dispatch structured mutations |
| Active Search edit | A visible editor is changed while Search is active | Clear Search before dispatch, restore all rows, retain editor focus, and announce the restored count | Do not unmount the edited row or create a separate URL mutation |

</frozen-after-approval>

## Code Map

- `src/core/url/model.ts` and `src/core/url/parser.ts` -- preserve raw path/query tokens, separators, exact serialization, and immutable IDs; extend mutation behavior without changing scanner acceptance.
- `src/core/url/codec.ts` -- add the pure UTF-16 range-aware component insertion codec and field-specific encoding profiles.
- `src/core/contracts/problems.ts` -- add stable non-content structured-edit problem codes.
- `src/core/session/session.ts` -- reducer authority for local drafts, token revisions, Current/Last Valid snapshots, atomic structured edits, capacity/no-op rejection, exact mutation entries, and the active-phase command guard; retain existing epoch/generation/revision guards.
- `src/app/pieces/search.ts` -- continue deriving presentation-only Managed Pieces in canonical source order; do not make Search mutative.
- `src/app/pieces/StructuredView.tsx` -- replace read-only Path/key/value controls with source-identifiable controlled editors, atomic deletion boundaries, minimal fallback/IME diffs, render-time caret restoration, disabled draft state, and associated validation.
- `src/app/workbench/Workbench.tsx` -- gate editors on applied active state and clear Search before first structured dispatch while retaining focus and announcing restored results.
- `src/test/fixtures/semantic.ts` and `evidence/manifest.json` -- add shared Story 2.1 semantic fixtures and mapped FR6/AG-1/accessibility/privacy/performance evidence.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/url/codec.ts`, `src/core/url/codec.test.ts` -- implement and exhaustively test range validation, percent-triplet preservation, literal `+`, uppercase UTF-8 insertion, exact path/query profiles including query apostrophes, and valid correction after rejected triplet edits.
- [x] `src/core/url/model.ts`, `src/core/url/parser.ts`, `src/core/contracts/problems.ts` -- add exact target-token mutation, typed rejection, and post-mutation 20,000-character enforcement without changing parser round trips.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- add reducer-owned drafts, token revisions, Last Valid/current state, active-phase gating, atomic accepted transitions, exact before/after entries, and serialized no-op rejection.
- [x] `src/app/pieces/StructuredView.tsx`, `src/app/workbench/Workbench.tsx`, `src/app/workbench/Workbench.test.tsx` -- wire source-identifiable accessible editors, disabled Full URL draft state, Search clearing, atomic code-point/triplet deletion, minimal paste/cut/word-delete/IME fallback diffs, selection restoration, persistent validation, and focus retention.
- [x] `src/test/fixtures/semantic.ts`, `src/core/url/parser.test.ts`, `tests/workbench.spec.ts` -- cover duplicates, encoded delimiters, percent case, raw/inserted Unicode, malformed percent text, empty/absent values, no-ops, pending/invalid Full URL, active Search, caret/selection operations, over-capacity rejection, privacy, accessibility, and end-to-render capacity timing.
- [x] `evidence/manifest.json`, `evidence/schema.json`, `evidence/validation.mjs`, `evidence/validate.test.mjs` -- map separate passing Story 2.1 FR6, AG-1 codec, accessibility, privacy, and performance cells and make the schema describe only the cumulative Epic 2 manifest it actually validates.

**Acceptance Criteria:**
- Given a Path Segment, Query key, or Query value editor, when a valid edit is applied, then only the addressed token and explicitly changed delimiter presence differ and every synchronized surface publishes one coherent exact snapshot.
- Given an invalid, stale, missing-piece, out-of-range, or split-triplet edit, when the reducer evaluates it, then committed state, identities, token revisions, journal, and unrelated focus remain unchanged while the local draft exposes associated correction guidance.
- Given duplicate or identical-looking pieces, when one Piece ID is edited, then no sibling changes identity, content, position, validation, or serialization.
- Given Full URL has unapplied or invalid text, when Structured View renders or a stale programmatic edit arrives, then every structured editor is disabled and no command can replace the draft or committed snapshot.
- Given active Search includes an editor, when its first structured edit begins, then Search clears before dispatch, all rows return, focus/caret remain on that editor, and restored results are announced without an extra mutation.
- Given deletion, cut, paste, word deletion, IME, or a fallback change occurs, when the controlled value publishes, then the command represents only the user's actual UTF-16 replacement, keeps percent triplets and code points atomic, restores the post-edit selection, and records no serialized no-op.
- Given IME, keyboard-only, 320px, 400% zoom, forced-colors, text-spacing, privacy, and capacity fixtures, when verification runs, then editing remains operable, responsive, exact, and free of prohibited URL sinks.

## Implementation Notes

- Added a pure raw-component insertion codec with UTF-16, surrogate-pair, and percent-triplet boundary validation plus distinct path, query-key, and query-value profiles.
- Added immutable ID-targeted token mutation, exact URL reconstruction, reducer-owned local drafts and token revisions, Last Valid/current snapshots, and complete before/after mutation entries.
- Converted Path and Query fields into accessible controlled editors with selection-aware input/paste handling, IME suppression, persistent associated errors, and focus-stable updates.
- Extended the shared semantic corpus, core/component/browser coverage, and evidence matrix through Story 2.1.
- Audit follow-up aligned query key/value apostrophe encoding with the special-query profile and preserved pre-existing malformed percent text while correcting a newer invalid draft.
- Review loop 1 reverted the implementation tree to baseline after intent gaps and cross-input edge cases were confirmed; the approved decisions and expanded tasks now govern re-derivation.

## Spec Change Log

- 2026-10-04: Implemented all Story 2.1 tasks and recorded passing automated evidence.
- 2026-10-04: Review found that structured edits could discard Full URL drafts or lose focus under Search, and that input handling, capacity, no-op, accessibility, performance, and evidence tasks were underspecified. The frozen intent now disables structured editing until valid Apply and clears Search on first edit; Code Map, tasks, acceptance, design, and verification were expanded to avoid those known-bad states. KEEP exact token mutation, immutable IDs, local invalid drafts, apostrophe encoding, accepted malformed-percent preservation, IME suppression, and the 20,000-character fixture.

## Review Triage Log

- `medium` → patched: token edits rebuilt serialization but retained stale malformed-percent diagnostics; mutation now rescans the exact result and a regression test verifies correction clears the problem.
- `medium` → patched: stale-revision rejection applied old selection coordinates to the current token when constructing a draft, which was a local rebase; it now preserves the current raw field unchanged and attaches safe guidance.
- `medium` → patched: missing-piece rejections were reducer-visible but had no rendered feedback path; Structured View now exposes the non-content explanation without duplicating field-associated draft errors.
- `medium` → patched: the reducer performance test used only about 14,000 characters, so it did not verify the matrix's near-20,000-character case; it now uses the exact 20,000-character shared capacity fixture with 260 query entries.
- `medium` → patched: IME completion used the composed draft length as the replacement range, which could retain a suffix from a longer committed value; it now replaces the full pre-composition field and has a multi-character regression test.
- `medium` → bad_spec (verification-gap V1): structured mutation does not reapply the 20,000-character limit, so a supported maximum-size URL can publish an oversized committed state.
- `medium` → bad_spec (verification-gap V2): Backspace at offset zero in an absent query value dispatches an empty edit that changes `flag` to `flag=` and journals a mutation.
- `medium` → bad_spec (verification-gap V3): collapsed deletion adjacent to a non-BMP character subtracts one UTF-16 code unit and creates a split-surrogate validation failure instead of the browser's character deletion.
- `medium` → bad_spec (verification-gap V4): word-deletion `beforeinput` types are prevented but dispatched with a collapsed empty range, so the keyboard operation does nothing and can create a false mutation.
- `medium` → bad_spec (verification-gap V5): encoded insertion before suffix text has no render-time selection restoration, allowing the controlled input caret to jump and subsequent typing to target the wrong position.
- `medium` → bad_spec (verification-gap V6): unchanged composition or empty edits still increment token/state revisions and append History because the reducer has no serialized no-op guard.
- `low` → patch (verification-gap V7): the broadened evidence schema advertises Epic 1 manifests but requires seven cumulative cells, making its accepted `epic` values internally inconsistent.
- `medium` → patch (verification-gap V8): minimal draft correction can collapse a valid whole-field correction back inside an existing percent triplet and reject it again as a split range.
- `medium` → intent_gap (verification-gap V9): immediate Search recomputation can unmount an edited row once it stops matching, which loses focus despite the approved focus-preservation invariant.
- `high` → intent_gap (blind B1): structured editing while Full URL is pending or invalid replaces `state.input` from Last Valid and silently discards user draft text; the frozen intent does not choose whether to disable editing or preserve/rebase the draft before Stories 2.6–2.7.
- `medium` → bad_spec (blind B2): structured editing can exceed the 20,000-character supported limit; this independently confirms V1.
- `medium` → bad_spec (blind B3): an empty deletion in an absent value creates `=` and History; this independently confirms V2.
- `medium` → bad_spec (blind B4): unchanged serialized edits advance revisions and History; this independently confirms V6.
- `medium` → bad_spec (blind B5): unsupported deletion types are prevented without applying their intended range; this independently confirms V4.
- `medium` → bad_spec (blind B6): character-level deletion derives invalid UTF-16 boundaries for non-BMP text; percent-triplet rejection is intentional, but the demonstrated surrogate behavior still breaks ordinary keyboard deletion.
- `medium` → bad_spec (blind B7): composition completion and fallback change replace the whole field through the insertion encoder, so untouched accepted raw Unicode can be percent-encoded.
- `medium` → intent_gap (blind B8): an edited row that ceases matching active Search unmounts and loses focus; this independently confirms V9.
- `medium` → bad_spec (blind B9): repeated Query labels expose only “Key” or “Value,” so assistive-technology users cannot identify source position or duplicate occurrence from the editor's accessible name.
- `medium` → bad_spec (blind B10): the browser performance timer ends at event dispatch and does not prove the resulting render and restored usability complete within 100 ms.
- `medium` → bad_spec (blind B11): browser coverage omits selection insertion, paste/cut, word deletion, caret retention, filtered-row editing, over-capacity rejection, and browser IME ordering required by the acceptance surface.
- `low` → patch (blind B12): Epic 1 is accepted by the schema but cannot satisfy its seven-cell bounds; this independently confirms V7.
- `false` (blind B13): the two `node_modules` files were dirty before the recorded baseline and remain uncommitted; the implementation commits did not add these preserved user changes.
- `medium` → bad_spec (blind B14): the manifest adds one aggregate Story 2.1 cell instead of independently mapped FR6, AG-1, accessibility, privacy, and performance cells claimed by the task.
- `medium` → patch (edge E1): valid correction of a split-triplet draft can still derive split boundaries; this independently confirms V8.
- `medium` → bad_spec (edge E2): whole-field IME replacement rewrites untouched literal Unicode; this independently confirms B7.
- `medium` → intent_gap (edge E3): Search filtering can remove the focused edited row; this independently confirms V9.
- `medium` → bad_spec (edge E4): word deletion is prevented without a usable deletion range; this independently confirms V4.
- `medium` → bad_spec (edge E5): structured mutation bypasses the intake capacity guard; this independently confirms V1.
- `low` → patch (edge E6): advertised Epic 1 schema compatibility contradicts cumulative cell bounds; this independently confirms V7.
- `medium` → patched: native Cut deleted the selected raw text but did not populate the clipboard; the editor now writes the atomically expanded selection to the cut event's clipboard data and browser coverage verifies it.
- `low` → patch (verification-gap R2-V1): structured-edit tests covered conventional authority/path forms but did not prove supported special authority markers and backslash separators remain exact after mutation; add parameterized mutation round trips.
- `medium` → defer (verification-gap R2-V2): Playwright remains configured for Chromium only, so cross-engine native input ordering is unverified; this is a repository-wide browser-matrix limitation predating Story 2.1 and needs installed Firefox/WebKit release infrastructure.
- `medium` → defer (verification-gap R2-V3): evidence validation proves required cell names and source-file existence rather than binding cells to immutable passing run artifacts; this is inherited evidence infrastructure and requires an artifact contract beyond this story.
- `medium` → patch (blind R2-B1): Search clears before dispatch but the restored-count announcement waits for a snapshot change, so rejected and no-op structured edits do not announce restoration and can leak the pending announcement into a later edit.
- `medium` → patch (blind R2-B2): fallback deletion inside a percent triplet can expand the replaced range while retaining a remnant from the browser value, turning `%2F` into `F` instead of applying an atomic deletion.
- `medium` → patch (blind R2-B3): unhandled `delete*` `beforeinput` types are prevented with a collapsed range; allow unknown native deletion types through to the atomic fallback rather than converting them to no-ops.
- `medium` → patch (blind R2-B4): `Shift+Delete` is intercepted as plain Delete before the platform can emit Cut; preserve the native shortcut so the Cut handler can copy and remove the selected atom.
- `medium` → patch (blind R2-B5): keydown suppression is reset only on keyup, so a focus change before keyup can cause the next input to be dropped; reset suppression on blur.
- `medium` → patch (blind R2-B6): applying an unchanged Full URL reparses it, recycles Piece IDs, and clears structured History; treat an already-active identical Apply as a serialized no-op.
- `medium` → defer (blind R2-B7): carried by R2-V2; Chromium-only configuration does not establish cross-engine behavior for the new event-sensitive editors.
- `low` → defer (blind R2-B8): the existing accessibility scenario couples a 320 CSS-pixel viewport with DPR 4 rather than exercising browser zoom directly; a portable zoom-evidence strategy is pre-existing release infrastructure work.
- `medium` → patch (blind R2-B9): the new IME browser test omits the post-`compositionend` input ordering used by some browsers, so it cannot detect a duplicate or stale completion.
- `medium` → patch (blind R2-B10): browser accessibility coverage tabs only through Full URL Apply and does not prove keyboard editing or associated structured-field correction guidance.
- `medium` → patch (blind R2-B11): the Search scenario covers only successful Cut, leaving rejected and serialized no-op edits unable to catch the restored-count announcement defect in R2-B1.
- `medium` → defer (blind R2-B12): carried by R2-V3; source-file existence alone cannot prove that each evidence claim passed for the recorded artifact.
- `false` (blind R2-B13): carried prior B13; the two generated `node_modules` metadata files predate the implementation baseline and remain preserved user/environment changes rather than deliverable content.

## Design Notes

The codec operates on raw component text: validate the UTF-16 replacement range, reject boundaries inside existing percent triplets, preserve complete inserted triplets and literal `+`, percent-encode other inserted code points with uppercase UTF-8 hex, then splice the untouched prefix and suffix byte-for-byte.

Structured invalid drafts remain keyed by immutable Piece ID and field. A correction is evaluated against the draft but commits as one replacement against the unchanged trusted token, preserving a single atomic journal entry.

Fallback DOM changes and IME completion derive one minimal replacement from the pre-edit displayed raw value to the browser result so untouched raw Unicode and malformed accepted percent text remain exact. Collapsed deletion expands to a complete Unicode code point or percent triplet. After reducer publication, restore the caret from the unchanged suffix length; a serialized no-op never advances state or History.

## Verification

**Commands:**
- `pnpm test --run` -- all core, reducer, and component tests pass.
- `pnpm run typecheck && pnpm run lint && pnpm run build` -- static checks and production build pass.
- `pnpm exec playwright test tests/workbench.spec.ts` -- focused browser, accessibility, privacy, and capacity scenarios pass.
- `pnpm run evidence:validate` -- distinct Story 2.1 evidence cells and the rebuilt artifact digest validate.
