---
name: URL Piece Management
status: final
updated: 2026-09-24
sources:
  - ../../prds/prd-bmad-training-2026-09-24/prd.md
  - ../../prds/prd-bmad-training-2026-09-24/addendum.md
---

# URL Piece Management — Experience Spine

## Foundation

This is a consumer/public, responsive, desktop-first web experience for browser-local, privacy-sensitive URL work. No UI system is inherited. `DESIGN.md` owns visual identity; this file owns information architecture, behavior, states, interaction, accessibility, and journeys.

The PRD glossary, product scope, FR/NFR definitions, privacy limits, and capacity thresholds are authoritative and inherited from the PRD and addendum by reference. UX transition mechanics and stable-identity rules are defined under State Patterns.

## Information Architecture

The page has one `<main>`, one URL Workbench heading, and three uniquely headed sections in this reading order:

1. **Full URL** — a labeled form section containing `full-url-editor`, persistent commit help, and inline validation.
2. **Actions** — a labeled section containing `undo-control`, `copy-control`, the pre-list `add-query-parameter-control`, and operation feedback.
3. **Structured View** — a labeled section containing skip links, `search-field`, normative result summary, `managed-piece-list`, and the semantic after-list Add action.

Use `<section aria-labelledby>` only for these significant named sections. Status containers are not landmarks. Heading and landmark IDs are unique and stable; release testing verifies the landmark/heading rotor output.

Within Structured View, Managed Pieces remain in source order: Domain, ordered Path Segments, then ordered Query Parameters. Search filters visibility without changing source order or original type position. Scheme and Fragment remain visible through Full URL but are not Managed Pieces.

| Surface | Purpose | Primary source coverage |
|---|---|---|
| URL Workbench | Start, inspect, edit, undo, and copy one browser-local session | UJ-1; FR-1–FR-16 |
| Full URL | Enter Initial URL; edit complete URL; retain invalid Draft URL | FR-1–FR-3, FR-10–FR-12 |
| Actions | Undo, Copy, pre-list Add shortcut, and operation feedback | FR-8, FR-13–FR-16 |
| Structured View | Search and manipulate ordered Managed Pieces against Current/Last Valid URL | FR-2–FR-9, FR-11–FR-12 |

## Architecture Gates

This UX package is ready for architecture handoff while its lifecycle status remains draft. Implementation stories are blocked until **every** gate below passes its prototype or fixture exit criteria:

1. **AG-1 — Parser/serializer contract:** decide WHATWG acceptance, percent-octet normalization/casing, encoded `/`, `?`, `&`, `=`, and `#`, invalid percent sequences, Fragment preservation, and exact snapshot/Copy serialization. Exit: fixtures assert exact Draft, Current, Last Valid, Structured View, History, restored serialization, and copied strings across supported browsers, including empty/absent values and untouched content.
2. **AG-2 — IDN mapping and serialization:** decide mapping profile, canonical stored form, normalization, accepted/rejected labels, display reconstruction, conversion failure, mixed-direction isolation, and exact Copy form. The mapping must cover both editable directions. Exit: round-trip fixtures pass for `faß.de`, combining-mark equivalents, Arabic/Hebrew labels, uppercase Punycode, deviation characters, and confusable mixed-script hosts.
3. **AG-3 — Accessible virtualization:** select and prototype one complete, nonduplicated accessible representation mapped to the visually windowed list; ordinary DOM windowing alone is nonconforming. Exit: the 250+ fixture exposes every row once in browse and focus modes, with correct names/order, editing, focus, validation references, Search/Add/Remove/Reorder/Undo behavior, and virtualization-on/off equivalence across the release AT matrix.

These are semantic gates, not UX assumptions. UX requires input that cannot be safely represented to remain editable with a specific plain-language inline explanation, exact History snapshots, and no unrelated mutation changing untouched content.

## Voice and Tone

Microcopy is concise, literal, calm, and explicit about the value preserved or changed. Brand voice belongs in `DESIGN.md`.

| Context | Required pattern |
|---|---|
| Invalid Draft URL | “Draft URL is not valid. Structured View changes use the Last Valid URL.” |
| Unsupported input | “Enter a complete HTTP or HTTPS Absolute URL with a host.” |
| Copy success | “Current URL copied.” / “Last Valid URL copied; Draft URL is unchanged.” |
| Copy failure | “Couldn’t copy the Last Valid URL. The Last Valid URL is selected. Use Copy from your device or press Ctrl+C/Command+C.” Use “Current URL” analogously in valid state. |
| Invalid-draft Undo | “Undid: [mutation]. Last Valid URL and Structured View updated; Draft URL is unchanged.” |
| Reorder | “Moved Query Parameter 7 of 250 to position 6 of 250.” |
| No results | “0 of 253 Managed Pieces shown. No Managed Piece matches ‘term’.” |

Avoid vague “Invalid,” “Done,” or “Copied!” messages that omit the affected source.

## Component Patterns

Behavioral rows pair exactly with `DESIGN.md.Components`; global state, feedback, focus, and accessibility contracts are authoritative in the sections named by each pointer.

| Component | Purpose | Component-specific behavior and pointer |
|---|---|---|
| `full-url-editor` | Edit the complete URL | Native wrapping `<textarea>`; Enter applies and closes without inserting a line break, and pasted CR/LF remains visible as invalid Draft rather than being stripped. See State Patterns and Full URL edit. |
| `action-bar` | Group frequent actions and feedback | Keeps Undo, Copy, and pre-list Add in stable reading/tab order; status outputs do not create a landmark. See Feedback channels. |
| `search-field` | Filter Managed Pieces | Searches Domain, Path Segment, and Query Parameter keys/values case-insensitively. “Clear Search” restores source order, returns focus to the search field, and announces the restored result count; filtering creates no History Entry. See Search. |
| `managed-piece-list` | Expose the complete ordered collection | Uses complete list semantics; virtualization must satisfy the Virtualization contract, and infinite-scroll omission is prohibited. |
| `managed-piece-row` | Edit one Managed Piece | The focused Domain form owns its edit; valid conversion updates its counterpart and committed URL atomically. Invalid Domain text stays local and uses persistent inline validation plus the validation announcer only; polite status is success-only, and actionable alert is reserved for non-field operation failures. Domain cannot be removed. Names use stable source identity plus separate filtered-result position. See Stable item identity and Accessibility Floor. |
| `piece-type-label` | Identify row type and source position | Exposes type, source ordinal/total, and duplicate occurrence as text; only a committed source reorder changes source identity labels. |
| `add-query-parameter-control` | Add before or after the list | Both instances invoke one operation. Active Search is cleared with announcement; the appended row mounts and its key receives focus. One History Entry. See Add and Reduced motion. |
| `undo-control` | Reverse one Committed Mutation | During invalid Draft URL, preserves Draft text and updates Last Valid URL and Structured View. After every visible Undo, focus follows the Undo transition table: the restored or affected logical item when it exists, otherwise the nearest surviving item, then Full URL. Status announces the restored state and unchanged Draft. See Undo transition table and Product Undo shortcut. |
| `copy-control` | Copy the committed source | Copies Current URL, or Last Valid URL while Draft URL is invalid. Failure invokes `safe-copy-readonly` and never reports success. See Copy and Clipboard failure. |
| `safe-copy-readonly` | Recover from Clipboard API failure | Contains and selects the exact attempted source, receives focus, supports native touch/AT and keyboard Copy, preserves Draft and History, and remains until the next Copy attempt or URL mutation. |
| `status-message` | Report operation outcomes | Implements separate polite status and actionable-failure outputs. Neither takes focus except the explicit safe-copy recovery. See Feedback channels. |
| `validation-message` | Associate a persistent field error | Uses `error-{itemId}-{fieldKind}` for structured fields and `error-full-url` for Full URL; IDs are unique and never recycled. See Feedback channels for association, announcement, repeat, and correction behavior. |
| `no-results-state` | Explain an empty filtered result | Shows “0 of M” with “Clear Search”; both Add routes remain reachable. |

## State Patterns

### Draft, continuous-edit, and identity transitions

- **Draft relationship:** while Full URL contains an invalid Draft URL, Structured View, Copy, Undo, and new structured mutations operate on Last Valid URL. Structured mutations update Last Valid URL while preserving Draft URL exactly.
- **Continuous Full URL edit:** focus captures the baseline Current URL. Each valid input state atomically updates Current URL and Structured View. Enter, blur, or the start of another product mutation closes the session and records at most one History Entry from that baseline to the last accepted valid state. Rejected text remains a local Draft and is never committed to History.
- **Close-and-rebase sequence:** before the first Structured View mutation during an invalid Full URL Draft, first close the Full URL edit. If its focus-entry baseline differs from its last accepted valid state, record that transition while retaining the Draft text. Then append each structured mutation chronologically against Last Valid URL. When Full URL is later corrected, use the latest Last Valid snapshot—not the stale focus-entry snapshot—as the new baseline.
- **Stable item identity:** each Managed Piece receives an immutable internal ID for focus, History, validation IDs, and virtualization. Source ordinal and duplicate occurrence change only when URL source order changes; filtering adds a separate result position and never renames source identity.

### Core states

| State | Contract |
|---|---|
| No session | Full URL is primary. Structured View has no rows; Undo and Copy are inactive. State: “Your URL stays in this browser and is cleared when you reload or close this page.” |
| Parsing | Assign every parse a monotonically increasing generation tied to the exact input snapshot. Keep focus in Full URL; set Structured View `aria-busy="true"` and show “Parsing URL…” only after a short delay. Cancel superseded work where possible, and discard every completion whose generation or input value is stale. Only the latest matching generation may atomically publish final rows or rejection, clear busy, and announce completion. Copy and Undo continue against Last Valid; a new product mutation supersedes the parse rather than waiting behind it. Never expose partial rows. |
| Active valid | Full URL and Structured View encode Current URL; Copy uses that exact value. |
| Invalid Initial URL | Keep entered text and inline error. Do not create or replace Initial URL, Current URL, or History. |
| Invalid Draft URL | Keep Draft URL visible. Structured View remains editable against Last Valid URL. Each accepted structured mutation atomically updates Last Valid URL, Structured View, History, and Copy source while Draft URL remains unchanged. |
| Invalid Managed Piece | Keep field available for correction; set field-specific error semantics; do not commit or corrupt Last Valid URL. |
| Clipboard failure | Reveal/select exact Current URL or Last Valid URL in `safe-copy-readonly`, focus it, preserve Draft URL, expose the native device Copy action, and announce platform-neutral guidance through actionable failure. |
| Reload/close | Clear session, Draft URL, Current/Last Valid URL, History, Search, and safe-copy field. Return to No session; no URL content persists. |
| Reduced motion | No animated scrolling, flashing, or moving highlight. Use static outline/text; status persists until replaced by the next related outcome or related operation begins. |

### Feedback channels

1. **Inline validation:** one persistent visible message per invalid field, with no live-region role on the whole list. Structured fields use `error-{itemId}-{fieldKind}` (`domain-unicode`, `domain-ascii`, `path`, `query-key`, or `query-value`); Full URL uses `error-full-url`. Set `aria-invalid="true"` and append the error ID through `aria-errormessage` or `aria-describedby` without removing help references. The dedicated assertive validation announcer speaks on committed validation, blur, explicit Apply, or a bounded settled-input interval validated across the release matrix; it never asserts intermediate IME composition states. Suppress unchanged keystroke repeats. An explicit re-submit or re-Apply of the same invalid value must replace the announcer child node or use a matrix-tested clear/reinsert sequence; changing only a key, token, or data attribute is insufficient. Persistent visible errors remain throughout editing. On correction, clear error state and references atomically.
2. **Polite operation status:** dedicated `role="status" aria-live="polite" aria-atomic="true"` with deterministic application-owned per-class queues. Insert an operation outcome within 100 ms after the operation settles, expose each queued outcome for at least 2 seconds, and dequeue it on the application’s 2-second timer. Result-count messages coalesce only with newer result counts inside a 300 ms window; synchronization messages follow the same rule. Committed-operation outcomes—Copy, Undo, reorder, and parse result—are FIFO, take precedence over coalescible classes, and begin exposure within 6 seconds of enqueue. If sustained input would exceed that bound, expose every outcome immediately in persistent visible operation history and enqueue one summary status naming the count; never drop a committed outcome. The release browser/AT matrix may lengthen these bounds but may not shorten them. The application never attempts to detect AT speech. Remove the prior message only as the next message node/text is inserted. For identical repeats, replace the live-region child node or clear then reinsert in the tested timing sequence; changing only an internal token, key, or data attribute is insufficient.
3. **Actionable failure:** dedicated `role="alert" aria-atomic="true"` only for failed Copy or other operation failures requiring action. It does not overwrite queued validation. Visible failure persists until the operation is retried, succeeds, or the relevant state changes.

One channel never replaces another. No visible message auto-removes before it can be read.

### Undo transition table

Search remains active unless noted. Targets are resolved by immutable ID; a virtualized target is mounted before focus.

| Reversed mutation | Restored state | Focus after visible Undo | If Search hides target |
|---|---|---|---|
| Add Query Parameter | Added row removed | Focus nearest surviving Managed Piece; if none, focus Full URL | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the affected item is filtered |
| Remove Path Segment / Query Parameter | Exact row recreated | Focus the recreated row’s corresponding control by immutable ID | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the restored item is filtered |
| Edit Managed Piece | Prior exact value restored | Focus the restored field by immutable ID | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the affected item is filtered |
| Reorder Query Parameter | Prior order restored | Focus the moved row’s enabled Move control, otherwise its first editable control | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the moved item is filtered |
| Full URL continuous edit | Exact prior serialized URL restored | Focus Full URL; Full URL and rows update atomically | Focus Full URL; result summary updates |

During invalid Draft URL every row above additionally preserves Draft text and announces: “Draft URL is unchanged.”

## Interaction Primitives

- **Full URL edit:** `full-url-editor` is a native textarea because long URLs must wrap. Enter applies/closes the edit and never inserts a newline; the persistent instruction precedes the editor in its accessible description. Shift+Enter is also rejected as a line break and leaves the draft unchanged. While `event.isComposing` or composition remains active, Enter and Shift+Enter only confirm composition: they never Apply, close, reject a line break, or mutate History. Handle either key only after composition ends, and include the case in release-matrix IME evidence. Paste is never silently normalized.
- **Search:** filters without mutation/history. Result count updates politely after input settles, not on every raw keystroke. Activating “Clear Search” restores all results, returns focus to `search-field`, and announces the restored count without moving focus into the list.
- **Add:** keyboard-reachable action before list and semantic duplicate after list. “Skip to Add Query Parameter” and “Skip to Structured View results” links precede the list.
- **Remove:** use a labeled action with no drag dependency. Capture the removed immutable ID and activated subcontrol. In post-removal visible source order, search next and then previous for the nearest row that actually exposes the same subcontrol. If none and filtered survivors exist, focus “Clear Search”; otherwise focus the semantic after-list Add control, then the Structured View heading if Add is unavailable. Mount and scroll the destination before focusing it, then announce the removed type and original position.
- **Reorder:** use labeled Move Up/Move Down controls; pointer drag, if added later, is supplementary. After DOM movement, keep focus on the activated Move control unless it becomes natively disabled at the new boundary; then focus the row’s enabled opposite Move control, or the row container/first editable control when neither Move control is available. Announce old position, new position, total, and the boundary outcome. An impossible boundary activation and a one-item list create no History Entry or success announcement.
- **Product Undo shortcut:** intercept `event.key === "z"` only with the platform primary modifier (`Ctrl` on Windows/Linux, `Meta` on macOS), without Alt/AltGraph, and only outside native editing. Never intercept when target or active element is `input`, `textarea`, editable `select`, `contenteditable` or its descendant; when `event.isComposing`; or when a text selection belongs to an editing host. Browser-native Undo wins in those cases. Visible Undo remains available.
- **Copy:** persistent Copy uses Current/Last Valid URL. Failure invokes safe-copy recovery with platform-neutral guidance; the selected read-only value supports keyboard Copy and the native touch/VoiceOver selection menu.
- **Pointer cancellation:** Add, Remove, Reorder, Undo, Copy, and Clear Search mutate only on the up/click event. Moving away or cancelling before release prevents activation; no V1 mutation occurs on pointer-down.
- **Escape:** may dismiss transient disclosure only; never discards Draft URL or mutates Current/Last Valid URL.
- **Banned:** hover-only actions, color-only states, silent normalization, modal routine mutations, infinite-scroll omission, or network requests containing URL content.

## Accessibility Floor

- WCAG 2.2 AA applies to the complete UJ-1 path and failure states.
- Tab order: Full URL → Undo/Copy/pre-list Add → skip links/Search → visible ordered rows → semantic after-list Add. Landmarks/headings expose the same structure.
- Reflow is normative at 320 CSS px and 400% zoom. No required label, error, status, or action causes page-level horizontal scrolling; only essential URL value fields may scroll internally.
- Every pointer target is at least `{spacing.pointer-min}` by `{spacing.pointer-min}` at all widths or meets the spacing exception. Primary and destructive controls target `{spacing.control-target}` by `{spacing.control-target}`.
- Focus uses the DESIGN two-layer rule on blue controls and system outlines in forced colors.
- Duplicate controls follow the naming formula in `managed-piece-row`: stable source ordinal and source occurrence remain in the name, while filtered-result position is separate. `aria-posinset`/`aria-setsize` describe the filtered result list; source position remains explicit text.
- Both “Unicode Domain” and “ASCII/Punycode Domain” are editable and linked by shared help. The focused form owns the active edit; successful validation/conversion atomically updates the counterpart and committed URL and uses polite status. Invalid text remains a local field Draft and uses persistent inline validation plus the dedicated validation announcer only. Actionable alert is reserved for non-field operation failures, and duplicate speech is prohibited. Each value uses bidi isolation and URL tokens use `dir="ltr"` without altering stored characters. Exact mapping, reconstruction, and Copy serialization remain an architecture gate.

### Virtualization contract

Virtualization is allowed only if architecture produces **one complete, nonduplicated accessible representation mapped to the visually windowed list** and all requirements below pass with the 250+ fixture. Ordinary DOM windowing alone is nonconforming because absent rows are not browseable.

- Every Managed Piece has a stable, non-recycled immutable key and unique field/error IDs.
- The accessibility representation preserves every row, complete list size, source position, type, and duplicate occurrence. Use native list semantics plus correct `aria-setsize`/`aria-posinset` when needed.
- Keyboard or programmatic navigation mounts the target before moving focus; focus is never sent to an absent node.
- Screen-reader browse mode can reach every row, not merely the rendered window.
- Search, Add, Remove, Reorder, validation, and Undo preserve identity while rows mount/unmount.
- Automated and manual equivalence tests compare virtualization on/off for row count, order, names, focus outcomes, errors, browse-mode traversal, and exact mutations. If equivalence is not demonstrated, ship without virtualization.

### Release browser/AT matrix

At each release, record exact minimum versions corresponding to the PRD’s latest-two-major requirement and pass the core journey plus all failure paths on:

- Chrome and Edge with NVDA on Windows;
- Firefox with NVDA on Windows;
- Safari with VoiceOver on macOS;
- Safari with VoiceOver on iOS for the supported narrow-width fallback;
- Chrome with TalkBack on supported Android versions;
- keyboard-only runs without AT on Windows and macOS.

Clipboard fallback—including the native touch/VoiceOver/TalkBack copy menu without a hardware keyboard—virtual keyboard behavior, live regions, focus after DOM movement, 320px reflow, forced colors, native/product Undo, IME composition, parse-race handling, and virtualization equivalence are mandatory matrix cases. A rolling release cannot claim support until the concrete version record is attached to release evidence.

## Inspiration & Anti-patterns

Raw Full URL and Structured View must synchronize dependably; browser-local operation and utility clarity must remain obvious. Parsing/stringifying is an implementation baseline, not the interaction model. Do not expand into API-client or tool-suite chrome. Complete Undo, cross-piece Search, and explicit Query Parameter ordering remain visible and testable rather than drag-only, implicit, or decorative.

## Responsive & Platform

| Width/platform | Behavior |
|---|---|
| `≥1024px` | Full URL and Actions may remain visible while Structured View scrolls; row fields/actions may share a line with persistent labels. |
| `768–1023px` | Single-column regions; row actions wrap; all focus/status content remains visible. |
| `320–767px` | Stacked fallback with identical data/actions, 24×24 minimum targets, and no page-level horizontal scrolling. |
| `400% zoom` | Equivalent 320 CSS px contract; essential URL fields alone may scroll horizontally. |
| Reduced motion | Instant mounting/scroll positioning and static change cues. |
| Forced colors | Native/system-color outlines and perceivable boundaries; no box-shadow-only state. |

## Key Flows

### UJ-1. Devon safely changes a deep-link configuration.

1. Devon opens the Workbench and reads or hears: “Your URL stays in this browser and is cleared when you reload or close this page.”
2. Devon pastes a supported Absolute URL; parsing completes with a Managed Piece count.
3. Devon searches, edits a Query Parameter, and verifies synchronized Current URL.
4. Devon tests a second variation, then invokes Undo; the exact prior serialized URL is restored.
5. Devon uses pre-list Add or skip-to-Add, appends a parameter, and focus lands on its key.
6. **Climax:** Copy confirms the exact Current URL source; Devon can Undo to Initial URL.

Failure: Clipboard failure reveals, selects, and focuses labeled Current URL without changing URL state; Devon uses the native device Copy action or Ctrl+C/Command+C.

### Flow 2 — Devon keeps working during an invalid Draft URL

1. Devon makes Full URL invalid; Draft URL remains visible with associated error.
2. Before Devon’s first Structured View edit, the open Full URL session closes from its focus baseline to its last accepted valid state; Draft text remains exact. Structured mutations then append chronologically against Last Valid.
3. Devon invokes Undo; the latest committed mutation reverses, focus moves to the restored or affected logical item under FR-14, and status announces both the restored Last Valid state and unchanged Draft.
4. Devon invokes Copy. On failure, labeled Last Valid URL appears selected while Draft URL remains visible.
5. Devon corrects and applies Full URL; its History Entry is rebased on the latest Last Valid snapshot after the structured mutations.
6. **Climax:** both representations synchronize without losing the prior draft work or structured history.

### Flow 3 — Devon verifies IDN and high-density behavior

1. Devon loads the 20,000-character/250+ fixture with duplicates, encoded delimiters, Unicode Domain, and Fragment.
2. Devon edits the Unicode Domain and then the ASCII/Punycode Domain; whichever form has focus owns the edit.
3. Accepted conversion updates the counterpart atomically and uses polite status. Invalid input remains local and uses persistent inline validation plus the dedicated validation announcer only. Both values are bidi-isolated, and the same outcome is never announced through multiple channels.
4. Devon filters duplicate parameters and hears “N of M”; names retain source ordinal/occurrence and add separate result position.
5. Devon adds, removes, reorders, and undoes by keyboard; specified focus and announcements occur, including boundaries.
6. Devon traverses every row in browse/focus modes with virtualization on and off equivalence.
7. **Climax:** no piece is omitted, all primary actions remain reachable, and exact Copy/Undo integrity holds.

### Observable acceptance evidence

| Requirement | Trigger | Observable result / failure criterion | Flow reference |
|---|---|---|---|
| FR-1 | Enter relative, domain-only, non-HTTP(S), or input that cannot be safely represented | Show specific plain-language inline guidance and leave the existing session and History unchanged. Fail if input creates/replaces a session or receives only a generic error. | Flow 1 step 2; Flow 3 step 1 |
| FR-2 | Parse a supported Absolute URL | Publish Domain, ordered Path Segments, and ordered Query Parameters atomically with a Managed Piece count; preserve Scheme and Fragment in Full URL. Fail on partial, omitted, duplicated, or reordered output. | Flow 1 step 2; Flow 3 steps 1, 6 |
| FR-3 | Edit mixed Unicode/RTL and ASCII/Punycode Domain forms, including an invalid intermediate | The focused form owns the edit; valid conversion atomically updates counterpart and committed URL; invalid text stays local; labels, isolation, and status persist. Fail if invalid text changes its counterpart/Current URL, accepted forms diverge, or serialization is unverified. | Flow 3 steps 2–3 |
| FR-4 | Search Domain, Path Segment, Query Parameter keys, and values with mixed case | Filter case-insensitively and announce “N of M” without mutation or History. Fail if source order changes or unsearched fields determine results. | Flow 1 step 3; Flow 3 step 4 |
| FR-5 | Filter duplicate Query Parameters, clear Search, and inspect names | Preserve source ordinal/occurrence, expose filtered result position separately, and restore source order on “Clear Search.” Fail if filtering renames source identity or clearing reorders items. | Flow 3 step 4 |
| FR-6 | Edit each Managed Piece type with valid and invalid values | Valid edits atomically update committed URL and Structured View; invalid field text remains local and correctable. Fail on partial commit, unrelated serialization change, or lost Draft. | Flow 1 step 3; Flow 3 steps 2–3 |
| FR-7 | Remove a Path Segment or Query Parameter in filtered and unfiltered sets | Remove exactly the target and follow the Remove focus fallback sequence. Fail if Domain is removable, identity drifts, or focus becomes absent/lost. | Flow 3 step 5; Interaction Primitives: Remove |
| FR-8 | Invoke either Add route with and without active Search | Both routes clear active Search with announcement, append after all Query Parameters, mount the row, focus its key, and create one History Entry. Fail if routes differ or focus is lost. | Flow 1 step 5; Flow 3 step 5 |
| FR-9 | Move Query Parameters at middle and boundary positions | Preserve stable row identity and announce old/new position and total. Retain the activated Move control only while enabled; at a new boundary focus the enabled opposite Move control, then the row container or first editable control if neither Move control is available. Disable impossible moves. Fail on drag dependency, boundary History, lost focus, or false success announcement. | Flow 3 step 5; Interaction Primitives: Reorder |
| FR-10 | Focus Full URL, enter successive valid states, then close on Enter or blur | Synchronize each valid state immediately and record at most one baseline-to-last-valid History Entry. Fail if intermediate valid states create multiple entries or the last accepted serialization is lost. | Flow 1 steps 2–4; Flow 2 steps 1–2 |
| FR-11 | Keep an invalid Full URL Draft while editing Structured View | Preserve Draft text exactly while Structured mutations operate on and update Last Valid URL. Fail if Draft is cleared, normalized, committed, or described as synchronized. | Flow 2 steps 1–5 |
| FR-12 | Correct an invalid Full URL Draft after structured mutations | Atomically synchronize Full URL and Structured View from the corrected URL while preserving chronological History. Fail if correction uses a stale baseline or unrelated content changes. | Flow 2 steps 2, 5–6 |
| FR-13 | Perform Add, Remove, Edit, Reorder, and a continuous Full URL edit | Append one exact chronological History Entry per Committed Mutation with immutable target identity. Fail if accepted mutations are missing, duplicated, merged incorrectly, or reordered. | Flows 1–3; Undo transition table |
| FR-14 | Undo every mutation type, including while Draft URL is invalid | Restore the exact prior serialized URL and row state. Focus the restored or affected logical item when it exists; otherwise focus the nearest surviving item, then Full URL. During invalid Draft, retain Draft text and announce both outcomes. Fail if Undo resurrects rejected text, restores a stale branch, loses focus, or intercepts native editing Undo. | Flow 1 steps 4, 6; Flow 2 step 3; Flow 3 step 5 |
| FR-10, FR-11, FR-13, FR-14; NFR-4–NFR-7 — exact close-and-rebase case | Let Initial/current be `A`; focus Full URL at baseline `A`; accept valid `B`, then `C`; type invalid `X`; blur; run structured mutations `S1` producing `D` and `S2` producing `E`; correct Full URL to valid `F`; then invoke product Undo repeatedly. | Blur closes as `[A→C]`, Last Valid `C`, Draft `X`. Before `S1`, the Full URL edit is already closed; `S1` appends `[C→D]`, then `S2` appends `[D→E]`, with Draft still `X`. Correction starts from latest Last Valid `E`, appends `[E→F]`, and clears `X`. Undo restores `E`, `D`, `C`, then `A`, never `X`. Fail if any accepted state is unrecorded, structured edits are erased/reordered, or Undo restores a stale branch. | Flow 2 steps 1–6 |
| FR-15 | Copy in valid state, invalid Draft state, and Clipboard API failure | Copy exact Current URL or Last Valid URL as applicable; on failure reveal, select, and focus the exact source without reporting success or changing state. Fail if Draft text is copied as committed or the fallback source differs. | Flow 1 step 6/failure; Flow 2 step 4 |
| FR-16 | Trigger validation, parse, Search, mutation, Undo, Copy, and actionable failure outcomes | Route each outcome through its defined channel with required persistence, ordering, and repeat behavior. Fail if one channel overwrites another, committed outcomes disappear unannounced, or failure steals focus outside safe-copy recovery. | Flows 1–3; Feedback channels |
| NFR-1 | Start a session and inspect processing behavior and the browser-local notice | Parsing, editing, Search, History, and Copy-source preparation occur in the browser; the notice states this plainly. Fail if core URL processing depends on a server or the notice is absent or contradictory. | Flow 1 step 1; all flows |
| NFR-2 | Inspect network, storage, telemetry, logs, errors, crashes, and performance traces throughout all flows | No URL content, Draft text, clipboard content, History snapshot, or related payload is transmitted, persisted, logged, or included in off-device diagnostics. Fail on any prohibited outbound request, persistence, telemetry, or trace content. | Flow 1 step 1; all flows |
| NFR-3 | Reload after valid state, invalid Draft, Search, History, and safe-copy reveal | Return to No session with no URL content, History, Search, or fallback value persisted. Fail if prior content or restorable state remains. | Flow 1 step 1; Reload/close state |
| NFR-4 | Perform each accepted Full URL and Structured View mutation | Update Full URL, Structured View, History, and Copy source atomically. Fail on any partial publication or stale source. | Flows 1–3; State Patterns |
| NFR-5 | Attempt invalid Full URL and Managed Piece edits before and after committed mutations | Preserve Last Valid URL and its History exactly. Fail if rejection corrupts, replaces, or makes a prior state unrestorable. | Flow 2; Core states |
| NFR-6 | Undo every History Entry to Initial URL | Restore the exact Initial URL serialization from exact Full URL snapshots, not merely a canonical equivalent. Fail on normalization drift or missing snapshot data. | Flows 1–3; Undo transition table |
| NFR-7 | Search, edit, add, remove, reorder, and Undo duplicates and empty/absent values | Omit, merge, or reorder no Managed Piece except through the accepted action. Fail on identity drift, silent merging, or unrelated ordering changes. | Flow 3 steps 4–6 |
| NFR-8 | Run the supported 20,000-character and 250+ Query Parameter fixture | Keep every required operation available and every Managed Piece reachable. Fail on a lower effective limit or inaccessible omission. | Flow 3 steps 1, 4–6 |
| NFR-9 | Exercise parse, Search, editing, reorder, Undo, and Copy at the supported limit | Complete without browser freezing, omitted pieces, or layout overflow that blocks operation. Fail on frozen input, missing data, or blocked controls. | Flow 3 steps 1, 4–6 |
| NFR-10 | Measure initial parse and local interaction response on reference hardware | Meet the 1-second initial parse target and 100 ms local interaction target on hardware with at least 4 logical CPU cores and 8 GB RAM. Fail on target breach. | Flow 3 steps 1, 4–6 |
| NFR-11 | Run core and failure flows on recorded latest-two-major browser/AT versions | Equivalent semantics, focus, announcements, fallback, virtual keyboard behavior, and Undo guards pass for every supported combination. Fail if any combination lacks an equivalent safe path or concrete version evidence. | Flows 1–3; Release browser/AT matrix |
| NFR-12 | Complete every V1 action using keyboard only | Require no pointer drag; all actions and safe recovery paths remain operable. Fail on keyboard traps or pointer-only behavior. | Flows 1–3; Interaction Primitives |
| NFR-13 | Edit, add, remove, restore, and reorder Managed Pieces | Retain active-control focus during editing and apply the deterministic focus outcomes in FR-7–FR-9 and FR-14 after structural changes. Fail on absent, lost, or unpredictable focus. | Flow 3 step 5; focus and Undo tables |
| NFR-14 | Inspect piece types, validation, change confirmation, and disabled actions in normal and forced-colors modes | Convey every meaning in text or programmatic state, never by color alone. Fail if removing color removes meaning. | Flows 1–3; DESIGN.md Colors |
| NFR-15 | Inspect names, validation associations, status queues, Domain conversion feedback, and focus behavior | Expose complete accessible names, programmatically associate each validation message, and announce nonblocking status without moving focus. Fail on broken IDs, duplicate speech, missing names, or unexpected focus movement. | Flows 1–3; Feedback channels |
| NFR-16 | Run automated and manual WCAG 2.2 AA checks for UJ-1 | Pass keyboard, focus, 200%/400% zoom, contrast, status-announcement, virtualization, pointer-cancellation, and WCAG 1.4.12 text-spacing checks. With line height 1.5×, paragraph spacing 2×, letter spacing 0.12×, and word spacing 0.16×, no label, help, error, status, control, row, or URL content clips, overlaps, hides, truncates, or loses function. | Flows 1–3; Accessibility Floor |
| NFR-17 | Test 320–767px and 400% zoom | Preserve all data/actions without page-level horizontal scrolling; only essential URL value fields may scroll internally. Fail if labels, errors, status, or actions clip or require page scrolling. | Responsive & Platform; Flow 3 |

The spines are authoritative over any future mockup, wireframe, or import when they conflict.
