# Final Pre-Handoff Good-Spine Review

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-29
**Mode:** Validate only; no source artifact was modified.
**Sources checked:** `prd.md`, PRD `addendum.md`, `DESIGN.md`, and
`EXPERIENCE.md` listed in the spine frontmatter.

## Verdict

**PASS — ready for implementation handoff, subject to the evidence gates already
defined by AD-14.**

No Critical or High cross-unit incompatibility remains. The prior blocker/high
findings and the four newest adversarial findings are closed. AG-1 through AG-3
remain correctly described as design-closed and implementation-evidence-pending;
that pending evidence is an explicit implementation-entry and release
constraint, not an architecture-review failure.

## Gate Summary

| Check | Result |
| --- | --- |
| Mechanical spine lint | Pass — zero findings |
| Critical findings | 0 |
| High findings | 0 |
| PRD/addendum reconciliation | Pass |
| UX reconciliation | Pass |
| AD enforceability | Pass at handoff severity |
| Adversarial independent-unit compatibility | Pass |
| Deferred-decision safety | Pass |
| Capability and quality coverage | Pass |
| Brownfield/inheritance consistency | Pass |
| Altitude-owned dimension coverage | Pass |
| Named-technology reality check | Pass for handoff |

The deterministic linter returned:

```json
{
  "ok": true,
  "spine": "ARCHITECTURE-SPINE.md",
  "total_findings": 0,
  "by_severity": {},
  "findings": []
}
```

## Prior Blocker/High Closure Verification

### C-1 — Full URL close-and-rebase History order: closed

AD-6 now fixes a single reducer transaction and chronological order:

1. close the Full URL edit;
2. append baseline-to-last-valid when the snapshots differ;
3. apply the URL-mutating command against Last Valid;
4. append that mutation as a separate History Entry;
5. preserve invalid Draft text; and
6. rebase later valid Full URL correction from the latest Last Valid snapshot.

It also limits automatic closure to blur, Enter, and commands capable of
committing a URL mutation. Search, focus, selection, scrolling, and
non-mutating validation do not close the edit or create History. This matches
PRD FR-10/FR-13 and PRD §9, plus the UX exact close-and-rebase trace.

### H-1 — Component codec boundary: closed

AD-3 defines raw component-text editing, complete percent-triplet handling,
literal-plus behavior, malformed-percent rejection, Unicode normalization and
UTF-8 casing policy, and exhaustive path/query encode profiles. Existing
malformed text accepted through Full URL remains visible and byte-preserved
until corrected. This resolves the original editor-boundary ambiguity.

### H-2 — Invalid-Draft source conflict: closed

The PRD Decision Summary, FR-10 through FR-14, and §9 now adopt the UX policy
implemented by AD-6: Structured View remains editable against Last Valid while
invalid Draft text is preserved, History closes and appends chronologically,
and correction rebases from the latest Last Valid snapshot. The spine no longer
silently resolves an upstream product contradiction.

### H-3 — Parse supersession: closed

AD-8 requires matching exact input snapshot, monotonic generation, session
epoch, and originating committed revision before publication. Every accepted
product mutation advances the epoch and invalidates pending parses in the same
transaction. A stale parse therefore cannot overwrite a newer structured
mutation, Undo, or committed snapshot.

### H-4 — Focus and feedback protocol: closed

AD-13 assigns focus to typed operation intents implementing the complete UX
operation/Undo tables, including same/opposite subcontrol handling, Clear
Search, after-list Add, Structured View heading, Full URL, filtered-item
announcements, and next-then-previous tie resolution. It also binds all UX
timing, precedence, coalescing, repeat-node, IME-suppression, persistence, and
overflow rules to reducer-owned queues. Current, pending, and incoming
overflow participants are persisted exactly once and counted consistently.

### H-5 — Reproducible evidence gates: closed

AD-14 distinguishes design closure from evidence completion, blocks stories
touching AG-1 through AG-3 until their gate evidence passes, and separately
blocks release on the complete semantic, performance, browser/AT,
accessibility, privacy, Clipboard, and representative-user matrix. The evidence
contract is now machine-evaluated rather than satisfied by matrix presence.

### H-6 — Named stack reality: closed for handoff

The stack remains a greenfield target rather than a claim that dependencies are
already installed. The unchanged version table was previously reality-checked
for the same date; the update added only current platform names—Clipboard API,
VoiceOver, and TalkBack. The repository's pnpm 12.5.1 pin is ratified. Newer
available package versions do not create a Critical/High incompatibility where
the selected versions remain real and compatible.

## Newest High-Finding Closure Verification

### Splice provenance: closed

AD-3 makes the edit operation executable rather than value-oriented:

- the command carries prior token revision;
- ranges use DOM-compatible UTF-16 `selectionStart`/`selectionEnd`;
- `insertedText` is explicit;
- stale revisions reject;
- ranges splitting an existing percent triplet reject;
- ranges are never silently rebased;
- only inserted text is encoded; and
- untouched prefix/suffix bytes remain exact.

Same-visible-Unicode replacement is explicitly an edit and encodes the inserted
span. Two conforming editors can no longer disagree because one inferred a
final value while another retained splice provenance.

### Non-Clipboard effect claim/preflight: closed

Immediately before every non-Clipboard adapter invocation, AD-13 requires a
reducer-owned `claimEffect`. A revision mismatch or typed target-precondition
failure acknowledges the intent without invoking the adapter or touching the
DOM. It further states that no operation-specific focus intent survives a
revision change. Stale focus is prevented before side effects occur, not merely
discarded after focus has already moved.

### Clipboard unresolved-operation fence and latest-attempt handling: closed

AD-13 separates user-visible timeout from underlying Clipboard settlement. Once
a non-cancellable write is invoked:

- timeout does not mark the browser operation settled;
- no later Clipboard API write starts while the earlier write is unresolved;
- a later Copy becomes `latestCopyAttemptId`;
- that later attempt immediately receives exact safe-copy recovery;
- older outcomes may report their truthful result but cannot create, focus, or
  retain recovery; and
- current recovery uses the attempt's captured serialization and remains until
  the next Copy attempt or URL mutation.

This closes overlapping-write and stale-recovery divergence while preserving
FR-15's truthful outcome and exact-source requirements.

### Machine-evaluated gate oracle: closed

AD-14 makes one versioned, machine-validated evidence manifest and evaluator
the sole implementation-entry and release oracle. The schema fixes required
cell IDs, story-to-gate mapping, evidence ownership/sign-off, and terminal
states. Mandatory cells pass only as `pass`; `waived`, `skipped`, and mere
presence cannot satisfy them. Representative-user success uses whole-journey
participants over all participants without rounding, and the rule closes the
definitions of critical synchronization, Undo, and stale-Copy failure. Two
independent CI/release owners can no longer derive different conforming
verdicts from the same evidence.

## Source Reconciliation

### PRD and addendum

- AD-1, AD-6, AD-8, and AD-13 preserve one synchronized committed authority,
  Last Valid behavior, chronological History, no stale Copy, and atomic
  publication required by FR-10 through FR-16 and NFR-4 through NFR-7.
- AD-2 and AD-3 decide the addendum's open WHATWG, percent-casing,
  encoded-delimiter, malformed-percent, and Fragment-preservation questions
  without weakening losslessness.
- AD-4 supplies deterministic dual IDN conversion while preserving the PRD's
  editable Unicode/ASCII forms.
- AD-9 preserves the addendum's prohibited telemetry-content boundary.
- AD-11 and AD-14 preserve SM-1 through SM-4 and the capacity/privacy evidence
  called for by the PRD.

No source capability is narrowed or contradicted.

### UX sources

- AD-6 matches Draft/Last Valid, close-and-rebase, and Undo chronology.
- AD-7 deliberately selects the UX-conforming full-DOM V1 path.
- AD-12 matches native/product Undo, IME, Enter, and pointer cancellation.
- AD-13 preserves operation-specific focus, safe-copy exactness and lifetime,
  keyboard/touch/VoiceOver/TalkBack recovery, distinct feedback channels,
  timing, repeat behavior, persistence, and overflow.
- AD-14 retains the UX requirement that AG evidence blocks affected
  implementation stories and that the release record contains exact tested
  versions and complete browser/AT evidence.
- The structural seed and capability map assign these contracts to one owner
  each; no UI component or adapter gains an independent state authority.

No UX contract creates a remaining Critical/High cross-unit incompatibility.

## Complete Good-Spine Checklist

### Real divergence points for the level below

**Pass.** Ownership and compatibility are decided for session state, lossless
URL representation, splice editing, IDN conversion, identity reconciliation,
History, invalid-Draft closure, parse publication, keyboard/composition,
effects, Clipboard lifetime, focus, feedback, privacy, deployment, and gate
evaluation.

### Every AD is enforceable and prevents its stated divergence

| AD | Result | Judgment |
| --- | --- | --- |
| AD-1 | Pass | One reducer owns committed state, drafts, History, and effects. |
| AD-2 | Pass | Exact lossless slots and delimiter ownership constrain parsing and mutation. |
| AD-3 | Pass | Revisioned splice commands and exhaustive profiles constrain every editor. |
| AD-4 | Pass | Version, option profile, validation, draft ownership, and serialization are fixed. |
| AD-5 | Pass | Complete snapshots, immutable IDs, exact keys, and deterministic LCS prevent drift. |
| AD-6 | Pass | One chronological close-and-rebase transition and trigger set are specified. |
| AD-7 | Pass | V1 full-DOM rendering is mandatory. |
| AD-8 | Pass | Publication has a complete stale-result predicate. |
| AD-9 | Pass | No-sink policy, CSP floor, storage prohibition, and no service worker are testable. |
| AD-10 | Pass | Artifact identity, environments, caching, promotion, and rollback are fixed. |
| AD-11 | Pass | One corpus spans semantic, History, accessibility, privacy, and exact-string evidence. |
| AD-12 | Pass | One arbiter fixes Undo, IME, Enter, and pointer boundaries. |
| AD-13 | Pass | Claims, serial effects, Clipboard fencing, focus, recovery, and feedback converge. |
| AD-14 | Pass | One evaluator decides implementation-entry and release gates. |

### Deferred decisions cannot silently split implementations

**Pass.**

- Provider and CI selection may vary, but artifact, CSP, cache, promotion,
  rollback, and evidence contracts remain binding.
- Worker parsing requires measured activation and must retain the same core and
  complete stale-publication predicate.
- Virtualization cannot ship in V1; reopening requires the UX equivalence
  evidence.
- Routing, server functions, persistence, telemetry, and service workers remain
  outside the explicit V1 boundary.
- Redo and bounded History cannot weaken V1 complete Undo without a scope and
  architecture change.

### Named technology is verified-current

**Pass for handoff.** The selected technologies and versions are real and
viable as the implementation target. The current update introduces no
fabricated, deprecated, or version-impossible dependency. Exact tested browser,
AT, tool, and evaluator versions remain correctly required as release evidence.

### Brownfield ratification

**Pass.** The repository contains package-manager scaffolding, not a competing
implemented product architecture. The spine ratifies the existing pnpm pin and
does not contradict existing runtime modules or data contracts.

### Spec capability coverage

**Pass.** UJ-1, FR-1 through FR-16, NFR-1 through NFR-17, SM-1 through SM-4,
and AG-1 through AG-3 have architectural owners, enforceable rules, fixtures,
or evidence gates. The PRD/addendum semantics and UX interaction/failure paths
are represented without weakening source precedence.

### Parent-spine inheritance

**Pass / not applicable.** No parent spine is declared, so no inherited AD is
weakened or contradicted.

### Altitude-owned dimensions

| Dimension | Status |
| --- | --- |
| Paradigm and dependency direction | Decided |
| Module boundaries and ownership | Decided |
| Data representation and serialization | Decided |
| Validation and error results | Decided |
| Identity, History, and Undo | Decided |
| Concurrency and parse supersession | Decided |
| Browser effects and acknowledgements | Decided |
| Clipboard invocation lifetime and recovery | Decided |
| Focus, keyboard, composition, and pointer behavior | Decided |
| Feedback and live-region behavior | Decided |
| Accessibility representation | Decided |
| Privacy, storage, telemetry, and network | Decided |
| Build and runtime configuration | Decided |
| Deployment, caching, promotion, and rollback | Decided |
| Provider and CI selection | Safely deferred |
| Test, implementation-entry, and release evidence | Decided and gated |
| Post-V1 backend, persistence, Redo, and bounded History | Explicitly deferred/excluded |

No feature-altitude dimension is silently omitted.

## Adversarial Independent-Unit Result

A value-oriented editor versus a splice-oriented editor, an outcome-only effect
checker versus a preflight claimant, a timeout-terminal Clipboard adapter versus
an unresolved-operation adapter, and two independently written release
evaluators were tested against the current wording. Only the splice-oriented,
preflight-claimed, unresolved-fenced, manifest-evaluated behaviors now satisfy
the ADs. The former divergent implementations are no longer conforming.

No additional Critical or High path was found.

## Non-Failing Residue

Per the requested scope, medium/low residue does not fail this gate unless it
creates a Critical/High cross-unit incompatibility. None does. Previously noted
hardening topics remain valid implementation concerns: persistent operation
history retention/clearing, exact worker benchmark protocol, provider-specific
header verification, and future bounded-History policy. They do not weaken the
current V1 architecture contract.

## Final Disposition

The architecture spine passes the final good-spine pre-handoff gate. All prior
blocker/high closures—including splice provenance, effect claim preflight,
Clipboard unresolved-operation/latest-attempt handling, and the
machine-evaluated gate oracle—are present, enforceable, and source-consistent.
Implementation may proceed only through the AD-14 evidence gates.
