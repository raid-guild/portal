# Portal Theme Authoring Guide

Portal themes are code-owned visual contracts. They can change presentation
without changing content hierarchy, layout, product vocabulary, permissions,
seeded content, or Payload workflows.

## Supported themes

The registry in `src/providers/Theme/themeRegistry.ts` is the source of truth:

- `raidguild-dark` is the default and preserves the established Portal look.
- `raidguild-light` is the complete light counterpart.
- `raidguild-classic` is a modernized interpretation of the earlier RaidGuild
  design system, with ruby and purple accents and legacy typography.

Stored `dark` and `light` preferences are legacy aliases. Theme initialization
normalizes them to the current keys. Do not remove those aliases without a
separate migration plan.

An absent preference uses `raidguild-dark`. Automatic OS color-scheme behavior
is opt-in: selecting `Auto` stores the explicit `auto` preference. This keeps a
first visit deterministic while preserving OS-aware switching for people who
choose it.

The root `data-theme` attribute selects tokens from
`src/app/(frontend)/theme.css`. `globals.css`, Tailwind, shared components, and
canvas consumers use those tokens.

## Adding a theme

1. Add a unique kebab-case key and human-readable label to `themeRegistry`.
2. Add a complete `[data-theme='<key>']` token block to `theme.css`.
3. Start from an existing complete token block; do not rely on accidental
   inheritance from another named theme.
4. Add the key to the initialized-theme visibility selector at the end of
   `globals.css` so the document becomes visible after initialization.
5. Load any theme-specific font files globally before referencing them from
   theme tokens.
6. Verify the selector, automatic OS preference behavior, persistence, and
   invalid-value fallback.
7. Run the automated and manual checks below in every supported theme.

The classic font assets are self-hosted under
`public/fonts/raidguild-classic`. Their source files came from the archived
`dot-org-v2/public/fonts` site repository; keep that provenance documented if
the assets are replaced.

## Theme contract

Themes may safely change:

- page, panel, card, popover, pill, and inverse surfaces
- primary, muted, inverse, link, button, status, and focus colors
- borders, dividers, shadows, heading glow, and control/card radius
- display, body, and mono font families, provided the fonts are already loaded
- graph background, node types, links, active/dimmed states, and labels
- map HUD, dialog, marker, outline, and shadow tokens

Normal themes must not change:

- spacing, layout, content hierarchy, routes, or Portal terminology
- authorization, visibility, seeded content, or CMS workflow behavior
- Payload admin styling
- sprite sheets, map artwork, logos, icons, or other branded assets

The map is intentionally art-directed. All current web themes provide the same
compact `--map-*` contract today, so its HUD remains legible without recoloring
the world art. Email, Open Graph, and static-image colors retain a fixed
RaidGuild identity until separately scoped.

## Branded assets

Logos, icons, sprites, illustrations, Open Graph images, email artwork, and map
world art are assets rather than ordinary theme tokens.

- Reuse an existing asset when it remains legible on the new theme.
- When a theme requires a variant, add an explicitly named asset and document
  where the application selects it.
- Preserve accessible text, intrinsic dimensions, rights, and source
  provenance when adding or replacing an asset.
- Do not recolor raster assets in CSS or silently replace RaidGuild marks.
- Keep asset selection separate from authorization, content, and CMS behavior.

Theme-specific font files are also branded assets. Load them globally before
using their family names in a theme token, and document their source and
license alongside the files.

## Runtime consumers

DOM components should prefer semantic Tailwind names and shared `portal-*`
classes. Do not use `moloch`, `scroll`, `guild`, raw hex, or `text-white` for
ordinary UI.

Canvas libraries require resolved color strings. Use
`src/utilities/themeTokens.ts`; its hook observes root `data-theme` changes and
causes consumers to repaint. Add specialty tokens rather than reading
foundation palette aliases directly.

## Remaining exceptions

The following compatibility boundaries are not invitations to use brand values
in new feature code:

- Tailwind retains the `moloch`, `scroll`, `guild`, and `neutral.black`
  aliases while older components are migrated. New reusable UI should use
  semantic tokens.
- The map world, sprites, email artwork, Open Graph assets, and other static
  images keep a fixed RaidGuild identity until separately scoped.
- Feature-specific hard-coded colors may still exist outside the core contract.
  Record any discovered exception in the pull request instead of adding a
  theme-specific patch to the feature page.
- Payload admin theming remains out of scope.

If a new theme needs feature-page edits for its core surfaces to remain
readable, treat that as a contract gap. Add or repair a semantic token or shared
component utility instead of coupling the page to the new theme key.

## Example theme diff

Register the theme:

```ts
// src/providers/Theme/themeRegistry.ts
export const themeRegistry = [
  // Existing themes...
  {
    key: 'community-sand',
    label: 'Community Sand',
    prefersColorScheme: 'light',
  },
] as const
```

Define a complete token block:

```css
/* src/app/(frontend)/theme.css */
[data-theme='community-sand'] {
  color-scheme: light;

  --background: 42 45% 96%;
  --foreground: 20 24% 14%;
  --card: 40 34% 90%;
  --card-foreground: var(--foreground);
  --primary: 18 55% 38%;
  --primary-hover: 18 58% 29%;
  --primary-foreground: 42 45% 98%;

  /*
   * Copy and deliberately review every remaining foundation, semantic, code,
   * graph, and map token from an existing complete theme.
   */
}
```

Allow the initialized document to become visible:

```css
/* src/app/(frontend)/globals.css */
html[data-theme='community-sand'] {
  visibility: visible;
}
```

This abbreviated diff demonstrates registration and selector placement only.
Do not ship inherited omissions, placeholder values, or a partial token block.
If the theme adds fonts or branded assets, include those files and their
provenance in the same change.

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

Then inspect all themes at desktop and mobile widths on:

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

## Pull request evidence

Include:

- the theme key, visual intent, and preferred color scheme
- desktop and mobile screenshots of representative public and authenticated
  surfaces
- contrast notes for text, links, controls, focus, and status states
- results from the automated commands above
- branded-asset and font decisions, including provenance
- a list of intentional exceptions or deferred contract gaps
- confirmation that legacy preferences and invalid values still normalize
  safely
- confirmation that the theme required no feature-page styling branches
