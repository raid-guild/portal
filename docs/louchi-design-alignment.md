# Louchi Design Alignment

The Portal shell follows the Louchi 1.1 system from the RaidGuild brand repository's
`feat/versioned-brand-reigns` branch. The implementation reference for this pass is
commit `6684445`.

## Aligned foundations

- Louchi day and night semantic surface colors
- Coral primary actions, acid-lime day accents, and moon-cyan night accents
- Louchi radius and focus-ring treatments
- A 1280px maximum content width with responsive gutters
- Editorial display scale and relaxed body copy
- Shared button, card, field, select, checkbox, header, and footer geometry
- Durable crossed-swords mark in the Portal shell
- `data-brand-reign="louchi"` on the document root

The existing `raidguild-light` and `raidguild-dark` keys remain in place for stored
theme compatibility. Their user-facing labels are now `Louchi Day` and `Louchi Night`.
The specialized RaidGuild AI and archived classic themes remain available.

## Remaining gaps

1. **Canonical fonts:** the brand package exports the Mazius Display, EB Garamond,
   and Ubuntu Mono assets, but Portal does not consume them yet. CSS currently retains
   the correct family contract with fallbacks.
2. **Package-consumer integration:** the brand repository now provides an installable,
   versioned `@raidguild/brand-system` contract. Portal still owns a compatibility layer;
   the next integration pass should install a release artifact, import its tokens and
   fonts, and register its component sources with Tailwind.
3. **Component coverage:** Portal has a small shared UI set compared with Storybook.
   Forms and overlays should migrate incrementally as the brand components receive a
   stable package boundary.
4. **Hero art direction:** the Storybook Hero Discovery pattern depends on Louchi
   illustration assets and interaction behavior that are not yet packaged for Portal.
   It should be adopted as a separate, accessible feature rather than embedded in the
   global style migration.
5. **Visual regression checks:** Portal's Playwright suite validates behavior but does
   not yet maintain Louchi shell screenshots at mobile and desktop breakpoints.

## Maintenance

When the brand source changes, compare Portal against:

- `src/brand/system.ts`
- `src/generated/brand-tokens.css`
- `src/app/globals.css`
- `src/lib/fonts.ts`
- Storybook foundation and primitive stories

Keep Portal styles semantic. Do not copy palette hex values into route components.
