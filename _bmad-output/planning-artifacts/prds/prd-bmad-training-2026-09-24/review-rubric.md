# PRD Quality Review — URL Piece Management

## Overall verdict

The PRD has a coherent product thesis, unusually concrete integrity requirements, and a disciplined V1 boundary. It is **not yet fully decision-ready for implementation**, because several choices that determine observable URL behavior are deferred to the addendum as architecture prompts, while the Full URL commit/history model and support boundary remain ambiguous enough for UX, engineering, and QA to implement different products.

## Decision-readiness — thin

The document makes several meaningful product decisions clearly: V1 is a standalone, browser-local, desktop-first web tool; it accepts Absolute URLs; it manages Domain, Path Segments, and Query Parameters; it preserves Fragments without making them structured pieces; and it includes Undo but not Redo (§§2.2, 5, 6). These choices give a decision-maker a real boundary rather than a neutral list of possibilities.

The weakness is that decisions central to the product's promise are presented as downstream technical questions. The addendum asks architecture to decide “whether the WHATWG URL parser is the canonical acceptance boundary,” how `?key` differs from `?key=`, when percent encoding may normalize, and how invalid percent sequences behave. Those choices determine what FR-1 calls a supported URL and whether FR-3's promise to preserve semantics is met; they are product acceptance decisions, not merely implementation details. Similarly, the History Model Decision Prompt delegates the coalescing boundary even though stepwise, predictable Undo is part of the product's differentiation.

### Findings

- **high** Product semantics are deferred as architecture prompts (Addendum, “Standards and Semantic Decisions for Architecture”) — Acceptance boundaries, query-entry distinctions, normalization rules, and invalid-percent behavior determine user-visible validity and round-trip behavior. Leaving all of them open permits incompatible implementations that could each claim compliance with FR-1 and FR-3. *Fix:* Resolve the user-visible semantic decisions in the PRD, or promote each unresolved choice to a numbered Open Question with an owner, decision deadline, and the FR/NFR blocked by it; leave only mechanism choices in the addendum.
- **high** Full URL commit and history boundaries are unresolved (§4.4 FR-10; Addendum, “History Model Decision Prompt”) — The PRD says every syntactically valid Full URL edit updates pieces “immediately,” a paste/replace is one mutation, and an “uninterrupted Full URL editing session” is coalesced into one mutation, but never defines when that session begins, ends, or commits. This is a product interaction decision with direct Undo consequences. *Fix:* Define observable commit boundaries for typing, paste/replace, blur, Enter, idle periods, and transitions between raw and structured editing, including how native text Undo interacts with product-level URL Undo.
- **medium** The two explicit Open Questions have no disposition path (§10) — IDN presentation affects FR-3 and browser/hardware scope affects NFR-10, yet neither has an owner, decision criterion, or point by which it must close. *Fix:* Add owner, decision criterion, and “must resolve before” milestone for each question.

## Substance over theater — strong

The content is earned. The single named protagonist, Devon, carries the exact context needed to understand the editing loop without expanding into persona furniture (§2.3). The Vision is specific to opaque URL manipulation, reversible changes, raw/structured synchronization, and local processing (§1); it could not be transplanted unchanged into a generic developer utility.

The NFRs are product-specific rather than boilerplate. They prohibit URL leakage through analytics and crash reports, require exact restoration rather than merely equivalent canonicalization, name supported capacity, and attach response targets (§7). The addendum's landscape evidence also keeps differentiation claims narrow: it explicitly calls parsing and basic query editing table stakes and describes the absence finding as time-boxed rather than universal.

### Findings

- **low** “Browser-local processing” is described as both part of differentiation and “expected trust hygiene” (§1; Addendum, “Landscape Evidence”) — The main PRD groups it with distinguishing capabilities, while the evidence correctly says it is expected rather than differentiating. *Fix:* Present local-only processing consistently as a trust requirement; reserve differentiation language for synchronization, Undo, search, and ordering.

## Strategic coherence — adequate

The thesis is coherent: developers need a trustworthy loop for understanding and precisely changing complex URLs without divergence, accidental collateral edits, or loss of the original (§1). The feature sequence supports that loop from intake, through finding and editing, to synchronization, reversal, and copy (§4). The V1 exclusions reinforce the same experience focus rather than expanding into accounts, collaboration, requests, or batch tooling (§§5–6).

The success metrics mostly validate the thesis rather than activity. Task completion covers the core journey, integrity failures target the trust promise, capacity verifies the large-URL case, and the counter-metrics guard against achieving clean metrics through over-rejection or destructive simplification (§8). However, the primary usability threshold is not statistically or operationally coherent as written.

### Findings

- **medium** SM-1's threshold cannot meaningfully be measured with its stated sample (§8, SM-1) — “At least 90% of 5–8” participants effectively requires 100% completion because one failure drops every allowed sample below 90%. The metric also omits a task-time or error/recovery boundary, so a participant can complete only after substantial struggle and still count as success. *Fix:* Either enlarge the sample enough for a 90% threshold to be meaningful or state an integer pass rule for a formative study; define assistance, terminal failure, time boundary, and whether successful error recovery counts.
- **medium** The differentiation thesis has no direct validation measure (§§1, 8) — SM-1 validates completion and SM-2 validates integrity, but neither tests whether cross-piece search, ordering, and Undo materially improve the workflow relative to manual editing or a baseline tool. *Fix:* Add a modest comparative or qualitative measure tied to the claimed experience advantage, or explicitly state that V1 success validates safe operability rather than market differentiation.

## Done-ness clarity — thin

Every FR has testable consequences, and many are notably precise: duplicate keys remain separate, invalid drafts cannot displace the Last Valid URL, removal preserves sibling duplicates, and complete Undo restores original serialization (§4). Privacy, accessibility, capacity, and atomicity also have concrete requirements (§7). This gives story creation and acceptance testing a much stronger base than a typical feature list.

Several foundational terms nevertheless stop short of executable acceptance rules. FR-1 relies on “supported scheme” without naming the schemes. FR-10 and FR-11 do not define the valid/committed transition. FR-8 qualifies empty-versus-absent preservation with “when the URL representation supports that distinction,” although the addendum confirms this distinction is unresolved. NFR-9 uses “browser freezing” and blocked layout overflow without a measurement procedure, and NFR-10 depends on undefined “representative supported hardware.” NFR-14 says the product “should” meet WCAG 2.2 AA, weakening an otherwise testable release requirement.

### Findings

- **high** URL acceptance and round-trip conformance lack a normative boundary (§4.1 FR-1 and FR-3; §7.2 NFR-6–NFR-7) — “Supported scheme,” “standards-based URL parser,” “without changing their meaning,” and “represented safely” do not identify which inputs must be accepted, rejected, normalized, or byte-preserved. QA cannot derive a complete oracle, especially for uncommon schemes, malformed percent sequences, IDNs, and alternate serializations. *Fix:* Define the supported schemes and a normative acceptance/serialization policy, then provide conformance categories or fixtures for exact preservation, permitted normalization, and rejection.
- **high** Valid Full URL text is not given a deterministic commit rule (§4.4 FR-10–FR-12) — “Every syntactically valid Full URL edit” updates immediately, but the Last Valid URL remains until a draft is “valid and committed”; the PRD does not explain whether validity itself commits, or whether a separate user event does. This affects Current URL, Copy, Structured View, and History simultaneously. *Fix:* Specify a state transition table for Draft URL → Current URL, including the triggering events and expected Copy/History behavior in each state.
- **medium** Performance and capacity verification is not reproducible (§7.3 NFR-8–NFR-10; §10.2) — The numeric targets are useful, but the browser matrix, hardware baseline, dataset shape, measurement point, and percentile/run method are unspecified. The open question acknowledges the gap but leaves the release gate indeterminate. *Fix:* Define a minimum browser/hardware profile and fixture suite, plus the measurement method for the 100 ms and 1 second targets.
- **medium** Accessibility conformance is advisory rather than a release condition (§7.4 NFR-14) — “Should meet WCAG 2.2 AA” conflicts with the otherwise mandatory NFR phrasing and makes exceptions invisible. *Fix:* Change it to “must” for the scoped primary workflow, or list explicit excluded criteria and the rationale.
- **low** FR-8 conditionally preserves absent and empty values without defining the exception (§4.3 FR-8) — “When the URL representation supports that distinction” allows implementations to collapse `?key` and `?key=` without explaining when that is permitted. *Fix:* Decide the distinction for supported URLs and state it unconditionally, or identify the exact normalization rule.

## Scope honesty — thin

The PRD is candid about V1 omissions. Non-Goals and Out of Scope explicitly exclude collaboration, persistence, relative URLs, fragment-as-piece editing, mobile optimization, Redo, request execution, and adjacent-tool ambitions (§§5–6). The narrow primary user and non-user definitions also prevent the requirements from implying a general-purpose URL or API platform (§2).

The apparent low open-item count is misleading, however. Section 10 lists only two questions, while the addendum contains a larger cluster of unresolved choices that govern observable behavior and implementation acceptance. There are no `[ASSUMPTION]` or `[NOTE FOR PM]` markers, so a downstream reader cannot distinguish confirmed requirements from inferred or deferred behavior without comparing both documents closely.

### Findings

- **high** Open-item density is understated by moving product questions into the addendum (§10; Addendum, “Standards and Semantic Decisions for Architecture” and “History Model Decision Prompt”) — At least the parser boundary, serialization retention, query-entry model, percent normalization, invalid-percent handling, IDN display, Fragment preservation, typing coalescence, and native-versus-product Undo relationship remain undecided. Several block safe UX, architecture, and acceptance-test derivation. *Fix:* Create a consolidated PRD Open Questions/Deferred Decisions list with stable IDs, owners, blocked requirements, and resolution milestones; keep only non-user-visible implementation alternatives in the addendum.
- **medium** Desktop-first versus narrow-width usability has no explicit minimum (§6.2) — The product is not mobile-optimized but “should remain usable at narrow widths,” leaving designers and testers to infer the smallest supported viewport and which actions may degrade. *Fix:* State the minimum supported viewport or define the required narrow-width behaviors and permitted compromises.

## Downstream usability — adequate

The PRD is well structured for extraction. Glossary terms define the state model, FR-1 through FR-16 and NFR-1 through NFR-14 are contiguous and unique, and the single journey has a named protagonist with relevant context (§§2.3–4, 7). Feature descriptions identify their relationship to UJ-1, while Success Metrics cite the FRs and NFRs they validate (§8). The addendum appropriately carries evidence, fixture ideas, and architecture prompts outside the main capability narrative.

Downstream consumers can extract most stories and test cases cleanly, but the unresolved semantic and commit-state questions will cause divergence precisely at the architecture/UX/QA handoffs. The metrics-to-requirements references are useful but broad; no traceability matrix is needed, yet a few ranges include requirements that are only indirectly validated.

### Findings

- **medium** The state model lacks an explicit transition source for downstream UX and architecture (§3; §4.4; Addendum, “History Model Decision Prompt”) — Current URL, Last Valid URL, Draft URL, Committed Mutation, and History Entry are individually defined, but their transition triggers and invariants are distributed across several FRs and remain partly contradictory. *Fix:* Add a concise product-level state/transition table or invariant list without prescribing implementation.
- **low** SM-2 overstates what a finite evaluation can establish (§8, SM-2) — “Zero critical … failures” is a valid release observation, but it does not by itself validate all of FR-12 through FR-15 and NFR-4 through NFR-7 unless the acceptance suite explicitly covers each consequence and semantic fixture. *Fix:* Name the required acceptance-suite coverage or narrow the validation claim.

## Shape fit — strong

The capability-spec shape fits a focused, single-operator developer tool. One journey is enough to anchor the workflow without manufacturing multiple personas, and the bulk of the document appropriately sits in grouped capabilities, testable FR consequences, cross-cutting NFRs, and scope boundaries. The addendum separates research and mechanism prompts from the main PRD, which keeps the primary document readable.

The document is formal but not bloated for a tool whose key risk is state integrity. Its rigor is concentrated on the difficult parts—round-tripping, synchronization, Undo, privacy, and capacity—rather than spread evenly across generic template sections.

## Mechanical notes

- FR IDs are contiguous and unique from FR-1 through FR-16.
- NFR IDs are contiguous and unique from NFR-1 through NFR-14.
- Success Metric IDs are unique: SM-1 through SM-4 and SM-C1 through SM-C2.
- UJ-1 has a named protagonist, Devon, and no floating journeys are present.
- No inline `[ASSUMPTION]` or `[NOTE FOR PM]` markers exist, so there is no Assumptions Index roundtrip to verify; the absence is material because the addendum contains unresolved product decisions.
- Glossary capitalization is mostly consistent. “History” is occasionally used as an aggregate system concept while only “History Entry” is defined; defining “History” would remove minor ambiguity.
- The PRD says “domain-only” input is rejected (§4.1 FR-1), while the Glossary defines Domain as the host portion; this is understandable but could be phrased as “host-only input” to avoid overloading Domain.
- All cited local source paths in the addendum are relative and syntactically plausible; their contents were not required by this rubric walk.
