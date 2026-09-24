# PRD → Architecture Spine Reconciliation Review

**Reviewed:** finalized `prd.md`, finalized `addendum.md`, and
`ARCHITECTURE-SPINE.md` dated 2026-09-24.

## Verdict

**Not reconciled.** The spine captures the central lossless-model, snapshot,
privacy, IDN, capacity, and atomic-state direction well, but it silently closes
the PRD's only explicit product gate with an unapproved third behavior. That
behavior then depends on undefined rebase and history semantics. Several
testable PRD contracts are named only through broad `Binds` ranges or the
capability map and do not yet have an architectural rule, effect contract, or
release gate.

The spine should remain draft until the invalid-Draft interaction is returned
to product decision or explicitly approved, and the state/effect contracts
below are made deterministic.

## Reconciliation Matrix

| Source input | Spine disposition | Assessment |
| --- | --- | --- |
| Browser-local, no URL persistence or external content sink | AD-9, AD-10 | Landed; stronger deployment constraints are consistent with the PRD. |
| Lossless ordered query entries and untouched syntax | AD-2, AD-3 | Landed. |
| Exact snapshot Undo to the Initial URL | AD-5, AD-11 | Landed at the model level. |
| WHATWG acceptance boundary | AD-2 | Explicitly resolved as requested by the addendum. |
| Percent-octet casing and encoded delimiters | AD-2, AD-3 | Substantially landed. |
| Dual Unicode / ASCII-Punycode Domain | AD-4 | Model and conversion landed; verification presentation remains partial. |
| Fragment preservation | AD-2 | Landed. |
| Invalid Full URL Draft versus Structured View mutation | AD-6 | Contradicts the PRD's unresolved gate by adopting a third option. |
| Native text Undo versus product Undo | No governing rule | Missing. |
| Search behavior and nonmutation | AD-5, AD-7, AD-11 references | Partial; core matching and result-state contract is missing. |
| Deterministic focus outcomes | AD-5 | Partial; transport exists, required target-selection rules do not. |
| Copy/change feedback outcomes | Structural seed and Copy source convention | Partial; failure/status effect behavior is not governed. |
| Capacity, browser, accessibility, and human release evidence | AD-7, AD-8, AD-10, AD-11 | Partial; several numeric and manual gates are absent or drifted. |

## Findings

### 1. AD-6 silently decides the PRD's explicit unresolved product gate—and chooses neither offered option

- **Source:** PRD Decision Summary and §9 ask whether Structured View mutations
  are disabled during an invalid Draft or discard that Draft and restore the
  Last Valid URL.
- **Spine:** AD-6 says Structured View changes proceed while preserving the
  invalid Draft text.
- **Conflict:** This is a third behavior, not architecture-level elaboration of
  either approved alternative. It also changes UJ-1's observable interaction
  and the meaning of “before another product mutation begins” in FR-10.
- **Required reconciliation:** Mark this behavior as a semantic gate rather
  than `[ADOPTED]`, or record explicit product approval and update the PRD
  decision before treating AD-6 as binding.
- **Consequence:** Implementation can ship an interaction the finalized PRD
  explicitly says remains undecided.

### 2. “Rebases on that latest snapshot” does not define conflict, merge, serialization, or history behavior

- **Source:** FR-10–FR-14 require atomic synchronization, one mutation per
  continuous Full URL session, exact snapshots, and predictable stepwise Undo.
- **Spine:** AD-6 preserves an invalid raw Draft while structured mutations
  change the Last Valid snapshot, then says a later valid Full URL commit
  “rebases” on the latest snapshot.
- **Missing branches:** The spine does not say whether the repaired Full URL
  replaces the whole latest snapshot, merges only fields changed in the Draft,
  rejects conflicts, or warns before overwriting intervening structured
  changes. It also does not define the resulting history order or exact Undo
  sequence.
- **Required reconciliation:** Define a transition table for baseline, Draft,
  last accepted Full URL state, intervening structured mutations, final
  serialization, and history entries. If merge is intended, define component
  conflict detection; if replacement is intended, define disclosure and Undo.
- **Consequence:** A valid repaired Draft can silently erase structured work or
  create history that cannot restore user-observed states stepwise.

### 3. The native-text-Undo versus product-Undo routing rule did not land

- **Source:** FR-14 and the addendum require native Undo inside editable text
  fields and product Undo outside them.
- **Spine:** AD-5 defines snapshot history and focus intents, but no architecture
  rule owns keyboard routing, editable-target detection, composition state, or
  prevention of double handling.
- **Required reconciliation:** Assign shortcut routing to an `app` or
  `platform` boundary and state the precedence rule, including contenteditable,
  text inputs, textareas, IDN fields, Query fields, and Full URL editing.
- **Consequence:** `Ctrl/Cmd+Z` can mutate both local text and product history,
  or invoke the wrong Undo system depending on focus.

### 4. Product mutations other than Structured View edits remain undefined while a Full URL Draft is invalid

- **Source:** FR-10 closes a Full URL editing session “before another product
  mutation begins”; FR-11 preserves invalid Draft state; FR-14 and FR-15 remain
  available product actions.
- **Spine:** AD-6 specifies Structured View changes only. It does not define
  product Undo, accepting a new Initial URL, or any future URL-changing command
  while an invalid Draft is present. Copy is separately safe through the sole
  snapshot source, but the Draft's retention/cancellation state is still
  unspecified.
- **Required reconciliation:** Enumerate every command permitted during an
  invalid Draft and define whether it preserves, discards, blocks, or resolves
  the Draft before transition.
- **Consequence:** Reducer commands can implement inconsistent Draft lifecycle
  rules and produce surprising restoration behavior.

### 5. Search is mapped but its functional contract is not architecturally expressed

- **Source:** FR-4 requires case-insensitive matching across Domain, Path
  Segments, Query keys, and Query values; clear restores original order; no
  result has an explicit state; search creates no History Entry. FR-5 requires
  original positions to remain apparent.
- **Spine:** AD-5 says Search is not History, AD-7 keeps the full DOM, and AD-11
  mentions search fixtures. No rule defines normalization, which Domain form is
  searched, matching over encoded versus displayed text, filtered-order
  semantics, or the no-results state.
- **Required reconciliation:** Add a pure search/projection contract that
  preserves canonical piece identity and ordinal metadata without mutating the
  committed snapshot.
- **Consequence:** Browser/component implementations can disagree on what
  matches and can obscure duplicate identity or original position.

### 6. Focus-intent transport landed, but the PRD's deterministic target-selection rules did not

- **Source:** FR-7, FR-8, FR-14, NFR-13, and NFR-15 define exact focus outcomes
  after add, remove, and Undo, and prohibit routine feedback from stealing
  focus.
- **Spine:** AD-5 says transitions emit focus intents by Piece ID and the shell
  mounts before focusing. It does not encode “next else previous,” new Query
  key, affected logical item, nearest survivor, or Full URL fallback.
- **Required reconciliation:** Make focus-target selection part of each core
  transition result and add the required fallback ordering to AD-5/acceptance
  fixtures.
- **Consequence:** The adapter can execute focus correctly while the reducer
  chooses a target that violates the user-visible requirement.

### 7. Clipboard and change-feedback outcome contracts are only implied by folders

- **Source:** FR-15 requires explicit success/failure feedback and forbids
  presenting clipboard failure as success. FR-16 requires non-modal,
  counterpart-aware confirmation that does not steal focus. NFR-15 requires
  programmatic announcement.
- **Spine:** The Copy source is correctly fixed to `snapshot.serialized`, and
  the structural seed names clipboard and feedback modules. No adopted rule
  defines typed clipboard outcomes, status versus alert semantics, stale
  completion handling, or counterpart change indication.
- **Required reconciliation:** Define effect request/result contracts and the
  reducer/UI response for success, permission denial, unavailable Clipboard
  API, rejected promise, and superseded Copy requests; define non-focus-moving
  status intents for committed changes.
- **Consequence:** Copy integrity can be correct while the UI falsely reports
  success or announces the wrong operation.

### 8. Performance thresholds drift from the finalized release contract

- **Source:** NFR-10 sets a 100 ms local-interaction target and a 1 second
  initial-parse target on hardware with at least 4 logical cores and 8 GB RAM.
- **Spine:** AD-8 introduces a 50 ms p95 worker trigger without binding it to the
  PRD hardware or measurement method. The Deferred table retains the 100 ms
  interaction target but omits the 1 second initial-parse gate.
- **Required reconciliation:** Separate the internal worker-adoption trigger
  from release acceptance; retain both PRD thresholds, reference hardware,
  fixture shape, percentile/run method, and measurement boundaries in AD-11.
- **Consequence:** The implementation can meet its worker heuristic while
  failing the product's actual capacity release target, or vice versa.

### 9. Browser, responsive, and accessibility release evidence is under-specified

- **Source:** NFR-11 requires the latest two major versions of Chrome, Firefox,
  Edge, and Safari. NFR-16 requires automated and manual keyboard, focus, 200%
  zoom, contrast, and status-announcement testing. NFR-17 requires every V1
  action without horizontal page scrolling at 768 CSS pixels or greater.
- **Spine:** AD-10 calls an unspecified “browser matrix” a release gate; AD-7
  and AD-11 broadly bind accessibility and capacity but do not retain those
  concrete checks.
- **Required reconciliation:** Put the exact browser/version policy and manual
  accessibility/responsive matrix into the executable acceptance-corpus
  contract or a named companion gate.
- **Consequence:** A suite can claim coverage while omitting Safari versions,
  zoom/focus/status checks, or the 768 px no-horizontal-scroll requirement.

### 10. Product success metrics and representative-user release evidence are absent from the spine

- **Source:** The Decision Summary and SM-1/SM-2 require at least 90% unassisted
  completion by 5–8 representative developers and zero critical
  synchronization, Undo, or stale-Copy failures.
- **Spine:** Frontmatter binds UJ, FR, and NFR identifiers but no SM identifiers.
  AD-11 establishes automated acceptance evidence only; no human evaluation or
  zero-critical-failure release gate is named.
- **Required reconciliation:** Bind SM-1..SM-4 and counter-metrics to a release
  evidence section or named companion. Distinguish automated corpus gates from
  representative-user evidence.
- **Consequence:** Architecture can be declared complete and releasable without
  the finalized PRD's acceptance evidence.

### 11. Browser-accepted malformed percent sequences have a storage rule but no presentation/validation rule

- **Source:** The addendum explicitly asks architecture to decide how invalid
  percent sequences are presented when a browser parser accepts or normalizes
  them. FR-3 requires rejection with explanation when safe representation is
  impossible.
- **Spine:** AD-3 preserves an already accepted malformed sequence raw and
  editable until corrected, but does not state whether it is valid Current URL
  content, a warning state, an invalid field draft, or a blocked structured
  edit. It also does not define the user explanation.
- **Required reconciliation:** Classify malformed percent text at intake and
  per-field edit boundaries, define its Current/Last Valid status, and assign a
  stable `UrlProblem`/warning code plus safe message.
- **Consequence:** Different entry paths can accept, reject, or warn on the same
  URL and violate consistent synchronization semantics.

### 12. IDN conversion lands, but the addendum's homograph-verification intent is only partially operationalized

- **Source:** FR-3 and the addendum require both readable Unicode and
  ASCII/Punycode forms for verification and call out homograph-relevant
  verification.
- **Spine:** AD-4 mandates both bidi-isolated forms and avoids an invented
  rejection policy. It does not define persistent labels, simultaneous
  visibility during editing, mismatch/error association, or acceptance
  fixtures that demonstrate the verification affordance.
- **Required reconciliation:** Preserve the non-rejection policy, but bind the
  dual-form presentation and accessible labeling/error association to AD-4 and
  the shared corpus.
- **Consequence:** The conversion can be technically correct while the intended
  verification value is hidden, ambiguous, or inaccessible.

## Confirmed Alignments

- The custom raw-token model in AD-2 is consistent with the PRD's lossless
  ordered-entry semantics and avoids `URLSearchParams` canonicalization.
- AD-3 explicitly protects encoded delimiters, valid percent-triplet casing,
  and unrelated content from double encoding.
- AD-4 makes a concrete, standards-based IDN decision without narrowing
  standards-valid hosts merely to improve rejection metrics.
- AD-5's exact before/after snapshots and immutable Piece IDs support exact
  Undo, duplicate identity, and focus restoration.
- AD-7's full-DOM decision directly supports the 250+ entry accessibility
  requirement and correctly defers virtualization behind evidence.
- AD-9 and AD-10 preserve the browser-local, no-persistence boundary and add
  consistent CSP/service-worker safeguards.
- AD-11 is the correct architectural home for shared semantic fixtures; it
  needs expansion rather than replacement.

## Semantic Gates Remaining After Reconciliation

1. **Product approval:** choose one invalid-Draft/Structured View behavior.
   AD-6's preserve-and-rebase behavior must not be presumed approved.
2. **If preserve-and-rebase is approved:** define whole-URL replacement versus
   component merge, conflicts, disclosure, serialization precedence, and exact
   Undo sequence.
3. **Malformed percent policy:** decide whether browser-accepted malformed
   sequences are committed-valid, warning-valid, or invalid Draft content at
   each input boundary.
4. **IDN verification presentation:** define the minimum simultaneous,
   labeled, accessible dual-form affordance without adding a nonstandard domain
   rejection policy.

## Editorial Lens Result

No structural or prose edit is recommended as part of this reconciliation.
The spine is concise and scannable; the defects are missing or contradictory
decisions, not document shape. The requested remedy is architectural/product
reconciliation, not copy-editing.
