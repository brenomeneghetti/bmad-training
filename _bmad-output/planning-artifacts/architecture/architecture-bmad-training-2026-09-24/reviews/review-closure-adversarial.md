# Closure Adversarial Review — Architecture Spine

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-29
**Mode:** Validation only; the architecture source was not modified.
**Gate rule:** Critical/High compliant-but-incompatible implementations fail.
Medium/Low hardening residue is non-failing.

## Verdict

**GATE PASS — 0 Critical, 0 High.**

The first Clipboard timeout now deterministically creates immediate safe-copy
recovery from the timed-out attempt's captured serialization while explicitly
retaining the unresolved-write fence. All earlier blocker/high seams were
replayed against independently built units; none still permits a
Critical/High compliant-but-incompatible implementation.

## Clipboard timeout closure trace

### Trigger

Copy A captures `attemptedSerialized`, passes the current-source preflight,
invokes the non-cancellable Clipboard API, and reaches its bounded
user-visible timeout before the browser promise settles.

### Required conforming transition

AD-13 now requires all of the following in the timeout transition:

1. the timeout is reported truthfully;
2. safe-copy recovery is created **immediately** from A's captured
   serialization;
3. the timeout does not mark the underlying write settled;
4. the unresolved-write fence remains active;
5. a later Copy B becomes `latestCopyAttemptId`, replaces recovery with B's
   captured serialization, and does not invoke the Clipboard API;
6. A's later settlement cannot create, focus, or retain recovery after B; and
7. current recovery preserves Draft and History and remains until the next Copy
   attempt or URL mutation.

### Adversarial pair result

- **Former timeout-as-pending unit:** reports timeout but exposes no recovery
  until a retry or eventual failure. This unit is no longer conforming because
  AD-13 says the first timeout immediately creates recovery.
- **Former timeout-as-terminal unit:** exposes recovery but clears the fence and
  permits Copy B to invoke the Clipboard API. This unit is no longer conforming
  because AD-13 says timeout does not settle the write and the later attempt
  must not invoke the API.

Only immediate recovery plus a retained unresolved-write fence conforms.

## Critical findings

None.

## High findings

None.

## Earlier blocker/high seam replay

| Seam | Result | Closure evidence |
| --- | --- | --- |
| Full URL close-and-rebase chronology | Closed | AD-6 fixes close-first processing, separate chronological entries, Last Valid mutation, invalid Draft preservation, and the first Undo target in one reducer transaction. |
| Invalid-Draft source conflict | Closed | AD-6 makes structured mutation against Last Valid and later correction rebasing normative rather than selectable. |
| Managed Piece codec boundary | Closed | AD-3 fixes raw component text, splice provenance, stale/range rejection, opaque valid triplets, malformed-percent behavior, Unicode handling, and exhaustive path/query profiles. |
| Edit provenance | Closed | Revision, UTF-16 selection range, and inserted text are command data; only the inserted span is encoded and same-visible-text replacement remains an edit. |
| Identity reconciliation | Closed | AD-5 fixes path/query comparison projections, separator exclusion, tie order, fresh unmatched IDs, and exact snapshot-ID restoration. |
| IDN acceptance profile | Closed | AD-4 pins `tr46` 6.0.0, every relevant option, WHATWG host validation, draft ownership, source-lexeme preservation, and edited serialization form. |
| Parse supersession | Closed | AD-8 requires input snapshot, generation, epoch, and committed revision to match and atomically invalidates pending parses on accepted product mutation. |
| Effect sequencing | Closed | AD-13 requires strictly serial start after exactly one reducer acknowledgement and typed bounded outcomes. |
| Stale focus invocation | Closed | The reducer-owned `claimEffect` occurs immediately before adapter invocation; stale revision/target preconditions acknowledge without invoking or touching the DOM. |
| Focus fallback behavior | Closed | Typed operation/Undo tables and next-then-previous post-transition tie resolution are mandatory. |
| Feedback overflow | Closed at High | Reducer-owned channels and the exact current/pending/incoming promotion rule prevent loss, duplication, and incompatible counts. |
| Clipboard overlap and stale recovery | Closed | Timeout is distinct from settlement; no newer API invocation overlaps an unresolved write; `latestCopyAttemptId` prevents older recovery from winning. |
| First-timeout recovery | Closed | The first timeout immediately creates recovery from its own captured serialization while the unresolved-write fence remains active. |
| Evidence-gate oracle | Closed | AD-14 makes one machine-validated manifest/evaluator authoritative and fixes mandatory states, denominator, no-rounding rule, and critical failure taxonomy. |
| Stack handoff reality | Closed at High | Versions are an explicit greenfield target; evidence records exact tested versions and artifact/evaluator identity. |

## Non-failing Medium/Low residue

These issues do not reopen a Critical/High implementation split under the
requested gate.

### R1 — UTF-16 splice boundaries can split a surrogate pair

- **Location:** AD-3.
- **Trigger condition:** A selection boundary lies between the UTF-16 code
  units of an astral character.
- **Guard snippet:** Require Unicode scalar-value boundaries or define
  deterministic rejection of unpaired surrogates.
- **Potential consequence:** An implementation may reject while another
  encodes a replacement character.

### R2 — Token revision advancement is not fully enumerated

- **Location:** AD-3.
- **Trigger condition:** Invalid drafts, rejected commits, Undo, or Full URL
  reparsing occur between render and splice dispatch.
- **Guard snippet:** Define the revision owner, initial value, and every
  incrementing transition.
- **Potential consequence:** Delayed edits may be accepted or rejected
  differently without corrupting committed state.

### R3 — LCS tie wording lacks an executable alignment oracle

- **Location:** AD-5.
- **Trigger condition:** Duplicate tokens allow several equal-length LCS
  alignments.
- **Guard snippet:** Define lexicographic comparison of the complete matched
  index-pair sequence and publish duplicate-heavy fixtures.
- **Potential consequence:** Rare duplicate patterns may retain different IDs.

### R4 — Worker-reopen profiling is not reproducible

- **Location:** AD-8.
- **Trigger condition:** Parser p95 is near the 50 ms threshold.
- **Guard snippet:** Fix build mode, browser/version, reference calibration,
  corpus, warm-up, sample count, and percentile calculation.
- **Potential consequence:** Teams may reach different worker-reopen decisions.

### R5 — Security-header parity is not bound to a canonical manifest

- **Location:** AD-9 and AD-10.
- **Trigger condition:** Preview, production, and provider-generated HTML use
  different host configuration.
- **Guard snippet:** Version a header manifest with the artifact and verify all
  HTML, fallback, and error responses.
- **Potential consequence:** Privacy hardening or boot behavior may vary by
  environment.

### R6 — Late Clipboard settlement feedback channel is not fixed

- **Location:** AD-13.
- **Trigger condition:** A times out, B opens newer recovery, then A settles.
- **Guard snippet:** Define wording, ordering, and channel for outcomes older
  than `latestCopyAttemptId`.
- **Potential consequence:** Users may misassociate truthful late feedback with
  the newer attempt, although recovery content remains protected.

### R7 — Permanently unresolved Clipboard writes have no abandonment policy

- **Location:** AD-13.
- **Trigger condition:** The browser promise never settles during a long-lived
  session.
- **Guard snippet:** State that only session teardown clears the fence, or
  define a tested terminal condition that cannot allow overlapping writes.
- **Potential consequence:** Native API Copy may remain degraded for the
  session or implementations may recover it at different times.

### R8 — Persistent operation-history lifecycle is undefined

- **Location:** AD-13.
- **Trigger condition:** Feedback overflow occurs repeatedly.
- **Guard snippet:** Define placement, capacity, clearing, ordering, focus, and
  separation from product Undo History.
- **Potential consequence:** Accessibility and memory behavior can differ in
  long sessions.

### R9 — “Settled view” lacks a precise sampling milestone

- **Location:** AD-14.
- **Trigger condition:** The evaluator observes reducer commit, React commit,
  layout/focus work, and live-region publication at different instants.
- **Guard snippet:** Name the settled milestone and deterministic wait/assert
  protocol.
- **Potential consequence:** The same transient mismatch may receive different
  critical synchronization classifications.

### R10 — Evidence-oracle implementation integrity is not self-verified

- **Location:** AD-14.
- **Trigger condition:** Evaluator/schema content changes without a trustworthy
  implementation identity or contains an aggregation defect.
- **Guard snippet:** Record content digests and run evaluator conformance
  fixtures before accepting release evidence.
- **Potential consequence:** A faulty authoritative evaluator can consistently
  issue the wrong gate result.

## Gate conclusion

The blocker/high closure is complete. The new timeout sentence removes the last
High divergence by requiring the first timeout to produce immediate safe-copy
recovery without relaxing the non-cancellable unresolved-write fence. The
remaining residue is implementation hardening and does not fail this gate.
