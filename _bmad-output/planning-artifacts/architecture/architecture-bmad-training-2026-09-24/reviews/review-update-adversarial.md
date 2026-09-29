# Updated Adversarial Divergence Review — Architecture Spine

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Lens:** Adversarial divergence, restricted to genuine Critical/High holes
**Mode:** Validate only; no source files were modified.

## Verdict

**GATE FAIL — 0 Critical, 4 High.**

The update closes the prior blocking/high seams for chronological History,
exact-token identity LCS, parse publication, and the broad codec profiles. Two
independent implementations can still obey every adopted AD yet diverge at four
release-significant boundaries: edit provenance inside the codec, stale focus
execution, overlapping clipboard lifecycles after timeout or a newer Copy
attempt, and the release-evidence oracle.

## Independent-unit construction

The adversarial pair below is held constant across the review:

- **Unit A — transition-first implementation:** `core/session` receives
  value-oriented editor commands, acknowledges bounded effect timeouts as final,
  and treats evidence rows as independently passable checks.
- **Unit B — operation-first implementation:** editor commands retain input
  splice provenance, adapters retain unresolved-operation fences after timeout,
  and evidence is evaluated as one typed release manifest.

Both units use the single reducer, lossless model, named codec profiles, pinned
IDN options, exact-token LCS, parse generation/epoch/revision predicate,
strictly ordered effect IDs, UX focus/feedback tables, and the shared corpus.
The findings identify where those rules still permit different observable
results.

## Critical

None.

## High

### H1 — “New Unicode” has no normative edit-provenance contract

- **Location:** AD-3, lines 71–84; AD-1, lines 46–49.
- **Trigger condition:** A field already contains raw Unicode accepted through
  Full URL, and the user replaces a selection with the same visible Unicode or
  edits another part of that field. AD-3 simultaneously requires new Unicode
  to be UTF-8 percent-encoded and every untouched substring to remain
  byte-identical, but it does not define the command payload or how “new” versus
  “untouched” text is identified.
- **Unit A:** `editPiece(id, finalDraft)` compares only old and final strings.
  A same-text replacement is a no-op; a broader commit may preserve every raw
  Unicode occurrence because no unique insertion range can be recovered.
- **Unit B:** `editPiece(id, range, insertedText)` encodes the inserted Unicode
  even when the final displayed text equals the prior text, while preserving
  the untouched prefix and suffix.
- **Why both obey the ADs:** Both use one raw-component codec, preserve valid
  `%HH`, reject malformed percent text, apply the exhaustive component profile,
  and attempt to preserve untouched bytes. The architecture never makes input
  splice provenance part of the core command contract.
- **Potential consequence:** The same edit can produce no History entry and
  retain raw Unicode in one build, but produce an encoded serialization and a
  History entry in another; Copy and exact Undo strings diverge.
- **Required guard:** Define Managed Piece editing as a normative splice
  command carrying the prior token revision, selection range, and inserted
  text. State that only inserted text is encoded, untouched ranges retain exact
  bytes, and stale ranges are rejected or deterministically rebased. Add corpus
  vectors for same-text replacement, paste over raw Unicode, repeated Unicode,
  combining sequences, and edits adjacent to `%HH`.

### H2 — Revision checks govern stale focus outcomes, not stale focus invocation

- **Location:** AD-13, lines 224–244; AD-5, lines 107–117.
- **Trigger condition:** A focus intent waits behind an asynchronous effect.
  Before it starts, a later transition removes, hides, recreates, or supersedes
  its target and advances `stateRevision`.
- **Unit A:** The executor checks revision only when acknowledging the focus
  adapter’s result. It invokes the old intent, may move DOM focus using its
  operation fallback, then acknowledges the outcome as stale without changing
  reducer state.
- **Unit B:** The executor checks the originating revision immediately before
  invoking `platform/focus`; it acknowledges a stale intent without touching
  the DOM.
- **Why both obey the ADs:** Both execute IDs strictly serially, mount resolved
  targets before focus, implement the complete UX tables, and ensure a stale
  non-clipboard outcome causes no committed-state change or new effect. The DOM
  focus movement occurs before the “stale outcome” rule applies.
- **Potential consequence:** A delayed Remove, Reorder, Undo, or safe-copy
  focus intent can steal focus from the user, focus a fallback for an obsolete
  operation, or generate browser/AT behavior that differs across executors.
- **Required guard:** Require a reducer-owned claim/preflight transition
  immediately before every non-clipboard adapter invocation. If `stateRevision`
  or the typed target precondition is stale, acknowledge without invoking the
  adapter. Define whether any operation-specific focus intent may survive a
  revision change and encode that exception in its payload and corpus oracle.

### H3 — Copy timeout and newer-attempt ordering can publish stale clipboard recovery

- **Location:** AD-13, lines 224–238.
- **Trigger condition:** Copy A invokes the non-cancellable Clipboard API. A
  bounded timeout acknowledges A, Copy B is attempted, and A later settles; or
  Copy B is already queued when A reports failure.
- **Unit A:** Timeout is terminal for sequencing, so B starts after A’s timeout
  acknowledgement. A late browser write may overwrite B. If A’s failure arrives
  after B was attempted, A still creates `safe-copy-readonly`; because the
  “next Copy attempt” already happened, that stale recovery remains until Copy C
  or a URL mutation.
- **Unit B:** The reducer records `latestCopyAttemptId`, suppresses recovery for
  any older attempt, and the clipboard adapter retains an unresolved-operation
  fence after the user-visible timeout so a newer API write cannot overlap A.
- **Why both obey the ADs:** Both preflight `attemptedSerialized`, report an
  invoked operation truthfully, use bounded timeout outcomes, acknowledge each
  effect once, and serialize effect IDs. AD-13 does not define the lifecycle of
  the underlying promise after timeout, nor whether “next Copy attempt” is
  measured before or after an older failure creates recovery.
- **Potential consequence:** The clipboard can end with an older URL after a
  newer Copy, or the UI can focus/select stale safe-copy content after the user
  has already requested a newer value—the exact stale-Copy failure AD-13 and
  AD-14 intend to prevent.
- **Required guard:** Separate user-visible timeout acknowledgement from
  underlying clipboard-operation settlement. Permit no later Clipboard API
  invocation while an earlier write remains unresolved, and define the degraded
  recovery path if it never settles. Store `latestCopyAttemptId`; an older
  outcome may receive truthful non-success status but may not create or retain
  safe-copy recovery after a newer attempt. Add timeout/late-success,
  timeout/late-failure, A-fails-after-B-attempt, and A-times-out-before-B corpus
  traces.

### H4 — The evidence matrix has no single executable pass/fail oracle

- **Location:** AD-11, lines 195–204; AD-14, lines 256–274; Architecture Gate
  Closure, lines 291–297.
- **Trigger condition:** Two delivery units evaluate the same completed matrix.
  The artifact has 5–8 developers performing multiple tasks, several
  browser/AT results, and a synchronization defect requiring classification.
- **Unit A:** Computes “90% unassisted completion” across task attempts, treats a
  non-missing manual result such as `waived` as a filled cell, and lets the story
  owner decide whether the synchronization defect is critical.
- **Unit B:** Computes completion by whole-journey participant, permits only
  `pass` for required cells, and uses a centrally defined severity rubric. The
  same evidence can therefore fail for B and pass for A.
- **Why both obey the ADs:** Both use one versioned corpus, populate every
  required matrix cell, record exact versions/digest/links, test 5–8
  representative developers, calculate a 90% rate, and require zero defects
  they classify as critical. Neither AD defines the denominator, allowed result
  states, waiver policy, evidence authority, or critical-failure taxonomy.
- **Potential consequence:** Independent CI/release owners can legitimately
  disagree on whether implementation may begin or the artifact may ship,
  including shipping with a synchronization, Undo, or stale-Copy failure that
  another conforming evaluator blocks.
- **Required guard:** Publish a versioned, machine-validated evidence schema and
  gate evaluator: required cell IDs, allowed terminal states, no-waiver rules
  for mandatory cells, owner/sign-off, story-to-gate mapping, completion-rate
  denominator and rounding, and a closed taxonomy for critical synchronization,
  Undo, and stale-Copy failures. Make that evaluator—not matrix presence—the
  sole implementation-entry and release decision.

## Prior blocking/high seam disposition

| Seam | Result | Adversarial trace |
| --- | --- | --- |
| History order | Closed | AD-6 fixes close first, then a separate chronological mutation, both in one reducer transaction, and fixes the first Undo target. |
| Codec | **High remains** | Component encode sets are exhaustive, but new-versus-untouched text is not executable without splice provenance (H1). |
| Identity LCS | Closed | Path/query projections, separator exclusion, tie order, fresh IDs, and snapshot restoration are explicit. |
| Parse publication | Closed | Input snapshot, generation, epoch, committed revision, mutation invalidation, and reducer-only publication form one acceptance predicate. |
| Effect sequencing / Copy staleness | **High remains** | Strict acknowledgement order does not close non-cancellable post-timeout work or older-outcome/newer-attempt recovery (H3). |
| Focus / feedback | **High remains for focus** | UX tables, tie-breaking, and queue overflow are bound; stale invocation can still move DOM focus before its outcome is discarded (H2). |
| Evidence gates | **High remains** | Evidence breadth is explicit, but independent evaluators can compute different gate verdicts (H4). |

## Deferred residue — does not fail this gate

The following remain Medium/Low implementation concerns and are intentionally
excluded from the Critical/High verdict:

- lifecycle and clearing policy for persistent operation history after overflow;
- exact worker benchmark sampling/build-mode protocol before reopening AD-8;
- canonical preview/production header-manifest enforcement on every HTML/error
  response;
- the future bounded-History retention policy;
- editorially clarifying that the LCS tie rule is a global lexicographic
  alignment rule, although the current rule is sufficient to prevent a
  High-severity identity divergence.

## Count

| Tier | Findings |
| --- | ---: |
| Critical | 0 |
| High | 4 |
