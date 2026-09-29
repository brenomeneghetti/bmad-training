---
review: technology-currency
target: ../ARCHITECTURE-SPINE.md
reviewer-lens: technology/version currency and starter-assumption validation
as-of: 2026-09-29
verdict: PASS — no fabricated technologies or impossible versions found; all Stack entries exist and are mutually compatible; several entries are one-to-few releases behind latest but are defensible drift, not errors; one gap (TypeScript major-version rationale) and one precision gap (Node patch floor) recommended for a one-line clarification, not a correction.
---

# Technology Currency Review — Architecture Spine

**Method:** Every row in the spine's `## Stack` table was checked against the
live npm registry (`registry.npmjs.org`) `dist-tags.latest` and full version
history as of 2026-09-29, cross-checked against `peerDependencies`/`engines`
manifests for real compatibility (not just number-adjacency), and against the
official Node.js release-schedule source of truth
(`github.com/nodejs/Release`). Web search was used only to find secondary
narrative context (ecosystem adoption notes); every quantitative claim below
is registry- or release-schedule-verified, cited by URL.

## Tier 1 — Verified accurate, current, and mutually compatible (no action)

| Stack entry | Spine value | Registry/authoritative finding | Citation |
| --- | --- | --- | --- |
| Node.js | 24 LTS | **Active LTS** confirmed. Initial release 2025-05-06, Active LTS start 2025-10-28, Maintenance start 2026-10-20, EOL 2028-04-30. As of 2026-09-29 Node 24 is squarely inside its Active LTS window (Maintenance begins ~3 weeks after this review — see Tier 3 note). | github.com/nodejs/Release `README.md` release-schedule table |
| create-vite | 9.2.1 | Matches `dist-tags.latest` exactly. Published 2026-09-10. `engines.node` = `^20.19.0 \|\| >=22.12.0`, satisfied by Node 24. | `registry.npmjs.org/create-vite` (dist-tags, version manifest) |
| React / React DOM | 19.3.0 | Matches `dist-tags.latest` exactly for both `react` and `react-dom`. Real, non-canary stable release (canary/experimental builds exist only as `19.3.0-canary-*` prereleases, correctly not what's pinned). | `registry.npmjs.org/react`, `registry.npmjs.org/react-dom` |
| Vite | 8.3.1 | Matches `dist-tags.latest` exactly. Published 2026-09-24. `engines.node` = `^20.19.0 \|\| >=22.12.0`, satisfied by Node 24. | `registry.npmjs.org/vite` |
| @vitejs/plugin-react | 6.1.1 | Matches `dist-tags.latest` exactly. `peerDependencies.vite` = `^8.0.0` — exactly satisfied by the pinned Vite 8.3.1 (this plugin line requires Vite 8; it is not compatible with Vite 7, so the pairing is not just current but load-bearing-correct). | `registry.npmjs.org/@vitejs/plugin-react/6.1.1` (peerDependencies) |
| tr46 | 6.0.0 | Matches `dist-tags.latest` exactly; no newer release exists (last published 2025-09-18, over a year of stability — a slow-moving spec-conformance package, not staleness). | `registry.npmjs.org/tr46` |
| Vitest | 5.0.1 | Real, non-deprecated version. One patch behind `dist-tags.latest` (5.0.2, published 10 days later). `engines.node` = `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0` — satisfied by Node 24. `peerDependencies.vite` = `^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0` — satisfied by Vite 8.3.1. | `registry.npmjs.org/vitest/5.0.1` |
| Testing Library React | 16.3.3 | Matches `dist-tags.latest` exactly. `peerDependencies.react`/`react-dom` = `^18.0.0 \|\| ^19.0.0` — satisfied by React 19.3.0. `peerDependencies['@testing-library/dom']` = `^10.0.0` — satisfied by the pinned DOM 10.4.2. | `registry.npmjs.org/@testing-library/react/16.3.3` |
| Testing Library DOM | 10.4.2 | Matches `dist-tags.latest` exactly. | `registry.npmjs.org/@testing-library/dom` |
| Testing Library user-event | 14.6.7 | Matches `dist-tags.latest` exactly. | `registry.npmjs.org/@testing-library/user-event` |
| jsdom | 30.1.1 | Matches `dist-tags.latest` exactly. See Tier 3 for an `engines` precision note. | `registry.npmjs.org/jsdom` |
| @playwright/test | 1.63.0 | Matches the `latest` dist-tag exactly (distinct from the `next`/`beta`/`rc` prerelease tags, correctly not what's pinned). | `registry.npmjs.org/@playwright/test` (dist-tags) |
| @axe-core/playwright | 4.13.0 | Matches the `latest` dist-tag exactly (distinct from `next` prerelease shas). | `registry.npmjs.org/@axe-core/playwright` (dist-tags) |

**create-vite/foundation fit:** AD-10's `base: './'`, the fingerprinted-asset
cache-control policy, and the CSP floor are declared as this project's own
architecture decisions layered on top of the scaffold — they are not asserted
to be create-vite's defaults, so there is no discrepancy to reconcile there.
create-vite 9.2.1's own `engines.node` requirement (`^20.19.0 || >=22.12.0`)
is satisfied by the pinned Node 24 LTS.

## Tier 2 — Not latest, but intentionally/plausibly compatible (flag rationale, not a defect)

| Stack entry | Spine value | Latest on npm | Gap | Assessment |
| --- | --- | --- | --- | --- |
| TypeScript | 6.0.2 | 7.0.2 | One major version | **Defensible, but undocumented.** TypeScript 7.0 (July 2026) rewrote `tsc` in Go; as of September 2026 its programmatic compiler API is explicitly unstable until 7.1, which breaks or has not yet been adopted by tools that load TypeScript as a library (`ts-jest`, `ts-node`, custom Vite/Vitest transforms, `vue-tsc`-style checkers, several ESLint/TypeDoc integrations). For a Vite+Vitest+Testing-Library stack that depends on the programmatic API, staying on 6.0.2 — a real, non-deprecated, non-prerelease version (`registry.npmjs.org/typescript` versions map; `deprecated` field absent) — is a common, currently reasonable holding position, not an error. **Recommendation:** add a one-line footnote to the Stack table stating this is a deliberate hold pending TS 7.1 ecosystem stabilization, so a future reader doesn't mistake it for staleness. | ishu.dev "TypeScript 7.0: 10x Faster Builds, No Stable Programmatic API" (2026-07-30); typescriptpro.com "TypeScript 7 Released: The Native Go Port" (2026-07-08); `registry.npmjs.org/typescript` (6.0.2 published 2026-03-23, no `deprecated` flag) |
| pnpm | 12.5.1 | 12.8.1 | 3 minor releases / ~10 days at authoring time (12.5.1 published 2026-09-18; 12.8.1 published 2026-09-28) | Normal drift for a tool that ships multiple releases per week; no compatibility break implied between these minors. Not an error, just slightly behind head. | `registry.npmjs.org/pnpm` (version-time map) |
| oxlint | 1.81.0 | 1.86.0 | 5 releases / ~4 weeks (1.81.0 published 2026-09-01; 1.86.0 published 2026-09-28) | oxlint ships roughly weekly; a 4-week lag is unremarkable for a lint tool pin and carries no known breaking-change risk documented for this span. Not an error. | `registry.npmjs.org/oxlint` (version-time map) |
| Vitest | 5.0.1 | 5.0.2 | 1 patch | Already covered in Tier 1 as compatible; listed here only to note it is not bleeding-edge. Harmless. | `registry.npmjs.org/vitest` |

## Tier 3 — Precision gaps worth a one-line clarification (not errors)

1. **Node.js LTS-window boundary is close to this review date.** Per the
   official Node release schedule, Node 24 ("Krypton") moves from Active LTS
   to **Maintenance LTS on 2026-10-20** — about three weeks after this
   review's as-of date. The spine's "Node.js 24 LTS" label is accurate today
   and remains accurate through Maintenance (still LTS, still fully
   supported until 2028-04-30), so this is not an error — but AD-14's release
   gate spans a period that will cross this maintenance-mode transition, and
   the spine does not distinguish Active vs. Maintenance LTS. No spine change
   is required; flagging only so release-readiness reviews aren't surprised
   by Node 24 entering security/critical-fix-only mode mid-cycle.
   — github.com/nodejs/Release `README.md`
2. **jsdom's Node floor is more specific than "Node.js 24 LTS."** jsdom
   30.1.1's `engines.node` is `^22.22.2 || ^24.15.0 || >=26.0.0` — i.e., not
   *all* of the Node 24 line satisfies it, only `24.15.0` and above. The
   current recommended Node 24 LTS release (24.21.0, per web search of the
   Node release blog) clears this floor, so there is no live incompatibility
   today, but the spine's generic "24 LTS" label does not itself guarantee a
   ≥24.15.0 floor if a team pins an earlier 24.x patch. **Recommendation:**
   state the Node floor as "24.15+ LTS" (or later) for engine-check
   precision; this is a documentation precision improvement, not a
   correction of an error. — `registry.npmjs.org/jsdom/30.1.1` (`engines`)

## No Tier 4 (erroneous/unverifiable) findings

No Stack entry names a nonexistent package, a nonexistent/prerelease-only
version being mispresented as stable, or a version incompatible with its
declared peers. Every version pinned in the Stack table was found as a real,
non-deprecated published version on the npm registry, and every
cross-dependency relationship checked (`@vitejs/plugin-react` ↔ `Vite`,
`Vitest` ↔ `Vite`/Node, `Testing Library React` ↔ `React`/`Testing Library DOM`,
`create-vite`/`Vite`/jsdom ↔ Node) resolved to a satisfied `peerDependencies`/
`engines` constraint.

## Sources consulted

- `registry.npmjs.org` JSON manifests for: pnpm, create-vite, react,
  react-dom, vite, @vitejs/plugin-react, typescript, oxlint, tr46, vitest,
  @testing-library/react, @testing-library/dom, @testing-library/user-event,
  jsdom, @playwright/test, @axe-core/playwright (dist-tags, full version/time
  maps, and per-version `engines`/`peerDependencies` where noted above).
- `github.com/nodejs/Release` `README.md` — official Node.js release schedule
  table (source of truth for LTS phase dates).
- ishu.dev, typescriptpro.com — secondary narrative context on TypeScript
  7.0's Go-native compiler and programmatic-API instability (used only to
  corroborate the *reason* a one-major-version hold on TypeScript is
  currently defensible; the version-existence facts themselves come from the
  npm registry, not these sources).
