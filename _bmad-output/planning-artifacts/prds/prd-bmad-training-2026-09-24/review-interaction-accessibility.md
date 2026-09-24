# Interaction and Accessibility Review

## Verdict

**Not ready for implementation acceptance.** The PRD establishes strong intent, but the primary developer journey still contains material state, keyboard, focus, and testability gaps. Two gaps are critical because they can cause ambiguous state or destroy in-progress work: editing structured pieces while a raw URL draft is invalid, and routing `Ctrl/Cmd+Z` between native text undo and product history.

## Scope and severity

This review assesses only the requested primary-journey risks: raw versus structured editing states, immediate updates, invalid drafts, focus, keyboard-only operation, undo shortcut conflicts, non-drag reordering, feedback announcements, large piece sets, Copy behavior, WCAG 2.2 AA testability, and desktop-first narrow-width behavior.

- **Critical:** State loss, destructive ambiguity, or no dependable way to complete/recover the core journey.
- **High:** A core interaction or accessibility requirement cannot be implemented or accepted consistently.
- **Medium:** Material inconsistency or verification gap with a viable workaround.
- **Low:** Limited ambiguity unlikely to block the primary journey.

## Findings

### IA-01 — Structured edits during an invalid raw draft have no conflict policy

**Severity: Critical**

**Location:** UJ-1; FR-11; FR-12; NFR-4; addendum, “History Model Decision Prompt”

UJ-1 explicitly permits “further structured editing” while the Full URL contains an invalid Draft URL. FR-11 says the Structured View continues to represent the Last Valid URL, but the documents do not define what happens to the invalid raw draft when a structured edit commits a new Current URL. Plausible implementations could overwrite the draft, preserve a now-stale draft, silently merge it, or block the structured mutation. These choices produce materially different data-loss, Copy, history, and synchronization behavior.

**Required acceptance behavior:**

- Define one authoritative transition for a structured mutation while a Draft URL is invalid.
- State whether the raw draft is preserved, discarded, or requires explicit user resolution.
- If discarded, require an explicit warning or confirmation before the destructive action.
- If preserved, distinguish it from the newly committed Current URL and define how the user resumes, applies, or discards it.
- Define which URL Copy returns immediately after the structured mutation.
- Define the resulting History Entry and what one Undo restores, including whether the invalid draft returns.

### IA-02 — `Ctrl/Cmd+Z` ownership is unresolved and can trigger the wrong undo system

**Severity: Critical**

**Location:** FR-10; FR-14; addendum, “History Model Decision Prompt”

FR-14 assigns `Ctrl+Z` or the platform equivalent to product-level URL Undo, while Full URL and piece fields also require native text editing. The addendum acknowledges that native and product undo must not be ambiguous but leaves the routing rule undecided. Without acceptance behavior, the same shortcut may unexpectedly replace the entire URL when a user intended to undo one character, or may only change text when the user intended to undo the last committed mutation.

**Required acceptance behavior:**

- Define shortcut precedence for every focus context: Full URL editor, valid and invalid raw draft, Domain field, Path Segment field, Query Parameter key/value, search, reorder control, and non-editable page context.
- Preserve native text undo while an editable field has uncommitted text changes.
- Define the explicit boundary at which the shortcut switches to product history.
- Require a visible product Undo control that remains keyboard operable regardless of shortcut routing.
- Verify platform-equivalent behavior on each supported OS/browser combination.
- Specify what happens when native undo changes a valid input into an invalid draft or restores validity.

### IA-03 — “Immediate” synchronization conflicts with undefined commit and coalescing boundaries

**Severity: High**

**Location:** FR-10; FR-13; FR-14; NFR-4; addendum, “History Model Decision Prompt”

FR-10 requires every syntactically valid Full URL edit to update structured pieces immediately, while the same typing session must produce one Committed Mutation rather than one per keystroke. Neither “editing session” nor its end is defined. Blur, Enter, idle timeout, paste, focus movement into the Structured View, Copy, and page navigation could all become inconsistent commit boundaries. A valid intermediate URL may update Current URL and Copy before the user has finished typing, yet later be grouped into a history entry whose prior state is unclear.

**Required acceptance behavior:**

- Define when raw input is a Draft URL, when a valid state becomes Current URL, and when a History Entry closes.
- Enumerate boundaries for typing, paste, replace-all, Enter, blur, idle pause, Copy, structured interaction, and Undo.
- Define whether Copy during an open valid editing session copies the latest synchronized valid state.
- Require deterministic coalescing that does not depend on an untestable perception of “continuous” typing.
- State the exact state restored by Undo during and after an open editing session.

### IA-04 — Invalid structured drafts lack a complete interaction model

**Severity: High**

**Location:** FR-6; FR-11; NFR-5; NFR-13

Invalid-draft behavior is detailed only for the Full URL. FR-6 merely says an invalid structured edit is explained and cannot corrupt the Last Valid URL. It does not specify whether invalid text remains in the field, reverts immediately, commits on every valid keystroke, or blocks focus movement. It also does not define whether other structured controls, raw editing, Copy, search, or Undo remain available.

**Required acceptance behavior:**

- Define draft, validation, correction, cancellation, and commit behavior for every editable piece type.
- Preserve invalid user-entered text long enough to correct it unless the user explicitly cancels.
- Programmatically associate the error with the field and expose invalid state.
- Define whether other mutations are permitted while the field is invalid and how conflicts are resolved.
- Ensure invalid validation attempts create no History Entry and do not change the Copy source.

### IA-05 — Focus behavior is missing for synchronization and collection mutations

**Severity: High**

**Location:** FR-7 through FR-12; FR-14; FR-16; NFR-13

The PRD says feedback must not steal focus, but it does not say where focus remains or moves after add, remove, reorder, search filtering, Undo, raw-to-structured synchronization, or structured-to-raw synchronization. Removal can delete the focused control; search can hide it; immediate raw parsing can replace much of the structured control tree. An implementation may reset focus to the document or move it unpredictably even while technically avoiding a modal.

**Required acceptance behavior:**

- Preserve focus in the active editor during counterpart updates.
- After removal, move focus predictably to the next logical item, otherwise the previous item, otherwise the collection heading/add control.
- After adding, define whether focus moves to the new key field or remains on Add; choose one and test it.
- After reordering, retain focus on the moved item and expose its new position.
- Define focus behavior when search hides the focused item and when clearing search restores items.
- Require stable control identity so large structured re-renders do not reset focus or text selection.
- Define focus behavior after Undo restores a removed or reordered piece.

### IA-06 — Keyboard-only reordering is required but not specified

**Severity: High**

**Location:** FR-9; NFR-11; SM-3

NFR-11 prohibits requiring pointer drag, but FR-9 gives no keyboard mechanism. “Keyboard operable” cannot be accepted without defining how an item is selected, moved, cancelled, and placed, particularly among duplicate keys and up to 250 parameters.

**Required acceptance behavior:**

- Provide a non-drag mechanism such as Move up/down controls plus an efficient “move to position” operation.
- Give every reorder control an accessible name containing the parameter identity and current position.
- Retain focus on the moved parameter after each operation.
- Announce the resulting position and total count without moving focus.
- Define first/last disabled states and cancellation behavior.
- Make long-distance moves practical without hundreds of repeated key presses.
- Require one completed logical reorder, not every intermediate navigation step, to create one History Entry.

### IA-07 — Status and error announcement rules are too generic for immediate updates

**Severity: High**

**Location:** FR-11; FR-15; FR-16; NFR-13; NFR-10

NFR-13 requires non-blocking messages to be announced, but does not define which events are status messages, their urgency, deduplication, or timing. Immediate synchronization can generate announcements on every valid keystroke. Copy feedback, validation errors, reorder confirmations, and counterpart changes may compete in one live region or repeatedly interrupt screen-reader output.

**Required acceptance behavior:**

- Define separate semantics for validation errors and polite status confirmations.
- Do not announce routine synchronization on every keystroke; announce only actionable state transitions or a settled result.
- Announce Copy success and failure, reorder completion, add/remove completion, and transition into or out of invalid draft state.
- Require concise, event-specific messages that identify the affected piece when needed.
- Prevent duplicate announcements caused by re-rendering unchanged text.
- Define how rapidly superseded messages are queued, replaced, or suppressed.
- Verify announcements with at least one supported screen reader/browser pairing per platform support target.

### IA-08 — Copy is ambiguous when editing is valid but not history-committed

**Severity: High**

**Location:** Glossary; FR-10; FR-11; FR-15; NFR-4

Copy is defined for Current URL and for an invalid Draft URL, but the documents also distinguish immediate valid synchronization from a coalesced Committed Mutation. It is unclear whether a syntactically valid raw edit inside an open typing session is already Current URL, only a valid draft, or committed state. Therefore “latest valid committed URL” in the vision can conflict with “every syntactically valid edit updates immediately.”

**Required acceptance behavior:**

- Define a single Copy source for every state: no session, valid open raw edit, invalid raw draft, invalid structured draft, completed structured mutation, and post-Undo.
- Use consistent terminology: either valid raw changes become Current URL immediately or they remain drafts until an explicit commit boundary.
- State whether invoking Copy closes/coalesces the current editing session.
- On clipboard failure, retain focus and provide a selectable fallback value or clear recovery instruction.
- Give the Copy action an accessible name that makes “last valid” behavior discoverable while a draft is invalid.

### IA-09 — Large-piece-set operability is measurable only as presence, not usable interaction

**Severity: High**

**Location:** NFR-8 through NFR-10; SM-3; “Capacity Fixture Guidance”

The documents require 250 parameters to remain operable, but do not define acceptable keyboard navigation, focus stability, search recovery, reorder effort, or rendering behavior. A page can technically expose all controls and meet the 100 ms response target while requiring hundreds of Tab presses or losing focus during virtualization.

**Required acceptance behavior:**

- Set an interaction-effort expectation for locating and acting on a known parameter by keyboard.
- Require search results to expose result count and preserve each result’s original position.
- If virtualization is used, require correct accessibility-tree exposure, stable focus, and reliable find/edit/reorder behavior for off-screen items.
- Provide collection-level navigation or another efficient method that does not require tabbing through every field and action.
- Test add, edit, remove, long-distance reorder, Undo, and Copy at the 250-parameter limit with keyboard only.
- Include screen-reader verification at the supported limit, not only DOM presence and response timing.

### IA-10 — WCAG 2.2 AA is aspirational rather than an acceptance requirement

**Severity: High**

**Location:** NFR-11 through NFR-14

NFR-14 says V1 “should” meet WCAG 2.2 AA, while the other accessibility requirements omit a conformance scope and repeatable test method. This makes failure non-blocking and leaves relevant criteria—such as Focus Not Obscured, Dragging Movements, Target Size (Minimum), Reflow, Status Messages, Error Identification, and Name/Role/Value—without traceable acceptance evidence.

**Required acceptance behavior:**

- Change the acceptance posture from aspirational to mandatory for UJ-1, or explicitly document approved exceptions.
- Define the pages, states, supported browsers, zoom levels, input methods, and assistive-technology combinations in scope.
- Map UJ-1 acceptance tests to applicable WCAG 2.2 A/AA success criteria.
- Require automated checks plus manual keyboard, focus, zoom/reflow, screen-reader, error, status-message, and dragging-alternative tests.
- Require evidence for normal, invalid-draft, clipboard-failure, empty/no-results, large-set, and Undo states.
- Make unresolved A/AA failures release-blocking unless formally waived with rationale.

### IA-11 — Narrow-width “usable” behavior has no verifiable layout contract

**Severity: High**

**Location:** V1 Out of Scope; NFR-9; NFR-14

The experience is desktop-first and not mobile-optimized, but must remain usable at narrow widths. No minimum viewport, zoom condition, reflow rule, pane stacking behavior, or horizontal-overflow exception is specified. The 20,000-character raw value and multi-control parameter rows make this especially risky. Implementations may require two-dimensional scrolling, hide Copy/Undo, or separate labels from controls.

**Required acceptance behavior:**

- Define the narrowest supported CSS viewport and test at 400% zoom consistent with WCAG reflow evaluation.
- Specify how Full URL and Structured View panes stack and which controls remain persistent or reachable.
- Prevent page-level horizontal scrolling for the primary journey; constrain long URL content inside its editing control where necessary.
- Require labels, errors, reorder controls, Copy, and Undo to remain adjacent, visible, and keyboard reachable.
- Define how long unbroken encoded strings wrap or scroll without covering controls or focus indicators.
- Test valid, invalid, no-results, and 250-parameter states at the narrow-width boundary.

### IA-12 — Change indication is not defined for non-visual users or rapid updates

**Severity: Medium**

**Location:** FR-12; FR-16; NFR-12; NFR-13

The counterpart change must be “visibly indicated” and “apparent,” but no duration, persistence, semantic exposure, or relationship to the edited field is defined. A transient highlight can satisfy the wording while being missed by low-vision users, screen-reader users, or anyone looking at the active editor rather than the counterpart.

**Required acceptance behavior:**

- Define the purpose of change indication separately from status announcements.
- Do not rely on transient color or animation alone.
- Keep the indication available long enough to perceive and ensure reduced-motion preferences are respected.
- Expose the affected counterpart through meaningful status text when the change is not otherwise apparent.
- Avoid moving focus or forcing the user to inspect the counterpart before continuing.

## Acceptance risks summary

Before interaction design or implementation is accepted, the documents need one deterministic state machine covering raw drafts, structured drafts, Current URL, Last Valid URL, Copy source, history boundaries, and conflicting edits. They also need explicit keyboard and focus contracts for every collection mutation, a practical non-drag reorder model, announcement throttling, large-set interaction criteria, and a mandatory WCAG 2.2 AA verification matrix including narrow-width states.
