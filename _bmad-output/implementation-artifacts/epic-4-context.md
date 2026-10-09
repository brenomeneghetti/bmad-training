# Epic 4 Context: Edit URLs in a Clear, Polished Workbench

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver the approved dark workbench with contextual Copy, independent disclosures, one bottom query Add and accessible query dragging. Build on delivered Epics 1–3 without weakening exact URL/Draft/History/Undo/Copy integrity or browser-local privacy. Finalized DESIGN.md and EXPERIENCE.md govern; the mockup is a visual anchor, not execution proof. This epic delivers a Chromium MVP, not release readiness.

## Stories

- Story 4.1: Use a Polished Dark Workbench with Contextual Copy
- Story 4.2: Show or Hide URL Details Without Losing Context
- Story 4.3: Add at the Bottom and Navigate Long Query Lists
- Story 4.4: Distinguish Query Shapes and Changing Row Labels
- Story 4.5: Reveal Query Move Controls Through Focus or Selection
- Story 4.6: Drag Query Parameters Without Losing Exact State
- Story 4.7: Complete the Redesigned Journey at Supported Limits

## Requirements & Constraints

- Preserve HTTP/HTTPS intake, lossless duplicates, absent/empty values, encoded delimiters, untouched bytes, dual IDN editing, Search and exact Undo to Initial URL. Invalid Draft/rejected field text stays correctable; operations use Current/Last Valid.
- Keep URL/Draft/clipboard/History browser-local: no network sinks, persistence, telemetry or content-bearing diagnostics. Reload/close clears session/feedback. Preserve static delivery/CSP including `connect-src 'none'`; loaded offline use adds no service-worker/cold-load guarantee.
- Support 20,000 characters and 250+ queries, using existing 260-entry fixtures. Parse targets one second; interactions 100 ms on recorded four-logical-core/8-GB hardware; no omission, freezing or blocking overflow.
- Preserve WCAG 2.2 AA, keyboard alternatives, native editing/IME, 320px reflow and 400% zoom. Verify contrast, forced colors, text spacing, targets and unobscured focus; viewport simulation is not real zoom.
- Retain the existing React/TypeScript/Vite application, native HTML and CSS Modules. No new production dependency, component library, external font, theme switcher, icon system, Path reorder, equals-presence toggle or unmanaged-piece editor.
- Each story owns fresh execution-bound Chromium evidence and reviewed exact inventory/coverage mappings. Counts, source references, old manifests and mocks are not execution proof; mandatory mapped cells must pass.

## Technical Decisions

- Retain inward Functional Core / Imperative Shell boundaries. One immutable reducer owns snapshots, lossless model, Draft/local drafts, History and effects; components/adapters cannot independently mutate URLs. Preserve scanner/codec, adopted TR46 and exact-token identity reconciliation.
- Use opaque, immutable, non-recycled piece IDs, never visible indexes or labels, for mutations, focus and errors. Refresh ordinals, totals and duplicate membership from the current model; filtered positions belong to each group's result list.
- Ordinary Full URL blur/Enter or a subsequent mutation closes at most one accepted baseline-to-last-valid entry. Structured operations then append independently; later Draft correction rebases on latest Last Valid. Disclosure, selection, navigation and previews create no entries themselves, but cannot erase a legitimate preceding blur-close.
- Copy captures exact `snapshot.serialized`; preserve serial revisioned effects, acknowledgements, stale cancellation, bounded outcomes and attempt fencing. Recovery selects the exact attempted Current/Last Valid value outside disclosures.
- Define disclosure, pinned selection and drag ownership separately from snapshots/History. Capture source ID/revision after ordinary focus processing; validate changed drop before one reducer reorder. Threshold/edge-scroll mechanics remain choices requiring tests, not approved numbers.
- **Required handoff reconciliation, not completed architecture work:** align ordinary blur closure, single-list wording versus grouped full DOM, completed pointer/drop activation, presentation-aware focus/feedback and the structural seed's Actions landmark versus the approved two-section Workbench. Preserve parser/IDN/History decisions. Canonical SPEC.md still excludes dark mode and needs explicit reconciliation with the approved dark identity; do not infer a theme toggle. EXPERIENCE's generic cancellation wording that History is unchanged conflicts with retained blur-close entries: cancellation must state that no reorder was saved.

## UX & Interaction Patterns

- Apply exact dark tokens: 14 colors, eight typography roles, 10px/16px radii, 22 component groups. System sans/monospace, blue/violet/teal group accents, tonal boundaries; no grids, gradients, shadows or mock annotation rail. Bidi-isolate URL/IDN without truncation.
- One main contains Full URL then Structured View. The labeled wrapping textarea is at least 100px; Copy sits alongside above 700px and may wrap at 320–700px; Undo remains below in that panel. Use 3px focus outline/offset, system-color fallback, 7:1 main reading, 4.5:1 normal text and 3:1 functional boundaries/focus; 24px minimum/spacing exception, 44px control targets and 52px disclosure headings.
- Body, Paths and queries begin independently expanded. Complete native grouped lists represent every expanded piece once, without virtualization. Passive scheme/present port/userinfo/Fragment are not editors/Search targets. Search preserves disclosure/source order; collapsed headers show matches.
- Keep committed-state explanations, errors, safe-copy and feedback outside disclosures. Expand/render allowed destinations before focus; relocate descendant focus before collapse. Error-summary actions explicitly clear Search only if required; Undo retains Search and filtered fallbacks.
- Top Add jump expands/focuses the sole bottom Add without adding or clearing Search. Accepted Add clears Search, appends after the full source query list, expands and focuses the new key; no valid session means inactive Add. Deep-row/bottom return links reach Full URL/Copy and Search.
- Distinguish `flag`, `flag=`, empty entry and `=`; retain empty-key/absent-equals/empty-value Add defaults. Handle tap/keyboard pins selection; row focus/selection reveals Up/Down without hiding focused controls. Moves use full-source boundaries when filtered.
- Handle-only query drag requires empty Search; never silently clear it. Changed valid drop owns one reorder and moved-handle focus; no-op, stale, outside, Escape/lost-capture/cancel owns none. Preserve outside-handle scrolling, suppress post-drag clicks and invalidate transaction-bound 300ms preview feedback before final outcomes.
- Preserve separate validation, polite FIFO/coalescing and actionable-failure channels. Overflow outcomes appear once in chronological non-live “Operation feedback,” distinct from Undo History; static cues and literal source-aware messages do not steal focus.

## Cross-Story Dependencies

Epics 1–3 are the delivered substrate. Stories 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 stage visual/contextual Copy, disclosures, Add/navigation, shape/labels/feedback, selection/Move reveal, then working drag. Do not advertise later capabilities early: 4.5's handle reveals controls but does not establish drag. Story 4.7 integrates the delivered journey and supported limits; it is not deferred acceptance for earlier stories, which must already prove their own changed behavior.

Complete upstream reconciliation before implementation handoff. Epic 5 retains deferred Firefox/WebKit prerequisites, latest-two-major released-browser Windows/macOS/mobile and manual native clipboard/IME, screen-reader, real-zoom and representative-user release observations. Chromium MVP completion neither proves these nor waives unchanged release gates.
