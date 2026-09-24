# Definitive Adversarial Accessibility Review

Scope: current `DESIGN.md` and `EXPERIENCE.md`, reviewed as one WCAG 2.2 AA implementation contract. No spine was edited.

## Counts

- Prior B1–B10 closed: **10**
- Prior B1–B10 open: **0**
- `undo-control` / FR-14 consistency defects: **0**
- Current UX accessibility blockers: **0**
- Nonblocking specification-hardening findings: **12**
- Downstream architecture gates: **3**

## Blockers

**None.** The current pair is internally sufficient to proceed to architecture. This does not waive AG-1–AG-3: implementation stories remain blocked until their stated fixture or prototype exits pass.

## Prior B1–B10 verification

| Prior blocker | Result | Current evidence |
|---|---|---|
| B1 — deterministic polite-status dequeue | **Closed** | `EXPERIENCE.md:109` defines insertion, minimum exposure, application-owned dequeue, class-specific coalescing, FIFO precedence, maximum start latency, overflow handling, and repeat-message mechanics. H1–H3 below tighten edge semantics without reopening the blocker. |
| B2 — identical invalid re-Apply | **Closed** | `EXPERIENCE.md:108` requires child-node replacement or a matrix-tested clear/reinsert sequence and rejects internal-only token changes. |
| B3 — assertive validation cadence | **Closed** | `EXPERIENCE.md:108` limits assertion to committed validation, blur, Apply, or bounded settled input; suppresses unchanged keystroke repeats and active IME composition. H4–H5 improve test precision only. |
| B4 — FR-9 boundary focus | **Closed** | `EXPERIENCE.md:134,234` consistently retain the activated Move control only while enabled, then use the enabled opposite control, then the row/first-editable fallback. |
| B5 — Remove destination existence | **Closed** | `EXPERIENCE.md:133` searches only surviving rows that expose the same subcontrol and supplies deterministic non-row fallbacks. |
| B6 — Clear Search focus | **Closed** | `EXPERIENCE.md:71,131` restores source order, returns focus to Search, and announces the restored count without moving focus into results. |
| B7 — Full URL IME handling | **Closed** | `EXPERIENCE.md:130` prevents Enter/Shift+Enter from applying, closing, rejecting, or mutating History during composition and requires release-matrix evidence. |
| B8 — WCAG 1.4.12 text spacing | **Closed** | `DESIGN.md:177` and `EXPERIENCE.md:258` contain all four normative overrides and prohibit clipping, overlap, hiding, truncation, or lost function. |
| B9 — pointer cancellation | **Closed** | `EXPERIENCE.md:137` covers Add, Remove, Reorder, Undo, Copy, and Clear Search; mutation is up/click-only, with move-away, cancellation, and pointer-down behavior specified. |
| B10 — Domain feedback routing | **Closed** | `EXPERIENCE.md:73,108–110,149,216` consistently routes success to polite status, invalid field input to persistent inline validation plus the validation announcer only, and actionable non-field failure to alert; duplicate speech is prohibited. H7 removes residual visual-spine ambiguity. |

## Undo-control / FR-14 consistency

**Consistent.** `EXPERIENCE.md:76`, the transition table at `118–126`, Flow 2 at `207`, FR-14 at `239`, and NFR-13 at `255` now use the same rule:

1. preserve an invalid Full URL Draft;
2. restore the exact prior committed URL and row state;
3. focus the restored or affected logical item when it exists;
4. otherwise focus the nearest surviving item, then Full URL;
5. announce both the restored committed state and unchanged Draft;
6. never intercept native editing Undo.

The former “keep focus on Undo” contradiction is absent.

## Nonblocking specification-hardening findings

### H1 — Observable exposure clock is implicit

- **Location:** `EXPERIENCE.md:109`
- **Trigger condition:** The 2-second dequeue timer starts when an outcome is queued or scheduled rather than when its live-region node is committed.
- **Guard snippet:** Start the minimum-exposure clock after committed DOM insertion; remove or replace the message no earlier than 2 seconds after that point.
- **Potential consequence:** Scheduling or rendering delay can reduce actual exposure below the normative minimum.

### H2 — Queue-overflow transition is not algorithmically closed

- **Location:** `EXPERIENCE.md:109`
- **Trigger condition:** A committed outcome’s projected FIFO start would exceed 6 seconds.
- **Guard snippet:** Define overflow at enqueue using projected start time, and state whether existing queued outcomes move to visible history, remain queued, or are represented only by the summary.
- **Potential consequence:** Implementations may duplicate, omit, or differently delay committed outcomes.

### H3 — Persistent visible operation history lacks a component contract

- **Location:** `EXPERIENCE.md:63–81,109`
- **Trigger condition:** Sustained input activates the overflow fallback.
- **Guard snippet:** Define its placement, accessible name, semantics, chronological order, capacity, clearing lifecycle, focus behavior, and distinction from mutation History.
- **Potential consequence:** The fallback can become inaccessible, unbounded, visually disruptive, or confused with product Undo history.

### H4 — Settled-input validation has no default timing

- **Location:** `EXPERIENCE.md:108`
- **Trigger condition:** An implementation chooses the optional settled-input assertion path.
- **Guard snippet:** State a default debounce and maximum latency, with the release matrix allowed to lengthen but not shorten the bounds.
- **Potential consequence:** “Bounded” implementations may range from near-keystroke assertion to feedback too delayed to be useful.

### H5 — “Explicit Apply” is not mapped to an interaction

- **Location:** `EXPERIENCE.md:108,130,209`
- **Trigger condition:** Tests distinguish Apply from Enter, blur, or continuous valid input.
- **Guard snippet:** Define Apply as a named visible control or as Enter; otherwise remove the term and use the actual trigger names.
- **Potential consequence:** Validation-repeat, keyboard, pointer, and focus tests can target different or nonexistent actions.

### H6 — Parsing-status delay is qualitative

- **Location:** `EXPERIENCE.md:97`
- **Trigger condition:** Parsing crosses the unspecified “short delay.”
- **Guard snippet:** Give the delay a numeric default and require cancellation of its pending timer when a generation is superseded or finishes first.
- **Potential consequence:** “Parsing URL…” may flash, appear late, or be published for a stale parse.

### H7 — DESIGN broadens Domain “conversion status”

- **Location:** `DESIGN.md:199,214`
- **Trigger condition:** A visual implementation treats invalid conversion as an operation status in addition to inline validation.
- **Guard snippet:** Say “show successful conversion status; show invalid conversion only as persistent inline validation,” with a pointer to the `EXPERIENCE.md` feedback-channel contract.
- **Potential consequence:** B10’s duplicate-speech defect can be reintroduced even though the behavioral spine is correct.

### H8 — Undo-Add “nearest” lacks a tie-break rule

- **Location:** `EXPERIENCE.md:120,239`
- **Trigger condition:** Undo removes an added row with surviving rows on both sides.
- **Guard snippet:** Define nearest in post-removal source order, for example next then previous, matching the directional precision used by Remove.
- **Potential consequence:** Conforming implementations can place focus on different surviving rows.

### H9 — Safe-copy recovery does not name the native field primitive

- **Location:** `DESIGN.md:204`; `EXPERIENCE.md:78,102,136`
- **Trigger condition:** Clipboard failure exposes a 20,000-character URL on touch/AT or at narrow width.
- **Guard snippet:** Specify the read-only native control type, multiline/wrapping behavior, selection method, initial scroll position, accessible description, and how full selection remains perceivable.
- **Potential consequence:** The fallback may technically select the value while hiding selection state, making touch or screen-reader recovery unreliable.

### H10 — Inactive-control explanation association is optional

- **Location:** `DESIGN.md:156,202`; `EXPERIENCE.md:96`
- **Trigger condition:** Undo or Copy is natively disabled and therefore skipped by keyboard and some screen-reader navigation.
- **Guard snippet:** Require a visible state explanation associated with the Actions section or controls whenever inactivity is not self-evident; test discovery without focusing the disabled control.
- **Potential consequence:** Users can encounter an unavailable action without learning why or how to enable it.

### H11 — Pointer-cancellation acceptance evidence is aggregated

- **Location:** `EXPERIENCE.md:137,258`
- **Trigger condition:** A release records one generic pointer-cancellation pass.
- **Guard snippet:** Require per-control evidence for press-drag-away-release, `pointercancel`, and no mutation on pointer-down for Add, Remove, Reorder, Undo, Copy, and Clear Search.
- **Potential consequence:** One control may still mutate on down or after cancellation while NFR-16 is marked passed.

### H12 — WCAG evidence lacks criterion-level traceability

- **Location:** `EXPERIENCE.md:253–259`
- **Trigger condition:** Release evidence must substantiate the WCAG 2.2 AA claim.
- **Guard snippet:** Add a companion trace matrix from acceptance cases to applicable success criteria, including 1.4.10–1.4.12, 2.1.1, 2.4.7, 2.4.11, 2.5.2, 2.5.7, 2.5.8, 3.3.1, 3.3.3, 4.1.2, and 4.1.3 where applicable.
- **Potential consequence:** Strong behavior can still produce incomplete or unauditable conformance evidence.

## AG-1–AG-3

These are **downstream architecture gates, not current UX accessibility blockers**. Their unresolved implementation choices are bounded by fail-closed outcomes:

- **AG-1 — Parser/serializer contract:** exact acceptance, preservation, normalization, snapshot, restore, and Copy fixtures across supported browsers.
- **AG-2 — IDN mapping and serialization:** bidirectional editable mapping, canonical form, rejection, reconstruction, isolation, and exact Copy round trips.
- **AG-3 — Accessible virtualization:** one complete nonduplicated accessible representation, every row reachable once in browse and focus modes, stable identity and operations, and virtualization-on/off equivalence; otherwise ship without virtualization.

## Decision

**Accessibility specification review passes with no open UX blocker.** Close B1–B10 and the former Undo/FR-14 inconsistency. Carry H1–H12 as nonblocking hardening, and do not begin implementation stories until AG-1–AG-3 exit evidence passes.
