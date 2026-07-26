# Portal Theme Authoring Guide

Portal themes are code-owned visual contracts. They can change presentation
without changing content hierarchy, layout, product vocabulary, permissions,
seeded content, or Payload workflows.

## Supported themes

The registry in `src/providers/Theme/themeRegistry.ts` is the source of truth:

- `raidguild-dark` is the default and preserves the established Portal look.
- `raidguild-light` is the complete light counterpart.

Stored `dark` and `light` preferences are legacy aliases. Theme initialization
normalizes them to the current keys. Do not remove those aliases without a
separate migration plan.

The root `data-theme` attribute selects tokens from
`src/app/(frontend)/theme.css`. `globals.css`, Tailwind, shared components, and
canvas consumers use those tokens.

## Adding a theme

1. Add a unique kebab-case key and human-readable label to `themeRegistry`.
2. Add a complete `[data-theme='<key>']` token block to `theme.css`.
3. Start from an existing complete token block; do not rely on accidental
   inheritance from another named theme.
4. Verify the selector, automatic OS preference behavior, persistence, and
   invalid-value fallback.
5. Run the automated and manual checks below in every supported theme.

## Theme contract

Themes may safely change:

- page, panel, card, popover, pill, and inverse surfaces
- primary, muted, inverse, link, button, status, and focus colors
- borders, dividers, shadows, and control/card radius
- display, body, and mono font families, provided the fonts are already loaded
- graph background, node types, links, active/dimmed states, and labels
- map HUD, dialog, marker, outline, and shadow tokens

Normal themes must not change:

- spacing, layout, content hierarchy, routes, or Portal terminology
- authorization, visibility, seeded content, or CMS workflow behavior
- Payload admin styling
- sprite sheets, map artwork, logos, icons, or other branded assets

The map is intentionally art-directed. Both web themes provide the same compact
`--map-*` contract today, so its HUD remains legible without recoloring the
world art. Email, Open Graph, and static-image colors retain a fixed RaidGuild
identity until separately scoped.

## Runtime consumers

DOM components should prefer semantic Tailwind names and shared `portal-*`
classes. Do not use `moloch`, `scroll`, `guild`, raw hex, or `text-white` for
ordinary UI.

Canvas libraries require resolved color strings. Use
`src/utilities/themeTokens.ts`; its hook observes root `data-theme` changes and
causes consumers to repaint. Add specialty tokens rather than reading
foundation palette aliases directly.

## Contrast and review

Text and interactive controls should meet WCAG AA contrast expectations. Check
normal, hover, focus, selected, disabled, error, warning, and success states.
Translucent surfaces must be reviewed over their real page background.

Run:

```sh
corepack pnpm lint
corepack pnpm build
corepack pnpm test:e2e
```

Then inspect both themes at desktop and mobile widths on:

- home and authenticated dashboard
- project list/detail and contribution request create/edit/detail
- event list/detail and cohort hub
- join, login, forgot/reset password, and member pages
- newsletter and rich-text/code content
- Portal Graph and Wiki Graph Explorer, including a live theme switch
- map dashboard HUD, dialogs, controls, and markers
- header, footer, forms, cards, pills, menus, focus rings, and status messages

Record intentional exceptions in the pull request. A new theme is incomplete if
a contributor must edit feature pages to make its core surfaces readable.
