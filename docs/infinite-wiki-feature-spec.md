# Infinite Wiki Feature Spec

## Status

Future knowledge module. Do not implement in the MVP until the portal has a real
content pipeline from interviews, memory artifacts, and reviewed source material.

This module should make community knowledge explorable without becoming a generic
AI content feed, a handbook dump, or an unreviewed auto-publishing system.

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

## Why A Separate Primitive

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

## Non-Goals

- No unbounded public auto-publishing.
- No replacing project pages, threads, posts, or daily briefs.
- No treating generated text as canonical without review.
- No task board, course platform, or generic resource library in the first
  version.
- No public inline wiki editing in the first version.
- No complex page merge, rename, or talk-page workflows in the first version.

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

## Permissions

Suggested first version:

- Public users can read published public pages.
- Members can read member-visible pages.
- Contributors can suggest possible topics or draft pages if product pressure
  exists.
- Editors/admins can generate, review, publish, archive, and refresh pages.
- Agents can create generated drafts only when using a dedicated agent account
  and review-first workflow.

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
