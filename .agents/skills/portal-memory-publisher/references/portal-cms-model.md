# Portal CMS Model

Use these Payload collections and fields when producing reviewable update plans.

## activityItems

Purpose: dated factual community signals.

Key fields:

- `title`
- `body`
- `activityType`: `discussion`, `decision`, `project`, `insight`, `blocker`, `event`, `contribution`
- `happenedAt`
- `sourceLabel`
- `sourceURL`
- `relatedProject`
- `relatedThread`
- `relatedEvent`
- `relatedProfiles`
- `visibility`: `public`, `authenticated`, `admin`
- `_status`: `draft`, `published`

Rule: one activity item should describe one concrete thing that happened.

## threads

Purpose: persistent lines of work or thought.

Key fields:

- `title`
- `summary`
- `threadStatus`: `active`, `paused`, `resolved`, `archived`
- `lastActiveAt`
- `participants`
- `relatedProjects`
- `links`
- `visibility`
- `_status`

Rule: update existing threads before creating new ones.

## events

Purpose: sessions and calendar anchors.

Key fields:

- `title`
- `summary`
- `startsAt`
- `endsAt`
- `locationLabel`
- `joinURL`
- `calendarURL`
- `discordEventURL`
- `relatedProjects`
- `relatedThreads`
- `relatedProfiles`
- `visibility`
- `_status`

Rule: sessions can be cohort-wide or scoped to one or more projects through `relatedProjects`.

## projects

Purpose: live collaboration surfaces.

Key fields:

- `title`
- `summary`
- `projectStatus`: `active`, `building`, `archived`, `exploratory`, `exploring`, `shipping`
- `currentState`
- `lastActiveAt`
- `primaryCTA`
- `links`
- `contributors`
- `profileSkills`
- `activityItems`
- `threads`
- `events`
- `resources`
- `contributionActions`
- `_status`

Rule: show project state and participation paths; do not model task management.

## dailyBriefs

Purpose: current snapshot assembled from real activity.

Key fields:

- `title`
- `briefDate`
- `summary`
- `statusLabel`
- `focusLabel`
- `sections`
- `nextEvent`
- `activityItems`
- `threads`
- `engagementActions`
- `relatedProjects`
- `relatedProfiles`
- `visibility`
- `_status`

Rule: brief content should feel like a human who was present wrote it.

## profiles

Purpose: contributor identity and attribution.

Key fields:

- `handle`
- `displayName`
- `bio`
- `profileSkills`
- `profileRoles`
- `status`
- `visibility`

Rule: do not infer private profile details from public/community memory.

