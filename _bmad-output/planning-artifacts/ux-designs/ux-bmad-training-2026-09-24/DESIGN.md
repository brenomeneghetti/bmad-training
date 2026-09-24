---
name: URL Piece Management
description: A restrained, high-legibility utility system for inspecting and editing complex URLs in a browser-local public web tool.
status: final
updated: 2026-09-24
sources:
  - ../../prds/prd-bmad-training-2026-09-24/prd.md
  - ../../prds/prd-bmad-training-2026-09-24/addendum.md
colors:
  surface-base: '#FFFFFF'
  surface-subtle: '#F7F7F8'
  surface-disabled: '#E4E4E7'
  text-primary: '#18181B'
  text-secondary: '#52525B'
  text-disabled: '#52525B'
  border-default: '#71717A'
  border-strong: '#3F3F46'
  action: '#174EA6'
  action-hover: '#123E85'
  action-text: '#FFFFFF'
  focus: '#0B57D0'
  focus-gap: '#FFFFFF'
  success: '#146C43'
  error: '#B3261E'
  error-surface: '#FFF4F2'
  changed-surface: '#EEF4FF'
typography:
  page-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 24px
    fontWeight: '650'
    lineHeight: '1.25'
  section-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 18px
    fontWeight: '650'
    lineHeight: '1.35'
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
  meta:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  url:
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  pointer-min: 24px
  control-target: 44px
  content-max: 1440px
components:
  full-url-editor:
    background: '{colors.surface-base}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.md}'
    typography: '{typography.url}'
    min-height: 96px
  action-bar:
    background: '{colors.surface-base}'
    border: '{colors.border-default}'
    gap: '{spacing.2}'
  search-field:
    background: '{colors.surface-base}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  managed-piece-list:
    background: '{colors.surface-base}'
    gap: '{spacing.2}'
  managed-piece-row:
    background: '{colors.surface-base}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
  piece-type-label:
    background: '{colors.surface-subtle}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.full}'
    typography: '{typography.meta}'
  add-query-parameter-control:
    background: '{colors.action}'
    foreground: '{colors.action-text}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  undo-control:
    background: '{colors.surface-base}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  copy-control:
    background: '{colors.action}'
    foreground: '{colors.action-text}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  safe-copy-readonly:
    background: '{colors.surface-subtle}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-strong}'
    radius: '{rounded.md}'
    typography: '{typography.url}'
    min-height: '{spacing.control-target}'
  status-message:
    foreground: '{colors.text-secondary}'
    typography: '{typography.meta}'
  validation-message:
    background: '{colors.error-surface}'
    foreground: '{colors.error}'
    border: '{colors.error}'
    radius: '{rounded.sm}'
    typography: '{typography.meta}'
  no-results-state:
    foreground: '{colors.text-secondary}'
    typography: '{typography.body}'
---

## Brand & Style

The V1 identity is a restrained, high-legibility utility: system typography, neutral surfaces, blue actions, quiet borders, modest corners, and minimal depth. It should feel like a trustworthy editing instrument rather than a decorative developer dashboard. Content, persistent labels, exact state language, and character-level legibility take priority over personality.

No UI system is inherited. These tokens are the committed V1 visual direction. Dark mode and a separate icon language are outside the current visual contract.

## Colors

- `{colors.surface-base}` with `{colors.text-primary}` is the default reading pair; target contrast is at least 7:1.
- `{colors.action}` with `{colors.action-text}` is reserved for primary actions such as `copy-control` and `add-query-parameter-control`; target contrast is at least 4.5:1.
- `{colors.border-default}` is the minimum functional boundary and must measure at least 3:1 against `{colors.surface-base}`. Decorative separators may be lighter only when removing them would not impair component identification.
- `{colors.error}` with `{colors.error-surface}` identifies inline invalid state and is always paired with text, `aria-invalid`, and an error association.
- `{colors.changed-surface}` may provide a static counterpart cue, always with visible status text. It must not flash, animate, or carry meaning alone.
- Disabled appearance uses `{colors.surface-disabled}` plus explicit inactive semantics and explanatory text where needed; reduced contrast is never the only cue.

Focus is a two-layer indicator. On neutral controls, use a 2px `{colors.focus}` outline with at least a 2px offset. On blue controls, place a 2px `{colors.focus-gap}` inner gap between the component and a 2px `{colors.focus}` outer outline so the indicator changes contrast by at least 3:1 against both the control and adjacent surface. In `forced-colors: active`, preserve the native outline or use a 2px system-color outline; do not rely on box-shadow or forced token colors.

No gradients, decorative color coding, or color-only differentiation among Domain, Path Segment, Query Parameter, validation, or history states.

## Typography

- Use `{typography.url}` for the Full URL, Domain forms, and URL-value fields where punctuation and character distinction matter.
- Use `{typography.body}` for instructions and empty states, `{typography.label}` for persistent labels, and `{typography.meta}` for position, result count, and secondary state detail.
- URL text uses left-to-right isolation without changing the user's stored characters. Unicode and ASCII/Punycode Domain values are isolated independently from surrounding labels.
- Do not visually truncate editable or verification values. Values may wrap; an essential URL value field may scroll horizontally inside its own boundary, while its label, help, validation, and actions remain outside that scroller.

## Layout & Spacing

The page is one URL Workbench with maximum width `{spacing.content-max}`. Use `{spacing.1}` through `{spacing.7}` consistently: major regions use `{spacing.5}` or `{spacing.6}` separation, while dense rows use `{spacing.2}` or `{spacing.3}` without shrinking hit areas.

At 1024 CSS px and wider, the Full URL and Actions regions may remain visible while Structured View scrolls. From 768–1023 CSS px, controls wrap into labeled rows. Below 768 CSS px, all regions stack in the same reading order. At 320 CSS px—including the equivalent of 400% browser zoom on a 1280px viewport—required content and actions reflow without page-level horizontal scrolling or loss. Horizontal scrolling is allowed only inside essential URL value fields as defined above.

Every pointer target is at least `{spacing.pointer-min}` by `{spacing.pointer-min}` at every supported width or satisfies the WCAG spacing exception. Primary and destructive controls—including Copy, Add, and Remove—target at least `{spacing.control-target}` by `{spacing.control-target}`. “Clear Search” and Move controls must receive an equivalent hit area even when their visible mark is smaller.

With WCAG 1.4.12 text-spacing overrides—line height 1.5 times the font size, paragraph spacing 2 times the font size, letter spacing 0.12 times the font size, and word spacing 0.16 times the font size—no label, help text, error, status, control, row, or URL content may clip, overlap, hide, truncate, or lose function at any supported width.

At high density, Full URL, Search, Copy, Undo, the pre-list Add shortcut, and skip links remain reachable without traversing every row. When the Full URL or Actions region is sticky, it may use a separator but cannot obscure focus, headings, validation, or status.

## Elevation & Depth

Use borders and tonal surfaces for hierarchy. The default experience has no card shadows. Sticky regions may gain a clear separator only when content passes beneath them. Routine edits, validation, Copy, and Undo never open a modal or elevated interruption.

## Shapes

Use `{rounded.sm}` for inline messages, `{rounded.md}` for controls and Managed Piece rows, `{rounded.lg}` only for large containing regions, and `{rounded.full}` only for compact type labels. Shape is supplementary and never the sole distinction among piece types or states.

## Components

Canonical component identifiers below match `EXPERIENCE.md`.

| Component | Visual specification |
|---|---|
| `full-url-editor` | Persistently labeled multiline `<textarea>` using `{components.full-url-editor.typography}`. Text wraps within a minimum 96px field. Invalid Draft URL uses the error border and adjacent inline `validation-message`; persistent help remains visually associated. |
| `action-bar` | Quiet utility region with stable visual positions for Undo, Copy, and the pre-list Add shortcut. At narrower widths it wraps without changing their visual sequence. |
| `search-field` | Persistent “Search Managed Pieces” label, “Clear Search” control with at least `{spacing.pointer-min}` hit area, and a visible normative result summary. |
| `managed-piece-list` | Ordered single-column list with a visible heading, result summary, skip targets, and no visual suggestion that off-screen rows are absent. |
| `managed-piece-row` | Bordered row containing type, stable source-position text, editable controls, and labeled actions. Duplicate entries show stable source ordinal and source occurrence context; filtered-result position is separate visible text. Both “Unicode Domain” and “ASCII/Punycode Domain” are visibly editable, independently bidi-isolated, and paired with visible conversion status. |
| `piece-type-label` | Compact text reading Domain, Path Segment, or Query Parameter. Position and occurrence remain separate visible text; color and shape are supplementary. |
| `add-query-parameter-control` | The same label and primary-action treatment appear before and after the list. Both instances meet `{spacing.control-target}`. |
| `undo-control` | Secondary control with visible inactive state when the Initial URL is current. Shortcut text may accompany, never replace, the Undo label. |
| `copy-control` | Persistent primary action with a stable label. |
| `safe-copy-readonly` | Read-only URL field with a persistent “Current URL” or “Last Valid URL” label, `{components.safe-copy-readonly.typography}`, strong border, and visibly apparent full-value selection. |
| `status-message` | Visually stable, separately styled areas for polite operation status and actionable failure; layout-critical controls do not move when text changes. |
| `validation-message` | Visible inline error adjacent to its field, using `{components.validation-message.background}`, `{components.validation-message.foreground}`, and `{components.validation-message.border}`. |
| `no-results-state` | Plain text inside Structured View, paired with the visible result count and a “Clear Search” action. |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep Full URL, Search, Copy, Undo, Add, result count, and skip links visually findable in dense sessions. | Require traversal of hundreds of row controls to reach Add or the next major region. |
| Keep both “Unicode Domain” and “ASCII/Punycode Domain” labels visible, isolate each value bidirectionally, and show conversion status. | Present two unlabeled Domain fields or merge their labels. |
| Use quiet boundaries, static change cues, and two-layer focus on blue controls. | Use low-contrast borders, animated flashes, decorative shadows, or box-shadow-only focus. |
| Reflow all labels, errors, status, and actions at 320 CSS px. | Introduce page-level horizontal scrolling; confine essential scrolling to URL value fields. |
| Preserve at least 24×24 pointer targets at all widths and target 44×44 for primary/destructive controls. | Compress actions to icon glyph dimensions to fit more rows. |
