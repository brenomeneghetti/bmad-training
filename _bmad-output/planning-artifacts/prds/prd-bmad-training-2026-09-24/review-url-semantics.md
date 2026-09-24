# URL/URI Semantics and State-History Review

## Verdict

**Not implementation-ready.** The PRD correctly identifies the dangerous URL
edge classes, but delegates several product-defining contracts to architecture
or leaves them as open questions. In particular, the current requirements do
not define one satisfiable state machine for valid raw typing, invalid drafts,
Copy, structured synchronization, and coalesced history. They also do not say
which serialization is authoritative when WHATWG parsing normalizes an accepted
URL. Independent implementations could all claim conformance while producing
different accepted URL sets, query entries, displays, copied strings, and Undo
results.

## Findings

### 1. Critical — Immediate synchronization conflicts with the committed-state model

**Evidence:** FR-10 says every syntactically valid Full URL edit updates every
affected Managed Piece immediately. FR-11 keeps a Draft URL separate until it is
valid and committed. FR-12 defines synchronization after every Committed
Mutation. The addendum further requires each valid input state to update all
dependent state atomically, while a continuous editing session creates only one
history mutation. The glossary, however, defines Current URL as the latest
valid **committed** URL.

A continuous typing sequence can pass through several valid states and then an
invalid state. The documents do not determine whether each valid intermediate
state becomes Current URL, Last Valid URL, Copy source, and the base for
structured editing; nor do they define when any of those states becomes
“committed.” Thus “immediate,” “valid,” and “committed” cannot be applied
consistently as written.

**Action:** Specify a normative state-transition table for raw input events,
including valid-to-valid, valid-to-invalid, invalid-to-valid, blur, Enter,
paste/replace, Escape/cancel, and structured edits during an active raw edit.
For every transition, identify the displayed raw text, parsed structured state,
Current URL, Last Valid URL, Copy source, and history effect. Use separate terms
for “valid live state” and “history transaction commit” if history is deferred.

### 2. Critical — Exact restoration and WHATWG canonicalization lack an authoritative serialization contract

**Evidence:** FR-3 requires reconstruction without changing meaning and says
unrelated edits must not double-encode encoded delimiters. FR-13 requires every
prior Current URL to be restored exactly. FR-14 and NFR-6 require exact Initial
URL restoration, including original serialization. The addendum nevertheless
leaves it to architecture to decide whether WHATWG is the acceptance boundary
and how original serialization is retained.

WHATWG parsing can normalize hostnames, default ports, dot segments, IDNs, and
some component encodings. Mutating through `URL` or `URLSearchParams` can also
change query serialization, including `%20`/`+`, percent-escape hex casing, and
`key`/`key=`. “Same meaning” therefore does not establish which exact string
Full URL and Copy must expose after intake, after a component edit, or after
Undo.

**Action:** Make the serialization policy a product requirement, not an
architecture prompt. Define whether accepted raw text, WHATWG `href`, or a
lossless token model is authoritative at intake and after each mutation.
Require byte-for-byte preservation of every untouched component/token, enumerate
the normalizations permitted in the edited component, and require history
snapshots to retain the authoritative serialized string.

### 3. High — Absolute URL acceptance is undefined and internally inconsistent

**Evidence:** The glossary defines an Absolute URL as containing a scheme and
host. FR-1 accepts an input with a “supported scheme and host,” but neither the
supported schemes nor the host rules are listed. The addendum only asks whether
WHATWG should be canonical. WHATWG absolute URLs include hostless schemes, while
special-scheme parsing also accepts and normalizes forms users may not perceive
as complete absolute URLs. “Domain-only input” is also ambiguous between a bare
hostname and a scheme-plus-host URL with no path.

This leaves acceptance of `file:`, `mailto:`, custom schemes, credentials,
IPv4/IPv6 forms, empty or opaque hosts, nonstandard ports, and parser-repaired
HTTP inputs indeterminate. Some accepted schemes cannot support the required
Domain/Path Segment model.

**Action:** Define the exact acceptance algorithm: scheme allowlist or scheme
classes, required authority/host rules, allowed credentials and ports, treatment
of parser-repaired input, and rejection conditions. Replace “domain-only” with
examples of the rejected syntax. Add a conformance table of accepted input,
canonical parsed result, displayed result, and rejection reason.

### 4. High — Query entry identity cannot preserve all required empty and absent forms

**Evidence:** FR-3 requires empty and absent values to remain representable.
FR-8 says they remain distinguishable “when the URL representation supports that
distinction.” The addendum leaves `?key`, `?key=`, duplicate keys, empty keys,
and empty values undecided. It does not address separator-only entries or
leading, repeated, and trailing `&`.

WHATWG `URLSearchParams` exposes both `?key` and `?key=` as key `key` with value
`""`, and serializes the former as `key=` after mutation. It also does not expose
empty fields in forms such as `?a&&b&` as independently editable entries. The
current “key plus optional value” model is therefore insufficient to guarantee
lossless query reconstruction and exact Undo.

**Action:** Define a lossless query grammar and entry model, including a
`hasEquals` bit and policy for empty fields/separators. State whether `?`, `?&`,
`?a&&b&`, `?=x`, `?key`, and `?key=` are accepted, how many structured entries
each produces, how each is labeled, and their exact serialization after
unrelated edits, direct edits, reorder, removal, and Undo.

### 5. High — Invalid structured edits have no draft-state contract

**Evidence:** FR-6 permits editing Domain, Path Segments, and query parts, says
invalid edits are explained, and protects Last Valid URL. FR-11 defines Draft
URL only for the Full URL editor. NFR-5 applies to invalid edits generally.

Typing a domain or other structured value naturally passes through invalid
intermediate text. The requirements do not say whether that text remains
visible as a structured draft, whether Full URL continues to show Last Valid
URL, whether Copy is enabled, whether another piece may be edited concurrently,
or what blur/Enter/Escape does. Immediate raw/structured synchronization is
therefore defined in only one direction.

**Action:** Either define a common draft transaction model for every editable
surface or explicitly make structured controls commit-only. Specify validation
timing, draft retention/cancellation, cross-view display, Copy source, focus
changes, competing edits, and history behavior for each invalid structured
transition.

### 6. High — History coalescing has no observable transaction boundary

**Evidence:** FR-10 requires one uninterrupted Full URL editing session to form
one Committed Mutation; FR-13 requires one History Entry per Committed Mutation;
FR-14 undoes one committed editing session as one step. The addendum says the
interaction design and architecture must select the boundary.

“Uninterrupted” is not testable. Focus loss, pauses, selection replacement,
paste followed by typing, IME composition, programmatic value replacement,
switching to a structured edit, and returning to the same raw field could each
start, continue, or close a transaction. A valid edit that returns to the
starting serialization may also create either zero or one entry. Different
choices materially change Undo.

**Action:** Define transaction start/end events and no-op rules normatively.
Include focus changes, explicit commit/cancel, inactivity if used, paste,
selection replacement, IME composition, intervening structured actions, and
edit-back-to-origin. State which exact pre-transaction string one Undo restores.

### 7. High — `Ctrl+Z` is assigned to two incompatible Undo systems

**Evidence:** FR-14 assigns `Ctrl+Z`/platform equivalent to product-level URL
Undo. The addendum requires native text-editing Undo and product-level URL Undo
not to be ambiguous or destructive but provides no routing rule.

While focus is in the Full URL or a structured text control, users reasonably
expect native Undo to restore text selection and draft edits. Product Undo may
instead replace the entire committed URL and discard a current draft. Both
behaviors cannot own the same keystroke under the same focus state.

**Action:** Define shortcut precedence by focus and draft state. State whether
native Undo is exhausted before product Undo, whether product Undo has a
different shortcut in text controls, and what happens to valid or invalid
drafts. Add acceptance sequences covering raw, Domain, Path Segment, and query
inputs.

### 8. High — Encoded-delimiter preservation is stated as an outcome without mutation rules

**Evidence:** FR-3 says encoded delimiters are not mistaken for structural
delimiters or double-encoded by an unrelated edit. The addendum lists encoded
`/`, `?`, `&`, `=`, and `#`, percent-escape casing, and invalid percent
sequences as architecture decisions.

The requirements do not identify whether structured values are displayed
decoded or encoded, whether users edit logical characters or serialized octets,
or which serializer applies afterward. A decoded `%26` shown as `&`, for
example, can be mistaken for a separator; `%2f` may become `%2F`; literal `%`
from an accepted invalid sequence may become `%25`. “Unrelated edit” also lacks
a component/token boundary.

**Action:** Define per-component display and edit semantics and the exact
encode/decode pipeline. Specify preservation rules for untouched tokens,
normalization rules for edited tokens, handling of malformed percent sequences,
and delimiter-safe rendering. Provide exact before/action/after fixtures for
each encoded delimiter in path, query key, query value, and fragment.

### 9. Medium — IDN behavior remains an open question despite affecting editing, search, and exactness

**Evidence:** FR-3 requires browser-accepted internationalized domains to remain
operable, but Open Question 1 and the addendum leave Unicode versus
ASCII/Punycode display undecided.

The choice affects what Domain displays, what the Full URL copies, what search
matches, what a Domain edit accepts, whether an unchanged host appears modified,
and whether Undo restores the original Unicode/Punycode spelling. “Operable” is
not an acceptance criterion.

**Action:** Choose a normative display/edit/copy policy. If both forms are
shown, designate the editable and authoritative form. Define search matching,
Unicode normalization, case behavior, invalid-label errors, and exact Undo for
Unicode input versus equivalent Punycode input.

### 10. Medium — Fragment preservation is not defined at the required exactness level

**Evidence:** FR-3 says a Fragment is preserved unless changed through Full URL,
and the fragment is not managed. NFR-6 requires exact Initial URL restoration.
Capacity guidance asks only that a fragment survive unrelated structured
changes.

It is unclear whether preservation means decoded meaning or exact serialized
text, especially for empty `#`, percent-escape casing, encoded `#`, `?` and `&`
inside fragments, Unicode, and malformed percent sequences accepted by the
parser. It is also unstated whether a raw fragment-only change commits
immediately and creates history even though no Managed Piece changes.

**Action:** Require exact opaque preservation of the fragment substring during
unrelated mutations, define empty-fragment behavior, and explicitly classify a
valid raw fragment edit as a Committed Mutation. Add byte-exact Copy and Undo
fixtures for fragment-only changes and unrelated structured edits.

### 11. Medium — The semantic requirements are not yet testable as a cross-product

**Evidence:** The addendum offers fixture categories, but key expected outputs
remain decisions rather than assertions. SM-2 requires zero critical state
failures and SM-4 requires every tested invalid edit to be contained, without
defining the conformance oracle or the tested transition set.

Individual examples will not expose interactions such as an IDN plus duplicate
empty query entries plus encoded delimiters plus a fragment, followed by a valid
raw intermediate, an invalid draft, Copy, a structured mutation, and Undo.
Without a reference state machine and exact string oracle, tests can verify only
implementation-selected behavior.

**Action:** Add a normative, data-driven conformance matrix with columns for
input text, acceptance, parsed pieces, displayed raw text, action/event,
structured state, Current URL, Last Valid URL, Copy result, history depth, and
Undo result. Cover pairwise combinations of all named semantic classes and
explicit multi-step state histories, asserting exact serialized strings where
preservation/restoration is promised.

## Required resolution order

1. Define the acceptance and authoritative-serialization contracts.
2. Define the lossless query/component model.
3. Define the unified draft/current/last-valid/history state machine.
4. Define coalescing and keyboard Undo routing.
5. Publish the conformance matrix before architecture or implementation is
   considered constrained by this PRD.
