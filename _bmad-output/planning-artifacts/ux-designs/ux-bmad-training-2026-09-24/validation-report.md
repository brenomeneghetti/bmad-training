# Validation Report — bmad-training

- **DESIGN.md:** `DESIGN.md`
- **EXPERIENCE.md:** `EXPERIENCE.md`
- **Run at:** 2026-09-24T18:39:44.563-03:00

## Overall verdict

**Ready for architecture handoff with 0 UX blockers.** The current DESIGN.md and EXPERIENCE.md pair is mechanically complete and internally consistent across flows, tokens, components, states, visual-reference handling, document shape, and the reconciled FR-14 Undo contract.

One medium upstream reconciliation finding remains: the PRD Decision Summary still presents invalid-Draft structured editing as unresolved even though the PRD journey and UX contract commit to preserving the Draft and editing Last Valid URL. Accessibility passes with no blocker and carries 12 nonblocking specification-hardening findings.

AG-1–AG-3 are downstream architecture gates, not UX defects. They block implementation stories until parser/serializer, IDN, and accessible-virtualization fixture or prototype evidence passes.

## Category verdicts

- Flow coverage — strong
- Token completeness — strong
- Component coverage — strong
- State coverage — strong
- Visual reference coverage — strong
- Bloat & overspecification — adequate
- Inheritance discipline — adequate
- Shape fit — strong

## Findings by severity

### Critical (0)

None.

### High (0)

None.

### Medium (1)

**[Inheritance discipline] — Upstream PRD retains a stale invalid-Draft decision** (§ `prd.md` Decision Summary and §2.3; `.memlog.md`; `EXPERIENCE.md`)

The final PRD Decision Summary still frames invalid-Draft structured editing as a choice between disabling mutations and discarding the draft. The PRD journey, UX override, and EXPERIENCE.md instead preserve the Draft and allow Structured View editing against Last Valid URL. The UX contract is unambiguous, so this is not a UX blocker, but declared-source consumers can encounter a false open decision.

Fix: Close the PRD Decision Summary item or mark it superseded by the committed journey and UX contract.

### Low (12)

**[Accessibility review] — H1: Observable exposure clock is implicit** (§ `EXPERIENCE.md:109`)

If the two-second timer starts before live-region DOM commitment, actual message exposure can fall below the normative minimum.

Fix: Start the clock after committed DOM insertion and remove or replace the message no earlier than two seconds afterward.

**[Accessibility review] — H2: Queue-overflow transition is not algorithmically closed** (§ `EXPERIENCE.md:109`)

When projected FIFO start exceeds six seconds, implementations can differ on whether outcomes remain queued, move to history, duplicate, or disappear behind a summary.

Fix: Define overflow at enqueue using projected start time and specify the disposition of every queued outcome.

**[Accessibility review] — H3: Persistent visible operation history lacks a component contract** (§ `EXPERIENCE.md:63–81,109`)

The sustained-input fallback has no defined placement, semantics, capacity, clearing lifecycle, focus behavior, or distinction from mutation History.

Fix: Define its accessible name, chronological ordering, capacity, lifecycle, focus behavior, and relationship to product Undo history.

**[Accessibility review] — H4: Settled-input validation has no default timing** (§ `EXPERIENCE.md:108`)

The optional bounded assertion path could become either near-keystroke chatter or feedback too delayed to help.

Fix: State a default debounce and maximum latency; permit the release matrix to lengthen but not shorten those bounds.

**[Accessibility review] — H5: “Explicit Apply” is not mapped to an interaction** (§ `EXPERIENCE.md:108,130,209`)

Validation, keyboard, pointer, and focus tests can target different or nonexistent actions.

Fix: Define Apply as a named visible control or Enter, or replace the term with the actual trigger names.

**[Accessibility review] — H6: Parsing-status delay is qualitative** (§ `EXPERIENCE.md:97`)

An unspecified “short delay” can cause Parsing URL to flash, appear late, or publish for a stale generation.

Fix: Provide a numeric default and cancel the pending timer when the generation is superseded or completes first.

**[Accessibility review] — H7: DESIGN broadens Domain conversion status** (§ `DESIGN.md:199,214`)

A visual implementation could treat invalid conversion as operation status in addition to inline validation, reintroducing duplicate speech.

Fix: Limit conversion status to success and route invalid conversion only through persistent inline validation per EXPERIENCE.md.

**[Accessibility review] — H8: Undo-Add “nearest” lacks a tie-break rule** (§ `EXPERIENCE.md:120,239`)

When surviving rows exist on both sides, conforming implementations can choose different focus destinations.

Fix: Define nearest in post-removal source order, such as next then previous.

**[Accessibility review] — H9: Safe-copy recovery does not name the native field primitive** (§ `DESIGN.md:204`; `EXPERIENCE.md:78,102,136`)

A long URL can be technically selected while selection state remains imperceivable or unreliable on touch, narrow widths, or assistive technology.

Fix: Specify the read-only native control, wrapping, selection method, initial scroll, accessible description, and perceivable full selection.

**[Accessibility review] — H10: Inactive-control explanation association is optional** (§ `DESIGN.md:156,202`; `EXPERIENCE.md:96`)

Natively disabled Undo or Copy controls may be skipped, leaving users unable to discover why the action is unavailable.

Fix: Require a visible explanation associated with Actions or the controls whenever inactivity is not self-evident.

**[Accessibility review] — H11: Pointer-cancellation acceptance evidence is aggregated** (§ `EXPERIENCE.md:137,258`)

A generic pass can conceal a control that still mutates on pointer-down or after cancellation.

Fix: Require per-control evidence for drag-away release, `pointercancel`, and no mutation on pointer-down for Add, Remove, Reorder, Undo, Copy, and Clear Search.

**[Accessibility review] — H12: WCAG evidence lacks criterion-level traceability** (§ `EXPERIENCE.md:253–259`)

Strong behavior can still produce incomplete or unauditable evidence for the WCAG 2.2 AA claim.

Fix: Add a companion matrix mapping acceptance cases to applicable success criteria, including 1.4.10–1.4.12, 2.1.1, 2.4.7, 2.4.11, 2.5.2, 2.5.7, 2.5.8, 3.3.1, 3.3.3, 4.1.2, and 4.1.3.

## Downstream architecture gates

- **AG-1 — Parser/serializer contract:** implementation stories remain blocked until cross-browser acceptance, preservation, normalization, snapshot, restore, and Copy fixtures pass.
- **AG-2 — IDN mapping and serialization:** implementation stories remain blocked until mapping profile, canonical form, rejection, reconstruction, isolation, and exact round-trip fixtures pass.
- **AG-3 — Accessible virtualization:** implementation stories remain blocked until one complete nonduplicated accessible representation and virtualization-on/off equivalence pass; otherwise ship without virtualization.

AG-1–AG-3 are not UX findings and do not change the 0 UX blocker count.

## Mechanical notes

- Finding counts: critical 0 · high 0 · medium 1 · low 12.
- Exact UJ-1 label passes.
- FR rows: 16/16; NFR rows: 17/17.
- FR-14 Undo consistency passes across the component row, transition table, Flow 2, acceptance evidence, and source.
- Token references: 36/36 resolved; colors: 17/17 valid six-digit hex.
- Component parity: 13/13.
- Visual-reference orphans: 0.
- Mermaid blocks: 0.

## Reviewer files

- `review-rubric.md`
- `review-accessibility.md`
