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
