# Approved dark-workbench redesign — reconciliation

Updated: 2026-10-09. Both UX spines are **final** following user approval, selected document reviews and contract corrections. No application delivery or fresh release evidence is claimed. The proactive coverage walk below records the initial draft; the current findings and dispositions are in [validation-report.md](validation-report.md).

## Approved superseding decisions

Canonical evidence: `.memlog.md:27–32`, especially approval at line 31 and final handle/Add decisions at line 32. The supplied parent directions bound the behavioral distillation; the memlog was not changed.

| Decision captured | Superseded source and exact conflict |
|---|---|
| Dark navy surfaces; rounded panels/styled inputs; blue/violet/teal detail accents; existing system typography and meaningful space/hierarchy | Historical `DESIGN.md@HEAD:10–26,145–160`: light palette, dark excluded, no group color coding. Replaced only appearance, not capability or accessibility. |
| Full URL/Copy always outside disclosures; Copy beside textarea except narrow wrapping; Undo in the same panel | Historical `EXPERIENCE.md@HEAD:21–35,75,149,188`: separate Actions region and its tab/layout sequence. Historical `DESIGN.md@HEAD:196`: separate action-bar with Copy/Undo/pre-list Add. Architecture `../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md:361–362` still names Full URL/Actions/Structured View orchestration. |
| Three independent initially expanded body/Paths/query groups; body contains both existing editable Domain forms and passive unmanaged context | Historical `EXPERIENCE.md@HEAD:21–35`: undivided ordered collection. Architecture `../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md:151–154` still requires one semantic list. Group-specific lists need explicit synchronization while retaining full DOM, complete source order/IDs and one representation per piece. |
| Sole bottom-of-query Add button; top keyboard-accessible jump link expands query and focuses Add, never adds | Historical `EXPERIENCE.md@HEAD:80,86,137,149,203` and `DESIGN.md@HEAD:179,201`: duplicate pre-/after-list Add buttons. Explicit user override; do not retain the old top button. Architecture `../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md:258–260` already includes after-list Add focus but needs new disclosure/jump destinations. |
| Required primary query-handle drag; tap/keyboard selection and any row focus reveal Up/Down, retained while Move is focused | Historical `EXPERIENCE.md@HEAD:139`: drag was optional future supplementary behavior and Move controls were the primary action. Architecture `../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md:221–222,256–260` needs explicit gesture/drop/cancellation and reveal-before-focus realization, not pointer-down mutations. |

Historical citations above identify the committed pre-redesign files (`git show HEAD:<workspace-relative-path>`); their line numbers intentionally do not pretend to cite the rewritten draft. Unqualified upstream path/line citations refer to unchanged current sources.

## Preserved contracts and upstream gaps

- **PRD is compatible but underspecified for the new placement/disclosures/primary drag.** `../../prds/prd-bmad-training-2026-09-24/prd.md:239–258` requires bottom-source append, one Add/reorder History Entry, new-key focus and Up/Down alternative, not a top Add button or permanent Move visibility. Do not falsely label the PRD as requiring those older UX placements. Synchronize acceptance detail for the approved override without changing FR-8/FR-9 intent.
- **Scope:** PRD `prd.md:100–118,155–157,171–176,392–393` keeps Scheme/Fragment unmanaged; architecture `ARCHITECTURE-SPINE.md:53–62` preserves userinfo/port and other opaque lexemes. Body context is passive, not new editors, Search targets or history capabilities. Both editable Domain forms and IDN isolation/conversion remain under FR-3 and AD-4.
- **Integrity/history:** PRD `prd.md:310–319,328–340` and addendum `../../prds/prd-bmad-training-2026-09-24/addendum.md:68–87` retain exact serialization, ordered duplicate/empty/absent entries, native editing Undo and one committed user intent. Architecture AD-2–AD-6, AD-8 and AD-13 remain the lossless model, history, parse-race and exact-source effect contracts; disclosure/selection/jump/drag previews do not enter URL History.
- **Invalid Draft/Add:** PRD `prd.md:281–290,507–513` explicitly preserves Last Valid and continued structured editing. Add stays enabled once a valid session exists, appends to Last Valid, clears Search with announcement and focuses the mounted key while Draft stays exact. One Add entry does not erase an independently required preceding Full URL close-and-rebase entry. Invalid Initial URL/no Last Valid means inactive Add, not a new session fabricated by Add.
- **Search/reorder:** PRD `prd.md:191–207,251–258` preserves filtering/source order but does not define filtered drag insertion. This draft uses the permitted conservative resolution: drag only with **Search empty/full source order**, no silent clearing or filtered-position mapping. Established Up/Down source/boundary/focus rules remain the non-drag alternative.
- **Privacy/accessibility:** PRD `prd.md:404–408,438–452`, architecture AD-7/AD-9/AD-12–AD-14, and the existing UX feedback/Undo/native editing rules remain intact. No persistence, telemetry, backend or service-worker scope is added. Chromium-only MVP evidence cannot establish the full later release browser/AT matrix.

`prd.md` / `ARCHITECTURE-SPINE.md` shorthand in the preserved-contract bullets refers to the fully qualified relative source paths in the conflict table; all upstream files remain unchanged.

## Proactive Pass 1 coverage walk (not a reviewer gate)

Executed directly against the configured design/experience examples, `references/design-md-spec.md`, `references/validate.md`, source requirements, revised frontmatter/tables and visual inventory. No reviewers or review artifacts were created.

| Category | Coverage / remaining gap |
|---|---|
| Flow coverage — strong | Source UJ-1 name preserved verbatim, Devon protagonist, numbered steps, climax and Copy failure. Devon invalid-Draft and IDN/high-density flows also have numbered steps, climaxes and failures. Every FR-1–FR-16 and NFR-1–NFR-17 retains an observable acceptance row in EXPERIENCE Key Flows; new presentation/drag/Add cases added. SM-1–SM-4 and counter-metrics remain upstream evaluation contracts, not invented journeys. |
| Token completeness — strong | All frontmatter color values are exact preview hexes; all `{colors.*}`, `{typography.*}`, `{rounded.*}`, `{spacing.*}` and `{components.*}` references resolve. Canonical DESIGN section order holds. Representative token-pair calculations: primary/panel 15.32:1, secondary/panel 9.48:1, action/ink 10.95:1, boundary/panel 3.60:1, focus/canvas 13.50:1. These are token calculations, not rendered-state/application checks. Spine-only validation reuses approved palette with explicit text, not a newly approved error hue. |
| Component coverage — strong | 22 canonical visual rows match 22 behavioral rows and frontmatter component identities. Handle, disclosure, Move, Remove, destination indicator, Add jump and external committed-state banner all have actual rules. |
| State coverage — strong as specification | IA covers Workbench, Full URL, Structured View, body, Paths, query and external feedback. No session/cold intake, valid/invalid Initial/Draft/field, parsing, error/recovery, focus/selection, empty/no-match, collapse, drag/drop/cancel, offline/clipboard denied, reload, reduced motion and forced colors are specified. Existing source acceptance tables preserved. |
| Visual reference coverage — adequate; known spine-only gaps | Sole keeper `mockups/dark-workbench.html` linked inline in both spines, with illustrated states named; no orphan imports/wireframes. `.working/` original retained as discovery audit trail. Valid desktop/narrow composition and native disclosure collapse are mocked. Error/parse/empty/filter, live conversion, recovery, drag destination/cancellation, actual selection, dense jump/focus and touch behavior are spine-only, not validated by this static HTML. |

### Parent gate items / blockers

1. **Upstream synchronization blocks implementation handoff:** remove obsolete Actions/top-Add/optional-drag wording, reconcile AD-7 single-list wording with grouped disclosures, add handle/drop focus intents and presentation-state ownership, and map new acceptance/evidence identities deliberately. Do not silently change these sources in this documentation-only step.
2. **Filtered drag ambiguity resolved within the bound:** Search-empty-only drag is explicit in EXPERIENCE Interaction Primitives. If filtered drag is desired later, obtain a separate full-source destination rule; this draft does not invent one.
3. **Touch handle semantics specified, evidence pending:** named toggle with `aria-pressed` selection, effective `aria-expanded`, focus-within reveal, complete keyboard alternative, target ≥44px, tap-vs-drag click suppression, handle-only gesture capture and outside-handle scrolling. Numerical gesture threshold/library and edge-scroll implementation remain technical choices; verify device/AT operability. The mock's aria-hidden 24/28px grip is deliberately not production semantics.
4. **Add during invalid Draft specified, evidence pending:** combine collapsed group, active Search, last-valid append, unchanged Draft, close-and-rebase ordering, mounted-key focus and Undo in one acceptance case. No unresolved enable/disable policy is invented.
5. **Review/mocks remain bounded:** Breno selected rubric and accessibility reviews, and chose no additional state mockups. `review-rubric.md` and `review-accessibility.md` remain historical; current `review-redesign-*.md` and refreshed `validation-report.*` assess this redesign's documents, not application behavior.

## Artifact disposition

- Updated `DESIGN.md` and `EXPERIENCE.md`: final, updated 2026-10-09.
- Promoted `.working/direction-dark-workbench.html` to `mockups/dark-workbench.html` using exact file copy; byte equality checked. Original retained unchanged; stale “pending approval” notes explained in the spines.
- Initial distillation left memlog, approved original HTML, application, upstream sources, old review artifacts and unrelated dirty sprint-status untouched. Finalization subsequently appended decision-log events and refreshed the consolidated validation report; application/upstream sources and historical individual reviews remain unchanged.

## Review corrections and remaining handoff work

Current rubric/accessibility findings are addressed in the final contracts: ordinary blur-close versus navigation/drag History, Search-hidden error recovery, display-label refresh versus immutable IDs, absent/empty query shapes using existing parser defaults, persistent non-live operation feedback, transaction-bound drag announcements, bounded keyboard return links and markerless-list semantics. Structure/prose polish preserves the acceptance table and turns interaction rules into navigable subsections. No further visual direction was introduced.

The approved static mock remains byte-for-byte unchanged; final contract deltas such as return links and explicit markerless-list roles govern implementation even when absent from the audit mock. These states are spine-only by user choice. Review snapshots are not independent re-reviews of the corrected contracts or evidence of application execution.

Story 4.1 synchronizes architecture orchestration/list/focus ownership and the
canonical SPEC's dark exclusion: the workbench has two named sections, ordinary
blur retains an accepted edit, grouped complete DOM lists are permitted, and
later presentation/gesture focus contracts are explicit. Fixed dark appearance
does not introduce theme switching. Cancellation means no reorder was saved;
it does not erase an ordinary preceding accepted Full URL blur-close entry.
This qualifies the experience spine's generic “History is unchanged” cancellation
copy for the later drag implementation. The conflict table and review snapshots
above remain historical; they do not prove current execution.

Story 4.1 implements dark styling and contextual Copy/Undo only. It retains the
single list, duplicate Add buttons and permanent Move controls. Disclosures,
sole-bottom Add/navigation, query shape descriptions, Move reveal, primary drag
and feedback redesign remain Stories 4.2–4.6. Reviewed Story 4.1 mappings and fresh
Chromium execution are required separately from this handoff reconciliation.
Preserve exact URL/Copy/Undo semantics, browser-local privacy and existing
browser-evidence boundaries. The historical PRD Decision Summary's invalid-Draft
choice is already resolved by its journey and final UX contract; do not reopen
or silently reverse it.
