# Final Closure Good-Spine Review

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-29
**Mode:** Validate only; no source artifact was modified.
**Sources checked:** `prd.md`, `addendum.md`, `DESIGN.md`, and
`EXPERIENCE.md` listed in the spine frontmatter.

## Verdict

**PASS — ready for implementation handoff, subject to the evidence gates in
AD-14.**

No Critical or High finding remains. The first-Clipboard-timeout recovery fix
closes the sole High finding from the preceding adversarial review without
reopening any earlier blocker/high seam. Known medium/low hardening residue does
not create a Critical/High incompatibility and does not fail this closure gate.

## Gate Summary

| Check | Result |
| --- | --- |
| Mechanical spine lint | Pass — zero findings |
| Critical findings | 0 |
| High findings | 0 |
| First-Clipboard-timeout closure | Pass |
| PRD/addendum reconciliation | Pass |
| UX reconciliation | Pass |
| AD enforceability | Pass at blocker/high severity |
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

## First-Clipboard-Timeout Recovery Closure

### Prior High finding — closed

The preceding adversarial review found two conforming lifecycles after Copy A
reached its first user-visible timeout while the non-cancellable Clipboard
write remained unresolved:

1. timeout immediately created exact safe-copy recovery; or
2. timeout produced only non-success feedback until a later failure or Copy
   attempt.

AD-13 now normatively selects the first behavior:

> “that first timeout immediately creates safe-copy recovery from the
> attempt's captured serialization while retaining the unresolved-write
> fence.”

This closes the divergence completely:

- recovery is immediate on the first timeout;
- recovery uses the timed-out attempt's captured serialization;
- the unresolved-write fence remains active;
- a later Copy becomes `latestCopyAttemptId`, replaces recovery with its own
  captured serialization, and does not invoke the Clipboard API;
- older outcomes cannot create, focus, or retain recovery; and
- the current recovery remains exact, selected, focused, and available through
  native keyboard, touch, VoiceOver, and TalkBack Copy.

The wording is consistent with PRD FR-15's truthful failure feedback and the UX
Clipboard-failure contract requiring exact-source, focused safe-copy recovery.
It also preserves the source-defined lifetime through the next Copy attempt or
URL mutation. A late outcome may still be reported truthfully, but it cannot
overwrite newer recovery.

No second conforming first-timeout behavior remains.

## Prior Blocker/High Closure Verification

| Prior seam | Closure judgment |
| --- | --- |
| Full URL close-and-rebase History | Closed. AD-6 fixes one reducer transaction, close-first chronology, distinct entries, mutation-only closure triggers, preserved invalid Draft, and first-Undo order. |
| Component codec boundary | Closed. AD-3 fixes raw editing, revisioned UTF-16 splice provenance, percent-triplet handling, literal-plus behavior, malformed-percent rejection, Unicode policy, and exhaustive component profiles. |
| Upstream invalid-Draft conflict | Closed. The PRD and UX sources agree that Structured View remains editable against Last Valid while invalid Draft text is preserved. |
| Identity reconciliation | Closed. AD-5 fixes exact path/query LCS keys, separator exclusion, deterministic tie order, fresh IDs, and snapshot restoration. |
| Parse supersession | Closed. AD-8 requires input snapshot, generation, session epoch, and committed revision to match; accepted product mutations invalidate pending parses atomically. |
| Stale focus invocation | Closed. AD-13 requires reducer-owned preflight claim before a non-Clipboard adapter may touch the DOM. |
| Newer Copy attempt / unresolved write | Closed. AD-13 prohibits overlapping Clipboard API writes, records `latestCopyAttemptId`, preserves exact attempt serialization, and blocks older recovery from displacing newer recovery. |
| Focus and feedback protocol | Closed. AD-13 binds typed operation/Undo focus tables and reducer-owned timing, ordering, repeat, persistence, IME, and overflow rules. |
| IDN profile | Closed. AD-4 pins `tr46` version/options, WHATWG host validation, draft ownership, untouched source lexeme behavior, and edited serialization form. |
| Evidence pass/fail oracle | Closed. AD-14 defines one machine-validated manifest/evaluator, mandatory terminal states, story-to-gate mapping, denominator and threshold rules, and critical failure classes. |
| Operational envelope | Closed at blocker/high severity. AD-9 and AD-10 fix the CSP floor, immutable artifact, subpath behavior, cache policy, promotion, rollback, and environment invariance while safely deferring vendor identity. |

## Complete Good-Spine Checklist

### Real divergence points for the level below

**Pass.** The spine decides the feature-level seams at which independently
built units would otherwise diverge: committed authority, lossless URL
representation, splice editing, IDN conversion, identity, History,
close-and-rebase, parse publication, Undo/input arbitration, effect claims,
Clipboard invocation lifetime and recovery, focus, feedback, privacy,
deployment, and evidence evaluation.

The timeout fix removes the last blocker/high branch where two Clipboard and
session implementations could obey the adopted decisions yet expose materially
different FR-15 recovery.

### Every AD is enforceable and prevents its stated divergence

| AD | Result | Judgment |
| --- | --- | --- |
| AD-1 | Pass | One reducer owns committed state, drafts, History, and effect intents. |
| AD-2 | Pass | One lossless model and delimiter boundary govern parsing and mutation. |
| AD-3 | Pass | Revisioned splice commands and exhaustive encode profiles converge component editors. |
| AD-4 | Pass | Version, complete option profile, validation, ownership, and host serialization are fixed. |
| AD-5 | Pass | Complete snapshots, immutable IDs, exact keys, and deterministic LCS prevent identity drift. |
| AD-6 | Pass | One chronological close-and-rebase transition and trigger set are specified. |
| AD-7 | Pass | Full-DOM rendering is mandatory in V1. |
| AD-8 | Pass | Parse publication has one complete stale-result predicate. |
| AD-9 | Pass | No-sink policy, CSP floor, storage prohibition, and no-service-worker rule are testable. |
| AD-10 | Pass | Artifact identity, environments, caching, promotion, and rollback are fixed. |
| AD-11 | Pass | One corpus spans semantics, History, accessibility, privacy, capacity, and exact Copy/Undo strings. |
| AD-12 | Pass | One arbiter fixes native/product Undo, IME, Enter, and pointer boundaries. |
| AD-13 | Pass | Claims, serial effects, first-timeout recovery, unresolved-write fencing, latest-attempt protection, focus, and feedback converge. |
| AD-14 | Pass | One evaluator decides implementation-entry and release gates. |

### Deferred decisions cannot silently split implementations

**Pass.**

- Hosting/CDN and CI vendors may vary, but artifact, CSP, cache, promotion,
  rollback, and evidence contracts remain binding.
- Worker parsing requires measured activation and must retain the same core and
  stale-publication predicate.
- Virtualization cannot ship in V1 and can reopen only through the complete
  AG-3 equivalence evidence.
- Routing, server functions, API, persistence, telemetry, and service workers
  remain outside the V1 boundary.
- Redo and bounded History cannot weaken complete V1 Undo without reopening
  product scope and architecture.

### Named technology is verified-current

**Pass for handoff.** Registry verification on 2026-09-29 confirmed that every
selected npm version exists. Node 24 is an official LTS line and its current
v24.21.0 satisfies the selected packages' Node engine ranges. The main stack
pins are real and mutually viable.

Newer versions exist for pnpm, TypeScript, oxlint, and Vitest, and the Node row
pins only the LTS major rather than a patch. These are known currency and
reproducibility hardening items, not Critical/High incompatibilities: the
repository deliberately pins pnpm 12.5.1, every selected package version
exists, and the current Node 24 LTS release supports the chosen toolchain.

### Brownfield ratification

**Pass.** The repository contains package-manager scaffolding rather than an
implemented competing product architecture. The spine ratifies the existing
`pnpm@12.5.1` package-manager pin and does not contradict existing application
modules or runtime contracts.

### Source capability coverage

**Pass.**

- PRD UJ-1, FR-1 through FR-16, NFR-1 through NFR-17, and SM-1 through SM-4
  are bound by architecture decisions, the capability map, or AD-14 gates.
- The addendum's lossless URL, percent behavior, malformed text, Fragment,
  Full URL session, and close-and-rebase constraints are represented.
- UX Draft/Last Valid behavior, complete Undo, keyboard/IME/pointer rules,
  focus transitions, feedback channels, safe-copy recovery, browser/AT
  fallback, and accessibility evidence remain architecture-owned.
- AG-1 through AG-3 are design-closed and implementation-evidence-pending.
  AD-14 correctly treats that evidence as an implementation-entry and release
  condition rather than silently claiming it already exists.

No source capability is narrowed or contradicted at Critical/High severity.

### Parent-spine inheritance

**Pass / not applicable.** No parent architecture spine is declared, so no
inherited decision is weakened or contradicted.

### Altitude-owned dimensions

| Dimension | Status |
| --- | --- |
| Paradigm and dependency direction | Decided |
| Module boundaries and authority | Decided |
| URL data representation and serialization | Decided |
| Validation and result conventions | Decided |
| Identity, History, and Undo | Decided |
| Concurrency and parse supersession | Decided |
| Browser effects and acknowledgements | Decided |
| Clipboard timeout, invocation lifetime, and recovery | Decided |
| Focus, keyboard, composition, and pointer behavior | Decided |
| Feedback and live-region behavior | Decided |
| Accessibility representation | Decided |
| Privacy, storage, telemetry, and network | Decided |
| Build and runtime configuration | Decided |
| Deployment, caching, promotion, and rollback | Decided |
| Provider and CI selection | Safely deferred |
| Tests, implementation-entry, and release evidence | Decided and gated |
| Post-V1 backend, persistence, Redo, and bounded History | Explicitly deferred/excluded |

No feature-altitude dimension is silently omitted.

## Non-Failing Residue

Known medium/low residue remains outside the requested blocker/high closure:
Unicode scalar-boundary handling for UTF-16 splice ranges, exact token-revision
advancement, a fully executable duplicate-heavy LCS oracle, reproducible worker
benchmark details, canonical provider-header verification, late Clipboard
outcome wording/ordering, unresolved-write abandonment, persistent operation
history lifecycle, render/effect settlement sampling, evaluator self-integrity,
and exact toolchain patch/currentness policy.

None permits a Critical/High V1 incompatibility under the adopted rules. In
particular, none reopens exact Copy-source ownership, first-timeout recovery,
the unresolved-write fence, or newer-attempt protection.

## Final Disposition

The architecture spine passes the complete good-spine closure gate. All known
blocker/high findings are closed, including the first Clipboard timeout's
immediate exact safe-copy recovery. Implementation may proceed only through
AD-14's machine-evaluated entry and release gates.
