# Redesign review — accessibility only

**Date:** 2026-10-09

**Lens:** Accessibility; WCAG 2.2 AA, consumer/public URL utility

**Disposition:** Five actionable findings. Resolve the contract findings before implementation handoff; preserve the approved visual direction.

## Scope and evidence limits

Reviewed the draft `DESIGN.md`, `EXPERIENCE.md`, `.memlog.md`, `reconcile-redesign.md`, and approved `mockups/dark-workbench.html`, with relevant PRD and architecture requirements. Locations below are workspace-relative within `_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/`, unless an upstream path is explicitly given.

This was direct document/source inspection and an in-memory calculation of the actual proposed hex colors. No agents, application execution, browser accessibility checks, clipboard tests, or application tests were run. The findings identify contract inconsistencies, consequential missing interaction rules, and a static-markup compatibility hazard—not observed application failures. The 320 CSS px, 400% zoom, touch/AT, and 250+ query cases were examined as specified behaviors, not certified as passing.

The confirmed dark rounded surfaces, colored group accents, adjacent Copy with narrow wrapping, independent initially expanded disclosures, primary handle drag, focused/selected Up/Down, handle-tap reveal, sole bottom Add, and top Add jump link are the review baseline. None of the fixes requires reversing those decisions or broadening URL capabilities.

## Actionable findings

### A11Y-01 — Error-summary recovery cannot reveal a Search-hidden invalid field

**Severity:** High — the specified correction destination can be unreachable.

**Location:** `EXPERIENCE.md:34–36`, `EXPERIENCE.md:147–148`, `EXPERIENCE.md:174`.

**Evidence:** Search “filters visibility” and expansion does not change Search. Error-summary links nevertheless promise to expand the owning group, mount, and focus the exact invalid field. Hidden descendants are expressly prohibited from receiving programmatic focus. The summary-link behavior handles disclosure hiding, but has no rule for Search hiding.

**Trigger:** Make a Domain or query field invalid, leave its rejected local text in place, then Search for another piece. Activate that field's external error-summary link, with its group expanded or collapsed.

**Consequence:** Expanding the group does not make the filtered-out field visible. An implementation following only the stated steps either loses the correction focus or focuses hidden content. Clearing validation or replacing the rejected text with the committed model would violate the preserved correction contract. Relevant WCAG concerns are 2.4.3, 3.3.1, and 3.3.3.

**Concrete fix:** Define a filtered-error recovery branch. When the exact field is excluded by Search, label the summary action to disclose that it will clear Search; on explicit activation, clear Search with the existing count announcement, expand the owning group, render the same stable-ID field with its rejected local text and error intact, scroll without obscuring focus, then focus it. When Search already includes the field, leave Search unchanged. Neither branch changes URL state or History. Add an acceptance case combining invalid field, Search exclusion, collapsed group, and error-link activation.

### A11Y-02 — Focus-changing jump/drag promises contradict the required blur commit

**Severity:** Medium — conflicting contracts can produce missing or unexpected History entries.

**Location:** `EXPERIENCE.md:107`, `EXPERIENCE.md:121–122`, `EXPERIENCE.md:179`; supporting upstream requirement: `_bmad-output/planning-artifacts/prds/prd-bmad-training-2026-09-24/prd.md:274–275`.

**Evidence:** The Add jump “does not … close an edit or create History,” but explicitly moves focus to Add. The continuous Full URL edit must close and record its accepted transition on blur. The drag contract similarly forbids closing an open Full URL edit on pointer-down/preview and promises cancellation without History mutation, while the drag handle is a focusable button.

**Trigger:** With Full URL focused, accept a valid change from A to B, optionally then type invalid Draft X. Click the Add jump, or press a query handle and cancel the gesture. Normal link/button focus moves away from the textarea and causes blur before the eventual jump/drop outcome.

**Consequence:** Literal implementations cannot satisfy both rules. Suppressing the established blur close can leave accepted edits unrecorded or incorrectly merge them with the next mutation; obeying blur contradicts the unconditional “no History” promise. An edit preceding a cancelled drag must not be mistaken for a reorder entry or discarded. This is a predictable-focus/Undo contract issue, not evidence that ordinary links themselves violate WCAG.

**Concrete fix:** Keep the established blur/close-and-rebase rule. Specify that jump, selection, drag preview, and cancellation create **no entry of their own**, while ordinary blur may close an already accepted Full URL edit. Capture the drag source revision after any such legitimate closure, and distinguish that entry from the single eventual reorder entry. Qualify cancellation feedback to say that no reorder was saved rather than claiming all History is unchanged in this combined case. If the stronger no-blur-during-pending-drag behavior is retained, explicitly require deferring pointer-induced handle focus until tap/drop recognition, with cancellation restoring the original focus; do not leave that exception implicit. Cover A→B→invalid X followed by jump and cancelled drag, preserving X and the exact accepted snapshot.

### A11Y-03 — Transient drag destinations lack coalescing and end-of-gesture invalidation

**Severity:** Medium — stale preview speech can obscure or contradict the final operation outcome.

**Location:** `EXPERIENCE.md:104`, `EXPERIENCE.md:149`, `EXPERIENCE.md:179–180`.

**Evidence:** The new drop indicator requires polite destination announcements. The feedback rules define coalescing for result counts and synchronization, plus FIFO handling for committed operations; they do not classify transient drag destinations or specify removal of pending preview announcements on drop/cancel.

**Trigger:** Move a handle across many destinations in a 250+ query list, then cancel or drop. Destination changes can greatly outnumber the outcomes a screen reader can usefully announce.

**Consequence:** A reasonable implementation using the specified status queue can retain obsolete “move before/after” announcements after cancellation or after the committed position is announced. A separate uncoordinated polite region can compete with operation status instead. The requirement to announce destinations is present, but its delivery contract is incomplete. Relevant WCAG concern: 4.1.3; this is not a claim of measured AT speech behavior.

**Concrete fix:** Add an explicit transient `drag-preview` feedback class: announce only changed logical insertion destinations, coalesce to the latest destination at a bounded cadence, and do not queue every pointer event. Tie previews to the drag transaction/source revision. On drop, Escape, lost capture, Search activation, or stale-source cancellation, discard all pending previews for that transaction before publishing the final drop/cancel outcome through the operation channel. Keep the current destination visibly available as text and maintain separate validation/failure channels. Define an acceptance case where rapid preview changes are immediately followed by cancellation and by a valid drop.

### A11Y-04 — Dense-list navigation has a forward jump but no bounded keyboard return

**Severity:** Medium — consequential keyboard/low-vision navigation gap at the supported density.

**Location:** `DESIGN.md:218`, `EXPERIENCE.md:107`, `EXPERIENCE.md:175`, `EXPERIENCE.md:191`.

**Evidence:** DESIGN requires Full URL, Search, Copy, Undo, and the result summary to remain quickly reachable “without walking every row.” EXPERIENCE defines a top-to-bottom Add jump, but its stated tab order places the sole Add after all expanded query-row controls. No return focus route to the URL/Search utilities is defined. A sticky header is only conditional.

**Trigger:** Add or reorder near the end of 250+ queries, then use keyboard-only navigation to inspect Full URL, Search again, Undo, or Copy. The prescribed focus destinations leave focus deep in the list.

**Consequence:** The contract permits hundreds of intervening tab stops before returning to the primary utilities. Merely scrolling a sticky header into view, or using a browser scroll-to-top command, does not establish keyboard focus there. This is a high-density usability/contract gap; long tab order alone is not asserted to be a WCAG failure.

**Concrete fix:** Specify real reverse focus navigation, not just visual reachability. At minimum, place a keyboard-accessible “Back to Full URL and Copy” link and “Back to Search” link beside the sole bottom Add, with stable destinations and explicit focus behavior. Also define a bounded route from a focused deep query row, such as a focus-visible row return link, without intercepting native text-editing keys. Navigation preserves Search, selection, rejected Draft text, and URL state; any existing edit closure follows A11Y-02. Keep the single bottom Add and its top jump. Include 320px/400% zoom focus visibility and a 250+ row keyboard journey from new-key/move focus back to Copy.

### A11Y-05 — Markerless native lists need an explicit WebKit-safe semantic safeguard

**Severity:** Medium — static-preview list semantics are not reliably preserved across the intended AT matrix.

**Location:** `mockups/dark-workbench.html:91`, `mockups/dark-workbench.html:220`, `mockups/dark-workbench.html:244`, `mockups/dark-workbench.html:339`, `mockups/dark-workbench.html:355`.

**Evidence:** The global `ol` rule sets `list-style: none`. The four Paths/query lists have labels but no explicit `role="list"` and are not inside a navigation landmark. Safari/WebKit has a documented accessibility heuristic that can omit native list semantics for markerless lists in this configuration; an accessible label is not a dependable substitute for retaining the list role.

**Trigger:** Browse the static mock, or copy its markerless-list styling into production, using Safari/VoiceOver.

**Consequence:** Piece text can remain readable while list grouping/count navigation is lost. That is consequential for the complete ordered representation at 250+ rows. Relevant WCAG concern: 1.3.1. This is a known source-level compatibility hazard, not a Safari test result.

**Concrete fix:** Preserve the approved markerless appearance but require explicit `role="list"` on these native `<ol>` containers, retaining `<li>` children and visible source-position text; alternatively retain native visible markers. Record the safeguard in the list component contract so production does not inherit CSS that strips grouping. If the approved mock must remain byte-for-byte unchanged as an audit artifact, document this delta rather than editing the keeper. Later verify list counts, grouping, order, and browse navigation in Safari/VoiceOver and the full release matrix.

## Actual dark-palette contrast calculations

Computed from `DESIGN.md:11–24` and `mockups/dark-workbench.html:25–29`; these are identical hex values. For each sRGB channel `s = channel / 255`, linearize with `s / 12.92` when `s ≤ 0.04045`, otherwise `((s + 0.055) / 1.055)^2.4`. Relative luminance is `0.2126R + 0.7152G + 0.0722B`; contrast is `(Llighter + 0.05) / (Ldarker + 0.05)`. Values below are rounded only for display.

| Actual combination | Ratio | Interpretation |
|---|---:|---|
| Primary `#EFF4FC` / panel `#121D2E` | 15.32:1 | Normal text exceeds 4.5:1 and the 7:1 reading target. |
| Primary / input `#0D1726` | 16.29:1 | Editable URL/field text. |
| Primary / raised `#1A2940` | 13.25:1 | Secondary action text. |
| Primary / selected `#20374A` | 11.14:1 | Lowest primary-text ratio across the proposed dark surfaces. |
| Secondary `#B5C3D8` / panel | 9.48:1 | Help, counts, context. |
| Secondary / selected | 6.89:1 | Lowest secondary-text ratio across the proposed dark surfaces; passes AA normal text. |
| Body accent `#8CB9FF` / panel | 8.46:1 | Blue group text/boundary. |
| Path accent `#C5ADFF` / panel | 8.70:1 | Violet group text/boundary. |
| Query accent `#76DECA` / panel | 10.53:1 | Teal group text/boundary. |
| Body / selected; Path / selected; Query / selected | 6.15:1; 6.33:1; 7.66:1 | Accent text remains above 4.5:1 on the darkest-contrast proposed state. |
| Action `#A4C8FF` / action ink `#0B1220` | 10.95:1 | Copy/Add text pair. |
| Action / panel; action / selected | 9.90:1; 7.20:1 | Links remain readable. |
| Boundary `#63758F` / input; panel; raised | 3.83:1; 3.60:1; 3.12:1 | Functional boundaries on these adjacent surfaces exceed 3:1. |
| Query boundary / selected | 7.66:1 | Explicit selected/focused-row boundary. |
| Focus/validation `#FFD58A` / base; panel; input; raised; selected | 13.50:1; 12.20:1; 12.96:1; 10.55:1; 8.87:1 | Proposed dark-surface outline and validation pairs exceed their applicable thresholds. |

**No high-confidence contrast failure was found in the stated operative pairs.** Two qualifications matter:

- Default boundary `#63758F` against selected surface `#20374A` is **2.62:1**. This is not automatically a failure in the reviewed field treatment: the border still contrasts **3.83:1** with the input interior, and the selected row itself uses the teal boundary at **7.66:1**. Do not repurpose the default border as the sole state indicator on a selected-surface control without checking its actual identifying edges.
- Selected fill versus input fill is only **1.46:1**. The design correctly requires the contrasting teal boundary and explicit text/programmatic state rather than relying on fill alone. The focus outline's 3px offset must continue to expose the adjacent dark surface around pale primary buttons; the dark-surface ratios do not certify an outline placed directly on a pale button.

These calculations do not establish rendered contrast under opacity, forced colors, focus clipping, text-spacing overrides, or changed surfaces.

## Reviewed contracts that are adequately specified

The following are not additional findings and are not passing application-test claims:

- **Disclosure/keyboard semantics:** Independent initial expansion, named heading/control, expanded state and controlled identity; control-driven collapse keeps focus on the control; programmatic collapse relocates descendant focus before hiding; hidden children are excluded from tab/browse interaction (`EXPERIENCE.md:28`, `174`).
- **Handle and non-drag alternative:** Named button, `aria-pressed` pinned selection distinct from effective `aria-expanded`, stable `aria-controls`, reveal on any row focus, retention while Move has focus, and tap/click/Enter/Space operation are explicit (`EXPERIENCE.md:102–103`, `177`, `181`). Search disables dragging, not the focusable reveal mechanism or source-adjacent Up/Down alternative.
- **Gesture discrimination and touch scroll:** Pending gesture does not reorder; recognized handle movement suppresses the synthetic click; outside-handle scrolling/text selection remains native; cancellation/lost capture/stale source/Search activation invalidates the transaction (`EXPERIENCE.md:178–180`). Numerical recognition thresholds and edge-scroll implementation remain legitimate implementation choices, not missing approved UX numbers. Resolve the blur interaction in A11Y-02 and preview feedback in A11Y-03.
- **History and identity:** Immutable query ID/source revision; duplicate preservation; changed valid drop creates one reorder entry; same-position, invalid, and cancelled drops create no reorder entry; no Path reorder (`EXPERIENCE.md:123`, `179`, `181`). Legitimate preceding Full URL closure remains a distinct accepted edit, not a second reorder.
- **Boundary focus:** Retain the activated enabled Move control; switch to the enabled opposite at a new boundary, otherwise row/first editable control; reveal before focus; impossible moves and one-item lists add no History/success (`EXPERIENCE.md:181`). Undo expands a nonfiltered collapsed target group before focus (`EXPERIENCE.md:168`).
- **Add with collapsed query/invalid Draft:** The jump expands/focuses without adding or clearing Search. Add appends after the full source list, explicitly clears Search, expands/mounts/focuses the new key, preserves invalid Full URL Draft exactly, and requires an existing valid session (`EXPERIENCE.md:175`, `252–255`, `283`). There is no need to reintroduce a top Add button.
- **Clipboard recovery and live validation:** Current/Last Valid exact-source Copy; selected, labeled, focused read-only recovery with native touch/AT copying; persistent errors with stable associations; IME suppression and repeat-announcement handling; separate validation/status/failure channels (`EXPERIENCE.md:109–113`, `147–152`, `183`). Preview delivery is the specific new gap, not an absence of all announcement rules.
- **Lossless scope/privacy:** Raw URL semantics, both editable Domain forms and isolation, unmanaged scheme/port/userinfo/Fragment, browser-local processing, unchanged invalid Draft, exact snapshots/Copy, and no off-device URL-content sink remain required. Error and navigation fixes must preserve them.

## Expected static-preview limitations and remaining release evidence

The mock expressly does not implement synchronized editing, Search, mutations, clipboard, dragging, real selection, live error/recovery states, or the 250+ dataset (`mockups/dark-workbench.html:159`). Its decorative aria-hidden 24/28px grips and historical “touch selection unresolved”/“pending approval” notes are already superseded and bounded by `DESIGN.md:186`, `216`, `EXPERIENCE.md:49`, and `reconcile-redesign.md:46–48`. They are **not** counted as new production contract failures. A11Y-05 instead concerns native list semantics that the static document actually attempts to provide.

The source supplies flexible columns, narrow stacking, wrapping, and external labels/actions. It does not prove rendered 320px/400% zoom behavior, particularly after widening handles, showing controls/errors, applying WCAG 1.4.12 spacing, or introducing return navigation. Those cases require later browser evidence. Likewise, touch recognition/scroll, edge scrolling, focus after DOM movement, live announcements, and native clipboard recovery require the recorded browser/AT matrix.

Reconciliation already blocks handoff on upstream Actions/grouped-list/drag/focus synchronization; that known gate is not duplicated as a new finding. Full-DOM accessibility at 250+ rows remains mandatory under architecture AD-7 (`_bmad-output/planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md:147–155`). Historical UX reviews and Chromium-only MVP evidence cannot validate this redesign, Safari/VoiceOver compatibility, additional browser/OS/mobile coverage, or manual WCAG conformance.
