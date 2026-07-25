# Themeability Refactor Spec

## Status

Planned frontend infrastructure work. This spec documents the refactor needed to
make the Portal support multiple maintainable visual themes without rewriting
feature UI.

This is not a product primitive. It should not add collections, workflows, or
theme management UI until there is a clear operational need. Start with a
code-owned theme contract and documentation for contributors.

## Intent

The Portal currently has a useful Tailwind and CSS-variable foundation, but the
implemented frontend is still primarily one dark RaidGuild brand theme.

The refactor should make themes easy to add, review, and maintain by moving
visual decisions into semantic tokens and shared component contracts.

The work should answer:

- What can a theme change safely?
- Where does a new theme define colors, fonts, borders, shadows, and surfaces?
- Which UI areas are intentionally outside the normal theme system?
- How do contributors verify that a theme works across public, authenticated,
  admin-adjacent, graph, and map experiences?

## Current State

The app already has:

- `data-theme` on `html`
- `ThemeProvider`, `InitTheme`, and `ThemeSelector`
- Tailwind colors backed by CSS variables for `background`, `foreground`,
  `card`, `primary`, `secondary`, `muted`, `accent`, `border`, `ring`, and
  status colors
- shared portal utility classes such as `portal-panel`, `portal-card`,
  `portal-pill`, `portal-link`, and `portal-admin-link`
- a global `--radius` token

The gaps:

- `light` and `dark` exist as theme names, but `light` does not have a distinct
  complete palette.
- Theme constants are duplicated between `Theme/shared.ts` and
  `Theme/ThemeSelector/types.ts`.
- Core UI still uses brand palette names such as `moloch`, `scroll`, `guild`,
  and `neutral-black`.
- Some components use raw hex, raw `rgba`, `text-white`, hard-coded shadows,
  and brand-specific gradients.
- The graph explorers and map dashboard use canvas/runtime colors that are not
  connected to CSS variables.
- Font families are centralized in Tailwind but are not runtime theme tokens.

## Non-Goals

- Do not build multi-tenant theme administration.
- Do not let CMS users edit arbitrary CSS.
- Do not redesign Portal product flows as part of this refactor.
- Do not remove the RaidGuild visual identity from the current default theme.
- Do not theme the Payload admin UI beyond existing custom admin branding unless
  a separate admin-theme task is explicitly planned.

## Theme Contract

Create a documented theme contract with three layers.

### Foundation Tokens

These describe raw design values:

- background and foreground colors
- brand/accent palette
- neutral palette
- success, warning, error, destructive colors
- border and input colors
- focus ring color
- radius scale
- shadow colors
- font family variables

### Semantic Surface Tokens

These describe how the app uses foundation values:

- `--surface-page`
- `--surface-panel`
- `--surface-card`
- `--surface-card-hover`
- `--surface-popover`
- `--surface-inverse`
- `--text-primary`
- `--text-muted`
- `--text-inverse`
- `--link`
- `--link-hover`
- `--button-primary`
- `--button-primary-hover`
- `--button-primary-text`
- `--button-secondary`
- `--button-secondary-hover`
- `--pill-bg`
- `--pill-text`
- `--divider`
- `--shadow-soft`
- `--shadow-emphasis`

Names can change during implementation, but the final contract should prefer
role-based names over RaidGuild-specific names.

### Specialty Tokens

Add focused tokens for surfaces that cannot rely only on Tailwind classes:

- graph background, node, link, active, dimmed, and label colors
- wiki graph node type colors
- map HUD panel, map dialog, map marker, map shadow, and overlay colors
- code block background, line number, and syntax theme choice
- email template colors if the newsletter and transactional emails should track
  the web theme later

## Implementation Plan

### Phase 1: Theme Model Cleanup

- Consolidate theme constants into one source of truth.
- Decide the initial supported themes. Recommended first set:
  - `raidguild-dark`
  - `raidguild-light`
- Keep backward compatibility for existing stored `light` and `dark` values by
  mapping them to the new theme keys or keeping aliases.
- Update `themeIsValid`, `InitTheme`, `ThemeProvider`, and `ThemeSelector` to
  read from the shared theme list.
- Ensure the default theme is explicit and documented.

Acceptance:

- No duplicate theme constant files.
- Invalid stored theme values fall back safely.
- Existing users with `payload-theme=light` or `payload-theme=dark` do not see a
  broken or unstyled page.

### Phase 2: Define Complete Theme Tokens

- Split token definitions into a clear frontend theme file, for example:

```txt
src/app/(frontend)/theme.css
```

- Keep `globals.css` for Tailwind layers, base element styling, and component
  utility classes.
- Define complete token sets for each supported theme.
- Add real values for a light theme, including page background, text, panels,
  borders, muted text, links, focus states, and status colors.
- Keep existing RaidGuild dark values as the default visual baseline.

Acceptance:

- Switching themes visibly changes the app.
- Both supported themes pass basic contrast review on core text, links, inputs,
  buttons, panels, and status messages.

### Phase 3: Replace Brand-Specific Utility Usage

Refactor high-impact hard-coded brand classes to semantic classes or CSS
variables.

Priority areas:

- `src/components/ui/button.tsx`
- `src/Footer/Component.tsx`
- `src/components/AdminBar/index.tsx`
- `src/blocks/Code/Component.client.tsx`
- `src/app/(frontend)/events/page.tsx`
- `src/app/(frontend)/cohorts/[slug]/page.tsx`
- `src/app/(frontend)/_components/WidgetBubble.tsx`
- project, request, and event creation forms using repeated
  `border-scroll-100/25 bg-card/35`

Guidelines:

- Prefer semantic tokens such as `primary`, `card`, `muted`, `border`, and new
  surface tokens over `moloch`, `scroll`, `guild`, and `neutral-black`.
- Keep brand palette names available only inside theme definitions or for
  explicitly branded assets.
- Replace repeated one-off form classes with shared field or form-surface
  classes.

Acceptance:

- Most app chrome and reusable components no longer reference RaidGuild palette
  names directly.
- Default, outline, secondary, link, and destructive buttons work in every
  supported theme.

### Phase 4: Component Utility Expansion

Extend shared component classes so feature pages need fewer one-off styling
decisions.

Candidate utilities:

- `portal-field`
- `portal-textarea`
- `portal-select`
- `portal-menu`
- `portal-menu-item`
- `portal-callout`
- `portal-live-banner`
- `portal-empty-state`
- `portal-section-divider`
- `portal-token-row`

Only add utilities that remove real duplication or reduce theme leakage.

Acceptance:

- Forms, menus, cards, pills, and callouts can be restyled centrally.
- Feature pages still remain readable and do not become class-name soup hidden
  behind overly broad utilities.

### Phase 5: Graph And Canvas Theme Plumbing

Connect graph explorers to theme variables.

Tasks:

- Add a helper that reads CSS variables from the graph container or document
  root.
- Replace hard-coded graph colors in `PortalGraph` and `WikiGraphExplorer` with
  specialty graph tokens.
- Define node-type color tokens for profile, role, skill, article, category,
  possible, source, and topic nodes.
- Recompute runtime colors when `data-theme` changes.

Acceptance:

- Portal Graph and Wiki Graph Explorer visually update after theme changes.
- Active, dimmed, hover, selected, and label states remain legible.

### Phase 6: Map Dashboard Theme Boundary

Decide whether the map dashboard is:

- a fully themeable app surface, or
- a deliberately art-directed mini experience with a smaller token set.

Recommended first approach: keep it art-directed, but replace raw panel,
dialog, marker, outline, and shadow colors with `--map-*` tokens.

Tasks:

- Add map specialty tokens.
- Replace raw `rgba`, hex colors, and direct `neutral-black` dependencies where
  they control HUD/dialog UI.
- Keep sprite sheets and map art unchanged.

Acceptance:

- Map UI controls remain readable in each supported theme.
- The map still feels like a distinct game-like dashboard.

### Phase 7: Typography And Radius Themeability

Make typography and shape decisions explicit.

Tasks:

- Decide whether themes may change fonts at runtime.
- If yes, map Tailwind font families to CSS variables:

```js
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  serif: ['var(--font-serif)', 'Georgia', 'serif'],
  sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
  mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
}
```

- Add radius tokens for panel, button, input, pill, avatar, and modal surfaces if
  `--radius` alone is too blunt.
- Audit `rounded-full` and one-off `rounded` usage to decide what is semantic
  shape versus content shape.

Acceptance:

- Theme docs clearly state whether fonts are runtime-changeable.
- Radius changes do not break avatars, pills, controls, or map UI.

### Phase 8: Theme Verification

Add a repeatable verification checklist.

Recommended manual/browser coverage:

- public home
- authenticated dashboard
- project list and project detail
- events list and event detail
- cohort hub
- join/login/reset flows
- member directory and profile
- contribution request create/edit/detail
- newsletter module
- Portal Graph
- Wiki Graph Explorer
- map dashboard
- post detail with rich text/code block
- mobile viewport for header, footer, forms, and cards

Automated checks:

- run the existing e2e suite for behavior regressions
- add visual smoke screenshots only if the team is ready to maintain them
- add a lightweight unit or integration check for theme key validation if
  practical

Acceptance:

- `corepack pnpm test:e2e` passes after theme refactor work.
- Manual screenshot review covers both supported themes before release.

## Guide For Adding New Themes

Create a contributor guide as part of this work.

Recommended file:

```txt
docs/theme-authoring-guide.md
```

The guide should cover:

- supported theme keys and naming rules
- where theme tokens live
- how to add a new theme to the shared theme list
- how `data-theme` is applied
- what is safe to change:
  - colors
  - foreground/background contrast
  - primary/accent colors
  - status colors
  - panel/card/pill surfaces
  - borders and dividers
  - focus rings
  - shadows
  - radius
  - fonts, if implemented as runtime tokens
  - graph node/link colors
  - map HUD/dialog colors
- what should not be changed in a normal theme:
  - content hierarchy
  - spacing and layout primitives
  - Portal product vocabulary
  - seeded content
  - authorization or visibility behavior
  - Payload admin workflows
- contrast expectations
- manual QA checklist
- example diff for adding a theme
- guidance for branded assets such as logo variants and icons

Acceptance:

- A contributor can add a new theme without hunting through feature pages.
- The guide names the remaining exceptions where component work is still needed.

## Suggested File Structure

Potential target structure:

```txt
src/providers/Theme/
  index.tsx
  InitTheme/index.tsx
  ThemeSelector/index.tsx
  themeRegistry.ts
  types.ts

src/app/(frontend)/
  globals.css
  theme.css

src/utilities/
  themeTokens.ts

docs/
  themeability-refactor-spec.md
  theme-authoring-guide.md
```

Only add `themeTokens.ts` if runtime consumers such as graph or canvas
components need a shared helper.

## Risks

- A visual theme can pass core pages but fail graph/canvas surfaces if runtime
  colors are not included.
- A true light theme may expose contrast problems in older page-specific
  classes.
- Too many component utility classes can obscure page structure.
- Runtime font switching may be more complexity than the initial theme work
  needs.
- Raw brand colors may remain in email templates, Open Graph assets, and static
  images unless explicitly included in scope.

## Open Questions

- Should the first new theme be a true RaidGuild light theme or a neutral
  community-template theme?
- Should the default stored theme key remain `light`, or should the app migrate
  to explicit keys such as `raidguild-dark`?
- Should graph colors be theme-owned or data-type-owned with only contrast
  adjustments per theme?
- Should email/newsletter templates follow the web theme or keep a fixed
  RaidGuild email identity?
- Should logo assets be part of theme selection, or remain site configuration?

## Release Checklist

- Theme constants consolidated.
- Complete dark and light token sets defined.
- Reusable components moved to semantic tokens.
- Graph and map specialty tokens implemented or explicitly deferred.
- Theme authoring guide written.
- Feature spec index updated.
- Relevant screenshots reviewed in each supported theme.
- `corepack pnpm test:e2e` run for behavior coverage.
