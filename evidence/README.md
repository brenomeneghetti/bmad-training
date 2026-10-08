# URL Workbench execution evidence

`pnpm run evidence:run` performs a fresh build, lint, full Vitest suite, full
Node integrity/lifecycle suite and all Chromium workbench tests,
with zero retries. `node evidence/validate.mjs` checks the current publication.
No production dependencies or application logging/network/storage are added.

## Folder-local setup

Prefer checkout-local artifacts and caches. Necessary external runtime/tool
access and test-only browser prerequisites are authorized. Create local
directories and export these variables before installing the test browser or
running package commands. Use a supported Node 24/26 runtime:

```sh
mkdir -p .cache/{home,tmp,browsers,config,data,runtime,npm,pnpm}
export HOME="$PWD/.cache/home" TMPDIR="$PWD/.cache/tmp"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export XDG_CACHE_HOME="$PWD/.cache" XDG_CONFIG_HOME="$PWD/.cache/config"
export XDG_DATA_HOME="$PWD/.cache/data" npm_config_cache="$PWD/.cache/npm"
export XDG_RUNTIME_DIR="$PWD/.cache/runtime"
export PNPM_HOME="$PWD/.cache/pnpm" PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/browsers"
pnpm run test:e2e:install
pnpm run evidence:run
node evidence/validate.mjs
```

Missing host libraries may be installed through supported test tooling; report
permission or compatibility blockers explicitly. Do not change unrelated system
configuration. A failed or
cancelled owned attempt removes current success and retains `failure.json` plus
the available native JSON reports and separate command diagnostics under
`evidence/runs/<UUID>/`. It must not be called passing evidence.

## Contract and integrity model

- `contracts.mjs` independently pins complete argv, engine projects and hashed
  source inputs. Source identity includes application/tests, evidence code,
  inventory/coverage/schema, package/lock/config and repository instructions,
  plus present `public/` and `.env*` inputs. Every command measures source
  identity before and after execution; the supported Node engine range is enforced.
- `inventory.json` lists every exact runner/file/full-title/project identity
  and multiplicity, **including tests not mapped to cells**. It is a reviewed
  expectation; the producer never learns expected coverage from its own run.
- `coverage.json` maps all 40 mandatory cells to exact executed identities,
  including the approved Chromium browser project. File existence and matching aggregate counts
  cannot substitute for these identities.
- Story 3.1 adds exact-history restoration, guarded Draft preservation,
  accessible visible Undo, and private capacity restoration cells. Undo browser
  tests exercise every mutation type, exact IDs/values, branching, pointer
  cancellation, inactive focus, Search and invalid Draft selection, plus
  20,000-character/260-entry restoration measured below 100 ms.
  Visible Undo is inactive during text composition and re-enables when it
  settles. Composition tests use synthetic native events, not real OS IMEs.
  Native command logs retain original whitespace; `.gitattributes` excludes
  only those retained text reports from whitespace checks, without altering proof.
- Native reports, diagnostics and observed version command outcomes are hashed.
  Every command is bound to the same source/build/delivery identities. Paths
  reject traversal, absolute paths, symlinks and special files before reading.
  Path-relative digest inputs preserve identical-byte checkout relocation.
- Fresh objects use UUID directories. Revalidation precedes an atomic manifest
  rename, followed by another cancellation/ownership check. Final owner release
  is synchronous after the last cancellation check. Publication is
  logically immutable: any changed bytes invalidate hashes. This is **local
  integrity, not signed attestation** and does not defend against an operator
  deliberately rewriting all contracts and proof.

The exclusive owner lock is token checked. Overlap cannot invalidate the active
owner's success. A crashed runner's lock remains until explicit
`node evidence/run.mjs --recover-stale`; recovery requires demonstrably exited
PID (`ESRCH`), rejects active/unknown owners, and serializes recovery attempts.
An interrupted command remains unsafe to recover automatically: a dead runner
does not prove its descendants stopped. Investigate and stop any surviving
owned processes before resolving that lock manually.
An abandoned recovery lock requires operator investigation. Never delete locks
while their owners may be alive. Child groups are managed, awaited and stopped
on cancellation; they are not detached daemons. Abrupt SIGKILL is unrecoverable
without the explicit stale-owner operation.

## Operator checks that are still unverified

Chromium is the user-approved MVP target as of 2026-10-07. Firefox, WebKit and
additional released-browser targets are deferred to Epic 4; no current passing
manifest claims their coverage. Story 3.6 consumes this Chromium proof foundation.
Installed headless engines are **not**
latest-two-major released browsers, Windows/macOS/mobile coverage, real IMEs or
observed assistive technology. Axe, forced-colors/text-spacing and 320 CSS-pixel
tests do **not** establish zoom or manual-AT equivalence. Real 400% zoom is
post-MVP.

For each approved Windows/macOS/mobile released-browser target and both latest
major versions, record OS/device/browser/version, source/build/delivery identity,
operator/date and exact command/manual outcome:

- [ ] Exact Draft/selection, duplicate IDs, Last Valid chronology, field validation.
- [ ] Keyboard Search/Clear, Add/Remove/Move, boundary and fallback focus.
- [ ] Real native clipboard cut/paste without broad clipboard permissions.
- [ ] Real IME immediate/delayed final input, cancellation and later Domain/token
      edits; one publication and no stale caret overwrite.
- [ ] 20,000-character/260-entry editing, Search, dense Add/reorder response
      below 100 ms without omitted rows or page overflow.
- [ ] No URL-containing requests, persistence, production logs or traces.
- [ ] 320px reflow, forced colors, prescribed text spacing and pointer cancellation.
- [ ] Observe supported screen readers: separate parser/field errors, Last Valid
      source, polite operation announcements, no duplicate feedback or focus loss.
- [ ] Post-MVP: real browser zoom at 400%, including navigation, errors and focus.

Record each unchecked item as unverified; never infer a pass from synthetic events.
