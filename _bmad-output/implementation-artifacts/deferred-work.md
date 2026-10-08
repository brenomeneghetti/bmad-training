- source_spec: `_bmad-output/specs/spec-bmad-training/SPEC.md`
  summary: Implement Epic 2 — Precisely Transform a URL Without Losing Intent.
  evidence: Split from the canonical product spec because URL transformation is independently shippable after the inspection foundation and carries separate editing and synchronization risks.
- source_spec: `_bmad-output/specs/spec-bmad-training/SPEC.md`
  summary: Implement Epic 3 — Recover and Export a Trusted Result.
  evidence: Split from the canonical product spec because Undo, Copy recovery, feedback, and release gating form an independently shippable goal that depends on the earlier inspection and transformation foundations.
- source_spec: `_bmad-output/implementation-artifacts/spec-epic-1-safely-inspect-find-url-pieces.md`
  summary: Implement non-mutating Search and Clear Search across every Managed Piece field.
  evidence: Split from Epic 1 because Search is an independently shippable enhancement after the lossless inspection model and complete Structured View exist, and the combined draft exceeded the 1,600-token risk threshold.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-epic-1-safely-inspect-find-url-pieces.md`
  summary: Confirm 400% browser-zoom reflow across the supported manual browser and assistive-technology matrix.
  evidence: Automated Chromium covers the normative 320 CSS-pixel layout at 4× device scale, but a real browser zoom/manual matrix is required to settle cross-browser equivalence.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-2-1-edit-path-and-query-text-without-rewriting-untouched-content.md`
  summary: Establish cross-engine native structured-edit verification in the supported browser release matrix.
  evidence: Playwright is configured only for Chromium, so Firefox/WebKit beforeinput, clipboard, selection, and composition ordering remain unverified until the repository provides those installed release targets.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-2-1-edit-path-and-query-text-without-rewriting-untouched-content.md`
  summary: Bind evidence cells to immutable passing run artifacts rather than source-file existence.
  evidence: The inherited evidence validator checks required cell names and accessible source paths, which cannot prove that each mapped claim passed for the recorded build artifact.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-2-1-edit-path-and-query-text-without-rewriting-untouched-content.md`
  summary: Verify 400% browser zoom directly in a portable release evidence strategy.
  evidence: The existing automated scenario combines a 320 CSS-pixel viewport with DPR 4; direct browser zoom behavior remains outside the current portable test infrastructure.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-2-1-edit-path-and-query-text-without-rewriting-untouched-content.md`
  summary: Profile long structured-edit sessions with accumulated exact snapshot history.
  evidence: Snapshot history grows per accepted edit, but a realistic sustained-session memory and latency run is needed to determine whether the proposed user-visible slowdown occurs.
- source_spec: `/media/breno/Novo volume/Projetos/bmad-training/_bmad-output/implementation-artifacts/spec-2-1-edit-path-and-query-text-without-rewriting-untouched-content.md`
  summary: Verify composition cancellation and immediate post-composition input with real IMEs across supported engines.
  evidence: Synthetic Chromium coverage passes, but it cannot settle whether browser-specific ordering can retain composition state and suppress later reducer edits.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-add-a-query-parameter-from-either-list-boundary.md`
  summary: Add an explicit value-presence toggle for newly created Query Parameters.
  evidence: Split from Story 2.4 because distinguishing `key` from `key=` via a dedicated UI control is an independently shippable refinement on top of the core append/focus/history mechanism, and the combined draft exceeded the 1,600-token risk threshold; new rows will use the same implicit equalsPresent-on-edit behavior as existing rows until this lands.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-add-a-query-parameter-from-either-list-boundary.md`
  summary: Remove the client-side duplication of the reducer's new-piece ID prediction used to focus the newly added Query Parameter.
  evidence: "`Workbench.tsx`'s `addQueryPiece` handler and `session.ts`'s `addQueryPiece` reducer case both independently call `createIdAllocator(state.nextPieceId).next()` against the same `state.nextPieceId` to predict the new piece's ID for focus targeting. This only stays correct because React batches the prediction and the dispatch in the same synchronous event-handler tick; a future change to either allocation site could silently break focus-after-add with no compiler or test failure. Fixing this correctly would require the reducer to expose the committed piece ID back to the caller (e.g. via session state rather than a derived prediction), which is a moderate state-shape change out of scope for this story; flagged by two independent review layers (blind-hunter, verification-gap) during Story 2.4 review."
- source_spec: `_bmad-output/implementation-artifacts/spec-2-5-reorder-query-parameters-by-keyboard.md`
  summary: Remove the client-side duplication of the reducer's generated `structuredSuccess` message used to restore focus after a Move Up/Down.
  evidence: "`Workbench.tsx`'s `moveQueryPiece` handler and `session.ts`'s `moveQueryPiece` reducer case both independently build the exact same success-message string to let the caller predict it for the focus-restoration guard (`state.structuredSuccess !== pending.successMessage`). This only stays correct because both sides derive the string from the same `allPieces`/`sourcePosition`/`destinationPosition` values in the same synchronous tick; a future change to either template could silently break focus-after-move with no compiler or test failure. Fixing this correctly would require the reducer to return the generated message/identity to the caller rather than have the caller predict it, a moderate state-shape change out of scope for this story; the same class of duplication was flagged and deferred for Story 2.4's ID-prediction logic."
- source_spec: `_bmad-output/implementation-artifacts/spec-2-7-keep-working-through-an-invalid-full-url-draft.md`
  summary: Bind all mandatory evidence cells to immutable passing execution records for the tested artifact through the trusted release-evidence gate.
  evidence: The inherited validator checks mappings, source paths, CSP and artifact digest but cannot reject cells whose referenced tests failed or did not execute; a shared producer and verified run-result contract are required.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-7-keep-working-through-an-invalid-full-url-draft.md`
  summary: Execute invalid-Draft editing, IME, selection and keyboard focus checks across the latest-two-major supported browser matrix.
  evidence: Playwright config provides Chromium only; Firefox and WebKit executables are unavailable, and the approved story prohibits installing dependencies or tools. Installed-engine execution alone cannot prove the required version matrix.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-7-keep-working-through-an-invalid-full-url-draft.md`
  summary: Complete true 400% browser-zoom and manual assistive-technology validation of independent errors, Last Valid source changes and operation focus.
  evidence: Added automated forced-colors and text-spacing coverage at 320 CSS pixels, but neither axe nor headless viewport emulation establishes real browser-zoom and screen-reader announcement behavior.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-8-close-deferred-verification-gaps.md`
  summary: Story 2.8 owns the cancelled verification follow-up and every finding from its independent review.
  evidence: On 2026-10-07 the user explicitly discarded the uncommitted follow-up, closed original Story 2.7 at commit `39ba84aca82cb9f0021f99e71048de5f269707e0`, and moved the scope to 2.8. The draft preserves all 17 review findings, execution/inventory integrity, runner lifecycle, relocation, cross-engine/IME/caret/capacity investigation and truthful manual-coverage deferrals. Prior generated runs are discarded, not passing deliverable evidence; Story 3.6 consumes the eventual proof foundation for release gating.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-8-close-deferred-verification-gaps.md`
  summary: Epic 4 owns additional-browser validation, including Firefox/WebKit and their prerequisites.
  evidence: On 2026-10-07 the user approved basic Chrome validation for MVP and explicitly moved additional browsers to Epic 4. Earlier attempt `evidence/runs/db5e7c77-8061-45e7-af67-c9b6a7011671/` passed Chromium/Firefox but blocked WebKit on missing host libraries; it is diagnostic history, not proof for any current source. A new Chromium-only manifest must not claim additional-browser coverage.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-8-close-deferred-verification-gaps.md`
  summary: Epic 4 owns additional released-browser OS/mobile validation; observed assistive-technology checklists remain unverified and real 400% browser zoom remains post-MVP.
  evidence: `evidence/README.md` records exact checklist evidence requirements. Installed Chromium/Firefox execution, synthetic clipboard/composition, axe, forced colors, text spacing and 320px checks do not establish latest-two-major Windows/macOS/mobile coverage, real IMEs/native clipboard, screen-reader observations or real-zoom equivalence. These checks remain explicitly unverified.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-8-close-deferred-verification-gaps.md`
  summary: Unverified medium risk: evidence commands have no producer-wide execution deadline.
  evidence: Review identified that a naturally stalled supported command could retain ownership indefinitely, but no such hang was reproduced. The real-child regression proves bounded cancellation and descendant escalation, not a timeout policy. Establish reproducible supported-command stalls and appropriate command budgets before adding configurable deadlines.

- source_spec: none
  summary: Implement Story 3.2 keyboard Undo arbitration and operation-specific focus.
  evidence: On 2026-10-08 the user selected Story 3.1 first; keyboard/focus behavior is separately shippable after exact visible Undo.
- source_spec: none
  summary: Implement Story 3.3 truthful Copy of the latest valid URL.
  evidence: On 2026-10-08 the user selected Story 3.1 first; clipboard export is an independent user-facing goal.
- source_spec: none
  summary: Implement Story 3.4 clipboard failure and race recovery.
  evidence: On 2026-10-08 the user selected Story 3.1 first; clipboard recovery builds on the separately delivered Copy action.
- source_spec: none
  summary: Implement Story 3.5 accessible outcome feedback without focus loss.
  evidence: On 2026-10-08 the user selected Story 3.1 first; shared outcome scheduling is separately shippable from exact Undo restoration.
- source_spec: none
  summary: Implement Story 3.6 trusted release evidence gating.
  evidence: On 2026-10-08 the user selected Story 3.1 first; release gating consumes the editing/recovery implementations and existing execution-proof foundation.
