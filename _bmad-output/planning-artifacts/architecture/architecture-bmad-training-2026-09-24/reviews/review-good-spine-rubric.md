# Architecture Reviewer Gate — Good-Spine Rubric Walk

**Artifact:** `ARCHITECTURE-SPINE.md`
**Review date:** 2026-09-24
**Mode:** Validate only; the spine was not edited.

## Gate verdict

**Not ready for implementation handoff.** The spine is mechanically sound and
strong on session authority, lossless serialization, history, deployment
shape, and full-DOM accessibility, but it does not yet close every real
feature-altitude divergence. Two adopted rules claim stronger guarantees than
their enforceable contracts provide, several source-defined interaction/effect
capabilities are only nominally mapped, and the operational envelope is partly
silent.

**Finding counts:** critical 0 · high 5 · medium 4 · low 0.

## High findings

### H1 — AD-3 cannot enforce byte preservation without an editor representation contract

- **Location:** AD-3 — One component-text codec
- **Rubric failure:** Every AD Rule must be enforceable and prevent its stated
  divergence.
- **Trigger:** The Rule requires existing percent triplets to remain
  byte-for-byte while newly entered delimiters and Unicode are encoded once,
  but it never decides whether Managed Piece fields expose raw encoded text,
  decoded text, or a token-aware projection. It also does not decide how a
  newly typed `%2F`, literal `%`, `+`, or edit spanning an existing triplet is
  interpreted.
- **Why the Rule is insufficient:** A shared codec alone cannot distinguish
  preserved source bytes from newly authored equivalent text after an
  arbitrary field edit. Implementations can comply with the words while using
  incompatible raw-editor, decode/re-encode, or text-diff strategies. That
  reintroduces the exact double-encoding and untouched-byte divergence named
  under **Prevents**.
- **Required disposition:** **Discuss**, then amend the Rule. Decide the field
  representation and edit algorithm, including valid-triplet provenance,
  literal-percent behavior, `+` behavior, malformed-triplet correction, and
  selection/paste replacement across token boundaries.

### H2 — AD-5 does not define identity reconciliation after a Full URL reparse

- **Location:** AD-5 — Snapshot history owns identity
- **Rubric failure:** Every AD Rule must actually prevent its stated divergence.
- **Trigger:** Full URL edits can replace or reorder many pieces at once, but
  the Rule says only that snapshots contain immutable IDs and IDs are never
  recycled. It does not say which IDs survive reparsing, how duplicates are
  matched, or when a piece receives a new ID.
- **Why the Rule is insufficient:** Different parsers can reconcile by index,
  content, occurrence, longest-common-subsequence, or complete replacement.
  Each satisfies “immutable” and “never recycled,” yet duplicate rows can still
  swap logical identity and counterpart-change/focus behavior can differ.
- **Required disposition:** **Discuss**, then amend the Rule with a deterministic
  identity reconciliation policy for Full URL commits, including duplicates,
  insertions, removals, reorder-only changes, and Undo restoration.

### H3 — Source-defined feedback, clipboard recovery, and focus/keyboard contracts lack a governing invariant

- **Location:** Capability → Architecture Map; Structural Seed
  (`app/feedback`, `platform/clipboard`, `platform/focus`)
- **Rubric failure:** All source capabilities must be mapped, and real
  feature-altitude divergence points must be fixed.
- **Trigger:** The UX source defines separate validation, polite-status, and
  actionable-failure channels; deterministic queue/coalescing behavior;
  duplicate-announcement handling; exact safe-copy recovery; native-versus-
  product Undo guards; IME handling; pointer cancellation; and detailed
  post-mutation focus fallbacks. The spine names folders and broadly maps
  “Copy and feedback,” but AD-1, AD-5, and AD-9 do not bind these behaviors.
- **Consequence:** Independently built UI, feedback, clipboard, and focus units
  can drop or reorder announcements, focus different controls, intercept native
  Undo, normalize pasted input, or implement incompatible Clipboard API
  fallback while still satisfying every current AD.
- **Required disposition:** **Autofix candidate.** Add one enforceable
  interaction-effects invariant or expand existing ADs to assign ownership,
  ordering, and adapter contracts. Extend the capability map to the UX
  interaction primitives and failure paths rather than only FR/NFR ranges.

### H4 — AD-4 names TR46 but leaves the acceptance profile selectable

- **Location:** AD-4 — Deterministic dual IDN conversion
- **Rubric failure:** Every AD Rule must be enforceable and prevent its stated
  divergence.
- **Trigger:** `tr46` requires behavior-affecting options beyond
  `transitionalProcessing`, including bidi, joiner, hyphen, STD3 ASCII, DNS
  length, and invalid-Punycode handling. The Rule fixes only
  “non-transitional” and subsequent WHATWG validation.
- **Consequence:** Unicode and ASCII editors can still accept/reject different
  labels or return different display/error results depending on option defaults
  and call direction, contradicting the stated **Prevents** clause.
- **Required disposition:** **Autofix candidate.** Pin the complete conversion
  option profile, error mapping, Unicode normalization point, and exact
  `toASCII`/`toUnicode` success criteria in AD-4 or an executable contract it
  explicitly names.

### H5 — The operations dimension is silent, and provider deferral can change runtime guarantees

- **Location:** AD-10; Deferred — Static hosting/CDN provider and CI vendor
- **Rubric failure:** Every operational/environmental dimension must be
  decided, deferred, or explicitly open; Deferred must not hide divergence.
- **Trigger:** The spine decides static preview/production delivery and defers
  vendor selection, but does not decide or defer artifact promotion, atomic
  deployment, rollback, cache invalidation/versioning, security-header
  ownership, CSP verification, release evidence retention, uptime checks, or
  production incident handling. The provider row assumes the bundle and CSP
  contract remain unchanged without specifying how that is enforced.
- **Consequence:** Preview and production can serve different assets or
  headers, stale bundles can survive rollback, and a provider can silently
  weaken CSP or release-gate evidence while AD-10 still appears satisfied.
- **Required disposition:** **Discuss.** Decide a minimal provider-neutral
  operations contract, or explicitly defer each operational concern with
  measurable revisit/acceptance conditions. Vendor identity may remain
  deferred; runtime invariants may not.

## Medium findings

### M1 — Accepted but unmanaged authority components are not explicitly preserved

- **Location:** AD-2; Capability → Architecture Map
- **Rubric failure:** All source capabilities and semantic boundaries must be
  covered.
- **Trigger:** FR-1 accepts HTTP/HTTPS URLs with a non-empty host. That set can
  include credentials, ports, IPv4/IPv6 forms, and authority syntax that is
  neither a Managed Piece nor called out alongside Scheme and Fragment.
- **Consequence:** A Domain edit or unrelated structured mutation can preserve,
  canonicalize, reject, or drop these components differently across
  implementations.
- **Required disposition:** **Autofix candidate.** State the V1 acceptance and
  exact-preservation policy for every unmanaged authority subcomponent and add
  representative fixtures.

### M2 — AD-9’s CSP statement is narrower than its no-external-sink guarantee

- **Location:** AD-9 — URL content has no external sink
- **Rubric failure:** The Rule must enforce the divergence it claims to prevent.
- **Trigger:** `connect-src 'none'` blocks fetch/XHR/WebSocket-style connections
  but does not by itself constrain every browser exfiltration/resource channel,
  navigation, form submission, external asset, or base-URL behavior.
- **Consequence:** The document can be read as treating one CSP directive as a
  complete privacy boundary even though the stronger prohibition depends on
  code discipline and browser tests.
- **Required disposition:** **Autofix candidate.** Define the complete
  production resource/header policy (`default-src`, `form-action`, `base-uri`,
  `object-src`, worker policy, external assets/navigation as applicable) and
  keep the all-request browser assertion in AD-11.

### M3 — Worker escalation has no reproducible measurement contract

- **Location:** AD-8; Deferred — Web Worker parsing
- **Rubric failure:** Deferred decisions need objective revisit conditions that
  do not permit divergent interpretation.
- **Trigger:** “50 ms p95” is not tied to a named fixture set, browser build,
  reference machine, warm-up/run count, measurement boundary, or production
  build mode.
- **Consequence:** Teams can reach opposite worker decisions from incomparable
  measurements while both claim to satisfy the revisit condition.
- **Required disposition:** **Autofix candidate.** Point the threshold to a
  versioned benchmark procedure and the capacity corpus.

### M4 — Current-technology verification is almost complete, but not fully current or reproducibly pinned

- **Location:** Stack
- **Rubric failure:** Named technology must be verified-current.
- **Evidence checked on 2026-09-24:** npm `latest` matched React/React DOM
  19.3.0, Vite 8.3.1, TypeScript 7.0.2, `tr46` 6.0.0, Vitest 5.0.1, Testing
  Library React 16.3.3, Playwright 1.63.0, and axe-core 4.13.0. Node’s official
  release page listed Node 24 as LTS, latest v24.21.0. npm listed pnpm 12.6.0 as
  latest; 12.5.1 exists and matches the repository manifest but is no longer
  latest.
- **Consequence:** The “verified-current” claim is false for pnpm under a
  latest-version reading, and `Node.js 24 LTS` does not identify a reproducible
  patch/toolchain version.
- **Required disposition:** **Discuss.** Either define “current” as an approved
  supported pin and record the verification policy, or update pnpm and pin the
  Node patch. Keep the brownfield package-manager constraint explicit if
  intentional.

## AD enforceability walk

| AD | Judgment | Notes |
| --- | --- | --- |
| AD-1 | Pass with dependency on H3 | Sole reducer ownership and atomic publication are enforceable; effect-channel semantics remain outside the Rule. |
| AD-2 | Partial | Strong lossless-token boundary, but unmanaged authority coverage needs M1. |
| AD-3 | Fail | The codec goal is correct; the field/provenance contract needed to enforce it is absent (H1). |
| AD-4 | Partial | Package and high-level profile are fixed, but option-level acceptance remains divergent (H4). |
| AD-5 | Fail | Snapshot ownership is sound; identity reconciliation does not prevent duplicate identity drift after raw reparsing (H2). |
| AD-6 | Pass | Baseline close, structured mutation chronology, preserved Draft, and later rebase close the source’s central invalid-Draft branch. |
| AD-7 | Pass | V1 full DOM is unambiguous, and reopening requires evidence plus the UX equivalence matrix. |
| AD-8 | Partial | Synchronous publication and stale-generation rejection are clear; worker escalation is not reproducibly measured (M3). |
| AD-9 | Partial | The no-content rule is strong and testable, but the CSP enforcement statement is incomplete (M2). |
| AD-10 | Partial | Static environment invariance is decided; the operational mechanism that preserves it is absent (H5). |
| AD-11 | Partial | A shared executable corpus is a strong convergence mechanism, but it must add the authority, codec-edit, IDN-option, feedback, clipboard-recovery, focus, IME, and operations cases identified above. |

## Deferred walk

| Deferred item | Judgment |
| --- | --- |
| Static hosting/CDN provider and CI vendor | **Unsafe as written.** Vendor identity may remain deferred, but provider-neutral operational invariants are missing (H5). |
| Web Worker parsing | **Valid decision, weak trigger.** Same-core/complete-result constraints prevent semantic divergence; benchmark procedure is missing (M3). |
| Accessible virtualization | **Safe.** Full DOM remains binding, and the reopen condition imports the complete AG-3 equivalence gate. |
| Routing, SSR, server functions, API, persistence, telemetry, service workers | **Safe for V1.** Current ADs explicitly prohibit these paths; the row is a post-V1 boundary, not an undecided V1 choice. |
| Redo and bounded History retention | **Safe for V1.** Complete Undo and exact snapshots remain binding; bounded retention cannot be introduced unless the stated product/memory conflict is reopened. |

## Capability reconciliation

### Covered strongly

- FR-10–FR-14 and NFR-4–NFR-7: session authority, invalid-Draft
  close-and-rebase, exact History, and atomic snapshots.
- AG-1: WHATWG acceptance separated from lossless serialization, with exact
  token preservation and shared fixtures.
- AG-2: dual editable IDN forms, ASCII host validation, source-lexeme
  preservation, and edited-host serialization direction.
- AG-3: full semantic DOM in V1 and a strict evidence gate for any later
  virtualization.
- NFR-1–NFR-3: browser-local processing, no persistence, no content-bearing
  diagnostics or requests.
- NFR-8–NFR-10: capacity corpus, synchronous core, and worker escalation
  direction.

### Nominally mapped but not architecture-closed

- FR-3/FR-6: exact percent-edit behavior (H1) and unmanaged authority
  preservation (M1).
- FR-5/FR-10–FR-14: piece identity across complete Full URL reparses (H2).
- FR-15–FR-16 and NFR-13–NFR-16: clipboard failure recovery, feedback channel
  ordering, duplicate announcements, focus fallback, native Undo exclusion,
  IME, and pointer cancellation (H3).
- NFR-11: the browser matrix is named as a release gate, but release evidence
  ownership and retention are part of the missing operations contract (H5).

## Structural and environmental dimension walk

| Dimension | Status |
| --- | --- |
| Paradigm and dependency direction | Decided |
| Module boundaries and state ownership | Decided |
| URL data/serialization model | Decided, with H1 and M1 gaps |
| Identity and History | Decided, with H2 gap |
| Error/result conventions | Decided |
| Browser effects | Structurally located; behavioral contract incomplete (H3) |
| Accessibility representation | Decided |
| Concurrency/parsing | Decided; escalation measurement incomplete (M3) |
| Privacy, storage, telemetry, network | Decided; CSP enforcement incomplete (M2) |
| Build/runtime configuration | Decided as one immutable client bundle with no runtime branches |
| Deployment and environments | Decided at model level |
| Infrastructure/provider strategy | Deferred |
| CI vendor | Deferred |
| Operations, promotion, rollback, caching, header ownership, release evidence | **Silent (H5)** |
| Test strategy and acceptance corpus | Decided; corpus coverage additions required |
| Routing/backend/API/persistence/service worker | Explicitly excluded/deferred |

## Brownfield and inheritance check

No parent architecture spine is declared, so there is no inherited-AD conflict
to evaluate. The repository contains a minimal package manifest and lockfile,
not an existing application architecture. The spine ratifies the existing
pnpm 12.5.1 package-manager pin rather than contradicting implemented product
code. The brownfield criterion therefore passes, subject to the
verified-current qualification in M4.

## Mechanical and technology evidence

- `lint_spine.py`: **pass**, zero findings.
- No placeholders, duplicate AD IDs, missing Binds/Prevents/Rule fields, or
  mechanically unpinned npm package rows were reported.
- Package versions were checked against npm registry `latest` endpoints.
- Node status was checked against the official Node.js release page.

## Gate exit conditions

The gate can pass after:

1. AD-3 fixes the raw/decoded/provenance and literal-percent editing contract.
2. AD-5 fixes deterministic identity reconciliation for complete reparses.
3. Feedback, clipboard recovery, focus, native Undo, IME, and pointer
   cancellation gain an owned, enforceable architecture contract and mapping.
4. AD-4 pins the complete TR46 option/error profile.
5. The operational/environmental envelope is decided or explicitly deferred
   without relying on provider choice to preserve unspecified invariants.
6. M1–M4 are resolved or explicitly accepted as open items with owners and
   release-blocking criteria.
