---
name: URL Piece Management
status: final
updated: 2026-10-09
sources:
  - ../../prds/prd-bmad-training-2026-09-24/prd.md
  - ../../prds/prd-bmad-training-2026-09-24/addendum.md
  - ../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md
---

# URL Piece Management — Experience Spine

## Foundation

This is a consumer/public, responsive, desktop-first web experience for browser-local, privacy-sensitive URL work. No UI system is inherited. `DESIGN.md` owns visual identity; this file owns information architecture, behavior, states, interaction, accessibility, and journeys.

The PRD glossary, product scope, FR/NFR definitions, privacy limits, and capacity thresholds are authoritative and inherited from the PRD and addendum by reference. UX transition mechanics and stable-identity rules are defined under State Patterns. “URL body details” is a presentation group, not a new Managed Piece type: Domain remains the host, Path Segment remains ordered slash-delimited content, Query Parameter remains a lossless ordered query entry, and Fragment remains unmanaged. Scheme, port and userinfo remain unmanaged too.

Breno's approved redesign supersedes only light identity, the separate Actions region, pre-list Add button, and permanent Move controls/optional-future drag. See [redesign reconciliation](reconcile-redesign.md) for explicit source conflicts and upstream work. This is a finalized design specification, not a claim of application delivery; the [current validation report](validation-report.md) records document findings and their corrections. Earlier reviews remain historical.

Presentation actions create no History Entry of their own. Their ordinary focus changes may close an already accepted Full URL edit under the existing blur rule; that prior edit's entry is retained.

## Information Architecture

The page has one `<main>`, one URL Workbench heading, and two major uniquely headed sections in this reading order:

1. **Full URL** — `full-url-editor`, Copy beside the textarea at adequate widths, Undo below, persistent commit help, validation, operation feedback and safe-copy recovery. Copy may wrap below only on narrow screens.
2. **Structured View** — skip links, `search-field`, normative result summary, then three independent initially expanded detail groups: **URL body details**, **Paths**, **Query Parameters**. The sole Add Query Parameter button follows the query list; the top `add-query-jump-link` navigates to it without adding.

Use `<section aria-labelledby>` for significant named sections, not every row/status. Each detail group has an accessible heading/disclosure control and stable controlled-content ID; disclose expanded/collapsed state. Status containers are not landmarks. Heading and landmark IDs are unique and stable; release testing verifies rotor output.

Within Structured View, Managed Pieces remain in source order: Domain, ordered Path Segments, then ordered Query Parameters. The groups may use separate native lists with complete group counts and explicit source positions; every Managed Piece appears exactly once. This group-list delta needs synchronization with architecture AD-7's prior one-list wording; it does not permit virtualization or missing rows.

Body includes both editable existing Unicode and ASCII/Punycode Domain forms and passive context for supported non-path/non-query URL pieces: scheme, port/userinfo when present, and Fragment as represented by the existing parser. Do not invent structured editing, decoding, acceptance, or serialization for these pieces. They remain editable through Full URL only and are not Search matches or new History targets.

Search filters visibility without changing source IDs/order/original type positions. Filtering does not collapse or expand groups. The result summary reports matches independent of disclosure visibility; collapsed headers also report matching counts so matches are not silently mistaken for no results. Add/jump remain available when the query list is empty or has no matches.

`committed-state-banner`, Full URL validation, and a visible associated structured-error summary remain outside disclosures, along with feedback and safe-copy recovery. Invalid-Draft text explicitly says Structured View uses Last Valid URL. Local inline errors remain beside fields when expanded; the external summary identifies each invalid field even while collapsed, with a link that expands its group, mounts and focuses that field. No collapse may silently hide an error.

| Surface | Purpose | Primary source coverage |
|---|---|---|
| URL Workbench | Start, inspect, edit, undo, and copy one browser-local session | UJ-1; FR-1–FR-16 |
| Full URL | Enter Initial URL; edit complete URL; retain invalid Draft URL | FR-1–FR-3, FR-10–FR-12 |
| Structured View | Search and manipulate ordered Managed Pieces against Current/Last Valid URL; top Add jump link | FR-2–FR-9, FR-11–FR-12 |
| URL body details | Edit both Domain forms; inspect passive context without broadening scope | FR-2–FR-3, FR-6 |
| Paths | Edit/remove ordered Path Segments; no Path reorder | FR-2, FR-4–FR-7 |
| Query Parameters | Edit/remove/add; primary handle drag plus on-demand Up/Down | FR-2, FR-4–FR-9 |
| Committed-state/validation/feedback area | Current/Last Valid context, persistent errors, Copy/Undo outcomes and recovery outside disclosures | FR-11–FR-16 |

[Approved dark workbench mockup](mockups/dark-workbench.html) illustrates the valid Workbench, Full URL/Copy placement, expanded body/Paths/query groups, duplicate query rows, selected/focused move controls, bottom Add and narrow wrapping. Native disclosures illustrate collapsed composition. Error, no-session, parsing, filtered/no-match, IDN conversion failure, safe-copy, drag destination/cancel and dense jump-focus mechanics are spine-only. The static preview's old pending/unresolved notes are historical; its aria-hidden grips are not the required interactive handles.

## Architecture Gates

The UX design is finalized, but upstream architecture/requirements synchronization is still required before implementation handoff. Existing AG-1 through AG-3 use
progressive evidence: implementation may begin to produce mapped fixtures and
results, but a story cannot be marked complete until every mandatory gate cell
mapped to that story passes. Evidence mapped only to later capabilities does
not block earlier stories. Release remains blocked until every gate below and
every mandatory release cell passes its exit criteria:

1. **AG-1 — Parser/serializer contract:** decide WHATWG acceptance, percent-octet normalization/casing, encoded `/`, `?`, `&`, `=`, and `#`, invalid percent sequences, Fragment preservation, and exact snapshot/Copy serialization. Exit: fixtures assert exact Draft, Current, Last Valid, Structured View, History, restored serialization, and copied strings across supported browsers, including empty/absent values and untouched content.
2. **AG-2 — IDN mapping and serialization:** decide mapping profile, canonical stored form, normalization, accepted/rejected labels, display reconstruction, conversion failure, mixed-direction isolation, and exact Copy form. The mapping must cover both editable directions. Exit: round-trip fixtures pass for `faß.de`, combining-mark equivalents, Arabic/Hebrew labels, uppercase Punycode, deviation characters, and confusable mixed-script hosts.
3. **AG-3 — Accessible representation:** architecture AD-7 requires full DOM for V1, not virtualization. Exit: the 250+ fixture exposes every row once in browse and focus modes, with correct group/list semantics, names/order, editing, focus, validation references and Search/Add/Remove/Reorder/Undo behavior. Only a formally reopened AD-7 permits the virtualization equivalence path below.

These are semantic gates, not UX assumptions. Architecture AD-2–AD-6 and AD-11 design-close parser/IDN/history choices; evidence remains required, not reopened by this appearance change. Non-domain fields retain raw component text and the AD-3 codec, never invented decoded editors. UX requires input that cannot be safely represented to remain editable with a specific plain-language inline explanation, exact History snapshots, and no unrelated mutation changing untouched content.

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
| Drag disabled by Search | “Clear Search to drag Query Parameters in full source order.” |
| Handle help | “Tap or press Enter/Space to keep move controls visible; drag this handle to reorder.” |
| Drag preview/cancel | “Move Query Parameter [source position] before/after [destination position].” / “Reorder cancelled. URL and History are unchanged.” |
| Add jump | “Skip to Add Query Parameter” — link, not a second Add action. |
| Add during invalid Draft | “Query Parameter added to Last Valid URL. Draft URL is unchanged.” |
| Search cleared by Add | “Search cleared. All [M] Managed Pieces shown.” Follow with the Add outcome in its defined feedback channel. |
| No results | “0 of 253 Managed Pieces shown. No Managed Piece matches ‘term’.” |

Avoid vague “Invalid,” “Done,” or “Copied!” messages that omit the affected source.

## Component Patterns

Behavioral rows pair exactly with `DESIGN.md.Components`; global state, feedback, focus, and accessibility contracts are authoritative in the sections named by each pointer.

| Component | Purpose | Component-specific behavior and pointer |
|---|---|---|
| `full-url-editor` | Edit the complete URL | Native wrapping `<textarea>`; Enter applies and closes without inserting a line break, and pasted CR/LF remains visible as invalid Draft rather than being stripped. See State Patterns and Full URL edit. |
| `action-bar` | Inline Full URL utilities | Copy follows the textarea, Undo follows Copy; feedback and recovery remain outside disclosures. No separate Actions landmark or top Add button. See Feedback channels. |
| `search-field` | Filter Managed Pieces | Searches Domain, Path Segment, and Query Parameter keys/values case-insensitively. “Clear Search” restores source order, returns focus to the search field, and announces the restored result count; filtering creates no History Entry. See Search. |
| `detail-group` | Independently show body/Paths/query | All start expanded. State is presentation-only, never URL/History. No shared accordion exclusivity or auto-collapse. See Disclosure. |
| `disclosure-control` | Toggle one group | Heading/button semantics, accessible name, expanded state and controlled-content relation; keyboard Enter/Space and click/tap work. Hidden content is absent from tab/browse interaction. See Disclosure. |
| `passive-url-context` | Inspect unmanaged supported pieces | Text-only labels/values, not editing controls or Managed Pieces; source is Current/Last Valid model. No network request or persistence. |
| `managed-piece-list` | Expose the complete ordered collection | Native ordered lists retain `<li>` children, visible source positions and explicit `role="list"` when markerless styling is used, including WebKit/VoiceOver. Virtualization must satisfy the Virtualization contract; infinite-scroll omission is prohibited. |
| `managed-piece-row` | Edit one Managed Piece | The focused Domain form owns its edit; valid conversion updates its counterpart and committed URL atomically. Invalid Domain text stays local and uses persistent inline validation plus the validation announcer only; polite status is success-only, and actionable alert is reserved for non-field operation failures. Domain cannot be removed. Names use stable source identity plus separate filtered-result position. See Stable item identity and Accessibility Floor. |
| `piece-type-label` | Identify row type and source position | Exposes type, source ordinal/total, and duplicate occurrence as text. Display labels refresh after committed structural/key changes; only the internal ID is immutable. See Stable item identity. |
| `query-drag-handle` | Primary query reorder plus selection/reveal | Named button includes source ordinal/total and duplicate occurrence. Click/tap or Enter/Space toggles pinned row selection using `aria-pressed`; `aria-controls` points to the move-controls group and `aria-expanded` reports its effective visibility (selection OR row focus). Drag is handle-only. See Reorder and Handle selection. |
| `query-move-controls` | Non-drag Up/Down alternative | Reveal whenever focus is anywhere in the query row or it is selected; stay focusable while revealed, including when a Move control has focus. Disabled boundaries use full source positions, not filtered ordinals. See Reorder. |
| `drop-indicator` | Expose pending destination | Static marker with text and polite destination announcement; temporary presentation state only. Drop/cancel outcomes follow Reorder, never an interim URL mutation. |
| `remove-control` | Remove exactly one path/query | Stable target ID, labeled action, no Domain removal. Follow Remove focus fallbacks. |
| `add-query-parameter-control` | Sole bottom-of-query Add action | Append after the full source query list, clear active Search with announcement, expand query group, mount and focus new key. One accepted Add History Entry, including during invalid Draft. See Add. |
| `add-query-jump-link` | Navigate between query actions and utilities | Top link expands Query Parameters if collapsed, mounts and focuses bottom Add without adding or clearing Search. Bottom and focus-revealed row return links focus Full URL or Search. Navigation creates no entry of its own; ordinary blur may close a preceding accepted Full URL edit. See Utility navigation. |
| `undo-control` | Reverse one Committed Mutation | During invalid Draft URL, preserves Draft text and updates Last Valid URL and Structured View. After every visible Undo, focus follows the Undo transition table: the restored or affected logical item when it exists, otherwise the nearest surviving item, then Full URL. Status announces the restored state and unchanged Draft. See Undo transition table and Product Undo shortcut. |
| `copy-control` | Copy the committed source | Copies Current URL, or Last Valid URL while Draft URL is invalid. Failure invokes `safe-copy-readonly` and never reports success. See Copy and Clipboard failure. |
| `safe-copy-readonly` | Recover from Clipboard API failure | Contains and selects the exact attempted source, receives focus, supports native touch/AT and keyboard Copy, preserves Draft and History, and remains until the next Copy attempt or URL mutation. |
| `status-message` | Report operation outcomes | Separate polite status and actionable failure, plus a labeled chronological ordinary list of overflow outcomes outside disclosures. History entries here are feedback, not product Undo History; no extra live-region role or focus stealing. Retain exact outcomes for the session and clear on reload/close. See Feedback channels. |
| `committed-state-banner` | Explain editing/Copy source | Always outside disclosures; names Current URL or Last Valid URL and unchanged invalid Draft. Never claims invalid Draft is synchronized. |
| `validation-message` | Associate a persistent field error | Uses `error-{itemId}-{fieldKind}` for structured fields and `error-full-url` for Full URL; IDs are unique and never recycled. See Feedback channels for association, announcement, repeat, and correction behavior. |
| `no-results-state` | Explain an empty filtered result | Shows “0 of M” with “Clear Search”; bottom Add and top jump link remain reachable, never a duplicate Add button. |

## State Patterns

### Draft, continuous-edit, and identity transitions

- **Draft relationship:** while Full URL contains an invalid Draft URL, Structured View, Copy, Undo, and new structured mutations operate on Last Valid URL. Structured mutations update Last Valid URL while preserving Draft URL exactly.
- **Continuous Full URL edit:** focus captures the baseline Current URL. Each valid input state atomically updates Current URL and Structured View. Enter, blur, or the start of another product mutation closes the session and records at most one History Entry from that baseline to the last accepted valid state. Rejected text remains a local Draft and is never committed to History.
- **Close-and-rebase sequence:** before the first Structured View mutation during an invalid Full URL Draft, first close the Full URL edit. If its focus-entry baseline differs from its last accepted valid state, record that transition while retaining the Draft text. Then append each structured mutation chronologically against Last Valid URL. When Full URL is later corrected, use the latest Last Valid snapshot—not the stale focus-entry snapshot—as the new baseline.
- **Stable item identity:** each Managed Piece receives an immutable internal ID for focus, History, validation IDs, and virtualization. Recompute source ordinal/total after committed structural changes and duplicate-key occurrence/total after key or membership changes. Search changes neither source order nor duplicate membership. Names follow: type, source ordinal of total, duplicate-key occurrence of total when applicable, then field/action name; filtered-result position is separately described within the owning group's result list. Label updates never replace internal identity.

### Query value shape

| Source shape | Persistent visible description associated with the value field |
|---|---|
| `flag` | No value (`=` absent) |
| `flag=` | Empty value (`=` present) |
| Empty key, absent `=` and empty value | Empty query entry |
| `=` | Empty key and empty value (`=` present) |

Use the lossless model's `equalsPresent`, not the appearance of a blank input, to distinguish these states. Add preserves the existing initial shape: `rawKey=""`, `equalsPresent=false`, `rawValue=""`. Key-only edits preserve value presence. A no-op empty value edit preserves absence; entering a nonempty value sets presence, and clearing a previously present value retains `=`. Changing present back to absent remains possible in Full URL; this redesign adds no presence-toggle control. Unrelated edits, Search and reorder preserve each entry's exact shape; Undo restores it.

### Core states

| State | Contract |
|---|---|
| No session | Full URL is primary. Structured View has no rows; Undo and Copy are inactive. State: “Your URL stays in this browser and is cleared when you reload or close this page.” |
| Parsing | Assign every parse a monotonically increasing generation tied to the exact input snapshot. Keep focus in Full URL; set Structured View `aria-busy="true"` and show “Parsing URL…” only after a short delay. Cancel superseded work where possible, and discard every completion whose generation or input value is stale. Only the latest matching generation may atomically publish final rows or rejection, clear busy, and announce completion. Copy and Undo continue against Last Valid; a new product mutation supersedes the parse rather than waiting behind it. Never expose partial rows. |
| Active valid | Full URL and Structured View encode Current URL; Copy uses that exact value. |
| Invalid Initial URL | Keep entered text and inline error. Do not create or replace Initial URL, Current URL, or History. |
| Invalid Draft URL | Keep Draft URL visible. Structured View remains editable against Last Valid URL. Each accepted structured mutation atomically updates Last Valid URL, Structured View, History, and Copy source while Draft URL remains unchanged. |
| Invalid Managed Piece | Keep field available for correction; set field-specific error semantics; do not commit or corrupt Last Valid URL. |
| Collapsed detail group | Hide only that group's content; full URL/Copy and external Current/Last Valid context/errors remain visible. Header retains count and state; no URL/History change. |
| Query row idle/focused/selected | Idle hides Move controls from both tab and browse interaction. Any descendant focus or pinned selection reveals them; do not unmount a focused control. Handle toggle reports selection separately from effective visibility. |
| Drag pending/active/cancelled | Pending gesture never mutates. Active drag displays static destination and announcements. Cancellation, Escape, lost pointer capture or stale target removes preview and adds no reorder entry; an ordinary preceding Full URL blur may already have closed its accepted edit. |
| Empty Paths/query | Keep respective heading and empty text. Query bottom Add and top jump link remain available once a valid session exists; no Path Add is introduced. |
| Filter/no match | Preserve source order/IDs and group expansion state, show count and Clear Search. Drag is unavailable until Search is empty; Add stays reachable. |
| Offline/clipboard denied | Already-loaded app continues entirely locally, with no sync/backend banner or retry request. Clipboard denial/unavailability uses the exact-source safe-copy recovery, not a separate permission screen. Cold loading still requires existing static delivery; no new offline caching/service worker is promised. |
| Clipboard failure | Reveal/select exact Current URL or Last Valid URL in `safe-copy-readonly`, focus it, preserve Draft URL, expose the native device Copy action, and announce platform-neutral guidance through actionable failure. |
| Reload/close | Clear session, Draft URL, Current/Last Valid URL, History, Search, and safe-copy field. Return to No session; no URL content persists. |
| Reduced motion | No animated scrolling, flashing, or moving highlight. Use static outline/text; status persists until replaced by the next related outcome or related operation begins. |

### Feedback channels

1. **Inline validation:** one persistent visible message per invalid field, with no live-region role on the whole list. Structured fields use `error-{itemId}-{fieldKind}` (`domain-unicode`, `domain-ascii`, `path`, `query-key`, or `query-value`); Full URL uses `error-full-url`. Set `aria-invalid="true"` and append the error ID through `aria-errormessage` or `aria-describedby` without removing help references. The dedicated assertive validation announcer speaks on committed validation, blur, explicit Apply, or a bounded settled-input interval validated across the release matrix; it never asserts intermediate IME composition states. Suppress unchanged keystroke repeats. An explicit re-submit or re-Apply of the same invalid value must replace the announcer child node or use a matrix-tested clear/reinsert sequence; changing only a key, token, or data attribute is insufficient. Persistent visible errors remain throughout editing. On correction, clear error state and references atomically.
   Structured errors also have a persistent visible summary outside disclosures. If Search excludes an invalid field, its summary action explicitly says it will clear Search. Activation clears Search with the established count announcement only when needed, opens the owning group, renders the stable-ID field with its rejected local text/error intact, scrolls without obscuring focus, and focuses it. Otherwise Search remains unchanged. Inline associations remain intact; neither branch mutates URL state or creates History of its own. Summary text is not a duplicate live-region channel. Collapse/expand never clears validation or causes repeated speech by itself.
2. **Polite operation status:** dedicated `role="status" aria-live="polite" aria-atomic="true"` with deterministic application-owned per-class queues. Insert an operation outcome within 100 ms after the operation settles, expose each queued outcome for at least 2 seconds, and dequeue it on the application’s 2-second timer. Result-count messages coalesce only with newer result counts inside a 300 ms window; synchronization messages follow the same rule. Committed-operation outcomes—Copy, Undo, reorder, and parse result—are FIFO, take precedence over coalescible classes, and begin exposure within 6 seconds of enqueue. If sustained input would exceed that bound, expose every outcome immediately in persistent visible operation history and enqueue one summary status naming the count; never drop a committed outcome. The release browser/AT matrix may lengthen these bounds but may not shorten them. The application never attempts to detect AT speech. Remove the prior message only as the next message node/text is inserted. For identical repeats, replace the live-region child node or clear then reinsert in the tested timing sequence; changing only an internal token, key, or data attribute is insufficient.
3. **Actionable failure:** dedicated `role="alert" aria-atomic="true"` only for failed Copy or other operation failures requiring action. It does not overwrite queued validation. Visible failure persists until the operation is retried, succeeds, or the relevant state changes.

**Transient drag-preview feedback:** announce only changed logical insertion destinations, coalesced to the latest at a 300 ms cadence rather than queuing pointer events. Associate previews with the drag transaction and source revision. Drop, Escape, lost capture, Search activation and stale-source cancellation discard pending previews before publishing the final operation outcome. Keep the current destination visibly readable as text; previews never enter persistent operation feedback history.

**Visible overflow history:** use a labeled ordinary list, "Operation feedback", in the external feedback area, oldest outcome first, with exact wrapping text and no additional live-region role. It appears when overflow promotion is needed and retains each promoted outcome exactly once until reload/close; it never steals focus or replaces Undo History. Use the architecture's existing promotion/queue rules, not a second queue. Start minimum status exposure after committed DOM insertion.

One channel never replaces another. No visible message auto-removes before it can be read.

### Undo transition table

Search remains active unless noted. Targets are resolved by immutable ID; a virtualized target is mounted before focus.

| Reversed mutation | Restored state | Focus after visible Undo | If Search hides target |
|---|---|---|---|
| Add Query Parameter | Added row removed | Focus nearest surviving Managed Piece; if none, focus Full URL | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the affected item is filtered |
| Remove Path Segment / Query Parameter | Exact row recreated | Focus the recreated row’s corresponding control by immutable ID | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the restored item is filtered |
| Edit Managed Piece | Prior exact value restored | Focus the restored field by immutable ID | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the affected item is filtered |
| Reorder Query Parameter | Prior order restored | Reveal controls and focus the moved row’s enabled Move control, otherwise its first editable control | Focus nearest visible Managed Piece; if none, focus Full URL and announce that the moved item is filtered |
| Full URL continuous edit | Exact prior serialized URL restored | Focus Full URL; Full URL and rows update atomically | Focus Full URL; result summary updates |

During invalid Draft URL every row above additionally preserves Draft text and announces: “Draft URL is unchanged.”

If an Undo target's group is collapsed but Search does not hide the target, expand that group before mounting/focusing the resolved destination. Disclosure expansion itself creates no History Entry. Preserve the existing filtered-target fallback, never clear Search just to satisfy Undo.

## Interaction Primitives

### Full URL edit

`full-url-editor` is a native textarea because long URLs must wrap. Enter applies/closes the edit and never inserts a newline; the persistent instruction precedes the editor in its accessible description. Shift+Enter is also rejected as a line break and leaves the draft unchanged. While `event.isComposing` or composition remains active, Enter and Shift+Enter only confirm composition: they never Apply, close, reject a line break, or mutate History. Handle either key only after composition ends, and include the case in release-matrix IME evidence. Paste is never silently normalized.
### Search

Filters without mutation/history. Result count updates politely after input settles, not on every raw keystroke. Activating “Clear Search” restores all results, returns focus to `search-field`, and announces the restored count without moving focus into the list.
### Disclosure

Three independent initially expanded groups, never a mutually exclusive accordion. Native disclosure semantics or equivalent accessible heading/button semantics expose name, `aria-expanded` and controlled-content identity. On control-driven collapse focus stays on the control. Before any programmatic collapse hides a focused descendant, move focus to that group's control; only then hide the content. Hidden descendants cannot receive Tab/programmatic focus or be exposed as interactive browse content. Expansion restores content without stealing focus except explicitly specified Add/jump/error/Undo destinations. Escape never implicitly collapses a permanent group.
### Add

One button after the query list, preceded by top “Skip to Add Query Parameter” and “Skip to Structured View results” links. The Add jump expands a collapsed query group before focusing Add; it never invokes Add. Add operates on Current/Last Valid URL, including while Full URL is an invalid Draft. Close-and-rebase first as already specified, retain Draft exactly, append after all source Query Parameters (not merely the filtered subset), clear Search with its announcement, expand query group, mount new row and focus key, then announce Add and unchanged Draft if applicable. The accepted Add itself creates one History Entry; a separately necessary Full URL close may precede it as its own entry under the existing chronological rule. If no valid session exists, Add is inactive with guidance to enter an Absolute URL; no fabricated Last Valid URL. Invalid structured field text is not silently committed by Add.
### Utility navigation

Place "Back to Full URL and Copy" and "Back to Search" links beside bottom Add. The first focuses the Full URL textarea, with adjacent Copy next in tab order; the second focuses Search. Each focused query row also exposes these return links without requiring traversal of remaining rows. Navigation preserves Search, pinned selection and rejected Draft text, uses stable mounted destinations, and scrolls without obscuring focus at 320px/400% zoom. Links create no mutation/History of their own; ordinary Full URL blur closure remains applicable. Do not intercept native text-editing keys.
### Remove

Use a labeled action with no drag dependency. Capture the removed immutable ID and activated subcontrol. In post-removal visible source order, search next and then previous for the nearest row that actually exposes the same subcontrol. If none and filtered survivors exist, focus “Clear Search”; otherwise focus the semantic after-list Add control, then the Structured View heading if Add is unavailable. Mount and scroll the destination before focusing it, then announce the removed type and original position.
### Handle selection

Each query has a visible, keyboard-focusable drag-handle button. Tap/click or Enter/Space toggles its pinned selection, revealing Up/Down; a second activation unpins but controls stay visible while any row descendant has focus. Selecting another row transfers pinned selection; focus elsewhere does not hide a still-selected row's controls. `aria-pressed` describes pinned selection and `aria-expanded` describes effective control visibility; no listbox/`aria-selected` is imposed on editable rows. Selection persists while a Move action has focus and after a successful move by stable ID. Escape outside text editing may clear pinned selection; it never blurs or hides a currently focused Move action. Native text-input arrows, selection, composition and editing gestures are never intercepted.
### Reorder — required primary drag

Drag only a query handle, never a whole editable row or a Path Segment. Breno explicitly confirmed that filtering disables drag. Drag is available only when Search is cleared (full source query order); even a nonempty Search matching every row disables drag and presents “Clear Search to drag Query Parameters in full source order.” Clearing Search remains an explicit action with its established focus/count behavior; do not clear it silently to start a drag. No filtered subset-to-source insertion mapping is invented.
### Drag transaction

Allow ordinary focus/blur processing first, then capture immutable query ID and source revision. Pending/active drag changes presentation only; keep duplicates separate. Show an explicit insertion indicator, old/destination source positions and transient polite feedback under Feedback channels. A valid changed-position drop commits one reorder intent/History Entry against the matching Current/Last Valid snapshot, restores focus to the moved handle by ID and keeps controls revealed; announce old/new position and total, plus unchanged Draft when invalid. Same-position drop is a no-op with no reorder entry or success announcement. Escape, cancellation, lost capture, invalid/outside drop, missing target, active Search or changed source revision cancels with no reorder entry and no drag-originated URL mutation. If a Full URL edit remains open after ordinary blur processing, close/rebase it only when a changed valid drop is ready to commit. A preceding legitimate Full URL blur-close entry is retained, not attributed to dragging or discarded on cancellation.
### Touch/pointer drag

Tap reveals controls; recognized movement from the handle starts drag and suppresses the subsequent synthetic click so a drop does not also toggle selection. Retain normal touch scrolling/text selection outside the handle; constrain any touch-action suppression to the handle. Pointer capture is gesture-local and lost capture cancels safely. Do not require a hover state, long-press or keyboard arrow hijack to discover the non-drag alternative. Exact gesture threshold/library and edge-scroll mechanics are implementation choices requiring touch/AT evidence, not approved numerical UX tokens.
### Reorder — Up/Down alternative

Visible on any row focus or pinned selection, operable by keyboard/screen reader/touch without drag. Preserve established source-adjacent movement and full-source first/last boundary rules while Search filters visibility; do not reinterpret a filtered-result ordinal as source identity or a drag destination. After DOM movement, keep focus on the activated Move control unless it becomes natively disabled at the new boundary; then focus the row’s enabled opposite Move control, or the row container/first editable control when neither Move control is available. Reveal/preserve controls at the resolved focus destination before focus. Announce old/new source position, total and boundary outcome. An impossible boundary activation and a one-item list create no History Entry or success announcement. If the moved row becomes filtered, use the existing nearest-visible-item/Full URL fallback and announce the affected item is filtered; do not silently clear Search.
### Product Undo shortcut

Intercept `event.key === "z"` only with the platform primary modifier (`Ctrl` on Windows/Linux, `Meta` on macOS), without Alt/AltGraph, and only outside native editing. Never intercept when target or active element is `input`, `textarea`, editable `select`, `contenteditable` or its descendant; when `event.isComposing`; or when a text selection belongs to an editing host. Browser-native Undo wins in those cases. Visible Undo remains available.
### Copy

Persistent Copy uses Current/Last Valid URL. Failure invokes safe-copy recovery with platform-neutral guidance; the selected read-only value supports keyboard Copy and the native touch/VoiceOver selection menu.
### Pointer cancellation

Add, Remove, Move Up/Down, Undo, Copy, Clear Search, disclosure/handle toggles activate only on completed up/click, never pointer-down. Moving away/cancelling before release prevents activation. Drag commits only on a valid drop under the transaction above; a preview is never a URL mutation.
### Escape

Cancels active drag first, otherwise may clear pinned selection outside text editing; never discards Draft URL, collapses a permanent group implicitly, or mutates Current/Last Valid URL/History.
### Banned

Hover-only actions, color-only states, silent normalization, modal routine mutations, infinite-scroll omission, or network requests containing URL content.

## Accessibility Floor

- WCAG 2.2 AA applies to the complete UJ-1 path and failure states.
- Tab order follows visual/DOM reading order: Full URL → adjacent Copy → Undo → any safe-copy recovery → Search/Clear Search and top skip links in their displayed order → body disclosure and visible Domain fields → Paths disclosure and visible ordered rows → Query Parameters disclosure and visible ordered query rows (handle, key/value, Remove, revealed Up/Down) → sole bottom Add. External error-summary links remain reachable in their displayed order. No hidden descendants are tabbable.
- Reflow is normative at 320 CSS px and 400% zoom. No required label, error, status, or action causes page-level horizontal scrolling; only essential URL value fields may scroll internally.
- Every pointer target is at least `{spacing.pointer-min}` by `{spacing.pointer-min}` at all widths or meets the spacing exception. Primary and destructive controls target `{spacing.control-target}` by `{spacing.control-target}`.
- Focus uses `{colors.focus}` with the DESIGN outline/offset rule, including pale primary buttons; system outlines in forced colors. Query focus/selection uses `{colors.selected-surface}` plus text/programmatic state, and drop destinations use `{colors.query-accent}` plus explicit text/announcements. Reduced motion removes animated scrolling and moving cues, not destinations or operation availability.
- Duplicate controls follow the naming formula in Stable item identity: current source ordinal/total and duplicate occurrence/total accompany the field/action name; only the opaque ID remains immutable. Filtering does not change these source labels. When used, `aria-posinset`/`aria-setsize` describe the owning group's filtered list, not a synthetic cross-group set.
- Both “Unicode Domain” and “ASCII/Punycode Domain” are editable and linked by shared help. The focused form owns the active edit; successful validation/conversion atomically updates the counterpart and committed URL and uses polite status. Invalid text remains a local field Draft and uses persistent inline validation plus the dedicated validation announcer only. Actionable alert is reserved for non-field operation failures, and duplicate speech is prohibited. Each value uses bidi isolation and URL tokens use `dir="ltr"` without altering stored characters. Exact mapping, reconstruction, and Copy serialization remain an architecture gate.

### Virtualization contract

Architecture AD-7 selects full DOM for V1. The following is a contingency only if AD-7 is formally reopened: virtualization requires **one complete, nonduplicated accessible representation mapped to the visually windowed list** and all requirements below pass with the 250+ fixture. Ordinary DOM windowing alone is nonconforming because absent rows are not browseable. Intentional disclosure hiding is not virtualization; every row is restored on expansion.

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

Lifted from `https://urleditor.online/` only at Breno's direction: rounded panels/styled inputs, group accents, space and hierarchy in an original dark composition. The [approved preview](mockups/dark-workbench.html) is the local visual reference, not a request to fetch/import reference content or features.

Raw Full URL and Structured View must synchronize dependably; browser-local operation and utility clarity remain obvious. Do not import a background grid, marketing page, API-client/tool-suite chrome, unsupported editors or new URL capabilities. Complete Undo, cross-piece Search and query ordering remain testable; required primary drag always has on-demand keyboard/non-drag controls.

## Responsive & Platform

| Width/platform | Behavior |
|---|---|
| `>700px` | Copy beside Full URL; one-column stacked detail groups. Domain fields/query key/value/actions may share lines with labels. Full URL/Search utilities may remain reachable while rows scroll without hiding focus/status. |
| `320–700px` | Copy may wrap below Full URL; Domain/query fields and actions stack. Identical data/actions, including handle tap and on-demand Move controls, and no page-level horizontal scrolling. |
| `400% zoom` | Equivalent 320 CSS px contract; essential URL fields alone may scroll horizontally. |
| Reduced motion | Instant mounting/scroll positioning and static change cues. |
| Forced colors | Native/system-color outlines and perceivable boundaries; no box-shadow-only state. |

## Key Flows

### UJ-1. Devon safely changes a deep-link configuration.

1. Devon opens the Workbench and reads or hears: “Your URL stays in this browser and is cleared when you reload or close this page.”
2. Devon pastes a supported Absolute URL; parsing completes with a Managed Piece count.
3. Devon searches, edits a Query Parameter, and verifies synchronized Current URL.
4. Devon tests a second variation, then invokes Undo; the exact prior serialized URL is restored.
5. Devon uses the top Add jump link (opening Query Parameters if needed), reaches the sole bottom Add, appends after the full query list, and focus lands on its new key.
6. **Climax:** Copy confirms the exact Current URL source; Devon can Undo to Initial URL.

Failure: Clipboard failure reveals, selects, and focuses labeled Current URL without changing URL state; Devon uses the native device Copy action or Ctrl+C/Command+C.

### Flow 2 — Devon keeps working during an invalid Draft URL

1. Devon makes Full URL invalid; Draft URL remains visible with associated error.
2. Before Devon’s first Structured View edit, the open Full URL session closes from its focus baseline to its last accepted valid state; Draft text remains exact. Structured mutations then append chronologically against Last Valid.
3. Devon invokes Undo; the latest committed mutation reverses, focus moves to the restored or affected logical item under FR-14, and status announces both the restored Last Valid state and unchanged Draft.
4. Devon invokes Copy. On failure, labeled Last Valid URL appears selected while Draft URL remains visible.
   Before correction, Devon also jumps to bottom Add with Search active and query group collapsed: the jump opens the group/focuses Add without mutation; Add clears Search with announcement, appends to Last Valid URL, focuses the new key and creates one Add entry without changing Draft. Devon can Undo this Add under the transition table.
5. Devon corrects and applies Full URL; its History Entry is rebased on the latest Last Valid snapshot after the structured mutations.
6. **Climax:** both representations synchronize without losing the prior draft work or structured history.

Failure: invalid correction remains Draft with persistent external validation; failed Copy selects exact Last Valid URL, never Draft. A collapsed group cannot hide the explanation or prevent correction.

### Flow 3 — Devon verifies IDN and high-density behavior

1. Devon loads the 20,000-character/250+ fixture with duplicates, encoded delimiters, Unicode Domain, and Fragment.
2. Devon edits the Unicode Domain and then the ASCII/Punycode Domain; whichever form has focus owns the edit.
3. Accepted conversion updates the counterpart atomically and uses polite status. Invalid input remains local and uses persistent inline validation plus the dedicated validation announcer only. Both values are bidi-isolated, and the same outcome is never announced through multiple channels.
4. Devon filters duplicate parameters and hears “N of M”; names retain source ordinal/occurrence and add separate result position.
5. Devon taps a duplicate row's handle or focuses its fields to reveal Up/Down; keyboard moves preserve identity/focus and boundary behavior. Devon clears Search explicitly before primary handle dragging, previews a destination, then cancels without mutation. Devon starts another drag before committing a single valid drop. Touch scroll remains possible outside the handle.
6. Devon jumps to bottom Add from the top, adds after the full source list, removes and undoes; all specified focus/announcements occur. Devon traverses every expanded row in browse/focus modes with the full-DOM representation required by AD-7; a reopened virtualization choice must pass on/off equivalence.
7. **Climax:** no piece is omitted, all primary actions remain reachable, and exact Copy/Undo integrity holds.

Failure: conversion rejection stays local and externally discoverable; drag with active Search is unavailable with clear guidance, stale/lost drag cancels unchanged, and same-position drop creates no entry. Keyboard/screen-reader Up/Down remain a complete alternative.

### Observable acceptance evidence

| Requirement | Trigger | Observable result / failure criterion | Flow reference |
|---|---|---|---|
| FR-1 | Enter relative, domain-only, non-HTTP(S), or input that cannot be safely represented | Show specific plain-language inline guidance and leave the existing session and History unchanged. Fail if input creates/replaces a session or receives only a generic error. | Flow 1 step 2; Flow 3 step 1 |
| FR-2 | Parse a supported Absolute URL | Publish Domain, ordered Path Segments, and ordered Query Parameters atomically with a Managed Piece count; preserve Scheme and Fragment in Full URL. Fail on partial, omitted, duplicated, or reordered output. | Flow 1 step 2; Flow 3 steps 1, 6 |
| FR-3 | Edit mixed Unicode/RTL and ASCII/Punycode Domain forms, including an invalid intermediate | The focused form owns the edit; valid conversion atomically updates counterpart and committed URL; invalid text stays local; labels, isolation, and status persist. Fail if invalid text changes its counterpart/Current URL, accepted forms diverge, or serialization is unverified. | Flow 3 steps 2–3 |
| FR-4 | Search Domain, Path Segment, Query Parameter keys, and values with mixed case | Filter case-insensitively and announce “N of M” without mutation or History. Fail if source order changes or unsearched fields determine results. | Flow 1 step 3; Flow 3 step 4 |
| FR-5 | Filter duplicate Query Parameters, clear Search, and inspect names | Preserve source ordinal/occurrence, expose filtered result position separately, and restore source order on “Clear Search.” Fail if filtering renames source identity or clearing reorders items. | Flow 3 step 4 |
| FR-6 | Edit each Managed Piece type with valid and invalid values | Valid edits atomically update committed URL and Structured View; invalid field text remains local and correctable. Fail on partial commit, unrelated serialization change, or lost Draft. | Flow 1 step 3; Flow 3 steps 2–3 |
| FR-7 | Remove a Path Segment or Query Parameter in filtered and unfiltered sets | Remove exactly the target and follow the Remove focus fallback sequence. Fail if Domain is removable, identity drifts, or focus becomes absent/lost. | Flow 3 step 6; Interaction Primitives: Remove |
| FR-8 | Follow top jump and invoke sole bottom Add with/without Search, invalid Draft, empty/no-match list or collapsed query group | Jump expands/focuses Add without mutation/Search clearing. Add expands query group, clears Search with announcement, appends after all source Query Parameters, mounts row, focuses key and creates one Add entry. Invalid Draft stays exact; no valid session means inactive Add. Fail on a duplicate top Add button, filtered append, lost focus or changed Draft. | Flow 1 step 5; Flow 2 step 4; Flow 3 step 6 |
| FR-9 | Drag queries with Search clear; reveal Up/Down by handle tap or row focus; exercise middle/boundary/duplicate/cancel/same-position cases | Stable ID/duplicate values survive. One changed valid drop = one reorder entry; Escape/lost/stale/invalid/same-position drop = none. Drag disabled with active Search; Up/Down uses full source boundaries. Retain enabled activated Move, otherwise focus enabled opposite Move, then row/first field; disabled impossible moves create no success/History. Fail on absent required drag, path reorder, hover-only/drag-only access, text-arrow interception, boundary History or lost focus. | Flow 3 step 5; Interaction Primitives: Reorder |
| FR-10 | Focus Full URL, enter successive valid states, then close on Enter or blur | Synchronize each valid state immediately and record at most one baseline-to-last-valid History Entry. Fail if intermediate valid states create multiple entries or the last accepted serialization is lost. | Flow 1 steps 2–4; Flow 2 steps 1–2 |
| FR-11 | Keep an invalid Full URL Draft while editing Structured View | Preserve Draft text exactly while Structured mutations operate on and update Last Valid URL. Fail if Draft is cleared, normalized, committed, or described as synchronized. | Flow 2 steps 1–5 |
| FR-12 | Correct an invalid Full URL Draft after structured mutations | Atomically synchronize Full URL and Structured View from the corrected URL while preserving chronological History. Fail if correction uses a stale baseline or unrelated content changes. | Flow 2 steps 2, 5–6 |
| FR-13 | Perform Add, Remove, Edit, Reorder, and a continuous Full URL edit | Append one exact chronological History Entry per Committed Mutation with immutable target identity. Fail if accepted mutations are missing, duplicated, merged incorrectly, or reordered. | Flows 1–3; Undo transition table |
| FR-14 | Undo every mutation type, including while Draft URL is invalid | Restore the exact prior serialized URL and row state. Focus the restored or affected logical item when it exists; otherwise focus the nearest surviving item, then Full URL. During invalid Draft, retain Draft text and announce both outcomes. Fail if Undo resurrects rejected text, restores a stale branch, loses focus, or intercepts native editing Undo. | Flow 1 steps 4, 6; Flow 2 step 3; Flow 3 step 6 |
| FR-10, FR-11, FR-13, FR-14; NFR-4–NFR-7 — exact close-and-rebase case | Let Initial/current be `A`; focus Full URL at baseline `A`; accept valid `B`, then `C`; type invalid `X`; blur; run structured mutations `S1` producing `D` and `S2` producing `E`; correct Full URL to valid `F`; then invoke product Undo repeatedly. | Blur closes as `[A→C]`, Last Valid `C`, Draft `X`. Before `S1`, the Full URL edit is already closed; `S1` appends `[C→D]`, then `S2` appends `[D→E]`, with Draft still `X`. Correction starts from latest Last Valid `E`, appends `[E→F]`, and clears `X`. Undo restores `E`, `D`, `C`, then `A`, never `X`. Fail if any accepted state is unrecorded, structured edits are erased/reordered, or Undo restores a stale branch. | Flow 2 steps 1–6 |
| FR-15 | Copy in valid state, invalid Draft state, and Clipboard API failure | Copy exact Current URL or Last Valid URL as applicable; on failure reveal, select, and focus the exact source without reporting success or changing state. Fail if Draft text is copied as committed or the fallback source differs. | Flow 1 step 6/failure; Flow 2 step 4 |
| FR-16 | Trigger validation, parse, Search, mutation, Undo, Copy, and actionable failure outcomes | Route each outcome through its defined channel with required persistence, ordering, and repeat behavior. Fail if one channel overwrites another, committed outcomes disappear unannounced, or failure steals focus outside safe-copy recovery. | Flows 1–3; Feedback channels |
| Presentation delta; FR-2, FR-11, FR-16; NFR-12–NFR-15 | Collapse each group independently by control and programmatically with focused descendant; link to a hidden error; Add/Undo into collapsed query | All begin expanded; name/state exposed; hide only controlled content with no hidden tab stops; move descendant focus to control before hiding; Full URL/Copy and external committed-state/errors stay visible. Error/Undo/Add destinations expand before focus. No disclosure/selection/jump History. Fail on hidden errors, focus loss or new unmanaged editors. | Flows 1–3; Disclosure; State Patterns |
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

### Redesign edge-case acceptance

| Case | Required outcome |
|---|---|
| Full URL accepts `A→B`, then invalid `X`; jump to Add or focus handle and cancel drag | Ordinary blur records `[A→B]`, retaining exact `X`. Navigation/cancellation adds no entry. Subsequent accepted Add/drop records its own single entry against `B`. |
| Search excludes an invalid field in a collapsed group; activate its labeled error-summary action | Clear Search explicitly with count feedback, expand group and focus the same field with rejected text/error intact. No URL mutation or hidden focus. |
| Rapid destination previews followed by drop or cancellation | Pending previews are invalidated before final outcome; no obsolete destination remains queued. |
| Add/move at the end of 250+ queries, then return to Copy/Search | Focus-revealed row/bottom return links reach utilities without traversing all rows; no obscured focus at 320px/400% zoom. |
| Edit/reorder/remove/add with `?flag&flag=&` | Absent, empty and empty-entry labels remain distinct; unrelated bytes stay exact; Copy and Undo preserve shape; Add uses the existing empty-entry default. |
| Rename a duplicate key, then Add/Remove/reorder and filter | Display ordinals/totals and duplicate membership refresh correctly while internal IDs remain stable; filtered positions belong to their respective group. |
| Status queue overflows | Every promoted outcome appears exactly once in readable non-live session feedback history, separate from Undo History and without focus movement. |
| Markerless Paths/query lists in WebKit/VoiceOver | Explicit list role, list-item grouping/counts, source order and browse navigation survive; this requires later browser/AT evidence, not a static-preview claim. |
