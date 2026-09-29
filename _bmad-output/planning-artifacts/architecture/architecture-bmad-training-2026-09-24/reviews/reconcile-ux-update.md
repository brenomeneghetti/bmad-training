# UX Update Reconciliation — Architecture Spine

**Date:** 2026-09-29
**Architecture:** `../ARCHITECTURE-SPINE.md`
**UX sources:** `../../../ux-designs/ux-bmad-training-2026-09-24/DESIGN.md`, `../../../ux-designs/ux-bmad-training-2026-09-24/EXPERIENCE.md`
**Scope:** Reconciliation of the edited AD-3, AD-5, AD-6, AD-8, AD-13, AD-14, and architecture-gate statuses only. This is not a general architecture or UX review.

## Verdict

**NEEDS ACTION.** The update preserves the codec/raw-display, invalid-Draft, chronological-History, identity, and parse-supersession contracts. It does not fully preserve the UX contracts for focus fallback, feedback overflow/live-region timing and repeat behavior, clipboard-recovery lifetime, or gate enforcement timing.

## Mismatches Requiring Action

### 1. AD-13 replaces operation-specific focus rules with an incompatible generic fallback

**Architecture:** AD-13 resolves an absent or Search-hidden target by searching next, then previous, in visible source order, then focusing Full URL.

**UX:** `EXPERIENCE.md` requires operation-specific destinations:

- Remove first seeks the nearest row exposing the **same subcontrol**; if none, it focuses **Clear Search** when filtered survivors exist, otherwise the semantic after-list Add control, then the Structured View heading.
- Reorder at a new boundary moves focus to the enabled opposite Move control, then the row container/first editable control.
- Undo uses its transition table and, for a Search-hidden target, announces that the affected/restored item is filtered.

The generic AD-13 sequence can skip Clear Search, after-list Add, the Structured View heading, and the required same/opposite-subcontrol behavior. “Preserving the UX announcement rule” does not restore the missing target-resolution rules.

**Required action:** Make AD-13 delegate focus resolution to the complete UX operation/Undo transition table, or encode equivalent typed focus intents and per-operation fallback chains without replacing them with one universal next/previous/Full URL rule.

### 2. AD-13 no longer binds the complete live-region timing, repeat, persistence, and overflow contract

**Architecture:** AD-13 names separate queues and specifies a six-second overflow branch, but the update removed the prior explicit incorporation of the UX timing and repeat rules.

**UX:** `EXPERIENCE.md` requires, among other details:

- outcome insertion within 100 ms after settlement;
- at least two seconds of exposure per queued outcome;
- 300 ms coalescing windows only for result-count and synchronization classes;
- committed outcomes in FIFO order with precedence;
- prior-message removal only as the next node/text is inserted;
- tested child-node replacement or clear/reinsert behavior for identical repeats;
- validation announcement only on the defined commit/blur/Apply/settled-input triggers, never during intermediate IME composition;
- actionable failures persisting until retry, success, or relevant state change.

The new AD-13 overflow rule also keeps the currently exposed committed outcome outside persistent operation history while moving only pending and incoming outcomes. The UX rule says that, when the six-second bound would be exceeded, **every outcome** is exposed in persistent visible operation history and none is dropped. The architecture’s summary count therefore can exclude the currently exposed outcome from the persistent record.

**Required action:** Restore an explicit binding to all UX timing/repeat/persistence rules. Define overflow so all committed outcomes participating in the overflow condition—including the currently exposed one—are present exactly once in persistent operation history, with a summary count matching that set.

### 3. Clipboard recovery is created correctly but its required lifetime and native recovery path are not preserved

**Architecture:** AD-13 creates the exact selected safe-copy value and focus intent on a current clipboard failure.

**UX:** `safe-copy-readonly` must also:

- preserve Draft and History;
- support keyboard and native touch/VoiceOver/TalkBack copy;
- remain visible until the next Copy attempt or URL mutation;
- pair with persistent, platform-neutral actionable guidance;
- never report success on failure.

AD-13 does not bind the recovery field’s lifetime or native-device recovery path, and its actionable-alert queue has no explicit UX persistence rule.

**Required action:** Add the safe-copy lifecycle and native-copy requirements to AD-13 or explicitly incorporate the complete UX Clipboard failure and Feedback channels contracts.

### 4. Gate status weakens the UX implementation block to a release-only block

**Architecture:** AD-14 blocks release and labels AG-1 through AG-3 “design closed; implementation evidence pending.”

**UX:** The Architecture Gates section states that **implementation stories are blocked** until every gate passes its prototype or fixture exit criteria.

“Design closed; evidence pending” is compatible only if the implementation-story block remains explicit. AD-14 currently states only a release block, allowing downstream readers to treat the gates as deferrable until release.

**Required action:** State that AG-1, AG-2, and AG-3 evidence remains an implementation-entry gate as required by UX, or formally reconcile and update the UX lifecycle rule before weakening it. Keep AD-14’s versioned matrix, exact versions, artifact digest, matrix version, evidence links, and no-missing-cell requirements.

## Preserved Behaviors

| UX behavior | Result | Reconciliation |
|---|---|---|
| Invalid Draft | Preserved | AD-3 retains accepted malformed raw text with field error; AD-6 preserves invalid Draft exactly while structured changes operate on Last Valid. |
| Chronological History | Preserved | AD-6 explicitly closes baseline-to-last-valid first, appends each structured mutation separately, rebases correction on latest Last Valid, and makes Undo reverse the latest committed intent. |
| Parse supersession | Preserved | AD-8 binds input snapshot, generation, epoch, and committed revision; accepted product mutations invalidate pending parses atomically and stale completions cannot publish partial or stale state. |
| Codec/raw display | Preserved | AD-3 explicitly keeps non-domain Managed Pieces as raw component text, retains valid percent-triplet bytes/case, rejects broken triplets, preserves literal `+`, avoids Unicode normalization, and defines field-specific encoding profiles. |
| Stable identity | Preserved | AD-5 keeps immutable, non-recycled Piece IDs in snapshots and Undo, preserves Domain identity, and deterministically reconciles path/query IDs by exact-token LCS with defined tie-breaking. |
| Evidence breadth | Preserved, subject to gate-status fix | AD-14’s versioned no-missing-cell matrix covers every bound FR, NFR, UX case, and gate fixture, with browser/AT, performance, accessibility, privacy, clipboard fallback, exact versions, artifact digest, and evidence links. |

## Reconciliation Conclusion

AD-3, AD-5, AD-6, and AD-8 are aligned with the named UX behaviors. AD-13 needs correction for operation-specific focus, complete feedback/live-region semantics, overflow persistence, and clipboard-recovery lifetime. AD-14 and the gate table need to preserve the UX’s implementation-story block, not only the release block.
