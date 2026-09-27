# Louchi Design Alignment

Portal now uses the current Storybook alignment documented in
[the theme authoring guide](theme-authoring-guide.md#louchi-storybook-alignment).
Grinder display faces, Ubuntu body faces, and Ubuntu Mono are bundled locally.
Louchi Day and Night use semantic colors, readable links and logos, and shared
control and card radius tokens. Classic and AI themes retain their own styling.

The completed alignment supersedes the earlier Tailwind 4 prototype with the
verified Tailwind 3 HSL adapter. The Portal shell uses the existing RaidGuild
Cohort logo with a dark ink variant for Louchi Day. Portal owns its compatibility
layer rather than importing a brand package.

This feature branch retains its system preference behavior: first visits follow
the OS color scheme, System tracks OS changes, and explicit choices persist.
Private modules remain excluded from the public sitemap.

When the Storybook source changes, compare the bundled fonts, semantic theme
tokens, and shared primitives against the references in the theme authoring
guide. Keep route styling semantic.
