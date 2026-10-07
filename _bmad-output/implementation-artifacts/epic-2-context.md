# Epic 2 Context: Precisely Transform a URL Without Losing Intent

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable developers to edit, add, remove, reorder, or replace URL content through the Full URL or Structured View without changing unrelated bytes, losing duplicate-piece identity, corrupting the Last Valid state, or misrepresenting the chronology of committed intent. Every accepted mutation must publish one coherent URL state across all synchronized surfaces, while invalid local work remains correctable and safely isolated.

## Stories

- Story 2.1: Edit Path and Query Text Without Rewriting Untouched Content
- Story 2.2: Edit Either Internationalized Domain Form Safely
- Story 2.3: Remove One Specific Managed Piece
- Story 2.4: Add a Query Parameter from Either List Boundary
- Story 2.5: Reorder Query Parameters by Keyboard
- Story 2.6: Edit the Full URL as One Continuous Intent
- Story 2.7: Keep Working Through an Invalid Full URL Draft
- Story 2.8: Close Deferred Verification Gaps

## Requirements & Constraints

- Accepted structured edits must update Full URL, Structured View, Current/Last Valid snapshot, History, and Copy source atomically. Rejected edits must leave committed state and prior History exactly intact.
- Preserve exact URL semantics and unaffected serialization, including duplicate and empty query entries, absent versus empty values, encoded delimiters, percent-octet casing, untouched separators, Fragment content, userinfo, port, path boundaries, and source order.
- Domain, Path Segment, Query Parameter key, and Query Parameter value edits remain local drafts until valid. Validation must be persistent, field-specific, programmatically associated, IME-safe, and must not move focus or duplicate feedback across channels.
- Removing a piece targets one immutable identity only. Domain removal is unavailable. Add appends one Query Parameter after existing entries, supports empty keys and absent or empty values, and creates one committed mutation. Reorder changes only complete Query Parameter source order and requires keyboard-operable Move Up/Move Down controls; impossible moves create no mutation or success feedback.
- A Full URL focus session synchronizes every valid state immediately but records at most one baseline-to-last-valid mutation when closed by blur, Enter, or another product mutation. Invalid Draft text remains visible and is never committed.
- While Full URL is invalid, Structured View mutation controls remain enabled and operate against the latest Last Valid snapshot, preserving the Draft exactly. Before the first such mutation, close the Full URL session and append its baseline-to-last-valid change if needed; then record the structured mutation separately. Correcting the Draft must rebase from the latest Last Valid snapshot so History remains chronological and independently reversible.
- All actions must remain keyboard operable without drag dependency. Ordinary editing retains focus; add, remove, reorder, and DOM-moving outcomes follow deterministic focus rules keyed by immutable identity.
- The supported capacity is URLs up to 20,000 characters and at least 250 Query Parameters. Editing and reordering target 100 ms local response without freezing, omitted pieces, or blocking layout overflow.
- URL content, Drafts, Managed Piece values, and History snapshots must remain browser-local and must never enter network requests, storage, analytics, production logs, crash reports, or traces.
- The complete editing path and failure states must meet WCAG 2.2 AA, latest-two-major browser coverage, 320px/400% zoom reflow, forced-colors, text-spacing, keyboard, focus, pointer-cancellation, and IME checks.

## Technical Decisions

- Use a Functional Core / Imperative Shell. One immutable session reducer exclusively owns Draft URL, Current/Last Valid snapshot, lossless model, local drafts, immutable IDs, History, parse generation/epoch state, feedback queues, and effect intents. UI components and adapters cannot mutate committed URL state.
- Use a custom lossless scanner and serializer; WHATWG URL is only the HTTP/HTTPS acceptance and host-semantics oracle. Do not use `URLSearchParams` or generic delimiter splitting for round trips.
- Non-domain fields edit raw component text. Commands carry Piece ID, field kind, prior token revision, UTF-16 selection range, and inserted text. Reject stale revisions, invalid ranges, split percent triplets, and bare or partial percent sequences rather than rebasing.
- Preserve complete percent triplets and literal `+`; encode only inserted text using the field-specific path/query profile. New Unicode is UTF-8 percent-encoded with uppercase hex, while untouched text remains byte-identical.
- Convert both editable Domain forms with `tr46` 6.0.0 using the adopted strict bidi/joiner and non-transitional options, then validate ASCII through WHATWG host rules. Untouched hosts retain their source lexeme; an edited host serializes as lowercase ASCII/Punycode.
- Every committed mutation stores complete before/after snapshots with exact serialization, lossless model, and non-recycled Piece IDs. Full URL reparsing preserves Domain identity and reconciles path and query sequences independently using exact-token longest common subsequence with deterministic earliest-position tie-breaking.
- Close-and-rebase is an explicit reducer transaction: close any active Full URL edit first, append its baseline transition only if changed, then apply the next product mutation against Last Valid as a separate chronological entry.
- Parsing starts synchronously in the pure core. Scheduled completions publish only when input snapshot, generation, session epoch, and committed revision still match; stale work must acknowledge without changing state. Add a worker only if profiling exceeds the architecture threshold.
- Render all Managed Pieces in one semantic DOM list for V1; virtualization is prohibited. Product actions dispatch only on click/up, and one global input arbiter owns IME handling and native-versus-product Undo behavior.

## UX & Interaction Patterns

- Keep one Workbench in the reading/tab sequence Full URL → stable Actions → skip links/Search → visible ordered rows → after-list Add. Both Add controls use the same behavior; active Search clears before adding, then the new key receives focus.
- Use a persistently labeled wrapping Full URL textarea with commit help. Enter applies/closes without inserting a newline; Enter and Shift+Enter do not close or mutate during composition.
- Show visibly labeled, independently bidi-isolated Unicode Domain and ASCII/Punycode Domain fields. The focused form owns its draft; successful conversion updates both forms atomically.
- Remove focus searches next then previous for the nearest visible row exposing the same subcontrol, then Clear Search, after-list Add, or the Structured View heading. Reorder keeps focus on the activated control unless it becomes disabled, then uses the enabled opposite control or the row’s editable fallback.
- Use literal visible labels, non-color-only state, monospace URL fields, static change cues, no routine modals or animated movement, and no page-level horizontal scrolling; only essential URL value fields may scroll internally.

## Cross-Story Dependencies

- Stories 2.1–2.5 depend on the lossless URL model, immutable identity, synchronized session authority, and semantic list established by Epic 1.
- Stories 2.3–2.5 depend on the exact snapshot/history and focus-intent contracts needed for later Undo behavior.
- Stories 2.6 and 2.7 share the Full URL session lifecycle, stale-parse protection, and close-and-rebase transition; Story 2.7 extends structured mutations from Stories 2.1–2.5 to operate safely while a Draft is invalid.
- Completion requires the shared parser/serializer, IDN, accessibility, privacy, capacity, and browser evidence mapped to each delivered story; later Epic 3 recovery and export behavior relies on the exact snapshots and chronological mutation entries produced here.
- On 2026-10-07 the user closed the committed original Story 2.7 and discarded its uncommitted verification follow-up. Story 2.8 owns execution-proof binding, complete approved regression inventory, runner lifecycle and reproduced editing fixes. The user subsequently approved basic Chrome validation for MVP: installed Playwright Chromium is the current target; additional-browser and released-browser OS/mobile validation moves to Epic 4. Observed screen-reader coverage remains deferred and real 400% zoom is post-MVP. No discarded follow-up run counts as delivered evidence. Story 3.6 consumes the Chromium foundation for release gating.
