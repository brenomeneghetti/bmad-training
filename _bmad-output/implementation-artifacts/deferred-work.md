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
