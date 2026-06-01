# Skill / Role Explorer Feature Spec

## Status

Future feature module. This spec documents the planning direction for an
interactive skill and role knowledge graph before implementation.

The first version should derive from existing profile role, profile skill, and
profile records. Do not add a new collection for v1.

## Product Intent

The Skill / Role Explorer should help authenticated Portal users visually
explore the shape of the community:

- which roles exist
- which skills are common or rare
- which profiles connect roles and skills
- who to click into when looking for a collaborator, host, mentor, or subject
  matter expert

The experience should feel like a lightweight, flashy exploration surface rather
than a directory table or admin taxonomy editor.

## Module Boundary

This belongs in the module system, not the core navigation.

Recommended module registry record:

```txt
title: Skill / Role Explorer
slug: skill-role-explorer
status: experimental
visibility: authenticated
route: /skill-role-explorer
summary: Explore the relationship between member roles, skills, and profiles.
```

The module should appear on `/modules`.

Unauthenticated users should see a teaser card and CTA:

```txt
Join to explore member skills and roles.
```

Authenticated users should see an open CTA:

```txt
Open explorer
```

## Recommended Route

Use a direct feature route:

```txt
/skill-role-explorer
```

This follows the module guidance that module experiences do not need to be
nested under `/modules`.

Access:

- unauthenticated users: redirect to `/login?next=/skill-role-explorer` or show
  a join/login CTA
- authenticated users: render the explorer

## Graph Library

Use:

```txt
react-force-graph-2d
```

Rationale:

- best fit for a flashy, exploratory, client-side knowledge graph
- supports force-directed layout, zooming, panning, dragging, hover/click
  interactions, and custom canvas node rendering
- easier MVP than hand-rolling canvas/d3
- 2D is more readable than 3D for taxonomy/profile exploration

Do not start with the full `react-force-graph` package unless 3D/VR/AR becomes
a real requirement.

Expected dependency:

```bash
corepack pnpm add react-force-graph-2d
```

## Data Sources

Use existing collections:

- `profileRoles`
- `profileSkills`
- `profiles`

Optional later additions:

- `projects`
- `events`
- `posts`
- `badges`
- `contributionRequests`

The graph should only include records visible to the current user according to
existing access rules.

## Graph Shape

Normalize server data into client graph data:

```ts
type GraphData = {
  nodes: GraphNode[]
  links: GraphLink[]
}

type GraphNode =
  | {
      id: `role:${string}`
      label: string
      type: 'role'
      description?: string
      profileCount: number
    }
  | {
      id: `skill:${string}`
      label: string
      type: 'skill'
      description?: string
      profileCount: number
    }
  | {
      id: `profile:${string}`
      label: string
      type: 'profile'
      handle: string
      avatarURL?: string
      profileHref: string
      roles: string[]
      skills: string[]
    }

type GraphLink = {
  source: string
  target: string
  type: 'hasRole' | 'hasSkill'
}
```

Initial node types:

- role nodes
- skill nodes
- profile nodes

Initial links:

- profile -> role
- profile -> skill

Avoid role -> skill inferred links in v1 unless they are derived from shared
profile counts and clearly labeled as inferred.

## Interaction Model

Primary interactions:

- click/tap node: select node and open side panel
- hover node: highlight connected links and neighboring nodes
- search: find and focus a role, skill, or profile
- filters: roles, skills, profiles
- reset layout button
- drag nodes locally

Selection should be persistent and mobile-compatible. Do not rely on hover-only
popups.

## Side Panel

Use a side panel instead of transient hover popups.

Profile node panel:

- avatar or initials
- display name
- handle
- role chips
- skill chips
- short bio if available
- CTA: `View profile`

Profile CTA route:

```txt
/members/[handle]
```

Role node panel:

- role title
- description
- matching profile count
- list of a few matching profiles
- action: filter graph to this role

Skill node panel:

- skill title
- description
- matching profile count
- list of a few matching profiles
- action: filter graph to this skill

## Visual Direction

Use the current Portal theme and accent colors.

Suggested styling:

- role nodes: larger, primary/accent treatment
- skill nodes: smaller bright nodes
- profile nodes: avatar/photo when available, initials fallback
- selected node: accent ring or glow
- connected links: brighter and thicker
- unrelated graph: dimmed

Keep the graph full-width and tool-like, not a decorative card. The details
panel can be a framed panel.

## Mobile Behavior

Mobile should not depend on tiny hover targets.

Recommended behavior:

- graph remains available but vertically shorter
- search and filter controls above the graph
- selected-node side panel stacks below the graph
- profile CTA remains easy to tap

If graph usability is poor on small screens, use a list/detail fallback while
keeping the graph as a secondary visual.

## Implementation Plan

1. Add `react-force-graph-2d`.
2. Add `/skill-role-explorer` authenticated route.
3. Build server-side data fetch for visible profiles, roles, and skills.
4. Normalize graph data for the client component.
5. Build client graph component with search, filters, click selection, and side
   panel.
6. Add a module registry seed/record for Skill / Role Explorer.
7. Ensure `/modules` shows teaser CTA for unauthenticated users and open CTA for
   authenticated users.
8. Add e2e coverage for authenticated access, unauthenticated CTA, and profile
   link rendering.

## Non-Goals

- No new ontology collection in v1.
- No editable graph relationships.
- No AI-generated role/skill clustering in v1.
- No 3D graph in v1.
- No replacing the member directory.
- No making this a primary navigation item.

## Future Ideas

- include project nodes to show where skills are applied
- include session nodes to show who has hosted or spoken about topics
- include post nodes for educational content paths
- include badges as recognition overlays
- add inferred role-skill relationship strength
- add saved filters or shareable graph views
- use agent-generated summaries for role/skill clusters after review
