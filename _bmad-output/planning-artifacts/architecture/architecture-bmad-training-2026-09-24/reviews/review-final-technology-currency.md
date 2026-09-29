---
review: technology-currency (final configured pass)
target: ../ARCHITECTURE-SPINE.md
reviewer-lens: technology/version currency and starter-assumption validation
as-of: 2026-09-29
baseline:
  - review-technology-currency.md (initial pass, 2026-09-24 spine)
  - review-update-technology-currency.md (update pass, 2026-09-29 diff review)
verdict: PASS — no technology claim was introduced by the latest (working-tree)
  edit to ARCHITECTURE-SPINE.md that requires new currency verification, and
  the Stack table remains valid/current-fit as of 2026-09-29. The uncommitted
  diff since the last commit (0e90153) touches only rule/prose text in AD-3,
  AD-5, AD-6, AD-8, AD-13, AD-14, and the gate-closure table wording, plus the
  `updated:` frontmatter date; it does not add, remove, or re-version any
  Stack row and introduces zero new named technologies beyond the Clipboard
  API / VoiceOver / TalkBack trio already verified in
  review-update-technology-currency.md. A fresh npm-registry spot-check of
  every pinned Stack package confirms 12 of 15 rows are still exactly current
  latest; the three known-lagging rows (TypeScript, pnpm, oxlint) show no
  material change in posture since the prior passes and remain non-blocking
  for the stated reasons below.
---

# Technology Currency Review — Final Configured Pass

## Method

1. Confirmed repository state: last commit touching the spine is `0e90153`
   ("docs(architecture): define URL management spine", 2026-09-24), and the
   working tree carries an uncommitted edit dated 2026-09-29 in the
   `updated:` frontmatter field (`git diff` against `HEAD` for
   `ARCHITECTURE-SPINE.md`).
2. Re-diffed the committed baseline against the current working-tree content
   to enumerate exactly what changed since the last commit, independent of
   the two prior review passes already on disk, to confirm no technology
   claim was introduced that either prior review missed.
3. Re-queried the npm registry directly (`registry.npmjs.org/<pkg>`
   `dist-tags.latest`) for all 15 Stack rows as of 2026-09-29, to give this
   final pass its own independent currency evidence rather than relying only
   on the prior passes' findings.

## Finding 1 — The working-tree edit introduces no new technology/version claim

Diffing `HEAD:...ARCHITECTURE-SPINE.md` against the current working-tree
file shows changes confined to:

- Frontmatter `updated:` date (2026-09-24 → 2026-09-29).
- AD-3 (component-text codec): rewritten to specify per-field percent-encode
  profiles (path set plus `/`/`\`; query-key set plus `&`/`=`; query-value
  set plus `&`) and revision/selection-range edit semantics. No new library,
  tool, or standard is named — this is a specification of WHATWG
  percent-encoding rules already in scope, not a new dependency.
- AD-5 (history/identity): clarifies path/query token-matching keys for the
  existing exact-token LCS reconciliation. No technology claim.
- AD-6 (close-and-rebase): re-sequences when `closeFullUrlEdit` fires
  relative to blur/Enter/product mutations. No technology claim.
- AD-8 (parsing): adds `session epoch` to the existing generation/snapshot
  staleness guard. No technology claim.
- AD-13 (effects): adds `claimEffect` precondition-check semantics and
  detailed Copy/`latestCopyAttemptId` recovery and feedback-overflow rules.
  This is the same hunk previously reviewed in
  `review-update-technology-currency.md`, which is where the Clipboard API /
  VoiceOver / TalkBack names were verified as current, real, and fit-for-
  purpose (Chrome 66+/Firefox 63+/Safari 13.1+ secure-context support;
  default OS-bundled screen readers on Apple and Android platforms
  respectively). Nothing beyond that trio is newly named here.
- AD-14 and the Architecture Gate Closure table: wording changes to
  "design closed; implementation evidence pending" plus new evidence-schema
  language (mandatory cells, `pass`/`waived`/`skipped` states, evaluator
  versioning). This is process/governance language, not a technology or
  version claim.
- **The `## Stack` table itself has zero diff lines** in the current
  working-tree comparison, exactly as `review-update-technology-currency.md`
  already found — confirmed independently here by re-running `git diff` and
  visually confirming the last hunk ends at the Architecture Gate Closure
  table, immediately before `## Stack` begins.

Conclusion: there is no unreviewed technology claim in the latest edit. The
two prior passes already correctly scoped and cleared the one substantive
new-technology hunk (AD-13's Clipboard API / VoiceOver / TalkBack); this pass
independently confirms no other hunk names anything new.

## Finding 2 — Stack table re-verified independently against the npm registry (2026-09-29)

Direct `registry.npmjs.org` queries for `dist-tags.latest` on all 15 pinned
packages, run fresh for this pass:

| Stack row | Pinned | Registry latest (2026-09-29) | Status |
| --- | --- | --- | --- |
| React / React DOM | 19.3.0 | 19.3.0 | Current — exact match |
| Vite | 8.3.1 | 8.3.1 | Current — exact match |
| @vitejs/plugin-react | 6.1.1 | 6.1.1 | Current — exact match |
| tr46 | 6.0.0 | 6.0.0 | Current — exact match |
| @playwright/test | 1.63.0 | 1.63.0 | Current — exact match |
| @axe-core/playwright | 4.13.0 | 4.13.0 | Current — exact match |
| jsdom | 30.1.1 | 30.1.1 | Current — exact match |
| Testing Library React | 16.3.3 | 16.3.3 | Current — exact match |
| Testing Library DOM | 10.4.2 | 10.4.2 | Current — exact match |
| Testing Library user-event | 14.6.7 | 14.6.7 | Current — exact match |
| create-vite | 9.2.1 | 9.2.1 | Current — exact match |
| Vitest | 5.0.1 | 5.0.2 | One patch behind (new since last pass) — non-blocking, see below |
| TypeScript | 6.0.2 | 7.0.2 | One major behind — **by design**, unchanged from prior passes, see below |
| pnpm | 12.5.1 | 12.8.1 | Behind head — tooling only, non-blocking, see below |
| oxlint | 1.81.0 | 1.86.0 | Behind head — tooling only, non-blocking, see below |

### Assessment of the four non-exact rows

- **Vitest 5.0.1 → 5.0.2**: a patch release has shipped since the prior
  reviews' as-of snapshot. This is the only row whose drift is new
  information versus the two prior passes. A patch bump within the same
  minor line carries no known breaking change, no deprecation, and no
  fit-for-purpose concern for this spine's golden-fixture/component-test
  usage; it does not change the verdict.
- **TypeScript 6.0.2 vs 7.0.2**: unchanged posture from both prior reviews.
  The memlog (`.memlog.md`) explicitly records this as a deliberate choice —
  the project stays on the `create-vite` 9.2.1 starter's TypeScript 6 line
  rather than adopting TypeScript 7 independently of the starter template,
  to avoid an unreviewed compiler-version mismatch against the verified
  starter output. This remains a documented, intentional decision, not a
  currency gap.
- **pnpm 12.5.1 vs 12.8.1** and **oxlint 1.81.0 vs 1.86.0**: both were
  already flagged as "mildly behind head" in `review-technology-currency.md`
  and reconfirmed unchanged in `review-update-technology-currency.md`. Both
  are development-time tooling (package manager, linter) with no runtime or
  browser-compatibility surface for the shipped client bundle, and both
  pinned versions remain actively maintained current-major releases — behind
  the latest patch/minor, not behind a deprecated or unsupported line. Same
  conclusion as the prior two passes: non-blocking.

## Finding 3 — Stack remains valid/current-fit as a whole

No pinned technology in the Stack table is deprecated, abandoned,
pre-release/unstable, or mismatched to its stated purpose:

- The client-only, static-bundle architecture (AD-10) is fully served by
  Vite 8 + `@vitejs/plugin-react` 6 + React 19; no server runtime is implied
  or required, consistent with the Stack containing no server framework.
- The lossless URL/IDN core (AD-2, AD-4) depends only on the platform
  WHATWG `URL` global and `tr46` 6.0.0, both still current and correctly
  scoped (WHATWG `URL` as acceptance/host-oracle only, per AD-2; `tr46` for
  UTS #46 conversion, per AD-4). No new parsing library was introduced by
  the edit.
- The verification stack (Vitest, Testing Library trio, jsdom,
  `@playwright/test`, `@axe-core/playwright`) matches AD-11's shared-corpus
  requirement (golden/unit, component, and browser/AT layers) and AD-14's
  release-gate evidence requirements (cross-browser, accessibility, timing)
  without needing any additional package.

## No Tier-4 (erroneous/unverifiable) findings

Nothing in the current working-tree spine names a nonexistent package,
misstates a prerelease as stable, or pins a version that does not exist in
the registry.

## Sources consulted

- `git diff HEAD -- ARCHITECTURE-SPINE.md` and `git log -p -1` — authoritative
  for isolating the exact latest edit and confirming the Stack table's
  zero-diff status independently of the prior two review passes.
- `registry.npmjs.org/<package>` `dist-tags.latest` — queried fresh for this
  pass, 2026-09-29, for all 15 Stack rows (react, vite, typescript, vitest,
  tr46, pnpm, oxlint, @vitejs/plugin-react, @playwright/test,
  @axe-core/playwright, jsdom, @testing-library/react,
  @testing-library/dom, @testing-library/user-event, create-vite).
- `review-technology-currency.md` and `review-update-technology-currency.md`
  (this workspace, prior passes) — cross-checked for consistency; this pass
  independently reproduces their Stack-table and AD-13-hunk conclusions
  rather than assuming them.
- `.memlog.md` — confirms the TypeScript 6-line-behind-starter decision is a
  recorded, deliberate assumption rather than an overlooked gap.
