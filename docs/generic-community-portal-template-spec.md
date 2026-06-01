# Generic Community Portal Template Product Spec

## Status

Future separate repo/product direction. This spec captures what it would take to
extract the reusable Portal patterns into a less RaidGuild-specific Railway
template.

This is not current app implementation work. The RaidGuild Portal should remain
the production app for RaidGuild. A generic template should be a separate repo
once the primitives stabilize.

## Product Intent

Create a reusable Payload + Next + Railway template for communities that need a
living activity portal rather than a generic CMS starter.

The template should help a community show what is happening now, who is
involved, where to join live activity, what work is active, and how agents can
help maintain useful context.

Target users:

- contributor communities
- guilds and collectives
- accelerators and cohorts
- open-source ecosystems
- agencies or expert networks
- DAO-adjacent working groups
- learning communities that are not full course platforms

## Core Positioning

Working name:

```txt
Community Portal Railway Template
```

Positioning:

```txt
A deployable activity portal for communities, cohorts, and contributor networks
that want profiles, projects, sessions, updates, and agent-assisted publishing
without starting from a blank CMS.
```

This should not be positioned as:

- a project management tool
- a Discord replacement
- a course platform
- a newsletter tool
- a generic Payload boilerplate
- an AI content feed

The strongest reusable opinion is:

```txt
Make real community activity visible, searchable, and actionable for humans and
agents.
```

## Reusable Core

The generic template can keep most of the current technical and product surface:

- Payload 3 + Next app structure
- Railway-ready deployment assumptions
- auth, users, roles, and email verification
- profile creation and public member profiles
- projects as lightweight collaboration surfaces
- posts with visibility and publishing workflow
- sessions/events with join and calendar links
- comments
- notifications and preferences
- badges and points
- contribution requests
- modules registry
- agent skill delivery endpoint
- seed/dev/e2e workflow
- public/authenticated/member/admin visibility model

## RaidGuild-Specific Pieces To Extract

The following should become presets, examples, or separate seed packs rather
than hardcoded template defaults:

- RaidGuild name, logos, links, footer, and social copy
- current visual branding and color palette
- "guild", "raid", "cohort", "How to RaidGuild", and similar vocabulary
- seeded skills
- seeded profile roles
- seeded badges
- seeded posts, sessions, projects, briefs, and threads
- agent skill examples using RaidGuild context
- docs that describe RaidGuild-specific product direction
- launch announcement and BD funnel language
- Queen Raida or Prism-specific copy unless presented as optional integration

## Configuration Strategy

Introduce a lightweight site configuration layer in the template repo.

Example:

```ts
export const siteConfig = {
  name: 'Community Portal',
  shortName: 'Portal',
  description: 'A live surface for community activity.',
  url: process.env.NEXT_PUBLIC_SITE_URL,
  logo: {
    light: '/brand/logo-light.svg',
    dark: '/brand/logo-dark.svg',
  },
  links: {
    source: '',
    discord: '',
    x: '',
  },
  vocabulary: {
    member: 'member',
    project: 'project',
    session: 'session',
    brief: 'brief',
    contributionRequest: 'request',
  },
}
```

Template UI should prefer `siteConfig` for obvious branded text and links.

Do not overbuild multi-tenant support. This is a single-community starter, not a
SaaS tenant platform.

## Seed Strategy

Separate seed packs are the main extraction boundary.

Recommended structure:

```txt
src/endpoints/seed/presets/
  generic/
  raidguild/
  test/
```

Generic seed should include neutral examples:

- profile roles: Designer, Engineer, Operator, Researcher, Facilitator
- skills: Product, Design, Frontend, Backend, Writing, Community, DevOps
- badges: Founder, Host, Contributor, Mentor
- sessions: Demo Session, Weekly Coworking, Community Workshop
- projects: Community Knowledge Base, Onboarding Guide, Demo Project
- posts: neutral launch/update examples
- briefs/activity: generic, dated, testable activity

RaidGuild seed should remain available only as an example or downstream app
preset.

Test seed should stay deterministic and not rely on branded demo content.

## Branding Strategy

The generic template should ship with restrained neutral branding.

Move brand assumptions into:

```txt
src/config/site.ts
public/brand/
src/app/(frontend)/theme.css
```

The template should document:

- how to replace logo assets
- how to adjust colors
- how to update navigation and footer links
- how to select seed preset
- how to update public copy

## Agent Skill Strategy

Agent support is one of the strongest template differentiators.

Recommended split:

```txt
.agents/skills/community-memory-publisher/
.agents/skills/portal-memory-publisher/
```

Generic skill:

- explains the reusable primitives
- includes neutral examples
- supports review-first update proposals
- avoids invented activity
- documents API paths for posts, sessions, projects, briefs, and requests

RaidGuild skill:

- can remain in the RaidGuild app repo
- specializes vocabulary, examples, and policy
- references Prism/Queen Raida only where relevant

The template should expose the generic skill from an endpoint similar to:

```txt
/api/portal/skills/community-memory-publisher
```

## Documentation Strategy

Generic repo docs should describe the reusable product and deployment model.

RaidGuild-specific docs should move into:

```txt
docs/examples/raidguild/
```

or stay only in the RaidGuild app repo.

Generic docs should include:

- setup and Railway deploy guide
- seed preset guide
- collection/primitives guide
- visibility and roles guide
- agent skill guide
- content policy guide
- email configuration guide
- Discord/session integration guide
- customization guide

## Product Primitives

The generic template should keep the current primitive model, but describe it in
community-neutral language.

- `Brief`: current snapshot of community activity
- `Project`: focused collaboration surface
- `Thread`: persistent storyline or line of work
- `Activity Item`: dated factual signal
- `Event`: scheduled gathering or calendar anchor
- `Profile`: person or contributor identity

Optional feature modules:

- `Contribution Request`
- `Badges`
- `Points`
- `Notifications`
- `Modules`
- future `Wiki`
- future `Inquiries`

## MVP Extraction Plan

### Phase 1: Brand And Copy Isolation

- Add `siteConfig`.
- Replace obvious hardcoded RaidGuild names in frontend surfaces.
- Move footer/header links to config.
- Keep RaidGuild-specific copy in the RaidGuild app repo or preset.

### Phase 2: Seed Presets

- Create generic seed preset.
- Keep deterministic test seed independent from brand content.
- Move RaidGuild seed content behind an explicit preset flag.
- Document local seed and production seed expectations.

### Phase 3: Generic Agent Skill

- Create generic community memory publisher skill.
- Update served skill endpoint.
- Remove RaidGuild-specific examples from generic skill.
- Keep clear review-first agent defaults.

### Phase 4: Template Docs

- Write deploy/customization docs.
- Document required and optional env vars.
- Document how to connect email, Discord, and agent workflows.
- Include screenshots once the neutral theme exists.

### Phase 5: Separate Repo

- Create new repo only after extraction boundaries are clear.
- Keep RaidGuild Portal as downstream app or reference implementation.
- Decide whether changes flow upstream from RaidGuild to the template manually
  or through selective cherry-picks.

## Effort Estimate

Rough estimate:

- 1 day: obvious config/copy extraction and neutral seed draft
- 2-3 days: clean seed presets, generic skill, docs split, and branding pass
- 1 week: polished template repo with setup docs, screenshots, Railway deploy
  path, and stable e2e tests

## Risks

- Over-generalizing too early and weakening the useful product opinion.
- Letting the generic template become another CMS starter instead of an
  activity portal.
- Carrying too much RaidGuild-specific vocabulary into the template.
- Breaking deterministic seed/e2e behavior during seed preset extraction.
- Creating a maintenance burden between the RaidGuild app and template repo.

## Open Questions

- Should the template repo be a clean extraction or a fresh scaffold informed by
  this app?
- Should RaidGuild become a preset inside the template, or should it remain a
  downstream app only?
- What is the minimum useful generic seed?
- Should the generic template include Discord scheduled event sync by default or
  as an optional module?
- Should points/badges ship enabled by default, or as documented optional
  modules?
- How opinionated should the visual design be before customization?

## Deferred

- Multi-tenant SaaS support.
- White-label admin UI.
- Theme marketplace.
- Plugin marketplace.
- Automated migration path from the RaidGuild app to the template.
- Fully generic copy polished for launch.
