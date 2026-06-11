# Portal CMS Model

Use these Payload collections and fields when producing reviewable update plans.

## auth roles

- `admin`: full admin access.
- `editor`: can publish/edit content.
- `contributor`: human contributor; can create drafts/proposals.
- `member`: authenticated member; can participate/read authenticated content.
- `agent`: trusted automation identity; use for machine-authored sourced updates.

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
- `resources`: supplemental session links, each with `label`, `url`, and `resourceType`
- `visibility`
- `_status`

Rule: sessions can be cohort-wide or scoped to one or more projects through `relatedProjects`.

Rule: use `member` visibility for member-only sessions. Authenticated non-members should not see those events.

Rule: direct `POST /api/events` creates only the Portal record. `syncDiscord` is not a persisted field and is ignored by the raw Payload collection endpoint. Agents that intend Discord scheduled-event creation must use `POST /api/events/create` with `syncDiscord: true` and confirm the response has `discordSyncStatus: synced`.

Rule: `/api/events/create` uses a different request shape than raw `events`: send `durationMinutes` instead of `endsAt`, `hosts` instead of `hostProfiles`, `guests` instead of `speakerProfiles`, and do not send `_status` or `publishedAt`.

Rule: recurring sessions are lightweight event metadata, not a separate collection. When generating the next occurrence, copy `seriesKey`, `seriesTitle`, `recurrenceCadence`, and `recurrenceUntil`, set `previousOccurrence` to the current event, then patch the current event's `nextOccurrence`.

Rule: attach Prism recording/summary artifacts through authenticated `POST /api/events/artifacts/ingest`. Agent accounts may call it after login. Match by `eventID` when known or `discord.scheduledEventID` from the Discord adapter payload.

Rule: use `resources` for supplemental notes, slides, docs, repos, design boards, follow-up links, and secondary artifacts displayed on event detail pages. Valid `resourceType` values are `link`, `notes`, `slides`, `doc`, `repo`, `design`, `artifact`, and `other`.

Rule: do not put primary Prism recording, transcript, or summary artifacts in `resources`; use the dedicated artifact fields and ingest endpoint.

Rule: event hosts can update sessions they host. Content contributors, editors, admins, and agents can update sessions according to role.

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
- `meta.image`: upload relationship -> `media`; used for post hero/card image
- inline images: Lexical `mediaBlock` nodes inside `content.root.children`
- `publishedAt`
- `_status`

Rule: agents, editors, and admins can publish posts by role. Operationally,
agents should create drafts unless the target environment is clear and the
source facts are concrete.

Rule: use `meta.image` for the cover/header image. Use a Lexical `mediaBlock`
with a Payload media ID for images that should appear inline in the article body.
Markdown image syntax is not rendered as an inline image.

## wikiPages

Purpose: durable, source-backed topic pages distilled from sessions, posts,
projects, community memory, and external research.

Key fields:

- `title`
- `slug`
- `summary`
- `body`
- `sourceSessions`
- `relatedPosts`
- `relatedProjects`
- `relatedThreads`
- `relatedProfiles`
- `relatedActivityItems`
- `keyClaims`
- `furtherReading`
- `papers`
- `tools`
- `openQuestions`
- `prompts`
- `relatedTopics`
- `possibleTopics`
- `sourceArtifacts`
- `reviewStatus`: `generated_draft`, `needs_review`, `reviewed`,
  `needs_refresh`, `archived`
- `confidence`: `low`, `medium`, `high`
- `lastReviewedAt`
- `lastRefreshedAt`
- `generatedAt`
- `promptVersion`
- `model`
- `visibility`: `public`, `authenticated`, `member`, `admin`
- `_status`

Rule: use wiki pages for evergreen or research-backed topic knowledge, not
simple recaps, announcements, or generic content.

Rule: a session can be the spark for a wiki page, but the evidence boundary may
include external papers, docs, HN/blog signal, tools, Prism memory, and other
source artifacts.

Rule: use `possibleTopics` for topic links that may deserve future pages but are
not yet canonical.

Rule: freshness-sensitive claims should include dates, observed-at timestamps,
or review notes. Mark stale or low-confidence pages as `needs_refresh` or
`needs_review`.

Rule: agents, editors, and admins may create/update wiki pages only through a
real Payload user session or `Authorization: JWT <token>` returned by
`/api/users/login`. Workflow-specific service tokens, `x-service-token`, and
generic bearer service tokens do not satisfy Payload collection access unless a
custom endpoint explicitly maps them to `req.user`.

Rule: published wiki pages must have `reviewStatus = reviewed`. Prefer drafts
for speculative or low-confidence pages. Agents must not create or update
admin-only wiki pages.

Rule: generated wiki artifacts must be normalized before writing: body content
must be valid Payload Lexical JSON, `prompts` entries need `label` and `prompt`,
and malformed optional arrays such as `sourceArtifacts` should be omitted rather
than sent with invalid shapes.

## comments

Purpose: lightweight discussion attached to Portal primitives.

Key fields:

- `content`
- `author`
- `parent`: polymorphic relation
- `isApproved`
- `publishedAt`

Supported parent relations include:

- `posts`
- `events`
- `projects`
- `contributionRequests`

Rule: session comments use `parent.relationTo = "events"` and the event ID as
`parent.value`.

Rule: comments are flat. Do not create direct replies.

Rule: authenticated humans create comments from the Portal UI. Comments are
approved by default; moderators, editors, admins, and eligible session hosts can
hide inappropriate event comments by setting `isApproved` to false or using the
Portal hide flow.

Rule: agents should not use comments for memory publishing. Prefer activity
items, resources, artifacts, briefs, or posts unless the user explicitly asks for
a human-reviewable comment draft.

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

## pageCopy

Purpose: CMS-managed editorial copy for fixed product-flow pages.

Key fields:

- `key`: stable route key, e.g. `join`, `inquire-client`, `inquire-sponsor`,
  `inquire-grant`, `inquire-opportunity`, `inquire-general`, `brief-public`
- `surface`: `join`, `inquiry`, `brief`, `other`
- `label`
- `eyebrow`
- `headline`
- `intro`
- `secondaryIntro`
- `contextHeading`
- `contextBody`
- `messageLabel`
- `submitLabel`
- `postSubmitEyebrow`
- `postSubmitHeading`
- `postSubmitBody`
- `createAccountLabel`
- `submitAnotherLabel`
- `backLinkLabel`
- `benefitsHeading`
- `benefits`
- `funnelEyebrow`
- `funnelHeading`
- `funnelLinks`
- `seoTitle`
- `seoDescription`
- `status`: `draft`, `published`, `archived`

Rule: use `PageCopy` for `/join`, `/inquire/[type]`, and other fixed product
flow copy changes instead of hardcoding page text.

Rule: copy-only funnel changes should not create new collections or new inquiry
types. Existing inquiry types are `client`, `sponsor`, `grant`, `opportunity`,
and `general`.

Rule: for a one-hour consultation MVP, prefer a consultation-flavored `client`
inquiry page or source route before adding a new durable inquiry type.

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
