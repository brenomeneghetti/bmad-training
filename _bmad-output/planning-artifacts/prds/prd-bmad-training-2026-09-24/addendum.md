---
title: "PRD Addendum: URL Piece Management"
status: final
created: 2026-09-24
updated: 2026-09-24
---

# PRD Addendum: URL Piece Management

## Purpose

This addendum preserves research evidence, technical decision prompts, and test
fixture guidance that support the PRD but do not belong in its capability-level
narrative.

## Competitive Position and Evidence

The competitive conclusion is deliberately narrow: parsing and basic query
editing are table stakes; local-only processing is an expected baseline for
user trust;
two-way synchronization, complete Undo, cross-piece search, and explicit Query
Parameter ordering are promising experience differentiators rather than a
durable technical moat.

Research completed on 2026-09-24 found:

- Postman documents synchronization between query parameters in its URL field
  and Params surface, establishing basic raw/structured query editing as an
  incumbent capability:
  <https://learning.postman.com/docs/sending-requests/create-requests/parameters/>
- Hoppscotch issue
  <https://github.com/hoppscotch/hoppscotch/issues/2227> records sustained user
  demand for query-parameter synchronization, showing that reliable two-way
  synchronization is not universal across established API clients.
- CodeShack's URL Parser positions browser-local processing as a trust feature:
  <https://codeshack.io/url-parser/>
- DevToys provides a comparison with open-source, offline-oriented developer
  utilities, though its URL capability is not equivalent to the complete
  editing workflow specified here: <https://github.com/DevToys-app/DevToys>
- The `query-string` package represents the library-level baseline for
  parsing/stringifying query data without supplying the product interaction
  model: <https://github.com/sindresorhus/query-string>
- The reviewed comparables did not establish complete URL-editing Undo, search
  across all URL parts, or arbitrary Query Parameter reordering as standard
  capabilities. This is a time-boxed absence finding, not proof that no product
  offers them.

## Architecture Decision Reference

### Open Semantic Decisions

Architecture and implementation should explicitly decide and document:

- whether the WHATWG URL parser is the canonical acceptance boundary;
- whether percent-encoded octets retain original casing and when normalization
  is permitted;
- how encoded `/`, `?`, `&`, `=`, and `#` characters avoid becoming structural
  delimiters;
- how the approved dual Domain display—Unicode and ASCII/Punycode—stays
  synchronized and clearly exposes homograph-relevant verification;
- how invalid percent sequences are presented when a browser parser accepts or
  normalizes them;
- how Fragments are preserved during Structured View mutations.

Use the WHATWG URL Living Standard as the primary behavioral reference:
<https://url.spec.whatwg.org/>.

### Approved Semantic and History Constraints

- History Entries store exact Full URL snapshots so complete Undo can restore
  the Initial URL even if the working parser canonicalizes it.
- The lossless ordered-entry model stores `?key`, `?key=`, duplicate keys, empty
  entries, and untouched separator syntax.

The PRD defines a History Entry as one committed user intent. Every syntactically
valid Full URL edit updates the Structured View immediately. Continuous typing
is coalesced into one Full URL focus-and-editing session, which closes on blur,
Enter, or before another product mutation begins. The implementation must
satisfy all of these constraints:

- incomplete text remains a Draft URL;
- Structured View and Copy remain bound to the Last Valid URL;
- one continuous edit is not fragmented into a separate History Entry for each
  keystroke;
- each valid input state updates all dependent state atomically;
- the platform shortcut invokes native text-editing Undo while focus is inside
  an editable text field and product-level Undo outside text editing.

## Capacity Fixture Guidance

Verification should include realistic fixtures, not only generated repetition:

- an Absolute URL near 20,000 characters with long encoded values;
- at least 250 Query Parameters, including duplicates and empty values;
- Path Segments containing encoded delimiters and Unicode;
- a Fragment preserved through unrelated structured changes;
- repeated add, remove, reorder, Full URL commit, and Undo sequences;
- search terms matching keys, values, Path Segments, and no pieces;
- invalid Draft URL transitions before and after a valid committed state.

Capacity acceptance must verify that all Managed Pieces remain present and
operable, that History remains exact, and that no layout overflow blocks a
required action.

## Prohibited Telemetry Content

URL contents, Managed Piece values, Draft URL text, clipboard content, and
History snapshots must not enter analytics, logs, error messages sent off the
device, crash reports, or performance traces. Product telemetry, if introduced,
must be limited to non-content events whose payload cannot be used to
reconstruct user URL data.

## Source Provenance and References

The PRD is based on:

- the finalized product brief at
  `../../briefs/brief-bmad-training-2026-09-24/brief.md`;
- the brief's research and implementation addendum at
  `../../briefs/brief-bmad-training-2026-09-24/addendum.md`;
- the completed URL Piece Management brainstorm at
  `../../../brainstorming/brainstorm-url-piece-management-2026-09-22/`.
