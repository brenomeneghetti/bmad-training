---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
baselineStepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
planningUpdate: approved-workbench-redesign
updated: 2026-10-09
redesignEpic: 4
broaderBrowserEpic: 5
broaderBrowserPlanning: deferred
requirementsConfirmed: 2026-10-09
epicStructureApproved: 2026-10-09
redesignStoryBreakdownApproved: 2026-10-09
redesignValidation: passed
redesignValidationScope: Epic 4 planning only
redesignPlanningStatus: complete
redesignStoriesApproved:
  - '4.1'
  - '4.2'
  - '4.3'
  - '4.4'
  - '4.5'
  - '4.6'
  - '4.7'
redesignPlanCommit: 305b004256e7cd7cf604588a29cbf4e6f3dfa94a
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-training-2026-09-24/prd.md
  - _bmad-output/planning-artifacts/prds/prd-bmad-training-2026-09-24/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/reconcile-redesign.md
  - _bmad-output/implementation-artifacts/deferred-work.md
  - evidence/README.md
  - AGENTS.md
---

# bmad-training - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-training, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

**2026-10-09 planning update:** preserve the original Epics 1–3 and their
acceptance history. The user assigned the approved workbench redesign to Epic 4
and moved the unchanged deferred broader-browser scope to Epic 5. The redesign
requirements, five-epic structure and seven-story Epic 4 breakdown are approved;
Epic 4 planning validation passed and the user confirmed workflow completion.
Epic 5's detailed planning remains deferred, and no implementation or release
evidence is established by this update. `baselineStepsCompleted` records the original completed
planning run; `stepsCompleted` tracks this update.

## Requirements Inventory

### Functional Requirements

FR1: The developer can paste or type a complete HTTP or HTTPS Absolute URL with a non-empty host to begin an editing session; unsupported, relative, domain-only, or unsafe input is rejected without creating or replacing a session.

FR2: The product can represent an accepted Absolute URL as synchronized Full URL and ordered Structured View surfaces containing every Domain, Path Segment, and Query Parameter while retaining Scheme and Fragment in Full URL.

FR3: The product can parse, display, edit, and reconstruct supported URLs without semantic drift, preserving duplicate and empty Query entries, absent versus empty values, encoded delimiters, untouched separators, Fragment content, and synchronized editable Unicode and ASCII/Punycode Domain forms.

FR4: The developer can search Domain, Path Segments, Query Parameter keys, and Query Parameter values case-insensitively without mutating the URL or History, and can clear Search to restore source order.

FR5: The developer can identify every Managed Piece by persistent type, source position, and duplicate occurrence while filtered-result position remains separately identifiable.

FR6: The developer can edit the Domain, any Path Segment, and either part of a Query Parameter; accepted edits atomically update Current URL and Full URL while invalid field drafts remain correctable without corrupting Last Valid URL.

FR7: The developer can remove a Path Segment or one specific Query Parameter, including one duplicate, with valid delimiter reconstruction and deterministic focus movement; Domain removal is unavailable.

FR8: The developer can add a Query Parameter with a key and optional value after existing Query Parameters, preserving absent versus empty values, creating one History Entry, and moving focus to the new key.

FR9: The developer can reorder Query Parameters without changing their values or identities, with keyboard-operable Move Up and Move Down controls and one History Entry per completed reorder.

FR10: The developer can edit or replace Full URL during a session; every valid state synchronizes immediately, while one uninterrupted focus-and-edit session closes on blur, Enter, or a subsequent product mutation and creates at most one Committed Mutation.

FR11: The product can preserve an invalid or incomplete Draft URL separately from Last Valid URL so Structured View, Copy, Undo, and structured mutations continue against Last Valid while the Draft remains visible and explicitly unsynchronized.

FR12: The product can maintain one atomically synchronized committed Current URL across Full URL, Structured View, History, and Copy source, including close-and-rebase behavior when correcting an invalid Draft after structured mutations.

FR13: The product can record exactly one chronological, exact-snapshot History Entry for each Committed Mutation while excluding Search, focus, selection, scrolling, and rejected validation attempts.

FR14: The developer can Undo Committed Mutations stepwise through a visible control or platform product-Undo shortcut, restoring exact serialized snapshots, stable item identities, both views, and deterministic focus until Initial URL is reached, without intercepting native text-field Undo.

FR15: The developer can copy the exact Current URL, or Last Valid URL while Draft is invalid, from a persistent action and receive truthful, nonblocking success or actionable failure feedback with safe-copy recovery.

FR16: The product can visibly and programmatically confirm accepted changes and operation outcomes through the correct validation, polite-status, or actionable-failure channel without stealing focus except for explicit safe-copy recovery.

### NonFunctional Requirements

NFR1: URL content must be parsed, edited, searched, stored in History, and prepared for Copy entirely within the browser.

NFR2: The product must not transmit or persist URL content, Draft text, clipboard content, Managed Piece values, or History snapshots through analytics, logging, crash reports, traces, storage, cookies, query strings, or server requests.

NFR3: Closing or reloading the page must clear the complete editing session, including Draft, Current/Last Valid URL, History, Search, and safe-copy recovery.

NFR4: A Committed Mutation must update Full URL, Structured View, History, and Copy source atomically from the user's perspective.

NFR5: Invalid edits must preserve Last Valid URL and its History so every prior committed state remains exactly restorable.

NFR6: Complete Undo must restore Initial URL exactly rather than as a canonical equivalent; History Entries must retain exact Full URL snapshots.

NFR7: The product must not omit, merge, duplicate, or reorder Managed Pieces except in direct response to an accepted user action.

NFR8: The product must remain operable for an Absolute URL up to 20,000 characters and at least 250 Query Parameters.

NFR9: At the supported limit, parsing, Search, editing, reordering, Undo, and Copy must complete without browser freezing, omitted pieces, or layout overflow that blocks operation.

NFR10: On hardware with at least four logical CPU cores and 8 GB RAM, initial parsing must meet a 1-second target and local interactive feedback must meet a 100 ms target.

NFR11: V1 must support the latest two major versions of Chrome, Firefox, Edge, and Safari at release, with concrete tested versions recorded.

NFR12: Every V1 action and recovery path must be keyboard operable without requiring a pointer drag gesture.

NFR13: Editing must retain focus on the active control unless an add, remove, reorder, restore, or Undo operation requires its defined deterministic focus outcome.

NFR14: Piece type, validation, change confirmation, and disabled-action meaning must never rely on color alone, including in forced-colors mode.

NFR15: Controls must expose accessible names, validation messages must be programmatically associated with inputs, and nonblocking status must be announced without moving focus.

NFR16: UJ-1 and all failure states must meet WCAG 2.2 AA through automated and manual keyboard, focus, zoom, contrast, text-spacing, pointer-cancellation, and status-announcement verification.

NFR17: All required V1 data and actions must remain available without page-level horizontal scrolling at 768 CSS pixels or greater and must reflow at 320 CSS pixels and 400% zoom; only essential URL value fields may scroll internally.

### Additional Requirements

- Epic 1 Story 1 must initialize the application with create-vite 9.2.1 using React 19.3.0 and TypeScript 6.0.2, Node.js 24 LTS, pnpm 12.5.1, Vite 8.3.1, and `@vitejs/plugin-react` 6.1.1; configure the architecture's structural seed and quality toolchain rather than selecting an alternative starter.
- Use a Functional Core / Imperative Shell architecture with inward dependencies: pure `core` URL, IDN, session, and contract modules; React `app` orchestration and components; and `platform` clipboard, effect, and focus adapters.
- One immutable session reducer must exclusively own Draft URL, Current/Last Valid snapshot, lossless model, History, local field drafts, parser generation/epoch state, feedback queues, and effect intents; UI components and adapters may not independently mutate committed URL state.
- Implement a custom lossless URL scanner and serializer using WHATWG URL only as the HTTP/HTTPS acceptance and host-semantics oracle; do not use `URLSearchParams` or generic delimiter splitting as the round-trip model.
- Model exact authority, ordered path segments, query presence and entries, Fragment presence, untouched separators, percent-octet casing, userinfo, and port so a mutation changes only its target token and required delimiters.
- Use one component-text codec for every non-domain Managed Piece. Preserve complete percent triplets and their case, reject partial percent sequences and stale/split edit ranges, encode only inserted text using the architecture's field-specific profiles, and leave untouched text byte-identical.
- Implement bidirectional IDN conversion with `tr46` 6.0.0 and the exact adopted options, validate resulting ASCII hosts with WHATWG HTTP/HTTPS rules, retain untouched source lexemes, and serialize edited hosts as lowercase ASCII/Punycode.
- Store complete before/after committed snapshots with exact serialization, lossless model, and immutable non-recycled piece IDs. Reconcile IDs after Full URL reparsing with the specified exact-token longest common subsequence and deterministic tie-breaking.
- Implement Full URL close-and-rebase as an explicit reducer transition so a baseline-to-last-valid edit closes before another mutation, structured mutations append chronologically against Last Valid, and later correction starts from the latest Last Valid snapshot.
- Render every Managed Piece in one semantic DOM list for V1; virtualization is prohibited unless the architecture decision is reopened after failed capacity evidence and a complete accessible-equivalence prototype passes.
- Parse and serialize synchronously in the pure core first. Scheduled parsing must carry input snapshot, generation, session epoch, and committed revision, and stale completion must never publish; add a Web Worker only if reference profiling exceeds 50 ms p95.
- Enforce a no-external-sink privacy boundary: stable non-content problem codes, no URL-bearing production logs or telemetry, no Web Storage/IndexedDB/cookies, no service worker, and production CSP including `connect-src 'none'` and the architecture's complete policy floor.
- Build one environment-invariant static client artifact with Vite `base: './'`, HTTPS delivery, immutable fingerprinted assets, `index.html` no-cache, preview-to-production artifact promotion, and atomic artifact/header rollback.
- Implement one global keyboard/composition arbiter that preserves native Undo in editing hosts and during IME composition, invokes product Undo only in eligible contexts, prevents Enter from closing Full URL during composition, and dispatches product actions only from click/up activation.
- Execute revisioned effect intents serially with exactly one acknowledgement each, typed preconditions, stale-effect cancellation, bounded adapter outcomes, render-ready focus, and Copy attempt fencing that prevents an older result from replacing newer safe-copy recovery.
- Implement reducer-owned, separate inline-validation, polite FIFO/coalescing, actionable-alert, and persistent operation-history channels with the UX timing, precedence, repetition, and overflow rules.
- Create one versioned shared fixture corpus for core goldens, component interactions, and browser acceptance, covering exact URL semantics, malformed percent text, IDN/RTL, close-and-rebase History, immutable identity, privacy, Copy recovery, 20,000 characters, and 250+ entries.
- Treat AG-1 parser/serializer, AG-2 IDN, and AG-3 full-DOM accessibility evidence as progressive story-completion gates and final release gates. Implementation may begin to produce mapped evidence; each story completes only when its mandatory mapped cells pass. Evidence mapped to later capabilities does not block earlier stories. A machine-validated evidence manifest must map every mandatory FR, NFR, UX case, fixture, story, owner, result, tested version, artifact digest, and sign-off; mandatory cells pass only as `pass`.
- Release must additionally pass exact semantic/History goldens, performance targets, latest-two-major browser coverage, the named browser/AT matrix, keyboard/IME/focus/reflow/forced-colors/text-spacing/network-storage/clipboard checks, and 5–8 representative developers with at least 90% unassisted completion and zero critical synchronization, Undo, or stale-Copy failures.

### UX Design Requirements

UX-DR1–UX-DR28 preserve the original Epics 1–3 baseline and historical evidence
identities. They are not instructions to restore old light styling, the Actions
landmark, duplicate Add buttons or permanent Move controls. For Epic 4, use the
current redesign requirements below and the finalized UX spines. Any changed
release mapping must be reviewed and versioned deliberately, not inferred from
this document or automatically refreshed by the evidence runner.

UX-DR1: Implement the committed light visual token system from `DESIGN.md`, including neutral surfaces, blue primary actions, semantic error/success/change colors, border contrast, spacing, radii, content width, and component tokens; do not add dark mode, gradients, decorative color coding, or a separate icon language.

UX-DR2: Use the specified system font stack and role-based typography, with monospace typography for Full URL, Domain forms, and URL-value fields; isolate URL and Domain text bidirectionally without altering stored characters and never visually truncate editable or verification values.

UX-DR3: Build one URL Workbench `<main>` with exactly three uniquely headed sections in reading order—Full URL, Actions, Structured View—using stable landmark and heading IDs; status containers must not become landmarks.

UX-DR4: Preserve the tab order Full URL → Undo/Copy/pre-list Add → skip links/Search → visible ordered rows → after-list Add, while keeping Full URL, Search, Copy, Undo, Add, result count, and skip links reachable in high-density sessions.

UX-DR5: Implement responsive layouts for ≥1024px, 768–1023px, and 320–767px, including 320 CSS px/400% zoom reflow, text-spacing overrides, wrapped controls, and no page-level horizontal scrolling; essential URL fields alone may scroll internally.

UX-DR6: Ensure every pointer target is at least 24×24 CSS pixels or satisfies the spacing exception, with at least 44×44 targets for primary and destructive controls, including Copy, Add, and Remove, and equivalent hit areas for Clear Search and Move controls.

UX-DR7: Implement the two-layer 2px focus indicator for blue controls, visible offset focus for neutral controls, and native/system-color outlines in forced-colors mode; do not rely on box-shadow-only focus.

UX-DR8: Implement `full-url-editor` as a persistently labeled wrapping multiline textarea with persistent commit help, minimum 96px height, inline validation, Enter-to-apply/close behavior, no inserted line break, preserved invalid pasted CR/LF, and IME-safe Enter/Shift+Enter handling.

UX-DR9: Implement `action-bar` with stable Undo, Copy, and pre-list Add positions plus separate operation feedback regions; wrapping at narrow widths must not change their reading or tab sequence.

UX-DR10: Implement `search-field` with persistent label, case-insensitive filtering across every Managed Piece field, visible “N of M” summary, bounded/coalesced announcement, Clear Search that restores source order and returns focus to Search, and a specific no-results state.

UX-DR11: Implement skip links for “Skip to Structured View results” and “Skip to Add Query Parameter,” plus behaviorally equivalent Add actions before and after the list; either Add route clears active Search with announcement, appends the row, mounts it, and focuses its key.

UX-DR12: Implement the complete ordered `managed-piece-list` as Domain, Path Segments, then Query Parameters, with native list semantics and no infinite-scroll omission or suggestion that off-screen rows are absent.

UX-DR13: Implement each `managed-piece-row` with persistent type, stable source ordinal/total, duplicate occurrence context, separate filtered-result position, editable controls, and labeled actions; filtering must never rename source identity.

UX-DR14: Provide visibly labeled, independently editable, bidi-isolated “Unicode Domain” and “ASCII/Punycode Domain” fields with shared help and visible conversion status. The focused form owns its draft; success atomically updates both forms and invalid text remains local.

UX-DR15: Distinguish Domain, Path Segment, Query Parameter, validation state, change confirmation, and disabled actions through visible text and programmatic semantics rather than color or shape alone.

UX-DR16: Implement No session, delayed Parsing, Active valid, Invalid Initial URL, Invalid Draft URL, Invalid Managed Piece, Clipboard failure, Reload/close, and Reduced motion states exactly as specified, including stale-parse rejection and no partial row publication.

UX-DR17: Keep invalid Full URL Draft text exact while Structured View, Copy, Undo, and structured mutations operate against Last Valid URL; close the Full URL session before the first product mutation and preserve chronological close-and-rebase History.

UX-DR18: Implement persistent field-specific validation with stable non-recycled error IDs, `aria-invalid`, `aria-errormessage` or appended `aria-describedby`, dedicated assertive announcement only at the specified commit/settle points, IME suppression, repeat re-announcement, and atomic correction clearing.

UX-DR19: Implement a dedicated polite `role="status"` queue that inserts settled outcomes within 100 ms, exposes each for at least two seconds, coalesces only eligible result/synchronization classes within 300 ms, preserves committed outcomes FIFO, and promotes overflow beyond six seconds to persistent visible operation history.

UX-DR20: Implement a dedicated persistent actionable `role="alert"` for Copy and other operation failures requiring action; it must not overwrite validation or polite status and clears only on retry, success, or relevant state change.

UX-DR21: On Clipboard API failure or timeout, reveal `safe-copy-readonly` containing the exact attempted Current or Last Valid URL, focus and select it, preserve Draft and History, provide platform-neutral native Copy guidance, and retain it until the next Copy attempt or URL mutation.

UX-DR22: Implement Remove focus recovery by immutable ID and activated subcontrol: prefer the next then previous visible row exposing the same subcontrol, then Clear Search, after-list Add, or Structured View heading as specified; mount/scroll before focus and announce removed type and source position.

UX-DR23: Implement Move Up/Move Down reorder controls with no drag dependency, stable identity, boundary disabling, no false History/success at impossible boundaries, post-move focus on the activated or opposite enabled control, and announcements of old/new position, total, and boundary outcome.

UX-DR24: Implement the complete Undo focus transition table for Add, Remove, Edit, Reorder, and Full URL edits, including filtered-target fallbacks, immutable-ID restoration, exact prior serialization, native-editing Undo protection, and “Draft URL is unchanged” status during invalid Draft.

UX-DR25: Implement one input policy for primary-modifier product Undo, native editing-host Undo, Alt/AltGraph exclusion, composition protection, pointer cancellation, and Escape; routine mutations must occur only on click/up and Escape must never discard Draft or committed state.

UX-DR26: Use concise, literal microcopy that identifies the affected source and preserved state, including the specified invalid Draft, unsupported input, Copy success/failure, invalid-draft Undo, reorder, and no-results patterns; avoid vague “Invalid,” “Done,” or “Copied!” messages.

UX-DR27: Use static, non-modal change cues and reduced-motion behavior with no flashing, animated scrolling, moving highlight, hover-only actions, routine modals, or feedback that steals focus.

UX-DR28: Validate keyboard-only use, 200%/400% zoom, 320px reflow, forced colors, WCAG text spacing, pointer cancellation, live-region repetition/ordering, IME composition, parse races, safe-copy touch/AT recovery, focus after DOM movement, and all failure paths across the named desktop and mobile browser/AT matrix.

### Current Redesign Requirements — Epic 4 Input

**Authority:** finalized `DESIGN.md` and `EXPERIENCE.md` at redesign plan commit
`305b004256e7cd7cf604588a29cbf4e6f3dfa94a`, with the PRD's FR1–FR16 and
NFR1–NFR17 retained. These requirements describe work to build and preserve;
they do not assert that the redesign or its evidence has been implemented.
Completed stories below describe the original baseline, not the new acceptance.

#### Additional Architecture Requirements

RD-AR1: Before implementation handoff, reconcile architecture AD-6 ordinary
blur closure, AD-7 grouped full-DOM lists, AD-12 completed pointer activation,
AD-13 presentation-aware focus/feedback intents and the structural Workbench
seed with the final UX contract. Remove contradictory old placement/gesture
instructions without reopening lossless parsing, IDN or History decisions.
Cancellation microcopy must say no reorder was saved rather than imply a
preceding legitimate Full URL blur-close entry disappeared.

RD-AR2: Keep the existing React/TypeScript/Vite application, native HTML and
CSS Modules; implement committed tokens without a new component library,
external fonts, theme switcher, production dependency or application network
facility. The original create-vite requirement is already baseline work, not
a redesign task to repeat.

RD-AR3: Keep committed URL mutations in the immutable core reducer. Define
disclosure, pinned selection and drag transaction ownership separately from
URL snapshots/History; capture immutable query ID and source revision after
ordinary focus processing, validate the drop and commit one reorder intent.
Do not reconstruct Copy from UI fields or use visible/filtered indexes as IDs.

RD-AR4: Preserve exact session/Copy/Undo effects, local invalid field drafts,
composition/native-editing guards, stale parse/effect cancellation and browser
privacy. Focus adapters must expand and render an allowed destination before
focus, retain Search for Undo fallbacks and invalidate drag previews on source,
Search or lifecycle changes.

RD-AR5: Deliberately map new/changed exact core, component and Chromium test
identities into reviewed inventory and story coverage. Existing manifests,
source references, counts and static mocks are not proof. Epic 4 must produce
fresh execution-bound Chromium MVP evidence for delivered changes without
waiving any broader release cell.

RD-AR6: Epic 5 retains Firefox/WebKit/prerequisites and latest-two-major
released-browser Windows/macOS/mobile scope formerly called Epic 4. Manual
screen-reader/native clipboard/IME/real 400% zoom observations remain unverified
until supplied through the existing release contract; renumbering neither
changes historical runs nor satisfies or waives release gates.

#### UX Design Requirements

RD-UX1: Implement the exact 14-color dark navy palette, eight typography roles,
10px/16px radii, spacing and all 22 component token groups from DESIGN.
Use blue/violet/teal accents only for body/Paths/query identity, not validity;
retain system sans/monospace, tonal layers and clear boundaries without grid,
marketing gradients, shadows, new icons or reference-product features.

RD-UX2: Implement the two-section Workbench (Full URL, Structured View) with
one main, unique stable headings/landmarks and source-ordered body/Paths/query
groups. Retire the separate Actions landmark without hiding required actions.

RD-UX3: Keep `full-url-editor` a persistently labeled wrapping textarea at its
100px token minimum; Copy is alongside it above 700 CSS px and may wrap below
at 320–700px. Undo remains below in the same panel. Full URL, Copy and commit
help stay visible regardless of group expansion.

RD-UX4: Implement `detail-group` and `disclosure-control` for three independent
initially expanded groups. Native disclosure or heading/button semantics expose
state/controlled identity, support keyboard/tap/click, hide descendants from
tab/browse interaction and relocate descendant focus before programmatic
collapse. No accordion exclusivity, persistence or URL/History mutation.

RD-UX5: Implement `passive-url-context` for supported scheme, present port/
userinfo and Fragment alongside the existing editable Unicode/ASCII Domain
forms. Preserve raw values and bidi isolation; unmanaged context is read-only,
not a new editor, Search target or History capability.

RD-UX6: Render `managed-piece-list` groups with every source piece represented
once when expanded; no virtualization or infinite-scroll omission. Markerless
native ordered lists retain explicit list role and list-item semantics.
Counts and source order must remain correct with 250+ entries.

RD-UX7: Update `managed-piece-row` and `piece-type-label` with persistent type,
source ordinal/total, duplicate occurrence/total, field/action name and separate
per-group filtered position. Only the opaque ID is immutable; key/membership/
structural changes refresh labels without reallocating IDs or swapping focus.

RD-UX8: Show associated query-state text distinguishing `flag`, `flag=`, empty
entry and `=`. Preserve parser Add defaults (empty key, absent equals, empty
value), no-op absence, present-equals retention after clearing and exact
Copy/Undo shape. Do not add the separately deferred presence-toggle feature.

RD-UX9: Preserve `search-field` and `no-results-state`: case-insensitive Managed
Piece search, N-of-M summary and Clear Search focus/feedback, no source mutation.
Collapsed headers show matching counts; Search does not change disclosure state
and the query Add/navigation destinations remain available with zero matches.

RD-UX10: Implement the sole `add-query-parameter-control` below query rows,
including empty/no-match lists. Accepted Add clears Search with feedback,
expands query, appends after the full source list, mounts/focuses the new key and
records one Add entry against Current/Last Valid; invalid Draft stays exact.
No valid session means inactive Add with guidance, not a fabricated snapshot.

RD-UX11: Replace pre-list Add with `add-query-jump-link`, which expands/focuses
the sole bottom Add but does not add or clear Search. Keep the top results skip
link; navigation itself adds no History, though ordinary blur may close an
already accepted Full URL edit.

RD-UX12: Add bottom and focus-revealed row return links to Full URL/Copy and
Search, using explicit stable mounted focus destinations and unobscured scroll.
Users near the end of 250+ queries must reach utilities without traversing all
remaining rows; preserve Search, pinned selection, invalid text and native keys.

RD-UX13: Implement `query-drag-handle` as a visible named 44px-target button on
queries only. Tap/click/Enter/Space toggles pinned selection with `aria-pressed`;
effective `aria-expanded` and `aria-controls` expose Move visibility. Another
selection transfers the pinned row; focus or selection retains its controls.

RD-UX14: Implement `query-move-controls` only on focused/selected query rows,
not permanently or hover-only. Keep keyboard/screen-reader/touch Up/Down,
full-source filtered/boundary behavior, enabled/opposite/field focus fallbacks,
no false success/History at boundaries and no interception of text arrows.

RD-UX15: Implement primary handle-only query drag with source/destination
positions and `drop-indicator`. A changed valid drop preserves duplicate
values/IDs, commits one reorder entry and restores moved-handle focus/selection.
No Path drag/reorder or direct DOM-only URL mutation.

RD-UX16: Disable drag whenever Search is nonempty, even if every row matches;
show explicit Clear Search guidance without silently clearing it. The handle's
selection/reveal and Up/Down alternative remain usable against full source order.

RD-UX17: Pending drag does not mutate; same-position/invalid/outside drop,
Escape, pointer cancellation/lost capture, missing target, changed revision or
activated Search cancel with no reorder entry. Preserve any preceding ordinary
Full URL blur-close entry and exact invalid Draft; a later valid drop owns its
own single entry.

RD-UX18: Distinguish handle tap from recognized drag, suppress the post-drag
synthetic click and retain touch scroll/text selection outside the handle.
Constrain gesture capture/touch-action to the handle. Choose and test technical
threshold/edge-scroll mechanics without requiring hover or long-press discovery.

RD-UX19: Implement transient drag-destination feedback: latest changed logical
destination coalesced at 300ms, bound to transaction/revision, discarded before
drop/cancel final feedback. Keep static readable destination text; no preview
entries in persistent outcome history or speech from cancelled transactions.

RD-UX20: Keep `remove-control` labeled on path/query only; preserve exact
delimiter/duplicate removal and next/previous matching-subcontrol focus,
Clear Search/Add/heading fallbacks with reveal-before-focus as needed.

RD-UX21: Keep `undo-control`, native/product shortcut arbitration and the full
operation-specific Undo table. Expand a collapsed unfiltered target before
focus; preserve Search and existing filtered fallback. Restore exact snapshots,
IDs and Draft text without selection/disclosure/navigation entries.

RD-UX22: Keep `copy-control` exact-source and truthful, with `safe-copy-readonly`
outside disclosures containing the captured Current/Last Valid value, visible
selection, native copy guidance and stable focus. Preserve attempt fencing,
timeout/recovery lifetime and newer-attempt ownership.

RD-UX23: Implement `committed-state-banner` outside disclosures identifying
Current/Last Valid and unchanged invalid Draft. Keep Full URL validation,
structured error summary, safe-copy recovery and all feedback outside groups.
No collapse hides the explanation or treats invalid Draft as synchronized.

RD-UX24: Implement `validation-message` with stable IDs and persistent field
associations. Error-summary activation clears Search only when it hides the
target and the action explicitly says so; then expand/render/focus that same
field with rejected text/error intact. Preserve help, validation channels,
repeat/IME guards and ordinary focus processing.

RD-UX25: Preserve `status-message`'s separate validation, polite and actionable
failure channels and existing timing/overflow rules. Render promoted outcomes
once in a labeled chronological ordinary "Operation feedback" list outside
disclosures, with wrapping text, no extra live role/focus movement, session
retention and reload/close reset; distinguish it from Undo History.

RD-UX26: Preserve raw URL/IDN bidi isolation and no truncation. Verify main
reading contrast 7:1, normal text 4.5:1 and functional boundaries/focus 3:1 on
actual surfaces, including selected/disabled/error states. Use the 3px offset
focus outline and native/system colors; selection/drop/type never use color
alone or box-shadow-only focus.

RD-UX27: Implement responsive stacking at 320–700px, adequate-width inline
fields/actions above 700px, 320px reflow and the stated 400% zoom contract.
Apply 24px minimum/spacing exception and 44px control targets, 52px disclosure
headings, and normative WCAG text-spacing overrides without lost function,
clipping or page overflow. Only essential value fields may scroll internally.

RD-UX28: Cover No session, Parsing/stale publication, valid/invalid Initial/
Draft/field, independent collapse, focus/pinned selection, drag/cancel,
empty/no-match, clipboard denial/recovery, reload, reduced motion and forced
colors. Preserve local-only already-loaded offline behavior; no service-worker
or cold-load offline scope. Static/reduced-motion cues retain every action.

RD-UX29: Use concise source-aware microcopy and stable DOM/tab order; no
routine mutation modals, hover-only actions or vague success. Escape prioritizes
drag cancellation, then may clear pinned selection outside editing; it never
discards Draft, collapses a permanent group or cancels a prior accepted edit.

RD-UX30: Verify the complete named Devon journey and edge cases on fresh mapped
Chromium evidence: `A→B` plus invalid `X` followed by jump/cancel/Add/drop;
Search-hidden errors in collapsed groups; duplicate-key label refresh; query
shape preservation; rapid drag preview/drop/cancel; 250+ row return navigation;
overflow feedback; existing exact Copy/Undo/privacy/performance/IME guarantees.

RD-UX31: Treat the approved `mockups/dark-workbench.html` as the visual anchor,
not code/behavior proof. Do not ship its annotation/mobile-example rail,
historical pending notes, static grips or undersized handle. Final spines win;
recovery/drag/density states remain spine-only by user choice.

#### Scope and Confirmation Status

All FR1–FR16 and NFR1–NFR17 remain in force. Epic 4 delivers the redesign while
preserving the previously built editing/recovery features; it does not rebuild
Epics 1–3, add Path reorder, a light/theme toggle, equals-presence controls,
accounts/persistence/networking or claim deferred browser/manual coverage.
Epic 5 retains the former browser-verification assignment. Requirements and
epic structure were explicitly approved on 2026-10-09; the current story-writing
scope is Epic 4 only. Epic 5's detailed stories remain deferred.

### FR Coverage Map

FR1: Epic 1 - Accept a supported Absolute URL without replacing a session on rejection.

FR2: Epic 1 - Expose the complete ordered URL structure through synchronized Full URL and Structured View surfaces.

FR3: Epic 1 - Preserve lossless URL semantics and provide synchronized Unicode and ASCII/Punycode Domain representations.

FR4: Epic 1 - Search every Managed Piece field without mutating URL state or History.

FR5: Epic 1 - Identify piece type, stable source position, duplicate occurrence, and filtered-result position.

FR6: Epic 2 - Edit Domain, Path Segment, Query Parameter key, and Query Parameter value safely.

FR7: Epic 2 - Remove one specific Path Segment or Query Parameter with valid reconstruction and deterministic focus.

FR8: Epic 2 - Add an ordered Query Parameter with one History Entry and focus on its key.

FR9: Epic 2 - Reorder Query Parameters through keyboard-operable controls while preserving identity and values.

FR10: Epic 2 - Edit or replace Full URL with immediate valid synchronization and coalesced committed intent.

FR11: Epic 2 - Preserve invalid Draft URL separately while continued work uses Last Valid URL.

FR12: Epic 2 - Maintain one atomically synchronized committed state with close-and-rebase correction.

FR13: Epic 3 - Record one exact chronological snapshot for each Committed Mutation.

FR14: Epic 3 - Undo exact committed states stepwise with deterministic focus and native text-Undo protection.

FR15: Epic 3 - Copy the exact Current or Last Valid URL with truthful feedback and safe recovery.

FR16: Epic 3 - Confirm validation and operation outcomes through accessible, non-interrupting feedback channels.

#### Redesign and Compatibility Coverage

The original primary assignments above remain unchanged. Epic 4 preserves every
FR while changing the interface; Epic 5 validates compatibility rather than
reimplementing capabilities.

| Requirement scope | Epic 4 — redesign | Epic 5 — deferred compatibility |
|---|---|---|
| FR1, FR3, FR6, FR7, FR10, FR11, FR12, FR13, FR14 | Preserve exact intake/semantics/edit/History behavior through the new UI; regression coverage | Verify the same contracts on approved additional released-browser targets |
| FR2, FR4, FR5, FR8, FR9, FR15, FR16 | Grouped disclosures, Search/identity, bottom Add/navigation, primary drag/on-demand moves, adjacent Copy and external feedback | Verify equivalent interaction, focus, gestures and recovery on the expanded matrix |
| NFR1–NFR10, NFR12–NFR17 | Preserve browser-local privacy, integrity, capacity, accessibility and responsive contracts with fresh Chromium MVP evidence | Supply the broader release/platform/manual observations required by the unchanged gates |
| NFR11 | Do not claim latest-two-major coverage from Chromium-only results | Establish exact additional-browser and released-browser/version coverage |
| RD-AR1–RD-AR5; RD-UX1–RD-UX31 | Full current redesign scope | No duplicated implementation scope |
| RD-AR6 | Preserve deferral boundaries and use Epic 5 in current planning references | Own former Epic 4 browser-validation scope; no historical-result rewrite or waived cells |

## Epic List

### Epic 1: Safely Inspect and Find URL Pieces

A developer can open the browser-local tool, enter a supported Absolute URL, inspect its complete lossless structure, verify Unicode and ASCII/Punycode Domain forms, and find any Managed Piece without changing the URL.

**FRs covered:** FR1, FR2, FR3, FR4, FR5

**Implementation notes:** Establish the required create-vite application foundation and architectural boundaries, then deliver lossless parsing and IDN gate evidence, the semantic Workbench and complete list, the privacy baseline, responsive design tokens, stable piece identity, and non-mutating Search. The completed epic is independently useful as a trustworthy URL inspector.

### Epic 2: Precisely Transform a URL Without Losing Intent

A developer can edit, add, remove, reorder, or replace URL content through either surface while unaffected bytes, identities, Last Valid state, and chronological committed intent remain safe.

**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12

**Implementation notes:** Extend Epic 1 with the component-text codec, structured mutations, dual-Domain editing, Full URL continuous edits, invalid field and Draft handling, close-and-rebase transitions, atomic synchronization, deterministic mutation focus, and capacity-safe full DOM. The completed epic functions without future Undo or Copy capabilities.

### Epic 3: Recover and Export a Trusted Result

A developer can reverse every committed change to the exact Initial URL, copy the correct current valid result, recover safely from clipboard failure, and receive accessible truthful feedback for every outcome.

**FRs covered:** FR13, FR14, FR15, FR16

**Implementation notes:** Add exact snapshot History, product/native Undo arbitration, revisioned effects, Copy attempt fencing and safe-copy recovery, reducer-owned feedback queues, release evidence, and complete browser/AT verification. The epic builds on the prior editing experience and requires no future epic to function.

### Epic 4: Edit URLs in a Clear, Polished Workbench

A developer can inspect and edit URLs in the approved dark workbench, with Copy
beside Full URL, one bottom query Add, independent detail disclosures and query
dragging backed by focused/selected keyboard move controls, without losing exact
URL, Draft, Undo or Copy behavior.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16.

**Implementation notes:** Build on delivered Epics 1–3. Reconcile upstream
architecture, implement the approved visual/interaction contracts incrementally
and bind fresh Chromium regression evidence. No new component library,
production dependencies, expanded URL editors, persistence or deferred
browser-coverage claims. The epic delivers its Chromium MVP outcome independently
of Epic 5; evidence is progressive and story-specific.

### Epic 5: Use the Workbench Reliably Across Supported Browsers and Devices

A developer can rely on the existing workbench across the approved additional
browsers and released-browser OS/mobile targets, backed by concrete compatibility
observations rather than inferred Chromium equivalence.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, as compatibility verification.

**Implementation notes:** Preserve the unchanged scope formerly deferred to
Epic 4: Firefox/WebKit/prerequisites, latest-two-major released-browser targets
and the documented still-unverified native/manual/AT/real-zoom boundaries.
Validation applies to the delivered workbench, including Epic 4 changes;
requirements, exact evidence identity and release gating are not waived.
Detailed Epic 5 stories are outside this redesign-planning run.

## Epic 1: Safely Inspect and Find URL Pieces

A developer can open the browser-local tool, enter a supported Absolute URL, inspect its complete lossless structure, verify Unicode and ASCII/Punycode Domain forms, and find any Managed Piece without changing the URL.

### Story 1.1: Set Up Initial Project from the React Starter Template

As a web developer,
I want to open a trustworthy browser-local URL Workbench,
So that I can begin URL work in a private, accessible interface that behaves consistently across supported layouts.

**Acceptance Criteria:**

**Given** a fresh checkout on Node.js 24 LTS with pnpm 12.5.1
**When** dependencies are installed and the application is built
**Then** the project uses the create-vite 9.2.1 React/TypeScript foundation with React/React DOM 19.3.0, TypeScript 6.0.2, Vite 8.3.1, and `@vitejs/plugin-react` 6.1.1
**And** package scripts run type checking, oxlint 1.81.0, Vitest 5.0.1, Testing Library, Playwright 1.63.0, axe-core, and the production build without selecting an alternative starter or runtime framework.

**Given** the application loads with no editing session
**When** the developer reaches the Workbench
**Then** one `<main>` exposes one URL Workbench heading and uniquely headed Full URL, Actions, and Structured View sections in that reading order
**And** the Full URL input is primary, Structured View contains no rows, unavailable session actions are visibly and programmatically inactive, and the page states: “Your URL stays in this browser and is cleared when you reload or close this page.”

**Given** the source tree is initialized
**When** architectural boundaries are inspected or boundary checks run
**Then** it contains pure inward-facing `core/url`, `core/idn`, `core/session`, and `core/contracts` modules; React `app/workbench`, `app/pieces`, and `app/feedback`; browser-only `platform/clipboard`, `platform/effects`, and `platform/focus`; committed `styles`; and shared `test/fixtures`
**And** UI components and platform adapters cannot mutate committed URL state independently of the session reducer.

**Given** the Workbench is rendered at desktop, tablet, 320 CSS px, or 400% zoom
**When** the viewport changes or WCAG text-spacing overrides are applied
**Then** the committed visual tokens, typography roles, spacing, borders, radii, pointer targets, and focus treatments are used consistently
**And** headings, labels, help, controls, and status regions remain readable and operable without page-level horizontal scrolling, clipping, overlap, color-only meaning, or loss of function; only essential URL value fields may scroll internally.

**Given** a keyboard or forced-colors user opens the no-session Workbench
**When** they navigate its currently available controls
**Then** tab order follows the visible reading order, every control has an accessible name, neutral and blue controls use the specified visible focus treatment, and forced-colors mode preserves perceivable boundaries and system-color focus
**And** status containers are not landmarks, routine UI uses no modal, animation, flashing, hover-only action, or focus-stealing feedback.

**Given** the production bundle is generated
**When** its static-delivery contract is inspected
**Then** Vite uses `base: './'`, assets are fingerprinted, the document declares the adopted CSP including `connect-src 'none'`, and no application backend, runtime environment branch, analytics SDK, persistence layer, telemetry sink, or service worker is present
**And** provider-neutral delivery metadata specifies immutable caching for fingerprinted assets, `no-cache` for `index.html`, HTTPS hosting, tested-artifact promotion, and atomic artifact/header rollback.

**Given** the developer loads, reloads, and closes the no-session application while monitoring browser facilities
**When** the lifecycle completes
**Then** no URL content or session state is written to Web Storage, IndexedDB, cookies, query strings, logs, traces, or outbound requests
**And** reload returns to the same empty No-session state.

**Given** semantic, accessibility, and release evidence will be recorded incrementally
**When** the baseline validation assets are inspected
**Then** a versioned shared fixture corpus and machine-validated evidence-manifest schema exist with stable IDs for FR, NFR, UX, gate, story, owner, result, tested version, artifact digest, evidence link, and sign-off
**And** a mandatory cell can pass only with terminal result `pass`, while `waived`, `skipped`, absent, or malformed cells fail validation; this foundation supports evidence for FR1–FR16 without pre-implementing those capabilities.

### Story 1.2: Start a Session with a Valid Absolute URL

As a web developer,
I want to enter a complete supported URL and receive precise validation,
So that I can begin an inspection session without an unsafe or stale input replacing trusted state.

**Acceptance Criteria:**

**Given** the Workbench has no active session
**When** the developer pastes or types an HTTP or HTTPS Absolute URL with a non-empty host and applies it
**Then** the session reducer atomically creates exact Initial, Current, and Last Valid snapshots from that input and keeps the accepted Full URL visible
**And** no canonicalized equivalent replaces the exact Initial serialization, no partial Structured View is published, and unavailable mutation actions remain inactive.

**Given** the developer enters a relative URL, domain-only value, unsupported scheme, empty host, pasted CR/LF, or input that cannot be represented safely
**When** validation settles or the developer explicitly applies the value
**Then** the entered text remains available for correction and the inline message says “Enter a complete HTTP or HTTPS Absolute URL with a host.” or a more specific safe explanation
**And** no Initial URL, Current URL, Last Valid URL, History Entry, or successful synchronization status is created.

**Given** a trusted session already exists
**When** an intake attempt is rejected
**Then** the existing Initial, Current, and Last Valid snapshots remain unchanged
**And** the rejected text is never exposed as committed state or as the source for any session action.

**Given** the Full URL input has persistent help and an error association
**When** input is invalid, corrected, resubmitted unchanged, or entered through IME composition
**Then** `aria-invalid`, `error-full-url`, accessible help references, persistent visible validation, correction clearing, and repeat announcement follow the UX validation contract
**And** intermediate composition states are not asserted, while Enter and Shift+Enter during composition neither apply input nor mutate session state.

**Given** multiple parse requests are scheduled in quick succession
**When** their work completes in any order
**Then** each request is tied to its exact input snapshot, monotonic generation, session epoch, and originating committed revision, and only the latest still-matching request may atomically publish acceptance or rejection
**And** superseded completions acknowledge without publishing stale state, changing the visible input, or exposing partial results.

**Given** parsing does not complete within the UX short-delay threshold
**When** the latest request remains pending
**Then** Structured View becomes `aria-busy="true"` and exposes “Parsing URL…” without moving focus from Full URL
**And** the busy state and message clear only when the latest matching request publishes or is superseded; committed parse outcomes enter the polite status channel without overwriting validation.

**Given** a supported URL at or near 20,000 characters on the reference hardware
**When** the developer starts a session
**Then** initial acceptance completes within the 1-second target without freezing input or overflowing the Workbench
**And** the evidence manifest records the fixture, hardware profile, measured result, browser version, artifact digest, and passing FR1 and AG-1 intake cells.

**Given** the developer starts a valid session while network and storage activity are monitored
**When** parsing succeeds and the page is then reloaded
**Then** URL processing remains in-browser with no URL-bearing request, log, trace, cookie, Web Storage, or IndexedDB write
**And** reload clears the Full URL, snapshots, validation, busy state, and all other session data back to No session.

### Story 1.3: Inspect Every URL Piece Without Semantic Loss

As a web developer,
I want an accepted URL decomposed into a complete exact structure,
So that I can understand every managed piece without hidden normalization, merging, omission, or reordering.

**Acceptance Criteria:**

**Given** a supported HTTP or HTTPS Absolute URL is accepted
**When** the lossless core parses it
**Then** WHATWG URL is used only as the acceptance and host-semantics oracle while a custom scanner creates exact scheme and authority slots, ordered path segments including empty and trailing entries, query-presence state and ordered entries, and Fragment-presence state
**And** neither `URLSearchParams` nor generic string splitting is used as the round-trip model or serializer.

**Given** the URL contains userinfo, port, unusual but accepted authority text, percent-octet casing, or untouched delimiters
**When** it is inspected without mutation
**Then** every unmanaged authority lexeme and untouched substring remains byte-identical in the exact snapshot serialization
**And** serialization from the lossless model reproduces the accepted input exactly rather than a canonical equivalent.

**Given** a query contains `key`, `key=`, duplicate keys, duplicate entries, empty keys, empty entries, mixed `&` separators, and encoded `&`, `=`, `#`, or `?`
**When** the Structured View is published
**Then** each literal structural entry is represented separately as `{id, separatorBefore, rawKey, equalsPresent, rawValue}` in source order
**And** absent and empty values remain distinguishable, encoded delimiters never become structure, duplicate entries never merge, and untouched separators and percent-triplet casing remain exact.

**Given** a path contains empty segments, a trailing slash, raw Unicode, or encoded `/`, `?`, `#`, and `%` sequences
**When** the Structured View is published
**Then** every slash-delimited source segment appears once in order with its exact raw component text
**And** encoded delimiters remain content, the Fragment remains in Full URL only, and no inspection step double-encodes or normalizes untouched text.

**Given** the accepted snapshot is atomically published
**When** the developer compares Full URL and Structured View
**Then** Structured View contains Domain first, every Path Segment next, and every Query Parameter last, while Scheme and Fragment remain visible only through Full URL
**And** the complete list appears at once with a Managed Piece count; partial, duplicated, omitted, merged, or reordered publication fails the story.

**Given** Managed Pieces include duplicate or identical-looking values
**When** the session creates their rows
**Then** every piece receives an opaque, session-local, immutable, non-recycled `PieceId` that is independent of array index, source ordinal, and filtered position
**And** stable DOM and error IDs derive from the opaque piece identity plus field kind rather than visible position.

**Given** an accepted URL contains malformed percent text that WHATWG accepts without making it structural
**When** its pieces are displayed
**Then** the original text remains visible and byte-identical, the affected field exposes a specific safe non-content problem code and plain-language explanation, and unrelated content remains inspectable
**And** inspection neither silently repairs the text nor marks a changed serialization as exact.

**Given** the versioned AG-1 corpus runs in core golden tests, component tests, and supported browser acceptance
**When** fixtures cover encoded delimiters, percent casing, malformed percent text, empty/absent values, duplicate entries, authority variants, empty/trailing path segments, Fragment preservation, and exact serialization
**Then** every layer asserts the same exact snapshot, piece order, identity rules, and Full URL output
**And** the evidence manifest marks each required FR2, FR3, and AG-1 inspection cell `pass` only when no semantic drift is observed.

### Story 1.4: Verify Internationalized Domain Representations

As a web developer,
I want to inspect both readable Unicode and ASCII/Punycode forms of an internationalized Domain,
So that I can verify the host I am working with before making any URL changes.

**Acceptance Criteria:**

**Given** an accepted URL contains a Unicode or Punycode host
**When** the Domain model is derived
**Then** both conversion directions use `tr46` 6.0.0 with `transitionalProcessing: false`, `checkBidi: true`, `checkJoiners: true`, `checkHyphens: false`, `useSTD3ASCIIRules: false`, `verifyDNSLength: false`, and `ignoreInvalidPunycode: false`
**And** the resulting ASCII host is validated through WHATWG HTTP/HTTPS host rules before either verification form is published.

**Given** Domain conversion succeeds
**When** the Domain row is rendered
**Then** it visibly labels and displays “Unicode Domain” and “ASCII/Punycode Domain” as two independently bidi-isolated values linked by shared help and a visible conversion status
**And** both forms derive from the same committed Domain identity while the exact untouched source host lexeme remains in Full URL and snapshot serialization.

**Given** the host contains Arabic, Hebrew, combining marks, deviation characters, uppercase Punycode, or standards-valid mixed scripts
**When** conversion and display complete
**Then** the two forms preserve their specified mapping and reading direction without Unicode normalization or an invented mixed-script rejection policy
**And** type, labels, status, and verification meaning remain available through visible text and programmatic semantics rather than color alone.

**Given** a host has invalid Punycode, fails TR46 conversion, or fails WHATWG host validation
**When** the developer attempts to start a session
**Then** the input remains available for correction with a specific plain-language inline explanation and a stable non-content problem code
**And** no Domain counterpart, committed URL snapshot, successful conversion status, or replacement session is published.

**Given** Domain values include mixed-direction text within surrounding left-to-right interface copy
**When** keyboard, screen-reader, zoom, forced-colors, and text-spacing checks run
**Then** each Domain value is isolated independently, its complete untruncated value and label remain perceivable, and its accessible name distinguishes Unicode from ASCII/Punycode
**And** the same conversion outcome is not redundantly announced through validation, polite status, and actionable alert channels.

**Given** the AG-2 fixture corpus runs across core, component, and supported browser tests
**When** it covers `faß.de`, combining-mark equivalents, Arabic and Hebrew labels, uppercase Punycode, deviation characters, invalid Punycode, and mixed-script confusables
**Then** expected Unicode form, ASCII form, accepted/rejected result, source-lexeme retention, isolation, labels, and exact snapshot serialization pass in every layer
**And** each mandatory FR3 and AG-2 inspection cell is recorded as `pass` with browser version, artifact digest, and evidence link.

### Story 1.5: Navigate a Complete High-Density Structured View

As a web developer,
I want to navigate every managed URL piece in a clear semantic list,
So that even a very large URL remains understandable and reachable without hidden or ambiguous rows.

**Acceptance Criteria:**

**Given** an accepted URL has Domain, Path Segments, and Query Parameters
**When** Structured View renders
**Then** every Managed Piece appears exactly once in one complete native semantic list in source order, with no virtualization, infinite scrolling, duplicate accessibility tree, or off-screen omission
**And** the visible Managed Piece total and programmatic list size equal the lossless model count.

**Given** a row represents Domain, a Path Segment, or a Query Parameter
**When** the developer reads or navigates the row
**Then** persistent visible text and its accessible name identify piece type, source ordinal and total for that type, and duplicate occurrence context where applicable
**And** identity and position meaning do not rely on color, shape, DOM index, or filtered position.

**Given** duplicate Query Parameters or identical-looking Path Segments exist
**When** the rows are traversed with keyboard or screen-reader browse mode
**Then** each row exposes its stable source identity and exact value once, in the same order as Full URL
**And** no row name, error ID, focus target, or piece identity collides or changes merely because another row has equal content.

**Given** a session contains at least 250 Query Parameters and a URL near 20,000 characters
**When** the developer uses the “Skip to Structured View results” link, tab navigation, screen-reader browse mode, or programmatic focus
**Then** every row remains reachable without traversing an omitted window, focus is never sent to an absent node, and Full URL and the Structured View heading remain efficient navigation anchors
**And** rendering and navigation complete without browser freezing, missing data, or a layout overflow that blocks inspection.

**Given** the Workbench is displayed at ≥1024px, 768–1023px, 320–767px, or 400% zoom
**When** rows contain long encoded or bidi-isolated values and WCAG text-spacing overrides are applied
**Then** labels, type, source position, duplicate occurrence, values, headings, and help reflow without clipping, overlap, truncation, or page-level horizontal scrolling
**And** only an essential URL value boundary may scroll internally while its label and semantic context remain outside that scroller.

**Given** forced colors, reduced motion, keyboard-only navigation, or a screen reader is active
**When** the developer traverses Structured View
**Then** boundaries, focus, type, position, and state remain perceivable; no animated scrolling, flashing, moving highlight, hover-only information, or color-only distinction is used
**And** the page preserves the heading/landmark model and does not create a landmark for list status content.

**Given** the AG-3 full-DOM fixture and browser/AT matrix run
**When** the 250+ entry URL is tested with Chrome/Edge + NVDA, Firefox + NVDA, Safari + VoiceOver on macOS and iOS, Chrome + TalkBack, and keyboard-only Windows/macOS runs
**Then** every row is exposed exactly once in browse and focus modes with correct order, names, size, IDs, and reachability
**And** required FR2, FR5, AG-3 inspection, 320px reflow, 400% zoom, forced-colors, and text-spacing evidence cells are recorded as `pass`; no virtualization-equivalence claim is required for V1.

### Story 1.6: Find and Clear Managed Pieces

As a web developer,
I want to search across every managed URL piece,
So that I can quickly locate the exact Domain, Path Segment, key, or value in a large URL without changing it.

**Acceptance Criteria:**

**Given** an active session contains Domain, Path Segments, and Query Parameters
**When** the developer enters a Search term
**Then** matching is case-insensitive across Unicode and ASCII/Punycode Domain forms, raw Path Segment text, Query Parameter keys, and Query Parameter values
**And** only matching Managed Pieces remain visible while their source order, immutable IDs, source ordinals, duplicate occurrences, exact values, committed snapshot, session epoch, and serialized Full URL remain unchanged.

**Given** Search filters a complete source list
**When** results render
**Then** the persistently labeled Search field and visible summary report “N of M Managed Pieces shown,” each visible row retains its source identity label, and filtered-result position is exposed separately through visible text and correct `aria-posinset`/`aria-setsize`
**And** filtering never renames source identity, reorders results, creates a URL mutation or History intent, or causes a hidden row to be omitted from the underlying complete model.

**Given** no Managed Piece matches the term
**When** Search settles
**Then** Structured View shows “0 of M Managed Pieces shown. No Managed Piece matches ‘term’.” and a keyboard-reachable “Clear Search” control
**And** the Full URL, Search, result summary, Structured View heading, and both list boundaries remain reachable without a modal, focus move, or false validation state.

**Given** Search is active
**When** the developer activates “Clear Search” by keyboard, pointer click/up, or assistive technology
**Then** every Managed Piece returns in original source order, focus returns to the Search field, and the restored result count is announced without moving focus into the list
**And** pointer-down, pointer cancellation before release, or Escape does not clear Search or mutate URL state.

**Given** the developer types rapidly, repeats the same term, or alternates between result counts
**When** result-status updates are queued
**Then** result-count messages settle rather than firing for every raw keystroke and coalesce only with a newer result-count message inside the 300 ms window
**And** each exposed status uses `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`; identical repeats replace the live-region child or use the matrix-tested clear/reinsert sequence rather than changing only metadata.

**Given** a URL near 20,000 characters contains at least 250 Query Parameters with duplicates, empty values, encoded text, and mixed-case terms
**When** the developer searches keys, values, paths, both Domain forms, and a no-result term, then clears Search
**Then** each interaction meets the 100 ms local-response target on reference hardware without freezing, layout overflow, identity drift, or missing results
**And** Search produces no URL-bearing network, storage, logging, telemetry, or trace output.

**Given** keyboard, screen-reader, 320px, 400% zoom, text-spacing, forced-colors, and reduced-motion checks run
**When** Search transitions among all-results, filtered-results, and no-results states
**Then** the persistent label, term, Clear control, result summary, source identity, filtered position, focus, and status remain perceivable and operable without color-only meaning, clipping, page-level horizontal scrolling, animated movement, or duplicate announcement
**And** the evidence manifest records passing FR4, FR5, NFR8–NFR10, and relevant UX Search cells across the release matrix.

## Epic 2: Precisely Transform a URL Without Losing Intent

A developer can edit, add, remove, reorder, or replace URL content through either surface while unaffected bytes, identities, Last Valid state, and chronological committed intent remain safe.

### Story 2.1: Edit Path and Query Text Without Rewriting Untouched Content

As a web developer,
I want to edit one Path Segment or Query Parameter field precisely,
So that my intended text changes while every unrelated URL byte, piece, and ordering decision remains intact.

**Acceptance Criteria:**

**Given** an active session displays a Path Segment, Query Parameter key, or Query Parameter value
**When** the developer focuses its field
**Then** the field displays and edits raw URL component text rather than decoded text, uses the URL monospace style, and keeps its persistent type/source-position label and stable accessible name
**And** focus remains on the active control throughout ordinary typing and successful commit.

**Given** a field edit is dispatched
**When** the reducer receives it
**Then** the command includes immutable Piece ID, field kind, prior token revision, DOM-compatible UTF-16 `selectionStart`/`selectionEnd`, and `insertedText`
**And** a stale revision, missing piece, out-of-range selection, or range that splits an existing percent triplet is rejected without rebasing, mutation, snapshot entry, or unrelated focus movement.

**Given** inserted Path text contains literal reserved characters, Unicode, `+`, or complete percent triplets
**When** the component-text codec processes the inserted span
**Then** complete `%[0-9A-Fa-f]{2}` triplets remain opaque with original bytes/case, literal `+` remains `+`, Unicode is UTF-8 percent-encoded with uppercase hex, and the path profile encodes the WHATWG path set plus `/` and `\`
**And** untouched prefix and suffix ranges remain byte-identical.

**Given** inserted Query key or value text contains literal delimiters, Unicode, `+`, or complete percent triplets
**When** the codec processes the inserted span
**Then** keys encode the special-query set plus `&` and `=`, values encode the special-query set plus `&`, complete percent triplets and literal `+` remain exact, and new Unicode uses uppercase UTF-8 percent encoding
**And** editing a key, `equalsPresent`, or value preserves the distinction among absent value, empty value, empty entry, and duplicate entry.

**Given** inserted text contains a bare or partial `%`, a domain-invalidating change is attempted through a non-domain field, or the edit otherwise cannot commit safely
**When** validation settles or the developer explicitly applies it
**Then** the local field draft remains available for correction with a persistent field-specific message, stable `error-{itemId}-{fieldKind}`, `aria-invalid`, and associated help/error references
**And** Current/Last Valid URL, exact serialization, other fields, immutable IDs, and the committed-mutation journal remain unchanged; intermediate IME states are not asserted.

**Given** a valid Path or Query edit commits
**When** the reducer publishes the transition
**Then** Full URL, Structured View, Current/Last Valid snapshot, serialized Copy source, piece revision, and one exact before/after Committed Mutation entry update atomically
**And** only the target token and delimiters whose presence that edit explicitly changes may differ; every unaffected token, separator, percent casing, Fragment, piece ID, and source order remains exact.

**Given** an identical-looking duplicate entry or encoded delimiter exists elsewhere
**When** one field commits
**Then** only the Piece ID and field named by the command changes, duplicate siblings retain identity/content/order, and encoded delimiters never become structure
**And** a rejected edit, focus, selection, scroll, or validation attempt creates no Committed Mutation entry or success status.

**Given** a 20,000-character/250+ entry fixture is edited repeatedly across Path, key, and value fields
**When** component, core-golden, and browser tests run
**Then** each accepted edit completes within the 100 ms target on reference hardware without freezing, omitted pieces, layout blockage, or byte drift
**And** no URL-bearing value enters network, storage, logs, telemetry, traces, or error payloads; required FR6, AG-1 codec, accessibility, and performance evidence cells pass.

### Story 2.2: Edit Either Internationalized Domain Form Safely

As a web developer,
I want to edit either the Unicode or ASCII/Punycode Domain representation,
So that I can change an internationalized host confidently while both forms and the complete URL remain synchronized.

**Acceptance Criteria:**

**Given** an active session displays Unicode Domain and ASCII/Punycode Domain fields
**When** the developer focuses one form and begins editing
**Then** that focused form exclusively owns its local draft while the counterpart continues to show the last committed conversion
**And** each form keeps its visible label, shared help, independent bidi isolation, stable Domain identity, and field-specific accessible error target.

**Given** the developer submits a valid Unicode Domain edit
**When** TR46 conversion with the adopted options and WHATWG HTTP/HTTPS host validation succeeds
**Then** the reducer atomically commits the Unicode form, lowercase ASCII/Punycode counterpart, Full URL host, Current/Last Valid snapshot, serialized Copy source, and one exact before/after Committed Mutation entry
**And** userinfo, port, scheme, path, query, Fragment, untouched separators, non-Domain Piece IDs, and source order remain byte-identical.

**Given** the developer submits a valid ASCII/Punycode Domain edit
**When** reverse conversion and host validation succeed
**Then** the reducer atomically commits the lowercase ASCII/Punycode host, readable Unicode counterpart, Full URL, snapshot, and one mutation entry
**And** the committed status explicitly identifies that both Domain representations and the URL were synchronized without moving focus.

**Given** an untouched accepted host retains its source lexeme
**When** the developer makes no Domain edit
**Then** exact snapshot serialization continues to use that original source lexeme
**And** after either Domain form is successfully edited, committed Full URL serialization uses the validated lowercase ASCII/Punycode host as required by the architecture contract.

**Given** focused Domain text has invalid Punycode, fails TR46/WHATWG validation, contains an incomplete composition, or otherwise cannot serialize safely
**When** validation settles or Apply is invoked
**Then** the invalid text remains only in the focused local draft with persistent `error-{itemId}-domain-unicode` or `error-{itemId}-domain-ascii`, `aria-invalid`, and associated plain-language guidance
**And** the counterpart, Full URL, Current/Last Valid snapshot, mutation journal, and other pieces remain unchanged; no polite success or actionable operation alert duplicates the validation announcement.

**Given** a standards-valid mixed-script, Arabic, Hebrew, combining-mark, or deviation-character host is edited
**When** conversion succeeds
**Then** it is accepted without an invented homograph policy, Unicode normalization, or direction corruption, and both committed forms remain visibly and programmatically distinguishable
**And** invalid conversion never partially updates one form or publishes an ambiguous host.

**Given** a Domain command references a stale revision or an obsolete session state
**When** it reaches the reducer
**Then** it is rejected without rebasing, conversion publication, mutation entry, status success, or loss of the current local draft
**And** the developer receives a safe non-content explanation without URL-bearing logs or telemetry.

**Given** AG-2 core, component, and browser fixtures exercise both editable directions
**When** tests cover `faß.de`, combining equivalents, Arabic/Hebrew, uppercase Punycode, deviation characters, invalid Punycode, confusable mixed scripts, IME, exact unrelated-byte retention, and repeated correction
**Then** each accepted edit completes atomically within the interaction target and every rejected edit preserves committed state
**And** required FR6, NFR4–NFR7, accessibility, privacy, and AG-2 editing evidence cells are recorded as `pass`.

### Story 2.3: Remove One Specific Managed Piece

As a web developer,
I want to remove one Path Segment or Query Parameter precisely,
So that I can simplify a URL without deleting a duplicate sibling, corrupting delimiters, or losing my place.

**Acceptance Criteria:**

**Given** an active session displays removable Path Segment and Query Parameter rows
**When** the developer inspects their actions
**Then** each removable row has a labeled Remove control with at least the required target size and an accessible name containing type and stable source identity
**And** the Domain row exposes no Remove action because an Absolute URL must retain a host.

**Given** duplicate Query Parameters or identical-looking Path Segments exist
**When** the developer activates Remove for one immutable Piece ID
**Then** only that exact piece is removed; every sibling retains its content, identity, relative order, percent casing, and local draft state
**And** one atomic transition updates Full URL, Structured View, Current/Last Valid snapshot, serialized Copy source, source labels, and one exact before/after Committed Mutation entry.

**Given** a Path Segment at the beginning, middle, end, empty position, or trailing-slash boundary is removed
**When** the lossless serializer reconstructs the path
**Then** it changes only the target token and slash delimiter presence required by that removal while producing the specified valid path
**And** query presence, Fragment, authority, other path bytes, encoded slashes, and untouched separators remain exact.

**Given** a Query Parameter is removed from a one-entry, first, middle, last, duplicate, empty-entry, absent-value, or empty-value query
**When** the lossless serializer reconstructs the query
**Then** the exact target entry is removed and remaining entries preserve their source order, IDs, raw keys/values, `equalsPresent`, and valid separator structure
**And** query-marker/separator changes are limited to those required by removal; no sibling is merged, normalized, or rewritten.

**Given** Remove is activated while Search is active or inactive
**When** the target leaves the DOM
**Then** the focus intent captures the removed ID and activated subcontrol, searches next then previous in post-removal visible source order for the nearest row exposing the same Remove control, mounts/scrolls it, and focuses it
**And** if none exists, focus moves to Clear Search when filtered survivors exist and otherwise to the Structured View heading.

**Given** removal completes
**When** feedback is exposed
**Then** it announces the removed type and original source position without moving focus away from the resolved destination
**And** source totals, duplicate occurrence labels, filtered positions, result summary, and current Full URL all reflect the same committed snapshot.

**Given** the developer presses or touches Remove but cancels or moves away before click/up activation, or the command references a stale/missing Piece ID
**When** the interaction ends
**Then** no removal, delimiter change, mutation entry, success status, or focus intent occurs
**And** pointer-down alone never mutates the URL.

**Given** core, component, and browser fixtures remove every supported Path/Query boundary case in 250+ entry filtered and unfiltered sessions
**When** exact serialization, identity, focus, keyboard, touch, screen-reader, 320px, and performance checks run
**Then** removal completes within the interaction target with no frozen input, omitted sibling, layout blockage, absent focus, or URL-bearing external sink
**And** required FR7, NFR4–NFR10, NFR12–NFR17, and UX Remove evidence cells are recorded as `pass`.

### Story 2.4: Add a Query Parameter from Either List Boundary

As a web developer,
I want to add a Query Parameter from an easy-to-reach action,
So that I can extend even a long URL and immediately enter the new key without traversing hundreds of rows.

**Acceptance Criteria:**

**Given** an active session is valid
**When** the Workbench renders its Actions and Structured View regions
**Then** identically labeled “Add Query Parameter” controls appear before and after the Managed Piece list, and “Skip to Add Query Parameter” targets the semantic after-list action
**And** both Add controls are keyboard/AT reachable, meet the 44×44 target, and invoke the same reducer command and validation behavior.

**Given** the URL has no query, an empty query marker, or existing Query Parameters
**When** either Add control is activated
**Then** one new Query Parameter with a fresh non-recycled Piece ID is appended after every existing Query Parameter with valid query-marker and separator structure
**And** Domain, Path Segments, existing Query entries, Fragment, untouched separators, exact bytes, and relative identities remain unchanged.

**Given** the developer configures the new entry
**When** they choose whether a value is absent or present and enter key/value text
**Then** the UI exposes an explicit value-presence choice so `key` and `key=` remain distinguishable, and it also permits an empty key, empty value, or duplicate key
**And** inserted key/value text uses the shared component codec and field-specific validation without silently normalizing existing entries.

**Given** Search is active when Add is invoked
**When** the mutation begins
**Then** Search clears, all source rows return in order, the restored result count is announced, the new row mounts after existing Query Parameters, and focus moves to its key field by immutable ID
**And** clearing Search and adding the row occur as one deterministic operation without a separate URL mutation or lost focus.

**Given** Add commits successfully
**When** the reducer publishes the result
**Then** Full URL, Structured View, Current/Last Valid snapshot, serialized Copy source, piece totals/positions, and exactly one before/after Committed Mutation entry update atomically
**And** the status identifies the added Query Parameter without interrupting the focused key field.

**Given** the after-list Add control now exists
**When** a Remove operation has no surviving same-subcontrol row and no filtered Clear Search target
**Then** its previously defined focus fallback resolves to the mounted semantic after-list Add control before the Structured View heading
**And** both Add routes remain reachable at 250+ entries without requiring traversal of every row.

**Given** the developer cancels a pointer before click/up, the command is stale, or the session becomes unavailable
**When** Add activation ends
**Then** no row, query marker, mutation entry, status success, Search change, or focus intent is created
**And** pointer-down alone never mutates the URL.

**Given** core, component, and browser fixtures add absent, empty, duplicate, encoded, Unicode, and empty-key entries to zero-, one-, and 250+-entry queries
**When** exact serialization, focus, Search clearing, keyboard, touch, screen-reader, responsive, and performance checks run
**Then** both Add routes produce identical atomic outcomes within the interaction target with no omission, byte drift, layout blockage, or external URL sink
**And** required FR8, NFR4–NFR10, NFR12–NFR17, and UX Add evidence cells are recorded as `pass`.

### Story 2.5: Reorder Query Parameters by Keyboard

As a web developer,
I want to move a Query Parameter up or down with explicit controls,
So that I can test order-sensitive URLs without drag gestures or damage to duplicate entries.

**Acceptance Criteria:**

**Given** an active session has two or more Query Parameters
**When** their rows render
**Then** each row exposes labeled keyboard-operable Move Up and Move Down controls with type/source-position context and the required hit area
**And** the first row’s Move Up and last row’s Move Down are natively disabled with visible non-color state; pointer drag is not required.

**Given** the developer activates an enabled Move Up or Move Down control
**When** the reorder commits
**Then** the target immutable Piece ID moves exactly one Query Parameter source position in the requested direction while its raw key, `equalsPresent`, raw value, duplicate identity, and local field state remain intact
**And** Domain, Path Segments, Fragment, every non-target Query Parameter value/identity, and all unrelated URL bytes remain unchanged; only Query Parameter order and delimiter placement required by that order may differ.

**Given** Search filters the visible rows
**When** an enabled Move control is activated
**Then** movement is resolved against complete Query Parameter source order rather than filtered-result order, source ordinals/totals and filtered positions refresh separately, and the same immutable row remains the focus target
**And** hidden entries are neither omitted nor merged and Search itself creates no additional mutation entry.

**Given** the moved row remains away from a boundary after DOM movement
**When** the render commits
**Then** focus returns to the same activated Move control by immutable Piece ID
**And** status announces old position, new position, total, and the updated source identity without animated scrolling or moving highlight.

**Given** the move places the row at a boundary where the activated control becomes disabled
**When** focus is resolved
**Then** focus moves to the same row’s enabled opposite Move control, or to its row container/first editable control when neither Move control is available
**And** the announcement includes the boundary outcome without moving focus elsewhere.

**Given** an impossible boundary control, a one-item list, a stale command, or a pointer interaction cancelled before click/up
**When** activation ends
**Then** no URL change, reorder, mutation entry, focus intent, or success announcement occurs
**And** pointer-down alone never mutates order.

**Given** a valid reorder completes
**When** the reducer publishes it
**Then** Full URL, Structured View, Current/Last Valid snapshot, serialized Copy source, piece positions, Search summary, and exactly one exact before/after Committed Mutation entry update atomically
**And** one completed move is represented as one reversible intent rather than per-render or per-pointer events.

**Given** 250+ entry fixtures contain duplicates, empty/absent values, unusual separators, encoded delimiters, and active Search
**When** core, component, keyboard, touch, screen-reader, responsive, exact-serialization, and performance tests run
**Then** every enabled move completes within the 100 ms target with stable identity, correct focus/status, no frozen input, byte drift, omission, layout blockage, or external URL sink
**And** required FR9, NFR4–NFR10, NFR12–NFR17, and UX Reorder evidence cells are recorded as `pass`.

### Story 2.6: Edit the Full URL as One Continuous Intent

As a web developer,
I want to edit or replace the complete URL while its structured pieces stay synchronized,
So that I can make broad changes without receiving one mutation entry per keystroke or losing stable piece identity.

**Acceptance Criteria:**

**Given** an active valid session and the developer focuses Full URL
**When** the focus session begins
**Then** the reducer captures the exact committed baseline snapshot and initializes a last-accepted-valid snapshot for that one edit session
**And** the persistently labeled wrapping textarea keeps its commit help, minimum height, raw input text, selection, and keyboard focus.

**Given** successive Full URL input states are syntactically valid supported Absolute URLs
**When** each state is accepted
**Then** Current/Last Valid URL, exact snapshot serialization, Structured View, piece totals/positions, Search results, and serialized Copy source update atomically and immediately
**And** intermediate valid states do not append separate Committed Mutation entries while the same focus session remains open.

**Given** Full URL reparsing changes Path Segments or Query Parameters
**When** immutable IDs are reconciled
**Then** Domain keeps its ID, path and query sequences reconcile independently by exact-token longest common subsequence, path keys use `rawSegment`, query keys use `{rawKey, equalsPresent, rawValue}`, and `separatorBefore` is excluded from the query match key
**And** ties resolve by earliest old then earliest new position, matched tokens retain IDs, unmatched new tokens receive fresh non-recycled IDs, and removed IDs are not reused.

**Given** the developer pastes or replaces the complete Full URL
**When** the replacement is valid and the session closes
**Then** it is represented as one baseline-to-last-valid Committed Mutation regardless of input event count
**And** exact Full URL serialization, lossless structure, piece identities, and all synchronized surfaces are stored in the before/after snapshots.

**Given** a valid Full URL editing session is open
**When** the textarea blurs, the developer presses Enter outside composition, or another product mutation begins
**Then** `closeFullUrlEdit(reason)` closes the session and appends at most one baseline-to-last-valid entry only when those snapshots differ
**And** the subsequent product mutation runs after that close in reducer-defined order rather than relying on DOM event ordering.

**Given** Enter or Shift+Enter occurs during IME composition
**When** the key event is handled
**Then** it only confirms composition and never applies, closes, inserts a newline, rejects the draft, or creates a mutation entry
**And** after composition ends, Enter applies/closes without inserting a line break while Shift+Enter is also rejected as a line break and leaves text unchanged.

**Given** a scheduled parse is pending when a newer Full URL input or product mutation advances session state
**When** the older completion returns
**Then** generation, exact input snapshot, session epoch, and originating committed revision prevent stale publication
**And** no stale completion replaces text, rows, IDs, validation, busy state, or the newer exact snapshot.

**Given** Full URL briefly becomes invalid during this story
**When** validation settles
**Then** the text remains visible as an exact Draft and Structured View continues to show Last Valid without presenting synchronization success
**And** structured mutation controls remain enabled against Last Valid; before the first such mutation, the reducer closes the Full URL edit and records any baseline-to-last-valid transition, then applies the structured mutation chronologically while preserving the Draft exactly, as specified in Story 2.7.

**Given** exact continuous-edit and identity fixtures run across core, component, and supported browsers
**When** tests cover many valid keystrokes, paste/replace, blur, Enter, pre-mutation close, IME, parse races, duplicates, LCS ties, and 20,000-character/250+ URLs
**Then** each valid state synchronizes within targets, each session creates zero or one exact entry, and no stale/partial state, identity drift, freeze, layout blockage, or external URL sink occurs
**And** required FR10, NFR4–NFR10, NFR12–NFR17, AG-1 identity/history, and Full URL UX evidence cells pass.

### Story 2.7: Keep Working Through an Invalid Full URL Draft

As a web developer,
I want Structured View changes to remain safe while my Full URL draft is invalid,
So that I can continue useful work without losing the draft, corrupting Last Valid state, or creating a stale history branch.

**Acceptance Criteria:**

**Given** an active session and Full URL becomes incomplete or invalid
**When** validation settles
**Then** the exact Draft text remains visible with the associated message “Draft URL is not valid. Structured View changes use the Last Valid URL.” or a more specific explanation
**And** Structured View, exact committed snapshot, mutation journal, and serialized Copy source continue to represent Last Valid; the Draft is never presented as synchronized or committed.

**Given** an invalid Draft is visible
**When** the developer edits a Managed Piece, adds, removes, or reorders a Query Parameter
**Then** structured mutation controls remain enabled and operate against the latest Last Valid snapshot while the Draft text, selection, and inline error remain unchanged
**And** each accepted mutation atomically updates Last Valid, Structured View, exact serialization, mutation journal, source labels, Search, and serialized Copy source without replacing Draft.

**Given** the Full URL focus session began at baseline `A`, accepted valid states through `C`, and now displays invalid Draft `X`
**When** the first structured mutation `S1` begins
**Then** the reducer first closes Full URL editing and appends `[A→C]` only when `A` differs from `C`, retaining Draft `X`, then applies `S1` against `C` and appends a separate `[C→D]` entry in the same ordered transaction
**And** DOM blur/click ordering cannot merge, reverse, duplicate, or omit those intents.

**Given** Draft `X` remains visible after `S1` produced `D`
**When** another structured mutation `S2` commits
**Then** it operates against latest Last Valid `D`, appends `[D→E]`, and leaves `X` exact
**And** every mutation retains its own before/after serialization, lossless model, immutable IDs, and operation-specific focus/status intent.

**Given** Last Valid is now `E` while Draft `X` remains visible
**When** the developer corrects Full URL to valid `F` and closes the edit
**Then** the correction uses `E`—not stale focus-entry baseline `A` or prior `C`—as its baseline, atomically synchronizes all surfaces, appends `[E→F]`, clears Draft validation, and resumes valid state
**And** earlier structured entries remain chronological and independently reversible from their stored snapshots.

**Given** the exact sequence `A → B → C → X(invalid) → D → E → F`
**When** journal snapshots are inspected in reverse order
**Then** they are ready to restore `F→E→D→C→A` and never restore invalid `X` or intermediate coalesced `B`
**And** exact serialization, immutable identities, required focus targets, and Last Valid semantics are present in every stored snapshot without requiring future story data.

**Given** invalid Draft coexists with a structured field validation error, Search, or operation status
**When** the developer continues working
**Then** Full URL validation, structured field validation, polite operation status, and any actionable failure remain separate and do not overwrite one another
**And** feedback explicitly identifies Last Valid updates and unchanged Draft without stealing focus from the active or operation-defined target.

**Given** parsing, structured commands, or effects complete out of order during invalid-Draft work
**When** generation, epoch, revision, Piece ID, and effect preconditions are checked
**Then** stale work acknowledges without publishing or invoking an adapter, while the newest ordered reducer transaction remains authoritative
**And** no stale completion changes Draft, Last Valid, journal order, rows, focus, status, or serialized Copy source.

**Given** core, component, and browser fixtures exercise every structured mutation during invalid Draft, repeated corrections, IME, Search, 250+ entries, and the exact close-and-rebase sequence
**When** atomicity, exact snapshots, focus, validation, responsive, privacy, and performance checks run
**Then** Draft stays exact, accepted mutations meet response targets, Last Valid and journal remain restorable, and no freeze, partial state, stale branch, layout blockage, or URL-bearing external sink occurs
**And** required FR11–FR12, NFR4–NFR10, NFR12–NFR17, AG-1 close-and-rebase, and invalid-Draft UX evidence cells pass.

### Story 2.8: Close Deferred Verification Gaps

As a web developer,
I want the existing editing flows backed by complete, reproducible execution evidence,
So that passing source-file references cannot substitute for verified behavior.

**Scope decision (2026-10-07):** Original Story 2.7 is done at commit `39ba84aca82cb9f0021f99e71048de5f269707e0`. Its uncommitted verification follow-up was cancelled and discarded. This new story owns that follow-up's requirements and review issues; no discarded implementation or run is delivered evidence.

**Acceptance Criteria:**

**Given** the 36 mandatory cells and an independently maintained complete regression inventory
**When** the evidence producer runs lint, build, unit, validator and browser checks
**Then** every cell references content-addressed, actually passing execution reports for the exact tested source, artifact and delivery configuration
**And** missing, failed, skipped, incomplete, wrong-command, wrong-engine, tampered, stale or escaping-path evidence fails explicitly without reusing stale success.

**Given** the approved MVP targets are installed Playwright Chromium, Firefox and WebKit
**When** invalid-Draft, correction, structured editing, Search, selection, focus, IME and capacity scenarios execute
**Then** identical semantic and response assertions pass on all three engines without weakening the 100 ms, 20,000-character or 260-entry requirements
**And** actual engine/tool versions are recorded; WebKit is not described as released Safari.

**Given** reports are retained or the runner fails, overlaps another run, or is interrupted
**When** evidence is validated or execution terminates
**Then** unchanged moved checkouts retain valid evidence, full file/suite/test identities are enforced, cancellation cannot publish success, owned work is cleaned up, and another active runner's publication is not deleted
**And** failure diagnostics are correctly typed and stale-workspace recovery is documented.

**Given** an earlier composition completes without an immediate duplicate input
**When** the opposite Domain form changes and a later ordinary input matches that earlier result
**Then** the legitimate edit publishes rather than being suppressed by a stale guard
**And** immediate and delayed native post-composition events still commit once and preserve synchronization feedback.

**Given** released-browser latest-two-major Windows/macOS/mobile or observed screen-reader checks have not run
**When** MVP completion is reported
**Then** they remain explicitly deferred with operator checklists, not passing coverage
**And** real 400% browser zoom remains post-MVP; viewport, device scale, axe and forced-colors emulation do not claim equivalence.

**Implementation handoff:** [Draft Story 2.8](../implementation-artifacts/spec-2-8-close-deferred-verification-gaps.md) records the full review backlog and test-only installation authorization. Story 3.6 remains responsible for the broader trusted release/promotion gate and must consume, not duplicate, this execution-proof foundation.

## Epic 3: Recover and Export a Trusted Result

A developer can reverse every committed change to the exact Initial URL, copy the correct current valid result, recover safely from clipboard failure, and receive accessible truthful feedback for every outcome.

### Story 3.1: Undo Every Committed URL Change Exactly

As a web developer,
I want to reverse committed URL changes one step at a time,
So that I can safely return through my exact work and ultimately recover the original URL.

**Acceptance Criteria:**

**Given** an active session is still at Initial URL with no committed mutations
**When** the Actions region renders
**Then** a persistent visibly labeled Undo control is programmatically inactive with explicit non-color state
**And** V1 exposes no Redo action or forward-history behavior.

**Given** one or more Committed Mutation entries exist
**When** the developer activates visible Undo
**Then** the reducer restores the latest entry’s complete `before` snapshot—exact Full URL serialization, lossless model, Current/Last Valid state, immutable Piece IDs, revisions, and required operation metadata—in one atomic transition
**And** Full URL, Structured View, source labels, Search results, serialized Copy source, and Undo availability all reflect that same restored snapshot without creating a new mutation entry.

**Given** the latest entry came from Path/Query edit, Domain edit, Add, Remove, Reorder, or a closed continuous Full URL session
**When** Undo runs
**Then** exactly that one completed user intent is reversed, including one entire reorder or coalesced Full URL focus session as one step
**And** rejected edits, Search, focus, selection, scrolling, validation attempts, parse-status changes, and other non-mutating interactions are never present as Undo steps.

**Given** duplicate entries, empty/absent values, encoded delimiters, unusual separators, IDN, malformed accepted percent text, or a Fragment are present
**When** a mutation is undone
**Then** every restored byte, presence flag, separator, percent-octet case, relative order, Unicode/ASCII Domain form, and immutable identity matches the stored prior snapshot exactly
**And** no canonical reconstruction, current-model reparse, identity reallocation, merge, omission, or normalization substitutes for snapshot restoration.

**Given** an invalid Full URL Draft is visible over Last Valid state
**When** visible Undo reverses the latest structured or closed Full URL mutation
**Then** Draft text, selection, and inline validation remain unchanged while Last Valid, Structured View, mutation journal, and serialized Copy source restore atomically
**And** status identifies the undone mutation and states that Draft URL is unchanged without presenting Draft as synchronized.

**Given** the journal sequence is `[A→C]`, `[C→D]`, `[D→E]`, `[E→F]`
**When** the developer activates visible Undo repeatedly
**Then** committed state restores `E`, `D`, `C`, then exact Initial `A`, never invalid Draft `X` or intermediate coalesced state `B`
**And** after `A` is restored, Undo becomes inactive and further activation creates no state, entry, effect, or success message.

**Given** an Undo pointer interaction is cancelled before click/up, the command revision is stale, or no entry exists
**When** activation ends
**Then** no snapshot restoration, journal change, effect, or success status occurs
**And** pointer-down alone never invokes Undo.

**Given** exact History fixtures run through every mutation type and a 20,000-character/250+ session
**When** core, component, browser, privacy, performance, and exact-serialization tests execute
**Then** each visible Undo meets the interaction target without frozen input, partial publication, stale Copy source, identity drift, layout blockage, or external URL sink
**And** required FR13, core FR14 restoration, NFR4–NFR10, and exact History evidence cells are recorded as `pass`.

### Story 3.2: Keep Keyboard Undo and Focus Predictable

As a web developer,
I want product Undo to respect native text editing and return focus to the logical item it changed,
So that I can recover by keyboard without unexpected interception or losing my place.

**Acceptance Criteria:**

**Given** a key event occurs anywhere in the Workbench
**When** the sole `app/workbench/inputArbiter` evaluates it
**Then** product Undo is eligible only for `event.key === "z"` with the platform primary modifier (`Ctrl` on Windows/Linux, `Meta` on macOS), without Alt or AltGraph, outside composition and native editing
**And** no component registers a competing global product-Undo handler.

**Given** the event target or active element is an `input`, `textarea`, editable `select`, `contenteditable` host or descendant, an editing-host selection exists, or `event.isComposing` is true
**When** the primary-modifier Undo shortcut occurs
**Then** browser-native text Undo wins and product state, journal, focus intents, and status remain unchanged
**And** the persistent visible Undo control remains available for explicitly invoking product Undo.

**Given** the shortcut is eligible outside native editing and a mutation entry exists
**When** the developer presses it
**Then** default browser handling is prevented exactly once and the same reducer command used by visible Undo restores the latest exact snapshot
**And** one keypress produces one product Undo, one focus intent, and one status outcome.

**Given** Undo reverses Add, Remove, or Managed Piece Edit
**When** the restored DOM commits
**Then** Add Undo focuses the nearest surviving Managed Piece or Full URL; Remove Undo focuses the recreated row’s corresponding control by immutable ID; and Edit Undo focuses the restored field by immutable ID
**And** nearest-row resolution uses post-transition source order, searching next then previous, never an absent or recycled node.

**Given** Undo reverses Query Parameter Reorder or continuous Full URL editing
**When** the restored DOM commits
**Then** Reorder Undo focuses the moved row’s enabled Move control, otherwise its first editable control, while Full URL Undo focuses the Full URL textarea
**And** one complete reorder or Full URL focus session remains one Undo/focus outcome.

**Given** active Search hides the restored or affected target
**When** Undo resolves focus
**Then** it focuses the nearest visible Managed Piece by post-transition source order, or Full URL when none is visible
**And** status announces that the affected/restored item is filtered while Search remains active and source identity/order remain unchanged.

**Given** invalid Draft URL is visible during Undo
**When** any operation-specific focus transition completes
**Then** Draft text, selection, validation, and Full URL visibility remain exact; Last Valid and Structured View restore; focus follows the operation table
**And** status names the undone mutation and explicitly says “Draft URL is unchanged.”

**Given** a focus effect is queued
**When** the serial effect executor reaches it
**Then** it claims the effect against originating revision and typed target preconditions, mounts and scrolls the destination before focusing, acknowledges exactly once, and starts no later effect until acknowledgement
**And** stale revision, missing ID, or failed precondition acknowledges without touching the DOM or creating another effect.

**Given** keyboard, IME, Search, filtered-target, removed/restored-node, 250+ entry, and browser/AT fixtures run
**When** every visible and shortcut Undo path is exercised on the release matrix
**Then** native editing Undo is never intercepted, product Undo fires only when eligible, exact state restores, focus is never lost/absent, and announcements do not steal focus
**And** required FR14, NFR12–NFR16, input-arbiter, focus-transition, and invalid-Draft evidence cells are recorded as `pass`.

### Story 3.3: Copy the Latest Valid URL Truthfully

As a web developer,
I want a persistent Copy action to use the exact latest valid URL,
So that I never paste an earlier state or an invalid Full URL draft.

**Acceptance Criteria:**

**Given** an active valid session
**When** the developer activates the persistent Copy control
**Then** the Copy intent captures exactly `snapshot.serialized` from Current URL as `attemptedSerialized`, plus a monotonic attempt/effect ID and originating state revision
**And** the UI never reconstructs a URL from fields, reads DOM values as the source, canonicalizes the snapshot, or creates a History Entry.

**Given** Full URL contains an invalid Draft over Last Valid
**When** Copy is activated
**Then** the intent captures the exact Last Valid `snapshot.serialized`, not Draft text, focus-entry baseline, or an earlier committed state
**And** Draft text, selection, validation, Last Valid, Structured View, History, and focus remain unchanged.

**Given** a Copy intent reaches the serial effect executor
**When** it is about to invoke the Clipboard API
**Then** the executor verifies that `attemptedSerialized` is still the current Copy source and that its typed revision/preconditions remain valid
**And** a superseded or stale intent is acknowledged without invoking Clipboard, reporting success, changing focus, or exposing the captured URL in logs, telemetry, traces, or error payloads.

**Given** the verified Clipboard write succeeds
**When** its outcome is acknowledged exactly once
**Then** valid state reports “Current URL copied.” and invalid-Draft state reports “Last Valid URL copied; Draft URL is unchanged.” through polite operation status
**And** success does not move focus, alter URL state, clear Draft/Search, append History, or overwrite validation.

**Given** URL state changes after Copy activation but before adapter invocation
**When** the executor compares the captured and current Copy sources
**Then** the stale attempt is cancelled as superseded and emits a truthful non-success outcome
**And** it never writes or reports the prior serialization as the current result.

**Given** Clipboard rejects, throws a typed failure, or reaches its bounded timeout in this story
**When** the outcome settles
**Then** no success message is emitted and a typed actionable Copy failure is queued with the exact attempt ID/source classification but without URL content in diagnostics
**And** URL state, Draft, History, Search, and current focus remain unchanged while the visible actionable failure supports retry.

**Given** Copy is pressed, touched, cancelled before click/up, or activated repeatedly
**When** input arbitration and effect serialization run
**Then** pointer-down alone and cancelled activation create no intent, while each completed activation receives a unique monotonic ID and exactly one terminal acknowledgement
**And** effect `n+1` does not begin until effect `n` is acknowledged.

**Given** rapid mutation/Copy/Undo and Current-versus-Last-Valid fixtures run on supported browsers at the 20,000-character/250+ limit
**When** exact clipboard writes, stale cancellation, messages, focus, privacy, and timing are asserted
**Then** every successful write equals its attempt’s captured still-current serialization, no stale Copy is reported as success, and interaction remains responsive without layout blockage or external URL sinks
**And** required FR15 success-path, NFR4–NFR10, NFR12–NFR16, Copy-source, and stale-attempt evidence cells are recorded as `pass`.

### Story 3.4: Recover Safely from Clipboard Failure and Races

As a web developer,
I want a reliable manual-copy fallback when Clipboard API use fails or remains unresolved,
So that I can still copy the exact attempted URL without an older attempt overwriting newer recovery.

**Acceptance Criteria:**

**Given** the current Copy attempt rejects or returns a typed failure
**When** its outcome is acknowledged
**Then** the Workbench reveals `safe-copy-readonly` containing the exact `attemptedSerialized`, visibly labels it “Current URL” or “Last Valid URL” according to the attempt, focuses it, and selects the complete value
**And** Draft, Current/Last Valid state, Structured View, Search, History, and committed snapshot remain unchanged.

**Given** safe-copy recovery is shown
**When** actionable failure is announced
**Then** valid state uses “Couldn’t copy the Current URL. The Current URL is selected. Use Copy from your device or press Ctrl+C/Command+C.” and invalid-Draft state uses the corresponding “Last Valid URL” wording
**And** the guidance is persistent, platform-neutral, truthful, and available to keyboard, touch, VoiceOver, and TalkBack without claiming Clipboard success.

**Given** a Clipboard write reaches its user-visible bounded timeout but the underlying write cannot be cancelled
**When** timeout is reported
**Then** safe-copy recovery is created immediately from that attempt’s captured serialization while an unresolved-write fence remains active
**And** timeout is reported truthfully without treating the underlying write as settled or permitting an overlapping Clipboard invocation.

**Given** the unresolved-write fence is active
**When** a later Copy activation occurs
**Then** the later attempt becomes `latestCopyAttemptId`, replaces safe-copy recovery with its own exact captured serialization and label, and does not invoke the Clipboard API
**And** the previous attempt’s eventual success, failure, or timeout is acknowledged truthfully but cannot create, focus, replace, or retain recovery for an older attempt.

**Given** multiple Copy outcomes settle out of order
**When** reducer precedence is applied
**Then** only the outcome matching `latestCopyAttemptId` may control current recovery and actionable guidance
**And** every attempt receives exactly one recorded outcome while no older success is presented as the result of a newer attempt and no older failure steals focus.

**Given** safe-copy recovery is visible
**When** the developer uses native keyboard Copy or the touch/VoiceOver/TalkBack selection menu
**Then** the full exact attempted value remains selectable and copyable with its label/help outside any horizontal value scroller
**And** 320px, 400% zoom, text spacing, forced colors, virtual keyboard, and reduced-motion modes preserve access without page-level horizontal scrolling or animation.

**Given** safe-copy recovery is visible
**When** the next Copy attempt begins or any URL mutation commits
**Then** the prior recovery field and actionable guidance clear before the new outcome, while unrelated validation/status channels remain intact
**And** focus follows the new operation’s defined behavior rather than being left on a removed node.

**Given** rejection, exception, timeout, never-settling, late-success, late-failure, rapid retry, mutation-between-attempts, Current, and Last Valid fixtures run across the browser/AT matrix
**When** exact source, selection, focus, race, privacy, responsive, and native-device Copy behavior are asserted
**Then** recovery always contains the latest attempt’s exact serialization, older outcomes never overwrite it, no false success or external URL sink occurs, and every user retains a safe Copy path
**And** required FR15 failure-path, NFR11–NFR17, effect-fencing, clipboard-fallback, and mobile AT evidence cells are recorded as `pass`.

### Story 3.5: Receive Every Outcome Without Losing Focus

As a web developer,
I want clear, ordered feedback for validation and operations,
So that I always know what changed or failed without messages disappearing, conflicting, or interrupting my work.

**Acceptance Criteria:**

**Given** the Workbench reports validation, routine operation outcomes, or failures requiring action
**When** feedback state is created
**Then** `core/session` owns separate inline-validation, polite FIFO/coalescing, actionable-alert, and persistent operation-history channels
**And** components only render those states; one channel never replaces, clears, or masquerades as another.

**Given** a Full URL or structured field is invalid
**When** validation commits, blur/Apply occurs, or the bounded settled-input interval passes
**Then** one persistent visible message is associated through stable error ID plus `aria-invalid` and `aria-errormessage` or appended `aria-describedby`, while existing help references remain
**And** the dedicated assertive validation announcer suppresses intermediate IME and unchanged-keystroke repeats, re-announces explicit identical resubmission by replacing its child or a matrix-tested clear/reinsert sequence, and clears error state/references atomically on correction.

**Given** a parse, Search, synchronization, edit, Add, Remove, Reorder, Undo, or Copy outcome settles
**When** it enters polite status
**Then** the dedicated `role="status" aria-live="polite" aria-atomic="true"` receives it within 100 ms and exposes each queued outcome for at least two seconds
**And** result-count messages coalesce only with newer result counts inside 300 ms, synchronization messages follow the same class rule, and committed-operation outcomes remain FIFO and take precedence over coalescible classes.

**Given** queued committed outcomes would begin exposure more than six seconds after enqueue
**When** overflow is detected
**Then** every participating committed outcome—including current, pending, and incoming—is copied exactly once to persistent visible operation history, pending promoted outcomes leave the FIFO, and the current message completes its minimum exposure
**And** one summary status is enqueued with the exact count; no committed outcome is dropped, duplicated, or falsely summarized.

**Given** an identical polite or assertive message repeats
**When** it must be announced again
**Then** the live-region child is replaced or the matrix-tested clear/reinsert timing sequence is used while visible message continuity is preserved
**And** changing only a React key, internal token, or data attribute is insufficient.

**Given** Copy or another operation fails and requires developer action
**When** actionable feedback is created
**Then** a dedicated persistent `role="alert" aria-atomic="true"` presents specific guidance until retry, success, or relevant state change
**And** it neither overwrites queued validation/polite outcomes nor moves focus except for the explicitly defined safe-copy recovery.

**Given** accepted state changes are confirmed
**When** visual and spoken feedback renders
**Then** static text and non-color cues identify the representation or immutable Managed Piece that changed and the corresponding synchronized state, using the specified literal microcopy patterns
**And** feedback never flashes, animates, opens a modal, shifts layout-critical controls, or steals focus from the active/operation-defined destination.

**Given** validation, Search, rapid mutations, parse races, repeated Undo/Reorder/Copy, clipboard failure, overflow, IME, and identical-message fixtures run across the release browser/AT matrix
**When** timing, precedence, persistence, repeat announcement, focus, visual stability, responsive, reduced-motion, and channel isolation are measured
**Then** every required outcome is visible and announced through exactly the correct channel within its bounds, no committed result disappears, and no URL content reaches diagnostics or an external sink
**And** required FR16, NFR12–NFR17, UX validation/status/alert, microcopy, and overflow evidence cells are recorded as `pass`.

### Story 3.6: Enforce the Trusted Release Evidence Gate

As a developer responsible for release quality,
I want one machine-validated evidence oracle for the complete URL journey,
So that an artifact cannot be promoted unless its semantics, privacy, performance, accessibility, and user trust are proven.

**Acceptance Criteria:**

**Given** a candidate artifact is built
**When** release evaluation begins
**Then** one versioned evidence manifest and evaluator act as the sole story-completion and release oracle, mapping stable required cells to FRs, NFRs, UX cases, architecture gates, fixtures, stories, owner/sign-off, terminal result, evidence link, tested version, matrix/evaluator version, and artifact digest
**And** a mandatory cell passes only as `pass`; `waived`, `skipped`, missing, duplicate, stale-digest, malformed, or unsupported terminal states fail evaluation.

**Given** AG-1, AG-2, and AG-3 implementation evidence is evaluated
**When** the shared corpus runs through core goldens, component interactions, and browser acceptance
**Then** exact URL/Draft/Current/Last Valid semantics, History/Undo serialization and identity, IDN directions, Full-DOM 250+ exposure, focus, validation, Search, Add/Remove/Reorder, Copy, privacy, and capacity assertions agree across layers
**And** any required gate fixture mismatch blocks completion of the mapped story or release as mapped by the manifest; implementation may begin to produce that evidence.

**Given** performance evidence runs on hardware with at least four logical CPU cores and 8 GB RAM
**When** the 20,000-character and 250+ entry fixtures exercise initial parse, Search, every edit/mutation, Undo, and Copy
**Then** initial parse meets the 1-second target and local interactions meet the 100 ms target without freezing, omitted pieces, blocked layout, stale state, or partial publication
**And** the manifest records exact hardware, browser, fixture, measurement method, result, artifact digest, and evidence link.

**Given** compatibility and accessibility evidence runs
**When** exact latest-two-major Chrome, Firefox, Edge, and Safari versions plus Chrome/Edge+NVDA, Firefox+NVDA, Safari+VoiceOver on macOS/iOS, Chrome+TalkBack, and keyboard-only Windows/macOS execute the core journey and every failure path
**Then** keyboard/IME, native/product Undo, focus after DOM movement, live-region timing/repeats, pointer cancellation, virtual keyboard, safe-copy touch/AT recovery, 320px/400% reflow, forced colors, WCAG text spacing, contrast, reduced motion, and WCAG 2.2 AA checks pass
**And** no browser/AT combination may claim support without concrete version and result evidence.

**Given** privacy and lifecycle evidence runs across all journeys
**When** network, console/logging, analytics, crash/error hooks, performance traces, Web Storage, IndexedDB, cookies, query strings, service-worker registration, Clipboard sources, reload, and close behavior are inspected
**Then** no URL, Draft, Managed Piece, clipboard value, or History snapshot reaches a prohibited sink, CSP includes the adopted floor with `connect-src 'none'`, and reload/close clears the session
**And** any prohibited content or persistence blocks release.

**Given** 5–8 representative web developers complete the defined whole UJ-1 journey without assistance
**When** their signed study records are ingested
**Then** unassisted completion equals whole-journey completers divided by all participants without rounding and is at least 0.90
**And** missing participants, incomplete records, assistance outside the protocol, or a lower ratio blocks release rather than being waived.

**Given** synchronization, Undo, and Copy evidence is classified
**When** any settled view/Copy source differs from its committed snapshot, Undo differs in prior exact serialization/identity/required focus, or a write/recovery differs from its attempt’s captured serialization or lets an older attempt overwrite a newer one
**Then** the evaluator records a critical synchronization, Undo, or stale-Copy failure and blocks the gate
**And** release requires zero such critical failures across automated, manual, and representative-user evidence.

**Given** every mandatory cell passes for one content-addressed artifact
**When** promotion is authorized
**Then** the identical tested static bundle and headers move from preview to production over HTTPS with immutable caching for fingerprinted assets and `no-cache` for `index.html`
**And** rollback restores the preceding artifact and headers atomically; runtime environment branches, server URL processing, telemetry, persistence, and untested rebuilds are prohibited.

**Given** any required evidence is absent, stale, failing, or attached to a different artifact digest
**When** the release command evaluates the manifest
**Then** it exits non-zero with stable non-content failure codes and identifies the missing/failed cell without exposing URL fixture content
**And** no preview promotion, production promotion, or success-shaped fallback occurs; required FR1–FR16, NFR1–NFR17, UX-DR1–UX-DR28, and AG-1–AG-3 release cells must all pass.

## Epic 4: Edit URLs in a Clear, Polished Workbench

A developer can use the approved dark workbench with contextual Copy/Add,
independent details and accessible query dragging while exact URL, Draft,
History, Undo, Copy and browser-local privacy remain intact.

**Dependencies:** delivered Epics 1–3. Each new story owns its changed-behavior
tests and mapped Chromium evidence; later integration work and Epic 5's broader
observations are not prerequisites for an earlier story's usable MVP outcome.
No new feature is falsely presented as implemented before its owning story.

### Story 4.1: Use a Polished Dark Workbench with Contextual Copy

As a web developer,
I want a clearly styled workbench with Copy beside the Full URL,
So that I can inspect and export my result without searching for controls.

**Requirements:** RD-UX1–RD-UX3, RD-UX22, RD-UX26–RD-UX29, RD-UX31;
RD-AR1–RD-AR2, RD-AR4–RD-AR6. Direct FR2/FR15/FR16 changes and regression
preservation of FR1–FR16; privacy, capacity and accessibility NFRs remain in force.

**Implementation surfaces:** `src/styles/workbench.module.css` consumes the
approved tokens; `src/app/workbench/Workbench.tsx` owns contextual action layout;
`src/app/pieces/StructuredView.tsx` retains existing rows/actions with styled
fields; `src/app/workbench/Workbench.test.tsx` and `tests/workbench.spec.ts`
cover behavior/reflow. Synchronize the architecture spine and related UX
reconciliation before implementation handoff; update reviewed evidence mappings
for this story's exact changed test identities.

**Acceptance Criteria:**

**Given** the finalized DESIGN tokens and approved dark mockup
**When** the workbench renders
**Then** its 14 colors, eight typography roles, 10px/16px radii, spacing and
component token definitions match the contract, with styled controls and navy
hierarchy using system UI/monospace typography
**And** no light/theme toggle, component library, external font, background grid,
marketing gradient, annotation/mobile-preview rail or new production dependency
is introduced; later interaction components are not advertised as functioning.

**Given** the Full URL panel at a width above 700 CSS pixels
**When** a session, invalid input or long supported URL is displayed
**Then** the labeled wrapping textarea has its 100px minimum, Copy shares its
line and Undo sits below in the same panel without a separate Actions landmark
**And** at 320–700px Copy may wrap below in unchanged reading order, with no
page-level horizontal overflow or clipped labels, feedback or actions.

**Given** valid, invalid-Draft and clipboard-failure states
**When** Copy or Undo is activated from its new position
**Then** the existing exact Current/Last Valid source, chronological History,
attempt fencing, truthful feedback and selected safe-copy recovery are preserved
**And** Draft text, field/native editing guards and required focus behavior do
not change merely because controls move.

**Given** keyboard-only, selected/error/disabled, forced-colors and text-spacing
states
**When** the styled controls are traversed or inspected
**Then** persistent labels and visible 3px-offset focus survive, main reading
targets 7:1, normal text 4.5:1 and functional boundaries/focus 3:1 on actual
surfaces, with the normative control-target and reflow contracts
**And** no meaning relies on color/shadow alone and no WCAG spacing override
clips or hides a required function.

**Given** the delivered baseline and this story's mapped tests
**When** fresh Chromium MVP evidence executes
**Then** intake, edits, Search, Add, Remove, existing reorder, native/product
Undo, exact Copy/recovery, privacy and capacity remain functional
**And** reviewed inventory/coverage identifies the actual executions for this
change; broader-browser/manual release observations remain unverified in Epic 5,
not waived or inferred from the static mock.

### Story 4.2: Show or Hide URL Details Without Losing Context

As a web developer,
I want independent body, path and query detail groups,
So that I can focus on relevant pieces without hiding my URL, errors or recovery.

**Requirements:** RD-UX4–RD-UX6, RD-UX9, RD-UX20–RD-UX24, RD-UX28;
RD-AR1, RD-AR3–RD-AR5. FR2–FR7/FR11/FR14–FR16 and full-DOM accessibility.

**Dependencies:** Story 4.1 and delivered baseline behavior. This story does not
depend on later bottom-Add placement or dragging; current Add/Undo destinations
must already work with disclosure reveal-before-focus.

**Implementation surfaces:** `src/app/pieces/StructuredView.tsx` and
`src/app/workbench/Workbench.tsx` render disclosures, passive context, counts and
external errors; `src/platform/focus/index.ts` and
`src/platform/effects/index.ts` support typed render-ready targets as necessary.
Keep URL mutations in `src/core/session/session.ts`. Extend existing component,
focus/effect and Chromium tests, styles and story evidence.

**Acceptance Criteria:**

**Given** a new valid session
**When** Structured View renders
**Then** URL body details, Paths and Query Parameters are independent initially
expanded groups in source order with unique stable headings/content IDs
**And** keyboard/tap/click toggles one group with correct native disclosure or
equivalent expanded/controlled semantics, never a mutually exclusive accordion.

**Given** collapsed content or a focused descendant
**When** a control-driven or programmatic collapse occurs
**Then** hidden descendants leave tab/browse interaction, control activation
retains control focus and programmatic hiding first relocates descendant focus
**And** Full URL/Copy, committed-state banner, errors, operation feedback and
safe-copy recovery remain outside disclosures; local invalid text is not lost.

**Given** an invalid structured field excluded by Search or group collapse
**When** its persistent external error-summary action is activated
**Then** the action explicitly discloses any needed Search clearing, clears only
when necessary with count feedback, expands/renders the same stable-ID field,
retains rejected text/error/help associations and focuses it unobscured
**And** the summary is not a duplicate live announcer; navigation creates no
entry of its own while legitimate preceding Full URL blur closure is retained.

**Given** Add or Undo resolves to a collapsed destination
**When** the accepted operation applies its existing focus contract
**Then** the owning group expands and the allowed stable target renders before
focus; invalid Full URL Draft stays exact
**And** Add's established Search clearing and Undo's preserved-Search/filtered
fallback remain distinct; disclosure state never changes URL History.

**Given** a supported URL with unmanaged pieces and 250+ query entries
**When** groups render, collapse, expand or are searched
**Then** every expanded source piece appears exactly once in complete native
lists, markerless lists retain explicit list semantics and collapsed headers
report matching counts without changing Search or source order
**And** body shows existing editable Domain forms plus passive supported
scheme/port/userinfo/Fragment; no new unmanaged editor, Search target,
virtualization or content persistence is introduced.

**Given** the story's keyboard, focus, field-draft, group/count and responsive
fixtures
**When** fresh mapped Chromium tests execute
**Then** independent collapse, filtered-error recovery, Add/Undo reveal and
320px/text-spacing/forced-colors behavior have actual execution proof
**And** WebKit/VoiceOver and real manual/zoom observations remain Epic 5 work.

### Story 4.3: Add at the Bottom and Navigate Long Query Lists

As a web developer,
I want Add beneath the query list and short routes back to primary controls,
So that long URLs do not make routine actions hard to reach.

**Requirements:** RD-UX10–RD-UX12, RD-UX20–RD-UX21, RD-UX27, RD-UX29;
RD-AR3–RD-AR5. FR4/FR7/FR8/FR10–FR14 with dense-list focus and capacity.

**Dependencies:** Stories 4.1–4.2 and existing Add/History behavior; no later
selection or drag implementation is required for focus-revealed return links.

**Implementation surfaces:** Workbench/StructuredView and CSS Module replace
duplicate Add placement with top jump/bottom action and utility return links.
Use existing reducer-owned Add and typed focus effects; remove stale top-action
selectors/fallbacks from affected component, focus and Chromium tests and update
their exact reviewed evidence identities.

**Acceptance Criteria:**

**Given** a valid session with full, empty or Search-no-match query results
**When** Query Parameters renders
**Then** one Add Query Parameter button follows the query list and there is no
second top Add button
**And** the top "Skip to Add Query Parameter" and results skip links remain
reachable without traversing rows.

**Given** the query group is collapsed and Search is active
**When** the top Add jump is activated
**Then** it expands query, mounts the sole Add and focuses it without adding,
clearing Search or creating navigation History
**And** any ordinary Full URL blur closes its prior accepted edit normally,
without losing invalid Draft or confusing that entry with an Add.

**Given** Current/Last Valid URL, optional invalid Draft and active Search
**When** the bottom Add is accepted
**Then** existing close-and-rebase ordering is preserved, Search clears with
feedback, query expands and the new entry appends after all source parameters
with existing empty-key/absent-equals/empty-value defaults
**And** its key receives render-ready focus, the accepted Add owns one History
entry, invalid Draft stays exact and Undo restores the pre-Add snapshot.

**Given** focus on a deep query row or beside bottom Add in a 250+ entry session
**When** "Back to Full URL and Copy" or "Back to Search" is activated
**Then** row-focus-revealed and bottom links focus the respective stable
textarea/Search destination with adjacent Copy next in tab order
**And** Search, pinned state if present, invalid text and URL are preserved;
focus is unobscured at 320px/400% reflow without intercepting native edit keys.

**Given** no valid session or a pointer press cancelled before completed
activation
**When** Add is unavailable or aborted
**Then** guidance explains the inactive action and no session, row, URL mutation,
History entry or success outcome is fabricated
**And** required targets, labels and empty/no-match navigation remain perceivable.

**Given** exact Add/Undo and dense-navigation fixtures
**When** fresh story-mapped Chromium evidence executes
**Then** append source order, duplicate preservation, Search clearing,
invalid-Draft chronology and bounded return focus are proven for delivered code
**And** existing evidence does not stand in for new executions or real browser
zoom/manual observations deferred to Epic 5.

### Story 4.4: Distinguish Query Shapes and Changing Row Labels

As a web developer,
I want query rows and feedback to explain their exact state,
So that blank values, duplicate entries and recent outcomes are not ambiguous.

**Requirements:** RD-UX7–RD-UX8, RD-UX25–RD-UX26, RD-UX29;
RD-AR3–RD-AR5. FR3/FR5/FR6/FR8/FR13–FR16 and non-color/state semantics.

**Dependencies:** Stories 4.1–4.3 and existing lossless-model/feedback behavior.
No later handle or drag capability is required.

**Implementation surfaces:** StructuredView and `src/app/pieces/search.ts`
derive current display labels/descriptions from immutable source IDs and raw
query shape; Workbench and CSS Module render external operation history with
existing reducer-owned feedback. Add focused component/Chromium assertions and
core goldens only if touched semantics require them. Do not rewrite working
parser, ID allocation or feedback queues merely for presentation.

**Acceptance Criteria:**

**Given** query entries `flag`, `flag=`, an empty entry and `=`
**When** their rows render or values are edited
**Then** persistent text associated with each value field distinguishes absent
equals, present-but-empty value, empty entry and empty key/value
**And** Add keeps the existing empty-entry default, no-op empty edits preserve
absence, clearing a present value retains equals, and unrelated bytes remain
exact; Full URL can remove equals without adding a presence-toggle feature.

**Given** duplicate keys and immutable row IDs
**When** keys change, entries are added/removed or source order changes
**Then** source ordinal/total and duplicate occurrence/total refresh from their
actual dependencies while IDs, field/error associations and focus remain stable
**And** names identify type, source position, applicable duplicate occurrence
and field/action; display labels are never used as internal identity.

**Given** Search filters separate body/Path/query groups
**When** names, positions and counts are exposed
**Then** filtering does not rename source positions or duplicate membership,
and filtered-result position is separately described within its owning group
**And** any set-position/size semantics describe that group's actual result
list rather than a synthetic cross-group list.

**Given** the existing status queue promotes overflow outcomes
**When** persistent operation feedback is rendered
**Then** exact promoted messages appear once, oldest first, in a labeled ordinary
"Operation feedback" list outside disclosures with readable wrapping
**And** existing timing/promotion rules remain authoritative, there is no extra
live role or focus stealing, outcomes remain for the session until reload/close,
and this list is not product Undo History.

**Given** shape-sensitive and duplicate fixtures such as `?flag&flag=&`
**When** unrelated edits, Add, reorder, Copy and Undo execute
**Then** exact serialized shapes and snapshot IDs remain correct and restored
labels reflect the restored model
**And** fresh mapped Chromium evidence covers names/descriptions/feedback plus
the delivered preservation cases without implying additional-browser coverage.

### Story 4.5: Reveal Query Move Controls Through Focus or Selection

As a web developer,
I want move controls only on the row I am attending to,
So that reordering stays accessible without cluttering every query row.

**Requirements:** RD-UX13–RD-UX14, RD-UX16, RD-UX21, RD-UX26, RD-UX29;
RD-AR3–RD-AR5. FR5/FR9/FR13–FR14 and keyboard/touch/focus requirements.

**Dependencies:** Stories 4.1–4.4 and delivered Up/Down/Undo transitions.
The handle-shaped reveal button is usable now; drag help/gesture affordances
must not claim dragging works until Story 4.6 implements it.

**Implementation surfaces:** StructuredView/Workbench and CSS Module own
on-demand row presentation and pinned selection keyed by immutable PieceId.
Use existing session move/Undo transitions and typed focus adapters; update
component, focus/effect and Chromium tests plus exact evidence mappings.

**Acceptance Criteria:**

**Given** an idle query row with no descendant focus or pinned selection
**When** it renders
**Then** Up/Down controls are absent from visual, tab and interactive browse
access, while a visible named 44px-target reveal button remains available
**And** no Path reveal/drag handle or permanently cluttering Move pair is added.

**Given** focus anywhere in a query row or tap/click/Enter/Space on its handle
**When** selection or focus changes
**Then** Up/Down reveals, `aria-pressed` identifies pinned selection,
`aria-expanded` reports effective visibility and `aria-controls` resolves
**And** another selection transfers the pinned row; unpinning does not hide
controls while the row still contains focus; a focused Move is never unmounted.

**Given** a middle, first, last or one-item query row
**When** Up/Down succeeds or a boundary action is unavailable
**Then** full-source boundaries and stable IDs govern movement; retain the
activated enabled control, otherwise enabled opposite, then row/first field
**And** reveal the target before focus, announce exact old/new position/total
and boundary outcome, and create no History/success for impossible moves.

**Given** Search is active or Undo restores a reordered row
**When** Move or Undo resolves
**Then** source-adjacent movement and existing filtered-target fallback remain
correct, Search is not silently cleared and collapsed allowed targets expand
before render-ready focus
**And** invalid Draft stays exact and one completed reorder retains its one
snapshot entry; on-demand presentation adds no History.

**Given** focus in editable inputs, composition or a selected row
**When** arrow keys, platform Undo or Escape are used
**Then** native editing/composition behavior is preserved; Escape outside editing
may clear pinned state without blurring/hiding a focused Move action
**And** pointer cancellation before completed activation creates no mutation.

**Given** the changed reveal, selection, filtered and boundary focus cases
**When** fresh story-mapped Chromium evidence executes
**Then** keyboard and non-drag pointer access are proven without hover-only
controls, stale IDs or false successful actions
**And** drag itself is not asserted by this story or required for its completion.

### Story 4.6: Drag Query Parameters Without Losing Exact State

As a web developer,
I want to drag a query parameter to another position,
So that I can reorder quickly while preserving duplicates, Undo and keyboard access.

**Requirements:** RD-UX15–RD-UX19, RD-UX13–RD-UX14, RD-UX21,
RD-UX25–RD-UX29; RD-AR1, RD-AR3–RD-AR5. FR3/FR5/FR9–FR14/FR16
with exact-snapshot, focus, pointer-cancellation and privacy requirements.

**Dependencies:** Stories 4.1–4.5 and existing lossless query/History behavior.
Drag becomes a working primary gesture in this story; Up/Down remains a complete
keyboard, screen-reader and non-drag pointer alternative.

**Implementation surfaces:** Workbench/StructuredView own the handle gesture,
transaction-local preview and insertion indicator; CSS constrains touch behavior
to handles. Extend existing pure lossless reorder/session transitions for an
explicit validated source/destination rather than replaying multiple Up/Down
mutations. Keep committed snapshots in the reducer and typed render-ready
handle focus in platform adapters. Update exact core/session, component/focus,
gesture and Chromium evidence identities; no new production dependency.

**Acceptance Criteria:**

**Given** Search is empty and a query handle receives pointer interaction
**When** a recognized drag begins after ordinary focus/blur processing
**Then** capture the immutable source ID and current source revision, show
readable source/destination positions and a non-color-only insertion indicator
**And** preview stays outside committed URL/History, Paths never reorder and
visible indexes never substitute for identity or source validation.

**Given** a valid unchanged source revision and a changed valid destination
**When** completed drop is accepted
**Then** one reducer-owned reorder preserves IDs, duplicates, raw values,
query shapes and required delimiter rules, and records exactly one reorder entry
**And** focus/selection resolves to the moved handle after rendering, labels
refresh, exact Undo restores the snapshot and invalid Full URL Draft stays exact.

**Given** a same-position, invalid/outside or missing-target drop, Escape,
pointer cancellation/lost capture, changed source revision or activated Search
**When** the transaction ends or becomes invalid
**Then** preview clears and no reorder entry or false success is created
**And** preceding ordinary Full URL blur-close History is retained; cancellation
says no reorder was saved, never that all History stayed unchanged.

**Given** any nonempty Search, including one matching every query row
**When** the user attempts dragging
**Then** no drag transaction starts and visible guidance says to clear Search
to drag, without clearing it automatically
**And** handle selection/reveal and source-order Up/Down remain operable; the
whole handle is not disabled merely to disable its drag gesture.

**Given** touch or mouse interaction on and outside a query handle
**When** a tap stays a tap or movement crosses the chosen drag threshold
**Then** taps retain selection behavior, a recognized drag suppresses its
post-drag synthetic click, and outside-handle scroll/text selection remain native
**And** capture/touch-action is handle-scoped; documented tested threshold and
edge-scroll mechanics permit long-list drops without hover/long-press discovery.

**Given** rapid destination changes during a drag
**When** preview is announced or the transaction drops/cancels
**Then** only the latest changed logical destination is coalesced at 300ms,
bound to transaction/revision, and pending preview is invalidated before final
feedback, including after source/Search/lifecycle changes
**And** static destination text stays readable; transient previews never enter
persistent operation feedback or announce after a completed/cancelled drag.

**Given** exact-shape, duplicate, stale-source, boundary and cancellation fixtures
**When** fresh core/component and real Chromium pointer-path tests execute
**Then** arbitrary changed drops own one entry, all rejected/cancelled/no-op
paths own zero reorder entries, prior blur-close chronology remains correct
and moved-handle focus, touch policy and announcement fencing are proven
**And** browser simulation is not claimed as physical mobile/AT/manual evidence,
and later integration Story 4.7 is not required to prove this story's behavior.

### Story 4.7: Complete the Redesigned Journey at Supported Limits

As a web developer,
I want the redesigned workbench to stay reliable with long, complex URLs,
So that improved appearance never compromises editing or recovery.

**Requirements:** RD-UX30, integrated RD-UX1–RD-UX31;
RD-AR4–RD-AR6. Preserve FR1–FR16 and NFR1–NFR17 without claiming
unexecuted browser, manual or usability coverage.

**Dependencies:** Stories 4.1–4.6, each already usable and proven for its own
mapped scope. This story connects the completed capabilities into journey and
limit evidence; it is not a deferred acceptance prerequisite for earlier stories.

**Implementation surfaces:** Extend existing shared exact fixtures and
`tests/workbench.spec.ts` journey/capacity/privacy scenarios, reusing core and
component proof rather than rebuilding completed behavior. Deliberately revise
reviewed inventory/coverage and related release mappings for exact changed
identities; use the existing evidence runner, supported runtime and local
cache/browser prerequisites. Fix only integration defects this work exposes.

**Acceptance Criteria:**

**Given** the delivered redesign and EXPERIENCE UJ-1 plus Flows 2–3
**When** Devon completes valid intake, Search/edit/variation/Undo, top jump,
bottom Add and exact Copy, then the invalid-Draft and IDN/high-density paths
**Then** synchronized Current/Last Valid, clipboard recovery, removal, handle
selection, Up/Down, explicit Search clearing, cancelled/accepted drag and
stepwise Undo work together with specified focus and feedback
**And** the final full Undo restores Initial URL bytes and identities exactly,
not merely a canonical equivalent; recovery never changes the attempted source.

**Given** `A→B` Full URL editing followed by exact invalid `X`
**When** jump/cancel/Add/drop and subsequent Undo/correction are exercised
**Then** ordinary blur records at most the legitimate `A→B` entry, navigation
and cancelled/no-op drag add none, accepted Add/drop each own one entry against
Last Valid, and correction rebases on the latest committed snapshot
**And** hidden-field error recovery, duplicate-label refresh, absent/empty query
shapes, rapid preview/drop/cancel, overflow feedback and long-list returns have
fresh explicit assertions rather than only a happy-path screenshot.

**Given** a 20,000-character URL with at least 250 query parameters
**When** initial parse, Search, edits, Add/Remove, both reorder methods, Undo
and Copy execute using the existing 260-entry fixtures where applicable
**Then** every expanded piece remains represented, no blocking overflow or
browser freeze occurs, parse meets 1 second and local interactions meet 100 ms
on recorded hardware with at least four logical cores and 8 GB RAM
**And** threshold breaches fail evidence; counts, an unrelated shorter fixture
or relaxed limits cannot substitute for supported-limit execution.

**Given** the canonical 22 components and delivered UI states
**When** Chromium checks keyboard/focus, 320px and wider reflow, text spacing,
actual contrast, control targets, reduced motion and forced colors
**Then** required functions, readable values, errors, selected/drop cues and
recovery remain available without color-only meaning or page-level overflow
**And** No session, parsing/stale publication, valid/invalid Initial/Draft/field,
independent collapse, empty/no-match, clipboard failure and reload are covered;
viewport simulation is not claimed as real 400% zoom or physical mobile proof.

**Given** already-loaded browser-local execution
**When** integrated editing, drag, recovery and reload scenarios are monitored
**Then** URL/Draft/History/clipboard content reaches no external sink or
browser persistence, the loaded app works offline, and reload/close clears
session and promoted operation feedback
**And** no service worker, cold-load offline promise, new production dependency,
telemetry or content-bearing diagnostic artifact is introduced.

**Given** the reviewed evidence contracts and story traceability below
**When** a fresh execution-bound Chromium manifest is produced
**Then** exact changed tests, fixtures, story ownership, artifacts and tested
versions map deliberately, with failures and missing prerequisites explicit
**And** existing gate identities are not silently replaced or weakened;
Firefox/WebKit, released-version OS/mobile, native clipboard/IME, AT, real zoom
and representative-user observations remain unverified Epic 5 release work.

### Epic 4 Story Traceability

These mappings identify implementation responsibility, not completed evidence.
Story 4.7 integrates all delivered capabilities; each earlier story owns its
changed tests and usable outcome independently.

| Requirement | Owning story or stories |
|---|---|
| RD-UX1–RD-UX3 | 4.1 |
| RD-UX4–RD-UX6 | 4.2 |
| RD-UX7–RD-UX8 | 4.4 |
| RD-UX9 | 4.2 |
| RD-UX10–RD-UX12 | 4.3 |
| RD-UX13–RD-UX14 | 4.5; 4.6 adds the working drag gesture |
| RD-UX15 | 4.6 |
| RD-UX16 | 4.5 preserves filtered Up/Down; 4.6 disables filtered drag |
| RD-UX17–RD-UX19 | 4.6 |
| RD-UX20 | 4.2 reveal-aware Remove; 4.3 bottom-Add focus fallback |
| RD-UX21 | 4.2 disclosure-aware Undo; 4.3/4.5/4.6 changed focus paths |
| RD-UX22 | 4.1 |
| RD-UX23–RD-UX24 | 4.2 |
| RD-UX25 | 4.4 persistent outcomes; 4.6 transient preview isolation |
| RD-UX26 | 4.1 visual/bidi floor; 4.4 labels; 4.5/4.6 selection/drop states |
| RD-UX27 | 4.1 reflow/targets; 4.3 navigation; 4.5/4.6 gesture targets |
| RD-UX28 | 4.1 baseline states; 4.2 disclosure; 4.5/4.6 selection/drag |
| RD-UX29 | 4.1/4.3/4.4 baseline navigation/text; 4.5/4.6 selection/Escape |
| RD-UX30 | 4.7 |
| RD-UX31 | 4.1; 4.7 checks final integration against the spines |
| RD-AR1 | 4.1 reconciles handoff; 4.2/4.6 apply grouped focus/blur/drag |
| RD-AR2 | 4.1, retained throughout 4.2–4.7 |
| RD-AR3 | 4.2–4.6 |
| RD-AR4 | 4.1–4.7 |
| RD-AR5 | 4.1–4.7, with fresh exact mapped evidence per changed story |
| RD-AR6 | 4.1/4.7 preserve deferral; Epic 5 owns broader verification |

#### Canonical Component Coverage

Story 4.1 supplies the shared tokens for all 22 components; later stories own
their changed behavior. Story 4.7 checks the complete integrated set.

| DESIGN component | Behavioral owner |
|---|---|
| `full-url-editor` | 4.1 |
| `action-bar` | 4.1 |
| `search-field` | 4.2 |
| `detail-group` | 4.2 |
| `disclosure-control` | 4.2 |
| `passive-url-context` | 4.2 |
| `managed-piece-list` | 4.2 |
| `managed-piece-row` | 4.4; 4.5 selection presentation |
| `piece-type-label` | 4.4 |
| `query-drag-handle` | 4.5 reveal; 4.6 drag |
| `query-move-controls` | 4.5 |
| `drop-indicator` | 4.6 |
| `remove-control` | 4.2/4.3 |
| `add-query-parameter-control` | 4.3 |
| `add-query-jump-link` | 4.3, including return links |
| `undo-control` | 4.1 placement; 4.2/4.3/4.5/4.6 focus integration |
| `copy-control` | 4.1 |
| `safe-copy-readonly` | 4.1 |
| `status-message` | 4.1 placement; 4.4 outcome list; 4.6 drag previews |
| `committed-state-banner` | 4.2 |
| `validation-message` | 4.2 |
| `no-results-state` | 4.2; 4.3 Add/navigation availability |

#### Retained Functional and Nonfunctional Coverage

Original primary FR assignments and Epics 1–3 acceptance bodies remain intact.
This table identifies redesign regression ownership rather than rebuilding them.

| Retained contract | Redesign coverage |
|---|---|
| FR1 | 4.1 intake/state preservation; 4.7 integrated intake |
| FR2 | 4.1 layout; 4.2 full-DOM/context; 4.7 integration |
| FR3 | 4.4 shape/identity; 4.6 lossless drag; 4.7 exact goldens |
| FR4 | 4.2 search/counts; 4.3 navigation/Add; 4.5/4.6 filtered reorder |
| FR5 | 4.4 names/positions; 4.5/4.6 stable-ID movement |
| FR6 | 4.2 validation/reveal; 4.4 shape/label updates; 4.7 edits/IDN |
| FR7 | 4.2/4.3 Remove/fallback; 4.7 integrated removal |
| FR8 | 4.3 sole Add; 4.4 shape defaults; 4.7 journey |
| FR9 | 4.5 Up/Down; 4.6 drag; 4.7 integration |
| FR10–FR12 | 4.1 baseline; 4.2/4.3/4.6 blur/Draft chronology; 4.7 rebase |
| FR13–FR14 | Every changed mutation/focus story; 4.7 exact full Undo |
| FR15 | 4.1 Copy/recovery; 4.7 exact source/races |
| FR16 | 4.2 validation; 4.4 outcomes; 4.6 previews; 4.7 integration |
| NFR1–NFR7 | Preserved throughout; 4.7 privacy/atomic/exact-state integration |
| NFR8–NFR10 | Per-story changed capacity paths; 4.7 measured supported limits |
| NFR11 | Epic 5 broader released-browser verification, not waived |
| NFR12–NFR15 | Per-story keyboard/focus/semantics; 4.7 integrated checks |
| NFR16–NFR17 | Per-story automated checks and 4.7 reflow; Epic 5 manual/real zoom/AT evidence |
