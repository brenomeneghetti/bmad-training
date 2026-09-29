# UX-to-Architecture Reconciliation Review

**Reviewed:** 2026-09-24
**UX inputs:** `DESIGN.md`, `EXPERIENCE.md`
**Architecture input:** `ARCHITECTURE-SPINE.md`
**Verdict:** **Not reconciled for implementation handoff.** The architecture preserves the principal URL, history, identity, privacy, and full-DOM decisions, but it does not close the UX architecture gates with traceable evidence and leaves several behavior/accessibility contracts without an architectural owner or executable release gate.

## What landed

- The transactional session authority, exact snapshots, immutable piece IDs, close-and-rebase behavior, and Last Valid URL model align with the UX state spine.
- The lossless scanner/serializer and shared codec address the core AG-1 direction, including duplicate order, delimiters, percent-octet casing, Fragment text, and untouched tokens.
- The `tr46`/WHATWG IDN decision resolves the principal AG-2 technology choice and preserves focused-form ownership.
- The full-DOM V1 decision avoids ordinary DOM virtualization and its browse-mode omission risk.
- Browser-local processing, prohibited external sinks, exact Copy source, and static delivery align with the privacy contract.

## Reconciliation findings

### 1. AG-1, AG-2, and AG-3 have decisions but no closure record

- **UX evidence:** `EXPERIENCE.md:37-45` blocks implementation stories until every architecture gate passes its exit criteria.
- **Architecture evidence:** `ARCHITECTURE-SPINE.md:43-159` marks related decisions adopted, while the document remains `status: draft` at line 8. There is no gate ledger, evidence link, pass/fail disposition, or residual blocker.
- **Gap:** “ADOPTED” is not equivalent to the prototype/fixture exit evidence required by the finalized UX.
- **Required reconciliation:** Add a gate disposition mechanism in the architecture package or companion evidence: owner, chosen decision, required fixtures/prototype, evidence location, and explicit pass/block state for AG-1 through AG-3. Implementation remains blocked until it records passes or an approved replacement criterion.
- **Consequence:** Teams can treat architectural choices as permission to implement before interoperability and accessibility evidence exists.

### 2. AG-3 is bypassed rather than explicitly resolved

- **UX evidence:** `EXPERIENCE.md:43` requires one complete, nonduplicated accessible representation and a 250+ row prototype/equivalence exit.
- **Architecture evidence:** AD-7 (`ARCHITECTURE-SPINE.md:111-119`) chooses full DOM and prohibits V1 virtualization; virtualization is deferred at lines 248-254.
- **Gap:** Full DOM is a sound V1 direction, but the spine never states whether AG-3 is satisfied by removing visual windowing, nor which browse/focus, naming, focus, validation, and 250+ capacity checks still gate the full-DOM release.
- **Required reconciliation:** Explicitly dispose AG-3 as “full DOM; virtualization equivalence not applicable for V1,” while retaining the 250+ complete-row browse/focus and capacity evidence as release gates.
- **Consequence:** AG-3 can remain formally open forever or be incorrectly considered wholly waived, including its non-virtualized accessibility checks.

### 3. The shared corpus is less specific than the AG-1 exit matrix

- **UX evidence:** `EXPERIENCE.md:41` requires exact Draft, Current, Last Valid, Structured View, History, restored serialization, and copied strings across supported browsers, including invalid percent sequences, empty/absent values, and untouched content.
- **Architecture evidence:** AD-11 (`ARCHITECTURE-SPINE.md:153-159`) names broad fixture classes and exact Copy/Undo strings, but not the required cross-state, cross-browser matrix.
- **Gap:** The corpus can pass while omitting one or more UX state representations or browser serializers.
- **Required reconciliation:** Define a fixture result schema that asserts every required representation for each AG-1 case and runs unchanged through core, component, and supported-browser acceptance layers.
- **Consequence:** A lossless core test may pass while rendered, restored, or copied values drift in a browser.

### 4. The AG-2 fixture and failure contract is incomplete

- **UX evidence:** `EXPERIENCE.md:42` names `faß.de`, combining-mark equivalents, Arabic/Hebrew labels, uppercase Punycode, deviation characters, confusable mixed-script hosts, conversion failure, display reconstruction, and exact Copy form.
- **Architecture evidence:** AD-4 (`ARCHITECTURE-SPINE.md:75-86`) chooses non-transitional UTS #46 and lowercase ASCII/Punycode after edit; AD-11 only says “IDN/RTL cases.”
- **Gap:** The mapping choice landed, but the mandatory corpus members and conversion-failure/reconstruction outputs did not.
- **Required reconciliation:** Make the named AG-2 cases and both editable directions explicit in the acceptance corpus, including local invalid draft behavior, counterpart non-mutation, visible reconstruction, and exact snapshot/Copy serialization.
- **Consequence:** Domain conversion can be internally deterministic yet violate the finalized editable-display and failure experience.

### 5. Feedback-channel behavior has no complete architecture contract

- **UX evidence:** `EXPERIENCE.md:106-112` defines separate inline validation, polite status, and actionable alert channels; stable IDs; atomic correction; repeat-node behavior; per-class queues; 100 ms insertion, 2-second exposure, 300 ms coalescing, 6-second FIFO bound, overflow history, and persistence.
- **Architecture evidence:** `app/feedback` appears in the structural seed and capability map (`ARCHITECTURE-SPINE.md:205`, `242`), but no invariant defines its state model, queue ownership, timers, repeat semantics, or channel isolation.
- **Gap:** A directory assignment does not protect the UX contract. The reducer/effect boundary also does not say which timing and ordering state is application-owned.
- **Required reconciliation:** Establish an adopted feedback-channel decision: typed channel intents, deterministic queue/replacement state, timer ownership, repeat insertion semantics, persistence rules, and executable browser/AT cases.
- **Consequence:** Implementations may overwrite messages, drop committed outcomes, duplicate speech, or announce failures through the wrong channel.

### 6. Safe-copy recovery is reduced to an adapter name

- **UX evidence:** `EXPERIENCE.md:77-78,102` requires the exact attempted Current/Last Valid source, selection and focus, native touch/AT and keyboard Copy, preserved Draft and History, platform-neutral actionable guidance, and persistence until the next Copy attempt or URL mutation. `DESIGN.md:204` adds persistent labeling and visible full-value selection.
- **Architecture evidence:** The spine provides `platform/clipboard` and the sole `snapshot.serialized` Copy source, but no recovery state or focus/lifetime contract.
- **Gap:** The architecture does not say whether safe-copy state belongs to the reducer, an effect result, or transient component state, and does not guard its lifecycle.
- **Required reconciliation:** Model clipboard failure as a typed result that produces reducer-owned recovery state plus post-render select/focus intent; specify its clearing events and mobile native-copy acceptance cases.
- **Consequence:** Failure can expose the wrong value, disappear prematurely, mutate History, or be unusable without a hardware keyboard.

### 7. Parsing architecture omits required shell behavior

- **UX evidence:** `EXPERIENCE.md:97` requires delayed “Parsing URL…”, `aria-busy`, retained Full URL focus, stale-generation rejection, atomic final publication, Copy/Undo against Last Valid, mutation supersession, and no partial rows.
- **Architecture evidence:** AD-8 (`ARCHITECTURE-SPINE.md:121-130`) covers synchronous core parsing, snapshot/generation checks, stale completion rejection, and complete results.
- **Gap:** The visible busy-state delay, busy cleanup, retained focus, Copy/Undo continuity, and mutation-supersedes-parse behavior have no architectural state/effect owner.
- **Required reconciliation:** Define the parse lifecycle in session/app contracts, including delayed busy intent, cancellation/supersession events, atomic cleanup on every terminal path, and allowed commands while parsing.
- **Consequence:** Stale rows may be prevented while the UI still traps operations, leaves `aria-busy` stuck, or announces obsolete work.

### 8. IME, native Undo, and Full URL key semantics did not land

- **UX evidence:** `EXPERIENCE.md:130,135` defines Enter/Shift+Enter behavior, composition guards, exact paste retention, platform-primary Product Undo, Alt/AltGraph exclusions, editing-host/text-selection exclusions, and native Undo precedence.
- **Architecture evidence:** AD-6 defines close-and-rebase state semantics, but the spine has no input-intent normalization boundary or keyboard guard contract; AD-11 does not name IME/native-product Undo cases.
- **Gap:** The state transition is correct only after the shell decides which command to emit, but those command-generation rules are unguarded.
- **Required reconciliation:** Add an app input-controller convention and acceptance cases for composition, paste, Enter/Shift+Enter, editable descendants, selection ownership, modifiers, and visible Undo fallback.
- **Consequence:** IME confirmation can commit unexpectedly, Product Undo can replace native text Undo, or pasted line breaks can be silently normalized.

### 9. Deterministic focus transitions are not represented as executable policy

- **UX evidence:** `EXPERIENCE.md:114-126,133-134` specifies mutation-specific Undo, Remove, Reorder, filtered-target, boundary, and fallback focus paths.
- **Architecture evidence:** AD-5 says transitions emit focus intents by immutable ID and the shell mounts before focus; `platform/focus` executes them.
- **Gap:** ID-based focus is necessary but insufficient for next/previous same-subcontrol search, Clear Search fallback, after-list Add/heading fallback, disabled Move boundary handling, and filtered Undo announcements.
- **Required reconciliation:** Encode focus destinations and fallback chains as typed transition outputs or pure policy functions in `core/session`, then exercise each table row through component/browser tests.
- **Consequence:** Focus can remain technically ID-based while becoming lost, absent, or inconsistent after structural changes.

### 10. Semantic page structure and high-density bypass paths have no architecture guard

- **UX evidence:** `EXPERIENCE.md:18-28,144` requires one main, three uniquely headed/labelled sections, stable heading/landmark IDs, rotor verification, an exact tab sequence, skip links, and semantic pre-/after-list Add routes. `DESIGN.md:179,213` requires frequent actions to remain reachable without traversing all rows.
- **Architecture evidence:** The structural seed names feature folders but no semantic shell contract or DOM-structure test boundary.
- **Gap:** Full DOM increases the importance of the skipped navigation and tab-order requirements, yet AD-7 does not bind them.
- **Required reconciliation:** Define a Workbench shell contract/component test that asserts landmarks, headings, unique stable IDs, skip targets, duplicate Add semantics, tab order, and rotor output.
- **Consequence:** The non-virtualized 250+ row solution can be complete in the DOM but impractical to navigate.

### 11. Responsive, target-size, focus, and text-spacing requirements are only indirectly referenced

- **UX evidence:** `DESIGN.md:164-179,213-217` and `EXPERIENCE.md:141-149,179-186,258-259` require 320 CSS px/400% reflow, essential-field-only horizontal scrolling, 24×24 minimum and 44×44 target sizes, two-layer/forced-color focus, sticky-region non-obscuration, and WCAG 1.4.12 spacing without clipping or loss.
- **Architecture evidence:** The spine says CSS Modules consume committed tokens and broadly maps accessibility to AD-7/AD-11, but does not identify layout primitives, enforcement checks, or release evidence.
- **Gap:** Token consumption does not ensure responsive behavior or accessibility geometry.
- **Required reconciliation:** Add a UI conformance gate owned by `styles`/Workbench browser tests for the exact widths, zoom, text-spacing overrides, target geometry, forced colors, focus visibility, and sticky-state obstruction.
- **Consequence:** A token-correct implementation can still fail the finalized reflow and operability contract.

### 12. Pointer cancellation and Escape preservation are absent

- **UX evidence:** `EXPERIENCE.md:137-138` prohibits mutation on pointer-down, requires cancellation before release, and prevents Escape from discarding Draft or committed state.
- **Architecture evidence:** No command-ingress rule or acceptance-corpus case covers these event boundaries.
- **Gap:** Reducer atomicity cannot prevent the shell from emitting a valid command from the wrong DOM event.
- **Required reconciliation:** Constrain mutation intent generation to activation/click semantics, define cancellation tests for every named control, and test Escape against Draft/Current/Last Valid invariants.
- **Consequence:** Accidental press/cancel gestures or Escape handling can cause irreversible-looking state changes.

### 13. Search and Add quiet behaviors lack state-transition coverage

- **UX evidence:** `EXPERIENCE.md:71,81,131-132` requires case-insensitive coverage of all searchable fields, no History mutation, settled result announcements, Clear Search focus restoration, both Add routes, active-search clearing, one History Entry, mounted appended row, and key focus.
- **Architecture evidence:** Search and identity are mapped to `core/session`/`app/pieces`, but AD-5 only states that Search is not History and the spine does not define the remaining transitions.
- **Gap:** The architecture has no parity guard between the two Add controls or ordering for clear-search, append, mount, focus, history, and announcement.
- **Required reconciliation:** Define pure Search/Add transition contracts and shared commands used by both Add controls, with browser tests for filtered/unfiltered and no-result states.
- **Consequence:** Duplicate controls can diverge, active filters can hide newly added rows, or Add can create duplicate History entries.

### 14. Release browser/AT evidence governance did not land

- **UX evidence:** `EXPERIENCE.md:162-173` requires recorded concrete minimum versions and mandatory Clipboard, touch AT, virtual keyboard, live-region, DOM movement, reflow, forced-colors, Undo, IME, parse-race, and virtualization/full-DOM cases before support is claimed.
- **Architecture evidence:** AD-10 says browser support is a release gate and AD-11 names browser acceptance generally; no evidence artifact, version-record owner, or claim-blocking rule is defined.
- **Gap:** The supported matrix is inherited but not operationalized.
- **Required reconciliation:** Name the versioned release-evidence artifact, its owner, required case identifiers, and the rule that prevents a release/support claim when any matrix cell lacks evidence.
- **Consequence:** The product can claim supported browsers while only core or desktop keyboard paths have been verified.

## Gate disposition

| UX gate | Architecture decision | Reconciliation result |
|---|---|---|
| AG-1 — Parser/serializer | AD-2, AD-3, AD-5, AD-11 | **Decision substantially landed; exit evidence and full cross-state/browser fixture matrix missing.** |
| AG-2 — IDN | AD-4, AD-11 | **Technology decision landed; named fixtures, reconstruction/failure behavior, and exact Copy evidence incomplete.** |
| AG-3 — Accessible virtualization | AD-7, Deferred virtualization | **V1 direction is compatible, but the gate is not explicitly disposed and full-DOM accessibility/capacity evidence remains required.** |

## Reconciliation acceptance

The architecture can be considered reconciled when:

1. AG-1 through AG-3 have explicit pass/block dispositions and linked executable evidence.
2. Feedback, safe-copy, parsing lifecycle, input guards, and focus fallback policies have named state/effect owners.
3. The shared corpus and browser suite enumerate the finalized UX cases rather than referring to accessibility or browser acceptance only in aggregate.
4. A versioned browser/AT release record demonstrates semantic structure, live regions, mobile copy recovery, IME/native Undo, 320px/400% reflow, text spacing, pointer cancellation, and complete 250+ row navigation.

No changes were made to `ARCHITECTURE-SPINE.md`.
