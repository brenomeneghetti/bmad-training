# Spine Pair Review — bmad-training

## Overall verdict

**Ready for architecture handoff with no open UX blocker.** The current spine pair is mechanically complete and internally consistent across flows, tokens, components, states, visual-reference handling, and required document shape. The just-fixed FR-14 contract now agrees in the `undo-control` row, Undo transition table, Flow 2, and acceptance evidence, and the Key Flow heading now reproduces the exact source label `UJ-1. Devon safely changes a deep-link configuration.`

**Finding counts:** critical 0 · high 0 · medium 1 · low 0.

**UX blockers:** 0.

**Downstream architecture gates:** AG-1–AG-3 remain valid and block implementation-story readiness until their fixture/prototype exit criteria pass; they are not UX defects.

## 1. Flow coverage — strong

Checked source **UJ-1. Devon safely changes a deep-link configuration.**, FR-1–FR-16, and NFR-1–NFR-17 against Key Flows and Observable acceptance evidence. The exact UJ-1 label, including terminal punctuation, is now copied verbatim from the PRD. Its numbered Devon journey contains a clear climax and Clipboard failure path; Flows 2 and 3 cover invalid-Draft, IDN, density, virtualization, focus, and validation paths.

All 16 FRs and all 17 NFRs have individual, literal, uniquely numbered acceptance rows. The combined close-and-rebase row adds cross-requirement evidence without replacing any individual row.

### Findings

No misses.

### FR-14 verification

- `undo-control` sends focus to the restored or affected logical item when it exists, then the nearest surviving item, then Full URL.
- The Undo transition table specializes that same fallback per mutation and filtered state.
- Flow 2 step 3 applies the FR-14 destination during an invalid Draft URL.
- The FR-14 acceptance row requires the same sequence and fails on lost focus.
- Invalid Draft text remains unchanged throughout, and native text-editing Undo retains precedence inside editable fields.

No competing “focus remains on Undo” rule remains in either spine.

## 2. Token completeness — strong

Extracted 17 colors, 6 typography roles, 4 radii, 10 spacing tokens, 13 component token groups, and 36 unique DESIGN.md token references. Every reference resolves. All 17 colors use valid six-digit hex values; no dark-mode pair is required because dark mode is explicitly outside the V1 contract.

Load-bearing contrast and state treatment are specified for default text, primary actions, functional borders, validation, focus on neutral and blue controls, forced colors, changed state, and disabled state. EXPERIENCE.md references `{spacing.pointer-min}` and `{spacing.control-target}` consistently with DESIGN.md.

### Findings

No misses.

## 3. Component coverage — strong

The same 13 canonical identifiers appear in DESIGN.md frontmatter, DESIGN.md Components, and EXPERIENCE.md Component Patterns:

`full-url-editor`, `action-bar`, `search-field`, `managed-piece-list`, `managed-piece-row`, `piece-type-label`, `add-query-parameter-control`, `undo-control`, `copy-control`, `safe-copy-readonly`, `status-message`, `validation-message`, and `no-results-state`.

Every identifier has substantive visual and behavioral rules. Cross-section uses preserve those names, and the formerly contradictory `undo-control` behavior is reconciled.

### Findings

No misses.

## 4. State coverage — strong

Walked URL Workbench, Full URL, Actions, and Structured View. Applicable coverage includes No session, delayed Parsing with stale-result rejection, Active valid, Invalid Initial URL, Invalid Draft URL, Invalid Managed Piece, Clipboard failure, Reload/close, Reduced motion, no Search results, inactive Undo/Copy, deterministic post-mutation focus, forced colors, responsive reflow, high-density virtualization, and virtualization failure fallback.

Offline and permission-denied states do not apply to this browser-local, account-free V1. Network loss cannot block core processing; Clipboard denial/failure is covered by the safe-copy recovery path.

### Findings

No misses.

## 5. Visual reference coverage — strong

No files exist in `imports/`, `.working/`, `mockups/`, or `wireframes/`; only the two spines and review/validation artifacts are present. The memlog explicitly records URL Workbench, Full URL, Actions, Structured View, and Status as intentionally spine-only for V1. EXPERIENCE.md states once that the spines are authoritative over any future mockup, wireframe, or import.

### Findings

No orphaned, unspecific, or conflicting visual references.

## 6. Bloat & overspecification — adequate

The pair is dense, but most detail is load-bearing for exact serialization, continuous-edit history, invalid-Draft behavior, deterministic focus, accessible high-volume lists, feedback routing, and release evidence. Tables carry the contracts, upstream personas and scope are inherited rather than restated wholesale, and AG-1–AG-3 defer unresolved implementation semantics behind measurable outcomes.

The timing and accessibility detail is unusually prescriptive but remains tied to observable behavior and known failure modes. No section is purely decorative or safely removable without weakening downstream extraction.

### Findings

No actionable bloat finding.

## 7. Inheritance discipline — adequate

Both `sources` paths resolve. The UJ-1 name is now character-for-character identical to the PRD. FR/NFR numbering, glossary terms, component identifiers, and token references remain consistent across the spines and declared sources. The current FR-14 focus rule inherits the PRD exactly and is repeated consistently at component, state-transition, journey, and acceptance levels.

### Findings

- **[medium] [source reconciliation]** The final PRD Decision Summary still presents invalid-Draft structured editing as an unresolved choice between disabling mutations and discarding the draft, while the PRD journey, UX memlog override, and EXPERIENCE.md commit to preserving the Draft and allowing Structured View editing against Last Valid URL (`prd.md`, Decision Summary and §2.3; `.memlog.md`, invalid-Draft override; `EXPERIENCE.md`, Foundation/State Patterns/Flow 2). The UX contract itself is unambiguous, so this is not a UX blocker, but a declared-source consumer can encounter a false open decision. *Fix:* close or mark the PRD Decision Summary item superseded.

## 8. Shape fit — strong

DESIGN.md follows the canonical order exactly: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts.

EXPERIENCE.md contains every required default: Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, and Key Flows. Inspiration & Anti-patterns and Responsive & Platform are present because source comparisons, explicit rejects, breakpoints, narrow-width behavior, zoom, and multi-device AT coverage trigger them. Architecture Gates and Observable acceptance evidence earn their place as downstream decision boundaries and testable handoff contracts.

### Findings

No misses.

## Architecture gate disposition

- **AG-1 — Parser/serializer contract:** valid downstream architecture gate. Exact parsing, preservation, normalization, snapshots, restoration, and Copy serialization require cross-browser fixtures.
- **AG-2 — IDN mapping and serialization:** valid downstream architecture gate. Mapping profile, canonical form, rejection behavior, reconstruction, isolation, editable-direction round trips, and exact Copy form require an architecture decision and fixtures.
- **AG-3 — Accessible virtualization:** valid downstream architecture gate. Architecture must prove one complete, nonduplicated accessible representation and virtualization-on/off equivalence for the 250+ fixture; otherwise the product ships without virtualization.

AG-1–AG-3 are not counted as rubric findings or UX blockers. They continue to block implementation stories until their stated exit evidence passes.

## Mechanical notes

- Exact UJ-1 label: **pass** — `UJ-1. Devon safely changes a deep-link configuration.`
- FR rows: **16/16** individual, unique, and correctly numbered.
- NFR rows: **17/17** individual, unique, and correctly numbered.
- FR-14 Undo consistency: **pass** across component row, transition table, Flow 2, acceptance evidence, and source.
- Token references: **36/36** resolved; colors: **17/17** valid six-digit hex.
- Component parity: **13/13** across DESIGN.md frontmatter, DESIGN.md Components, and EXPERIENCE.md Component Patterns.
- Visual-reference orphans: **0**.
- Mermaid blocks: **0**.
- Verdicts: **flow strong; tokens strong; components strong; states strong; visual references strong; bloat adequate; inheritance adequate; shape strong**.
