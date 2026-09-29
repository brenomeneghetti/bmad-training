---
review: technology-currency (update pass)
target: ../ARCHITECTURE-SPINE.md
reviewer-lens: technology/version currency and starter-assumption validation
as-of: 2026-09-29
baseline: review-technology-currency.md (prior pass, same as-of date, pre-update spine)
verdict: PASS — the 2026-09-29 update changed only prose/rule text (AD-3, AD-5, AD-6, AD-8, AD-13, AD-14, gate-closure wording); the `## Stack` table is byte-identical to the reviewed baseline, so every version finding in the prior review still holds without re-litigation. The update's only new named-technology claims are three non-npm platform/API names introduced in AD-13 — the Clipboard API, VoiceOver, and TalkBack — and all three are verified real, current, and fit for the stated purpose. No fabricated, deprecated, or version-impossible technology was introduced.
---

# Technology Currency Review — Architecture Spine Update (2026-09-24 → 2026-09-29)

## Method

1. Diffed the spine against its prior committed revision
   (`git show HEAD:...ARCHITECTURE-SPINE.md` vs. working tree) to isolate
   exactly what the 2026-09-29 update changed, so this pass reviews the delta
   rather than re-verifying unchanged content from scratch.
2. Confirmed the `## Stack` table (Node.js, pnpm, create-vite, React/React DOM,
   Vite, @vitejs/plugin-react, TypeScript, oxlint, tr46, Vitest, Testing
   Library ×3, jsdom, @playwright/test, @axe-core/playwright) has **zero
   diff lines** — no version bumped, added, or removed.
3. Searched the full diff for every named technology/API/standard string, new
   or pre-existing, and checked each newly-introduced one against
   authoritative web sources for current existence and fit.

## Finding 1 — Stack table: no re-review needed, baseline carries forward

`git diff` on `ARCHITECTURE-SPINE.md` shows 7 hunks, none touching the
`## Stack` section (last hunk ends at the Architecture Gate Closure table,
line 292 of the new file, immediately before `## Stack` begins). Every Tier
1/2/3 finding in `review-technology-currency.md` (Node 24 LTS, create-vite
9.2.1, React/React DOM 19.3.0, Vite 8.3.1, @vitejs/plugin-react 6.1.1,
TypeScript 6.0.2 one-major behind by design, pnpm 12.5.1 and oxlint 1.81.0
mildly behind head, tr46 6.0.0, Vitest 5.0.1, Testing Library trio, jsdom
30.1.1, @playwright/test 1.63.0, @axe-core/playwright 4.13.0) still applies
unchanged as of 2026-09-29. No re-verification performed here beyond
confirming the diff is empty in that section — re-querying the registry for
identical strings would add no signal.

## Finding 2 — Three new named technologies introduced (AD-13), all verified

The update's AD-13 rewrite (Effects section) is the only hunk that names
technology not present in the prior revision. It adds:

- **"Clipboard API"** (spine line 231: *"Before invoking the Clipboard API,
  the executor cancels it if that value is no longer the current Copy
  source..."*) — this is `navigator.clipboard` (the W3C/WHATWG Clipboard API,
  async `writeText`). Verified current and broadly supported: Chrome 66+,
  Firefox 63+, Safari 13.1+ desktop and Safari iOS 13.4+, all still supported
  in 2026, secure-context (HTTPS) gated — which matches AD-10's
  HTTPS-only delivery and AD-9's no-external-sink posture. Fits the stated
  purpose (programmatic copy-to-clipboard from a browser workbench) with no
  fallback needed for any browser in AD-14's stated latest-two-major
  Chrome/Firefox/Edge/Safari matrix.
  — MDN `Clipboard/writeText` docs; caniuse `mdn-api_clipboard_writetext`.
- **"VoiceOver"** (spine line 237-238, listed alongside TalkBack as
  destinations for "persistent actionable guidance" on Copy failure) —
  Apple's built-in screen reader for macOS/iOS/Safari. Verified as still the
  default, actively maintained screen reader on Apple platforms in 2026 (~70%
  mobile screen-reader share per current usage surveys), a correct and
  current target given AD-14's Safari and mobile browser-AT matrix.
- **"TalkBack"** (same location) — Google's built-in screen reader for
  Android. Verified as still the default pre-installed Android screen reader
  in 2026 (~35% mobile screen-reader share), actively updated with Android
  OS releases, a correct and current target given AD-14's Chrome/mobile
  browser-AT matrix.

Neither VoiceOver nor TalkBack is a versioned dependency (they are OS-bundled
assistive technologies, not packages the project pins), so there is no
version-currency claim to check beyond "does this named technology still
exist and fit" — which it does for both, and they are the two AT stacks that
AD-14's existing "named desktop/mobile browser-AT matrix" language already
implied without naming. This update makes that implicit pairing explicit; it
does not introduce a new, unreviewed technical commitment.

## Finding 3 — No other new technology strings in the diff

The remaining six hunks (AD-3 percent-encoding profile rewrite, AD-5 token-key
clarification, AD-6 close-and-rebase sequencing, AD-8 epoch/generation
publication guard, AD-14 design-closed/evidence-pending wording, gate-closure
table wording) reference only technology already present and already
reviewed in the prior pass (WHATWG `URL`, percent-encoding/UTF-8, Web Worker —
all pre-existing strings, unchanged by this diff, confirmed via `git show
HEAD:...` grep against the new file). No newly invented API, library, spec,
or standard appears in these hunks.

## No Tier-4 (erroneous/unverifiable) findings

Nothing in the update names a nonexistent technology, misrepresents a
prerelease/beta as stable, or introduces a version/compatibility claim this
review could not confirm against an authoritative source.

## Sources consulted

- Local `git diff`/`git show` against the spine's prior committed revision —
  authoritative for "what changed."
- `review-technology-currency.md` (this workspace's prior pass, same as-of
  date) — authoritative baseline for the unchanged Stack table; not
  re-verified line-by-line here since the diff proves no Stack row changed.
- MDN `developer.mozilla.org/.../Clipboard/writeText` and
  `caniuse.com/mdn-api_clipboard_writetext` — Clipboard API support/currency.
- Web search corroboration for VoiceOver/TalkBack 2026 currency and platform
  share (`beaccessible.com` screen-reader usage statistics,
  `ood.ohio.gov` 2026 screen-reader advancements post) — secondary narrative
  confirmation that both remain actively maintained, default, current
  platform screen readers; not version-pinned dependencies so no registry
  check applies.
