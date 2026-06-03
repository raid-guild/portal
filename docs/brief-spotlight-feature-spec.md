# Brief Spotlight Feature Spec

## Status

Planned / future feature module. This spec covers a lightweight editorial
spotlight surface for the current brief, dashboard, and thread/session/project
discovery flow.

The first implementation should add a small `spotlights` collection, render an
active spotlight section, and add a public thread detail page so featured
threads have a meaningful landing surface.

## Product Intent

Brief spotlights let admins put one important thing front and center without
turning the daily brief into sticky homepage state.

They answer:

- What should visitors or members notice right now?
- Is this a durable featured focus or a time-boxed announcement?
- What Portal record or external artifact should the spotlight point to?
- When should the spotlight stop showing?

This feature should support seasonal focus areas such as a cohort month,
featured thread, upcoming session, important announcement, or external artifact.
It should not become a general ad system, notification system, campaign manager,
or replacement for briefs.

## Why A Separate Primitive

`DailyBrief` is a dated snapshot of what is happening. A spotlight is editorial
placement.

If sticky homepage content lives directly on a brief, it creates awkward state:
a monthly cohort focus may need to stay visible across many briefs, while an
announcement may expire after a session. A separate `spotlights` collection
keeps those concerns apart.

Recommended mental model:

- `DailyBrief`: what happened and what matters today.
- `Spotlight`: what admins want front and center right now.
- `Thread`: durable narrative hub for an ongoing line of work.
- `Event`: scheduled session.
- `Project`: focused collaboration surface.
- `Post`: reviewed editorial output.
- `Artifact`: external source material or generated asset link.

## Non-Goals

- No full campaign manager.
- No newsletter or bulk email tooling.
- No notification delivery from spotlight creation.
- No targeting rules beyond Portal visibility.
- No analytics dashboard in the first slice.
- No nested spotlights or spotlight groups.
- No task, assignment, or project-management workflow.

## Proposed Collection

Collection slug:

```txt
spotlights
```

Fields:

```txt
title: text, required
summary: textarea
kind: featured / announcement
status: draft / published / archived
startsAt: date
expiresAt: date
priority: number
visibility: public / authenticated / member / admin

targetType: thread / event / project / post / profile / external / artifact
targetThread: relationship -> threads
targetEvent: relationship -> events
targetProject: relationship -> projects
targetPost: relationship -> posts
targetProfile: relationship -> profiles
externalURL: text
artifactURL: text

ctaLabel: text
image: upload -> media
createdBy: relationship -> users
publishedAt: date
```

Recommended defaults:

```txt
kind: featured
status: draft
priority: 0
visibility: public
```

Recommended indexes:

```txt
status + visibility + startsAt + expiresAt
kind + priority
targetThread
targetEvent
targetProject
```

## Spotlight Kinds

### Featured

`featured` is durable editorial focus.

Use it for:

- monthly cohort season
- featured thread
- featured project
- current learning path
- active content series
- evergreen artifact or guide

Rules:

- `expiresAt` is optional.
- A featured spotlight may stay active across multiple briefs.
- It should usually point to a Portal primitive, especially a thread, project,
  event, post, or profile.

Example:

```txt
kind: featured
title: How to RaidGuild Fireside Chats
targetType: thread
targetThread: How to RaidGuild Fireside Chats
priority: 10
expiresAt: empty
```

### Announcement

`announcement` is time-sensitive.

Use it for:

- upcoming session reminder
- application deadline
- launch notice
- important external opportunity
- one-off operational announcement

Rules:

- `expiresAt` should usually be set.
- For event announcements, default expiry should be after the event ends.
- If an announcement has no expiry, the admin UI should make that obvious.

Example:

```txt
kind: announcement
title: Raider Round Table this Thursday
targetType: event
targetEvent: Raider Round Table
expiresAt: event endsAt
priority: 20
```

## Target Rules

Only one target should be required per spotlight.

Recommended validation:

- `targetType = thread` requires `targetThread`
- `targetType = event` requires `targetEvent`
- `targetType = project` requires `targetProject`
- `targetType = post` requires `targetPost`
- `targetType = profile` requires `targetProfile`
- `targetType = external` requires `externalURL`
- `targetType = artifact` requires `artifactURL`

Target visibility must be respected. A public spotlight must not expose a
member-only target to anonymous users. If the target is not visible to the
viewer, hide the spotlight or show a login/join CTA without leaking private
details.

## UI Surfaces

### Brief Spotlight Section

Add a `Spotlight` section above or near the current brief content.

Recommended placement:

- public brief/home surface: near the top, before recent activity
- authenticated dashboard: above the brief panel or inside the current brief
  shell
- mobile: one compact full-width card before lower-priority panels

Render active records where:

```txt
status = published
startsAt is empty or startsAt <= now
expiresAt is empty or expiresAt > now
visibility is visible to current user
```

Suggested layout:

- one primary `featured` spotlight, selected by highest `priority`
- up to two active `announcement` records below or beside it
- title, summary, target type, CTA, optional image
- expired announcements do not render

Avoid a carousel. If there are too many active spotlights, the admin process is
the problem.

### Thread Detail Page

If threads can be featured, they need a real landing page.

Route:

```txt
/threads/[slug]
```

The thread detail page should compose existing relationships rather than create
a heavier thread model.

Header:

- title
- summary
- thread status
- visibility-aware CTA or primary link
- active spotlight/announcement that points to this thread, if any

Sections:

- upcoming sessions related to the thread
- past sessions related to the thread, including artifact/resource indicators
- posts where `parentThread = thread`
- projects related to the thread
- recent activity items where `relatedThread = thread`
- open contribution requests related to the thread
- participants and related profiles
- thread links/resources

Sorting:

- upcoming sessions by `startsAt` ascending
- past sessions by `startsAt` descending
- posts by `publishedAt` descending, grouped by `contentType` when useful
- activity by `happenedAt` descending
- contribution requests by priority/status and recent update

Empty states should be quiet. A featured thread may start with only a summary,
links, and upcoming sessions.

## Access Model

Recommended:

- Public users can read published public spotlights and public thread pages.
- Authenticated users can read authenticated spotlights and threads.
- Members can read member-only spotlights and threads.
- Admins and editors can create, publish, archive, and reorder spotlights.
- Agents can draft spotlights only if explicitly asked.
- Contributors should not publish spotlights by default.

Spotlights should use the same visibility semantics as other Portal content:

```txt
public
authenticated
member
admin
```

## Admin Workflow

Admins should be able to:

- create a featured spotlight
- create a time-boxed announcement
- select a Portal target or external URL
- set priority
- set start and expiry dates
- archive old spotlights
- preview the target link

Nice first-slice admin affordances:

- default `expiresAt` from target event `endsAt` for event announcements
- warning when an announcement has no expiry
- warning when spotlight visibility is broader than target visibility
- default CTA labels by target type:
  - thread: `View thread`
  - event: `View session`
  - project: `View project`
  - post: `Read post`
  - external/artifact: `Open link`

## Agent Guidance

Agents may propose spotlights from real source context, but should default to
drafts.

Good agent proposals:

- a meeting produced a clear featured thread for the month
- admins explicitly ask to feature a session or thread
- a launch or cohort announcement has clear dates and links

Bad agent proposals:

- invented urgency
- speculative featured work
- broad marketing language without a real target
- automatically spotlighting every new post, session, or project

Agents should not silently publish active spotlights.

## Example Use Cases

### Monthly Cohort Season

```txt
title: How to RaidGuild Fireside Chats
kind: featured
targetType: thread
targetThread: How to RaidGuild Fireside Chats
summary: A monthly conversation series for learning how the guild works through
real member stories, sessions, and field notes.
expiresAt: empty
visibility: public
```

### Upcoming Session Announcement

```txt
title: Raider Round Table
kind: announcement
targetType: event
targetEvent: Raider Round Table
summary: Weekly member session for surfacing current work, asks, and next
steps.
expiresAt: event endsAt
visibility: member
```

### External Artifact

```txt
title: Fireside material prep
kind: featured
targetType: artifact
artifactURL: https://github.com/raid-guild/cohort-fireside-content-sandbox
summary: Source material for the current fireside content workflow.
visibility: authenticated
```

## First Slice Checklist

- [ ] Add `spotlights` collection.
- [ ] Add migration and generated types.
- [ ] Add admin fields and validation for target type.
- [ ] Add active spotlight query utility.
- [ ] Render `Spotlight` section on the public brief/home surface.
- [ ] Render `Spotlight` section on authenticated dashboard.
- [ ] Add `/threads/[slug]` detail page.
- [ ] Link active thread cards to `/threads/[slug]`.
- [ ] Respect visibility for spotlight and target records.
- [ ] Add e2e coverage for public, authenticated, and expired spotlight states.
- [ ] Update portal memory publisher skill once implemented.

## Open Questions

- Should `announcement.expiresAt` be required, or only strongly warned?
- Should the dashboard show member-only spotlights before public spotlights?
- Should spotlights support one image only, or can the target record image be
  reused automatically?
- Should the public home show only one spotlight, while dashboard can show more?
- Should spotlights create notifications later, or remain editorial placement
  only?
