# Adversarial Divergence Review — Architecture Spine

**Artifact:** `ARCHITECTURE-SPINE.md`
**Mode:** Validate only; the spine was not modified.
**Mechanical check:** `lint_spine.py` passed with zero findings.

## Verdict

**Gate fails for independent implementation.** The spine closes many earlier seams—single reducer ownership, an explicit query-entry shape, pinned IDN options, deterministic LCS tie-breaking, revisioned effects, and provider-neutral promotion—but seven genuine divergence holes remain. No Critical finding was identified.

## Critical

None.

## High

### H1 — The shared codec does not define the complete per-component encode/validation profile

**Spine evidence:** lines 56–64 and 71–78.

AD-3 fixes raw component text, preservation of valid percent triplets, and encoding of literal structural delimiters and Unicode. It does not decide the treatment of other URL code points whose raw/encoded acceptance varies by component, including spaces, controls, backslash, quotes, and characters covered by WHATWG percent-encode sets.

**Two compliant but incompatible implementations**

- **Unit A — `core/url/codec`:** accepts a newly entered path segment `a b` and serializes it as `a%20b`, using the WHATWG path percent-encode set in addition to the explicitly required delimiter/Unicode rules.
- **Unit B — `app/pieces` + the same shared codec:** treats raw space as an invalid Managed Piece draft because AD-3 only requires encoding structural delimiters and Unicode; it refuses the commit rather than producing `%20`.

Both preserve existing `%HH`, reject malformed triplets, avoid double encoding, and never introduce a literal structural delimiter. They nevertheless expose incompatible editor behavior and serializers.

**Smallest tightening:** Name one exhaustive encode/validation table per managed component (`path-segment`, `query-key`, `query-value`, and any editable fragment), preferably by binding each to a specific WHATWG percent-encode set plus explicit exceptions. Add normative vectors for space, controls, `\`, `"`, `<`, `>`, `%`, `+`, Unicode, and every structural delimiter.

### H2 — “Exact token” does not define the identity reconciliation key

**Spine evidence:** lines 101–109, especially lines 106–108.

AD-5 specifies independent path/query LCS reconciliation and deterministic tie-breaking, but it does not define which fields constitute an “exact token.” Query entries contain boundary metadata (`separatorBefore`) as well as semantic raw fields.

**Two compliant but incompatible implementations**

- **Unit A — query identity reconciler:** compares the complete query-entry record except `id`, including `separatorBefore`. Changing `?a&b` to `?x&a&b` gives the old `a` entry no match because its separator changes from empty to `&`; it receives a fresh ID.
- **Unit B — query identity reconciler:** compares `{rawKey, equalsPresent, rawValue}` and treats `separatorBefore` as boundary metadata. The same edit preserves both old `a` and `b` IDs.

Both use exact-token LCS, apply the required tie-break, allocate fresh IDs to unmatched tokens, and never recycle IDs. Focus, field drafts, validation IDs, and React identity still attach to different rows.

**Smallest tightening:** Define the exact LCS comparison projection for path and query entries, explicitly stating whether delimiter-presence metadata participates. Add before/after ID maps for front/middle insertion, deletion, separator-only changes, duplicates, and reorder-like replacements.

### H3 — A non-Full-URL mutation does not necessarily invalidate an in-flight parse

**Spine evidence:** lines 116–125 and 142–148.

AD-8 makes parse generation reducer-owned and rejects stale generations, while AD-6 atomically closes Full URL editing before another product command. Neither rule says that a structured mutation, Undo, or other product command supersedes the currently scheduled parse or changes the parse acceptance predicate.

**Two compliant but incompatible implementations**

- **Unit A — parse scheduler:** increments generation only for Full URL input. A pending parse of Draft `D` remains current after `editPiece`; when it completes, it publishes `D` and replaces the structured mutation’s newer snapshot.
- **Unit B — session reducer:** invalidates the pending generation during every non-Full-URL product transaction. The identical parse completion is discarded after `editPiece`.

Both keep generation in `core/session`, return complete parse results only, discard numerically stale generations, and perform the close-and-mutate transaction required by AD-6. They produce different committed state and History.

**Smallest tightening:** Define the parse-result acceptance predicate as a conjunction of current session epoch, generation, exact Draft/input snapshot, and originating committed revision. Require every superseding product command to invalidate the pending parse in the same reducer transaction.

### H4 — Effect ID order does not determine concurrency, acknowledgement order, or stale-outcome behavior

**Spine evidence:** lines 206–214 and the state-mutation convention at line 240.

AD-13 requires execution “in ID order,” one acknowledgement, and rejection of stale revisions. It does not say whether order governs start, completion, or acknowledgement; whether different effect kinds may overlap; when acknowledgement occurs; or whether stale clipboard/focus outcomes are merely pruned or may still create feedback/recovery state.

**Two compliant but incompatible implementations**

- **Unit A — serial executor:** starts effect `n+1` only after effect `n` completes and is acknowledged. A slow Clipboard API call blocks later focus and status effects.
- **Unit B — ordered-start executor:** starts effects in ID order but allows promises to settle and acknowledge out of order. Later focus/status effects can complete before Clipboard. On a stale Copy failure it acknowledges and suppresses recovery.

Both execute after commit, initiate in increasing ID order, acknowledge every effect once, and prevent a stale revision from changing committed URL state. Their focus, safe-copy recovery, and announcements differ observably.

**Smallest tightening:** Specify per-kind concurrency, whether ID order applies to start/completion/acknowledgement, the exact acknowledgement transition, pruning rules, and a stale-outcome matrix. State whether a stale Copy success/failure is silent, informational only, or creates recovery for the originally attempted serialized value.

## Medium

### M1 — Reducer-owned feedback queues inherit an unresolved overflow state machine

**Spine evidence:** lines 212–214 and source-precedence line 235. The referenced UX rule is `EXPERIENCE.md` lines 106–112.

The spine delegates timing and repeat behavior to UX while assigning queue ownership to `core/session`. The UX overflow sentence does not decide, at the transition that predicts a greater-than-six-second FIFO start, which existing/new outcomes remain queued, move to persistent operation history, or are represented by the summary.

**Two compliant but incompatible implementations**

- **Unit A — feedback reducer:** on overflow, drains all queued committed outcomes into persistent operation history, clears the FIFO, and enqueues one count summary.
- **Unit B — feedback reducer:** keeps existing FIFO entries, adds every new outcome to persistent history immediately, and also enqueues the summary, so some outcomes appear in both channels.

Both preserve every committed outcome, expose overflow outcomes immediately, retain FIFO precedence, and enqueue a summary. They differ in duplicate announcements, ordering, and queue latency.

**Smallest tightening:** Add one reducer transition table for overflow-at-enqueue: projected-start calculation, disposition of every existing and incoming item, summary count semantics, timer start point, and operation-history clearing lifecycle.

### M2 — The mandated focus fallback table leaves “nearest” without a tie-break

**Spine evidence:** lines 209–210 and source-precedence line 235. The referenced UX fallback is `EXPERIENCE.md` lines 118–126.

AD-13 requires the UX fallback table, but Undo after removing an added row says to focus the “nearest surviving Managed Piece.” When rows survive on both sides at equal distance, the table provides no deterministic direction.

**Two compliant but incompatible implementations**

- **Unit A — focus policy:** chooses the next surviving row in post-removal source order, then previous.
- **Unit B — focus policy:** chooses the previous surviving row, then next.

Both resolve immutable IDs after render, mount before focusing, and apply the literal fallback table. Keyboard and screen-reader users land on different controls.

**Smallest tightening:** Define “nearest” as an ordered search, such as next then previous in post-removal source order, and name the subcontrol fallback. Add the equal-distance case to the shared browser corpus.

### M3 — Deployment does not bind one canonical header manifest to every release environment and HTML response

**Spine evidence:** lines 155–175, release-gate lines 221–229, and provider deferral at line 341.

AD-9 requires the policy floor only for production. AD-10 promotes the same bundle and restores “artifact and headers” together, but it does not define a canonical header artifact, require preview parity, or require the policy on alternate HTML/error responses.

**Two compliant but incompatible implementations**

- **Unit A — CI/deployment:** versions a header manifest beside the bundle and applies it to preview, production, `index.html`, and host-generated HTML error/fallback responses.
- **Unit B — static-host adapter:** promotes the identical tested bundle but configures the required CSP only on production’s normal `index.html`; preview and provider-generated HTML use provider defaults. Rollback restores the production header configuration with the artifact.

Both use one immutable client bundle, keep runtime behavior environment-invariant, serve production with the stated CSP, and promote/rollback artifact plus production headers. Their preview evidence and non-happy-path privacy boundary are incompatible.

**Smallest tightening:** Make a canonical versioned header manifest part of the content-addressed release unit; require identical effective security headers in preview and production on every HTML response, including errors/fallbacks; and probe those headers before promotion and after rollback.

## Low

None.

## Finding counts

| Tier | Count |
| --- | ---: |
| Critical | 0 |
| High | 4 |
| Medium | 3 |
| Low | 0 |
