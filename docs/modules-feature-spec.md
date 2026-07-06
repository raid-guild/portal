# Portal Modules Feature Spec

## Status

First slice implemented. Portal now has a module registry, `/modules` surface,
and an authenticated Portal Graph module. Use this spec to keep future modules
bounded and optional.

Modules are a way to let contributors explore Portal capabilities without
turning every experiment into a core primitive or primary navigation item.

## Product Intent

The Portal needs a place for bounded product experiments that can connect to
core community activity while staying optional.

Modules should answer:

- What experimental or bolt-on capabilities exist in the Portal?
- Which modules are active, prototype, deferred, graduated, or archived?
- Who owns or champions a module?
- Which core primitives does the module relate to?
- Where does someone go to use, review, or contribute to the module?
- What would make the module graduate into a core surface?

## Core Distinction

Core primitives model the community:

- `Brief`
- `Project`
- `Thread`
- `Activity Item`
- `Event`
- `Profile`

Modules model product capabilities:

- Infinite Wiki
- Bounty Board
- Leaderboard
- Calendar Subscription
- Agent Template Registry
- Resource Library
- Future recognition or engagement experiments

A project can build, maintain, or explore a module, but the project is not the
module.

Example:

```txt
Project: Infinite Wiki Exploration
- contributors
- related threads
- PRs and implementation notes
- activity items
- next actions

Module: Infinite Wiki
- status: experimental
- entry route: /wiki
- admin collections: wikiPages
- source project: Infinite Wiki Exploration
- related primitives: posts, projects, threads, events, profiles
- graduation criteria
```

## Non-Goals

- No plugin marketplace in the first version.
- No runtime install/uninstall system.
- No arbitrary third-party code execution.
- No module dependency graph in the first version.
- No moving stable core primitives into modules.
- No letting modules become hidden requirements for core portal flows.

## First-Version Product Scope

### Ship First

- A `modules` registry collection.
- A member-facing `/modules` page listing enabled or visible modules.
- A dashboard entry point for modules, such as a compact "Explore modules" link
  or a small module card.
- Module status labels: `idea`, `prototype`, `experimental`, `active`,
  `graduated`, `archived`.
- Module ownership fields for champion/editor/admin stewardship.
- Links to module entry routes, specs, related projects, and related primitives.
- CMS/admin grouping rules for module-owned collections.
- Clear rules that core routes cannot require optional modules to exist.

### Defer

- Runtime module installation.
- Module package manifests.
- Per-member module enablement.
- Module detail pages at `/modules/[slug]`.
- Automated graduation workflows.
- Module-specific notification subscriptions.
- Module ratings, comments, or public proposals.
- Cross-module dependency management.

External app launch and auth handoff should follow the separate
[External module launch auth](./external-module-launch-auth-feature-spec.md)
spec. The recommended first pattern is a short-lived signed launch token, not a
full OAuth/OIDC provider.

## Recommended User Surface

Route:

```txt
/modules
```

Initial exposure should be lightweight:

- Add a link or compact card from `/dashboard` to `/modules`.
- Keep modules out of the primary navigation until there are enough active
  modules to justify it.
- Keep module-specific routes discoverable from `/modules` first.
- Show unauthenticated visitors a teaser with join/login CTAs, but keep module
  details authenticated.
- Let verified users opt in to email alerts for new active or experimental
  modules from `/modules`; store that intent in notification preferences, not in
  a separate email-only list.
- Let each module own the simplest product route for its experience, such as
  `/wiki`, `/bounty-board`, or `/leaderboard`. Do not force feature routes under
  `/modules`.

The modules index should be a discovery surface, not a marketing page.

Recommended sections:

- Active modules members can use now.
- Experimental modules seeking feedback.
- Prototype or idea-stage modules looking for contributors.
- Graduated modules that have become core surfaces.

Each module card should show:

- name
- short summary
- category
- status
- entry route
- owner/champion
- related project, if any
- related core primitives
- spec or documentation link

Module detail pages can be added when a module needs more context than a card
can hold.

## CMS Model

Modules are managed in Payload so the dashboard and `/modules` page can be
updated without code changes.

Collection slug:

```txt
modules
```

Recommended fields:

```txt
name: text, required
slug: text, unique, required
summary: textarea, required
status: idea / prototype / experimental / active / graduated / archived
category: ops / tools / analytics / games / knowledge / community
visibility: public / authenticated / member / admin
entryRoute: text
adminRoute: text
specURL: text
repositoryURL: text
sourceProject: relationship -> projects
relatedProjects: relationship -> projects, many
relatedThreads: relationship -> threads, many
relatedEvents: relationship -> events, many
relatedProfiles: relationship -> profiles, many
owners: relationship -> profiles, many
corePrimitiveRelationships: array
enabled: checkbox
featured: checkbox
graduationCriteria: textarea
riskNotes: textarea
lastReviewedAt: date
```

Recommended admin columns:

```txt
name
category
status
enabled
featured
sourceProject
updatedAt
```

`enabled` means the module is listed on member-facing module surfaces. It is not
a complete runtime feature flag.

`entryRoute` should point to the module's actual product surface. It does not
need to be nested under `/modules`.

For external app modules, future fields should distinguish normal internal
routes from signed launch handoffs. Do not overload `entryRoute` with secrets or
raw auth tokens.

## Payload Admin Grouping

Core primitive collections should stay in the `Portal` admin group.

Module-owned collections should use a separate admin group:

```ts
admin: {
  group: 'Modules',
}
```

Examples:

- `wikiPages` -> `Modules`
- future `bounties` -> `Modules`

Shared infrastructure collections can stay in `Portal` when they are used by
core flows as well as modules. Examples: notifications, badges, point events,
profiles, and the `modules` registry itself.

## Dependency Rules

Core Portal surfaces must not depend on optional modules.

Rules:

- `/`, `/dashboard`, `/me`, `/members`, `/projects`, `/events`, `/posts`, and
  `/inbox` should render if no module collections exist.
- Core collections should not require relationships to module-owned
  collections.
- Module relationships from core primitives should be optional and additive.
- A disabled module should remove its primary entry point but not break related
  core pages.
- Module hooks may create activity, notifications, or related records only when
  the module is enabled and the target primitive supports the relationship.
- Module announcement notifications should only fire on the transition into an
  enabled, visible `active` or `experimental` state and should respect explicit
  user notification preferences.
- A module can read core primitives according to their visibility rules, but it
  must not weaken those rules.

## Project Relationship

Projects and modules are separate objects.

Use a project when there is collaborative work:

- contributors
- related threads
- PRs
- activity items
- next actions

Use a module when there is a Portal capability:

- entry route
- module status
- CMS/admin collections
- owner/champion
- visibility
- graduation criteria

Recommended relationship:

```txt
Project.sourceOrMaintainedModules -> modules[]
Module.sourceProject -> projects
Module.relatedProjects -> projects[]
```

Do not put module lifecycle fields directly on projects unless the module
registry is intentionally deferred.

## Module Spec Requirements

Every module spec should define:

- module status and maturity
- user value
- core primitives it relates to
- collections it owns
- admin group for owned collections
- routes it owns
- access and visibility rules
- seed data expectations
- notification or activity behavior
- dependency boundaries with core surfaces
- graduation criteria
- deferred behavior

## Graduation Criteria

A module can graduate toward core navigation or core product treatment when it
has:

- repeated member usage
- clear stewardship
- stable access rules
- passing e2e coverage for important flows
- documented source of truth
- low risk of confusing core primitives
- a clear reason to appear in primary navigation or dashboard flows

Graduation does not always mean becoming a core primitive. It may only mean the
module is stable, supported, and visible from core surfaces.

## Open Questions

- Should module activity create `ActivityItem` records automatically, or only
  when an editor publishes a module update?
