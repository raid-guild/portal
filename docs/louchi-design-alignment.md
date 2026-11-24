# Louchi Design Alignment

Portal now uses the current Storybook alignment documented in
[the theme authoring guide](theme-authoring-guide.md#louchi-storybook-alignment).
Venture Beyond Extended upright, native italic, and Retalic variable display faces, Ubuntu body faces, and Ubuntu Mono are bundled as site assets. Last Duel was removed after the brand Eurostile metadata audit; older Grinder files remain inactive historical assets.
The active typography treatment follows the merged [website PR #111](https://github.com/raid-guild/website/pull/111): Extended faces pin width 125% with size-adjust 105.4%, and paired major headings use Retalic above native Italic at weight 900 and zero tracking. Base Venture Beyond faces retain the full variable width range for experiments.
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
