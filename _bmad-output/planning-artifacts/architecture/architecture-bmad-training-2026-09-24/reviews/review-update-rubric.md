# Final Good-Spine Rubric Review — Updated Architecture Spine

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-29
**Mode:** Pre-handoff validation only; no source files were modified.
**Sources checked:** `prd.md`, `addendum.md`, `DESIGN.md`, and `EXPERIENCE.md`
listed in the spine frontmatter.

## Verdict

**PASS — ready for implementation handoff.**

The updated spine closes the prior blocker/high architecture defects. No
remaining blocker or high-severity divergence was found under the complete
good-spine checklist. AG-1 through AG-3 correctly remain design-closed with
implementation evidence pending and are explicitly enforced as both
implementation-entry and release gates; missing implementation evidence is not
an architecture defect.

## Gate Evidence

- Mechanical spine lint: **pass**, zero findings.
- Critical findings: **0**
- High findings: **0**
- Source consistency: **pass**
- AD enforceability: **pass at handoff severity**
- Deferred-decision safety: **pass**
- Capability coverage: **pass**
- Brownfield/inheritance check: **pass**
- Structural and operational dimension coverage: **pass**
- Named-technology reality check: **pass for handoff**

Per the requested gate scope, this report does not re-report implementation
work already blocked by AD-14 or medium/low hardening items intentionally left
outside the blocker/high update.

## Prior Blocking/High Closure Verification

### Invalid-Draft upstream consistency — closed

The PRD Decision Summary and §9 now adopt the same policy as the UX and AD-6:
invalid Draft text is preserved, Structured View mutations operate against Last
Valid, the open Full URL edit closes first, and later correction rebases from
the latest Last Valid snapshot. The source-precedence convention is therefore
no longer resolving an upstream contradiction.

### One close-and-rebase History order — closed

AD-6 defines one enforceable reducer order:

1. close the Full URL edit;
2. append baseline-to-last-valid when changed;
3. apply the new mutation against Last Valid;
4. append that mutation as a separate chronological entry;
5. preserve invalid Draft text; and
6. rebase later valid Full URL correction on the latest Last Valid snapshot.

It also limits automatic closure to blur, Enter, and commands capable of
committing a URL mutation. Search, focus, selection, scrolling, and
non-mutating validation neither close the edit nor create History. This matches
FR-10, FR-13, PRD §9, and the UX close-and-rebase trace.

### Exhaustive component codec boundary — closed

AD-3 fixes raw component-text editing, complete percent-triplet recognition,
malformed/partial-percent rejection, selection replacement across triplets,
literal `+`, Unicode normalization policy, UTF-8 uppercase encoding, and
component-specific WHATWG-derived profiles for path segments, query keys, and
query values. Independent editors can no longer choose incompatible
decode/re-encode or character-acceptance policies while claiming compliance.

### Exact LCS identity key — closed

AD-5 defines the path key as `rawSegment` and the query key as
`{rawKey, equalsPresent, rawValue}`, explicitly excluding `separatorBefore`.
It also fixes tie-breaking and fresh-ID allocation. Duplicate and
separator-boundary cases therefore converge on one identity result.

### Parse supersession — closed

AD-8 requires the input snapshot, generation, session epoch, and originating
committed revision all to match before publication. Every accepted product
mutation advances the epoch and invalidates pending parses in the same
transaction. A stale parse cannot overwrite a newer structured mutation,
Undo, or committed snapshot.

### Effect ordering and Copy staleness — closed

AD-13 fixes strict serial execution through exactly one reducer
acknowledgement, bounded async outcomes, and stale non-clipboard pruning. Copy
captures the attempted serialization and revalidates it against the current
Copy source immediately before Clipboard API invocation, so a queued Copy
cannot write a snapshot superseded by a newer committed mutation. Once an
attempt has actually started, its attempt-specific success, failure, or timeout
is reported truthfully, and failure recovery uses the exact attempted value.
This removes the prior concurrency and stale-outcome ambiguity without
presenting failure as success.

### Operation-specific focus — closed

AD-13 now binds typed focus intents to the complete UX operation and Undo
tables, including same/opposite-subcontrol handling, Clear Search, after-list
Add, Structured View heading, Full URL, filtered-item announcements, and the
next-then-previous nearest-row tie-break. The former generic fallback
divergence is gone.

### Feedback timing, persistence, repeat behavior, and overflow — closed

AD-13 assigns the validation, polite, and actionable queues to `core/session`
and normatively incorporates every UX timing, precedence, coalescing,
repeat-node, IME-suppression, and persistence rule. Its overflow transition
promotes the current, pending, and incoming committed outcomes exactly once,
removes pending promoted outcomes from FIFO, preserves the current minimum
exposure, and counts the complete promoted set in one summary.

### Implementation-entry and release evidence status — closed

AD-14 now blocks implementation stories touching AG-1, AG-2, or AG-3 until
their prototype or fixture evidence passes, and separately blocks release on
the complete semantic, performance, browser/AT, accessibility, privacy,
clipboard, and representative-user evidence matrix. “Design closed;
implementation evidence pending” no longer implies that gate evidence may be
deferred until release.

## Complete Good-Spine Checklist

### Real divergence points for the level below

**Pass.** The spine decides ownership and compatibility at the feature-module
level: session state, lossless URL representation, component codecs, IDN
mapping, identity reconciliation, History, Full URL closure, parse publication,
keyboard/composition arbitration, browser-effect execution, focus, feedback,
privacy, deployment, and acceptance evidence. No blocker/high seam remains at
which two independently built units can obey the ADs yet produce incompatible
V1 behavior.

### Every AD is enforceable and prevents its stated divergence

| AD | Result | Gate judgment |
|---|---|---|
| AD-1 | Pass | One reducer owns committed state, drafts, History, and effect intents. |
| AD-2 | Pass | The lossless model and mutation boundary cover managed and unmanaged URL lexemes. |
| AD-3 | Pass | Raw editing and exhaustive component profiles converge all editors on one codec contract. |
| AD-4 | Pass | Package version, full option profile, host validation, ownership, and serialization form are fixed. |
| AD-5 | Pass | Complete snapshots plus exact LCS keys and tie-breaking prevent identity drift. |
| AD-6 | Pass | The close-and-rebase transition has one chronological outcome and explicit triggers. |
| AD-7 | Pass | V1 full-DOM representation is mandatory; virtualization cannot enter silently. |
| AD-8 | Pass | Publication has a complete stale-result predicate and mutation supersession rule. |
| AD-9 | Pass | The no-sink rule, CSP floor, storage prohibition, and no-service-worker rule are testable. |
| AD-10 | Pass | Artifact identity, environment invariance, caching, promotion, and rollback are decided. |
| AD-11 | Pass | One versioned corpus spans semantic, interaction, privacy, capacity, and exact-string evidence. |
| AD-12 | Pass | One arbiter fixes native/product Undo, IME, Enter, and pointer activation boundaries. |
| AD-13 | Pass | Serial effects, Copy revalidation, typed focus, safe-copy recovery, and reducer-owned feedback converge. |
| AD-14 | Pass | Implementation-entry and release evidence are explicit blocking gates with traceable records. |

### Deferred decisions cannot silently split implementations

**Pass.**

- Hosting/CDN and CI vendors may vary, but the immutable artifact, CSP,
  subpath, cache, promotion, rollback, and evidence contracts remain binding.
- Worker parsing may be introduced only after measurement and must reuse the
  same pure core with complete-result publication.
- Virtualization cannot ship in V1 and requires the full UX equivalence gate if
  reopened.
- Backend, routing, persistence, telemetry, and service-worker additions are
  outside V1 and cannot appear without reopening the explicit local-only
  boundary.
- Redo and bounded History remain outside V1 and cannot weaken complete Undo
  without a scope change.

### Named technology is real and viable

**Pass for this gate.** The named packages and pinned versions exist, Node 24
remains an LTS line, and the repository’s pnpm 12.5.1 pin is deliberately
ratified by the spine. Some tools have newer releases, but “newer exists” is not
a blocker/high architecture defect when the selected pins remain available and
compatible with the stated greenfield stack.

### Brownfield consistency

**Pass.** The repository contains package-manager scaffolding rather than an
existing product architecture. The spine preserves the repository’s pnpm
12.5.1 pin and does not contradict implemented application modules or runtime
contracts.

### Source capability coverage

**Pass.** UJ-1, FR-1 through FR-16, NFR-1 through NFR-17, SM-1 through SM-4,
and AG-1 through AG-3 have architectural owners, rules, fixture coverage, or
explicit evidence gates. The PRD/addendum semantic requirements and the UX
interaction, focus, feedback, accessibility, and failure-path contracts are
represented without weakening source precedence.

### Parent-spine inheritance

**Pass / not applicable.** No parent architecture spine is declared. No
inherited AD can be weakened or contradicted.

### Altitude-owned dimensions

| Dimension | Status |
|---|---|
| Paradigm and dependency direction | Decided |
| Module boundaries and ownership | Decided |
| Data representation and serialization | Decided |
| Validation and error results | Decided |
| Identity, History, and Undo | Decided |
| Concurrency and parse supersession | Decided |
| Browser effects and acknowledgement | Decided |
| Focus, keyboard, composition, and pointer behavior | Decided |
| Feedback and clipboard recovery | Decided |
| Accessibility representation | Decided |
| Privacy, storage, telemetry, and network | Decided |
| Build and runtime configuration | Decided |
| Deployment environments, caching, promotion, and rollback | Decided |
| Provider and CI selection | Safely deferred |
| Test and acceptance evidence | Decided and gated |
| Post-V1 backend/persistence/Redo scope | Explicitly deferred/excluded |

No feature-altitude dimension is silently omitted.

## Final Disposition

The updated architecture spine satisfies the final good-spine pre-handoff
rubric. The previously blocking/high inconsistencies and divergence holes are
closed. Implementation may proceed subject to AD-14’s gate-specific
implementation-entry evidence and later release evidence.
