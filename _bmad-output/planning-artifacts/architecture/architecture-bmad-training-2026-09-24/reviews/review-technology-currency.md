# Reviewer Gate — Technology Currency

**Reviewed:** 2026-09-24  
**Artifact:** `../ARCHITECTURE-SPINE.md`  
**Lens:** Verify every committed decision against current official sources, the npm registry, or an explicit reality check; flag stale or unsupported assertions.  
**Verdict:** **FAIL — revision or explicit evidence is required before implementation.** The named stack exists and is broadly compatible with Node 24, and most exact package versions are current. However, the spine does not match the live Vite React TypeScript starter, one pin is already behind npm latest, the test/accessibility stack is incomplete or ambiguously named, `tr46` validation options are underspecified, and several load-bearing performance and URL-semantics decisions have no recorded spike, benchmark, or official-source basis.

## Top findings

1. **The “Vite React TypeScript starter” is not represented faithfully.** The current `create-vite@9.2.1` `react-ts` template uses React `^19.2.8`, TypeScript `~6.0.2`, Vite `^8.3.0`, `@vitejs/plugin-react@^6.1.1`, `oxlint@^1.81.0`, `@types/node@^24.13.3`, and React type packages. The spine pins React 19.3.0 and TypeScript 7.0.2 while omitting the plugin, types, and lint tool. Those may be valid deliberate upgrades, but they are not live starter defaults and no scaffold/build reality check is recorded.
2. **The component and accessibility test stack cannot be reproduced as written.** `@testing-library/react@16.3.3` requires the separately installed `@testing-library/dom`; Vitest component tests require a browser-like environment such as `jsdom` or `happy-dom`; and Playwright’s official accessibility guide uses `@playwright/test` plus `@axe-core/playwright`, not merely the ambiguous labels “Playwright” and `axe-core`.
3. **AD-4 does not pin the `tr46` validation contract.** `tr46@6.0.0` exists and defaults to non-transitional processing, but its validation switches (`checkBidi`, `checkHyphens`, `checkJoiners`, `useSTD3ASCIIRules`, and `verifyDNSLength`) default to `false`. The WHATWG URL Standard’s domain-to-ASCII path uses stricter named parameters. “Use `tr46` non-transitional processing, then validate through WHATWG” is not deterministic enough until exact options and cross-check fixtures are specified.
4. **The two evidence-triggered performance decisions are asserted, not reality-checked.** AD-7’s full-DOM choice at 250+ rows and AD-8’s synchronous parsing choice with a 50 ms p95 worker threshold have no recorded browser/AT matrix, memory/profile run, reference hardware, or benchmark artifact. They may be reasonable, but the configured lens requires evidence rather than architectural intuition.
5. **The deployment claim misses a live Vite default constraint.** The starter’s Vite config does not set `base`, so Vite defaults to `/`. An immutable bundle is not automatically provider/path invariant: deployment under a repository or other nested public path requires an explicit `base` decision and a preview/production build check.

## Current stack verification

Registry status was checked directly against `registry.npmjs.org` on 2026-09-24.

| Spine entry | Registry/official result | Assessment |
| --- | --- | --- |
| Node.js 24 LTS | Node 24 is LTS through 2028-04-30, scheduled to enter Maintenance on 2026-10-20; current 24.x release shown by Node is 24.21.0. | **Exists and fits.** Major-only pin is less reproducible than the exact package pins. |
| pnpm 12.5.1 | Exact version exists; npm `latest` is 12.6.0. Engine is Node `>=18.*`. | **Fits but potentially stale.** The memlog’s blanket “verified” claim should not imply latest. |
| React / React DOM 19.3.0 | Both exact versions exist and are npm `latest`; React’s official versions page identifies 19.3 as latest. `react-dom@19.3.0` peers on React `^19.3.0`. | **Current and mutually compatible.** Not the current starter default. |
| Vite 8.3.1 | Exact version exists and is npm `latest`; engine is `^20.19.0 || >=22.12.0`. | **Current and compatible with Node 24.** |
| TypeScript 7.0.2 | Exact version exists and is npm `latest`; engine is Node `>=16.20.0`. | **Current and compatible with Node 24.** Deliberate divergence from starter `~6.0.2` is untested. |
| `tr46` 6.0.0 | Exact version exists and is npm `latest`; engine is Node `>=20`. | **Current and compatible.** Runtime options are underspecified; see Finding 3. |
| Vitest 5.0.1 | Exact version exists and is npm `latest`; supports Node `^22.12.0 || ^24.0.0 || >=26.0.0` and Vite `^8.0.0`. | **Current and compatible.** DOM environment package/config is missing. |
| Testing Library React 16.3.3 | Exact version exists and is npm `latest`; peers support React 18/19 and require `@testing-library/dom@^10`. | **Current but incomplete as listed.** |
| Playwright 1.63.0 | `playwright` and `@playwright/test` 1.63.0 both exist and are npm `latest`; Node 24 is officially supported. | **Current but package identity is ambiguous.** Use the official test-runner package name if that is the intent. |
| axe-core 4.13.0 | Exact version exists and is npm `latest`. | **Current, but does not document the intended Playwright integration.** Official Playwright guidance uses `@axe-core/playwright@4.13.0`. |

No named package is nonexistent or deprecated in npm metadata. The selected primary versions are mutually plausible on Node 24. The reproducibility gap is in omitted peer/runtime tooling and unverified departures from the scaffold, not in the existence of the named packages.

## Live greenfield starter reality check

The npm tarball for current `create-vite@9.2.1` was inspected directly. Its `template-react-ts` currently provides:

- scripts: `vite`, `tsc -b && vite build`, `oxlint`, and `vite preview`;
- React `^19.2.8` and React DOM `^19.2.8`;
- TypeScript `~6.0.2`, Vite `^8.3.0`, `@vitejs/plugin-react@^6.1.1`;
- `@types/node@^24.13.3`, `@types/react@^19.2.18`, and `@types/react-dom@^19.2.7`;
- ES modules (`"type": "module"`), `StrictMode`, `createRoot`, `moduleResolution: "bundler"`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noEmit`, and ES2023/DOM libraries;
- no Vitest, Testing Library, DOM emulator, Playwright, axe integration, or CSS-Modules-specific setup;
- no explicit Vite `base`, test configuration, CSP, deployment target, or package-manager pin.

Therefore the architecture needs an explicit bootstrap delta rather than implying that the live starter directly yields the documented stack. At minimum, implementation should record:

1. the exact scaffold command and `create-vite` version;
2. intentional upgrades from React 19.2.x/TypeScript 6.0.x to the spine pins;
3. retention or replacement of Oxlint;
4. the React plugin and type-package pins;
5. the chosen Vitest DOM environment and Testing Library peer;
6. `@playwright/test` and the axe integration package;
7. the deployment `base` strategy; and
8. a clean install, typecheck, production build, component-test smoke test, and browser-test smoke test on the pinned Node/pnpm versions.

## Decision-by-decision evidence audit

| Decision | Web/reality-check status | Review |
| --- | --- | --- |
| AD-1 — transactional session authority | No external evidence needed for the pattern, but no reducer prototype or transition corpus is recorded. | **Unverified implementation contract.** Keep as an architectural decision, but do not describe atomicity as proven until transition tests exercise competing Full URL, piece edit, history, copy, and effect sequences. |
| AD-2 — lossless URL core with WHATWG acceptance | WHATWG officially documents canonicalizing parse/serialize behavior and host parsing, supporting the decision not to use `URL` as a lossless serializer. No custom scanner spike is recorded. | **Partly verified.** The standards premise is sound; exact preservation of malformed percent text, separators, empty entries, and source lexemes remains unproven. |
| AD-3 — one component-text codec | No official source or executable examples establish the proposed preservation/encoding policy. | **Unverified.** This is product-specific behavior and needs golden input/edit/output fixtures before downstream units depend on it. Clarify what “newly entered Unicode” means for normalization and which delimiters are structural per component. |
| AD-4 — deterministic dual IDN conversion | Package existence, non-transitional default, and WHATWG UTS #46 behavior are verified. Exact `tr46` options are absent and defaults are looser than the prose implies. | **Incomplete and potentially divergent.** Pin all options and prove `tr46`/WHATWG agreement over bidi, joiner, hyphen, STD3, DNS-length, IPv4-like, percent-encoded, trailing-dot, and empty-label cases. |
| AD-5 — snapshot history owns identity | No external source is required, but no memory sizing or undo/focus prototype is recorded. | **Unverified.** Complete snapshots at 20,000 characters and many history entries need a measured retention/memory envelope; “complete Undo” is otherwise unbounded. |
| AD-6 — close-and-rebase transition | No executable state-machine trace is recorded. | **Unverified.** The rule is detailed but must be reality-checked with a transition table covering blur, Enter, intervening structured edits, invalid-to-valid recovery, Undo, and focus transfer. |
| AD-7 — full DOM accessibility representation | Native semantic DOM is compatible with accessibility goals; the claim that every 250+ row case is acceptable has no measured evidence. | **Unverified threshold.** Run the required browser/AT and interaction profile before treating “V1 may not ship virtualization” as evidence-backed. |
| AD-8 — local synchronous parsing | Synchronous pure parsing is technically viable, but the 50 ms p95 trigger and scheduled-generation design have no benchmark. | **Unverified threshold.** Define reference hardware/browser, corpus, warm-up, sample count, and measured interaction boundary. Also explain why scheduled parsing exists if parsing is synchronous. |
| AD-9 — no external sink | CSP `connect-src 'none'` is a valid defense for script-initiated connection APIs, but it is not a complete “no outbound request/navigation” policy. Other resource directives, `form-action`, and navigation controls are separate. | **Partly verified, policy incomplete.** Record the full production CSP and a browser test that fails on any unexpected request/storage write. Do not treat `connect-src` alone as proof of no exfiltration. |
| AD-10 — static, environment-invariant delivery | Vite supports static builds, and all chosen runtime code can be client-only. The default `base: "/"` means path invariance is not automatic. Clipboard behavior also depends on secure-context/browser permissions. | **Partly verified.** Add base-path and Clipboard API checks to the release matrix; define whether deployment is origin-root-only or configure relative/nested paths explicitly. |
| AD-11 — shared executable acceptance corpus | Vitest, Testing Library, Playwright, and axe all exist and fit the broad roles. The package/config set is incomplete. | **Partly verified.** Specify the missing DOM environment, Testing Library DOM peer, Playwright test-runner package, axe bridge, fixture data format, and which layers can consume it without environment-specific forks. |

## Additional stale or unverified points

- **The memlog overstates verification.** It says all listed versions were verified through npm and official guidance, but pnpm 12.5.1 is not npm latest, and the current scaffold defaults were not carried into the spine. Preserve the date and source per pin, and distinguish “exists/compatible” from “latest” and “starter default.”
- **CSS Modules are supported by Vite but not a starter commitment.** The convention is viable; the starter supplies ordinary CSS and requires the project to introduce `.module.css` usage and naming conventions.
- **Clipboard is a release gate without a pinned browser contract.** The spine should reality-check HTTPS/secure-context requirements, permission/error behavior, and the supported browser matrix before relying on “safe-copy outcome adapter.”
- **“WHATWG implementation” needs an environment boundary.** Browser `URL` is appropriate for the shipped app, while Node’s `URL` may appear in Vitest. The corpus should prove browser/Node agreement or run acceptance parsing in a browser environment so tests do not silently validate a different implementation.
- **Package-manager reproducibility is incomplete.** A pnpm version in a table does not activate that version. The starter does not add `packageManager`; implementation should pin it in `package.json` and use Corepack or an equivalent documented bootstrap.

## Required evidence to pass this lens

1. Capture the exact npm/official-source checks with an `as of` date and distinguish latest, selected, and scaffold-default versions.
2. Scaffold the current Vite React TypeScript template, apply the intended version deltas, and record a successful clean install, typecheck, build, Vitest DOM smoke test, Playwright smoke test, and axe scan on Node 24.
3. Pin the complete package set, especially `@vitejs/plugin-react`, React/Node types, `@testing-library/dom`, one Vitest DOM environment, `@playwright/test`, and `@axe-core/playwright` if following official guidance.
4. Specify and fixture-test every `tr46` option against WHATWG/browser host acceptance.
5. Attach benchmark and browser/AT evidence for the 250+ full-DOM and 50 ms synchronous-parsing thresholds.
6. Decide Vite `base`, package-manager activation, complete CSP, and Clipboard/browser constraints rather than relying on starter or browser defaults.

## Sources

Official and primary sources accessed 2026-09-24:

- Node.js releases and support status: <https://nodejs.org/en/about/previous-releases>
- Node.js release schedule: <https://raw.githubusercontent.com/nodejs/Release/main/schedule.json>
- React current versions: <https://react.dev/versions>
- TypeScript installation guidance: <https://www.typescriptlang.org/download/>
- Vite guide and configuration: <https://vite.dev/guide/>, <https://vite.dev/config/shared-options.html#base>, <https://vite.dev/guide/static-deploy.html>, <https://vite.dev/guide/features.html#css-modules>
- Vitest environments: <https://vitest.dev/guide/environment.html>
- React Testing Library setup: <https://testing-library.com/docs/react-testing-library/setup/>
- Playwright introduction/system requirements: <https://playwright.dev/docs/intro>
- Playwright accessibility testing: <https://playwright.dev/docs/accessibility-testing>
- `tr46` project documentation: <https://github.com/jsdom/tr46#readme>
- WHATWG URL Standard: <https://url.spec.whatwg.org/>
- CSP `connect-src` and `form-action`: <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src>, <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action>
- npm registry metadata and tarballs: `https://registry.npmjs.org/<package>` and exact-version endpoints for every package named in this report, including direct inspection of the `create-vite@9.2.1` tarball’s `template-react-ts`.
