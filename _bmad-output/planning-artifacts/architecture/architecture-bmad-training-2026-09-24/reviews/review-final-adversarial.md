# Final Adversarial Divergence Review — Architecture Spine

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-29
**Mode:** Validation only; the architecture source was not modified.
**Gate rule:** Critical/High divergence fails. Medium/Low hardening residue is
reported but does not fail this gate.

## Verdict

**GATE FAIL — 0 Critical, 1 High.**

The blocker/high update closes the earlier History, codec-profile, identity,
parse-publication, stale-focus-invocation, newer-Copy-attempt, feedback, and
evidence-evaluator holes. One High divergence remains in the Clipboard timeout
lifecycle: the first timed-out attempt is not normatively required to expose
safe-copy recovery. Two independently built units can therefore obey every AD
while giving materially different recovery behavior after the same timeout.

## Independent-unit construction

The review constructed the following feature-level units one level below the
spine and held every other adopted decision constant:

- **Unit A — timeout-as-failure:** `platform/clipboard` reports timeout while
  retaining the unresolved-write fence; `core/session` treats timeout as a
  current Copy failure and immediately creates `safe-copy-readonly`.
- **Unit B — timeout-as-pending:** `platform/clipboard` reports timeout while
  retaining the same unresolved-write fence; `core/session` emits non-success
  feedback only. It creates `safe-copy-readonly` only if the write later fails
  or the user makes another Copy attempt while the first write is unresolved.

Both units use the splice command, exhaustive codec profiles, exact snapshot
History, deterministic identity reconciliation, parse acceptance predicate,
pre-invocation focus claim, serial effect acknowledgements,
`latestCopyAttemptId`, and the machine-validated evidence oracle.

## Critical findings

None.

## High findings

### H1 — The first Clipboard timeout has two conforming recovery lifecycles

- **Location:** AD-13, lines 229–252; UX source-precedence convention, line
  305.
- **Trigger condition:** Copy A invokes the Clipboard API and reaches the
  bounded user-visible timeout while the non-cancellable write remains
  unresolved. The user has not yet made Copy B.
- **Unit A behavior:** Timeout is a typed failure outcome. The reducer reports
  it truthfully and immediately creates, focuses, and selects
  `safe-copy-readonly` containing A's `attemptedSerialized`.
- **Unit B behavior:** Timeout is a typed pending/non-success outcome rather
  than a failure. The reducer reports it truthfully but exposes no recovery.
  Recovery appears only on A's eventual failure or on a later Copy attempt,
  because AD-13 explicitly routes that later attempt to safe-copy recovery.
- **Why both obey the ADs:** AD-13 distinguishes bounded timeout from eventual
  settlement, requires recovery for a “current failure,” and explicitly
  requires a *later* attempt during unresolved work to enter recovery. It never
  states whether the initial timeout itself is a current failure that must
  create recovery. Both implementations retain the unresolved-operation fence,
  avoid another Clipboard API invocation, preserve attempt provenance, report
  the timeout truthfully, and prevent an older outcome from replacing newer
  recovery.
- **Potential consequence:** In one conforming build the user can immediately
  complete native keyboard/touch/AT Copy after timeout; in another the same
  user receives only a timeout message and must infer that Copy should be
  retried before the guaranteed fallback appears. Clipboard recovery,
  accessibility, and acceptance traces diverge at a primary FR-15 failure
  path.
- **Required guard:** State explicitly that the first user-visible timeout
  creates `safe-copy-readonly` immediately from that attempt's captured
  serialization while the unresolved-write fence remains active. A later Copy
  attempt may replace recovery with its own captured serialization but may not
  invoke the Clipboard API until the prior write settles. Add timeout-without-
  retry, timeout-then-late-success, timeout-then-late-failure, and
  timeout-then-newer-attempt traces to the shared corpus.

## Medium/Low residue — does not independently fail the gate

### M1 — UTF-16 splice ranges may split a surrogate pair

- **Location:** AD-3, lines 71–81.
- **Trigger condition:** A DOM selection boundary falls between the two UTF-16
  code units of an astral Unicode character.
- **Divergence:** One codec rejects the range; another lets its UTF-8 encoder
  replace the isolated surrogate or encode implementation-specific output.
- **Guard:** Require splice boundaries to preserve Unicode scalar-value
  boundaries, or normatively define rejection of unpaired surrogates.
- **Consequence:** The same edit can produce a field error or different bytes.

### M2 — Token-revision creation and advancement are not defined

- **Location:** AD-3, lines 72–76.
- **Trigger condition:** Local invalid drafts, rejected commits, Undo, or
  Full-URL reparsing occur between render and splice dispatch.
- **Divergence:** Units can advance token revision only on committed token
  changes or on every draft/validation transition, accepting versus rejecting
  the same delayed splice.
- **Guard:** Define the revision owner, initial value, and exact transitions
  that increment it.
- **Consequence:** Stale-edit rejection and correction flow can differ without
  corrupting committed state.

### M3 — Global LCS tie wording would benefit from an executable oracle

- **Location:** AD-5, lines 117–122.
- **Trigger condition:** Duplicate path/query tokens admit several equal-length
  alignments.
- **Divergence:** “Earliest old position then earliest new position” can be
  implemented as greedy local choice or lexicographic comparison of complete
  alignments.
- **Guard:** Define the tie as lexicographic comparison of the complete matched
  index-pair sequence and publish duplicate-heavy ID maps.
- **Consequence:** Rare duplicate patterns may retain different IDs.

### M4 — Worker-reopen profiling is not reproducible

- **Location:** AD-8, lines 170–171.
- **Trigger condition:** A team measures parser p95 near 50 ms.
- **Divergence:** Development versus production builds, warm-up, browser,
  sample size, and fixture mix can independently cross the threshold.
- **Guard:** Fix the benchmark build mode, browser/version, reference CPU
  calibration, corpus, warm-up, sample count, and percentile calculation.
- **Consequence:** Teams can reopen or retain synchronous parsing on different
  evidence.

### M5 — Security-header parity is not bound to a canonical manifest

- **Location:** AD-9, lines 178–184; AD-10, lines 191–198.
- **Trigger condition:** Preview, production, or provider-generated fallback
  HTML is served through different host configuration.
- **Divergence:** One deployment applies the CSP floor to every HTML response;
  another applies it only to production `index.html` while still promoting the
  same bundle and restoring “headers” on rollback.
- **Guard:** Version a canonical header manifest with the artifact and verify
  effective headers on preview, production, errors, and fallbacks.
- **Consequence:** Privacy hardening and preview evidence can differ.

### M6 — Late Clipboard settlement feedback can obscure the newer attempt

- **Location:** AD-13, lines 243–248; feedback rules, lines 260–268.
- **Trigger condition:** A times out, B becomes latest and opens recovery, then
  A eventually succeeds or fails.
- **Divergence:** One reducer enqueues A's late truthful outcome in ordinary
  FIFO order; another labels or suppresses it from the current-operation
  channel while retaining an audit/history record.
- **Guard:** Define the channel, wording, and ordering for late outcomes older
  than `latestCopyAttemptId`.
- **Consequence:** Users may mistake A's late success/failure for B's outcome,
  although recovery content remains protected.

### M7 — Unresolved Clipboard writes have no terminal abandonment policy

- **Location:** AD-13, lines 243–246.
- **Trigger condition:** The browser promise never settles for the remainder of
  a long-lived session.
- **Divergence:** One unit keeps every later Copy in safe recovery forever;
  another resets the fence after a browser lifecycle signal or long watchdog.
- **Guard:** State that only session teardown may clear an unresolved fence, or
  define a tested terminal-abandonment condition that cannot permit overlapping
  writes.
- **Consequence:** API-copy availability after a browser defect can differ.

### M8 — Persistent operation-history lifecycle remains undefined

- **Location:** AD-13, lines 260–268.
- **Trigger condition:** Sustained committed outcomes trigger overflow more
  than once.
- **Divergence:** Units can accumulate indefinitely, clear on related
  operation, clear on URL mutation, or cap older entries.
- **Guard:** Define placement, ordering across overflow episodes, capacity,
  clearing, focus behavior, and separation from product Undo History.
- **Consequence:** Accessibility and memory behavior diverge under sustained
  use.

### M9 — “Settled view” needs a sampling boundary

- **Location:** AD-14, lines 293–297.
- **Trigger condition:** A synchronization check observes React commit,
  layout/focus effect, live-region publication, and adapter acknowledgement at
  different instants.
- **Divergence:** Evaluators can classify the same transient mismatch as
  critical or as pre-settlement.
- **Guard:** Define settled as a named reducer/effect/render milestone and give
  the evaluator a deterministic wait/assert protocol.
- **Consequence:** The same integration trace can receive different critical
  synchronization classifications.

### L1 — Evidence-oracle integrity is versioned but not self-verified

- **Location:** AD-14, lines 285–299.
- **Trigger condition:** The schema or evaluator implementation changes while
  preserving a version string or contains an aggregation defect.
- **Divergence:** Release systems can trust the declared version alone or
  require a digest and evaluator conformance fixtures.
- **Guard:** Attach content digests for schema/evaluator and run signed or
  content-addressed evaluator self-tests before evaluating release evidence.
- **Consequence:** A faulty oracle can consistently issue the wrong result;
  this is hardening residue because AD-14 already establishes one authoritative
  evaluator and fail conditions.

## Prior blocker/high seam disposition

| Seam | Result | Adversarial confirmation |
| --- | --- | --- |
| History / close-and-rebase | Closed | AD-6 fixes close-first chronology, separate entries, mutation triggers, preserved invalid Draft, and the first Undo target. |
| Codec profiles | Closed | AD-3 fixes raw component text, complete encode profiles, `%HH` behavior, plus handling, Unicode casing, and malformed input. M1/M2 are edge hardening below the former High seam. |
| Splice provenance | Closed at High severity | The command carries prior token revision, UTF-16 range, and inserted text; only the inserted span is encoded and same-visible-text replacement is explicitly an edit. |
| Identity | Closed | AD-5 fixes token projections, excludes separator metadata, orders ties, allocates fresh unmatched IDs, and restores snapshot IDs. |
| Parse publication | Closed | Input snapshot, generation, epoch, and committed revision must all match; accepted mutations invalidate pending parses atomically. |
| Stale focus invocation | Closed | `claimEffect` runs immediately before adapter invocation and stale revision/target preconditions acknowledge without touching the DOM. |
| Copy newer-attempt lifecycle | Closed except H1 | The unresolved-write fence, `latestCopyAttemptId`, no-overlap rule, exact attempt serialization, and stale-recovery suppression close the prior older/newer race. The first-timeout recovery trigger remains open. |
| Focus / feedback | Closed at High severity | Typed UX operation tables, next-then-previous ties, reducer-owned queues, and exact overflow promotion remove the previous High divergence. |
| Evidence pass/fail | Closed | One machine-validated manifest/evaluator is the sole oracle; mandatory cells require `pass`; the denominator, no-rounding threshold, and critical failure classes are explicit. |
| IDN | Closed | Pinned `tr46` version/options, WHATWG host validation, draft ownership, source-lexeme preservation, and edited serialization form converge. |

## Counts

| Tier | Count |
| --- | ---: |
| Critical | 0 |
| High | 1 |
| Medium | 9 |
| Low | 1 |

## Gate conclusion

The architecture is close to independent implementation readiness, and all
earlier blocker/high issues except the first-timeout recovery branch are closed.
The gate fails solely on H1. The Medium/Low residue is suitable for fixture or
implementation hardening and does not independently block handoff under the
configured gate rule.
