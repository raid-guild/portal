# Fireside Content Flow Feature Spec

## Status

Future content workflow module. Start with existing Portal primitives and add
relationships/fields before creating new collections.

This feature should help RaidGuild turn member conversations into useful source
records, public distribution artifacts, and evergreen practice knowledge without
turning the portal into a generic content machine.

## Product Intent

Fireside chats are structured member interviews or conversations that become a
source event for several downstream outputs.

They answer:

- Who carries field experience on this topic?
- What did we learn from the conversation?
- Which clips, posts, and summaries should be distributed?
- Which durable lessons should become wiki material?
- Which projects, roles, and profiles provide evidence or context?

The system should preserve the original conversation while making it easy to
distill and distribute useful pieces.

## Clean Mental Model

```txt
Thread = series / narrative arc
Session = recorded source event
Post = distribution output
Wiki = evergreen distilled practice
Project = evidence and context
Profile = person and expertise map
```

Examples:

- `Field Notes from the Edge` is a `Thread`.
- `How to RaidGuild` is a wiki namespace or knowledge area.
- A single Fireside is a session in the UI and an `events` record internally.
- A recap, quote post, clip post, or newsletter item is a `Post`.
- Durable practice guidance graduates into `wikiPages` later.

## Recommended Hierarchy

### Thread / Series

Threads should hold narrative continuity across multiple sessions and outputs.

Examples:

- `Field Notes from the Edge`
- `How to RaidGuild`
- `AI Adaptation in the Guild`
- `Agency Work in the Age of Agents`

Use threads to group related sessions, posts, wiki pages, and projects. Do not
make a thread carry a production workflow by itself.

### Session

The session is the canonical source artifact.

The product-facing language should remain `sessions`, even if the current
Payload collection slug remains `events`.

Each Fireside should be an `events` record with enough source metadata to become
the hub for downstream content:

- title
- optional guest/speaker profiles
- optional host profiles
- date/time
- recording link
- transcript, summary, or source artifact links from Prism
- summary
- tags or themes
- role focus
- practice area
- related thread or series
- related profiles
- related projects

Everything derived from the Fireside should point back to the source session.
Keep the session as the flat hub for sorting and discovery; do not introduce a
`ContentPacket` object to group outputs until there is clear operational pressure.

The same session object has two UI modes:

- `upcoming session`: scheduling object with join, RSVP, Discord, and calendar
  affordances.
- `past session`: source hub with recording, summary, Prism artifacts, related
  posts, related projects, related profiles, and wiki candidates.

### Posts

Posts are distribution artifacts.

One session can produce several posts:

- recap post
- quote post
- clip post
- `5 things we learned`
- public announcement
- newsletter item

Posts should link back to the source session and parent thread so readers can
find the context.

Social drafts, Remotion scripts, captions, thumbnails, and platform-specific
variants should stay in the external content workflow unless they become
presentable Portal records. The Portal can store links to published social posts
without treating draft social content as `posts`.

### Wiki / Knowledge

Wiki pages should hold durable practice, not the raw conversation.

Examples:

- `How to Run a Raid Kickoff`
- `How Designers Are Using AI in Raid Work`
- `AI-Assisted DevOps Boundaries`
- `Client Discovery Questions for Ambiguous AI Work`
- `What Not to Automate`

Not every Fireside should become wiki material. Sessions can capture wiki
candidate topics before a `wikiPages` collection exists. Once wiki pages exist,
the candidate topics can graduate into relationships.

Wiki sorting should also start from the source session. A topic can appear as a
candidate on the session first, then later become a generated or published wiki
page. This keeps the ordering grounded in the conversation that produced the
insight instead of requiring wiki infrastructure before the source flow works.

### Projects

Projects are evidence and context.

If a Fireside references a real raid, client, product, or experiment, attach the
related project. Projects should not become the container for the Fireside unless
the session is explicitly a project retrospective.

### Profiles

Profiles represent people as knowledge carriers.

Profile pages can eventually show:

- sessions appeared in
- posts derived from interviews
- practice areas contributed
- field notes or source excerpts
- role expertise

## One Fireside Content Packet

A single Fireside could generate:

```txt
1 Session: full recording, transcript/source artifact, and summary
1 Thread association: Field Notes from the Edge
1-4 Posts: recap, quote post, clip post, newsletter article
0-5 Linked social posts: published URLs from external channels
1 Wiki candidate: durable How to RaidGuild lesson
0-3 Project links: real work referenced
1+ Profile enrichments: guest expertise and field notes
```

`ContentPacket` should start as a production concept, not a CMS collection.

## Current Model Fit

The current app already supports much of this:

- `events` has session type, speaker, time, summary, Discord/calendar links,
  related projects, related threads, and related profiles.
- `threads` can act as the series container.
- `posts` can handle recap/editorial output.
- `projects` can provide evidence/context.
- `profiles` can be related to events and eventually display appearances.
- `activityItems` can record factual signals that a session happened or an
  output was published.

The missing piece is a richer session detail and derivation model.

## Proposed Field Additions

Prefer adding fields to existing collections before adding new collections.

### Events / Sessions

Recommended additions:

```txt
sessionType: add fireside
recordingURL: text
transcriptArtifactURL: text
summaryArtifactURL: text
sourceArtifactURL: text
sourceArtifactID: text
hostProfiles: relationship -> profiles, many
speakerProfiles: relationship -> profiles, many
roleFocus: designer / pm / devops / founder / developer / operations / other
practiceArea: text or select
themes: array of text
sourceStatus: scheduled / recorded / summarized / processed / archived
wikiCandidate: checkbox
wikiCandidateTopics: array of text
linkedSocialPosts: array
```

Use existing relationships where possible:

```txt
relatedThreads -> parent series
relatedProjects -> projects referenced
relatedProfiles -> guests, hosts, and people discussed
```

The existing singular `speaker` field can stay for compatibility, but the UI
should prefer a multi-profile speaker/host pattern when the richer fields exist.

`linkedSocialPosts` should store published links only:

```txt
platform
url
label
publishedAt
```

### Posts

Recommended additions:

```txt
sourceSession: relationship -> events
parentThread: relationship -> threads
derivedFromPosts: relationship -> posts, many
contentType: recap / quote / clip / lesson / announcement / newsletter
artifactKind: article / embed / note
wikiCandidate: checkbox
wikiCandidateTopics: array of text
sourceArtifactURL: text
sourceArtifactID: text
```

This lets the same `posts` collection support blog-style writing, quote posts,
clip notes, and newsletter articles without creating separate collections.

Posts derived from sessions should sort by source session date first, then by
content type priority. A suggested default priority is:

```txt
recap
lesson
quote
clip
newsletter
announcement
```

This keeps session pages coherent without needing manual ordering at first.

### Threads

Recommended additions:

```txt
threadKind: series / topic / project_line / practice_area
coverImage: upload -> media
featuredProfiles: relationship -> profiles, many
```

Thread pages should become the series hub when this workflow becomes real.

### Profiles

Avoid adding many profile fields at first. Derive most profile displays from
relationships:

- sessions where profile is host/speaker/related profile
- posts where profile is author or source participant
- wiki pages where profile is listed as a source contributor

Add explicit expertise fields only when derived relationships are not enough.

## UI Direction

### Sessions List

The existing calendar-style sessions list can support Firesides by adding:

- Fireside session type styling.
- guest/host display.
- source status badges for past sessions.
- related thread/series pills.

The list should remain scannable and calendar-like.

Upcoming and past sessions should emphasize different actions:

- Upcoming sessions: join, add to calendar, Discord event, host/speaker, topic.
- Past sessions: recording, summary, source artifacts, related posts, related
  projects, related profiles, wiki candidates.

### Session Detail Page

This is the most important missing UI.

A session detail page should show:

- title, date, type, visibility, and status
- hosts and guests
- join/add-to-calendar/Discord links for upcoming sessions
- recording and transcript/source links for past sessions
- summary and highlights
- related thread/series
- related posts generated from the session
- related projects
- related profiles
- wiki candidates or generated wiki links
- published social links, if any

This page is the source hub for the content packet.

Suggested default ordering on the session detail page:

```txt
1. Source summary and highlights
2. Recording and Prism source links
3. Derived posts, grouped by content type
4. Wiki candidate topics or related wiki pages
5. Related projects
6. Related profiles
7. Published social links
```

This keeps the source material first, then moves into distribution and durable
knowledge.

### Thread / Series Page

A thread detail page should show the arc:

- series title and summary
- sessions in chronological order
- derived posts
- related projects
- involved profiles
- wiki pages or candidates

This is where `Field Notes from the Edge` should live.

### Post Detail Page

Posts derived from sessions should show source context:

```txt
Derived from: Fireside with [Guest] in [Thread]
Source session: [Session title]
Related wiki candidate: [Topic]
```

This makes distribution content traceable.

### Profile Page

Later profile enrichment can show:

- appeared in sessions
- field notes
- posts derived from interviews
- practice areas contributed
- related projects

Start with derived displays rather than manual profile fields.

## Prism Memory Integration

Prism Memory should be the evidence and generation layer for transcripts,
summaries, and source artifacts.

Possible source fields on sessions and posts:

```txt
sourceArtifactID
sourceArtifactURL
transcriptArtifactURL
summaryArtifactURL
sourceQuery
generatedAt
generationModel
confidence
```

Use Prism to generate draft outputs, but save reviewed/canonical records in
Payload.

Long transcripts should be linked Prism artifacts, not copied into Payload. A
short human-edited summary can live in Payload for display.

## Permissions

Suggested first version:

- Contributors can create session records and draft posts.
- Editors/admins can publish posts and sessions.
- Agents can create drafts or update source metadata only through review-first
  flows.
- Public sessions should be open by default.
- Sessions can be marked `authenticated` when the full detail graph or source
  links should require login.
- Public users can see published public session basics and selected public
  source links.
- Authenticated users can see the fuller relationship graph for sessions whose
  visibility allows it.
- Member/private session behavior can wait until there is a real entitlement
  model.

Initial posture should be as open as possible for public and authenticated
learning. Do not design a broader entitlement layer in the first implementation.

## Non-Goals

- No `ContentPacket` collection in the first version.
- No replacing Prism Memory as the transcript/source store.
- No automatic public publishing from generated content.
- No full course platform.
- No dedicated social scheduler.
- No storing draft social artifacts as Portal posts by default.
- No complex clip rendering pipeline in Payload at first.
- No entitlement system in the first version.

## When To Add A New Collection

Only add a new collection if a production concept needs its own lifecycle.

Possible future collections:

- `contentProposals`: generated drafts awaiting review across posts/wiki/media.
- `mediaOutputs`: rendered clips, Remotion previews, shorts, and platform
  variants.
- `practicePatterns`: if durable patterns become more structured than wiki
  pages.

Do not add these until fields on sessions/posts/threads are no longer enough.

## Sorting And Discovery

Start with deterministic sorting from existing fields:

- Sessions list: upcoming sessions ascending by `startsAt`; past sessions
  descending by `startsAt`.
- Session detail posts: group by `contentType`, then sort by `publishedAt`
  descending.
- Series/thread page: sessions chronological for narrative arcs, with a latest
  activity sort option later if needed.
- Profile page: recent sessions first, then derived posts if useful.
- Wiki candidates: show candidate topics from the source session before any
  generated wiki relationships exist.

Manual ordering should wait until there is evidence the automatic ordering is not
enough.

## Open Questions

- Should host/speaker profile fields be named `hostProfiles` and
  `speakerProfiles`, or should the UI use `hosts` and `guests` while mapping to
  explicit CMS fields?
- Should published social links live on the source session, derived post, or both
  when a social post promotes a specific derived post?
- Should wiki candidate topics live only on sessions at first, with post-level
  candidates added later only if needed?
- For `public` sessions, should anonymous users see related profiles/projects by
  default, or should those deeper graph sections prompt login?

## First Implementation Slice

Start with the smallest useful slice:

1. Add `fireside` to `events.sessionType`.
2. Add source fields to sessions: recording, transcript/source artifact, source
   status, themes, role/practice focus, optional host/speaker profiles, and wiki
   candidate topics.
3. Add `sourceSession`, `parentThread`, `contentType`, and `wikiCandidate` to
   posts.
4. Add linked published social URLs to sessions first.
5. Build a session detail page as the content packet hub.
6. Update the sessions list to show Fireside styling and source status.
7. Add source context to post detail pages.

This keeps the model close to current Portal primitives while making Firesides a
real source format.
