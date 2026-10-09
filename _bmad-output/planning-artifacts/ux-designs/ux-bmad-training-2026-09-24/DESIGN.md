---
name: URL Piece Management
description: Approved dark workbench identity for a browser-local URL editing utility; finalized design contract, not delivered application behavior.
status: final
updated: 2026-10-09
sources:
  - ../../prds/prd-bmad-training-2026-09-24/prd.md
  - ../../prds/prd-bmad-training-2026-09-24/addendum.md
  - ../../architecture/architecture-bmad-training-2026-09-24/ARCHITECTURE-SPINE.md
colors:
  surface-base: '#0B1220'
  surface-panel: '#121D2E'
  surface-input: '#0D1726'
  surface-raised: '#1A2940'
  text-primary: '#EFF4FC'
  text-secondary: '#B5C3D8'
  border-default: '#63758F'
  body-accent: '#8CB9FF'
  path-accent: '#C5ADFF'
  query-accent: '#76DECA'
  action: '#A4C8FF'
  action-text: '#0B1220'
  selected-surface: '#20374A'
  focus: '#FFD58A'
typography:
  page-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 'clamp(24px, 3vw, 32px)'
    fontWeight: '650'
    lineHeight: '1.25'
  section-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 21px
    fontWeight: '650'
    lineHeight: '1.5'
  group-title:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 15px
    fontWeight: '650'
    lineHeight: '1.5'
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.5'
  control:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.5'
  meta:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  url:
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  md: 10px
  lg: 16px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  field-label-gap: 6px
  row-gap: 10px
  panel-padding: 20px
  pointer-min: 24px
  control-target: 44px
  disclosure-target: 52px
  content-max: 1440px
components:
  full-url-editor:
    background: '{colors.surface-input}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    typography: '{typography.url}'
    min-height: 100px
  action-bar:
    background: '{colors.surface-panel}'
    gap: '{spacing.3}'
  search-field:
    background: '{colors.surface-input}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  detail-group:
    background: '{colors.surface-panel}'
    radius: '{rounded.lg}'
    body-accent: '{colors.body-accent}'
    path-accent: '{colors.path-accent}'
    query-accent: '{colors.query-accent}'
  disclosure-control:
    typography: '{typography.group-title}'
    min-height: '{spacing.disclosure-target}'
  passive-url-context:
    foreground: '{colors.text-secondary}'
    typography: '{typography.meta}'
  managed-piece-list:
    gap: '{spacing.row-gap}'
  managed-piece-row:
    background: '{colors.surface-input}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    selected-background: '{colors.selected-surface}'
  piece-type-label:
    foreground: '{colors.text-primary}'
    typography: '{typography.meta}'
  query-drag-handle:
    foreground: '{colors.query-accent}'
    min-height: '{spacing.control-target}'
    min-width: '{spacing.control-target}'
  query-move-controls:
    background: '{colors.surface-raised}'
    foreground: '{colors.text-primary}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  drop-indicator:
    foreground: '{colors.query-accent}'
  remove-control:
    background: '{colors.surface-raised}'
    foreground: '{colors.text-primary}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  add-query-parameter-control:
    background: '{colors.action}'
    foreground: '{colors.action-text}'
    radius: '{rounded.md}'
    min-height: '{spacing.control-target}'
  add-query-jump-link:
    foreground: '{colors.action}'
    min-height: '{spacing.pointer-min}'
  undo-control:
    background: '{colors.surface-raised}'
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
    background: '{colors.surface-input}'
    foreground: '{colors.text-primary}'
    border: '{colors.border-default}'
    radius: '{rounded.md}'
    typography: '{typography.url}'
    min-height: '{spacing.control-target}'
  status-message:
    foreground: '{colors.text-secondary}'
    typography: '{typography.meta}'
  committed-state-banner:
    foreground: '{colors.text-primary}'
    background: '{colors.surface-panel}'
  validation-message:
    background: '{colors.surface-input}'
    foreground: '{colors.focus}'
    border: '{colors.focus}'
    radius: '{rounded.md}'
    typography: '{typography.meta}'
  no-results-state:
    foreground: '{colors.text-secondary}'
    typography: '{typography.body}'
---

## Brand & Style

Breno approved the original dark reference-inspired preview: navy surfaces, rounded panels and styled inputs, distinct blue/violet/teal accents, system typography, and meaningful space and hierarchy. This replaces the older light utility identity without changing the product's browser-local scope or exact URL contracts. No UI system is inherited; no new font, theme switcher, icon system, or component library is introduced.

The approved composition is [Dark Workbench](mockups/dark-workbench.html), promoted byte-for-byte from `.working/direction-dark-workbench.html`. Its historical “pending approval” annotations and static controls remain an audit trail, not current decisions or implementation proof. This pair of spines wins on conflict with mockups, wireframes, or imports. The design is finalized; upstream synchronization is tracked in [redesign reconciliation](reconcile-redesign.md), and document-review findings and dispositions in the [validation report](validation-report.md).

## Colors

All palette values above are exact approved-preview CSS values. Error and feedback treatments reuse that palette as spine-only applications; the preview did not approve a separate error color.

- `{colors.surface-base}`, `{colors.surface-panel}`, `{colors.surface-input}`, and `{colors.surface-raised}` create tonal hierarchy without shadows.
- `{colors.text-primary}` is the main reading ink; `{colors.text-secondary}` serves help, source positions and counts. Main reading pairs target 7:1; all normal text targets at least 4.5:1 on its actual surface.
- `{colors.body-accent}`, `{colors.path-accent}`, and `{colors.query-accent}` identify the body, Paths, and Query Parameters groups. Headings and text identify the groups without color. Accents are not validity indicators.
- `{colors.action}` / `{colors.action-text}` is the primary Copy/Add pair, targeting at least 4.5:1.
- `{colors.border-default}` is the functional field/row boundary, targeting at least 3:1 on adjacent input/panel surfaces.
- `{colors.selected-surface}` with a `{colors.query-accent}` boundary accompanies explicit selection text/state; it is not the sole indication of selection or destination.
- `{colors.focus}` is the 3px focus outline with a 3px offset, matching the preview. It must contrast at least 3:1 with its adjacent dark surface; the offset separates it from pale primary buttons. It also supports text-labeled validation, never color-only error semantics.

In forced colors, use native/system-color outlines and boundaries, including a perceivable selected-row boundary and explicit drop marker. Do not force brand colors or rely on box-shadow. Contrast is a contract to verify on rendered states, not a claim of completed application checks.

## Typography

The approved preview retains system sans-serif for UI and monospace for URL text. Use `{typography.page-title}` for the workbench title, `{typography.section-title}` for major headings, `{typography.group-title}` for disclosure headings, `{typography.label}` for persistent labels, `{typography.control}` for buttons, and `{typography.meta}` for source positions, counts and help.

Use `{typography.url}` for Full URL, both Domain forms, raw Path Segment and Query Parameter text, and safe-copy values. Independently isolate Unicode and ASCII/Punycode values; `dir="ltr"` and bidi isolation never change stored characters. No truncation of editable/verification values: wrap Full URL; confine essential horizontal scrolling to value fields, with labels, help, errors and actions outside their scroller.

## Layout & Spacing

One URL Workbench, maximum `{spacing.content-max}`. Use the approved 4/8/12/16/24/32 scale: major gaps `{spacing.5}` or `{spacing.6}`, group gaps `{spacing.4}`, row gaps `{spacing.row-gap}`, and field/action gaps `{spacing.3}`. Panels use `{spacing.panel-padding}` at adequate widths and `{spacing.3}` when narrow.

Full URL and Copy share a line at adequate widths: flexible textarea plus auto-width Copy, top-aligned, separated by `{spacing.3}`. Copy may wrap below only at narrow widths (the approved preview uses 700 CSS px). Undo stays in the same Full URL panel below; there is no separate Actions landmark. Full URL, Copy, current/last-valid context, and validation remain outside the three independent disclosures.

Body details, Paths, then Query Parameters stack with visible headings. Both Domain fields may share a line; query key/value/actions may share a row. At ≤700px these stack in unchanged source/reading order. The preview's 1280px split shows an annotation/mobile-example rail, not an application sidebar; its browser-frame corners and discovery captions are not application chrome.

Reflow at 320 CSS px and 400% zoom without page-level horizontal scrolling. Pointer targets are at least `{spacing.pointer-min}` square or satisfy the WCAG spacing exception; Copy, Add, Remove, Clear Search, drag handle and Move controls target `{spacing.control-target}` square. Widen the preview's illustrative 24/28px handle column to meet this contract; do not copy its undersized glyph container into the app. Disclosure headings target `{spacing.disclosure-target}` height, never below the control floor at narrow widths.

At high density, Full URL, Search, Copy, Undo, result summary and the top Add jump link remain quickly reachable without walking every row. The sole Add button is after the query list. If a header is sticky, it cannot obscure focus, headings, validation, status, or drop destinations.

WCAG 1.4.12 text-spacing overrides (1.5× line height, 2× paragraph spacing, 0.12× letter spacing, 0.16× word spacing) must cause no clipping, overlap, truncation, hidden controls or lost function at any supported width.

## Elevation & Depth

Tonal navy layers and clear boundaries, no default card shadows. No grid background, marketing gradients, decorative dashboard chrome or modal routine mutations. Sticky content may gain a separator, not elevation-driven hierarchy.

## Shapes

Approved panels/disclosures use `{rounded.lg}`; styled fields, rows, buttons and inline messages use `{rounded.md}`. Do not import discovery browser-frame radii as product components. Shape supplements labels and state, never replaces them.

## Components

Canonical identifiers match `EXPERIENCE.md.Component Patterns`. The [approved mockup](mockups/dark-workbench.html) illustrates valid desktop/narrow composition, both Domain fields, independent disclosures, duplicate query rows, a selected/focused move-control variant, and bottom Add placement; behavioral/error/drag recovery variants are spine-only.

| Component | Visual specification |
|---|---|
| `full-url-editor` | Persistent label and wrapping textarea using `{components.full-url-editor.typography}`, minimum `{components.full-url-editor.min-height}`. Error border, persistent help and external validation do not disappear on collapse. |
| `action-bar` | Inline Full URL panel utilities: Copy beside textarea, Undo below, feedback outside disclosures. No separate Actions region or top Add button. |
| `search-field` | Labeled “Search Managed Pieces,” styled input, Clear Search control and visible normative count. |
| `detail-group` | Three `{rounded.lg}` panels: body blue, Paths violet, Query Parameters teal. Counts/context accompany text headings; disclosure state is apparent without color. |
| `disclosure-control` | Visible heading/control and direction/state indicator; `{typography.group-title}` with count in `{typography.meta}`. Collapsed heading remains perceivable. |
| `passive-url-context` | Labeled scheme, present port/userinfo and supported Fragment context, wrapping raw values, no input-like editing affordance. |
| `managed-piece-list` | Ordered source collection within groups; heading/count and skip destinations remain clear. Markerless lists retain explicit list semantics. No implication that off-screen rows are absent. |
| `managed-piece-row` | Rounded bordered input-tone row, persistent field labels, current source position/occurrence text and actions. Selected/focused query row uses `{components.managed-piece-row.selected-background}` and explicit text/state. Query rows show the absent/empty/empty-entry descriptions from EXPERIENCE Query value shape in `{typography.meta}` using `{colors.text-secondary}`. Both Domain forms are editable; successful conversion uses status, invalid conversion uses persistent inline validation only. |
| `piece-type-label` | Text Domain, Path Segment or Query Parameter, plus source ordinal/total and duplicate occurrence; filtered-result position is separate. No color-only type coding. |
| `query-drag-handle` | Per-query grip on a named button, visible without hover, full-size target; selection/reveal state accompanies appearance. No grip on Paths. |
| `query-move-controls` | On-demand Up/Down button pair within the focused or selected row, using `{components.query-move-controls.background}`; readable disabled boundary states. No layout that hides a focused Move button. |
| `drop-indicator` | Static insertion line plus destination text/position; perceivable without animation and in forced colors. Not illustrated in the approved mock. |
| `remove-control` | Persistently labeled secondary Remove action for Path Segment/Query Parameter only; target size is not reduced for density. |
| `add-query-parameter-control` | One primary “Add Query Parameter” button at bottom of query list, reachable in empty/no-match states. |
| `add-query-jump-link` | Underlined top “Skip to Add Query Parameter” using `{colors.action}`, not another Add button. Bottom and focus-revealed row return links use the same treatment, wrap clearly and never obscure focused controls. |
| `undo-control` | Secondary “Undo” with text/programmatic inactive state when Initial URL is current. Shortcut help never replaces its label. |
| `copy-control` | Persistent primary “Copy” alongside Full URL; narrow wrapping only. No disclosure can hide it. |
| `safe-copy-readonly` | Labeled “Current URL” or “Last Valid URL” field with exact source visibly selected; outside disclosures. |
| `status-message` | Stable external polite-operation and actionable-failure areas. A labeled "Operation feedback" ordinary list presents exact chronological overflow outcomes, with `{typography.meta}`, readable wrapping and `{spacing.2}` between entries. No live role, forced focus or confusion with Undo History; feedback survives until reload/close. |
| `committed-state-banner` | Explicit Current URL / Last Valid URL context outside disclosures, including invalid-Draft explanation. No color-only safe-state claim. |
| `validation-message` | Persistent `{components.validation-message.foreground}` text/error boundary on `{components.validation-message.background}`; field association and external summary keep collapsed errors discoverable. |
| `no-results-state` | Plain text “0 of M” and Clear Search; sole bottom Add and top jump link stay findable. |

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use the approved dark navy layers, rounded panels, group accents and system typography. | Restore the old light identity, add a background grid, or clone reference-product features/marketing. |
| Keep Full URL and Copy always visible, with adjacent Copy on adequate widths. | Put Copy in a disclosure or wrap it below on a wide layout. |
| Pair group/state colors with text and programmatic state. | Treat blue/violet/teal as validation or color-only classification. |
| Provide primary query dragging plus focused/selected Up/Down controls. | Make drag optional future scope, drag-only, hover-only, or introduce Path reorder. |
| Put the sole Add button below query rows, with a top jump link. | Duplicate the top Add button or force traversal of hundreds of controls. |
| Preserve exact URL text, bidi isolation, 320px reflow and text-spacing tolerance. | Truncate critical values or reproduce the mock's undersized decorative handle. |
