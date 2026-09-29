# PRD Update Reconciliation — Architecture Spine

**Date:** 2026-09-29
**Scope:** Update-only reconciliation of the edited AD-3, AD-5, AD-6, AD-8,
AD-13, AD-14, and Architecture Gate Closure against `prd.md` and `addendum.md`.
This is not a general architecture review.

## Verdict

**ACTION REQUIRED — the approved invalid-Draft/close-and-rebase policy is
substantively carried into AD-6 and the release-evidence chain, but two rule
wordings remain broader or weaker than the PRD contract.**

No PRD capability, privacy constraint, accessibility/capacity gate, product
tone, or scope boundary was otherwise lost by the edited decisions.

## Mismatches Requiring Action

### 1. AD-6 closes on every non-Full-URL command, not only the PRD closure events

**Architecture text:** AD-6 ends with “every non-Full-URL product command first
dispatches `closeFullUrlEdit`.”

**PRD contract:** FR-10 closes a Full URL editing session on blur, Enter, or
before another **product mutation** begins. FR-13 separately requires search,
focus, selection, scrolling, and non-mutating validation attempts to create no
History Entry. The approved Invalid Draft Decision likewise says to close
before the first Structured View **mutation**.

**Why this needs action:** “Every non-Full-URL product command” can include
search, selection, validation, or other reducer commands that do not mutate the
URL. That wording permits a non-mutating command to close the session and append
the pending baseline-to-last-valid History Entry, broadening the approved
closure policy and making History timing depend on an action the PRD explicitly
classifies as non-history behavior.

**Required reconciliation:** Narrow the controller rule to blur, Enter, and
non-Full-URL commands that can commit a product mutation. Non-mutating commands
must not close the Full URL edit merely because they are commands. Preserve the
same-transaction close-and-rebase ordering for actual mutations.

### 2. AD-13 can suppress the Copy outcome required by FR-15

**Architecture text:** AD-13 says that a stale async success, failure, or timeout
is acknowledged and pruned “without creating feedback, recovery, focus, or
committed-state changes.” It then says clipboard failure creates the safe-copy
value and focus intent, without defining whether that applies to stale failure.

**PRD contract:** FR-15 requires nonblocking feedback indicating whether Copy
succeeded or failed and requires clipboard failure to be surfaced rather than
presented as success. The Decision Summary and SM-2 require zero stale-Copy
failures.

**Why this needs action:** A clipboard result can become revision-stale while
the adapter is pending. Under the current first sentence, that Copy attempt can
finish with neither success/failure feedback nor failure recovery. The following
clipboard-failure sentence appears to require recovery, so AD-13 is also
internally ambiguous for stale failures. Revision staleness may prevent an old
result from altering committed URL state, but it does not remove the PRD
obligation to give an accurate outcome for the Copy attempt or ensure that a
delayed adapter does not write a superseded snapshot.

**Required reconciliation:** Define Copy-specific stale handling. Before
clipboard execution, validate the intent against the current Copy source or
replace/cancel it deterministically; after execution, surface the truthful
outcome for that attempt through a channel that cannot masquerade as confirmation
of the current revision. Every real clipboard failure must retain the specified
safe-copy recovery. The rule must explicitly prevent a queued Copy from writing
an older snapshot after a newer Committed Mutation.

## Reconciliation Findings

### Approved invalid-Draft / close-and-rebase policy

The PRD package is now upstream-consistent on the approved policy:

- The PRD Decision Summary states that Structured View remains editable against
  Last Valid while invalid Draft text is preserved.
- FR-10 defines closure on blur, Enter, or before another product mutation.
- FR-11 keeps Draft separate from Last Valid and keeps Copy bound to Last Valid.
- FR-13 and FR-14 preserve intent-level chronological History and stepwise Undo.
- Section 9 requires baseline-to-last-valid closure before the first structured
  mutation, chronological structured entries, and correction rebased from the
  latest Last Valid snapshot.
- The addendum’s approved constraints remain compatible: incomplete text stays
  Draft, Structured View and Copy remain bound to Last Valid, continuous typing
  is coalesced, valid states update atomically, and native/product Undo scopes
  remain separate. The addendum does not restate close-and-rebase, but it does
  not contradict the later final PRD decision.

AD-6 correctly carries the material policy:

- one focus-session baseline;
- no per-keystroke History;
- baseline-to-last-valid closure before a different mutation;
- the structured mutation applied separately and chronologically against Last
  Valid;
- invalid Draft text preserved;
- later correction rebased from latest Last Valid;
- prior structured entries neither replaced nor merged;
- first Undo reversing the most recent committed product intent.

The only AD-6 reconciliation defect is the overbroad final “every command”
dispatch rule identified above.

### AD-3 — Component-text codec

**Reconciled.** The edit strengthens, rather than changes, the PRD/addendum
semantic contract:

- exact percent-triplet preservation and casing satisfy FR-3, NFR-6/NFR-7, and
  the addendum’s percent-casing prompt;
- encoded structural delimiters remain non-structural;
- malformed component edits cannot corrupt Last Valid;
- malformed text already accepted through Full URL remains visible and
  byte-preserved through unrelated mutations and Copy;
- untouched content remains exact, supporting complete Undo and lossless Copy;
- Unicode and delimiter encoding rules avoid silent normalization or
  double-encoding.

No product requirement is narrowed. The distinction between rejecting a
malformed Structured View commit and preserving malformed text already accepted
through Full URL is consistent with the PRD’s Last Valid/error behavior.

### AD-5 — Snapshot history and identity

**Reconciled.** Complete before/after snapshots and immutable piece IDs preserve
FR-5, FR-7 through FR-14, NFR-4 through NFR-7, and NFR-13/NFR-15. The explicit
LCS token keys retain duplicate-piece identity deterministically without making
separator spelling part of logical Query Parameter identity. Exact
serialization remains in each snapshot, so excluding `separatorBefore` from the
identity key does not discard separator syntax or weaken exact Undo.

### AD-6 — Close-and-rebase

**Substantively reconciled, with mismatch 1.** Its state chronology matches the
new Section 9 decision and the PRD’s intent-level Undo model. The same-reducer
transaction prevents browser event ordering from interleaving closure and the
new mutation. The controller trigger must be narrowed as specified above.

### AD-8 — Parsing publication

**Reconciled.** Input snapshot, generation, session epoch, and originating
committed revision prevent a pending Full URL parse from overwriting a newer
structured mutation or publishing partial/stale state. Advancing the epoch in
the same accepted-mutation transaction supports the new close-and-rebase policy:
the mutation is applied against Last Valid and an older parse cannot later
replace it. Keeping parsing/serialization in the pure core and publishing one
complete reducer transition preserves FR-10 through FR-12 and NFR-4.

The worker remains conditional on measured capacity evidence and must reuse the
same core, so no PRD performance or semantic gate is displaced.

### AD-13 — Revisioned effects

**Partially reconciled, with mismatch 2.** Serial execution, one
acknowledgement, render-ready focus resolution, deterministic focus fallback,
typed timeouts, and reducer-owned feedback channels preserve the atomicity,
focus, announcement, and non-modal feedback constraints. The stale clipboard
branch must be made Copy-specific so FR-15 and the stale-Copy gate remain
unconditional.

### AD-14 — Release evidence

**Reconciled.** The edited rule retains or strengthens every relevant PRD gate:

- 20,000-character / 250+ entry capacity;
- 1-second initial parse and 100 ms interaction targets on the named reference
  hardware;
- latest two major Chrome, Firefox, Edge, and Safari versions;
- keyboard, focus, IME, reflow, forced-colors, text-spacing, browser/AT, and
  WCAG 2.2 AA verification;
- privacy/network/storage checks;
- clipboard fallback;
- 5–8 representative developers, at least 90% unassisted completion, and zero
  critical synchronization, Undo, or stale-Copy failures.

The versioned evidence matrix closes a previous traceability risk by requiring
every bound FR, NFR, UX case, and fixture to have an automated or manual result.
Marking AG-1 through AG-3 “design closed; implementation evidence pending” is
consistent with a final design contract and does not claim uncollected release
evidence.

### Architecture Gate Closure

**Reconciled.** The closure table now correctly distinguishes design closure
from implementation evidence:

- AG-1 remains closed by AD-2, AD-3, AD-5, AD-6, and AD-11, with exact
  Draft/Current/Last Valid, malformed-percent, History, restored serialization,
  Fragment, delimiter/casing, and Copy evidence pending.
- AD-11 explicitly includes close-and-rebase History in the shared corpus, and
  AD-14 requires the bound requirement/fixture matrix, so the newly approved
  policy remains release-gated even though the AG-1 row summarizes it as exact
  History.
- AG-2 retains the required bidirectional IDN edge cases.
- AG-3 retains full-DOM evidence at 250+ entries and does not weaken the V1
  no-virtualization decision.

No gate was silently declared complete, removed, or weakened by the edits.

## Final Disposition

The upstream PRD decision and downstream close-and-rebase state model agree.
Reconciliation can pass after:

1. narrowing AD-6’s automatic close trigger from every non-Full-URL command to
   the PRD-approved closure events and mutation commands; and
2. specifying Copy-safe stale-effect execution and truthful outcome/recovery in
   AD-13.

No other action is required for the reviewed edits.
