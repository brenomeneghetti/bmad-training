# Epic 1 Context: Safely Inspect and Find URL Pieces

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver an independently useful, browser-local URL Workbench where a developer can safely start a session from a complete HTTP or HTTPS Absolute URL, inspect every managed piece without semantic loss, verify Unicode and ASCII/Punycode Domain forms, and search a complete high-density structure without changing the URL. This epic establishes the trustworthy parsing, identity, privacy, accessibility, responsive-layout, and evidence foundations required by later editing, history, and copy capabilities.

## Stories

- Story 1.1: Set Up Initial Project from the React Starter Template
- Story 1.2: Start a Session with a Valid Absolute URL
- Story 1.3: Inspect Every URL Piece Without Semantic Loss
- Story 1.4: Verify Internationalized Domain Representations
- Story 1.5: Navigate a Complete High-Density Structured View
- Story 1.6: Find and Clear Managed Pieces

## Requirements & Constraints

- Accept only complete HTTP or HTTPS Absolute URLs with a non-empty host. Rejected, stale, or unsafe input must remain correctable and must not create or replace Initial, Current, or Last Valid state or publish partial rows.
- Preserve the accepted input exactly. Domain, ordered Path Segments, and ordered Query Parameters are Managed Pieces; Scheme and Fragment remain visible only in Full URL. Empty and trailing path segments, duplicate and empty query entries, absent versus empty values, separators, percent-triplet casing, encoded delimiters, userinfo, port, and other untouched text must not be merged, reordered, normalized, or silently repaired.
- Display both Unicode and ASCII/Punycode Domain forms when conversion is valid, while retaining the exact source host lexeme. Conversion or host-validation failures must block session publication and provide specific safe guidance.
- Render every Managed Piece exactly once in source order in one native semantic list. V1 must not use virtualization or infinite scrolling. Type, source ordinal/total, and duplicate occurrence must remain explicit and must not depend on color or filtered position.
- Search case-insensitively across both Domain forms, raw Path Segment text, and Query Parameter keys and values. Filtering and clearing Search must preserve committed state, exact serialization, identities, ordinals, duplicate context, source order, and session epoch; Search never creates URL history.
- Support URLs up to 20,000 characters and at least 250 Query Parameters. Initial parsing targets one second and local Search interactions target 100 ms on reference hardware, without freezing, missing rows, or blocking layout overflow.
- Keep all URL processing and session data in-browser. Do not send or persist URL content through requests, logs, telemetry, storage, cookies, query strings, or service workers; reload or close returns to No session.
- Meet WCAG 2.2 AA across keyboard use, supported browser/assistive-technology combinations, forced colors, text spacing, 320 CSS px reflow, and 400% zoom. Status must not steal focus, and meaning must not rely on color, motion, hover, or visual position alone.
- Use the versioned shared fixture and evidence contract across core, component, and browser tests. Required parser/serializer, IDN, full-DOM capacity, privacy, responsive, and accessibility cells must pass; skipped, waived, absent, or malformed mandatory evidence is not a pass.

## Technical Decisions

- Use the prescribed create-vite React/TypeScript stack: Node.js 24 LTS, pnpm 12.5.1, create-vite 9.2.1, React 19.3.0, TypeScript 6.0.2, Vite 8.3.1, `@vitejs/plugin-react` 6.1.1, oxlint 1.81.0, Vitest 5.0.1, Testing Library, Playwright 1.63.0, axe-core, and `tr46` 6.0.0.
- Separate pure `core/url`, `core/idn`, `core/session`, and `core/contracts` from React `app/workbench`, `app/pieces`, and `app/feedback`, browser-only platform adapters, committed styles, and shared fixtures. Commands enter through one session reducer; UI and adapters cannot independently mutate or publish committed URL state.
- Use WHATWG `URL` only as the HTTP/HTTPS acceptance and host-semantics oracle. A custom lossless scanner and serializer own exact scheme/authority slots, ordered path segments, query presence and entries shaped as `{id, separatorBefore, rawKey, equalsPresent, rawValue}`, and Fragment presence/text. Do not use `URLSearchParams` or generic splitting as the round-trip model.
- Publish parsing atomically from the pure core. Scheduled requests carry exact input, monotonic generation, session epoch, and originating committed revision; only the latest fully matching request may publish. The session core owns busy, validation, generation, epoch, and publication state.
- Allocate opaque, session-local, immutable, non-recycled `PieceId` values independently of array index, ordinal, content, or filtered position. Derive stable DOM and error IDs from Piece ID plus field kind.
- Perform both IDN directions with `tr46` using non-transitional processing, bidi/joiner checks enabled, hyphen/STD3/DNS-length checks disabled as specified, and invalid Punycode rejection enabled; validate the ASCII result through WHATWG HTTP/HTTPS host rules. Do not invent a mixed-script rejection policy or normalize Unicode.
- Build one static environment-invariant bundle with Vite `base: './'`, fingerprinted assets, no backend or runtime environment branches, and a CSP that includes `connect-src 'none'`.

## UX & Interaction Patterns

Use one `<main>` with one URL Workbench heading and uniquely headed Full URL, Actions, and Structured View sections in that reading order. The Full URL textarea is primary; Structured View contains Search, a visible “N of M Managed Pieces shown” summary, skip targets, and the complete list. The no-session state explains that URL data stays in the browser and clears on reload or close.

Use persistent labels, literal calm microcopy, native controls, URL-legible typography, bidi isolation for URL and Domain values, quiet borders, and visible focus. At narrow widths all regions stack without changing reading order; only essential URL value fields may scroll internally. Search clearing occurs on click/up activation, returns focus to Search, restores source order, and politely announces the count. No-results state includes the term, “0 of M,” and a keyboard-reachable Clear Search action. Result-count announcements settle and coalesce within the defined short window rather than firing for every keystroke.

## Cross-Story Dependencies

- Story 1.1 establishes the stack, module boundaries, tokens, privacy baseline, delivery policy, and evidence infrastructure used by every later story.
- Story 1.2 establishes atomic session intake and stale-result protection required before structure can be published.
- Story 1.3 supplies the exact lossless model and stable identities consumed by Domain verification, full-list rendering, and Search.
- Story 1.4 depends on accepted host semantics and the shared Domain identity from Stories 1.2–1.3.
- Story 1.5 depends on the complete ordered model and immutable IDs; Story 1.6 filters that full model without replacing or mutating it.
- Later editing, synchronization, history, Undo, and Copy epics depend on this epic’s exact snapshots, stable identities, privacy guarantees, and shared acceptance corpus.
