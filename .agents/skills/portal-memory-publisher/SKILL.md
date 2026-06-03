---
name: portal-memory-publisher
description: Convert Discord summaries, meeting digests, community memory, project updates, event notes, or repo activity into reviewable Payload CMS update proposals for the RaidGuild portal. Use when Codex needs to update or propose updates for briefs, projects, threads, activity items, events/sessions, or profiles from real community activity while avoiding invented content and project-management drift.
---

# Portal Memory Publisher

## Operating Rule

Convert observed community memory into portal records. Do not invent activity, project state, people, dates, links, or decisions.

Default to a reviewable update plan. Write directly to Payload only when the user explicitly asks and the target environment is clear.

When writing directly to Payload as an automated publisher, use a dedicated agent account. Do not use a human contributor account for automated publishing.

## Source Inputs

Use this skill for:

- Discord channel summaries
- meeting digests or transcripts
- project updates
- event/session notes
- repo activity summaries
- community memory rollups

If the input lacks timestamps, participants, or sources, preserve uncertainty and draft the record instead of publishing it.

## Portal Primitives

Use the repo model in `references/portal-cms-model.md` when field-level detail is needed.
Use `references/example-digest-mapping.md` when an example output shape is useful.

- `activityItems`: factual dated signals; what happened.
- `threads`: ongoing lines of work/thought; what keeps evolving.
- `events`: sessions/calendar anchors; when people should show up.
- `projects`: live collaboration surfaces; what is being built.
- `dailyBriefs`: assembled current snapshot; what matters now.
- `profiles`: people/contributors; who is involved.
- `spotlights`: admin/editorial placement for what should be front and center.

## Workflow

1. Extract factual signals from the source.
2. Identify existing projects, threads, events, and profiles that should be updated.
3. Prefer updating existing threads over creating new threads.
4. Create new projects only when there is a concrete collaboration surface with state, people, links, or a next action.
5. Create activity items for specific dated events, decisions, blockers, insights, or contributions.
6. Create or update events only for real sessions with time, location/join/calendar context, or clear follow-up action.
7. Assemble the daily brief from related activity, threads, projects, events, and engagement actions.
8. Output a reviewable plan with create/update operations and confidence.

## Agent Account Flow

Normal public account creation through `POST /api/users` creates a human contributor account. Agent accounts use a separate gated route so the `agent` role is explicit.

Create an agent account only when the target environment and registration secret are provided:

```bash
curl -X POST "$PORTAL_URL/api/agent/register" \
  -H "Authorization: Bearer $AGENT_REGISTRATION_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "portal-memory-agent@example.com",
    "password": "long-random-agent-secret",
    "name": "Portal Memory Agent"
  }'
```

Log in and store cookies before writing CMS records:

```bash
curl -c cookies.txt -X POST "$PORTAL_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "portal-memory-agent@example.com",
    "password": "long-random-agent-secret"
  }'
```

Use `-b cookies.txt` for subsequent API requests. Verify the session with `GET /api/users/me`.

Agent accounts are contributor-level publishers. They may create draft/proposal records from sourced memory, but they must not publish, delete, manage users, or impersonate humans.

## Event Creation And Discord Sync

Hard rule: `syncDiscord` is not a field on the Payload `events` collection. Passing `"syncDiscord": true` to the raw Payload collection endpoint (`POST /api/events`) will be ignored and will not create a Discord scheduled event.

Use the raw Payload collection endpoint (`POST /api/events`) only for Portal-only records, imports, past-session enrichment, drafts, or records that already have external calendar/Discord links.

When creating a future Portal session that should try to create a Discord scheduled event, use the Portal session endpoint instead:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/events/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop planning session",
    "summary": "Plan the next workshop format and owner handoff.",
    "startsAt": "2026-06-10T18:00:00.000Z",
    "durationMinutes": 60,
    "sessionType": "workshop",
    "visibility": "public",
    "syncDiscord": true
  }'
```

Payload differences for `/api/events/create`:

- Send `durationMinutes` instead of `endsAt`; the endpoint calculates `endsAt`.
- Send `hosts` instead of `hostProfiles`.
- Send `guests` instead of `speakerProfiles`.
- Send an existing Discord event URL in `joinURL` or `discordEventURL` when the
  scheduled event already exists in Discord. Portal recognizes
  `https://discord.com/events/<guildID>/<eventID>` URLs, stores the Discord
  URL/ID, and skips creating a new scheduled event.
- Non-Discord `joinURL` values stay normal join links. If `syncDiscord: true`
  and no existing Discord event URL is supplied, Portal tries to create a new
  Discord scheduled event while preserving the join link.
- Do not send `_status` or `publishedAt`; the endpoint publishes the event.
- Include `"syncDiscord": true` when the user asked for a Discord scheduled event.

Expected behavior:

- `visibility` may be `public`, `authenticated`, `member`, or `admin`. Use `member` only when confirmed members should see the session.

- If an existing Discord event URL is supplied in `joinURL` or
  `discordEventURL`, Portal links that event, stores `discordScheduledEventID`,
  sets `discordSyncStatus: synced`, and does not call Discord to create a new
  event.
- If Discord sync is configured and succeeds, Portal stores `discordScheduledEventID`, `discordEventURL`, `joinURL`, and `discordSyncStatus: synced`.
- If Discord sync fails, Portal still creates the event and stores `discordSyncStatus: failed` with `discordSyncError`.
- If `syncDiscord` is false or missing, Portal creates a Portal-only event with `discordSyncStatus: not_configured`.
- If `/api/events/create` receives `syncDiscord: true` and Discord env/config is missing or invalid, Portal should return the event with `discordSyncStatus: failed` and `discordSyncError`.

Diagnostic rule: if the response has `discordSyncStatus: not_configured`, assume the request did not use `/api/events/create` with `syncDiscord: true`. Do not patch `syncDiscord` onto an existing event; it will not trigger sync.

Do not tell users a Discord scheduled event was created unless the response has `discordSyncStatus: synced` and a `discordEventURL`.

For recurring sessions, Portal uses copied event metadata rather than a separate series collection:

- `seriesKey`: stable grouping key, e.g. `weekly-all-hands`
- `seriesTitle`: display grouping label
- `recurrenceCadence`: `weekly`, `biweekly`, or `monthly`
- `recurrenceUntil`: optional end date
- `previousOccurrence` / `nextOccurrence`: event-to-event chain

When an agent workflow creates the next occurrence, copy the series fields forward, set `previousOccurrence` on the new event, and patch `nextOccurrence` on the current event. Do not invent recurrence if the current event has no `seriesKey` and `recurrenceCadence`.

## Event Artifact Ingest

Prism workflows should attach recording, transcript, and summary artifacts through the dedicated ingest endpoint instead of raw-updating event fields:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/events/artifacts/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "discord": {
      "scheduledEventID": "1234567890"
    },
    "artifacts": {
      "artifactID": "prism-artifact-id",
      "recordingURL": "https://example.com/recording",
      "transcriptURL": "https://example.com/transcript",
      "summaryURL": "https://example.com/summary"
    }
  }'
```

Authenticate with a Portal user session. Agent accounts may call this endpoint after login; anonymous requests are rejected.

Matching order:

- explicit `eventID`, when supplied
- `discord.scheduledEventID`

The endpoint updates `recordingURL`, `transcriptArtifactURL`, `summaryArtifactURL`, `sourceArtifactURL`, `sourceArtifactID`, and `sourceStatus`. If no event matches, keep the artifact in the Prism workflow for human review rather than inventing a Portal event.

## Session Resources And Comments

Use `events.resources` for supplemental session links that should be visible on
the session detail page for authenticated users:

- notes
- slides
- docs
- repos
- design boards
- follow-up links
- supplemental artifacts

Do not use `resources` for the primary Prism recording, transcript, or summary
artifact. Those belong in the dedicated event artifact fields through
`POST /api/events/artifacts/ingest`.

Valid `resourceType` values are `link`, `notes`, `slides`, `doc`, `repo`,
`design`, `artifact`, and `other`.

Example resource update:

```bash
curl -b cookies.txt -X PATCH "$PORTAL_URL/api/events/:id" \
  -H "Content-Type: application/json" \
  -d '{
    "resources": [
      {
        "label": "Session notes",
        "url": "https://example.com/notes",
        "resourceType": "notes"
      }
    ]
  }'
```

Hosts may update sessions they host. Content contributors, editors, admins, and
agents may update sessions according to their role. The first Portal UI slice
links eligible hosts and admins to the Payload admin edit screen.

Session comments use the existing `comments` collection with an event parent:

```json
{
  "parent": {
    "relationTo": "events",
    "value": 123
  },
  "content": "Useful follow-up from the session.",
  "isApproved": true
}
```

Comments are flat; do not create direct replies. Authenticated humans create
comments from the Portal UI. Agents should not turn source material,
transcripts, or meeting summaries into comments unless the user explicitly asks
for a human-reviewable comment draft. Use activity items, resources, artifacts,
briefs, or posts for memory publishing.

## Spotlight Proposals

Use `spotlights` only for admin/editorial emphasis: a featured focus,
time-boxed announcement, important thread, upcoming session, active project, or
external artifact that should be prominent on the home/dashboard surfaces.

Agents should default to draft/review proposals. Publish a spotlight only when
the user explicitly asks, the target environment is clear, and the source facts
are concrete.

Spotlight fields to consider:

- `title`
- `summary`
- `kind`: `featured` or `announcement`
- `visibility`: `public`, `authenticated`, `member`, or `admin`
- `startsAt` / `expiresAt`
- `priority`
- `targetType` plus exactly one matching target field
- `ctaLabel`

Featured spotlights may have no expiry. Announcements should usually have
`expiresAt`, especially when they point to an event or deadline. Do not invent
urgency, deadlines, or participation claims to justify a spotlight.

## Post Draft Creation

Agent-created posts are review drafts. When writing posts through `POST /api/posts`,
send `_status: "draft"` or omit `_status`, and omit `publishedAt`. A `publishedAt`
date does not publish the post; only an editor or admin should publish through
Payload review.

Posts support `visibility`: `public`, `authenticated`, `member`, or `admin`.
Agent accounts may set visibility and may read member-visible content, but they
must not use `member` unless the source material is meant for confirmed members.

Do not use draft/autosave query params or version endpoints for normal agent
post proposals. Use the canonical collection endpoint:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Draft title",
    "slug": "draft-title",
    "visibility": "public",
    "_status": "draft",
    "content": { "root": { "type": "root", "children": [] } }
  }'
```

## Post Images

Posts support two different image placements:

- Header/card image: set `meta.image` to a Payload media ID. This image appears
  in the post hero and archive cards, but not inline in the article body.
- Inline article image: upload the image to Payload media, then insert a Lexical
  `mediaBlock` node into `content.root.children`.

Do not use Markdown image syntax in post content. The Portal renders Payload
Lexical JSON, so `![alt](url)` will remain text or be ignored.

When an agent generates or receives an image for a post:

1. Upload the image to Payload media with multipart form data.
2. Use the returned media record `id`.
3. Set `meta.image` when the image is the cover/header image.
4. Insert a `mediaBlock` when the image should appear inside the article body.

Example inline media block inside `content.root.children`:

```json
{
  "type": "block",
  "fields": {
    "blockType": "mediaBlock",
    "media": 123
  },
  "format": "",
  "version": 2
}
```

Example post payload with both a header image and inline image:

```json
{
  "title": "Draft title",
  "slug": "draft-title",
  "_status": "draft",
  "meta": {
    "image": 123
  },
  "content": {
    "root": {
      "type": "root",
      "format": "",
      "indent": 0,
      "version": 1,
      "children": [
        {
          "type": "paragraph",
          "format": "",
          "indent": 0,
          "version": 1,
          "children": [
            {
              "type": "text",
              "text": "Intro text.",
              "detail": 0,
              "format": 0,
              "mode": "normal",
              "style": "",
              "version": 1
            }
          ]
        },
        {
          "type": "block",
          "fields": {
            "blockType": "mediaBlock",
            "media": 123
          },
          "format": "",
          "version": 2
        }
      ],
      "direction": "ltr"
    }
  }
}
```

## CMS Intake Page Copy

Use `PageCopy` for copy edits to fixed Portal product-flow pages. Do not hardcode
copy changes in React components when the page is already CMS-managed.

Managed routes and stable keys:

- `/join` -> `PageCopy.key = "join"`
- `/inquire/client` -> `PageCopy.key = "inquire-client"`
- `/inquire/sponsor` -> `PageCopy.key = "inquire-sponsor"`
- `/inquire/grant` -> `PageCopy.key = "inquire-grant"`
- `/inquire/opportunity` -> `PageCopy.key = "inquire-opportunity"`
- `/inquire/general` -> `PageCopy.key = "inquire-general"`

Use `PageCopy` fields for:

- eyebrow
- headline
- intro
- context heading/body
- CTA labels
- post-submit copy
- SEO title/description
- join-page benefit bullets
- join-page funnel links

Rules:

- Page copy is editorial/product copy. Treat updates as human-reviewable unless
  the user explicitly asks to write them.
- Only admins/editors should manage `PageCopy` records.
- Do not create a new collection for copy-only intake changes.
- Keep form submissions writing to the `inquiries` collection.
- Keep inquiry page routes tied to the existing inquiry types unless the user
  explicitly asks for a new intake lane.
- Existing inquiry types are `client`, `sponsor`, `grant`, `opportunity`, and
  `general`.
- For a one-hour consultation MVP, prefer a `client` inquiry variant using
  copy/source-route/intent tracking before adding a new collection or new
  top-level inquiry type.

Example `PageCopy` patch for a consultation-flavored client page:

```bash
curl -b cookies.txt -X PATCH "$PORTAL_URL/api/pageCopy/:id" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Book a one-hour consultation.",
    "intro": "Bring a product, technical, or strategy question and use one focused hour to clarify the next useful move.",
    "messageLabel": "What do you want to validate, scope, or unblock?"
  }'
```

When the request is to add a new intake surface rather than only changing copy,
prefer the smallest model change:

1. Use an existing inquiry `type`.
2. Track the page or campaign through `sourceRoute` and UTM fields.
3. Add an optional `intent` field only if reporting/routing needs a durable
   distinction.
4. Add a new `type` only when lifecycle, routing, permissions, notifications,
   or analytics need to differ from existing lanes.

## Confidence Rules

- `publish`: source is clear, factual, dated, and non-sensitive.
- `draft`: source is plausible but incomplete, ambiguous, sensitive, or needs human wording.
- `skip`: source is generic, duplicative, speculative, private, or not useful to the portal.

Never publish:

- inferred commitments
- invented quotes
- private contact details
- task assignments not explicitly stated
- token/payment claims without source support

## Create vs Update

Update existing records when the source continues a known storyline:

- same project spike
- same thread title/topic
- same upcoming session
- same contributor profile
- same daily brief date/focus

Create new records when the source introduces a distinct real object:

- new project spike with a clear collaboration surface
- new thread that will likely recur
- new dated activity item
- new scheduled session

## Output Format

Return this shape unless the user requests direct edits:

```txt
Source summary:

Proposed creates:
- collection:
  confidence:
  fields:
  source:

Proposed updates:
- collection:
  record:
  confidence:
  changes:
  source:

Skipped:
- item:
  reason:

Review notes:
```

## Guardrails

- Keep projects as collaboration surfaces, not task boards.
- Do not create tasks, assignees, sprint boards, estimates, or PM workflow state.
- Keep activity short, dated, and source-grounded.
- Keep threads lightweight; they are continuity, not categories or tickets.
- Keep sessions practical: title, time, join link, add-to-calendar link, related projects/threads, source artifacts, and resource links.
- Use agent accounts for automated CMS updates; use human accounts only for human-authored updates.
- Use direct, human wording. Avoid marketing language and generic AI summaries.
