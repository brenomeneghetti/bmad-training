# Sprint Change Proposal

**Project:** bmad-training
**Date:** 2026-09-29
**Status:** Approved
**Approved:** 2026-09-29
**Recommended approach:** Direct Adjustment
**Scope classification:** Moderate

## 1. Issue Summary

The implementation-readiness review found two blockers before sprint tracking
was generated:

1. Architecture AD-14 and the UX Architecture Gates preamble block
   implementation stories until gate evidence passes, while those stories
   implement the behavior needed to produce the evidence. AG-1 also includes
   History and Copy evidence delivered only in Epic 3, creating a circular
   dependency for earlier stories.
2. Story 2.6 requires structured mutation controls to be inactive while Full
   URL is invalid, contradicting PRD section 9, Architecture AD-6, UX State
   Patterns, and Story 2.7, which require those controls to remain enabled
   against Last Valid.

The trigger was a planning-readiness review rather than an implementation
failure. The detailed evidence is recorded in `implementation-readiness.md`.

## 2. Impact Analysis

### Epic Impact

- **Epic 1:** Scope and order remain valid. Gate wording must allow
  implementation to produce progressively mapped AG-1, AG-2, and AG-3
  evidence.
- **Epic 2:** Scope remains valid. Story 2.6 must align with the approved
  invalid-Draft policy and Story 2.7.
- **Epic 3:** Scope remains valid. Story 3.6 must describe the evidence
  evaluator as the story-completion and release oracle rather than an
  implementation-entry oracle.
- No epic is added, removed, renumbered, deferred, or reordered.

### Story Impact

- Story 2.6 receives one corrected invalid-Draft acceptance criterion.
- Story 3.6 receives one terminology correction.
- Other story acceptance criteria and mappings remain unchanged.

### Artifact Conflicts

- **PRD:** No change. The MVP and invalid-Draft policy are consistent.
- **Architecture:** AD-14 requires a progressive evidence model.
- **UX:** The Architecture Gates preamble requires the same progressive model.
- **Epics:** The global evidence requirement, Story 2.6, and Story 3.6 require
  alignment.
- **Design:** No visual-system change.
- **Implementation readiness report:** Remains unchanged as the discovery
  record.

### Technical Impact

No code, infrastructure, deployment, CI/CD, or persisted sprint tracking exists
to migrate. The technical contracts, evidence schema, fixture coverage,
performance thresholds, browser/AT matrix, privacy constraints, and release
quality bar remain unchanged.

## 3. Recommended Approach

Use a **Direct Adjustment**:

- Permit implementation work to begin so it can produce mapped evidence.
- Prevent a story from being marked complete until every mandatory evidence
  cell mapped to that story passes.
- Do not let evidence mapped only to later capabilities block earlier stories.
- Continue to block release until every mandatory release cell and complete
  shared corpus pass.
- Align Story 2.6 with the existing Last Valid close-and-rebase policy.

### Alternatives Considered

- **Potential Rollback:** Not applicable because implementation has not begun.
- **MVP Review:** Not needed because no product capability, success metric, or
  quality target changes.

### Estimate and Risk

- **Planning effort:** Low; four surgical document edits.
- **Implementation effort change:** None expected.
- **Timeline impact:** One planning correction and readiness rerun before sprint
  status generation.
- **Risk:** Low. The change removes ambiguity without weakening acceptance or
  release gates.

## 4. Detailed Change Proposals

### Architecture

#### AD-14 — Release evidence is an architecture gate

**Old**

> An implementation story touching AG-1, AG-2, or AG-3 is blocked until that
> gate's prototype or fixture exit evidence passes. Release is blocked until
> the shared corpus passes...
>
> One versioned, machine-validated evidence manifest and evaluator is the sole
> implementation-entry and release oracle.

**New**

> AG-1 through AG-3 use progressive evidence. Implementation may begin to
> produce a story's mapped fixtures and results. A story mapped to mandatory
> gate cells cannot be marked complete until those cells pass for that story's
> delivered behavior. Evidence from later capabilities is not a prerequisite
> for starting or completing earlier stories unless the manifest explicitly
> maps that cell to the earlier story. Release remains blocked until the
> complete shared corpus and every mandatory release cell pass.
>
> One versioned, machine-validated evidence manifest and evaluator is the sole
> story-completion and release oracle.

All existing evidence schema, thresholds, failure definitions, and release
requirements remain unchanged.

**Rationale:** Removes the circular dependency while preserving hard evidence
gates for story completion and release.

### UX

#### EXPERIENCE.md — Architecture Gates preamble

**Old**

> This UX package is ready for architecture handoff while its lifecycle status
> remains draft. Implementation stories are blocked until **every** gate below
> passes its prototype or fixture exit criteria:

**New**

> This UX package is ready for implementation handoff. AG-1 through AG-3 use
> progressive evidence: implementation may begin to produce mapped fixtures and
> results, but a story cannot be marked complete until every mandatory gate
> cell mapped to that story passes. Evidence mapped only to later capabilities
> does not block earlier stories. Release remains blocked until every gate
> below and every mandatory release cell passes its exit criteria:

The three gate definitions and all UX exit criteria remain unchanged.

**Rationale:** Aligns UX with Architecture AD-14 without weakening UX evidence.

### Epics and Stories

#### Additional Requirements — Evidence gates

**Old**

> Treat AG-1 parser/serializer, AG-2 IDN, and AG-3 full-DOM accessibility
> evidence as implementation gates. A machine-validated evidence manifest must
> map every mandatory FR, NFR, UX case, fixture, story, owner, result, tested
> version, artifact digest, and sign-off; mandatory cells pass only as `pass`.

**New**

> Treat AG-1 parser/serializer, AG-2 IDN, and AG-3 full-DOM accessibility
> evidence as progressive story-completion gates and final release gates.
> Implementation may begin to produce mapped evidence; each story completes
> only when its mandatory mapped cells pass. Evidence mapped to later
> capabilities does not block earlier stories. A machine-validated evidence
> manifest must map every mandatory FR, NFR, UX case, fixture, story, owner,
> result, tested version, artifact digest, and sign-off; mandatory cells pass
> only as `pass`.

**Rationale:** Makes the epic sequence executable while retaining mandatory
evidence.

#### Story 2.6 — Invalid-Draft acceptance criterion

**Old**

> **Given** Full URL briefly becomes invalid during this story
> **When** validation settles
> **Then** the text remains visible as a Draft and Structured View continues to
> show Last Valid without presenting synchronization success
> **And** structured mutation controls are explicitly inactive with an
> explanation in this state rather than risking a stale branch.

**New**

> **Given** Full URL briefly becomes invalid during this story
> **When** validation settles
> **Then** the text remains visible as an exact Draft and Structured View
> continues to show Last Valid without presenting synchronization success
> **And** structured mutation controls remain enabled against Last Valid; before
> the first such mutation, the reducer closes the Full URL edit and records any
> baseline-to-last-valid transition, then applies the structured mutation
> chronologically while preserving the Draft exactly, as specified in Story
> 2.7.

**Rationale:** Aligns the story with PRD section 9, Architecture AD-6, UX State
Patterns, and Story 2.7.

#### Story 3.6 — Evidence oracle terminology

**Old**

> one versioned evidence manifest and evaluator act as the sole
> implementation-entry and release oracle

**New**

> one versioned evidence manifest and evaluator act as the sole
> story-completion and release oracle

**Rationale:** Matches the progressive evidence model.

## 5. Implementation Handoff

### Classification

**Moderate:** The change spans Architecture, UX, and backlog artifacts but does
not alter MVP scope, epic order, technology, or implementation behavior.

### Recipients and Responsibilities

- **Solution Architect:** Apply and validate the AD-14 progressive evidence
  wording.
- **Product Owner / Developer:** Apply the UX and `epics.md` edits exactly as
  approved and verify story-to-gate mappings remain progressive.
- **Sprint Planning owner:** Rerun implementation readiness, then generate
  `sprint-status.yaml` only after a PASS.

### Success Criteria

1. No planning artifact states that all AG evidence must pass before
   implementation can begin.
2. Every artifact consistently treats mandatory gate evidence as a
   story-completion and release condition.
3. Story 2.6 and Story 2.7 both keep structured mutations enabled against Last
   Valid during an invalid Full URL Draft.
4. The readiness gate returns PASS with no circular dependency or invalid-Draft
   conflict.
5. Sprint tracking is generated from the corrected epic set.

## Checklist Status

- Section 1 — Trigger and Context: complete.
- Section 2 — Epic Impact Assessment: complete.
- Section 3 — Artifact Conflict and Impact Analysis: complete.
- Section 4 — Path Forward Evaluation: complete.
- Section 5 — Proposal Components: complete.
- Section 6 — Final Review and Handoff: complete.

## Workflow Execution Log

- **Change trigger:** Readiness blockers caused by the circular AG evidence rule
  and contradictory Story 2.6 invalid-Draft criterion.
- **Approval:** Approved without conditions by Breno on 2026-09-29.
- **Scope:** Moderate.
- **Artifacts authorized for modification:** `ARCHITECTURE-SPINE.md`,
  `EXPERIENCE.md`, and `epics.md`.
- **Handoff:** Solution Architect owns AD-14 validation; Product Owner /
  Developer owns UX and backlog edits; Sprint Planning owner reruns readiness
  and generates tracking only after PASS.
- **Sprint status:** No existing `sprint-status.yaml`; no migration required.
