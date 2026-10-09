# Validation Report — bmad-training

- **DESIGN.md:** `DESIGN.md`
- **EXPERIENCE.md:** `EXPERIENCE.md`
- **Run at:** 2026-10-09T12:58:02-03:00
- **Scope:** Approved redesign documents and static mockup, not application testing.

## Overall verdict

The approved dark direction and principal interaction decisions are preserved, with resolved tokens, matching component inventories and substantial flow/state coverage. Review identified one contradictory edit-boundary rule and other consequential specification gaps. The final contracts now include corrections; the original reviewer verdicts below describe the reviewed drafts, not an independent re-review of those corrections.

Accessibility review additionally identified filtered-error recovery, transient drag-feedback, dense keyboard navigation and markerless-list risks. All nine consolidated findings are addressed in the written contracts. The ten original findings include one overlapping blur/History finding. Upstream architecture/requirements synchronization remains an implementation-handoff prerequisite. No application delivery, browser/AT conformance or new release coverage is established.

## Category verdicts

| Category | Reviewed-draft verdict |
|---|---|
| Flow coverage | adequate |
| Token completeness | strong |
| Component coverage | adequate |
| State coverage | adequate |
| Visual reference coverage | strong |
| Bloat & overspecification | adequate |
| Inheritance discipline | adequate |
| Shape fit | strong |

## Findings by severity

Original unique findings: **critical 0, high 2, medium 6, low 1**. Each disposition means a documented correction, not an independently verified application fix. Reviewer line citations refer to the draft snapshots; final section names below locate the corrections.

### Critical (0)

None.

### High (2)

**Rubric F1 / Accessibility A11Y-02 — Focus-changing navigation conflicts with blur-close History**

Location: EXPERIENCE Component Patterns, State Patterns and Interaction Primitives.
Jump/drag cancellation cannot promise unchanged total History when ordinary blur closes an already accepted Full URL edit.
Fix: retain ordinary blur closure and distinguish its entry from navigation/selection/preview/cancel, which create no entry of their own. Capture drag revision after focus processing; preserve exact invalid Draft. Added the `A→B`, invalid `X`, jump/cancel acceptance sequence. **Addressed.**

**Accessibility A11Y-01 — Search-hidden invalid-field recovery**

Location: EXPERIENCE Feedback channels and Redesign edge-case acceptance.
Expansion alone cannot reveal a filtered-out invalid field.
Fix: label the error-summary action to disclose Search clearing when needed; explicitly clear with count feedback, expand and focus the same stable-ID field with rejected text/error intact. Otherwise preserve Search. **Addressed.**

### Medium (6)

**Rubric F2 — Mutable display positions confused with immutable IDs**

Location: EXPERIENCE Stable item identity, Component Patterns and Accessibility Floor.
Key renaming changes duplicate membership without reordering.
Fix: only internal IDs are immutable; refresh source totals/ordinals after structural changes and duplicate occurrence after key/membership changes. Define field/action naming and per-group filtered positions. **Addressed.**

**Rubric F3 — Absent, empty and empty-entry query states**

Location: DESIGN managed-piece-row; EXPERIENCE Query value shape and acceptance.
Blank-looking inputs cannot distinguish `flag`, `flag=` and empty entries.
Fix: persistent associated descriptions; preserve existing parser Add defaults and presence transitions. No new presence-toggle control. Full URL remains the way to remove an existing `=`. **Addressed.**

**Rubric F4 — Visible operation-feedback history contract**

Location: Both status-message rows; EXPERIENCE Feedback channels.
Overflow promotion lacks a usable rendering/lifecycle specification.
Fix: labeled chronological ordinary list outside disclosures, exact wrapping outcomes, existing architecture exactly-once promotion, no extra live role/focus movement, session retention and reload/close reset. Separate from Undo History. **Addressed.**

**Accessibility A11Y-03 — Stale drag-preview speech**

Location: EXPERIENCE Feedback channels and Drag transaction.
Pointer destinations could remain queued after drop/cancel.
Fix: transaction-bound latest-destination coalescing, bounded cadence and invalidation before final outcome; visible destination remains available. **Addressed.**

**Accessibility A11Y-04 — No bounded keyboard return from dense lists**

Location: Both navigation-link rows; EXPERIENCE Utility navigation and acceptance.
Bottom Add/new-key focus could require hundreds of tab stops to reach utilities.
Fix: bottom and focus-revealed row links return to Full URL/Copy or Search with explicit focus, no obscured target and no native-editing shortcut interception. **Addressed.**

**Accessibility A11Y-05 — Markerless list semantics**

Location: Both managed-piece-list rows; EXPERIENCE acceptance.
WebKit/VoiceOver can omit native list grouping under markerless CSS.
Fix: require explicit `role="list"` on markerless native ordered lists, retaining list items and source-position text. The approved audit mock stays unchanged; the contract governs implementation. Later browser/AT evidence is still required. **Addressed in contract.**

### Low (1)

**Rubric F5 — Incorrect removal/Undo flow references**

Location: EXPERIENCE acceptance rows FR-7 and FR-14.
Fix: both now reference Flow 3 step 6 instead of reorder step 5. **Addressed.**

## Accessibility perspective and evidence limits

The review calculated actual token pairs: primary text/panel 15.32:1, secondary/panel 9.48:1, action/ink 10.95:1, boundary/panel 3.60:1, selected query boundary 7.66:1 and focus/base 13.50:1. No high-confidence failure was found in the stated operative pairs. The default border against selected fill is only 2.62:1; selected states therefore require their contrasting accent boundary and explicit state. These calculations do not certify rendered opacity, focus clipping, forced colors or changed surfaces.

Static mock limitations are intentional. It does not implement drag, synchronized editing, clipboard effects or the dense dataset. User chose no additional state mockups; remaining recovery/drag/density states are spine-only. Chromium-only MVP evidence does not establish Firefox, WebKit, OS/mobile/manual or full release coverage.

## Editorial polish

Structure: interaction action labels became navigable subsections; the acceptance table was preserved for traceability. Prose: separate cancelled and subsequently committed drag gestures; replace undefined "attentive" with "focused or selected." No functional content or thresholds were removed.

| Pass | Original text | Revised text | Changes |
|---|---|---|---|
| structure | EXPERIENCE Interaction Primitives, 1,282 words in an action list | Action labels become subsection headings; body/order retained | MOVE; applied; word impact 0 |
| structure | EXPERIENCE acceptance table, 1,925 words | Retain requirement/trigger/result/flow table | PRESERVE; traceability rather than redundant narrative; word impact 0 |
| prose | Devon cancels before committing a single valid drop | Devon cancels, then starts another drag before committing | Distinguish separate gestures; applied |
| prose | Up/Down pair within the attentive row | Up/Down pair within the focused or selected row | Use defined visibility states; applied |

Editorial findings in the canonical machine-readable shape:

```json
[
  {
    "lens": "structure",
    "location": "EXPERIENCE.md: Interaction Primitives",
    "trigger_condition": "Implementation references are buried in an uninterrupted action list.",
    "guard_snippet": "MOVE action labels into subsection headings; retain body and order. Word impact: 0.",
    "potential_consequence": "Readers cannot directly navigate specific interaction contracts."
  },
  {
    "lens": "structure",
    "location": "EXPERIENCE.md: Observable acceptance evidence",
    "trigger_condition": "The long acceptance table resembles narrative repetition.",
    "guard_snippet": "PRESERVE the requirement/trigger/result/flow table. Word impact: 0.",
    "potential_consequence": "Cutting it would remove requirement-to-verification traceability."
  },
  {
    "lens": "prose",
    "location": "EXPERIENCE.md: Flow 3 step 5",
    "trigger_condition": "Cancellation and committed drop read as one gesture.",
    "guard_snippet": "State that Devon starts another drag before committing.",
    "potential_consequence": "Readers may infer that a cancelled gesture can commit."
  },
  {
    "lens": "prose",
    "location": "DESIGN.md: query-move-controls",
    "trigger_condition": "The word attentive does not identify a defined visibility state.",
    "guard_snippet": "Use focused or selected.",
    "potential_consequence": "Implementers may use inconsistent reveal conditions."
  }
]
```

## Historical reviews and remaining work

`review-rubric.md` and `review-accessibility.md` describe the pre-redesign package and are excluded from current counts. Their historical source-reconciliation/hardening notes are not current execution evidence or silently accepted implementation changes. Current upstream obligations are tracked in `reconcile-redesign.md`: orchestration, grouped full-DOM lists, presentation/focus ownership, gestures and deliberately mapped evidence identities.

## Reviewer files

- `review-redesign-rubric.md`
- `review-redesign-accessibility.md`
- Historical context only: `review-rubric.md`, `review-accessibility.md`
