# Sessions MVP Spec

## Status

Active MVP focus.

This spec consolidates the current sessions direction for collaborator review and
handoff. Product language should use `sessions`; the current Payload collection
slug remains `events`.

## Product Intent

Sessions are the Portal's main live coordination surface.

They answer:

- What is happening next?
- Is anything live right now?
- How do I join or add it to my calendar?
- Who is hosting or speaking?
- What project, thread, or source material is this connected to?
- What happened after the session ended?

The goal is not to replace Discord, Zoom, Google Calendar, or Prism. The Portal
should make sessions discoverable, contextual, and easy to act on.

## Mental Model

```txt
Session = scheduled or recorded gathering
Discord event = optional external live attendance object
Prism artifact = optional recording/transcript/summary output
Thread = narrative or series context
Project = work/context referenced by the session
Post = distribution artifact derived from a session
Profile = host, guest, speaker, or related participant
```

Sessions should remain flat. Do not add a separate `sessionSeries` or
`contentPacket` collection until copied metadata and relationships are no longer
enough.

## Current Implementation

### Routes

- `/events`: public sessions list, labeled as sessions in the UI.
- `/events/[id]`: session detail page.
- `/events/new`: contributor-friendly future session creation flow.
- `/api/events/create`: authenticated session creation endpoint with optional
  Discord scheduled event sync.
- `/api/events/artifacts/ingest`: authenticated Prism artifact ingest endpoint.
- Payload admin `/admin/collections/events`: canonical editorial/admin surface.

### List UI

The sessions list is calendar-like:

- live sessions are highlighted first
- upcoming sessions are sorted by start time ascending
- past sessions are shown separately
- rows show day/date, type, title, time, summary, people, recurrence label,
  source status, related projects/threads, and actions
- actions can include details, join, add to calendar, and Discord event

### Detail UI

The session detail page is the hub for richer context:

- title, type, status, visibility, series label
- date/time, location, recurrence summary
- join/calendar/Discord actions for upcoming sessions
- guests, hosts, speakers, and related profiles
- CTA for unauthenticated users to join or log in
- source material for past sessions when authenticated
- related projects and threads
- derived posts grouped by content type
- wiki candidate topics
- linked social posts
- previous/next occurrence links

Unauthenticated users can see basic public session details. Authenticated users
can see the fuller graph of relationships and source material. Do not build a
full entitlement system yet.

## Data Model

Collection: `events`

Core scheduling fields:

- `title`
- `summary`
- `sessionType`: `brownbag`, `workshop`, `all-hands`, `demo`, `pitch`,
  `fireside`
- `startsAt`
- `endsAt`
- `locationLabel`
- `joinURL`
- `calendarURL`
- `visibility`: `public`, `authenticated`, `member`, `admin`
- `_status`
- `publishedAt`

People fields:

- `speaker`: legacy single speaker relationship to `profiles`
- `hostProfiles`: many profiles
- `speakerProfiles`: many profiles; use for guests/speakers
- `relatedProfiles`: many profiles

Relationship fields:

- `relatedProjects`
- `relatedThreads`
- `previousOccurrence`
- `nextOccurrence`

Discord sync fields:

- `discordEventURL`
- `discordScheduledEventID`
- `discordSyncStatus`: `not_configured`, `synced`, `failed`
- `discordSyncError`

Prism/source artifact fields:

- `recordingURL`
- `transcriptArtifactURL`
- `summaryArtifactURL`
- `sourceArtifactURL`
- `sourceArtifactID`
- `sourceStatus`: `scheduled`, `recorded`, `summarized`, `processed`,
  `archived`

Recurrence metadata:

- `seriesKey`
- `seriesTitle`
- `recurrenceCadence`: `weekly`, `biweekly`, `monthly`
- `recurrenceUntil`

Fireside/content fields:

- `roleFocus`: `designer`, `pm`, `devops`, `founder`, `developer`,
  `operations`, `other`
- `practiceArea`
- `themes`
- `wikiCandidate`
- `wikiCandidateTopics`
- `linkedSocialPosts`

## Creation Flow

### Contributor UI

`/events/new` is for future sessions only.

The form should stay fast and mobile friendly:

- title
- start date/time
- duration: `30 min` or `1 hour`
- visibility: public/member-facing options, with public as default
- type: button group
- hosts and guests: profile typeahead, multi-select
- summary
- advanced section for location/join URL, related project, related thread,
  recurrence fields, and Discord sync

The current user should default into hosts when their profile is available.

Past-session enrichment should happen through Payload admin or API workflows, not
the contributor-facing form.

### API

Use `/api/events/create` for future sessions that may need Discord sync.

Required:

- authenticated user
- contributor, agent, editor, or admin role
- `title`
- future `startsAt`
- `durationMinutes`: `30` or `60`
- `sessionType`

Optional:

- `summary`
- `visibility`
- `hosts`
- `guests`
- `relatedProjects`
- `relatedThreads`
- `locationLabel`
- `joinURL`
- `syncDiscord`
- recurrence fields

The endpoint:

- creates a published Portal event
- calculates `endsAt`
- creates a Google Calendar fallback URL
- optionally creates a Discord scheduled event
- stores Discord sync success/failure state

Direct `POST /api/events` should be reserved for Portal-only imports, drafts,
past-session enrichment, or records that already have external links.

## Discord Integration

Portal does not use Discord's recurring event UI/API behavior for recurrence.

For a single future session:

1. User or agent creates a session through `/api/events/create`.
2. If `syncDiscord` is true and Discord env/config is available, Portal calls the
   Discord scheduled event API.
3. Portal stores `discordScheduledEventID`, `discordEventURL`, `joinURL`, and
   `discordSyncStatus: synced`.
4. If Discord fails, the Portal session still exists with
   `discordSyncStatus: failed` and `discordSyncError`.

Agents must not claim a Discord event was created unless the response contains
`discordSyncStatus: synced` and `discordEventURL`.

## Prism Artifact Flow

Prism should attach recording, transcript, and summary artifacts through:

`POST /api/events/artifacts/ingest`

The endpoint authenticates a Portal user session. Agent accounts may call it.

Matching order:

1. explicit `eventID`
2. `discord.scheduledEventID`

Payload shape:

```json
{
  "eventID": 123,
  "discord": {
    "scheduledEventID": "1234567890"
  },
  "artifacts": {
    "artifactID": "prism-artifact-id",
    "recordingURL": "https://example.com/recording",
    "transcriptURL": "https://example.com/transcript",
    "summaryURL": "https://example.com/summary",
    "sourceURL": "https://example.com/source"
  },
  "sourceStatus": "summarized"
}
```

If no matching session exists, Prism should keep the artifact in its workflow for
human review. It should not invent a Portal session.

## Recurring Sessions

MVP recurrence uses copied metadata between normal event records.

Use:

- `seriesKey`: stable machine-readable grouping key, e.g. `weekly-all-hands`
- `seriesTitle`: display label
- `recurrenceCadence`: `weekly`, `biweekly`, or `monthly`
- `recurrenceUntil`: optional end date
- `previousOccurrence`
- `nextOccurrence`

Expected workflow:

1. A root/current session has series metadata.
2. After the meeting ends, Prism or an agent workflow may process artifacts.
3. The workflow can create the next event by copying series metadata forward.
4. The new event sets `previousOccurrence` to the current event.
5. The current event gets patched with `nextOccurrence`.

Portal should not add a separate recurrence collection yet. Add one only if
series-level ownership, attendance, permissions, templates, or analytics become
hard to manage with copied metadata.

## Visibility And Access

Use these visibility values:

- `public`: visible to everyone
- `authenticated`: visible to logged-in users
- `member`: visible to users with the member role
- `admin`: admin/internal only

Current product default should be open:

- new contributor-created sessions default to `public`
- unauthenticated users should see public basics and a join/login CTA
- authenticated users can see richer details and relationships
- member-only sessions are supported by visibility, but avoid deeper entitlement
  logic until there is a concrete need

## Firesides And Content Derivation

Firesides are sessions with `sessionType: fireside`.

A fireside can become a source hub for:

- related posts
- linked social posts
- Prism summary/transcript/recording artifacts
- wiki candidate topics
- related projects
- related profiles
- parent threads or series

Do not store raw long transcripts directly in Payload. Store links to Prism
artifacts and keep summaries/source context in the session.

## MVP Requirements

Already implemented:

- `events` collection with sessions fields
- `/events` list with live/upcoming/past sections
- `/events/[id]` detail page
- `/events/new` contributor creation form
- `/api/events/create` with optional Discord sync
- `/api/events/artifacts/ingest`
- source artifact fields
- host/guest profile relationships
- member-aware visibility
- recurrence metadata
- related project/thread/profile relationships
- derived post display on session details

Next MVP priorities:

- improve session detail UX around source material and derived content
- tighten mobile layout and scanning on list/detail pages
- make Discord sync failures more visible to creators/admins
- add explicit admin cleanup docs for failed Discord sync or artifact mismatch
- add more e2e coverage for member-only sessions and artifact ingest visibility
- decide whether attendance/RSVP is needed for MVP or should stay out

## Non-Goals For MVP

- replacing Discord chat or voice
- replacing Google Calendar
- full RSVP or attendance management
- full native recurring calendar engine
- course platform behavior
- task boards, agendas, assignments, or project management workflows
- storing full transcripts directly in Payload
- automatic public publishing of generated posts or wiki material

## Open Questions

- Should members be able to express intent to attend, or is add-to-calendar
  enough for MVP?
- Should all source material require authentication, even for public sessions?
- Should member-only sessions show an unauthenticated teaser or a hard 404?
- Should linked social posts live only on sessions or also on derived posts?
- Should session attendance eventually feed points/props, or remain separate for
  now?
- Do recurring session templates need owner/host defaults, or can copied metadata
  stay enough?

## Handoff Notes

When discussing sessions with collaborators, use these terms consistently:

- "session" in product/UI conversation
- "`events` collection" in Payload/code conversation
- "Discord scheduled event" for the external Discord object
- "Prism artifact" for recording/transcript/summary source material
- "series metadata" for recurrence, not a separate series model

The primary MVP value is simple: make live moments visible, easy to join, easy to
add to calendars, and useful after they are over.
