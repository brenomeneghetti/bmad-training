# Epic 3 Context: Recover and Export a Trusted Result

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Complete the trustworthy editing loop: reverse every committed change to the exact Initial URL, export the correct valid result, recover from clipboard failure, and receive accessible, truthful feedback. Preserve invalid Drafts, immutable identity, privacy, and responsiveness.

## Stories

- Story 3.1: Undo Every Committed URL Change Exactly
- Story 3.2: Keep Keyboard Undo and Focus Predictable
- Story 3.3: Copy the Latest Valid URL Truthfully
- Story 3.4: Recover Safely from Clipboard Failure and Races
- Story 3.5: Receive Every Outcome Without Losing Focus
- Story 3.6: Enforce the Trusted Release Evidence Gate

## Requirements & Constraints

**2026-10-09 planning update:** additional-browser validation is now Epic 5,
renumbered from the historical Epic 4 references below. Epic 4 owns the approved
redesign; final UX contracts govern its layout and presentation changes.
Completed-story acceptance and historical evidence remain unchanged.

- Record one chronological History Entry per accepted URL-changing intent, excluding Search, focus, selection, scrolling, rejected validation, and status changes. Undo restores exact snapshots, creates no entry, reaches Initial URL, and becomes inactive with empty History. No Redo.
- During invalid Full URL Drafts, Undo and Copy use Last Valid while preserving Draft text, selection, and validation. Never describe Draft as synchronized or export it as committed content.
- Keep processing browser-local. No URL, Draft, piece, clipboard, or History content enters logs, telemetry, traces, requests, storage, cookies, or query strings. Reload/close clears the session and recovery. Failures use non-content codes.
- Preserve operability at 20,000 characters and at least 250 Query Parameters; retain the existing 260-entry verification contract. Target 100 ms local response and one-second initial parsing on four-logical-core/8-GB reference hardware. No omitted pieces, freezing, partial publication, or blocked controls.
- Current approved MVP verification is installed Playwright Chromium only. Firefox/WebKit and released-browser latest-two-major Windows/macOS/mobile validation belong to Epic 4. Observed screen readers, real native clipboard/IME, and actual 400% browser zoom remain unverified; real zoom is post-MVP. Synthetic events, axe, forced-colors/text-spacing emulation, and 320px checks do not establish manual, OS, mobile, or additional-browser coverage.
- Broader release requirements remain unproven: latest-two-major Chrome/Firefox/Edge/Safari; NVDA with Windows Chrome/Edge/Firefox, VoiceOver with macOS/iOS Safari, Android Chrome/TalkBack, and Windows/macOS keyboard-only; WCAG 2.2 AA; 5–8 developers achieving ≥90% unassisted whole-journey completion without rounding; zero critical synchronization, Undo/identity/focus, or stale-Copy failures.

## Technical Decisions

- Functional Core / Imperative Shell dependencies point inward. One immutable session reducer owns snapshots, Drafts, History, identities, feedback, and effect intents; UI/adapters cannot independently mutate committed state.
- History retains complete before/after exact serialization, lossless model, immutable non-recycled piece IDs, revisions, and operation metadata. Restore snapshots directly without reparsing or allocating replacement identities.
- Close Full URL editing before another mutation in the same reducer transaction: at most one baseline-to-last-valid entry, then separate structured entries. Correction rebases on latest Last Valid. Undo never restores invalid text or coalesced intermediate keystrokes.
- One keyboard/composition arbiter protects native Undo in editing hosts, their descendants/selections, and IME composition. Product Undo uses primary-modifier lowercase `z` outside native editing without Alt/AltGraph. Actions activate on click/up, not pointer-down.
- Execute monotonic, revisioned effects serially with typed preconditions and exactly one acknowledgement. Claim non-clipboard effects immediately before adapter invocation; stale effects acknowledge without DOM changes. Resolve focus after render, mounting/scrolling the immutable-ID target first.
- `snapshot.serialized` is the only Copy source. Capture attempted serialization, source classification, attempt ID, and revision; cancel superseded intents before Clipboard invocation. Truthful success is nonblocking and does not change focus or History.
- A Clipboard timeout creates recovery immediately but retains the unresolved-write fence. Later attempts replace recovery with their own captured source without overlapping Clipboard writes. Older outcomes cannot control newer recovery or steal focus.
- Shared fixtures align core, component, and browser assertions. Evidence binds complete actual execution identities, commands, versions, source/build/delivery digests, owners/sign-offs, and requirements. Only `pass` satisfies mandatory cells; missing, skipped, waived, stale, tampered, or incomplete proof fails.
- Gates progressively constrain story completion, not implementation entry. Promote identical tested artifacts/headers over HTTPS, with immutable fingerprinted assets, no-cache HTML, and atomic rollback. Preserve CSP, including `connect-src 'none'`.

## UX & Interaction Patterns

- Keep persistent Undo/Copy actions in stable reading/tab order. Use committed light tokens, labeled inactive states, visible non-color cues, system-compatible focus, and no routine modal, animation, or focus-stealing feedback.
- Undo follows operation-specific focus: Add → nearest survivor; Remove → recreated corresponding control; Edit → restored field; Reorder → enabled Move control or first editable control; Full URL edit → textarea. Hidden targets use nearest visible next-then-previous source-order row, otherwise Full URL, with filtered-target explanation; Search remains active.
- Clipboard failure exposes a labeled read-only exact attempted Current/Last Valid URL, focuses/selects it, and offers native device/keyboard Copy guidance. Retain recovery until another Copy attempt or URL mutation. Keep labels/help outside internal value scrolling and all actions available at 320px.
- Separate persistent inline validation/assertive announcement, polite status, actionable alerts, and operation history. Preserve help/error associations; suppress intermediate IME announcements and clear corrected errors atomically.
- Insert settled polite outcomes within 100 ms; expose each ≥2 seconds. Coalesce only same-class Search/synchronization within 300 ms; committed outcomes retain FIFO precedence. Beyond six-second delay, promote current, pending, and incoming committed outcomes exactly once to persistent history with an accurate summary. Repeat announcements require child replacement or tested clear/reinsert. Actionable failures persist until retry, success, or relevant state change.

## Cross-Story Dependencies

- Epics 1–2 supply lossless semantics, stable identities, mutation snapshots, and close-and-rebase behavior. Undo/focus, Copy/recovery, and feedback must share the same reducer authority and effect lifecycle.
- Story 3.6 consumes Story 2.8's execution-proof foundation rather than duplicating it. Chromium MVP completion is distinct from broader release readiness; deferred Epic 4/manual cells cannot be silently counted as passing or waived into release.
