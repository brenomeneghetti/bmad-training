---
title: 'Epic 1: Inspect URL Pieces Without Semantic Loss'
type: 'feature'
created: '2026-09-30'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
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

- `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig*.json`, `playwright.config.ts`, `index.html` -- replace the placeholder package with the pinned static React/Vite quality and CSP foundation.
- `src/core/{contracts,url,idn,session}/` -- new pure contracts, scanner/serializer, TR46 conversion, immutable snapshots, reducer, stable IDs, and intake state.
- `src/app/{workbench,pieces,feedback}/` -- new semantic Full URL, Actions, Structured View, complete managed-piece list, and validation/status UI.
- `src/platform/{clipboard,effects,focus}/` -- architecture boundaries only; do not pre-implement later-epic behavior.
- `src/styles/` -- design tokens, focus, responsive/reflow, forced-colors, and reduced-motion rules.
- `src/test/fixtures/`, `tests/`, `evidence/` -- shared AG-1/AG-2/AG-3 corpus, unit/component/browser tests, and machine-validated evidence manifest.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize completed Stories 1.1–1.5 only.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, tool configs, `index.html`, `src/main.tsx` -- scaffold the pinned ESM React/Vite application, scripts, static CSP/delivery contract, architecture folders, and evidence validator.
- [x] `src/core/contracts/`, `src/core/url/` -- implement typed problems, branded identity, lossless acceptance/scanning/serialization, exact query/path/fragment modeling, and goldens.
- [x] `src/core/idn/` -- implement TR46 6.0.0 conversion with adopted options and WHATWG host validation.
- [x] `src/core/session/` -- implement reducer-owned no-session/parsing/active/invalid-intake state, stale-parse guards, atomic snapshots, and immutable IDs.
- [x] `src/app/`, `src/styles/` -- build the three-section accessible workbench, complete full-DOM rows, dual domain forms, design tokens, and responsive states.
- [x] `src/test/fixtures/`, tests, `evidence/` -- cover the matrix, privacy/lifecycle, exact semantics, IDN, 250+ rows, accessibility, responsiveness, and performance evidence.

**Acceptance Criteria:**
- Given a fresh checkout, when dependencies install and quality scripts run, then the pinned stack builds a provider-neutral static artifact with required CSP and no prohibited sink.
- Given valid and invalid intake, when validation settles or Apply runs, then only supported HTTP(S) input atomically creates exact session state and rejected input never replaces trusted state.
- Given shared semantic and IDN fixtures, when core, component, and browser suites run, then all layers produce the same exact serialization, ordered pieces, stable identities, and domain forms.
- Given 250+ parameters at 20,000 characters, when the workbench renders, then every row remains reachable within targets and no partial or stale result publishes.
- Given keyboard, 320px/400% zoom, text spacing, forced colors, reduced motion, and accessibility checks, when the inspection journey runs, then content remains perceivable and operable without page-level horizontal scrolling.
- Given reload plus monitored network/storage/console facilities, when a session ends, then no URL content persists or leaves the browser and the workbench returns to No session.

## Implementation Notes

- Implemented a static React/Vite workbench with browser-local reducer state, exact accepted serialization, lossless path/query scanning, TR46 domain forms, stale-publication guards, full-DOM rendering, and no persistence or application network sink.
- Verification passed with 25 Vitest tests, 4 Chromium Playwright journeys including axe, keyboard, text-spacing, forced-colors, reduced-motion, privacy, and 320px/capacity checks, the production build, and all 5 mandatory evidence cells.

## Spec Change Log

## Review Triage Log

| Verdict | Evidence and resolution |
| --- | --- |
| medium | The initial scanner treated a WHATWG-special backslash as authority text, omitting accepted path pieces. The scanner now preserves `/` and `\` separators explicitly and a golden covers mixed separators and trailing empties. |
| medium | WHATWG can strip tabs/control characters and surrounding whitespace before host parsing, which made the raw source and structured view disagree. Intake now rejects these unsafe forms with associated specific guidance and fixtures cover them. |
| medium | The evidence validator initially trusted hard-coded `pass` cells without inspecting referenced evidence or the built artifact. It now verifies evidence paths, required CSP directives, built assets, and reports an artifact digest. |
| low | Concrete clipboard and focus adapters crossed the architecture-only Epic 1 platform boundary, and Copy became enabled without behavior. Platform modules now expose ports only and all later-epic controls remain explicitly disabled. |
| medium | Browser privacy/accessibility evidence initially checked only an encoded URL substring and omitted console, IndexedDB, keyboard, text-spacing, forced-colors, and reduced-motion cases. The browser suite now covers those facilities and states. |

## Design Notes

The canonical SPEC and companions supersede historical readiness-report conflicts. Use synchronous pure parsing first; scheduled publication carries input snapshot, generation, epoch, and revision guards. A 150 ms delayed parsing indicator is the implementation default.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile` -- expected: pinned dependencies resolve from a clean checkout.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` -- expected: types, oxlint, unit/component suites, and production build pass.
- `pnpm test:e2e` -- expected: intake, lossless/IDN inspection, privacy, accessibility, responsive, and capacity journeys pass.
- `pnpm evidence:validate` -- expected: every mandatory Stories 1.1–1.5 evidence cell for the built artifact is `pass`.
