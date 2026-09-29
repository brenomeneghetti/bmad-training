# Architecture Spine Standalone Validation

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Intent:** Validate only; the spine was not modified.
**Date:** 2026-09-29
**Altitude:** Feature
**Verdict:** **Conditional fail — targeted architecture updates and one product decision are required before independent implementation.**

The spine is strong and unusually explicit. It correctly fixes the main architectural
divergence points around state ownership, lossless URL representation, identity,
full-DOM accessibility, browser-local privacy, static delivery, and release evidence.
Mechanical lint passes with zero findings. It nevertheless leaves one critical
state/history sequence and several high-risk edit, parse, effect, and evidence contracts
open enough for independently built stories to behave incompatibly.

## Validation Scope and Method

Reviewed in full:

- `ARCHITECTURE-SPINE.md`
- `../../prds/prd-bmad-training-2026-09-24/prd.md`
- `../../prds/prd-bmad-training-2026-09-24/addendum.md`
- `../../ux-designs/ux-bmad-training-2026-09-24/DESIGN.md`
- `../../ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md`

Checks applied:

1. Deterministic spine lint.
2. Complete good-spine rubric.
3. Adversarial “two independently built units” divergence analysis.
4. Named-technology and repository-reality check.
5. PRD, addendum, UX design, and UX behavior coverage reconciliation.
6. Structural-dimension sweep, including operational and environmental concerns.

The deterministic linter reported:

```json
{"ok":true,"total_findings":0,"by_severity":{}}
```

## Critical Findings

### C-1 — Full URL close-and-rebase does not determine one History order

**Evidence**

- AD-1 requires every accepted command to return one atomic state and prohibits
  independent committed-state mutation (`ARCHITECTURE-SPINE.md:41-49`).
- AD-6 says product mutations close the Full URL session, structured changes during an
  invalid Draft append against Last Valid, and a later valid Full URL “replaces that
  latest snapshot” (`ARCHITECTURE-SPINE.md:111-125`).
- The UX defines the close-and-rebase interaction sequence
  (`EXPERIENCE.md:86-92`) and parsing/mutation interaction
  (`EXPERIENCE.md:104-108`).

**Divergence**

Two reducers can obey those words yet differ:

1. close the Full URL session and append its baseline-to-valid History entry, then apply
   the structured mutation; or
2. apply the structured mutation against Last Valid first, then close/replace the Full
   URL entry.

The resulting History order, serialized snapshots, and first Undo target differ. This is
a real feature-altitude divergence because Full URL and Structured View work can be built
as separate epics against the same reducer contract.

**Recommendation — `update`**

Add a normative transition trace/table for baseline, Draft, Last Valid, Current,
History, and local drafts for: valid typing → structured mutation; invalid typing →
structured mutation; later valid typing; blur; Enter; and Undo. State exactly which
History entry is appended or replaced and the resulting first Undo target.

## High Findings

### H-1 — Percent-component editing is not fully specified at the editor boundary

**Evidence**

- AD-3 establishes raw component text, valid-triplet preservation, single encoding, and
  malformed-triplet behavior (`ARCHITECTURE-SPINE.md:66-78`).
- The addendum explicitly identifies percent casing, normalization, and invalid-sequence
  presentation as semantic decisions (`addendum.md:54-61`).

**Divergence**

Independent field editors can differ on newly typed or pasted `%2F`, a literal `%`,
selection replacement across a triplet, `+`, normalization-equivalent Unicode, and
whether a once-edited existing triplet retains provenance. Those choices alter Copy and
History serialization while each implementation can still claim to edit raw text and
encode only once.

**Recommendation — `update`**

Define the codec/editor boundary for typing, paste, replacement, deletion across a
triplet, literal `%`, and correction of malformed sequences. Require byte-identical
fixtures for every untouched substring.

### H-2 — The spine resolves an open PRD product decision without explicit upstream closure

**Evidence**

- The PRD leaves invalid-Draft behavior open: disable Structured View mutation or
  discard the invalid draft (`prd.md:22-23`, `prd.md:506-507`).
- AD-6 adopts another explicit behavior: preserve the invalid Draft while structured
  changes commit against Last Valid (`ARCHITECTURE-SPINE.md:116-125`).
- The spine declares the UX behavior contract authoritative for interaction sequencing
  (`ARCHITECTURE-SPINE.md:231-244`).

The chosen architecture may be sound, but the source-of-truth collision is not recorded
as an inherited decision, approved override, or open question.

**Recommendation — `discuss`**

Obtain product approval for the UX/AD-6 behavior and reconcile the PRD. Until then, mark
this as a blocking product decision rather than silently treating the PRD gate as closed.

### H-3 — Parse supersession across product mutations remains ambiguous

**Evidence**

- AD-8 requires synchronous core parsing, monotonic generations, and publication of only
  current complete results (`ARCHITECTURE-SPINE.md:137-148`).
- AD-13 revision-tags effect requests and ignores stale acknowledgements
  (`ARCHITECTURE-SPINE.md:201-214`).
- UX requires deterministic parsing/mutation interaction
  (`EXPERIENCE.md:104-108`) and release evidence for responsiveness
  (`EXPERIENCE.md:246-248`).

**Divergence**

One implementation can cancel every in-flight Full URL parse after any structured
mutation. Another can publish the parse if its textarea input generation remains current,
even though committed structured state changed. Both use generations and discard
obviously stale results, but they can commit different URLs and History.

**Recommendation — `update`**

Define whether every product mutation invalidates pending Full URL parses or only parses
whose input snapshot is obsolete. Bind generation identity to all state revisions that
affect publication.

### H-4 — Focus fallback and feedback behavior are referenced, not made executable

**Evidence**

- AD-5 makes piece IDs immutable and emits focus intents by ID
  (`ARCHITECTURE-SPINE.md:96-109`).
- AD-12 owns keyboard, IME, and pointer arbitration
  (`ARCHITECTURE-SPINE.md:188-199`).
- AD-13 assigns focus, clipboard, and feedback effects, but refers to UX timing and
  fallback behavior rather than defining a test-addressable protocol
  (`ARCHITECTURE-SPINE.md:201-214`).
- UX requires deterministic focus and recovery behavior
  (`EXPERIENCE.md:113-121`, `EXPERIENCE.md:156-170`).

Duplicate-token reconciliation, Search-hidden targets, removed rows, clipboard failure,
and overlapping announcements can therefore choose different fallback targets or queue
semantics.

**Recommendation — `update`**

Specify focus resolution order (snapshot ID, reconciled ID, logical occurrence, nearest
visible fallback) and a feedback queue/timer contract. Give each behavior stable fixture
or case identifiers.

### H-5 — Release gates are architecturally named but not reproducibly evidenced

**Evidence**

- AD-11 requires a shared fixture corpus and cross-layer contract tests
  (`ARCHITECTURE-SPINE.md:177-186`).
- AD-14 requires browser, assistive-technology, privacy, capacity, and human-success
  evidence (`ARCHITECTURE-SPINE.md:216-229`).
- AG-1 through AG-3 are shown as closed (`ARCHITECTURE-SPINE.md:246-253`).
- UX requires explicit AG exit fixtures (`EXPERIENCE.md:41-45`) and an exact supported
  browser/AT record (`EXPERIENCE.md:162-170`).
- The repository currently has only a placeholder failing test script and no application
  or browser-test setup (`package.json:6`).

“Closed” currently means design closure, not implementation or release evidence. The
corpus does not enumerate every required UX case, including live-region behavior,
mobile/touch Copy recovery, landmarks, Search/Add parity, Escape, pointer cancellation,
and complete focus fallback.

**Recommendation — `update`**

Rename the present status to “design closed; implementation evidence pending” and attach
a versioned evidence matrix that blocks release on missing FR/NFR/UX/AG cells.

### H-6 — Most named stack versions are proposed, not repository-ratified

**Evidence**

- The Stack names Node, pnpm, create-vite, React, Vite, TypeScript, oxlint, tr46,
  Vitest, Testing Library, jsdom, Playwright, and axe-core
  (`ARCHITECTURE-SPINE.md:254-269`).
- The repository manifest has no runtime or development dependencies and no functional
  application test suite (`package.json:1-21`).
- pnpm 12.5.1 is the only listed version corroborated by both `package.json:13-20` and
  `pnpm-lock.yaml:7-12`.
- The run memory contains conflicting TypeScript evidence: 7.0.2 at
  `.memlog.md:10` and 6.0.2 at `.memlog.md:28`; the spine selects 6.0.2
  (`ARCHITECTURE-SPINE.md:264`).

This is a greenfield target architecture, not a brownfield ratification. The versions may
have been researched when drafted, but the repository does not presently prove or lock
them, and the TypeScript record is internally inconsistent.

**Recommendation — `discuss`**

Resolve the TypeScript version conflict and distinguish “target/proposed” from
“repository-confirmed.” Re-check registry and official compatibility evidence when the
implementation baseline is generated. Classify `create-vite` as a one-time bootstrap
tool, not a runtime dependency.

## Medium Findings

### M-1 — Web Worker deferral lacks a safe activation contract

**Evidence**

- AD-8 sets a 50 ms p95 worker trigger (`ARCHITECTURE-SPINE.md:137-148`).
- Web Worker parsing is deferred pending profiling
  (`ARCHITECTURE-SPINE.md:342`).
- PRD performance targets are one-second initial parse and 100 ms interaction
  (`prd.md:428-432`).

No benchmark fixture, build mode, browser, hardware class, warm-up, sample count,
measurement boundary, cancellation rule, or owner is stated.

**Recommendation — `update`**

Keep worker adoption deferred, but decide the provider-neutral benchmark and stale-result
contract now.

### M-2 — Accessible virtualization deferral can reopen a settled V1 invariant

**Evidence**

- AD-7 requires all Managed Pieces in the DOM and prohibits V1 virtualization
  (`ARCHITECTURE-SPINE.md:127-135`).
- Accessible virtualization is deferred if full-DOM capacity fails
  (`ARCHITECTURE-SPINE.md:343`).
- UX treats ordinary windowing as nonconforming and requires full capacity/focus evidence
  (`EXPERIENCE.md:41-43`, `EXPERIENCE.md:72`).

The revisit condition does not define “capacity fails,” the equivalence proof, or who can
approve weakening AD-7.

**Recommendation — `update`**

Retain the deferral, but require a named capacity threshold, accessibility equivalence
prototype, browser/AT evidence, and explicit architecture/product approval before AD-7
can change.

### M-3 — Provider-neutral operations are only partially closed

**Evidence**

- AD-10 requires one immutable artifact, parity checks, fingerprinted assets, atomic
  promotion, and rollback (`ARCHITECTURE-SPINE.md:163-175`).
- Hosting/CDN and CI vendors are deferred (`ARCHITECTURE-SPINE.md:341`).

Vendor identity is safely deferrable, but header ownership, CSP verification, subpath
behavior, MIME rules, cache invalidation, evidence retention, rollback verification, and
the release owner are not explicit.

**Recommendation — `discuss`**

Keep vendors deferred; add an enforceable provider-neutral deployment and operations
contract.

### M-4 — IDN draft authority and equality semantics need edge-case closure

**Evidence**

- AD-4 pins `tr46` options, validates through WHATWG, preserves untouched host lexemes,
  and serializes an edited host as lowercase ASCII/Punycode
  (`ARCHITECTURE-SPINE.md:80-94`).
- UX presents two editable domain forms (`DESIGN.md:140-144`) and requires explicit
  conversion status (`EXPERIENCE.md:42`, `EXPERIENCE.md:74`).

The Rule does not fully define normalization-equivalent edits, equality comparison,
which draft is authoritative during failed conversion, or exact rollback of the paired
field.

**Recommendation — `update`**

Add fixtures and a small state contract for conversion timing, equality, paired-field
authority, and failure/reversion.

### M-5 — Redo and bounded History retention cannot be safely deferred together

**Evidence**

- AD-5 requires complete before/after snapshots and exact Undo identity restoration
  (`ARCHITECTURE-SPINE.md:96-109`).
- Redo and bounded History retention are deferred together
  (`ARCHITECTURE-SPINE.md:345`).

Redo is safely deferrable. Bounded retention is not merely an implementation choice: it
can weaken complete Undo to the Initial URL and alter memory behavior.

**Recommendation — `update`**

Split the items. Keep Redo deferred. Treat retention as an open architecture question
with eviction semantics, memory budget, and user-visible recoverability requirements.

## Low Findings

### L-1 — Node runtime policy is not enforceable in repository configuration

The spine selects Node 24 LTS (`ARCHITECTURE-SPINE.md:258`), while `package.json:1-21`
has no `engines` policy and there is no repository runtime-version file.

**Recommendation — `defer`**

Add an enforceable runtime pin when scaffolding begins; until then label it a target
environment.

### L-2 — Browser support versions are a release-time evidence item, not a current fact

The PRD requires the latest two major Chrome, Firefox, Edge, and Safari releases
(`prd.md:426-435`), and UX requires recording exact versions/AT combinations before
claiming support (`EXPERIENCE.md:162-170`). The spine correctly makes browser support a
release gate (`ARCHITECTURE-SPINE.md:220-224`) but no versioned matrix yet exists.

**Recommendation — `defer`**

Record exact versions at release evidence time; do not present them as currently tested.

### L-3 — The structural seed is correctly non-binding but should remain visibly proposed

The proposed `src/core`, `src/app`, `src/platform`, and `src/test` layout appears at
`ARCHITECTURE-SPINE.md:275-291`; the repository does not yet implement it.

**Recommendation — `ignore`**

“Structural Seed” already communicates the right status. Do not turn this tree into an
additional invariant.

## Confirmed Strengths

These areas satisfy the checklist and need no architecture change:

1. **Feature altitude and real divergence points:** The spine focuses on shared URL,
   reducer, History, effects, accessibility, delivery, and evidence contracts rather
   than per-component design (`ARCHITECTURE-SPINE.md:22-37`, `ARCHITECTURE-SPINE.md:41-229`).
2. **State authority:** One reducer owns committed state, drafts, History, and effect
   intents (`ARCHITECTURE-SPINE.md:41-49`).
3. **Lossless URL boundary:** WHATWG acceptance is separated from exact serialization;
   authority, delimiters, empty/trailing entries, query presence, fragments, and opaque
   lexemes are modeled (`ARCHITECTURE-SPINE.md:51-64`).
4. **IDN profile:** `tr46` options and WHATWG host validation are explicit
   (`ARCHITECTURE-SPINE.md:80-94`).
5. **Identity and Undo:** Complete snapshots, immutable non-recycled IDs, deterministic
   LCS reconciliation, and ID restoration are fixed (`ARCHITECTURE-SPINE.md:96-109`).
6. **Accessibility representation:** Full-DOM rendering and V1 non-virtualization are
   explicit (`ARCHITECTURE-SPINE.md:127-135`).
7. **Privacy and security boundary:** No URL-bearing logs, storage, telemetry, query
   strings, outbound requests, or service workers; CSP is defined
   (`ARCHITECTURE-SPINE.md:150-161`). This is consistent with the PRD’s browser-local
   boundary (`prd.md:373-406`).
8. **Static delivery:** Immutable artifacts, parity, fingerprinted assets, atomic
   promotion, and rollback are fixed (`ARCHITECTURE-SPINE.md:163-175`).
9. **Keyboard/IME/pointer ownership:** One arbiter and composition/pointer guards prevent
   several likely cross-story conflicts (`ARCHITECTURE-SPINE.md:188-199`).
10. **Mechanical integrity:** AD IDs are monotonic; every AD has Binds, Prevents, and
    Rule; no placeholder or unpinned Stack row was detected.

## Source Requirement Coverage

| Source area | Coverage | Disposition |
|---|---|---|
| FR-1..FR-3 URL acceptance and structure | Covered by AD-2/AD-3; editor edge cases remain | Update |
| FR-4..FR-9 pieces, Add, edit, delete, Search | Broadly covered by AD-1/AD-3/AD-5/AD-7/AD-11; Search/Add/focus cases need explicit fixtures | Update |
| FR-10..FR-14 synchronization and Undo | Covered by AD-1/AD-5/AD-6; rebase order is incomplete | Update |
| FR-15..FR-16 Copy and feedback | Covered by AD-13; failure/recovery/timing needs executable contract | Update |
| NFR-1..NFR-3 accessibility | Direction covered by AD-7/AD-12/AD-14; evidence pending | Update evidence |
| NFR-4..NFR-7 correctness/consistency | Strongly covered; AD-3 and AD-6 gaps remain | Update |
| NFR-8..NFR-12 privacy/security/local processing | Covered by AD-9 and AD-10 | Ignore |
| NFR-13..NFR-17 performance/browser/capacity | Covered by AD-7/AD-8/AD-11/AD-14; benchmarks and browser evidence pending | Update/defer |
| AG-1 URL fidelity | Design closed by AD-2/AD-3/AD-11; evidence pending | Update status |
| AG-2 IDN conversion | Design mostly closed by AD-4/AD-11; edge fixtures pending | Update |
| AG-3 250+ pieces/accessibility | Direction closed by AD-7/AD-14; release evidence pending | Update status |
| UX keyboard, IME, pointer behavior | Covered by AD-12 | Ignore architecture; update fixtures |
| UX focus, feedback, Copy recovery | Partially covered by AD-5/AD-13 | Update |
| UX responsive/mobile layout | Structurally left to UX/source; no incompatible architecture choice found | Ignore |
| UX exact browser/AT matrix | Correctly a release concern; evidence absent | Defer evidence |

## Structural Dimension Coverage

| Dimension | Status | Evidence / required action |
|---|---|---|
| Paradigm and dependency direction | **Decided** | `ARCHITECTURE-SPINE.md:22-37` |
| Module/boundary ownership | **Decided** | AD-1 and dependency diagram |
| State ownership and atomic mutation | **Decided** | AD-1; AD-6 sequencing needs update |
| URL data model and serialization | **Decided with gap** | AD-2/AD-3; update editing contract |
| IDN conversion | **Decided with gap** | AD-4; add equality/failure fixtures |
| Identity and reconciliation | **Decided** | AD-5 |
| History/Undo | **Partially decided** | AD-5/AD-6; update rebase trace and retention |
| Parsing/concurrency | **Partially decided** | AD-8; update supersession and benchmark |
| Browser effects/clipboard/focus | **Partially decided** | AD-13; update fallback and feedback protocol |
| Keyboard/IME/pointer arbitration | **Decided** | AD-12 |
| Accessibility representation | **Decided for V1** | AD-7; safe revisit gate required |
| Privacy/security/network/storage | **Decided** | AD-9 |
| Error semantics and validation | **Partially decided** | AD-3/AD-4/AD-13; edge contracts need fixtures |
| Testing and release evidence | **Decided in direction, incomplete operationally** | AD-11/AD-14; add evidence matrix |
| Performance/capacity | **Partially decided** | AD-7/AD-8/AD-14; benchmark protocol absent |
| Deployment and environments | **Decided in principle** | AD-10; provider-neutral operational checks needed |
| Infrastructure/provider strategy | **Safely deferred by vendor, not by contract** | Deferred line 341; discuss operational contract |
| Configuration/secrets | **Decided by absence for V1** | Static artifact/no runtime branches/no backend in AD-9/AD-10 |
| Observability/operations | **Partially decided** | Privacy forbids telemetry; release, rollback, and evidence ownership need discussion |
| Persistence/backend/API/routing/SSR | **Explicitly outside V1/deferred** | `ARCHITECTURE-SPINE.md:344`; any introduction must reopen AD-9/AD-10 |
| Brownfield consistency | **Not applicable** | Repository is greenfield; no application stack/code exists to ratify |
| Inherited parent constraints | **None declared/found** | Frontmatter has sources but no parent spine or inherited AD list |

## Deferred Safety Assessment

| Deferred item | Assessment | Classification |
|---|---|---|
| Hosting/CDN and CI vendor | Vendor choice is safe to defer; operational acceptance contract is not fully safe | Discuss |
| Web Worker parsing | Adoption is safe to defer; activation benchmark and cancellation semantics are not | Update |
| Accessible virtualization | Unsafe without an explicit threshold and equivalence approval gate | Update |
| Routing/SSR/server/API/persistence/telemetry/service workers | Safe only while treated as V1 exclusions; any introduction must reopen privacy/delivery ADs | Discuss |
| Redo | Safe to defer | Ignore |
| Bounded History retention | Unsafe to combine with exact complete Undo without eviction semantics | Update |

## Final Disposition

The spine should not be rejected wholesale: its central paradigm and most load-bearing
decisions are sound. Before implementation is split across independent stories, resolve
C-1, obtain the product decision in H-2, and tighten H-1, H-3, H-4, and the evidence
contract in H-5. Provider identity, exact browser versions, Redo, and worker adoption can
remain deferred under the conditions stated above.

**Offer to update:** `true`
**Spine modified:** `false`
