# Portal CMS Model

Use these Payload collections and fields when producing reviewable update plans.

## auth roles

- `admin`: full admin access.
- `editor`: can publish/edit content.
- `contributor`: human contributor; can create drafts/proposals.
- `member`: authenticated member; can participate/read authenticated content.
- `agent`: automated contributor; use for machine-authored draft/proposal updates.

Rule: automated publishers should use `agent` accounts, not human contributor accounts.

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
- `visibility`: `public`, `authenticated`, `member`, `admin`
- `_status`

Rule: update existing threads before creating new ones.

## events

Purpose: sessions and calendar anchors.

Key fields:

- `title`
- `summary`
- `sessionType`: `brownbag`, `workshop`, `all-hands`, `demo`, `pitch`, `fireside`
- `startsAt`
- `endsAt`
- `locationLabel`
- `joinURL`
- `calendarURL`
- `discordEventURL`
- `discordScheduledEventID`
- `discordSyncStatus`: `not_configured`, `synced`, `failed`
- `discordSyncError`
- `hostProfiles`
- `speakerProfiles`: guest/speaker profiles; the `/api/events/create` payload uses `guests`
- `seriesKey`
- `seriesTitle`
- `recurrenceCadence`: `weekly`, `biweekly`, `monthly`
- `recurrenceUntil`
- `previousOccurrence`
- `nextOccurrence`
- `relatedProjects`
- `relatedThreads`
- `relatedProfiles`
- `visibility`
- `_status`

Rule: sessions can be cohort-wide or scoped to one or more projects through `relatedProjects`.

Rule: use `member` visibility for member-only sessions. Authenticated non-members should not see those events.

Rule: direct `POST /api/events` creates only the Portal record. Agents that intend Discord scheduled-event creation must use `POST /api/events/create` with `syncDiscord: true` and confirm the response has `discordSyncStatus: synced`.

Rule: recurring sessions are lightweight event metadata, not a separate collection. When generating the next occurrence, copy `seriesKey`, `seriesTitle`, `recurrenceCadence`, and `recurrenceUntil`, set `previousOccurrence` to the current event, then patch the current event's `nextOccurrence`.

Rule: attach Prism recording/summary artifacts through authenticated `POST /api/events/artifacts/ingest`. Agent accounts may call it after login. Match by `eventID` when known or `discord.scheduledEventID` from the Discord adapter payload.

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

## posts

Purpose: reviewed editorial or distribution content derived from real source context.

Key fields:

- `title`
- `slug`
- `content`
- `contentType`
- `sourceSession`
- `parentThread`
- `derivedFrom`
- `authors`
- `categories`
- `publishedAt`
- `_status`

Rule: agent-created posts should be drafts. Omit `publishedAt` unless an editor
or admin is publishing the post.

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
