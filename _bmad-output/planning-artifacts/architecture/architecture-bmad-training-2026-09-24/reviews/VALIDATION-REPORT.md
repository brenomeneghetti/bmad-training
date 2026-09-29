# Architecture Spine Validation Report

**Artifact:** `../ARCHITECTURE-SPINE.md`
**Validated:** 2026-09-29
**Intent:** Validate only; the spine was not modified.
**Final verdict:** **Pass after update — 0 Critical and 0 High findings remain.**

The initial validation found the issues documented below. The approved
blocker/high update synchronized the PRD, amended the existing ADs without
renumbering, and passed the final rubric, adversarial, technology-currency, and
deterministic lint gates. Medium/low hardening residue remains intentionally
deferred.

## Gate Summary

| Gate | Result | Evidence |
| --- | --- | --- |
| Deterministic lint | Pass | 0 findings |
| Final good-spine rubric | Pass | 0 critical, 0 high |
| Final adversarial divergence | Pass | 0 critical, 0 high |
| Technology currency | Pass with watch items | All named versions exist and are compatible |

The spine is strong on paradigm, ownership, lossless URL representation, identity,
privacy, accessibility representation, and static delivery. The remaining gaps are
concentrated at cross-unit seams where compliant implementations can still produce
different History, serialization, focus, feedback, or release behavior.

## Resolved Blocking Findings

### C-1 — Full URL close-and-rebase does not determine one History order

**Evidence:** `ARCHITECTURE-SPINE.md:41-49,111-125`; `EXPERIENCE.md:86-92,104-108`.

AD-6 permits reducers to close and append the Full URL edit before a structured
mutation or apply the mutation against Last Valid before closing/replacing the edit.
Both readings satisfy the prose but produce different snapshots and first Undo targets.

**Resolution:** AD-6 now fixes close-first chronology, separate History entries,
latest-Last-Valid rebasing, and the first Undo target.

### H-1 — Invalid-Draft behavior conflicts with an unresolved PRD decision

**Evidence:** `prd.md:22-23,506-507`; `ARCHITECTURE-SPINE.md:116-125`.

The PRD leaves the behavior open, while AD-6 adopts preserve-invalid-Draft plus
structured mutation against Last Valid. This is a product choice, not merely an
implementation detail.

**Resolution:** The user approved the UX policy; the PRD and AD-6 now carry the same
invalid-Draft and chronological History contract.

## Resolved High-Priority Architecture Updates

| ID | Finding | Why units can diverge | Smallest closure |
| --- | --- | --- | --- |
| H-2 | Component codec profile is incomplete | Editors can accept/encode or reject spaces, controls, backslashes, quotes, `%`, `+`, Unicode, and partial triplet edits differently. | Bind each managed component to an exhaustive encode/validation profile and normative vectors. |
| H-3 | “Exact token” lacks an LCS identity key | Query reconcilers can include or exclude `separatorBefore`, changing retained IDs and focus. | Define the exact path/query comparison projection and before/after ID maps. |
| H-4 | Parse supersession is ambiguous | A pending Full URL parse may overwrite a newer structured mutation or be discarded. | Bind acceptance to session epoch, generation, exact input snapshot, and originating committed revision; invalidate on superseding commands. |
| H-5 | Effect ordering and stale outcomes are underspecified | Serial and concurrent executors both satisfy “ID order” but produce different focus, clipboard recovery, and announcements. | Define start/completion/ack order, per-kind concurrency, pruning, and a stale-outcome matrix. |
| H-6 | Focus and feedback contracts are not fully executable | Equal-distance focus fallback and feedback overflow allow different reducer behavior. | Add deterministic tie-breaks and queue transition tables with stable fixture IDs. |
| H-7 | Release gates claim closure before evidence exists | AG-1..AG-3 can read as complete even though no implementation evidence matrix exists. | Label them “design closed; implementation evidence pending” and require a versioned coverage matrix. |

## Medium-Priority Findings

| ID | Finding | Disposition |
| --- | --- | --- |
| M-1 | Worker activation lacks benchmark fixture, build mode, browser/hardware profile, sample count, and cancellation contract. | Update the deferred trigger contract. |
| M-2 | Virtualization can reopen AD-7 without a quantified failure threshold or approval gate. | Tighten the revisit condition and evidence/approval requirements. |
| M-3 | Deployment does not bind one canonical header manifest to preview, production, and all HTML responses. | Add a versioned header manifest and parity probes to the release unit. |
| M-4 | IDN paired-draft authority, normalization equality, failed conversion, and rollback semantics remain open. | Add a small state contract and fixtures. |
| M-5 | Bounded History retention is grouped with safely deferred Redo even though retention can weaken complete Undo. | Split the items; keep Redo deferred and make retention an explicit architecture question. |

## Low-Priority and Watch Items

- Treat Stack versions as **target/proposed** until scaffolding locks them in the
  repository. `create-vite` is a bootstrap tool, not a runtime dependency.
- Document why TypeScript 6.0.2 is intentionally held while TypeScript 7's programmatic
  API stabilizes.
- Pin Node to at least **24.15.0 LTS** because jsdom 30.1.1 does not support every Node
  24 patch.
- Node 24 moves from Active LTS to Maintenance LTS on 2026-10-20; recheck at release.
- pnpm, oxlint, and Vitest are slightly behind latest but remain real and compatible.
- Add enforceable runtime configuration when scaffolding starts and record exact
  browser/AT versions at release time.

## Confirmed Strengths

- Functional Core / Imperative Shell and inward dependency direction are explicit.
- One reducer owns state mutation, snapshots, drafts, History, and effect intents.
- WHATWG acceptance is separated from lossless serialization.
- IDN conversion options and host validation are pinned.
- Piece IDs are immutable and snapshots restore exact serialization and identity.
- Full-DOM rendering is a clear V1 accessibility invariant.
- URL content has no network, storage, telemetry, or diagnostics sink.
- Static delivery, artifact promotion, cache behavior, and rollback are substantially
  defined.
- Keyboard, IME, and pointer arbitration have one owner.
- Mechanical integrity is clean: unique AD IDs, complete Binds/Prevents/Rule blocks,
  no placeholders, and pinned Stack rows.

## Completed Update Sequence

1. Approve and reconcile invalid-Draft product behavior.
2. Specify the close-and-rebase transition trace.
3. Tighten codec, identity reconciliation, parse supersession, and effect protocols.
4. Make focus, feedback, and release evidence executable.
5. Refine worker, virtualization, deployment-header, IDN, and History-retention
   revisit contracts.
6. Clarify stack status and runtime floors.

## Review Evidence

- [`review-rubric.md`](review-rubric.md)
- [`review-adversarial-divergence.md`](review-adversarial-divergence.md)
- [`review-technology-currency.md`](review-technology-currency.md)
- [`review-closure-rubric.md`](review-closure-rubric.md)
- [`review-closure-adversarial.md`](review-closure-adversarial.md)
- [`review-closure-technology-currency.md`](review-closure-technology-currency.md)
