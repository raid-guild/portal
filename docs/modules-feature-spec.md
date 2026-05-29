# Portal Modules Feature Spec

## Status

Future core platform capability. Define before implementing experimental
modules like Infinite Wiki.

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
- Contribution Requests
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

- A module registry model or documented convention.
- A member-facing `/modules` page listing enabled or visible modules.
- Optional module detail pages at `/modules/[slug]`.
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
- Automated graduation workflows.
- Module-specific notification subscriptions.
- Module ratings, comments, or public proposals.
- Cross-module dependency management.

## Recommended User Surface

Route:

```txt
/modules
```

The modules index should be a discovery surface, not a marketing page.

Recommended sections:

- Active modules members can use now.
- Experimental modules seeking feedback.
- Prototype or idea-stage modules looking for contributors.
- Graduated modules that have become core surfaces.

Each module card should show:

- name
- short summary
- status
- entry route
- owner/champion
- related project, if any
- related core primitives
- spec or documentation link

Module detail pages can be added when a module needs more context than a card
can hold.

## CMS Model Options

### Option A: Documented Convention First

Start with docs and explicit per-feature specs. Each module spec must define its
own collection grouping, routes, relationships, access rules, and graduation
criteria.

This is enough when there are only one or two experimental modules.

### Option B: `modules` Collection

Add a registry collection when modules need to be managed in the CMS.

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
owners: relationship -> users or profiles, many
corePrimitiveRelationships: select or array
enabled: checkbox
featured: checkbox
graduationCriteria: textarea
riskNotes: textarea
lastReviewedAt: date
```

Recommended admin columns:

```txt
name
status
enabled
featured
sourceProject
updatedAt
```

Use this option when the Portal has enough modules that `/modules` should be
CMS-managed instead of hard-coded.

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
- `contributionRequests` -> `Modules`
- `moduleDefinitions` or `modules` -> `Modules`

Shared infrastructure collections can stay in `Portal` when they are used by
core flows as well as modules. Examples: notifications, badges, point events,
profiles.

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

- Should the first version create a real `modules` collection, or use a
  documented convention until more than one module needs a surfaced registry?
- Should `/modules` show public modules to unauthenticated visitors, or start
  authenticated/member-only?
- Should module owners be Payload users, profiles, or both?
- Should module activity create `ActivityItem` records automatically, or only
  when an editor publishes a module update?
