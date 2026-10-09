# URL Workbench execution evidence

`pnpm run evidence:run` performs a fresh build, lint, full Vitest suite, full
Node integrity/lifecycle suite and all Chromium workbench tests,
with zero retries. `node evidence/validate.mjs` checks the current publication.
No production dependencies or application logging/network/storage are added.
The execution manifest remains version 2. Story/release records use schema 1,
reviewed matrix 2 and evaluator `3.6.2`; they extend the same oracle.

## Three distinct decisions

```sh
pnpm run evidence:validate                 # Chromium MVP only
pnpm run evidence:story -- 3.5             # mapped mandatory external cells
pnpm run evidence:release                  # every release cell and delivery proof
pnpm run evidence:release -- --input evidence/release-evidence.json
```

MVP success never asserts release readiness. Story success requires observed,
not synthetic, records and cannot authorize promotion or record human acceptance.
The checked-in release contract has 92
stable mandatory cells: 64 individually identified FR1–FR16, NFR1–NFR17,
UX-DR1–UX-DR28 and AG-1–AG-3 requirements, eight released-browser major slots,
12 OS/browser/AT slots, and eight specialized cells. Numbered requirements,
browser/native/keyboard observations, privacy, performance and critical-summary
cells conservatively map to every listed story; the UJ-1 study and delivery
cells map to Story 3.6 and the complete release decision. This intentionally
does not infer narrower requirement/story mappings from test counts. Narrowing
the reviewed mapping requires a deliberate matrix-version change.

`releaseCells()` expands only the reviewed contract, not executed reports.
Each cell's fixture identity is `<cell-id>-v<matrix-version>`. The 56 preceding
MVP cells and their prior application test identities are preserved; Story 4.1
adds four mandatory MVP cells (60 total). Foundation coverage
also explicitly maps evaluator regression identities. These regressions prove
gate behavior, **not** external release observations.

No external observations are presently supplied. Release evaluation therefore
exits 1, identifies each missing reviewed cell and emits **no authorization**.
Approved Epic 5/manual deferrals remain release-blocking, not waived passes.
On 2026-10-09 the user reassigned the former Epic 4 browser-validation scope to
Epic 5 and assigned Epic 4 to the approved UI/UX redesign. This numbering change
does not alter evidence identities, historical results, or coverage claims.
Story 3.5 remains pending human acceptance.

## Supplying external observations

The operator supplies `evidence/release-evidence.json`, conforming to
`schema.json#/$defs/releaseEvidence`. It contains `schemaVersion`,
`matrixVersion`, `evaluatorVersion`, `provenance` (`observed` or `synthetic`),
the current execution `runId`, `sourceDigest`, `artifactDigest`, and `records`.
Every record reference is exactly:

```json
{
  "cellId": "release-performance-reference",
  "path": "evidence/observations/<sha256-of-record-bytes>.json",
  "hash": "<sha256-of-record-bytes>"
}
```

Place the actual JSON record at that content address. Source files, test counts,
unresolved paths, symlinks, duplicate/unknown cells and mismatched bytes cannot
substitute for records. Records conform to `schema.json#/$defs/releaseRecord`
and carry the reviewed cell/kind/requirements/stories/fixture/owner-role,
owner, channel, result, provenance, matrix/evaluator versions, execution and
artifact bindings, timestamp, tested OS/browser versions and critical counts.
Only `pass` satisfies a mandatory cell; skipped, failed, deferred and waived
records cannot satisfy it. Unsupported metadata and stale records block success.

Each record's `signOff` must contain its owner as `attestor`, an ISO date-time,
`approval: "approved"` and a nonempty `signature`. Participant records also
require dated approved signatures. These are **self-reported signed
attestations, not independently authenticated identities or cryptographic
signature verification**. An authorized evidence owner must establish trust
in the attestors outside this local gate; deliberately rewriting all contracts
or fabricating signed observations is outside its integrity guarantees.

Observations must be no earlier than the tested execution publication, no
later than evaluation, and at most 30 days old. Sign-off must be at or after
the observation. `release-version-baseline` additionally supplies
`details.latestMajors` for Chrome/Firefox/Edge/Safari and `details.checkedAt`
within seven days of evaluation. Its browser owner attests the current
released-major baseline; this gate does not contact a vendor to authenticate
that claim. Every tested browser version must belong to those latest two majors.

Specialized `details` shapes are deliberately exact:

- Requirement: `{ verified: true, observation: "<operator observation>" }`.
- Browser: `releasedBrowser` and `wholeJourney`, both true; exactly the
  cell's browser and latest/previous major in `testedVersions`.
- Native manual: every reviewed `manualChecks` key true, exactly the specified
  OS/browser/major/AT and explicit OS/AT versions. The keys include native
  keyboard/IME/clipboard, focus, feedback/failures, pointer/touch, 320px reflow,
  real 400% zoom, colors/spacing/contrast/reduced motion and WCAG 2.2 AA.
- Keyboard-only: all manual checks plus `keyboard-only`, true, with the exact
  Windows/macOS target and `at: "none"`.
- Performance: `hardware: { logicalCpus, ramBytes, model }` with at least four
  logical CPUs and 8 GB (`ramBytes >= 8000000000`);
  `fixture: { characters: 20000, queryEntries: 260 }`;
  nonempty `measurementMethod` describing the clock, timing boundaries and
  collection procedure;
  nonnegative `initialParseMs <= 1000`; and exact `operationsMs` keys for
  Search/edit/Add/Remove/Reorder/Undo/Copy, each nonnegative and `<= 100`.
- UJ-1: `journey: "UJ-1"`, unique `roster`, exact `participants`,
  `unassistedCompleters` and `totalParticipants`. All 5–8 participants must
  be representative developers and supply identity, completion, assistance
  (`none`/`provided`), sign-off and every reviewed `journeySteps` outcome
  (`completed`/`assisted` booleans). Each participant's sign-off attestor must
  equal that participant's identity. Count the full roster denominator;
  assistance makes the whole journey unsuccessful. Integer comparison
  `unassistedCompleters * 10 >= totalParticipants * 9` avoids rounding.
  Thus with 5–8 participants, all must complete unassisted.
- Critical summary: exact `totals` for synchronization, Undo/identity/focus
  and stale Copy, and sorted `channels` of every other supplied record.
  Every record/channel must have zero critical failures; a passing summary
  cannot hide a contradictory detail or a failure in an out-of-scope channel.
- Privacy: `checks` contains every reviewed `privacyChecks` key true
  (prohibited network/logging/storage/traces/error hooks, reload and close),
  and exact `clipboardSources` (`current`, `last-valid`, `recovery-attempt`).
  The execution oracle independently preserves CSP `connect-src 'none'`.
- Delivery: see the authorization contract below.

`createReleaseFixture()` is test-only and labels the envelope **and every
record** `synthetic`. Complete fixtures can satisfy evaluator branches but
cannot produce a release authorization; simply relabeling the envelope fails
provenance checks. The operational story CLI likewise rejects synthetic proof.
The observed-path positive test is also synthetic test
data and does not establish that this checkout has delivery or release proof.

## Content-addressed promotion authorization (no deployment)

`release-delivery-promotion` requires an attested HTTPS delivery observation
with matching tested/delivered bundle-tree and header digests, the exact
delivery-policy hash, no-cache HTML, a complete exact asset list with
content hashes and immutable cache controls, fingerprinted asset paths, and
`promotion: "identical-tested-bytes-no-rebuild"`. Its rollback object requires
`atomic: true`, `observed: true`, `priorArtifact` and `priorHeaders` hashed
attachments at `evidence/attachments/<sha256>.<extension>`, and matching
`restoredArtifactHash`/`restoredHeadersHash`. Both prior artifact and headers
must be available and digest-verified, not just claimed hashes.

Only an all-pass **observed release** decision publishes
`evidence/authorizations/<sha256>.json`, conforming to
`schema.json#/$defs/promotionAuthorization`. The CLI re-evaluates before writing,
never overwrites a different existing object and prints its content address,
not observation text. Authorization binds the execution manifest, source,
bundle, headers, delivery policy, reviewed contract, external input and exact
record digests, cache policy, HTTPS, no-rebuild promotion and atomic rollback.
It expires at the earliest observation/baseline expiry. Consumers must
verify its content address, expiry and every binding against the identical
artifact/headers at time of use; a retained old object is not current authority.

No hosting adapter is implemented, no application artifact is rebuilt on
authorization, and nothing is deployed. Actual HTTPS promotion and atomic
rollback remain **unproven and release-blocking** until concrete attested
delivery observations are supplied. The declarative `static-delivery.json`
is policy, not execution proof.

Gate CLI diagnostics contain only stable codes and reviewed cell identifiers,
such as `REQUIRED_RECORD_MISSING:release-uj-1-study`,
`RECORD_INTEGRITY:release-fr1`, `PERFORMANCE_INVALID` or
`DELIVERY_PROOF_INVALID`; they never echo participant/submitted content,
untrusted paths or raw exceptions. Execution-runner failure diagnostics also
persist only stable codes. Native command reports remain separate retained
execution objects, not submitted application data.

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
  Authoring order is immaterial: exact identity/multiplicity comparison uses
  the same canonical ordering on both inventories.
- `coverage.json` retains the preceding 56 cells and adds four Story 4.1 cells
  (60 total), mapping exact executed identities,
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
- Story 3.2 adds independent platform/chord/native-ownership routing, logical
  operation focus, filtered invalid-Draft preservation, and reducer-owned serial
  claim/acknowledgement cells. Both Undo paths exercise every operation; adapter
  and reducer tests cover missing, stale, cancelled and duplicate effects. Dense
  shortcut restoration retains all 260 entries and measures below 100 ms without
  privacy sinks. Workbench integration injects MacIntel, Win32 and Linux platform
  values to verify the application's modifier detection, not only helper policy.
  Filtered Add reversal checks earlier visible survivors and no-results fallback
  through both activation paths, preserving invalid Draft selection and errors.
  Synthetic composition and injected platform policy do not prove
  real OS keyboard/IME or manual assistive-technology coverage.
- Story 3.3 pins exact Current/Last Valid Copy, stale/serial claims, typed
  clipboard failure and the private 20,000-character/260-query capacity cells.
  Clipboard tests use an injected browser-local adapter, a three-second timeout,
  and an unresolved-write fence released only on native settlement. They prove
  no overlap or late success and safe subsequent retry, not
  native OS clipboard access. Successful Copy does not add History or move editor
  focus; keyboard activation retains ordinary blur.
- Story 3.4 pins exact attempted Current/Last Valid recovery, its lifecycle,
  race/focus ownership, and private capacity. Actionable failures expose a labeled
  read-only field and native keyboard/device-copy instructions. Current failures
  focus/select only after the recovery DOM mounts and only if no intervening
  interaction, composition, mutation or newer attempt supersedes focus. Window
  blur, visibility changes, wheel input and external programmatic focus also
  cancel delayed focus. Search
  and focus retain recovery; retry and URL/Draft mutation clear it atomically.
  Recovery focus leaves the editor without creating History. Timeout/fenced
  recovery stays owned by the newest attempt; late resolve/reject only releases
  the unresolved-write fence. Guidance warns that an irrevocable pending write
  may overwrite manually copied text. Pointer retry from recovery keeps a
  connected Copy focus target; deliberately leaving recovery for another
  control closes any suspended Full URL intent, while returning directly to
  Full URL preserves it. Chromium tests check all typed failures, native
  selection, reload clearing, private 20,000-character/260-query completeness,
  Current/Last Valid settlement-to-selected-recovery below 100 ms at 320px,
  keyboard failure activation, axe, forced-color focus, text spacing
  and 320px reflow without weakening CSP. Integrity/lifecycle negative tests
  reject missing cells and unexecuted exact recovery identities. These are
  injected clipboard outcomes and synthetic events, not native clipboard,
  manual AT/IME, OS/mobile or additional-browser proof.
- Story 3.5 pins reducer-owned per-class feedback scheduling, 300 ms same-class
  pending coalescing, committed FIFO precedence, two-second selected exposure,
  and strictly-greater-than-six-second exact-once overflow promotion. Persistent
  feedback history is separate from mutation History and Undo. Dedicated polite,
  assertive validation and actionable-failure outputs remain independent.
  Tests check actual child-node replacement, retained field help/error references,
  300 ms settled validation, explicit resubmission, synthetic IME, stale parse
  guards, exact Copy recovery and operation-defined focus. Chromium tests use
  controlled clocks for deterministic timing and a real monotonic measurement
  for below-100-ms Copy publication at 20,000 characters/260 queries, with
  privacy sinks, reload clearing, axe, forced colors, reduced motion and 320px
  text-spacing reflow. Missing cells and unexecuted identities fail integrity
  checks. These are DOM/browser observations, not actual AT speech or native
  clipboard/IME, OS/mobile or additional-browser certification. Release
  certification remains Story 3.6.
- Story 4.1 adds `dark-foundation`, `contextual-actions`, `accessible-reflow`
  and `private-capacity` cells. Exact Chromium identities measure all 14 colors,
  eight typography roles, 10px/16px radii, rendered contrast, 3px focus/offset,
  44px controls, 100px Full URL, the 700px adjacency breakpoint, text spacing
  and system-color fallback. Two-section/Copy-then-Undo order, completed pointer
  cancellation, exact Current/Last Valid recovery and private 20,000-character/
  260-query Copy/reorder/Undo are exercised; existing timeout/race and broader
  baseline operation identities remain mandatory. Missing cells or unexecuted
  identities fail closed. Single-list, duplicate Add and permanent Move remain
  until later Epic 4 stories; unused later-behavior tokens prove no capability.
  Chromium timings do not replace recorded reference-hardware release evidence,
  and injected clipboard, emulated forced colors and narrow viewports do not
  prove native OS clipboard/IME, manual AT, real zoom, mobile or other browsers.
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
additional released-browser targets are deferred to Epic 5; no current passing
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
