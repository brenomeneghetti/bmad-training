# Spine Pair Review — bmad-training

- **Date:** 2026-10-09
- **Scope:** User-selected `bmad-ux` rubric only; documentation review of the revised draft pair, not application testing.
- **Documents:** `DESIGN.md`, `EXPERIENCE.md`, `.memlog.md`, `reconcile-redesign.md`, approved `mockups/dark-workbench.html`, and its retained `.working/` original.
- **Method:** Both passes of `.agents/skills/bmad-ux/references/validate.md`; all three configured DESIGN examples, both EXPERIENCE examples, and `references/design-md-spec.md` read. Relevant PRD, addendum, and architecture contracts inspected directly. No agents, browser execution, application tests, or execution-evidence refresh.

## Overall verdict

The approved dark direction and principal interaction decisions are preserved, with resolved tokens, matching canonical component inventories, and substantial flow/state coverage. The pair is **not yet a clean implementation contract**: one contradictory edit-boundary rule and three medium-impact specification gaps need correction; two acceptance references also need repair. Recorded historical supersessions are legitimate and must not be treated as instructions to restore the old design.

**Findings:** critical **0**, high **1**, medium **3**, low **1**. High and medium findings are specification/handoff blockers, not assertions that the application currently fails. Historical upstream synchronization remains a separate, already-recorded handoff prerequisite.

| Category | Verdict |
|---|---|
| 1. Flow coverage | adequate |
| 2. Token completeness | strong |
| 3. Component coverage | adequate |
| 4. State coverage | adequate |
| 5. Visual reference coverage | strong |
| 6. Bloat & overspecification | adequate |
| 7. Inheritance discipline | adequate |
| 8. Shape fit | strong |

### Citation convention

Local citations below are relative to this report's directory. `PRD` means `../../prds/prd-bmad-training-2026-09-24/prd.md`; `Architecture` means `../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md`. These aliases identify the exact files, not a generic source family.

## 1. Flow coverage — adequate

Source `PRD:81–91` defines one named journey, **UJ-1. Devon safely changes a deep-link configuration.** The exact name is retained at `EXPERIENCE.md:240`; steps 1–6, climax, and clipboard failure are present at `EXPERIENCE.md:242–249`. Devon's invalid-Draft and IDN/high-density flows likewise have numbered steps, climaxes, and failure paths (`EXPERIENCE.md:251–274`). The acceptance table covers FR-1–FR-16 and NFR-1–NFR-17. Success/counter-metrics remain upstream evaluation contracts, not missing UX journeys.

### Findings

- **F5 — low: Two acceptance references point to reorder instead of removal/Undo.** `EXPERIENCE.md:285` maps FR-7 removal to Flow 3 step 5; `EXPERIENCE.md:292` maps FR-14 Undo to the same step. Step 5 specifies reorder, whereas step 6 explicitly performs Add, Remove, and Undo (`EXPERIENCE.md:269–270`). This weakens downstream evidence mapping, not journey coverage. **Fix:** change the FR-7 Flow 3 reference to step 6; change the FR-14 Flow 3 reference to step 6, retaining its existing Flow 1 and Flow 2 references.

F1 below also affects whether the jump/cancel paths can be implemented without contradicting the continuous-edit journey.

## 2. Token completeness — strong

Inspected all frontmatter definitions: **14 colors, 8 typography roles, 2 radii, 13 spacing tokens, and 22 component token objects**. A read-only YAML/reference walk found **126 token-reference occurrences, 40 distinct paths, all resolving** across the pair, including references inside component objects. Color keys are flat/kebab-case, color values are quoted hex strings, typography values use the permitted nested properties, and dimensions are concrete CSS values. There is no unnamed inherited UI system or unresolved external token vocabulary.

The palette matches the approved HTML's CSS (`DESIGN.md:10–24`; `mockups/dark-workbench.html:23–29`). Dark-only identity is explicit; no unapproved light-mode palette is required. Load-bearing contrast targets are stated at `DESIGN.md:193–198`: 7:1 main reading, 4.5:1 normal text/action pairs, and 3:1 boundaries/focus.

Read-only sRGB token calculations, **not rendered-state verification**:

| Pair | Ratio |
|---|---|
| Primary text / panel | 15.32:1 |
| Primary text / selected surface | 11.14:1 |
| Secondary text / panel | 9.48:1 |
| Secondary text / selected surface | 6.89:1 |
| Action / action text | 10.95:1 |
| Default boundary / panel | 3.60:1 |
| Default boundary / input | 3.83:1 |
| Query selection boundary / selected surface | 7.66:1 |
| Focus / base | 13.50:1 |
| Focus / selected surface | 8.87:1 |

The selected boundary deliberately switches to the query accent; the default border's 2.62:1 against the selected fill is not the specified selected-state treatment. The focus offset separates its outline from pale primary fills. Forced-color overrides and disabled states still require future rendered evidence; none was claimed or executed here.

### Findings

None.

## 3. Component coverage — adequate

All **22 canonical identifiers** match between DESIGN frontmatter, `DESIGN.md:234–257`, and `EXPERIENCE.md:92–114`. They cover Full URL, its utilities, Search, detail groups/disclosure controls, passive context, lists/rows/type labels, handle/Move/drop/Remove, bottom Add/top jump, Undo/Copy/recovery, status/context/validation/no-results. The rows contain actual visual and behavioral rules. Clear Search, field errors, and the external error summary are specified as parts of their owning patterns rather than orphan canonical components.

### Findings

- **F4 — medium: Mandatory status-overflow operation history lacks a paired rendering contract.** `EXPERIENCE.md:149` requires every overflow outcome to become persistent visible operation history; `Architecture:262–271` supplies the promotion/queue mechanics. However, the `status-message` rows (`DESIGN.md:254`; `EXPERIENCE.md:111`) describe operation/failure areas without defining the history's placement, entry appearance, browse semantics, or lifetime. A consumer can implement the queues correctly but render no usable history, or introduce duplicate announcements and uncontrolled page growth. **Fix:** extend both `status-message` rows, or add a matching `operation-history` row to both tables. Specify a labeled ordinary list outside disclosures in the feedback area, chronological exact outcome entries, readable wrapping using existing text/spacing tokens, no additional live-region role, no focus stealing, and retention/reset behavior. Reference architecture's existing exactly-once overflow rules rather than inventing another queue.

F3 below is also a missing row variant in `managed-piece-row`, not a missing parser capability.

## 4. State coverage — adequate

The IA surfaces are URL Workbench, Full URL, Structured View, body, Paths, Query Parameters, and external committed-state/validation/feedback (`EXPERIENCE.md:38–46`). State Patterns cover no session, parsing/races, valid and invalid Initial/Draft/field input, independent collapse, focus/pinned selection, drag pending/drop/cancel, empty lists, filtering/no-match, offline/clipboard denial, safe-copy recovery, reload/close, and reduced motion (`EXPERIENCE.md:116–143`). Forced colors, focus, IME, native Undo, and collapsed error/Undo destinations are specified later.

Invalid Draft remains exact while structured mutations, Add, Undo, and Copy use Last Valid. Add clears Search, expands query, appends after the full source list, mounts/focuses the new key, and creates one Add entry; inactive Add without a valid session is explicit. Query drag alone reorders; Path reorder remains prohibited. Search-active drag is explicitly unavailable, while Up/Down retains full-source movement. Stable-ID transactions, changed-position-only commit, stale/cancel behavior, and non-drag alternatives are specified.

### Findings

- **F1 — high: Jump/drag promises conflict with mandatory Full URL blur-close behavior.** `EXPERIENCE.md:107` says the top jump focuses Add but “does not … close an edit or create History.” `EXPERIENCE.md:121` requires blur to close the Full URL session and record its accepted baseline-to-last-valid transition. `EXPERIENCE.md:179` similarly says to close an open edit only at a valid changed-position drop and promises cancellation without History mutation. These cannot all hold when Full URL accepts `A→B`, then contains invalid `X`, and the user leaves it to focus the jump/handle: the inherited blur rule already records `[A→B]` before Add/drop, even if dragging is later cancelled. `PRD:278–279` and `Architecture:130–144` require this blur-close; it is not a recorded redesign supersession. **Fix:** preserve blur-close and explicitly distinguish **no History Entry for the navigation/selection/preview/cancel itself** from a preceding Full URL session-close entry. Remove “close an edit” from the jump prohibition; qualify drag's deferred-close rule to apply only if an edit is still open after any ordinary blur. Add one exact acceptance sequence: baseline `A`, accepted `B`, invalid `X`, jump or focus handle → one `[A→B]` entry, unchanged `X`; cancelled drag adds nothing further; accepted drop/Add adds its own single entry against `B`.

- **F3 — medium: Lossless no-value versus empty-value states have no specified visible row representation or edit/Add transitions.** `PRD:167–168` and `PRD:239–247` require `key`, `key=`, and empty entries to remain distinct. `Architecture:59–60` preserves `equalsPresent` in the model. Nevertheless, the visual row (`DESIGN.md:243`) and behavioral row (`EXPERIENCE.md:100`) specify ordinary key/value fields without explaining how two blank-looking value fields distinguish absent `=` from present-but-empty `=`, or how an entirely empty entry is identified. Add (`EXPERIENCE.md:175`) also omits its initial entry shape. The integrity acceptance row (`EXPERIENCE.md:303`) does not supply these UX rules. **Fix:** extend the existing row pattern with persistent text describing absent value, empty value, and empty entry; associate that description with the value field. Specify Add's initial `rawKey`/`equalsPresent`/`rawValue`, and deterministic value-entry/clear behavior that preserves untouched absence/presence rather than silently conflating them. Document any intentional presence-changing action with paired visual/behavioral rules, using the approved existing tokens. Add an acceptance case for `?flag&flag=&` through unrelated edit, Add, Copy, and Undo. This is an inherited UX gap, not a reason to alter the lossless core or introduce another reorder type.

### Native disclosure/programmatic semantics check

The contract permits native disclosure **or** equivalent heading/button semantics (`EXPERIENCE.md:28,96–97,174`). Both routes are valid:

- Native: `<details open>` with its own `<summary>`; `open` supplies the native expanded/collapsed state. Keep stable content identity and a meaningful heading/name. Do not replace native behavior with a conflicting ARIA role or treat a redundant literal `aria-expanded` attribute as the only source of state.
- Equivalent: heading containing a button with synchronized `aria-expanded`/`aria-controls`, unique controlled-content ID, and genuinely hidden/inert collapsed descendants.

Control-driven collapse retains control focus; programmatic collapse first relocates a focused descendant. Add/jump/error/Undo expand before focusing hidden destinations. Summary links and Full URL/Copy remain outside hidden content. The handle's `aria-pressed` pinned selection and `aria-expanded` effective Move visibility are separately defined; no invalid row `aria-selected`/listbox model is required. The static mock's native details are illustrative, and its aria-hidden grips are explicitly excluded from production semantics. No native-semantics blocker was found.

## 5. Visual reference coverage — strong

Inventory:

| Location | Disposition and coverage |
|---|---|
| `mockups/dark-workbench.html` | Sole promoted keeper; inline links at `DESIGN.md:186,232` and `EXPERIENCE.md:48,224` identify its composition/state coverage. |
| `wireframes/` | No files present. |
| `imports/` | No files present. |
| `.working/direction-dark-workbench.html` | Retained discovery original, referenced at `DESIGN.md:186`; read-only byte comparison confirms equality with the promoted keeper. Not an orphan promoted reference. |

The pair states spines-win-on-conflict at `DESIGN.md:186`. Desktop/narrow Full URL/Copy, expanded groups, native collapsed composition, both Domain forms, duplicate rows, selected/focused Move appearance, and bottom Add are anchored. Search, live conversion, errors, parsing, safe-copy, actual handle selection/drag/cancel, and dense jump-focus mechanics are explicitly spine-only (`EXPERIENCE.md:48`). Pending-approval/unresolved annotations in the preserved HTML are explicitly historical, not current unresolved directions.

### Findings

None. A static mock is not execution evidence. Additional state mockups are not required merely because some specified states are spine-only.

## 6. Bloat & overspecification — adequate

DESIGN uses the approved tokens rather than repeatedly embedding pixel values; explicit 700px wrapping/reflow and focus-outline dimensions serve actual approved layout/accessibility decisions. EXPERIENCE's large acceptance table provides traceable trigger/result/failure rules rather than copying personas or product narrative. Feedback timing and the virtualization contingency are lengthy but inherited, load-bearing contracts, not decorative prose or permission to implement virtualization.

Some architecture-gate and release-matrix material could be shortened by reference in a later editorial pass, but doing so is not required to resolve a consequential gap and must not discard release obligations. No additional editorial lens was run.

### Findings

None.

## 7. Inheritance discipline — adequate

All three relative `sources` paths resolve in both files. UJ-1 matches the source verbatim, the Domain/Path Segment/Query Parameter glossary remains compatible, unmanaged context does not become new editors/Search targets, and there is no inherited component-library ambiguity. Token paths and canonical component names resolve consistently. AD-5 supplies immutable snapshot IDs and deterministic reparsing; filtering is correctly presentation-only.

### Findings

- **F2 — medium: Display ordinals/duplicate occurrences are incorrectly constrained as immutable identity labels.** `EXPERIENCE.md:101` says only a committed source reorder changes source identity labels; `EXPERIENCE.md:123` says source ordinal and duplicate occurrence change only when source order changes. Renaming query key `tag` to `view` changes duplicate membership/occurrence without moving any ID, and Add/Remove changes totals/ordinals without necessarily being a reorder operation. A downstream consumer following the literal rule can announce stale duplicate occurrences or totals. `EXPERIENCE.md:195` also points to a “naming formula” in the row that is described only abstractly at line 100. **Fix:** state that the **opaque internal ID alone is immutable**. Recompute source ordinal/total after committed structural changes and duplicate occurrence/total after committed key or membership changes; filtering changes neither source order nor duplicate membership. Define the row/control naming template explicitly: type, source ordinal/total, duplicate-key occurrence/total when applicable, field/action name, and separately labeled filtered-result position. With separate native lists, filtered set positions/sizes must describe the owning group list, not a synthetic cross-group set. Retain IDs, focus, and History identity across these label updates.

### Recorded historical upstream synchronization — not new rubric defects

`reconcile-redesign.md:12–15,44` already records the approved supersessions. The corresponding unresolved upstream work remains an implementation-handoff gate:

1. `Architecture:151–154` still specifies **one semantic list**; synchronize grouped full-DOM lists without permitting virtualization, omission, or reordered pieces.
2. `Architecture:361–362` still names **Full URL/Actions/Structured View** orchestration; align it with inline Copy/Undo and independent disclosures.
3. `Architecture:221–222,256–260` needs the new handle gesture/drop/cancel, reveal-before-focus, disclosure expansion, and top jump destinations; retain completed-activation-only mutations.
4. The old top Add, light identity, permanent Move, and optional-future-drag wording cited as `@HEAD` in reconciliation describes the **historical committed UX**, not instructions in the revised draft. Do not report these as current PRD mandates or restore them.

Synchronize sources and deliberately map the new acceptance/evidence identities before handoff. These previously declared tasks are **not counted again** among F1–F5. Resolving them must preserve PRD FR-8/FR-9, exact Copy/Last Valid, chronological Undo, immutable IDs, privacy, and the existing accessibility floor.

## 8. Shape fit — strong

DESIGN follows canonical order: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. Required YAML name and token structure are present.

EXPERIENCE includes Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, and Key Flows. Inspiration & Anti-patterns earns its place from the selected reference and rejected features; Responsive & Platform is triggered and present. Architecture Gates is a justified product-specific section. Draft status and 2026-10-09 update dates are explicit in both files.

### Findings

None.

## Mechanical notes and approved-direction preservation

- Frontmatter sources, all token references, promoted reference links, and canonical component identities resolve. No Mermaid diagrams require validation.
- Navy layers, rounded panels/styled inputs, blue/violet/teal groups, system typography, and meaningful hierarchy preserve `.memlog.md:29–31`.
- Full URL/Copy remain outside disclosures; Copy is adjacent at adequate widths with approved narrow wrapping; Undo stays in the same panel.
- Body means supported non-path/non-query context with both editable Domain forms, not expanded managed scope. Fragment/scheme/port/userinfo remain passive in Structured View.
- Three groups are independent and initially expanded. Errors and committed-source context remain discoverable when collapsed.
- The sole Add is bottom-of-query with a top keyboard-accessible **jump link**, not a second Add action (`.memlog.md:32`).
- Required query-handle dragging coexists with tap selection/focus-revealed Up/Down. No permanent Move clutter, hover-only access, drag-only interaction, or Path reorder is introduced.
- Filtered drag is explicitly prohibited unless Search is empty; non-drag source-adjacent movement remains available. This is a recorded conservative resolution, not an unfilled ambiguity.
- Current/Last Valid Copy and safe-copy recovery are explicit; invalid Draft is retained exactly; no presentation state itself is a URL mutation, subject to the edit-close clarification in F1.
- All review outcomes here concern source contracts. Previous review reports and reconciliation's proactive coverage claims are not substitutes for this review or execution evidence. No browser/AT, application, release, or multi-browser passing result is claimed; Chromium-only MVP evidence cannot establish the later release matrix.

## Resolution checklist

| ID | Severity | Exact editable location | Concrete resolution |
|---|---|---|---|
| F1 | high | `EXPERIENCE.md:107,121,179` | Distinguish incidental blur-close History from non-mutating jump/drag/cancel; add the `A→B`, invalid `X`, jump/cancel acceptance case. |
| F2 | medium | `EXPERIENCE.md:100–101,123,195` | Keep only internal IDs immutable; refresh ordinals/totals and duplicate labels on their actual dependencies; write the explicit control-name and per-group filtered-list rules. |
| F3 | medium | `DESIGN.md:243`; `EXPERIENCE.md:100,175,303` | Specify visible absent/empty/empty-entry variants, initial Add shape, value-edit transitions, and exact `?flag&flag=&` acceptance. |
| F4 | medium | `DESIGN.md:254`; `EXPERIENCE.md:111,149` | Add paired ordinary-list operation-history rendering/lifetime semantics outside disclosures, retaining architecture's queue/promotion behavior. |
| F5 | low | `EXPERIENCE.md:285,292` | Point removal and Flow 3 Undo coverage to step 6 instead of step 5. |

Only this report was authored. Spines, memlog, approved HTML, application, sources, prior reports, and evidence contracts were not edited.
