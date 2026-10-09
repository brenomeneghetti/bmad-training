---
id: SPEC-bmad-training
companions:
  - ../../planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md
  - ../../planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md
sources:
  - ../../planning-artifacts/prds/prd-bmad-training-2026-09-24/prd.md
  - ../../planning-artifacts/prds/prd-bmad-training-2026-09-24/addendum.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# URL Piece Management

## Why

Web developers need to inspect and modify long, state-bearing URLs without damaging delimiters, encoding, ordering, or unrelated values. URL Piece Management replaces error-prone text-editor workflows with a browser-local workbench whose raw and structured representations remain synchronized, reversible, and safe to copy.

## Capabilities

- **CAP-1**
  - **intent:** A developer can start a session from an HTTP/HTTPS Absolute URL and inspect its Full URL plus ordered Domain, Path Segments, and lossless Query Parameters.
  - **success:** Supported input preserves duplicate keys, empty and absent values, encoded delimiters, IDN forms, untouched separators, and Fragment content without omission, merging, or silent reordering; unsupported input does not replace the session.
- **CAP-2**
  - **intent:** A developer can find and identify Managed Pieces across large URLs without changing URL state.
  - **success:** Case-insensitive search covers Domain, Path Segments, Query Parameter keys and values, preserves source order and stable identity, reports no matches, and creates no History Entry.
- **CAP-3**
  - **intent:** A developer can precisely edit or remove Managed Pieces, add Query Parameters, and explicitly reorder Query Parameters while preserving unaffected URL content.
  - **success:** Each accepted operation updates only its target, creates one History Entry, retains duplicate identity and order, and follows deterministic keyboard focus behavior.
- **CAP-4**
  - **intent:** A developer can edit the complete Full URL with trustworthy two-way synchronization while incomplete or invalid text remains an isolated Draft URL.
  - **success:** Valid states atomically synchronize every representation; invalid Draft text is preserved while Structured View and Copy operate on Last Valid URL; closing the Full URL edit records any baseline transition before structured mutations, and later correction rebases on the latest committed snapshot.
- **CAP-5**
  - **intent:** A developer can reverse each committed URL mutation stepwise to the exact Initial URL.
  - **success:** Visible Undo and the guarded platform shortcut restore exact serialized snapshots, synchronized pieces, stable identities, and deterministic focus; non-URL interactions and raw keystrokes do not pollute product History.
- **CAP-6**
  - **intent:** A developer can copy the latest valid committed URL and understand mutation, validation, and copy outcomes without workflow interruption.
  - **success:** Copy never returns stale or invalid Draft content, clipboard failure exposes the exact source for manual copy, and feedback neither falsely reports success nor steals focus outside explicit recovery.

## Constraints

- All URL processing and session state remain browser-local. URL-bearing content cannot enter network requests, persistence, telemetry, logs, crash reports, or performance traces; reload or close clears the session.
- V1 accepts only complete HTTP/HTTPS Absolute URLs with a host. Relative URLs, domain-only input, and other schemes cannot start or replace a session.
- Committed state is atomic across Full URL, Structured View, History, and Copy source. Invalid edits preserve Last Valid URL and exact restorable History.
- Supported URL semantics remain lossless: exact snapshots preserve serialization, query entries remain ordered and distinct, encoded structural delimiters stay data, and unrelated mutations cannot canonicalize untouched content.
- The application remains operable at 20,000 URL characters and at least 250 Query Parameters, targeting initial parse within 1 second and local interaction feedback within 100 ms on 4-core/8-GB reference hardware.
- Release supports the latest two major Chrome, Firefox, Edge, and Safari versions and blocks on the browser and assistive-technology evidence defined by the companions.
- The complete journey and failure states meet WCAG 2.2 AA. Every action is keyboard-operable, required controls remain available at 320 CSS px and 400% zoom without page-level horizontal scrolling, and state never relies on color alone.
- V1 is a static, responsive, desktop-first single-workbench application with full-DOM rendering at the supported capacity. No backend or runtime environment branch may alter URL semantics.

## Non-goals

- Accounts, authentication, saved or shared sessions, collaboration, or cloud persistence.
- API-client behavior, network requests, URL shortening, batch processing, bulk comparison, or Postman and Insomnia integration.
- Relative URLs or managed editing of Scheme and Fragment.
- Mobile-optimized workflows, Redo, theme switching, or a separate icon language.
  Story 4.1 applies the approved fixed dark identity, not a selectable theme.

## Success signal

- Five to eight representative developers complete paste, find, change, Undo, and Copy unassisted at least 90% of the time, with zero critical synchronization, Undo, or stale-Copy failures.
- Capacity fixtures preserve every Managed Piece and exact state through parsing, search, editing, reordering, Undo, and Copy at 20,000 characters and at least 250 Query Parameters.
