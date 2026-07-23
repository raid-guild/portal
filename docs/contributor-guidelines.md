# Contributor Guidelines

## Purpose

This portal should make real cohort activity visible and help people find a useful next step.

Contributors should build toward a flexible system model, not a rigid project management app. The core constraint is:

> Model observable community signals. Do not try to manage all collaboration.

That means the app should surface what happened, what is active, who is involved, when to show up, and where to contribute. It should not become Jira, Notion, Discord, a course platform, or a handbook dump.

## System Model

Use these primitives consistently:

- `Brief`: current snapshot of what is happening overall.
- `Project`: focused collaboration surface for something being built.
- `Thread`: persistent line of thought or work that evolves over time.
- `Activity Item`: factual signal that something happened.
- `Event`: scheduled gathering or calendar anchor.
- `Profile`: person or contributor identity.

Each primitive should have one job. Avoid making one collection carry unrelated behavior.

### Relationship Model

The MVP should support flexible relationships between briefs, projects, threads, activity, and events without becoming a nested project management system.

Use this shape:

```txt
Brief
  -> Activity Items
  -> Threads
  -> Projects
  -> Events

Project
  -> Activity Items
  -> Threads
  -> Events
  -> Contributors

Thread
  -> Activity Items
  -> Events
  -> Projects
  -> Participants
```

Important rules:

- A thread can span multiple projects.
- A thread can exist before a project exists.
- A thread can remain projectless if it is a cohort-wide storyline.
- A project can have activity items, sessions/events, and related threads.
- A session/event can relate to projects, threads, both, or neither.
- Activity items can be attached to a project, a thread, an event, profiles, or a useful combination of those.

Examples:

- `Calendar and session coordination` can be a projectless thread with activity items and events.
- `Improving onboarding flow` can start as a cohort-wide thread, then later relate to an onboarding project.
- `Defining the project spike object` can relate to the portal project and any future project model work.

Avoid nested primitives in the MVP:

- No threads of threads.
- No projects of projects.
- No parent/child project hierarchy.
- No parent/child thread hierarchy.

If something feels like a "thread of threads," split it into sibling threads or keep one broader thread with links.

If something feels like a "project of projects," treat it as a future module such as `track`, `initiative`, or `program`. Do not add that hierarchy until there is clear product pressure and a portal view that needs it.

## Primitive Responsibilities

### Brief

Answers:

- What is happening right now?
- Why should someone come back?
- What is the next useful action?

Use briefs to assemble recent activity, active threads, relevant projects, upcoming events, and ways to engage.

Do not use briefs as long-form documentation, marketing pages, or generic AI summaries.

### Project

Answers:

- What is being built?
- Is it active?
- Who is involved?
- How can someone participate?

Projects should be lightweight collaboration hubs with summary, status, visibility, contributors, links, current state, activity, threads, and contribution actions.

Project visibility can be public, authenticated, member-only, or admin-only. Use member-only when the project should be visible to confirmed RaidGuild members but not to all authenticated contributors.

Do not turn projects into task boards, sprint managers, assignment systems, or repo mirrors.

### Thread

Answers:

- What ongoing topic keeps evolving?
- What connects scattered activity across meetings and projects?

Threads are persistent storylines, not chat threads or tickets.

Examples:

- Improving onboarding flow
- Defining the project spike object
- Agent workflow experimentation
- Calendar and session coordination
- Contribution ownership and repo workstreams

Do not add due dates, assignees, or task state to threads in the MVP.

### Activity Item

Answers:

- What actually happened?
- When did it happen?
- What project, thread, event, or people does it relate to?

Activity items should be short, factual, dated, and sourceable where possible.
Use `creditedProfiles` only for people whose concrete participation the source
documents. Keep people who are merely mentioned or otherwise connected in
`relatedProfiles`.

Good examples:

- Discussion on project spikes as the first useful portal surface.
- Agreement to keep launch scope to brief, projects, activity, and contribution paths.
- Calendar-first onboarding called out as a core need.

Avoid vague activity like:

- Big momentum this week.
- The community is excited.
- Lots of amazing things happened.

### Event

Answers:

- When should someone show up?
- How can they join or add it to their own calendar?

Events should prioritize practical calendar behavior: join link, calendar link,
Discord event link, time, host/guest profiles, visibility, and related projects
or threads. Use `member` visibility for sessions that should be readable by
confirmed members but hidden from unauthenticated visitors and authenticated
non-member contributors.

Do not build complex native calendar behavior before basic external calendar links work.

### Profile

Answers:

- Who is involved?
- What do they contribute?
- How do they relate to projects, threads, or activity?

Profiles should support discovery and attribution. They should emerge from contribution, not dominate the MVP.

Imported legacy profiles may be unclaimed. Keep those records as `Profile`
records with `claimStatus: unclaimed`, blank `user`, and private `claimEmail`
for matching a future signup. Use the admin-only legacy import route for the old
CRM CSV; do not add those external records to the deterministic app seed.

Do not let profile features distract from brief, project, activity, thread, and event visibility.

## Content Rules

Every surfaced item should feel real, recent, and human.

Write like someone was in the room:

- specific
- dated when possible
- grounded in what was discussed or built
- direct
- slightly raw is fine

Avoid:

- marketing language
- generic filler
- unexplained abstractions
- fake urgency
- AI-sounding summaries
- large documentation blocks on first-contact surfaces

Use plain names:

- `Recent Activity` instead of `Highlights`
- `Ways to Engage` instead of `Opportunities` if the latter feels too broad
- `What is happening` instead of `Overview`
- `Project Spikes` when referring to the narrowed MVP project surface

## Data Modeling Rules

Before adding a field or collection, ask:

- Is this observable activity, a project, a thread, an event, a brief, or a profile?
- Does this belong on an existing primitive?
- Will this still make sense when there are more projects and more meetings?
- Does this create PM behavior we are not ready to support?
- Can the first version be represented with a link, status, or short text field?

Prefer relationships over duplicated text when connecting primitives:

- activity item to project
- activity item to thread
- thread to projects
- brief to activity items
- brief to next event
- project to contributors

Avoid:

- broad dependency or schema overrides to force a feature
- fields that imply workflows the UI does not support
- hard-coded content that should come from Payload once the model exists
- transitive concepts like tasks, milestones, and assignments in the MVP

## Feature Modules

New product areas should be treated as feature modules.

A feature module is a bounded capability that may introduce its own collections, routes, UI, seeds, tests, and integration points with the core primitives.

Examples:

- bounty board
- leaderboard
- project phases
- resource library
- calendar subscription
- agent template registry

Modules are allowed, but they should not blur the core model. A module should attach to core primitives through explicit relationships instead of stuffing unrelated behavior into `projects`, `profiles`, or `dailyBriefs`.

The `modules` collection is the registry for module discovery and status. It is
core Portal infrastructure and belongs in the `Portal` Payload admin group.

Module-owned Payload collections should be grouped separately from core
primitive collections:

```ts
admin: {
  group: 'Modules',
}
```

Examples:

- `modules` -> `Portal`
- future `wikiPages` -> `Modules`
- future `bounties` -> `Modules`

Core primitive collections remain in the `Portal` admin group. Core routes and
collections must not require optional modules to exist. A disabled or deferred
module should remove its own entry points while leaving `/`, `/dashboard`,
`/me`, `/members`, `/projects`, `/events`, `/posts`, and `/inbox` functional.

### Module Surface Rules

Use `/modules` as the member-facing discovery and status surface for optional
Portal capabilities.

Do:

- add or update a `modules` registry record when a module needs member-facing
  discovery
- link to `/modules` from the dashboard rather than primary navigation while
  modules are still experimental
- use `entryRoute` for the module's actual product surface
- keep module details authenticated unless the module explicitly needs a public
  surface

Avoid:

- forcing feature implementation routes under `/modules`
- adding module fields directly to core primitives before the module proves the
  relationship is needed
- treating `enabled` as a complete runtime feature flag

Good route examples:

```txt
/modules        -> module discovery and status
/wiki           -> Infinite Wiki product surface
/bounty-board   -> Bounty Board product surface
/leaderboard    -> Leaderboard product surface
```

Avoid route patterns like `/modules/bounty-board` unless the page is a module
detail page, not the feature itself.

### Module Decision Rule

Before building a module, decide which category it belongs to:

- Core primitive: belongs directly in the base system model.
- Extension module: deserves its own collection or route but relates to core primitives.
- View-only feature: can be represented with existing fields, links, or derived UI.
- Deferred feature: useful later, but not needed for the current MVP.

Most new features should start as view-only or extension modules. Promote them to core only after repeated usage proves they are foundational.

### When To Add A Collection

Add a new collection only when the feature needs at least two of these:

- its own lifecycle or status
- its own permissions
- reusable records across multiple projects, briefs, threads, events, or profiles
- filtering, search, or admin management
- independent publishing or review
- relationships from more than one core primitive
- future API consumption as a first-class object

If the feature is just a short list, link, label, or CTA, start with an array or group field on the existing primitive.

### Module Proposal Template

Every module should be described before implementation:

```txt
Module name:
Problem:
Primary user:
Status:
Core primitive relationships:
New collections:
New fields on existing collections:
Entry route:
Admin route:
Registry visibility:
Permissions:
Seed data:
E2E coverage:
Deferred behavior:
Graduation criteria:
```

Keep the proposal short. The goal is to prevent accidental platform sprawl, not create a planning tax.

### Example: Bounty Board

A bounty board should probably start as an extension module, not as fields embedded directly into `projects`.

Reason:

- bounties have their own lifecycle
- bounties may belong to projects, threads, or standalone community needs
- bounties need their own permissions and status
- bounties may later connect to points, payments, submissions, or claims

Possible collection:

```txt
bounties
- title
- summary
- status: open / in_review / awarded / closed
- bountyType: paid / points / recognition / learning
- relatedProject
- relatedThread
- relatedProfiles
- rewardDescription
- requirements
- sourceURL
- dueAt
- visibility
- publishedAt
```

MVP UI:

- show open bounties on project pages under `Ways to Contribute`
- optionally show a `/bounties` index later
- avoid claims, escrow, payments, and dispute workflows until the basic signal is useful

This keeps `projects` focused on collaboration while allowing bounties to evolve independently.

## UI Rules

The first screen should make the portal feel alive.

Prioritize:

- top strip with current context and next event
- latest brief
- recent activity
- active threads
- ways to engage
- visible contributors or participants

Keep routes linear and obvious:

- Brief
- Projects
- Members
- Join or Profile

Avoid:

- dashboard clutter
- leaderboard-like presence
- handbook-first navigation
- dense PM controls
- large hero copy that delays the useful content

## Contribution Workflow

When picking up work:

1. Identify which primitive you are changing.
2. Keep the change scoped to that primitive.
3. Check `docs/cohort-spike-mvp-spec.md` for the current MVP direction.
4. Update docs if setup, commands, data model, routes, or workflow expectations change.
5. Add or update seed data when the feature depends on visible content.
6. Run relevant tests before claiming completion.

For app behavior, build tooling, auth, admin flows, seeding, comments, routing, or rendering changes, run:

```sh
corepack pnpm test:e2e
```

If you cannot run the relevant verification, state that clearly.

## Good First Workstreams

Good initial work should map cleanly to the MVP:

- Reframe home/dashboard into the Update Brief view.
- Reframe `/projects` as active project spikes.
- Add `/projects/[slug]`.
- Add seed content from real session notes.
- Add `activityItems`, `threads`, and `events` collections.
- Wire brief and project pages to those collections.
- Add e2e coverage for brief and project spike flows.

Avoid starting with:

- token mechanics
- leaderboards
- complex project phases
- native calendar sync
- generalized project management workflows
- automated agent coordination

## Definition of Done

A contribution is done when:

- it supports one or more core primitives
- it keeps the system flexible without adding unsupported workflow assumptions
- it surfaces real activity or makes contribution easier
- relevant docs are updated
- seed data is updated when needed
- verification has been run and reported
