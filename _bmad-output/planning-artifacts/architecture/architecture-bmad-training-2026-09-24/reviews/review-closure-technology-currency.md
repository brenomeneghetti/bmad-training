---
review: technology-currency (closure pass)
target: ../ARCHITECTURE-SPINE.md
reviewer-lens: technology/version currency and starter-assumption validation
as-of: 2026-09-29
baseline:
  - review-technology-currency.md (initial pass, 2026-09-24 spine)
  - review-update-technology-currency.md (update pass, 2026-09-29 diff review)
  - review-final-technology-currency.md (final configured pass, 2026-09-29)
verdict: PASS — the final timeout wording in AD-13 ("committed outcome would
  start after six seconds" and the associated FIFO/overflow/persistent
  operation-history language) is a duration/behavior rule, not a technology or
  API claim, and introduces nothing requiring new currency verification. Every
  Stack, WHATWG/tr46, Clipboard API, and browser/AT claim already cleared by
  the three prior passes remains textually unchanged and still current-fit as
  of 2026-09-29. A fresh independent npm-registry spot-check reproduces the
  identical posture found in review-final-technology-currency.md: 12 of 15
  Stack rows exact-match latest; TypeScript, pnpm, and oxlint remain the same
  known, non-blocking, previously-justified exceptions.
---

# Technology Currency Review — Closure Pass

## Method

1. Re-read the current working-tree `ARCHITECTURE-SPINE.md` in full and
   located every sentence containing a duration, timeout, or timing figure to
   isolate the "final timeout wording" specifically named by this closure
   request (AD-13, the paragraph beginning "`core/session` owns separate
   validation, polite FIFO/coalescing, and actionable-alert queues...").
2. Compared that paragraph's content against what `review-final-technology-
   currency.md` (the immediately preceding pass) already reviewed for AD-13,
   to confirm no unreviewed technology name was added between that pass and
   this one.
3. Re-verified `git diff HEAD` for the spine file is unchanged in substance
   from the diff already characterized by the final pass (same hunks: AD-3,
   AD-5, AD-6, AD-8, AD-13, AD-14, gate-closure wording, frontmatter date) —
   there is no new hunk beyond what was already reviewed.
4. Re-queried `registry.npmjs.org/<pkg>` `dist-tags.latest` independently for
   all 15 Stack rows as of 2026-09-29 to give this closure pass its own
   evidence rather than assuming the prior pass's numbers still hold.

## Finding 1 — The final timeout wording names no technology

The sentence under review reads (AD-13):

> "When a committed outcome would start after six seconds, every committed
> outcome participating in that overflow—including the currently exposed,
> pending, and incoming outcomes—is copied exactly once into persistent
> operation history. Pending committed outcomes leave the FIFO; the current
> message completes its minimum exposure; one summary is enqueued with the
> count of all promoted outcomes."

This is a product/UX timing and queue-management rule (a numeric threshold,
a FIFO structure, and a persistence behavior for feedback messages). It does
not name a library, package, browser API, standard, or version — "FIFO,"
"persistent operation history," and "six seconds" are architecture/behavior
vocabulary already scoped to `core/session`'s own reducer-owned state (per
AD-1 and the rest of AD-13), not a call to any external technology. There is
therefore nothing here for a currency check to verify: no registry lookup,
no spec-version check, and no browser-support matrix applies to a plain
numeric timing rule authored by this project's own code.

The only technology-bearing claims in AD-13 remain the ones the prior two
passes (`review-update-technology-currency.md` and
`review-final-technology-currency.md`) already verified: the Clipboard API
(Chrome 66+/Firefox 63+/Safari 13.1+ secure-context support) and the
platform screen readers VoiceOver and TalkBack named as the accessible Copy
fallback targets. The timeout/overflow paragraph adds no additional name
alongside these. Conclusion: the final timeout wording is closure-clean —
it introduces zero new technology claims.

## Finding 2 — No new hunk exists beyond what the prior final pass reviewed

`git diff HEAD -- ARCHITECTURE-SPINE.md` at closure time shows the same set
of changed sections already enumerated in `review-final-technology-
currency.md`'s Finding 1: frontmatter `updated:` date, AD-3, AD-5, AD-6,
AD-8, AD-13 (including this timeout/overflow paragraph), AD-14, and the
Architecture Gate Closure table wording. No additional working-tree edit
exists past that pass's scope, and the `## Stack` table again shows zero
diff lines. This closure pass is therefore confirming stability of an
already-reviewed diff, not discovering a new one.

## Finding 3 — All previously checked Stack/API/AT claims remain valid

Independent fresh registry queries (2026-09-29), reproducing
`review-final-technology-currency.md`'s Finding 2 exactly:

| Stack row | Pinned | Registry latest | Status |
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
| Vitest | 5.0.1 | 5.0.2 | One patch behind — unchanged posture, non-blocking |
| TypeScript | 6.0.2 | 7.0.2 | One major behind — by design (starter-pinned), unchanged, non-blocking |
| pnpm | 12.5.1 | 12.8.1 | Behind head — tooling only, unchanged, non-blocking |
| oxlint | 1.81.0 | 1.86.0 | Behind head — tooling only, unchanged, non-blocking |

No row moved status since `review-final-technology-currency.md`. The four
non-exact rows carry the identical justification already recorded there and
in the two earlier passes (Vitest: harmless patch drift within the pinned
minor line; TypeScript: deliberate `.memlog.md`-recorded decision to track
the `create-vite` 9.2.1 starter's TypeScript 6 line rather than TypeScript 7
independently; pnpm/oxlint: actively maintained dev-tooling behind latest
patch/minor only, no runtime or browser surface).

Non-Stack technology claims re-checked and unchanged:

- **WHATWG `URL`** (AD-2, AD-4) — platform global, acceptance/host-oracle
  only per AD-2; no version to drift.
- **`tr46` 6.0.0** (AD-4) — exact match, unchanged since Finding 2 above.
- **Clipboard API** (AD-13) — same browser-support facts as the update
  pass; nothing in this closure edit changes secure-context or browser
  version requirements.
- **VoiceOver / TalkBack** (AD-13) — named as platform-default screen
  readers for accessible Copy-fallback guidance; still the correct current
  defaults on Apple and Android platforms respectively, unchanged from the
  prior pass.
- **Browser/AT release matrix** (AD-14: "latest-two-major Chrome, Firefox,
  Edge, and Safari; the named desktop/mobile browser-AT matrix") — a
  rolling "latest-two-major" policy rather than a pinned version, so it
  carries no stale-version risk by construction; unchanged wording from the
  committed baseline.
- **WCAG 2.2 AA** (AD-14) — current published WCAG version, unchanged.

## No Tier-4 (erroneous/unverifiable) findings

Nothing in the current spine — including the final AD-13 timeout wording —
names a nonexistent package, misstates a prerelease as stable, or pins a
version absent from its registry.

## Verdict

**PASS.** The final timeout wording is a numeric/behavioral rule with zero
technology surface and needs no further currency check. All Stack, WHATWG/
`tr46`, Clipboard API, and browser/AT claims already validated by the three
prior passes remain unchanged in text and still current-fit as of
2026-09-29. This closes the technology-currency review lineage for
`ARCHITECTURE-SPINE.md` with no outstanding Critical or High findings.

## Sources consulted

- Current working-tree `ARCHITECTURE-SPINE.md` (AD-13 timeout/overflow
  paragraph and full text) — read directly for this pass.
- `git diff HEAD -- ARCHITECTURE-SPINE.md` — confirmed no hunk beyond what
  `review-final-technology-currency.md` already scoped.
- `registry.npmjs.org/<package>` `dist-tags.latest` — queried fresh for this
  closure pass, 2026-09-29, for all 15 Stack rows.
- `review-technology-currency.md`, `review-update-technology-currency.md`,
  `review-final-technology-currency.md` (this workspace, prior passes) —
  cross-checked for continuity of findings.
- `.memlog.md` — reconfirms the TypeScript 6-line-behind-starter decision is
  deliberate, not an overlooked gap.
