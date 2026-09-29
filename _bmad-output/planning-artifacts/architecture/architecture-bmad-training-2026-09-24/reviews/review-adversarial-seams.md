# Adversarial Seam Review — Architecture Spine

## Verdict

**GATE FAIL — the spine establishes strong authorities, but it does not yet define enough executable boundary contracts for independently built units to integrate deterministically.** The pairs below can obey every adopted AD literally while disagreeing at their seams.

## Lens

Adversarial Reviewer Gate: construct independently valid implementations one level below the architecture decisions and test whether the decisions force them to compose.

## Findings

### 1. Raw-token delimiter ownership is under-specified

- **Location:** AD-2 — Lossless URL core with WHATWG acceptance
- **Trigger condition:** `core/url/scanner` attaches each `&` separator to the query item that follows it, while `core/url/serializer` and a query mutation helper attach it to the item that precedes it. Both preserve untouched bytes, duplicate order, separators, first-`=` presence, and change only the targeted token plus “required adjacent delimiters,” but deleting the middle or final duplicate produces different strings.
- **Guard snippet:** Define the canonical token algebra, including whether delimiters are standalone tokens or owned by the left/right entry, and publish exact insert/delete/replace rewrite tables for first, middle, last, empty, and consecutive-delimiter cases.
- **Potential consequence:** Structured edits can drop, duplicate, or move separators even though scanner and serializer each satisfy AD-2 in isolation.

### 2. “Component-aware codec” lacks a shared context contract

- **Location:** AD-3 — One component-text codec
- **Trigger condition:** `core/url/codec` exposes one function that preserves all syntactically valid `%HH` triplets, while `app/pieces` supplies decoded text and expects literal `%` entered by the user to become `%25`. Another editor supplies raw token text and expects `%2F` to remain untouched. Both use the one required codec, yet the same user input has incompatible meaning because raw-versus-display input and component context are not typed.
- **Guard snippet:** Specify separate branded input/output types and an exhaustive component context (`path-segment`, `query-name`, `query-value`, `fragment`, etc.); define whether editor drafts are raw lexemes or decoded display text and provide normative vectors for `%`, `%2f`, `%ZZ`, Unicode, and structural delimiters.
- **Potential consequence:** A piece edit can double-encode preserved octets or accidentally interpret newly typed percent text as an existing encoded byte.

### 3. Absent, empty, and delimiter-present values have no canonical shared shape

- **Location:** AD-2, AD-3; Consistency Conventions — Results and Serialization
- **Trigger condition:** The scanner models `?a` as `{ value: undefined, equalsPresent: false }`, while the query editor models it as `{ value: "", hasValue: false }`; a serializer independently treats an empty string as requiring `=`. Every unit can claim to preserve first-`=` presence and empty/absent values, but no exported discriminated union forces agreement.
- **Guard snippet:** Define the complete lossless model as shared executable types with unrepresentable invalid states, including absent query, empty query, empty entry, name-only entry, explicit empty value, repeated separators, empty path segments, and fragment absence versus empty fragment.
- **Potential consequence:** Merely focusing and committing an apparently unchanged field can rewrite `?a` to `?a=` or collapse other empty structures.

### 4. Host lexeme ownership conflicts across URL and IDN units

- **Location:** AD-2 — Lossless URL core; AD-4 — Deterministic dual IDN conversion
- **Trigger condition:** `core/url` considers the raw authority token the source of truth for untouched serialization, while `core/idn` returns a normalized ASCII host plus Unicode display form and considers that pair the committed host. Both retain an untouched source lexeme and lowercase after an edit, but the spine does not say which unit owns brackets, trailing dot, percent text, userinfo boundary, port boundary, or the transition that marks a host “touched.”
- **Guard snippet:** Publish one `HostToken` contract with explicit raw authority slices, semantic host value, source lexeme, edit-origin flag, trailing-dot policy, IPv6/IPv4/domain variants, and the sole function allowed to replace the host slice after successful IDN conversion.
- **Potential consequence:** Editing a domain can lose a trailing dot, disturb adjacent authority text, or cause URL and IDN views to commit different host serializations.

### 5. Piece identity reconciliation after Full URL acceptance is undefined

- **Location:** AD-5 — Snapshot history owns identity; AD-6 — Close-and-rebase
- **Trigger condition:** On a valid Full URL reparse, one session implementation assigns fresh never-recycled IDs to every parsed piece; another preserves IDs by array position; a third matches by raw token value. All IDs remain opaque, immutable, session-local, and never recycled, yet duplicates inserted or reordered cause focus and row identity to attach to different logical pieces.
- **Guard snippet:** Define a deterministic identity reconciliation algorithm for accepted Full URL replacements, including duplicate matching, insertions, deletions, moves, changed tokens, and undo restoration; include normative before/after ID maps in the shared corpus.
- **Potential consequence:** Duplicate rows swap local drafts, React keys, validation messages, or focus targets after a Full URL edit or Undo.

### 6. Snapshot identity and history restoration do not define allocation semantics

- **Location:** AD-5 — Snapshot history owns identity
- **Trigger condition:** `core/session/history` restores the exact stored piece IDs, while a parser-backed restore rebuilds the lossless model and allocates new IDs because IDs are never recycled. Both can describe their result as restoring a complete snapshot with immutable IDs, but “never recycled” is ambiguous when an old snapshot becomes current again.
- **Guard snippet:** State explicitly that historical IDs are retained values, not reallocated IDs, and that restoring a snapshot must reuse its exact IDs and History Entry ID; define whether IDs absent from the current head remain reserved for the session lifetime.
- **Potential consequence:** Undo can render an equivalent URL with different identity, invalidating focus intents and local component state.

### 7. History transaction boundaries admit incompatible command grouping

- **Location:** AD-6 — Close-and-rebase is a state transition
- **Trigger condition:** `app/workbench` dispatches blur and the next product mutation as two commands, while the reducer treats each accepted command atomically; another controller dispatches a compound close-and-mutate command. Both close the Full URL session at most once and append structured changes against Last Valid, but they can produce one or two entries and different `before` snapshots.
- **Guard snippet:** Define the command protocol and ordering table for blur, Enter, pointer-down on another control, structured mutation, Copy, Undo, and scheduled parse completion; identify which combinations are one transaction and which history entry each must create.
- **Potential consequence:** Equivalent user actions produce different Undo sequences depending on event ordering, browser, or component implementation.

### 8. Rebase lacks revision preconditions for stale UI commands

- **Location:** AD-1 — One transactional session authority; AD-6 — Close-and-rebase
- **Trigger condition:** A React row renders snapshot revision N and later dispatches `editPiece(id, text)` after a Full URL acceptance has produced revision N+1. The reducer remains the only mutator and atomically accepts the command, but no AD requires commands to carry or validate their observed baseline.
- **Guard snippet:** Add a committed snapshot revision to mutation commands and define per-command stale behavior: reject, remap by stable ID, or explicitly rebase; specify the safe problem code and focus/status outcome.
- **Potential consequence:** Delayed events can overwrite newer state or mutate a piece whose token semantics changed while preserving formal reducer ownership.

### 9. Effect intents have no identity, consumption, or acknowledgement protocol

- **Location:** AD-1 — effect intents; AD-5 — focus intents; Consistency Conventions — State mutation
- **Trigger condition:** The reducer stores `focusRequested(id)` in state; one shell executes every intent seen after render, while another executes only newly appended intents. React remounts, Strict Mode, or an unrelated state publication can therefore replay an old focus or status effect. Both execute adapters only after state publication.
- **Guard snippet:** Define an effect envelope with opaque `EffectId`, originating revision, kind, payload, delivery semantics, acknowledgement command, and pruning rule; state whether execution is at-most-once or idempotent and require adapters to ignore already acknowledged IDs.
- **Potential consequence:** Focus jumps repeatedly, announcements duplicate, or clipboard/status effects execute more than once.

### 10. “After render” does not identify the DOM readiness handshake

- **Location:** AD-5 — shell mounts target before applying focus; Consistency Conventions — adapters after state publication
- **Trigger condition:** `platform/focus` runs in a layout effect immediately after publication, while `app/pieces` mounts a searched or expanded row in a later render/effect. Both respect publication order, but the adapter can legally run before the target exists; another implementation retries indefinitely without a cancellation rule.
- **Guard snippet:** Define a focus executor state machine: request revision, target-mounted acknowledgement, scroll policy, focus attempt, success/failure result, cancellation on superseding revision, and bounded retry behavior.
- **Potential consequence:** Required focus silently fails, lands on a stale node, or loops after the target was removed.

### 11. Effect outcomes have no route back to the session authority

- **Location:** Capability Map — Copy and feedback; AD-1; Structural Seed — clipboard and feedback
- **Trigger condition:** `platform/clipboard` reports success/failure directly to `app/feedback`, while another implementation dispatches a reducer command that creates a status intent. Both keep URL mutation in the reducer and use the serialized snapshot as Copy source, but feedback ordering, deduplication, accessibility announcement, and stale-copy detection differ.
- **Guard snippet:** Specify the complete Copy protocol: command captures revision and serialized value, effect carries `EffectId`, adapter returns a content-free outcome command, reducer decides whether the outcome is current, and feedback is emitted from that transition.
- **Potential consequence:** The UI can announce success for an obsolete copy, announce twice, or expose inconsistent error handling across browsers.

### 12. Scheduled parse generations lack a single allocator and commit predicate

- **Location:** AD-8 — Local synchronous parsing first
- **Trigger condition:** `app/workbench` allocates generation numbers per component instance while `core/session` compares them globally; after remount, generation `1` can be accepted over generation `9`. Alternatively the core allocates generations but the scheduler drops the input snapshot revision. Both carry an input snapshot and monotonic generation within their own unit.
- **Guard snippet:** Make generation allocation reducer-owned and session-wide; define the parse request/result envelope with session epoch, generation, input text or hash-free opaque revision, and the exact acceptance predicate against current Draft and session state.
- **Potential consequence:** A stale parse can replace a newer valid snapshot and corrupt history while appearing to pass the generation check.

### 13. Error-code producers and consumers are not bound by an exhaustive registry

- **Location:** Consistency Conventions — Results; AD-9 — typed local failures
- **Trigger condition:** `core/url` returns stable code `invalid-percent`, `core/idn` returns `invalid_host`, and `app/feedback` independently maps only known codes to message keys. Every producer uses a stable non-content code and safe key, but no shared closed union or exhaustiveness rule prevents unmapped or semantically overlapping codes.
- **Guard snippet:** Define one exported discriminated `UrlProblem` union, field taxonomy, message-key mapping, redaction constraints, and exhaustive compile-time consumer checks; version corresponding corpus cases.
- **Potential consequence:** Expected validation can become a generic or missing message, attach to the wrong field, or leak raw exception text through a fallback path.

### 14. Static bundle and static host can satisfy AD-10 separately but fail as a deployment

- **Location:** AD-10 — Static, environment-invariant delivery; deployment diagram
- **Trigger condition:** Vite emits content-hashed immutable assets and a mutable `index.html`, while the CDN marks every file immutable for a year; a release updates HTML and assets non-atomically or evicts old assets. The build remains one immutable client bundle and the host serves HTTPS with no server application, yet clients receive incompatible HTML/asset generations.
- **Guard snippet:** Define the deployment artifact manifest and atomic promotion/rollback contract, cache headers by file class, retention of referenced asset generations, base-path behavior, MIME requirements, and a release probe that loads a cold and cached client.
- **Potential consequence:** Production can serve a blank or partially upgraded application even though build and hosting units each comply with AD-10.

### 15. CSP ownership is split without an executable header contract

- **Location:** AD-9 — URL content has no external sink; AD-10 — delivery
- **Trigger condition:** The application contains no outbound request code and assumes the CDN supplies `connect-src 'none'`; the CDN supplies a CSP but omits it on preview, error documents, or alternate HTML paths, or blocks Vite’s emitted scripts/styles under a stricter policy. Each unit honors its own reading of the ADs, but their policies are incompatible.
- **Guard snippet:** Check in a canonical production and preview header policy, define how scripts/styles are authorized without runtime branches, require headers on every HTML/error response, and make browser release tests assert the effective CSP and zero outbound/storage/service-worker activity.
- **Potential consequence:** One environment can leak through an omitted policy or fail to boot because the deployed CSP and generated bundle disagree.

### 16. The shared corpus has no schema or oracle ownership

- **Location:** AD-11 — Shared executable acceptance corpus
- **Trigger condition:** Core golden tests read raw input and expected serialization, component tests derive expected piece rows themselves, and Playwright tests derive history expectations from UI actions. All consume one versioned fixture corpus, but independent runners can interpret missing fields, IDs, history boundaries, and expected effects differently.
- **Guard snippet:** Define a versioned fixture schema with a single normative oracle per step: initial state, command, exact resulting state projection, piece IDs, history entries, effects, adapter outcomes, and serialization; validate every runner against the same schema before executing cases.
- **Potential consequence:** The “shared” corpus can certify mutually incompatible implementations and fail to catch the seams above.
