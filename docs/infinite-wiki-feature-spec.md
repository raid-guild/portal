# Infinite Wiki Feature Spec

## Status

Future knowledge module. Do not implement in the MVP until the portal has a real
content pipeline from interviews, memory artifacts, and reviewed source material.

This module should make community knowledge explorable without becoming a generic
AI content feed, a handbook dump, or an unreviewed auto-publishing system.

Infinite Wiki should be treated as a Portal module, not a core primitive. See
[Modules feature spec](./modules-feature-spec.md) for module registry, CMS
grouping, and dependency boundary rules.

## Product Intent

The infinite wiki turns real community memory into a growing, source-backed
knowledge graph.

It answers:

- What does RaidGuild know about this topic?
- Which interviews, sessions, projects, posts, and artifacts support that
  knowledge?
- What related topics can someone explore next?
- Which pages are canonical, generated drafts, or only possible future pages?
- When was this topic last refreshed from current community memory?

The experience should feel like clicking through a living wiki, but the
canonical record should still be reviewable and grounded in sources.

## User Value

The wiki should make the Portal more useful after the immediate brief expires.

Primary user jobs:

- A new contributor can learn recurring RaidGuild concepts without reading a
  pile of Discord threads.
- A member can find prior context before joining a session or project.
- An editor can turn interviews, session artifacts, and memory summaries into a
  durable reference.
- An agent can propose source-backed pages without silently publishing invented
  content.

The first release should optimize for discovery and review, not authoring
complexity.

## Core Idea

A topic page can be generated from Prism Memory search results, saved in Payload,
reviewed, and reused as a future reference.

Recommended flow:

```txt
Member interview / source artifact
  -> Prism Memory ingestion and knowledge search
  -> generated wiki draft
  -> Payload review and publication
  -> related topic links and possible pages
```

The portal should distinguish between:

- `published page`: reviewed canonical wiki page.
- `generated draft`: saved page generated from sources, not yet canonical.
- `possible page`: topic mention or link target that has not been generated.
- `source link`: Prism artifact, source document, post, project, session, or
  external reference.

## Why A Separate Module Collection

Wiki pages should be their own collection rather than a post type.

Posts are narrative or editorial:

- blog posts
- interviews
- recaps
- guides
- announcements
- authored reflections

Wiki pages are evergreen topic nodes:

- continuously updated
- heavily cross-linked
- source-backed
- generated or refreshed from Prism Memory
- reviewed for canonical status
- connected to possible pages and backlinks

`Post` can link to a wiki page and can be used as a source, but it should not own
the wiki lifecycle.

The collection should belong to the Payload admin `Modules` group. Core Portal
routes must not require `wikiPages` to exist, and disabling or deferring Infinite
Wiki should not break briefs, projects, profiles, events, posts, notifications,
or member account flows.

## Non-Goals

- No unbounded public auto-publishing.
- No replacing project pages, threads, posts, or daily briefs.
- No treating generated text as canonical without review.
- No task board, course platform, or generic resource library in the first
  version.
- No public inline wiki editing in the first version.
- No complex page merge, rename, or talk-page workflows in the first version.
- No scraping Discord, websites, or private docs directly from wiki page
  generation. Source material must come from approved memory/artifact inputs.
- No treating possible pages as a promise that a page exists or is endorsed.

## First-Version Product Scope

### Ship First

- `wikiPages` collection with reviewed publishing lifecycle.
- Public `/wiki` index of published pages.
- Public/authenticated `/wiki/[slug]` page detail route.
- Admin/editor page creation and publication through Payload admin.
- Wiki-owned relationships to portal primitives: posts, projects, threads,
  events, profiles, and activity items.
- Source audit fields for Prism artifacts, knowledge docs, and source queries.
- Possible topics stored on the page and rendered as non-canonical links.
- Manual generated draft creation through admin/agent workflow before any public
  generation UX.

### Defer

- Member-facing "generate this page" button.
- Public inline edits.
- Topic aliases and redirects unless they become necessary.
- Backlink graph visualization.
- Adding wiki relationship fields directly to events/sessions, projects, posts,
  or threads.
- Merge/rename workflows.
- Automated refresh scheduling.
- Comments or talk pages.
- Search ranking beyond existing Payload/search surfaces.

## Information Architecture

Recommended routes:

```txt
/wiki
/wiki/[slug]
```

Admin/editor-only generation and review can start inside Payload admin or a
protected route later:

```txt
/admin/collections/wikiPages
/wiki/generate
```

Do not add wiki links to the primary navigation until there are enough reviewed
pages to make the section useful. Early entry points should come through the
module surface and search:

- `/modules` listing for Infinite Wiki while it is experimental
- a dashboard module card or "Explore modules" link
- search results

Contextual links from projects, sessions, posts, or briefs can be added later
after the wiki proves useful and the relationship direction is clear.

## Page Experience

### Wiki Index

The index should help users scan reviewed knowledge, not browse generated noise.

Recommended sections:

- recently updated published pages
- topic/category filters, only if useful
- pages related to active projects or recent sessions
- empty-state copy for editors when there are no published pages

### Wiki Page

A page should make status and source grounding visible.

Recommended layout:

- title
- short summary
- status treatment when not published
- last reviewed/refreshed date
- body
- related pages
- related portal primitives
- source list with artifact/doc labels
- possible topics

Generated or needs-review pages should never look identical to reviewed
published pages for users who can see them.

## Proposed Collection

Collection slug:

```txt
wikiPages
```

Recommended fields:

```txt
title: text, required
slug: text, unique, required
summary: textarea, required
body: richText, required
topics: array or relationship -> wikiTopics
status: draft / generated / needs_review / published / needs_refresh / archived
visibility: public / authenticated / member / admin
relatedPages: relationship -> wikiPages, many
possibleTopics: array
relatedPosts: relationship -> posts, many
relatedProjects: relationship -> projects, many
relatedThreads: relationship -> threads, many
relatedEvents: relationship -> events, many
relatedProfiles: relationship -> profiles, many
sourceArtifacts: array
sourceKnowledgeDocs: array
sourceQueries: array
confidence: low / medium / high
generatedBy: text or relationship -> users
generationModel: text
generationPromptVersion: text
lastGeneratedAt: date
lastReviewedAt: date
reviewedBy: relationship -> users
publishedAt: date
```

Recommended admin grouping:

```ts
admin: {
  group: 'Modules',
}
```

Recommended admin columns:

```txt
title
status
visibility
confidence
lastReviewedAt
updatedAt
```

Recommended indexes:

```txt
slug
status
visibility
publishedAt
lastReviewedAt
lastGeneratedAt
```

Recommended status meanings:

- `draft`: manually drafted and not ready for review.
- `generated`: machine-generated from sources and not reviewed.
- `needs_review`: ready for editor/admin review.
- `published`: canonical reviewed page visible according to `visibility`.
- `needs_refresh`: published page has stale or newly available sources.
- `archived`: hidden from normal browsing but retained for audit/history.

Recommended confidence meanings:

- `low`: source set is thin, contradictory, or mostly inferred.
- `medium`: sources support the page but require careful review.
- `high`: sources are strong enough for review; still not auto-published.

Source fields should store enough Prism context to audit the generated page
later:

```txt
sourceArtifacts:
  artifactID
  artifactURL
  title
  type
  source
  capturedAt

sourceKnowledgeDocs:
  slug
  docURL
  sourceURL
  title
  tags

sourceQueries:
  query
  filters
  resultCount
  searchedAt
```

## Optional Supporting Collection

Start without a separate topics collection if simple strings are enough. Add
`wikiTopics` only when topic aliases, redirects, descriptions, moderation, or
analytics become important.

Possible `wikiTopics` fields:

```txt
title: text, required
slug: text, unique, required
aliases: array
description: textarea
status: suggested / active / blocked / merged
canonicalPage: relationship -> wikiPages
relatedTopics: relationship -> wikiTopics, many
```

## Prism Memory Integration

Payload should remain the canonical presentation and review layer. Prism Memory
should remain the retrieval and evidence layer.

Useful Prism read endpoints:

```txt
GET /knowledge/search?q=...&kind=...&tag=...&entity=...&limit=...
GET /knowledge/docs/{slug}
GET /memory/latest
GET /digests/date/{yyyy-mm-dd}
GET /api/artifacts?category=...&type=...&source=...&status=...&limit=...
GET /api/artifacts/{artifact-id}
```

Generation should always record:

- the search query
- filters used
- top result slugs or artifact IDs
- generated timestamp
- model or prompt version
- confidence

## Link Behavior

Wiki rendering should support differentiated internal links:

```txt
published: normal internal link
generated draft: internal link with draft treatment
possible: subtle ghost/dashed link or "generate page" affordance
source: external/source treatment
```

When a user clicks a possible page:

1. Check whether a `wikiPage` already exists for the slug or alias.
2. If it exists and is visible to the user, open it.
3. If it does not exist, start a generation preview flow.
4. Save the generated result as `generated` or `needs_review`.
5. Only publish after admin/editor review.

## Generation And Review Flow

Recommended first version:

1. Admin/editor enters a topic or clicks a possible topic.
2. Portal queries Prism Memory.
3. Agent generates a wiki draft with citations/source links.
4. Payload saves a `wikiPages` draft.
5. Admin/editor reviews the page in Payload admin.
6. Admin/editor publishes the page.
7. Public users see only published pages.

Later versions can allow members to request generation or suggest edits, but
canonical publication should stay reviewed.

## Generation Contract

Generation should return a structured proposal instead of writing directly to
published content.

Recommended proposal shape:

```txt
title
slug
summary
body
possibleTopics
relatedPages
sourceArtifacts
sourceKnowledgeDocs
sourceQueries
confidence
warnings
```

Generation requirements:

- cite or link every source used
- preserve uncertainty instead of smoothing it away
- avoid invented participants, dates, commitments, or outcomes
- prefer shorter pages with stronger sources over long synthesized essays
- mark low-confidence sections for review instead of burying caveats
- create `generated` or `needs_review`, never `published`

## Source Policy

Allowed first-version sources:

- Prism Memory knowledge docs
- Prism artifacts from approved interview/session/content pipelines
- existing portal posts
- existing projects
- existing events/sessions
- existing threads
- existing activity items
- existing profiles, when profile visibility allows it

Source handling rules:

- Store source references, not large copied source bodies.
- Quote sparingly and only when a quote is needed.
- Do not expose private/member-only source details on public wiki pages.
- Generated public pages must not leak member-only project/session/profile
  content.
- If source visibility is mixed, the page visibility should be at least as
  restrictive as the most sensitive material used.

## Refresh Flow

Wiki pages should be refreshable without overwriting reviewed content silently.

Possible refresh statuses:

```txt
published
needs_refresh
refresh_generated
refresh_rejected
```

Refresh process:

1. Re-run the saved `sourceQueries` or a new topic search.
2. Generate a proposed update.
3. Store the proposal as a draft version or content proposal.
4. Show what changed and which new sources were added.
5. Publish only after review.

## Relationship To Other Portal Primitives

- `Profile`: member expertise and interview source.
- `Event`: session or interview where source material was captured.
- `Project`: real work that grounds field experience.
- `Thread`: persistent line of thought that may support a page.
- `Post`: narrative content that can source or explain a topic.
- `ActivityItem`: factual signal that a source event or update happened.
- `Brief`: daily/weekly pointer to new or refreshed wiki pages.

Wiki pages should link out to these primitives, not replace them.

Recommended relationship behavior:

- First version: `wikiPages` can reference related projects, events/sessions,
  posts, threads, profiles, and activity items from the wiki page side.
- Do not add `relatedWikiPages` fields to events/sessions, projects, posts, or
  threads in the first version.
- Later: projects or sessions can show related wiki pages as background context
  if members actually use the wiki for prep or follow-up.
- Later: posts can cite or explain a wiki page when editorial workflows need it.
- A brief can highlight newly published or refreshed pages.
- Activity items can record that a wiki page was generated, reviewed, or
  published.

## Permissions

Suggested first version:

- Public users can read published public pages.
- Members can read member-visible pages.
- Contributors can suggest possible topics or draft pages if product pressure
  exists.
- Editors/admins can generate, review, publish, archive, and refresh pages.
- Agents can create generated drafts only when using a dedicated agent account
  and review-first workflow.

Recommended first-version access:

```txt
create: editor/admin/agent
read:
  public: published + public
  authenticated: published + public/authenticated
  member: published + public/authenticated/member
  editor/admin: all statuses
update: editor/admin
delete/archive: admin
agent create: generated/needs_review only
```

Generated drafts can be visible in Payload admin to editors/admins. Member
visibility for generated drafts should wait until there is a real review queue
and clear UI treatment.

## Notifications And Activity

Do not create per-topic notifications in the first version.

Useful first notifications later:

- editor/admin notification when an agent creates a `needs_review` wiki page
- activity item when a wiki page is published or refreshed
- weekly digest mention for newly published wiki pages

This should use the existing `notifications` and digest infrastructure rather
than adding wiki-specific delivery behavior.

## Success Metrics

Early qualitative signals:

- people use wiki pages as context before sessions
- related project/session pages get better background links
- editors can review generated pages without chasing source provenance
- generated pages are short, grounded, and easy to reject or improve

Operational metrics:

- generated drafts created
- drafts reviewed
- pages published
- pages marked needs refresh
- source artifacts per page
- pages with no source links, which should be treated as a quality problem

## First Implementation Checklist

- [ ] Add `wikiPages` collection with source audit fields.
- [ ] Add access rules for published visibility and editor/admin review.
- [ ] Add admin columns for status, visibility, confidence, and review dates.
- [ ] Add `/wiki` index for published pages.
- [ ] Add `/wiki/[slug]` detail route with source and related-context sections.
- [ ] Keep first-version relationships owned by `wikiPages`; do not add wiki
      relationship fields directly to projects, events/sessions, posts, or
      threads.
- [ ] Add a protected generation endpoint or admin action that creates generated
      drafts.
- [ ] Record source queries and source references on every generated page.
- [ ] Add e2e coverage for visibility, review status, and source rendering.
- [ ] Add product docs before exposing member-facing generation.

## Open Questions

- Should generated drafts be visible to members before review?
- Should topic aliases and redirects require a `wikiTopics` collection from day
  one?
- Should refresh proposals be stored as Payload versions, a separate
  `contentProposals` collection, or draft fields on `wikiPages`?
- How much source text should be quoted versus summarized?
- Should wiki pages have comments, or should discussion happen on related
  threads?
- What confidence threshold is required before a page can move from generated to
  review-ready?
- Should wiki page publication create an `ActivityItem` automatically?
- Should `/wiki` be public at launch or remain authenticated until there are
  enough reviewed pages?

## Implementation Notes

Start small:

1. Add `wikiPages` as a feature module.
2. Add manual admin-created pages and relationships.
3. Add possible-topic display from saved page metadata.
4. Add Prism-backed generation as an admin action.
5. Add refresh proposals after the first pages prove useful.

Do not build a full dedicated wiki platform until the portal has enough real
wiki traffic to justify inline editing, diffs, redirects, merge workflows, and
backlink management.
