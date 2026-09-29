---
title: "PRD: URL Piece Management"
status: final
created: 2026-09-24
updated: 2026-09-29
---

# PRD: URL Piece Management

## Decision Summary

- **Product:** A browser-local public web tool for safely inspecting and editing
  HTTP/HTTPS URLs through synchronized Full URL and Structured View surfaces.
- **Primary user:** Web developers testing URL-driven application behavior.
- **V1 boundary:** One URL at a time; no accounts, persistence, collaboration,
  API-client behavior, shortening, batch processing, relative URLs, or Redo.
- **Quality bar:** Exact snapshot-based Undo, no stale Copy, lossless ordered
  query entries, WCAG 2.2 AA, and operability at 20,000 characters and at least
  250 Query Parameters.
- **Release evidence:** At least 90% unassisted completion by 5–8 representative
  developers and zero critical synchronization, Undo, or stale-Copy failures.
- **Invalid Draft policy:** Structured View remains editable against Last Valid
  while preserving invalid Draft text. Close the Full URL edit before the first
  structured mutation, record any baseline-to-last-valid transition, and then
  append structured mutations chronologically.

## 0. Document Purpose

This PRD defines the product behavior and quality bar for the people designing,
implementing, and verifying URL Piece Management. It builds on the finalized
product brief and uses stable User Journey (UJ), Functional Requirement (FR),
Non-Functional Requirement (NFR), and Success Metric (SM) identifiers.
Confirmed product decisions are recorded in the decision log. Technical options
and research evidence live in `addendum.md`.

## 1. Vision

URL Piece Management is a standalone web tool that helps web developers inspect
and safely change complex URLs while testing URL-driven application behavior.
It turns an opaque URL into understandable, editable pieces while preserving the
complete URL the developer ultimately needs.

The product replaces manual editing in text editors, where finding the intended
value is slow and a small accidental change can invalidate the URL or alter
unrelated behavior. Its core promise is a trustworthy editing loop: the Full URL
and Structured View stay synchronized, changes are precise and reversible, and
Copy always returns the latest valid committed URL.

Parsing and basic query editing are category table stakes. URL Piece Management
distinguishes itself through reliable two-way synchronization, complete Undo,
search across URL pieces, explicit query-parameter ordering, and browser-local
processing.

## 2. Target User

The primary user is a web developer working on URL-driven behavior, such as
reproducing a route, changing a path identifier, testing query-controlled state,
or comparing parameter combinations.

### 2.1 Jobs To Be Done

- Understand the structure of a long or unfamiliar URL without manually
  separating delimiters and encoded values.
- Find and change the intended domain, Path Segment, or Query Parameter without
  altering a similar-looking value elsewhere.
- Try URL variations quickly while retaining a dependable route back to the
  original URL.
- Copy the exact current valid result without checking whether the raw and
  structured representations diverged.
- Keep sensitive or environment-specific URL content on the local device.

### 2.2 Non-Users in V1

- Teams requiring shared, saved, or collaborative URL workspaces.
- Users seeking a general API client, URL shortener, or batch transformation
  tool.
- Users who need relative-reference editing rather than complete Absolute URLs.

### 2.3 Key User Journey

- **UJ-1. Devon safely changes a deep-link configuration.** Devon is a web
  developer reproducing a bug controlled by a
  long Absolute URL with many Query Parameters. Devon opens the public web tool,
  pastes the URL, searches for the relevant Query Parameter, edits its value,
  and sees both the Structured View and Full URL reflect the change. Devon
  tests a second variation, uses Undo when that variation does not reproduce the
  intended state, and copies the restored Current URL. The journey succeeds when
  the copied URL reproduces the intended state and Devon can still return
  exactly to the Initial URL. If a Full URL edit is
  temporarily invalid, the tool explains the Draft URL error while preserving
  the Last Valid URL for Copy and further structured editing.

## 3. Glossary

- **Absolute URL** - An HTTP or HTTPS URL with a non-empty host that the product
  accepts as a new Initial URL.
- **Initial URL** - The exact accepted Absolute URL that begins the current
  editing session and is the final destination of complete Undo.
- **Current URL** - The latest valid committed URL represented identically by
  the Full URL and Structured View.
- **Last Valid URL** - The Current URL retained while a Draft URL is incomplete
  or invalid.
- **Draft URL** - Uncommitted text in the Full URL editor that has not yet
  produced a valid Current URL.
- **Full URL** - The raw-text representation used to display or edit the entire
  URL.
- **Structured View** - The ordered collection of managed URL pieces: Domain,
  Path Segments, and Query Parameters.
- **Managed Piece** - A Domain, Path Segment, or Query Parameter that can be
  found and manipulated in the Structured View.
- **Domain** - The host portion of the URL. The scheme remains in the Full URL
  but is not a Managed Piece.
- **Path Segment** - One ordered slash-delimited portion of the URL path.
- **Query Parameter** - One lossless ordered query entry. Its representation
  distinguishes a key without `=`, a key with an empty value, an empty entry,
  and duplicate keys, and retains untouched separator syntax.
- **Fragment** - The URL portion beginning with `#`; it is preserved through the
  Full URL but is not a Managed Piece in V1.
- **Committed Mutation** - One accepted user action that changes the Current URL
  and creates one History Entry.
- **History Entry** - A restorable Current URL state created by a Committed
  Mutation. It stores the exact Full URL serialization, not only a parsed URL
  model.

## 4. Features

### 4.1 URL Intake and Structural Representation

**Description:** The developer can begin a session by supplying an Absolute URL.
The product parses the accepted value into a Full URL and Structured View
without dropping or silently combining URL content. This feature establishes
the Initial URL and realizes UJ-1.

**Functional Requirements:**

#### FR-1: Accept an Absolute URL

The developer can paste or type an Absolute URL to begin an editing session.

**Consequences (testable):**
- An HTTP or HTTPS input with a non-empty host can become the Initial URL.
- URLs using other schemes are rejected as unsupported in V1.
- A domain-only or relative input is rejected with guidance that an Absolute
  URL is required.
- Rejected input does not create or replace an editing session.

#### FR-2: Expose the URL structure

The product can represent an accepted Absolute URL as a Full URL and an ordered
Structured View containing its Domain, Path Segments, and Query Parameters.

**Consequences (testable):**
- Managed Pieces appear in URL order, with Query Parameters after the Domain and
  Path Segments.
- Piece types are visually distinguishable without relying on color alone.
- Scheme and Fragment remain present in the Full URL but are not Managed Pieces.
- No accepted Managed Piece is omitted, merged, or silently reordered.

#### FR-3: Preserve supported URL semantics

The product can parse and reconstruct supported URLs without changing their
meaning.

**Consequences (testable):**
- Duplicate Query Parameter keys remain separate and retain their relative
  order.
- Query Parameters preserve the distinction among `key`, `key=`, empty entries,
  duplicate entries, and untouched separators.
- Encoded delimiters are not mistaken for structural delimiters or
  double-encoded by an unrelated edit.
- Internationalized domains display both a readable Unicode form and the
  corresponding ASCII/Punycode form for verification.
- Editing either internationalized-domain representation preserves a
  synchronized Domain and a serializable Current URL.
- A Fragment is preserved unless the developer changes it through the Full URL.
- An input that cannot be represented safely is rejected with an explanation.

### 4.2 Find and Understand Managed Pieces

**Description:** The Structured View makes large URLs scannable and allows the
developer to narrow the visible pieces without changing the Current URL.
This feature realizes UJ-1.

**Functional Requirements:**

#### FR-4: Search Managed Pieces

The developer can search across Domain, Path Segments, Query Parameter keys, and
Query Parameter values.

**Consequences (testable):**
- Search results update without mutating the Current URL or creating a History
  Entry.
- Matching is case-insensitive by default.
- Clearing the search restores all Managed Pieces in their original order.
- A no-results message explains that no Managed Piece matches the search.

#### FR-5: Identify piece type and position

The developer can distinguish every Managed Piece's type and its position among
pieces of that type.

**Consequences (testable):**
- Domain, Path Segment, and Query Parameter controls have persistent text or
  semantic labels.
- Duplicate Query Parameter keys remain individually identifiable.
- Search does not obscure the original ordering information.

### 4.3 Precise Structured Editing

**Description:** The developer can change only the intended Managed Piece while
the product preserves all unaffected URL content. This feature realizes UJ-1.

**Functional Requirements:**

#### FR-6: Edit a Managed Piece

The developer can edit the Domain, a Path Segment, or either part of a Query
Parameter.

**Consequences (testable):**
- An accepted edit updates the Current URL and Full URL.
- All unaffected Managed Pieces retain their values and order.
- Domain editing applies only the minimum validation needed to produce a valid
  Absolute URL.
- An invalid edit is explained and cannot corrupt the Last Valid URL.

#### FR-7: Remove a Managed Piece

The developer can remove a Path Segment or Query Parameter.

**Consequences (testable):**
- Removal produces valid delimiters in the Current URL.
- Removing one duplicate Query Parameter does not remove its siblings.
- Domain removal is unavailable because the product requires an Absolute URL.
- After removal, focus moves to the next surviving Managed Piece, or to the
  previous piece when no next piece exists.

#### FR-8: Add a Query Parameter

The developer can add a Query Parameter with a key and optional value.

**Consequences (testable):**
- The new Query Parameter appears after existing Query Parameters by default.
- Empty and absent values remain distinguishable.
- Adding a Query Parameter creates one History Entry.
- After addition, keyboard focus moves to the new Query Parameter key.

#### FR-9: Reorder Query Parameters

The developer can change the order of Query Parameters.

**Consequences (testable):**
- Reordering changes only Query Parameter order.
- Duplicate keys and their values remain intact.
- One completed reorder operation creates one History Entry.
- Move Up and Move Down controls provide a keyboard-operable alternative to any
  pointer or drag interaction.

### 4.4 Full URL Editing and Two-Way Synchronization

**Description:** The Full URL is an editable representation, not a read-only
output. Valid committed changes flow into the Structured View, while incomplete
work cannot displace the Last Valid URL. This feature realizes UJ-1.

**Functional Requirements:**

#### FR-10: Edit the Full URL

The developer can edit or replace the Full URL during an active session.

**Consequences (testable):**
- Every syntactically valid Full URL edit updates every affected Managed Piece
  immediately.
- A paste or replace action is treated as one Committed Mutation.
- The product coalesces one uninterrupted Full URL editing session into one
  Committed Mutation rather than creating one mutation for each keystroke.
- A Full URL editing session closes on blur, Enter, or before another product
  mutation begins.

#### FR-11: Preserve the Last Valid URL during invalid drafts

The product can keep a Draft URL separate from the Last Valid URL until the
draft is valid and committed.

**Consequences (testable):**
- An incomplete or invalid Draft URL receives a clear inline explanation.
- The Structured View continues to represent the Last Valid URL.
- Copy returns the Last Valid URL while the Draft URL is invalid.
- The product never presents an invalid Draft URL as successfully synchronized.

#### FR-12: Guarantee synchronized committed state

The product can maintain one Current URL shared by the Full URL and Structured
View.

**Consequences (testable):**
- After every Committed Mutation, both representations encode the same URL.
- A changed counterpart is visibly indicated without blocking further work.
- No accepted mutation leaves the product in a partially updated state.

### 4.5 Reversible Change History

**Description:** Every URL-changing action is reversible, while navigation,
search, focus, and selection do not pollute URL history. This feature realizes
UJ-1.

**Functional Requirements:**

#### FR-13: Record URL mutations

The product can create one History Entry for each Committed Mutation.

**Consequences (testable):**
- Editing, adding, removing, reordering, and committed Full URL changes create
  History Entries.
- Search, focus, selection, scrolling, and validation attempts that do not
  change the Current URL create no History Entry.
- Each History Entry contains enough state to restore the prior Current URL
  exactly.

#### FR-14: Undo stepwise

The developer can undo Committed Mutations one at a time through a visible
control, `Ctrl+Z`, or the equivalent platform keyboard shortcut.

**Consequences (testable):**
- Undo restores both Full URL and Structured View together.
- Repeated Undo restores the Initial URL exactly, including its original
  serialization.
- When focus is inside an editable text field, the platform Undo shortcut
  retains native text-editing behavior; it does not invoke product Undo.
- When focus is outside editable text fields, `Ctrl+Z`/`Cmd+Z` invokes product
  Undo.
- After Undo, focus returns to the affected logical item when that item exists;
  otherwise it moves to the nearest surviving Managed Piece or the Full URL.
- Undo is unavailable or clearly inactive when the Initial URL is current.
- One completed reorder or one committed Full URL editing session is undone as
  one step.

### 4.6 Trustworthy Copy and Feedback

**Description:** The product makes state changes apparent and lets the developer
copy the result without independently reconciling representations. Realizes
UJ-1.

**Functional Requirements:**

#### FR-15: Copy the current valid result

The developer can copy the Current URL from a persistent Copy action.

**Consequences (testable):**
- Copy never returns an earlier valid state after a Committed Mutation.
- Copy returns the Last Valid URL while a Draft URL is invalid.
- The developer receives nonblocking feedback indicating whether Copy succeeded
  or failed.
- Clipboard failure is surfaced; it is not presented as success.

#### FR-16: Confirm state changes

The product identifies the representation or Managed Piece that changed without
interrupting the editing flow.

**Consequences (testable):**
- Accepted mutations receive visible, non-modal confirmation.
- The corresponding change in the other representation is apparent.
- Feedback does not steal keyboard focus from the developer's active control.

## 5. V1 Scope

### 5.1 In Scope

- Standalone public web delivery with browser-local URL processing.
- Absolute URL intake and clear rejection guidance.
- Full URL plus structured Domain, Path Segment, and Query Parameter views.
- Search, edit, remove, Query Parameter addition, and Query Parameter ordering.
- Two-way synchronization with Last Valid URL protection.
- Complete stepwise Undo to the Initial URL.
- Copy of the latest valid committed state.
- Operation at the approved capacity thresholds.

### 5.2 Out of Scope for V1

- API-client behavior or replacement of Postman, Insomnia, or Hoppscotch.
- Saved sessions or state that survives page closure.
- Accounts, authentication, cloud persistence, sharing, or collaboration.
- Multi-user workflows and shareable links.
- Relative URLs and domain-only inputs.
- URL shortening, batch processing, or bulk URL comparison.
- Postman or Insomnia integration.
- Editing the scheme as a Managed Piece.
- Fragment editing as a Managed Piece.
- General-purpose percent-encoding guidance or network request execution.
- Mobile-optimized editing workflows. The web experience should remain usable
  at narrow widths, but V1 interaction design is desktop-first.
- Redo. V1 guarantees complete Undo but does not require a forward-history
  action.

## 6. Cross-Cutting Non-Functional Requirements

### 6.1 Privacy and Data Handling

- **NFR-1:** URL content must be parsed, edited, searched, stored in history,
  and copied entirely within the browser.
- **NFR-2:** The product must not transmit or persist URL content, including
  through analytics, logging, crash reports, or server requests.
- **NFR-3:** Closing or reloading the page must clear the editing session.

### 6.2 Reliability and Integrity

- **NFR-4:** A Committed Mutation must update the Full URL, Structured View,
  History, and Copy source atomically from the user's perspective.
- **NFR-5:** Invalid edits must preserve the Last Valid URL and its History so
  that prior states remain restorable.
- **NFR-6:** Complete Undo must restore the Initial URL exactly, not merely an
  equivalent canonical URL; History Entries must therefore retain exact Full
  URL snapshots alongside any parsed representation.
- **NFR-7:** The product must not omit, merge, or reorder Managed Pieces except
  in direct response to an accepted user action.

### 6.3 Performance and Capacity

- **NFR-8:** The product must remain operable for an Absolute URL up to 20,000
  characters and at least 250 Query Parameters.
- **NFR-9:** At the supported limit, parsing, search, editing, reordering, Undo,
  and Copy must complete without browser freezing, omitted pieces, or layout
  overflow that blocks operation.
- **NFR-10:** Interactive feedback should appear without perceptible delay under
  the supported limit. Verification will use a 100 ms target for local
  interaction response and a 1 second target for initial parsing on hardware
  with at least 4 logical CPU cores and 8 GB RAM.
- **NFR-11:** V1 must support the latest two major versions of Chrome, Firefox,
  Edge, and Safari at release.

### 6.4 Accessibility and Interaction

- **NFR-12:** Every V1 action must be operable by keyboard without requiring
  pointer drag gestures.
- **NFR-13:** Editing must retain focus on the active control unless the action
  adds, removes, or restores an item; those actions must follow the deterministic
  focus outcomes defined in FR-7 through FR-9 and FR-14.
- **NFR-14:** Piece types, validation state, change confirmation, and disabled
  actions must not rely on color alone.
- **NFR-15:** Controls must expose accessible names, validation messages must be
  programmatically associated with their inputs, and non-blocking status
  messages must be announced without moving focus.
- **NFR-16:** V1 must meet WCAG 2.2 AA for UJ-1, verified through automated
  checks and manual keyboard, focus, 200% zoom, contrast, and status-announcement
  testing.
- **NFR-17:** Every required V1 action must remain available without horizontal
  page scrolling at viewport widths of 768 CSS pixels or greater.

## 7. Success Metrics

**Primary**

- **SM-1: Unassisted task completion** - At least 90% of 5–8 representative web
  developers complete paste, find, change, Undo, and Copy without assistance.
  Validates FR-1, FR-4, FR-6, FR-14, and FR-15.
- **SM-2: State-integrity failures** - Zero critical synchronization, Undo, or
  stale-Copy failures during the representative evaluation and automated
  acceptance suite. Validates FR-12 through FR-15 and NFR-4 through NFR-7.

**Secondary**

- **SM-3: Supported-capacity operation** - All Managed Pieces remain present,
  searchable, editable, reorderable, undoable, and copyable for approved
  fixtures up to 20,000 characters and at least 250 Query Parameters. Validates
  FR-2, FR-4, FR-6 through FR-9, and NFR-8 through NFR-10.
- **SM-4: Invalid-edit containment** - Every tested invalid edit is explained
  and none corrupts the Last Valid URL or its History. Validates FR-6, FR-11,
  NFR-5, and NFR-6.

**Counter-metrics**

- **SM-C1: Validation rejection rate** - Do not maximize rejection or enforce a
  narrow domain policy to make validity metrics look better; uncommon but
  standards-representable Absolute URLs must remain editable. Counterbalances
  SM-2 and SM-4.
- **SM-C2: Raw speed at the expense of control** - Do not reduce interaction
  time by hiding confirmation, collapsing duplicate Query Parameters, skipping
  History Entries, or auto-canonicalizing away meaningful input. Counterbalances
  SM-1 and SM-3.

## 8. Risks and Mitigations

- **Semantic drift:** Parsing or serialization can change meaning through
  duplicate-key handling, encoding, or canonicalization. Mitigate with
  standards-based fixtures and exact round-trip assertions for unaffected
  content.
- **Conflicting edit state:** Full URL typing can be temporarily invalid.
  Mitigate by separating Draft URL from Last Valid URL and making Copy behavior
  explicit.
- **Undo ambiguity:** Keystrokes and compound interactions can create noisy or
  surprising history. Mitigate by defining History Entries around committed
  user intent rather than raw input events.
- **Large-set interaction:** Hundreds of Query Parameters can make search,
  editing, and reordering unusable even when rendering succeeds. Mitigate with
  capacity fixtures that verify operability, not only load completion.
- **Privacy regression:** Analytics or error tooling can inadvertently capture
  URL content. Mitigate by treating URL payloads as prohibited telemetry and
  verifying outbound requests.

## 9. Invalid Draft Decision

While the Draft URL is invalid, Structured View mutations remain enabled and
operate against Last Valid URL without changing the Draft text. Before the first
such mutation, close the Full URL edit and record its baseline-to-last-valid
transition when those snapshots differ. Append each structured mutation
chronologically against Last Valid. When the Full URL is later corrected, use
the latest Last Valid snapshot as its baseline rather than the stale focus-entry
snapshot.
