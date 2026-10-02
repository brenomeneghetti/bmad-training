---
title: 'Epic 1: Inspect URL Pieces Without Semantic Loss'
type: 'feature'
created: '2026-09-30'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '226aa975788573ae28ba0b13717cb63fda82d6bf'
context:
  - '{project-root}/_bmad-output/specs/spec-bmad-training/SPEC.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has planning artifacts but no application. Developers need a private browser workbench that accepts supported absolute URLs and exposes every managed piece, including both domain representations, without semantic loss.

**Approach:** Establish the specified React/Vite functional-core foundation, implement lossless read-only URL/session semantics and IDN conversion, then render the accessible complete Structured View with executable evidence.

## Boundaries & Constraints

**Always:** Treat WHATWG `URL` only as the HTTP/HTTPS acceptance and host oracle; preserve exact accepted serialization, duplicate/empty/absent query entries, encoded delimiters, separators, percent casing, fragments, order, and opaque non-recycled piece identity. Keep URL content browser-local. Follow the canonical visual, responsive, keyboard, feedback, privacy, capacity, and WCAG contracts. Use the pinned stack and one reducer-owned session authority.

**Never:** Use `URLSearchParams` or generic round-trip splitting, canonicalize untouched text, virtualize or omit rows, persist/transmit/log URL content, add a backend/service worker/telemetry/runtime environment branch, or implement Search, Epic 2 editing, or Epic 3 Undo/Copy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Supported intake | Complete HTTP(S) absolute URL with host | Exact snapshot and atomic Domain → Path → Query view | No partial publication |
| Unsupported intake | Relative, domain-only, non-HTTP(S), empty/invalid host, CR/LF | Preserve correctable text; do not create or replace a session | Specific associated inline validation |
| Lossless structure | Duplicates, `key`/`key=`, empty entries, encoded delimiters, fragment, unusual separators | Preserve every token, distinction, byte, ID, and source position | Malformed accepted percent text stays visible with a safe problem |
| IDN | Unicode/Punycode, bidi, deviation, invalid Punycode | Show validated Unicode and ASCII/Punycode forms with isolation | Reject invalid conversion without publishing a session |
| Capacity | URL up to 20,000 characters and 250+ parameters | Render every row once in source order within targets | No partial, stale, omitted, or virtualized rows |

</frozen-after-approval>

## Code Map

- `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig*.json`, `playwright.config.ts`, `index.html` -- replace the placeholder package with the pinned static React/Vite quality foundation, a dependency-compatible Node floor, browser bootstrap, and tested response-header CSP.
- `src/core/{contracts,url,idn,session}/` -- new pure contracts, scanner/serializer, TR46 conversion, immutable snapshots, reducer, stable IDs, and intake state.
- `src/app/{workbench,pieces,feedback}/` -- new semantic Full URL, Actions, Structured View, complete managed-piece list, and validation/status UI.
- `src/platform/{clipboard,effects,focus}/` -- architecture boundaries only; do not pre-implement later-epic behavior.
- `src/styles/` -- design tokens, focus, responsive/reflow, forced-colors, and reduced-motion rules.
- `src/test/fixtures/`, `tests/`, `evidence/`, `deployment/` -- one imported AG-1/AG-2/AG-3 corpus, instrumented unit/component/browser tests, provider-neutral response headers, and schema-validated evidence bound to a deterministic artifact tree.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize completed Stories 1.1–1.5 only.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, tool configs, `index.html`, `src/main.tsx` -- scaffold the pinned ESM React/Vite application, require a Node version accepted by every locked dependency, provide a clean-checkout Playwright browser bootstrap, and test the full CSP as a response header.
- [x] `src/core/contracts/`, `src/core/url/` -- implement typed problems, branded identity, lossless acceptance/scanning/serialization for every WHATWG-accepted HTTP(S) form, C0/C1 rejection, code-point source positions, exact query/path/fragment modeling, and goldens.
- [x] `src/core/idn/` -- implement TR46 6.0.0 conversion with adopted options and WHATWG host validation.
- [x] `src/core/session/` -- implement reducer-owned no-session/parsing/active/invalid-intake state; every edit invalidates pending publication, dirty input cannot announce success, and IDs remain immutable.
- [x] `src/app/`, `src/styles/` -- build the three-section accessible workbench, persistent valid skip targets, linear-time query labels, complete full-DOM rows, dual domain forms, design tokens, and responsive states.
- [x] `src/test/fixtures/`, tests, `evidence/`, `deployment/` -- import one shared corpus in every layer; instrument all URL-bearing diagnostics, network, storage, cache, and service-worker facilities; assert accessibility after forced-color/reduced-motion/text-spacing/zoom modes; validate the complete JSON Schema; and hash relative paths plus contents recursively with delivery metadata.

**Acceptance Criteria:**
- Given a fresh checkout on the declared Node floor, when dependencies and Playwright Chromium install and quality scripts run, then the pinned stack builds a provider-neutral static artifact whose preview response carries the required CSP, including effective `frame-ancestors`, with no prohibited sink.
- Given valid and invalid intake, when validation settles or Apply runs, then only supported HTTP(S) input atomically creates exact session state and rejected input never replaces trusted state.
- Given shared semantic, IDN, unusual-special-URL, astral-position, and capacity fixtures imported from one module, when core, component, and browser suites run, then all layers produce the same exact serialization, ordered pieces, stable identities, domain forms, and source positions.
- Given 250+ parameters at 20,000 characters, when the workbench renders, then every row remains reachable within targets and no partial or stale result publishes.
- Given keyboard, 320px/400%-equivalent zoom, text spacing, forced colors, reduced motion, and accessibility checks, when each mode is asserted after activation, then content remains perceivable and operable without page-level horizontal scrolling.
- Given reload plus monitored network/storage/console facilities, when a session ends, then no URL content persists or leaves the browser and the workbench returns to No session.

## Implementation Notes

- Implemented a static React/Vite workbench with browser-local reducer state, exact accepted serialization, lossless path/query scanning, TR46 domain forms, stale-publication guards, full-DOM rendering, and no persistence or application network sink.
- Review hardening added full WHATWG special-URL acceptance, immediate stale-publication invalidation, C1 rejection, Unicode code-point diagnostics, linear query labels, CSS Modules, response-header CSP delivery, shared browser fixtures, complete JSON Schema evaluation, and recursive path-aware artifact hashing.
- Verification passed on Node 24.13.1 with frozen install and browser bootstrap, 37 Vitest tests, 4 negative evidence-gate tests, and 4 serial Chromium Playwright journeys including transient privacy probes, exact CSP/referrer response inspection, post-mode axe/keyboard/clipping checks, 4× scale reflow, exact capacity order in 423 ms, the production build, and all 5 mandatory evidence cells.

## Spec Change Log

- Iteration 1 — Review found stale publication/status, an ineffective delayed indicator, rejected WHATWG-accepted syntax, quadratic labels, UTF-16 positions, ineffective framing protection, dependency-engine mismatch, non-shared fixtures, incomplete privacy/accessibility journeys, and evidence that did not execute its schema or bind artifact paths. The execution map, tasks, acceptance checks, design notes, and verification commands now require explicit guards and executable proof for each failure. Avoid the known-bad state in which passing tests and a digest can coexist with stale UI, unsupported accepted input, unenforced headers, drifted fixtures, or unverifiable evidence. KEEP exact serialization, explicit path/query scanners, TR46 validation, reducer authority, full-DOM rendering, CSS Modules, browser-local privacy boundaries, disabled deferred controls, provider-neutral delivery metadata, and artifact-bound evidence.

## Review Triage Log

| Verdict | Evidence and resolution |
| --- | --- |
| medium | The initial scanner treated a WHATWG-special backslash as authority text, omitting accepted path pieces. The scanner now preserves `/` and `\` separators explicitly and a golden covers mixed separators and trailing empties. |
| medium | WHATWG can strip tabs/control characters and surrounding whitespace before host parsing, which made the raw source and structured view disagree. Intake now rejects these unsafe forms with associated specific guidance and fixtures cover them. |
| medium | The evidence validator initially trusted hard-coded `pass` cells without inspecting referenced evidence or the built artifact. It now verifies evidence paths, required CSP directives, built assets, and reports an artifact digest. |
| low | Concrete clipboard and focus adapters crossed the architecture-only Epic 1 platform boundary, and Copy became enabled without behavior. Platform modules now expose ports only and all later-epic controls remain explicitly disabled. |
| medium | Browser privacy/accessibility evidence initially checked only an encoded URL substring and omitted console, IndexedDB, keyboard, text-spacing, forced-colors, and reduced-motion cases. The browser suite now covers those facilities and states. |
| high | Editing while a parse was pending left the completion publishable. `inputChanged` now advances the generation and clears pending input; reducer and component regressions cover it. |
| medium | Dirty editor text retained the active success phase. Input changes now enter an editing/no-session phase, preventing a stale “URL parsed” announcement. |
| medium | A zero-delay synchronous parse made the delayed busy indicator ineffective. The unused delayed indicator was removed; parsing remains synchronous and atomic as required. |
| medium | The scanner required literal `://`, rejecting WHATWG-accepted special URL forms. Authority discovery now supports accepted slash/backslash variants and has golden coverage. |
| medium | C1 control characters were not rejected. Intake now rejects U+007F–U+009F and fixtures include a C1 case. |
| medium | Query occurrence labels used repeated filtering and slicing. Labels are now precomputed in linear time. |
| medium | Malformed-percent positions counted UTF-16 code units. Positions now count Unicode code points and an astral-character regression covers the result. |
| low | The Structured View skip target was absent before a session. The link now renders only when its target exists. |
| medium | Browser tests duplicated the semantic and capacity fixtures. They now import the shared corpus used by core and component tests. |
| medium | `frame-ancestors` existed only in meta CSP. Vite preview and provider-neutral deployment metadata now deliver the full policy as an HTTP response header. |
| medium | The declared Node floor admitted versions below locked jsdom support. jsdom is now pinned to 29.0.1, whose engine supports the tested Node 24.13.1 and declared `>=24.0.0` floor. |
| medium | Evidence validation skipped command strings and only checked source-file existence. Command strings were removed as evidence, fixed cells are enforced, and evidence must reference durable paths. |
| medium | Evidence validation did not evaluate the declared schema. Draft 2020-12 validation now runs through Ajv with formats and strict manifest metadata. |
| medium | The artifact digest omitted relative paths and deployment metadata. It now recursively hashes paths plus contents and the delivery contract. |
| medium | CSP evidence checked only a subset of directives. Validation now checks the complete required policy in delivery metadata. |
| medium | Capacity evidence checked only row count and the final key. It now asserts every query key in exact source order. |
| medium | Forced-colors, reduced-motion, and text-spacing checks lacked post-activation operability/accessibility assertions. The browser suite now reruns axe and verifies focusable operation after activation. |
| medium | Specific intake branches were tested only as generic rejection. Parameterized tests now assert code and guidance, with a component-level line-break case. |
| medium | TR46 rejection was tested only inside the converter. A session test now proves invalid-domain replacement preserves the trusted snapshot. |
| false | A bare `?` was reported as an omitted empty query row. The model deliberately records `queryPresent` separately; no query parameter token exists after a bare delimiter. |
| false | Fragment omission from Managed Pieces was reported as a defect. Fragment is explicitly unmanaged and remains exactly visible in Full URL. |
| false | Path separator and raw host omission from separate row controls was reported as semantic loss. Both remain in the exact Full URL and lossless model; Managed Pieces are path segment text and the required validated dual domain forms. |
| high | VG-1: `inputChanged` left a pending generation and input valid, so a completion queued before an edit could publish a URL that no longer matched the editor. This was a reachable stale-publication failure. |
| medium | VG-2: The control-character predicate rejected C0 and DEL but not U+0080 through U+009F, so accepted input could retain hidden C1 controls contrary to the intake safety contract. |
| low | VG-3: The skip link was always rendered while `#managed-pieces` existed only after a session was published, so its initial target was absent. |
| medium | VG-4: `evidence/validate.mjs` read the schema but enforced only two constants and a subset of fields, allowing values that violated declared patterns and shape constraints. |
| medium | VG-5: Evidence links beginning with `pnpm ` were skipped without execution or a durable result artifact, so an unexecuted command could support a passing cell. |
| medium | VG-6: The digest concatenated HTML and immediate asset contents without relative paths or deployment metadata; a renamed or structurally different artifact could retain the same digest. |
| medium | VG-7: The fixed `html` minimum width was not exercised under a 400%-equivalent viewport and could force page-level overflow below a 320 CSS-pixel viewport. |
| medium | VG-8: `frame-ancestors` appeared only in a meta CSP, where browsers ignore it, and no delivered response-header configuration enforced the required framing policy. |
| medium | VG-9: The browser suite redeclared semantic and capacity fixtures instead of consuming the shared corpus, so cross-layer expected behavior could drift undetected. |
| medium | VG-10: The application permitted Node 24.0–24.14 and recorded 24.13.1 as tested while locked `jsdom@30.1.1` required Node 24.15 or newer, making the declared clean-install range unsupported. |
| high | BH-1: This independently confirmed VG-1: editing during a pending parse did not invalidate that completion, allowing stale trusted state to publish. |
| medium | BH-2: Editing after a successful parse left phase `active`, so the live region continued to say “URL parsed” while the editor contained unapplied text. |
| medium | BH-3: Parsing ran synchronously inside the zero-delay publication callback, blocking the event loop; the 150 ms indicator could not paint during the work it was intended to explain. |
| medium | BH-4: WHATWG accepted special HTTP(S) forms such as `https:////example.com`, but the scanner additionally required a literal `://`, violating the declared acceptance-oracle rule. |
| medium | BH-5: This independently confirmed VG-8: the meta policy could not enforce `frame-ancestors`, and the delivery metadata did not configure response headers. |
| medium | BH-6: This independently confirmed VG-4: the declared Draft 2020-12 schema was not actually evaluated, so malformed evidence metadata could pass. |
| medium | BH-7: The duplicate-story portion was disproved because a second cell failed the required mapping, but the same finding correctly identified that `pnpm` evidence links were skipped unverified. |
| medium | BH-8: This independently confirmed VG-6: digesting only content bytes omitted artifact paths and the delivery contract, so deployment-relevant changes could evade the digest. |
| medium | BH-9: Network capture was broad, but diagnostics inspected only selected substrings and storage was sampled only after the journey; transient writes, Cache Storage, and other URL-bearing values were not monitored. |
| medium | BH-10: Forced colors and reduced motion were enabled only after axe ran, no post-mode operability assertions existed, and 400%-equivalent zoom was absent despite the acceptance claim. |
| medium | BH-11: This independently confirmed VG-10: the declared and recorded Node versions did not satisfy the locked jsdom engine. |
| medium | BH-12: A clean checkout had no command that installed the Chromium binary required by `pnpm test:e2e`, so the documented verification path was not self-contained. |
| low | BH-13: This independently confirmed VG-3: the initial skip link pointed to an element that had not been rendered. |
| low | BH-14: The Epic 2 and Epic 3 deferred entries use `source_spec: none` even though both were split from the canonical specification, weakening traceability; replacing those values is a direct correction. |
| high | EC-1: This independently confirmed VG-1 and BH-1: a queued completion remained valid after the editor changed. |
| medium | EC-2: Query labels repeatedly filtered and sliced the full query array for every row, producing quadratic work that could freeze supported dense inputs. |
| medium | EC-3: Malformed-percent positions used UTF-16 indices, so an astral character before the error made the reported source character position too large. |
| low | EC-4: This independently confirmed VG-3 and BH-13: the skip target did not exist before a session. |
| false | EC-5: The duplicate-evidence claim was disproved: a second cell with the same fixed ID/story mapping is rejected. |
| medium | EC-6: This independently confirmed VG-4 and BH-6: schema patterns and complete shape constraints were not enforced. |
| medium | EC-7: This independently confirmed VG-8 and BH-5: framing protection was claimed but could not be delivered by the meta policy. |
| medium | R2-VG-1: The preview assertion used a substring, so `x-frame-ancestors 'none'` could pass while the browser ignored it. Exact response-header comparison is required. |
| medium | R2-VG-2: The evidence validator had no negative fixtures for schema, fixed-cell, CSP, evidence-path, or digest failures, allowing regressions in the release gate to go undetected. |
| medium | R2-VG-3: Post-spacing checks covered width, axe, and one button but did not detect clipped labels, help, status, or rows. Representative geometry must be asserted. |
| medium | R2-BH-1: The `>=24.0.0` engine range admitted Node 25 although locked Vitest excludes it; the application range must match all runtime constraints. |
| medium | R2-BH-2: `parseStarted` accepted stale or duplicate starts unconditionally, which could return settled state to `parsing` when a later completion failed its epoch/revision guard. |
| false | R2-BH-3: Canonical UX defines source position as stable ordinal and occurrence text, which the rendered labels provide; it does not require character-offset fields on every model piece. |
| false | R2-BH-4: Epic 1 serialization intentionally returns the preserved exact snapshot; model-based mutation serialization belongs to deferred Epic 2 and is not needed to prove lossless inspection. |
| medium | R2-BH-5: WHATWG rejected malformed Punycode before TR46 conversion, producing generic intake guidance instead of the required domain-conversion error. |
| low | R2-BH-6: Malformed-percent diagnostics were plain strings rather than typed component problems, weakening the typed-problem invariant and future association logic. |
| medium | R2-BH-7: Domain controls set left-to-right direction but lacked the explicit bidi-isolation styling required by the canonical design contract. |
| medium | R2-BH-8: The results skip link sat immediately before its target inside Structured View, so it did not bypass the preceding Full URL and Actions controls. |
| low | R2-BH-9: Hundreds of read-only fields create many optional tab stops, but all later major actions precede the list and removing focus would block keyboard selection; the claimed everyday harm does not justify that tradeoff in inspection-only scope. |
| low | R2-BH-10: Preview omitted the `Referrer-Policy` declared by the provider-neutral delivery contract, allowing tested and declared response headers to diverge. |
| false | R2-BH-11: The architecture explicitly defers provider selection; the JSON is the provider-neutral deployment contract, while preview middleware supplies executable response-header proof. |
| medium | carried: R2-BH-12 repeats the logged evidence-execution claim. The accepted route removes command strings, binds durable evidence paths and artifact digest, and relies on the separately executed verification commands; it is not patched or deferred again. |
| false | R2-BH-13: The canonical capacity fixture requires a 20,000-character URL with 250+ query entries and a fragment, which the shared fixture supplies; it does not require all 20,000 characters to be managed rows. |
| maybe-false | R2-BH-14: Device scale plus a 320 CSS-pixel viewport is the automated 400%-equivalent reflow check, but only a real browser zoom/manual matrix can conclusively settle equivalence across supported browsers. |
| low | R2-BH-15: The Search deferral used an absolute workstation path, making the otherwise shareable deferral record environment-specific. |
| low | R2-EC-1: Inputs above the supported 20,000-character boundary were accepted without a cap; although outside guaranteed capacity, a direct guard prevents accidental browser stalls. |
| medium | R2-EC-2: Each malformed percent sign converted its entire preceding prefix to code points, producing quadratic work on a valid 20,000-character adversarial input. |
| low | R2-EC-3: Evidence paths were resolved without proving they remained under the repository root, so a manifest-controlled parent path could satisfy a cell from an unrelated file. |
| medium | R2-EC-4: CSP requirements were matched as substrings, so text inside another directive or value could pass as an effective policy. |
| medium | R2-EC-5: IDN expectations remained local to the converter test rather than the shared fixture module, permitting cross-layer fixture drift. |
| medium | R2-EC-6: Diagnostics were captured broadly but asserted against only three URL fragments, so other URL-bearing content could leak without failing the privacy journey. |

## Design Notes

The canonical SPEC and companions supersede historical readiness-report conflicts. Keep parsing pure and synchronous while measured p95 remains within the architecture threshold; publish immediately and do not add a delayed indicator that cannot paint. If the threshold requires worker-backed parsing, a 150 ms delayed indicator may render while work continues. Publication carries input snapshot, current editor value, generation, epoch, and revision guards, and any input edit invalidates it. Boundary discovery must preserve the raw serialization of every HTTP(S) form accepted by the WHATWG oracle rather than requiring literal `://`. Query occurrence labels must be precomputed in linear time. The provider-neutral delivery contract and preview server must emit the full CSP as an HTTP response header; meta CSP alone is insufficient for `frame-ancestors`.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm test:e2e:install` -- expected: pinned dependencies and the required browser resolve from a clean checkout on the declared Node floor.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` -- expected: types, oxlint, unit/component suites, and production build pass.
- `pnpm test:e2e` -- expected: intake, lossless/IDN inspection, privacy, accessibility, responsive, and capacity journeys pass.
- `pnpm evidence:validate` -- expected: the complete Draft 2020-12 schema, fixed story mapping, durable evidence paths, response-header contract, and deterministic recursive artifact/deployment digest validate before every mandatory Stories 1.1–1.5 cell reports `pass`.
