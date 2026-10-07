---
title: 'Story 2.6: Edit the Full URL as One Continuous Intent'
type: 'feature'
created: '2026-10-06'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '5c5dc68f7f17ece282cc5dc67bfbbbedf22386ba'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Full URL textarea only reparses on an explicit "Apply URL" submit, and every reparse wipes mutation history and mints brand-new Path/Query IDs, so there is no way to type or paste continuously while keeping synchronized surfaces, stable piece identity, and a single committed history entry per editing session.

**Approach:** Make every valid Full URL keystroke parse and publish immediately (Current/Last Valid, Structured View, Search, Copy source) without appending history, using exact-token LCS reconciliation to keep Domain/Path/Query IDs stable across reparse; track one open focus session per textarea focus and collapse it into at most one baseline-to-last-valid `MutationEntry` when it closes (blur, Enter outside IME composition, or another product mutation beginning), guarded by existing generation/epoch/revision staleness checks.

## Boundaries & Constraints

**Always:**
- Reparse on every `inputChanged` while a Full URL focus session is open (no explicit "Apply" affordance); parsing starts synchronously and publishes only when generation/input/epoch/revision still match, exactly like the existing `parseStarted`/`parseCompleted` guard pair.
- On a successful reparse during an open focus session, reconcile against the session's current last-accepted-valid snapshot (not mint fresh IDs): keep `domainId` unconditionally; match Path by exact `rawSegment` and Query by exact `{rawKey, equalsPresent, rawValue}` (excluding `separatorBefore`) using longest common subsequence, earliest-old-then-earliest-new tie-breaking; unmatched new tokens get fresh non-recycled IDs via the existing `nextPieceId`/`createIdAllocator` sequence; removed IDs are never reused.
- Keep `history` and unchanged fields' revisions across every valid reparse. Assign fresh (`0`) revisions for newly minted IDs, drop removed IDs, and advance both Domain revisions when Full URL changes its host so stale commands cannot overwrite the new host.
- First valid intake establishes the initial snapshot and opens an edit baseline while typing continues. After Enter or an accepted structured mutation closes an edit, subsequent Full URL input starts a new edit against the latest Last Valid snapshot even without a DOM refocus; neither path resets existing history or stable identities.
- On focus session close (blur, Enter outside composition, or before any structured mutation begins), append at most one `MutationEntry` (`field: "full-url"`, `pieceId: baseline.domainId`) only when the baseline and last-accepted-valid snapshots differ by reference; then clear the open session. This close-and-append must run inside the reducer transaction that starts the next action, never relying on DOM event ordering.
- During IME composition, Enter/Shift+Enter only confirm composition: no apply, no close, no newline insertion, no mutation entry. After composition ends, Enter prevents its default newline and closes the session; Shift+Enter prevents its default newline and otherwise leaves text and session state unchanged.
- Loosen structured-editor gating so Path/Domain/Query controls stay enabled whenever a Last Valid snapshot exists, even while the Full URL draft currently differs from it (typing in progress or momentarily invalid), operating against the latest last-accepted-valid/Last Valid snapshot.
- Accepted structured mutations preserve a differing Draft exactly, including its selection and Full URL validation, while updating Last Valid and recording close-before-mutate chronology. Rejected/no-op structured commands create no journal entry and do not close a meaningful Full URL edit. Success feedback must identify Last Valid updates and unchanged Draft truthfully.
- Buffer Full URL composition input locally until composition ends; its intermediate values must not publish snapshots or new validation. Enter/Shift+Enter confirmation is IME-safe even when browser `isComposing` is false but the composition session remains open.
- Support the existing 20,000-character / 250+-Query-Parameter capacity with each valid keystroke's publish completing within 100 ms.

**Never:**
- Introduce debounced/deferred parsing that delays a valid keystroke's publish beyond the next reducer tick, or add a Web Worker (profiling has not shown the architecture's stated threshold exceeded).
- Touch Undo, Copy, or the Domain conversion pipeline (later/earlier stories); no drag-and-drop.
- Implement the full invalid-Draft narrative and exhaustive repeated-correction/race evidence -- those remain Story 2.7's scope. This story must nevertheless preserve Draft and existing journal entries safely; use the existing specific `state.problem.message` for brief invalidity and truthful Last Valid operation feedback.
- Reuse or duplicate Story 2.7's specific user-facing copy ("Structured View changes use the Last Valid URL.").

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Keystroke-by-keystroke valid edits | Textarea focused, each intermediate state is a valid Absolute URL | Every state publishes atomically; no new history entry per keystroke | N/A |
| Paste/replace whole URL then blur | Valid replacement text, then blur | One `[baseline→lastAccepted]` entry appended; Draft becomes the new baseline on next focus | N/A |
| Reparse reorders/removes a Path Segment or Query Parameter via raw text edit | Full URL text edited so pieces move/disappear/appear | Domain ID unchanged; matched tokens keep IDs via exact-token LCS; unmatched tokens get fresh IDs; no ID reuse | N/A |
| Blur with no change since focus | Baseline equals last-accepted-valid at close time | No history entry appended | N/A |
| Enter during IME composition | `isComposing` true | No apply/close/newline/mutation; composition proceeds natively | N/A |
| Enter after composition ends | Not composing | Newline suppressed; session closes per the Always rule | N/A |
| Shift+Enter (not composing) | Any Draft state | Newline suppressed; text and session otherwise unchanged; no close | N/A |
| Structured mutation begins while focus session open and unclosed | e.g. Remove Path Segment while Full URL still focused with pending changes | Reducer closes Full URL edit first (appending its entry if changed), then applies the structured mutation as a separate chronological entry | N/A |
| Stale scheduled parse completion arrives after newer input/mutation | Older `parseCompleted` generation/input/epoch/revision no longer match | Discarded; no text, rows, IDs, validation, or busy-state change | N/A |
| 20,000-char / 250+ Query Parameter paste | Capacity fixture | Reconciliation and publish complete within 100 ms; no omission or byte drift | N/A |
| First valid intake / typing after Enter without refocus | Empty intake becomes valid / prior edit has closed | Establish or rebase edit against latest Last Valid; keep identities and prior history | N/A |
| Invalid Draft and structured mutation | Valid A to B, invalid X, then accepted mutation S | Close `[A->B]`, append S separately, preserve X and validation exactly | N/A |
| Dense token sequences | Near-20,000-character Path or Query with duplicate tokens | Exact deterministic reconciliation within the core target without number-array quadratic allocation | N/A |

</frozen-after-approval>

## Code Map

- `src/core/url/parser.ts:123-125,53-78,81-101` (`parseLosslessUrl`, `scanPath`, `scanQuery`) -- add exported `reconcileLosslessUrl(previous: LosslessUrl, rescanned: LosslessUrl, ids: IdAllocator): LosslessUrl`: keep `rescanned.domainId` replaced by `previous.domainId`; run exact-token LCS (`rawSegment` for Path; `{rawKey, equalsPresent, rawValue}` for Query, excluding `separatorBefore`) between `previous.path`/`previous.query` and the freshly scanned arrays, remapping matched entries' `id` from `previous`, minting `ids.next()` only for unmatched entries, earliest-old/earliest-new tie-break order; return a new `LosslessUrl` with reconciled `path`/`query` and everything else from `rescanned`. Mirror `removeLosslessPiece`'s approach of returning the same object by reference when nothing actually changed (needed for the "no diff" close check).
- `src/core/session/session.ts:53-70` (`SessionState`) -- add `fullUrlFocus: { readonly baseline: LosslessUrl; readonly lastAccepted: LosslessUrl } | null`, initialized `null` in `initialSessionState`.
- `src/core/session/session.ts:35-43` (`MutationEntry.field`) -- extend union with `"full-url"`.
- `src/core/session/session.ts:72-91` (`SessionAction`) -- add `{ type: "fullUrlFocusBegin" }` and `{ type: "closeFullUrlEdit"; reason: "blur" | "enter" | "mutation" }`.
- `src/core/session/session.ts:234-249` (`inputChanged` case) -- no signature change, but must no longer be the only trigger for parsing; Workbench now auto-dispatches `parseStarted`/`parseCompleted` on every change (see below) instead of waiting for a submit.
- `src/core/session/session.ts` -- initial intake is identified by absence of any snapshot, not by absence of an open edit. First valid intake opens a baseline; later `inputChanged` reopens a closed edit against current Last Valid. Successful reparse reconciles against last accepted state, keeps history, and advances allocation only for new IDs. Host replacement also advances Domain revisions and removes obsolete Domain drafts.
- `src/core/session/session.ts` -- close and invalidate pending parsing when an edit commits. Validate structured commands and no-ops before closing; then append Full URL intent before the accepted structured entry in one transaction. Share structured publication and source-aware success helpers so each mutation preserves a differing Draft and validation consistently.
- `src/core/session/session.ts:781-799` (`prepareParse`) -- no structural change; still returns `start`/`complete()` built from current `input`/`generation`/`epoch`/`revision`.
- `src/core/contracts/identity.ts:3-12` (`IdAllocator`, `createIdAllocator`) -- reused as-is for minting unmatched-token IDs during reconciliation.
- `src/app/workbench/Workbench.tsx` -- synchronously dispatch input/parse transitions in the input event; use composition-local text and a composition ref to avoid intermediate publication and false Enter closure. Clear obsolete Search announcements when new Full URL input begins.
- `src/app/workbench/Workbench.tsx:185-198` (`apply` function, "Apply URL" button, `<form onSubmit>`) -- remove the explicit submit button/form; keep the textarea bound via `onChange`/`onFocus`/`onBlur`/`onKeyDown` only, per the three documented closing triggers.
- `src/app/workbench/Workbench.tsx:340-369` (Full URL `<textarea>` block) -- add `onFocus` dispatching `fullUrlFocusBegin`, `onBlur` dispatching `closeFullUrlEdit("blur")`, `onKeyDown` handling Enter/Shift+Enter per the IME rule (check `event.nativeEvent.isComposing`), update help copy to describe continuous sync instead of "Applying publishes all pieces together."
- `src/app/workbench/Workbench.tsx:67` (`editorsDisabled`) -- loosen from exact `state.input === state.snapshot?.serialized` equality to allow structured editing whenever `state.lastValidSnapshot` exists and `state.phase !== "no-session" && state.phase !== "parsing"`.
- `src/app/pieces/StructuredView.tsx` -- keep existing editing/focus contracts; a pending caret-restoration frame must not overwrite a newer explicit selection.
- `src/core/session/session.test.ts` -- reuse the existing `apply(state, input)` test helper pattern (lines 10-15) for new reconciliation/history/focus-session tests.
- `evidence/schema.json:36-44` -- extend `id` pattern to `2-[123456]`, `story` enum `+"2.6"`, `minItems`/`maxItems` to `32`.
- `evidence/manifest.json` -- add 4 Story 2.6 cells.
- `evidence/validate.mjs` -- update "through Story 2.5" to "through Story 2.6".
- `src/test/fixtures/semantic.ts` -- reuse `createCapacityFixture` for the 250+/20,000-char reconciliation capacity test.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- advance Story 2.6 through implementation.

## Tasks & Acceptance

**Execution:**
- [x] `src/core/url/parser.ts`, `src/core/url/parser.test.ts` -- implement `reconcileLosslessUrl` (LCS matching, domain ID preservation, fresh-ID minting, reference-equality no-op); test matched/unmatched/duplicate/tie-break/byte-preservation cases.
- [x] `src/core/session/session.ts`, `src/core/session/session.test.ts` -- implement `fullUrlFocus` state, `fullUrlFocusBegin`/`closeFullUrlEdit` actions, reconciliation-aware `parseCompleted`, `closeFullUrlEditIfOpen` close-and-rebase helper wired into every structured mutation case, stale scheduled-parse rejection; test one-entry-per-session squashing, no-diff no-entry, ID stability across reparse, close-before-mutate ordering, generation/epoch/revision staleness.
- [x] `src/app/workbench/Workbench.tsx`, `src/app/workbench/Workbench.test.tsx` -- remove the "Apply URL" submit button/form; wire auto-parse effect, focus/blur/keydown handlers, IME-safe Enter/Shift+Enter, loosened `editorsDisabled`; test continuous typing, paste/replace, blur-close, Enter/Shift+Enter (composing and not), close-before-structured-mutation, stale-parse races.
- [x] `src/test/fixtures/semantic.ts`, `tests/workbench.spec.ts` -- cover continuous Full URL editing at 20,000 chars / 250+ Query Parameters, keyboard/IME/AT/responsive/performance, duplicate-key reconciliation.
- [x] `evidence/schema.json`, `evidence/manifest.json`, `evidence/validate.mjs` -- require 4 new Story 2.6 cells, update log string.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` -- synchronize Story 2.6 after acceptance checks pass.

**Acceptance Criteria:**
- Given an active session and the developer focuses Full URL, when the focus session begins, then the reducer captures the committed baseline and initializes a last-accepted-valid snapshot for that session, and the textarea keeps its help text, minimum height, raw text, selection, and focus.
- Given successive valid Full URL states, when each is accepted, then Current/Last Valid, serialization, Structured View, piece totals/positions, Search, and Copy source update atomically and immediately, with no new history entry per intermediate valid state.
- Given Full URL reparsing changes Path/Query composition, when IDs are reconciled, then Domain keeps its ID, Path/Query reconcile independently by exact-token LCS with earliest-position tie-breaking, and no ID is reused.
- Given a valid paste/replace and the session closes, when closing happens, then exactly one baseline-to-last-valid `MutationEntry` is recorded regardless of input event count.
- Given an open Full URL session, when it closes via blur, non-composing Enter, or another product mutation beginning, then at most one entry is appended only if baseline and last-accepted differ, and the subsequent mutation runs after that close in reducer order.
- Given Enter/Shift+Enter during or after IME composition, when the key event is handled, then composition confirmation is never interrupted, no stray newline is inserted, and Shift+Enter never closes or mutates.
- Given a stale scheduled parse completion arrives after newer input or a mutation, when it resolves, then it is discarded without altering text, rows, IDs, validation, or busy state.

## Implementation Notes

- Implemented `reconcileLosslessUrl` (`parser.ts`) with a strict order-preserving longest-common-subsequence match (DP table + traceback, earliest-old/earliest-new tie-break), keyed on exact `rawSegment` for Path and `{rawKey, equalsPresent, rawValue}` (excluding `separatorBefore`) for Query; `domainId` is always forced from `previous`; unmatched new tokens mint IDs via the passed-in `IdAllocator`; returns the identical `previous` object by reference when `rescanned.serialized === previous.serialized`.
- **Design Notes deviation (documented, not a bug):** the non-frozen Design Notes section's illustrative example (`previous.path=[a,b]` reparsed to `[b,a,c]`, claiming both `a` and `b` keep their IDs as an "order-independent match by token") is inconsistent with true LCS, which can only match one of a reversed pair, not both -- a swap of two tokens' relative order can never be part of the same common subsequence. The frozen Boundaries & Constraints explicitly specify "longest common subsequence," so the implementation honors that literal, well-defined algorithm over the advisory example. Flagged here per the frozen-section-wins resolution rule; if the illustrated multiset-style behavior was actually intended, that would require a different (non-LCS) matching algorithm and should be renegotiated as a spec change.
- `session.ts`: added `fullUrlFocus: { baseline, lastAccepted } | null` to `SessionState`; `fullUrlFocusBegin` captures `state.snapshot` as both `baseline` and `lastAccepted` (no-op if no snapshot exists yet, i.e., first-ever intake still takes the fresh-ID initial-intake path, which is correct since there is no prior accepted snapshot to reconcile against). `parseCompleted`'s success branch forks on whether `fullUrlFocus` is open: open -> reconcile against `lastAccepted` with a counting `IdAllocator` wrapper (so `nextPieceId` only advances by genuinely new IDs), update `snapshot`/`lastValidSnapshot`/`fullUrlFocus.lastAccepted`/`tokenRevisions`/`structuredDrafts`, leave `history`/`epoch` untouched; closed -> unchanged fresh-ID/empty-history initial-intake behavior.
- `closeFullUrlEditIfOpen(state, reason)` is a pure helper invoked at the top of every structured-mutation reducer case (`removePiece`/`addQueryPiece`/`moveQueryPiece`/`structuredEdit`) before their existing logic, guaranteeing the close-and-append always precedes the mutation in the same reducer transaction, and from the `closeFullUrlEdit` action case directly. It appends exactly one `MutationEntry` (`field: "full-url"`, `pieceId: baseline.domainId`) only when `baseline !== lastAccepted` by reference.
- Loosened gating: the four structured-mutation reducer cases dropped their `phase !== "active" || input !== snapshot.serialized` guard in favor of `if (!state.snapshot) return state;` after closing any open focus session -- they now operate against the latest Last Valid snapshot regardless of the Full URL draft's current text/validity. `Workbench.tsx`'s `editorsDisabled` was loosened identically (`!lastValidSnapshot || phase === "no-session" || phase === "parsing"`).
- `Workbench.tsx`: removed the "Apply URL" `<form>`/submit button entirely. Auto-parse is wired as a synchronous dispatch chain inside the textarea's `onChange` handler -- computed locally via `sessionReducer`/`prepareParse` from the current render's `state` (not a `useEffect`, which the advisory Code Map suggested) so each keystroke's `inputChanged` -> `parseStarted` -> `parseCompleted` publishes in the same event, matching the existing `apply(state, input)` test-helper pattern already used by `session.test.ts`. `onFocus` dispatches `fullUrlFocusBegin`; `onBlur` dispatches `closeFullUrlEdit("blur")`; `onKeyDown` checks `event.nativeEvent.isComposing` first (no-op while composing, letting the IME handle Enter natively), otherwise always calls `preventDefault()` on Enter (so no newline is ever inserted by keyboard again) and additionally dispatches `closeFullUrlEdit("enter")` when not Shift+Enter.
- Test coverage added across all four layers: `parser.test.ts` (7 new `reconcileLosslessUrl` cases: reference-equality no-op, Domain-ID preservation, Path/Query LCS matching, duplicate-key tie-breaking, no-ID-reuse, 250+/20,000-char capacity within 100ms); `session.test.ts` (8 new cases covering focus-begin, continuous publish without history growth, ID reconciliation, `tokenRevisions` carryover, no-op close, close-before-mutation ordering, stale-parse discard, capacity); `Workbench.test.tsx` (58 "Apply URL" call sites removed, 7 tests rewritten for loosened gating/auto-apply, 5 new tests for continuous typing, paste+blur, composing/non-composing Enter, loosened-gating-in-the-DOM); `tests/workbench.spec.ts` (19 "Apply URL" call sites removed/adjusted, 5 new Playwright cases for the same user-facing behaviors in a real browser).
- Evidence: added 4 Story 2.6 cells (`story-2-6-reconciled-identity-lcs`, `-focus-session-history-squash`, `-ime-safe-keyboard-loosened-gating`, `-privacy-capacity`) to `evidence/manifest.json`; extended `evidence/schema.json`'s `id` pattern/`story` enum to include `2.6` and raised `minItems`/`maxItems` to 32; updated `evidence/validate.mjs`'s log string to "through Story 2.6"; also updated `evidence/validation.mjs`'s `requiredCells` map and `evidence/validate.test.mjs`'s fixture/cell-count assertions to stay consistent (not explicitly listed in the Code Map, but required for the evidence pipeline to actually pass with the new cells -- tightly coupled to the Code Map's `evidence/manifest.json`/`schema.json` changes). Rebuilt `dist` and recomputed the pinned `artifact.digest` in `evidence/manifest.json` to match.
- Interpretation choice (documented risk): the close check uses strict reference equality (`focus.baseline === focus.lastAccepted`) to decide whether to append a `MutationEntry`. This means a "type something then manually retype it back to the exact original text" sequence within one focus session still appends a history entry (because an intermediate reconciled object was produced and is no longer reference-equal to `baseline`, even though its serialized content matches). This is consistent with the frozen Design Notes' explicit "only compare to immediately-prior step" chaining requirement and the I/O matrix's literal "Baseline equals last-accepted-valid at close time" wording, and is explicitly out of scope per the Never rule deferring the full invalid-Draft/chronological-rebase narrative to Story 2.7.

- 2026-10-07 repair, superseding the initial implementation account where it differs: Initial valid intake now initializes the edit baseline, and `inputChanged` starts a new baseline from latest Last Valid after Enter/structured close without refocus. Rejected/no-op structured commands leave the open edit untouched; accepted commands close it and append their own entry chronologically. Shared publication preserves differing Draft text and validation, and operation messages identify Last Valid truthfully. Closing also invalidates pending parsing, including initial intake before a snapshot exists.
- Replaced number-array LCS with bit-parallel suffix lengths and lexicographically earliest feasible old/new matching. Exhaustive small-sequence oracle coverage includes `[a,b] -> [b,a]` and `[b,a] -> [a,a]`; dense duplicate Path/Query fixtures near 20,000 characters each meet the core 100 ms threshold. A real Chromium fixture measures publication within 100 ms at 20,000 characters/260 entries.
- Full URL composition is buffered locally; confirming Enter checks the open composition ref, native composition flag, and browser key-code fallback. Host replacements retain Domain identity but advance both field revisions and discard obsolete Domain drafts. Search announcements from older Full URL input are explicitly cleared.
- Reproduced the previously unspecified browser failure at `tests/workbench.spec.ts`'s absent-value clearing assertion. A delayed `requestAnimationFrame` caret restore could overwrite a newer Select All selection, causing Delete to become a boundary no-op. Narrow guards in both structured editor variants preserve newer non-collapsed selections. A deterministic component regression and 12 consecutive browser repetitions pass after the repair; this is not dismissed as environment flakiness.
- Matrix audit: existing parser/session/Workbench/browser tests plus the added lifecycle, all-five-mutation Draft preservation, pending-parse closure, composition, exact-tie oracle, and capacity fixtures executed and passed. Evidence negative tests now check each of the four new mandatory cells, not only one representative. No dependencies or tools were installed.

## Spec Change Log

None -- implementation followed the frozen Intent/Boundaries/I-O-Matrix as written with no deviations requiring a spec amendment. One advisory Design Notes illustration was identified as inconsistent with the frozen "longest common subsequence" requirement and resolved in favor of the frozen text (see Implementation Notes); this is a note on the non-binding Design Notes appendix, not a change to the frozen contract.

- 2026-10-07, iteration 1: The human approved clarifying first-intake/post-Enter lifecycle and invalid-Draft preservation, and explicitly authorized in-place repair instead of revert/re-derivation. Amendments distinguish initial session intake from edit closure, preserve Draft and chronology, require executable lifecycle/IME/capacity evidence, and prevent stale Domain commands after host changes. Avoided known-bad states: erased journals, regenerated Domain IDs, destroyed Drafts, incorrect LCS ties, and quadratic number-array allocation. KEEP: lossless serialization, non-recycled unmatched IDs, exact independent path/query keys, reducer-owned atomic publication, and existing structured focus behavior.

## Review Triage Log

The initial independent review was interrupted before its verification-gap layer completed. On 2026-10-07, the human authorized direct review after resumed reviewers could not access the temporary diff and the runtime refused follow-up messages to synchronous agents. The rows below triage the initial findings and the resumed direct review. Story 2.6 remains in review; prior passing suites did not prove all acceptance criteria.

| Finding | Verdict | Evidence and route |
|---------|---------|--------------------|
| Initial blind 1: locally computing `inputChanged` duplicates reducer logic | false | The caller invokes the same pure reducer, not a second implementation; no divergent transition was demonstrated. Separate batched changes would require their own concrete race reproduction. |
| Initial blind 2: transient errors cause interrupting live announcements | false | `ValidationMessage` renders a plain associated paragraph, not an alert or live region. No claimed interrupting announcement was demonstrated. |
| Initial blind 3: only one new evidence cell has a negative test | medium | The test named "every Story 2.6 cell" exercises one ID, although the validator has a required-cell map. Direct review confirms incomplete coverage, not an actual acceptance bypass. Route: bad_spec, make every new cell's negative checks executable. |
| Initial blind 4: colon-bearing IDs corrupt draft-key extraction | false | Extraction uses the last colon, so colons inside the ID remain intact; current IDs are `piece-N` anyway. |
| Initial blind 5: quadratic LCS lacks path-heavy capacity coverage | high | A supported 20,000-character URL can contain nearly 20,000 empty path segments. Two full number-array dimensions can allocate hundreds of millions of cells for a one-character edit. Existing fixtures exercise only 260 query entries. Route: bad_spec, require bounded-memory reconciliation and dense-path/dense-query evidence. |
| Initial blind 6: exact textual revert does not necessarily restore IDs | false | Removed IDs must never be reused. Reconciliation is between consecutive valid states, not the focus-entry baseline. This behavior follows the explicit identity contract. |
| Initial blind 7: unused close reason masks behavior | false | All three specified reasons perform the same close operation. No reason-specific missing behavior was identified. |
| Initial blind 8: Enter without focus has no tested submit equivalent | false | Initial intake now parses on change; Enter only closes an existing edit. A close with no open edit intentionally returns unchanged state. |
| Initial blind 9: browser Enter coverage is absent | false | `tests/workbench.spec.ts` contains a real-browser Enter case. Direct review separately finds that it checks text and row counts, not session closure or history preservation. |
| Initial blind 10: dangling `waitFor` import | false | Direct search confirms two remaining `waitFor` calls in `Workbench.test.tsx`; the import is used. |
| Initial blind 11: unspecified transient browser failure | maybe-false | The prior account names neither the failed assertion nor a reproducible failure. Need retained failure output and a repeated run to establish a defect. Route: defer, unverified medium if recurring. |
| Initial blind 12: help does not explain Last Valid during invalid Draft | medium | The UI enables structured operations while showing invalid text, without explaining their source. This is user-visible; grouping with the reproduced invalid-Draft loss. Route: intent_gap because the frozen exclusions postponed the narrative while enabling the behavior. |
| Initial edge 1: focus before first valid intake never initializes editing | high | `story-2-6-review.test.ts` reproduces Domain ID changing from `piece-3` to `piece-6` on the next valid edit without refocus. Route: bad_spec; the Code Map equates no open edit with fresh intake. |
| Initial edge 2: unreachable `structured-edit-unavailable` code | low | The old guard's removal leaves an unused error-code union member; no current caller branches on it. Direct deletion can be retained as a patch after higher-priority loopbacks. |
| Initial edge 3: claimed continuous identity does not hold on first intake | high | Same reproduced first-focus defect as initial edge 1; group with that root cause, without dropping this finding. Route: bad_spec. |
| Direct 1: typing after Enter wipes history and identities | high | The regression test closes a valid edit with Enter, then parses another valid change without refocus; expected one prior journal entry, received an empty array. Route: bad_spec; parsing with `fullUrlFocus === null` is incorrectly treated as fresh intake even when a session already exists. |
| Direct 2: structured mutation destroys invalid Draft | high | The regression test starts at valid A, accepts valid B, then enters `https://` and adds a parameter. The reducer replaces Draft with `https://example.com/b?x=1&` and clears its error. Route: intent_gap; enabled invalid-Draft controls plus frozen deferral permit data loss contrary to the story's intent and original Epic 2.6 criterion. |
| Direct 3: LCS tie-break chooses later old position | high | For old path `[a,b]` and new `[b,a]`, the regression test expects old `a` retained; the implementation retains old `b` and gives `a` `piece-100`. Route: patch; prefer skipping the new position on equal suffix lengths. |
| Direct 4: lifecycle tests assert rows/text, not history | high | Existing component/browser tests pass despite both reproduced first-focus and post-Enter failures. The new four-regression suite fails all four cases. Route: bad_spec; verify identities and journal transitions at the actual UI boundary. |
| Direct 5: IME test does not prove no validation/publication during composition | medium | The existing composing-Enter component case only checks no throw and unchanged text; no Full URL composition lifecycle handler buffers intermediate changes. Route: bad_spec; add composition fixtures and assert session, validation, and journal behavior. |

**Human resolution:** Approved the clarified frozen contract and in-place repair on 2026-10-07. The four reproduced regressions were integrated into the existing parser/session suites, with all structured mutation kinds covered. The temporary review-test file was removed. Independent review was waived in favor of direct review for this continuation.

**Final disposition:** All verified surviving findings were corrected and directly reviewed; no unresolved finding was deferred. The formerly unverified browser-flake report was reproduced, root-caused, and corrected. Additional stale-Domain and caret-selection regressions passed. Automated browser coverage is Chromium as configured by the repository; native-IME/manual and wider browser certification remain release-level evidence, not claims made by this run.

## Design Notes

- **Reconciliation data shape:** `reconcileLosslessUrl` should accept the *previous accepted* `LosslessUrl` (not the committed `snapshot` from before the focus session began) so that mid-session reconciliation chains correctly keystroke-to-keystroke, e.g.:
  ```
  previous.path = [{id:"piece-3", rawSegment:"a"}, {id:"piece-4", rawSegment:"b"}]
  rescanned.path = [{rawSegment:"b"}, {rawSegment:"a"}, {rawSegment:"c"}]
  // Earliest-old LCS keeps "a"->piece-3.
  // "b" and "c" receive fresh IDs; result order follows rescanned.
  ```
- **Close-and-rebase placement:** implementing `closeFullUrlEditIfOpen` as a pure state-transform helper invoked at the top of each structured-mutation reducer case (rather than as a separate dispatched action from the UI layer) is what guarantees the close always precedes the mutation in the same transaction, independent of React event timing or batching.

## Verification

**Commands (run and confirmed in this session):**
- `pnpm exec tsc -b` -- clean, no errors.
- `pnpm exec vitest run` -- 217/217 tests pass across 5 files, including first-intake/post-Enter history/identity, all structured mutation kinds during invalid Draft, stale Domain revisions, pending parse closure, composition, exact-tie oracle, dense-token capacity, and delayed-caret selection regressions.
- `node --test evidence/validate.test.mjs` -- 8/8 pass, including the new "requires every Story 2.6 cell to remain mandatory and passing" regression test.
- `npm run build` -- clean production build (`tsc -b && vite build`).
- `node evidence/validate.mjs` -- validates 32 mandatory evidence cells against artifact `d9e09372ff31803317c77eb499636e3439fb72df0207d8ff90f42fbdffbd0f78`.
- `pnpm exec playwright test tests/workbench.spec.ts` -- 22/22 Chromium browser tests pass. The previously failing structured-selection fixture additionally passed 12 repetitions after its race fix.
- `pnpm run lint` and `git diff --check` -- clean.
