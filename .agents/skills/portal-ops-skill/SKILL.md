---
name: portal-ops-skill
description: Operate the RaidGuild Portal through safe Payload API workflows. Use when an agent needs to discover Portal CMS primitives, set up cohort pages, or create or update sessions, posts, wiki pages, wiki topic graph records, briefs, projects, threads, activity items, profiles, spotlights, CMS-managed page copy, or source-grounded memory updates while avoiding invented content and project-management drift.
---

# Portal Ops Skill

## Operating Rule

Use the Portal as the presentation and coordination layer for real community
activity. Do not invent activity, project state, people, dates, links,
sources, claims, or decisions.

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
- content or wiki research packets
- CMS-managed copy changes
- session resources, comments, and artifact updates

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
- `wikiPages`: durable, source-backed topic pages; what the community has learned.
- `wikiTopics`: graph/discovery nodes that organize categories, topics,
  possible articles, sources, and links between wiki pages.
- `cohorts`: durable program hubs that frame a cohort's theme, lifecycle,
  enrollment, schedule, announcements, and curated related work.
- `cohortCommitments`: Profile-owned participation intent created by the person
  joining; agents must not create commitments on someone else's behalf.

## Workflow

1. Extract factual signals from the source.
2. Identify existing projects, threads, events, and profiles that should be updated.
3. Prefer updating existing threads over creating new threads.
4. Create new projects only when there is a concrete collaboration surface with state, people, links, or a next action.
5. Create activity items for specific dated events, decisions, blockers, insights, or contributions. Credit only profiles whose concrete participation the source documents; keep people who are merely mentioned in `relatedProfiles`.
6. Propose a Cohort only when its theme, lifecycle state, and public framing are
   human-approved; connect sourced Posts, Events, Projects, Threads, and Modules
   instead of copying those records into the Cohort.
7. Create or update events only for real sessions with time, location/join/calendar context, or clear follow-up action.
8. Assemble the daily brief from related activity, threads, projects, events, and engagement actions.
9. Create or update wiki pages only when the source supports durable topic knowledge, not transient recap content.
10. Create or update wiki topics when shaping graph discovery, importing
    session topic maps, or connecting generated topic/article candidates.
11. Output a reviewable plan with create/update operations and confidence.

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

For automated workflows that are configured with Portal credentials, map the
instance's environment variables into these values before making Payload
requests:

- `PORTAL_URL`: base URL for the Payload CMS/Portal instance
- `PORTAL_EMAIL`: email for the Portal automation user
- `PORTAL_PASSWORD`: password for the Portal automation user

Some Prism instances use names such as `PAYLOAD_CMS_BASE_URL`,
`PAYLOAD_CMS_EMAIL`, and `PAYLOAD_CMS_PASSWORD`; others may use different names.
Use the configured values for the instance. The credentials must resolve to a
Payload user with an allowed role for the target collection, usually `agent`,
`editor`, or `admin`.

If a workflow prefers bearer auth, log in first and use the returned token as a
Payload JWT:

```bash
LOGIN_RESPONSE="$(curl -sS -X POST "$PORTAL_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$PORTAL_EMAIL"'",
    "password": "'"$PORTAL_PASSWORD"'"
  }')"

PAYLOAD_JWT="$(printf '%s' "$LOGIN_RESPONSE" | jq -r '.token')"

curl -H "Authorization: JWT $PAYLOAD_JWT" "$PORTAL_URL/api/users/me"
```

Do not use Prism service tokens, site service tokens, `x-service-token`, or
generic bearer service tokens for normal Payload collection writes. Payload
collection access checks require `req.user`; service tokens that are not
converted into a Payload user session will fail with `403`.

Agent accounts are trusted automation identities. Where collection access
allows, they can create and publish sourced records. Operationally, prefer
review drafts unless the target environment is clear and the source facts are
concrete. Agents must not delete, manage users, or impersonate humans.

## Cohort Page Setup

Use `cohorts` for a named RaidGuild program with its own theme, lifecycle,
enrollment state, schedule, announcements, and durable page at
`/cohorts/<slug>`. Do not use a Cohort as a course, task board, generic campaign
page, or replacement for Events, Posts, Projects, Threads, or Modules.

### Authority And Review

Creating or updating the Cohort record requires an editor or admin Payload
session. An `agent` account may assemble a sourced proposal and may operate
related collections where their access allows, but it cannot write the Cohort
record directly. Do not work around this by using a human's credentials for an
automated publisher.

Default to this review sequence:

1. Discover existing Cohorts by slug and confirm whether this is a create or an
   update.
2. Produce a reviewable Cohort payload and list every source for its theme,
   dates, status, links, and related records.
3. Have an editor or admin create the Cohort as a draft.
4. Create or identify sourced Announcement Posts, Events, Projects, Threads,
   Modules, media, and external references.
5. Have an editor or admin attach the reviewed relationship IDs and publish.
6. Verify the public API record and `/cohorts/<slug>` route with the intended
   visibility.

Never invent a cohort number, launch date, capacity, enrollment deadline,
schedule, participant, commitment, speaker, join link, or claim of demand.

### Cohort Fields

Required or operationally important fields:

- `title`, `slug`, `summary`, `theme`
- `programStatus`: `draft`, `gathering-interest`, `upcoming`, `active`,
  `complete`, or `archived`
- `enrollmentStatus`: `closed`, `open`, or `waitlist`
- `startsAt`, `endsAt`, `enrollmentOpensAt`, `enrollmentClosesAt` when confirmed
- `participationExpectation` and factual `capacity` when useful
- `heroMedia`: optional Payload media ID
- `explorationVideoURL`: optional YouTube URL; never store arbitrary iframe HTML
- `visualVariant`: `guild`, `scroll`, or `moloch`
- `starterTopics`: `{ title, summary?, url? }`
- `programSections`: `{ heading, body }`
- `contextLinks`: `{ title, summary?, url }` with explicit external URLs
- `highlightedThread`, `featuredPosts`, `featuredProjects`, `featuredModules`:
  existing Payload relationship IDs
- `visibility`: `public`, `authenticated`, `member`, or `admin`
- `_status`: `draft` or `published`

Keep `programStatus` separate from `enrollmentStatus`:

- `gathering-interest` means the idea is visible enough to test demand, has no
  official start date unless one is actually confirmed, and uses
  `enrollmentStatus: closed`. Portal supplies the interest/topic inquiry CTAs.
- `upcoming` may be published before enrollment opens.
- `active` may have closed enrollment.
- `complete` and `archived` preserve the same durable route and emphasize the
  resulting sessions, Posts, Projects, and artifacts.

Example editor/admin draft creation:

```bash
curl -b editor-cookies.txt -X POST "$PORTAL_URL/api/cohorts" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Agentic Guild Operations",
    "slug": "agentic-guild-operations",
    "summary": "A sourced summary approved for the cohort proposal.",
    "theme": "Agents that strengthen real community work",
    "programStatus": "gathering-interest",
    "enrollmentStatus": "closed",
    "visualVariant": "guild",
    "visibility": "public",
    "_status": "draft"
  }'
```

Omit uncertain optional fields instead of filling them with placeholders.

### Announcements And Related Work

Announcements remain normal, shareable Posts:

1. Create or identify a Post with `contentType: "announcement"`.
2. Set its visibility and publication state from the source and review policy.
3. Add its ID to the Cohort's `featuredPosts` relationship.

The cohort page separates Announcement Posts into a date-ordered Announcements
section and does not duplicate them in general context and work. Other featured
Posts remain examples, guides, recaps, or related editorial context.

Use relationships rather than duplicating content:

- `highlightedThread` for the main persistent line of thought
- `featuredProjects` for concrete work produced or advanced by the cohort
- `featuredModules` for reusable Portal tools
- `contextLinks` only for useful external references

### Cohort Sessions

Sessions remain canonical `events` records. Connect each confirmed session with
`relatedCohorts: [<cohortID>]`. The cohort page derives its next session, weekly
strip, full schedule, and past-session archive from those Events.

For a Portal-only event, the raw Payload endpoint accepts `relatedCohorts`:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cohort kickoff",
    "summary": "Confirmed kickoff framing from the approved program notes.",
    "sessionType": "kickoff",
    "startsAt": "2026-09-10T18:00:00.000Z",
    "endsAt": "2026-09-10T19:00:00.000Z",
    "relatedCohorts": [123],
    "visibility": "public",
    "_status": "published"
  }'
```

When Discord scheduled-event creation is required, use
`POST /api/events/create` as documented below, verify its sync result, then
`PATCH /api/events/<eventID>` with the reviewed `relatedCohorts` IDs. Do not
claim the session is on the cohort schedule until that relationship is present.

### Commitments And Interest

Do not create `cohortCommitments` for people. A commitment represents a person's
own authenticated action and requires a linked Profile. The public cohort page
handles login, Profile gating, commit, withdraw, and rejoin flows.

Do not create a separate interest record for a `gathering-interest` Cohort.
Portal uses a prefilled general inquiry for “I'm interested” and “Suggest a
topic” until real operations justify a dedicated interest lifecycle.

### Publish Verification

After an editor/admin publishes, verify:

```bash
curl -f "$PORTAL_URL/api/cohorts?depth=2&where[slug][equals]=<slug>"
curl -I -f "$PORTAL_URL/cohorts/<slug>"
```

Check that:

- the Cohort is published with the intended visibility
- status, enrollment, dates, and CTA language are truthful
- Announcement Posts appear once and link to their Post routes
- related Events appear in chronological schedule sections
- related records enforce their own visibility
- commitment CTAs require authentication and a Profile

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
- The dedicated endpoint does not currently accept `relatedCohorts`; after it
  creates the Event, patch the Event through `/api/events/:id` to attach the
  reviewed Cohort IDs.
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
- `relatedCohorts`: Cohort programs whose schedules include the Event

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

## Wiki Page Creation

Use `wikiPages` for durable, source-backed knowledge pages. A session can spark
the page, but the wiki page is allowed to include broader evidence from Prism,
papers, official docs, HN/blog signal, tools, and other external sources.

Good wiki candidates:

- technical topic deep dives
- further reading packs
- dated latest-signal briefs
- prompt packs
- research maps
- evergreen practice notes

Do not use wiki pages for simple session recaps, announcements, private notes,
or generic SEO content.

Use `wikiTopics` for the Infinite Wiki graph and discovery tree. Topics are not
articles; they are navigation and generation targets that connect categories,
topics, possible future pages, reviewed wiki pages, source sessions, and Prism
artifacts.

Good wiki topic candidates:

- high-level categories that group multiple wiki pages
- session-derived topics that deserve exploration
- possible article candidates generated by Prism
- sibling or child topics used for graph discovery
- source-backed research directions that are not ready to publish as articles

Do not create `wikiTopics` for generic tags, marketing labels, private-only
notes, or one-off session recap headings.

Key fields:

- `title`
- `slug`
- `summary`
- `body`
- `sourceSessions`: sessions/events that sparked or support the page
- `relatedPosts`: posts derived from or related to the page
- `relatedProjects`, `relatedThreads`, `relatedProfiles`,
  `relatedActivityItems`
- `keyClaims`: claim ledger entries with source labels
- `furtherReading`, `papers`, `tools`
- `openQuestions`
- `prompts`
- `relatedTopics`
- `possibleTopics`: candidate page links that are not yet canonical
- `sourceArtifacts`: source links/artifacts with `sourceType`, `url`,
  `sourceQuery`, and `observedAt`
- `reviewStatus`: `generated_draft`, `needs_review`, `reviewed`,
  `needs_refresh`, or `archived`
- `confidence`: `low`, `medium`, or `high`
- `lastReviewedAt`, `lastRefreshedAt`, `generatedAt`, `promptVersion`, `model`
- `visibility`: `public`, `authenticated`, `member`, or `admin`
- `_status`: `draft` or `published`

Wiki topic key fields:

- `title`
- `slug`
- `summary`
- `kind`: `category`, `topic`, `subtopic`, or `possible`
- `parentTopic`
- `relatedTopics`
- `canonicalPage`
- `relatedPages`
- `sourceSessions`
- `sourceQueries`
- `sourceArtifacts`
- `expansionPrompt`
- `reviewStatus`: `seed`, `suggested`, `needs_review`, `reviewed`, or
  `archived`
- `confidence`: `low`, `medium`, or `high`
- `visibility`: `public`, `authenticated`, `member`, or `admin`
- `sortOrder`
- `lastExpandedAt`, `lastReviewedAt`, `generatedAt`, `generatedBy`

Recommended research workflow:

1. `topic-intake`: pick one narrow technical question from a session or source.
2. `source-scan`: gather Prism memory, papers, official docs, HN/blog/news, and
   product/tool sources.
3. `claim-ledger`: separate session claims, external claims, opinions, and
   speculation.
4. `synthesis`: write a focused deep dive, not a recap.
5. `reading-pack`: attach annotated further reading.
6. `review`: date freshness-sensitive claims and check citations.
7. `publish`: optionally publish the reviewed wiki page or create a derived post.

Agents, editors, and admins may create and update wiki pages. Wiki writes must
use a real Payload user session or `Authorization: JWT <token>` from
`/api/users/login`; unauthenticated requests and generic service-token requests
will be rejected by collection access.

Agents, editors, and admins may create and update wiki topics. Members may
explore visible topics and trigger/import generated topic expansion proposals
through the dedicated frontend endpoints. Agents must not create or update
admin-only wiki topics unless operating as a human-approved admin/editor flow.

Published wiki pages must have `reviewStatus: "reviewed"`. Prefer `draft` or
`needs_review` for low-confidence, speculative, sensitive, or
freshness-dependent pages. Agents must not create or update wiki pages with
`visibility: "admin"`.

Before `POST` or `PATCH /api/wikiPages`, normalize generated artifacts to the
live schema:

- Convert Markdown or prose bodies into valid Payload Lexical JSON with real
  structure. Section titles must be Lexical `heading` nodes, bullets must be
  `list` / `listitem` nodes, and article text should be paragraph nodes.
- Ensure each `prompts` item has both `label` and `prompt`.
- Ensure `sourceArtifacts` entries use the live fields: `label`, optional
  `artifactID`, `sourceType`, `url`, `sourceQuery`, and `observedAt`.
- Omit malformed optional arrays rather than sending invalid shapes.
- If publishing, set both `_status: "published"` and
  `reviewStatus: "reviewed"` after the human approval gate.
- After publishing, verify the public `/wiki/<slug>` route returns `200`.
- If auth, schema validation, or public verification fails, save a blocked
  artifact and leave the workflow blocked or failed. Do not close it as
  successful.

For topic-map imports from a session/event resource artifact, prefer the
dedicated endpoint after logging in:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/wiki/topic-map/import" \
  -H "Content-Type: application/json" \
  -d '{
    "eventID": 69,
    "resourceURL": "https://prism-memory-production-002c.up.railway.app/artifacts/example"
  }'
```

For Prism topic expansion, trigger the hook through Portal rather than writing
raw generated records first:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/wiki/topics/expand" \
  -H "Content-Type: application/json" \
  -d '{
    "topicID": 12,
    "mode": "children",
    "instructions": "Prioritize source-backed research questions and possible article candidates."
  }'
```

When Prism returns `wiki-topic-expansion-proposal.json`, import it through:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/wiki/topics/expansion/import" \
  -H "Content-Type: application/json" \
  -d '{
    "focusTopicID": 12,
    "requestNumber": 123
  }'
```

Expansion imports are intentionally optimistic for topic/article candidates:
they may create visible member topic nodes and draft article candidates.
Deletion, pruning, and review happen after generation. Research articles should
stay source-backed and non-editorial.

For an environment that already has wiki pages but no graph topics, use the
guarded wiki-only seed command. Do not run the broad Portal seed against
production just to initialize the graph:

```bash
railway run corepack pnpm payload run scripts/seedWikiTopics.ts -- --apply
```

Do not flatten wiki pages into one paragraph per Markdown line. Before
publishing, inspect `body.root.children`:

- Section headings such as `Definition`, `Current State`, `Further Reading`, or
  `Open Questions` must not be plain paragraph nodes.
- Consecutive short items after a colon should usually become a bullet list.
- A body where almost every node is `paragraph` should be treated as a failed
  conversion unless the source truly contains no headings or lists.
- If the converter cannot preserve heading/list structure, block the publish
  step and save a conversion error artifact.

Minimal Lexical structure examples:

```json
{
  "type": "heading",
  "tag": "h2",
  "format": "",
  "indent": 0,
  "version": 1,
  "children": [
    {
      "type": "text",
      "text": "Definition",
      "detail": 0,
      "format": 0,
      "mode": "normal",
      "style": "",
      "version": 1
    }
  ]
}
```

```json
{
  "type": "list",
  "tag": "ul",
  "listType": "bullet",
  "format": "",
  "indent": 0,
  "version": 1,
  "children": [
    {
      "type": "listitem",
      "value": 1,
      "format": "",
      "indent": 0,
      "version": 1,
      "children": [
        {
          "type": "text",
          "text": "Contact records and relationship context",
          "detail": 0,
          "format": 0,
          "mode": "normal",
          "style": "",
          "version": 1
        }
      ]
    }
  ]
}
```

Example wiki draft:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/wikiPages" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Planning Loops and Agent Coordinators",
    "slug": "planning-loops-and-agent-coordinators",
    "summary": "A source-backed topic page on planning loops, agent coordination, and current research signals.",
    "visibility": "public",
    "reviewStatus": "needs_review",
    "confidence": "medium",
    "_status": "draft",
    "keyClaims": [
      {
        "claim": "Planning loops need observable checkpoints so humans can inspect intermediate agent reasoning and state.",
        "sourceLabel": "Session 49 plus external docs scan"
      }
    ],
    "sourceArtifacts": [
      {
        "label": "Session 49 summary",
        "sourceType": "session",
        "url": "https://example.com/session-summary",
        "sourceQuery": "planning loops agent coordinators"
      }
    ],
    "possibleTopics": [
      {
        "topic": "Context engineering"
      }
    ],
    "body": { "root": { "type": "root", "children": [] } }
  }'
```

Example reviewed wiki publish with Payload JWT auth:

```bash
curl -X POST "$PORTAL_URL/api/wikiPages" \
  -H "Authorization: JWT $PAYLOAD_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI and Open Source Security in the Agentic Coding Era",
    "slug": "ai-and-open-source-security-agentic-coding-era",
    "summary": "A source-backed topic page on open source security concerns in agentic coding workflows.",
    "visibility": "public",
    "reviewStatus": "reviewed",
    "confidence": "medium",
    "_status": "published",
    "body": { "root": { "type": "root", "children": [] } }
  }'
```

## Post Creation

Posts are reviewed editorial or distribution artifacts. They may be derived from
sessions, wiki pages, projects, threads, or other source-grounded context.

Agents, editors, and admins can publish posts by role. Operationally, agents
should create review drafts unless the target environment is clear and the
source facts are concrete. When creating a draft through `POST /api/posts`, send
`_status: "draft"` or omit `_status`, and omit `publishedAt`.

Posts support `visibility`: `public`, `authenticated`, `member`, or `admin`.
Agent accounts may set visibility and may read member-visible content. Do not use
`member` unless the source material is meant for confirmed members.

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

## Post Interactive Artifacts

Posts may embed reviewed interactive workshop artifacts hosted on the separate
RaidGuild artifact origin. Never paste executable HTML or JavaScript into
Lexical content and never invent or upload an artifact from source material
without explicit human approval.

Insert an `interactiveEmbed` block into `content.root.children`:

```json
{
  "type": "block",
  "fields": {
    "blockType": "interactiveEmbed",
    "title": "RaidGuild BD thread journeys",
    "url": "https://portal-artifacts-production.up.railway.app/bd-thread-journeys/",
    "caption": "Concept demonstration from a reviewed content workshop.",
    "height": 640,
    "showOpenLink": true
  },
  "format": "",
  "version": 2
}
```

The URL must use an exact HTTPS origin configured in
`INTERACTIVE_ARTIFACT_ORIGINS`. `title` is required for accessibility. `height`
must be between 320 and 1200 pixels. `previewImage` may reference a Payload
media ID and supplies a non-interactive email fallback. Portal renders the live
artifact in a scripts-only sandbox; agents must not request broader iframe
permissions.

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

## Signup Spam And Feedback Cleanup

Public signup is protected by passive checks in the `users` collection:

- hidden honeypot field
- minimum submit time
- hashed email/IP signup-attempt rate limits
- optional blocked email domains from `SIGNUP_BLOCKED_EMAIL_DOMAINS`

Do not bypass these checks for normal human accounts. Trusted internal creation
paths, such as seeds and `/api/agent/register`, set `skipSignupProtection` in
Payload context.

Feedback submissions require a verified account unless the user is an editor or
admin. Unverified accounts should verify email before submitting feedback.

Portal access policy:

- `public` content can be read anonymously.
- `authenticated` content requires a verified Portal account.
- `member` content requires member access.
- Fresh signups with the `unverified` role should be directed to `/me` to verify
  email before using authenticated views, comments, feedback, modules, or other
  write actions.

Admins can inspect signup spam through:

- `signupAttempts`: hashed signup attempt audit records
- `feedbackSubmissions`: feedback triage records with `status = "spam"`
- `users`: unverified accounts with `roles` containing `unverified`

Cleanup is admin-only and dry-run by default:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/admin/spam-cleanup" \
  -H "Content-Type: application/json" \
  -d '{
    "since": "2026-06-15T00:00:00.000Z",
    "pageURL": "/join"
  }'
```

Apply cleanup explicitly:

```bash
curl -b cookies.txt -X POST "$PORTAL_URL/api/admin/spam-cleanup" \
  -H "Content-Type: application/json" \
  -d '{
    "since": "2026-06-15T00:00:00.000Z",
    "pageURL": "/join",
    "dryRun": false,
    "deleteUsers": true
  }'
```

The script form is:

```bash
SPAM_CLEANUP_SINCE=2026-06-15T00:00:00.000Z corepack pnpm spam:cleanup
SPAM_CLEANUP_SINCE=2026-06-15T00:00:00.000Z SPAM_CLEANUP_DELETE_USERS=true corepack pnpm spam:cleanup:apply
```

Operational rules:

- Run dry-run first and report counts before applying cleanup.
- Do not dump raw emails, message bodies, or IPs into chat.
- Prefer marking feedback as `spam` before deleting users.
- Delete users only when they are unverified, recent, and tied to the spam
  pattern under review.
- Agents must not run cleanup unless a human explicitly asks and target
  environment is clear.

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

## Skill Discovery

Agents can discover available Portal skills through:

```bash
curl "$PORTAL_URL/api/portal/skills"
```

Fetch this skill directly through:

```bash
curl "$PORTAL_URL/api/portal/skills/portal-ops-skill"
```

The legacy alias remains available for older agents:

```bash
curl "$PORTAL_URL/api/portal/skills/portal-memory-publisher"
```

Prefer the canonical `portal-ops-skill` name in new workflows.

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
