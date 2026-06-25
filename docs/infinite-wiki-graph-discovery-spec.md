# Infinite Wiki Graph Discovery Spec

## Status

Planning spec for the next Infinite Wiki slice.

The current Portal has `wikiPages`, public `/wiki` routes, and reviewed article
records. The next slice should make those records explorable through a tactile
topic graph and discovery tree, with Prism used for optimistic expansion.

This should extend the Infinite Wiki module. It should not replace `wikiPages`,
the Portal Graph member/skills module, or the review rules for published wiki
articles.

## Product Intent

The graph should help a member move from a broad theme into higher-fidelity
topics, articles, sources, and related research questions.

The experience should feel closer to exploring a living map than filling out a
CMS form:

- broad categories open into focused topics
- topics reveal children, siblings, related articles, and source links
- empty areas can be expanded with Prism
- generated topic nodes appear quickly and can be cleaned up later
- articles remain source-backed research records, not opinionated editorial
  posts

## Current Content Snapshot

As of June 24, 2026, the public Payload API returns 29 reviewed, published,
public `wikiPages`.

Useful initial clusters:

- AI agent workflows
- context and memory systems
- human judgment and AI work
- AI in education and assessment
- AI product strategy
- AI content and discovery

Known data quality gaps from the current records:

- some pages have no `sourceArtifacts`
- some pages have no `possibleTopics`
- a few reviewed pages have no `lastReviewedAt`

The graph should surface these as lightweight status/freshness signals instead
of hiding them.

## Why Add `wikiTopics`

The existing `wikiPages.relatedTopics` and `wikiPages.possibleTopics` arrays are
plain strings. They are useful for simple page display, but they are not enough
for graph discovery.

Add a `wikiTopics` collection when implementing graph discovery because topics
now need their own lifecycle:

- stable topic identity and slugs
- parent/child hierarchy
- sibling and lateral relationships
- aliases and normalized titles later
- optimistic Prism-generated suggestions
- per-topic steering prompts
- links to one or more wiki articles
- review, confidence, source, and freshness metadata

This is still a module-owned collection, not a core Portal primitive.

## Proposed Collection

Collection slug:

```txt
wikiTopics
```

Recommended fields:

```txt
title: text, required
slug: text, unique, required
summary: textarea
kind: category / topic / subtopic / possible
parentTopic: relationship -> wikiTopics
relatedTopics: relationship -> wikiTopics, many
canonicalPage: relationship -> wikiPages
relatedPages: relationship -> wikiPages, many
sourceArtifacts: array
sourceQueries: array
expansionPrompt: textarea
reviewStatus: seed / suggested / reviewed / needs_review / archived
confidence: low / medium / high
visibility: public / authenticated / member / admin
lastExpandedAt: date
lastReviewedAt: date
generatedAt: date
generatedBy: relationship -> users
sortOrder: number
```

Recommended admin grouping:

```ts
admin: {
  group: 'Modules',
}
```

Do not add a separate edge collection in the first slice. Use
`parentTopic` for hierarchy and `relatedTopics` for lateral graph links. Add
`wikiTopicEdges` later only if edge-level metadata becomes necessary.

## Initial Discovery Tree

Seed a small curated tree from the existing reviewed pages. The seed should set
the stage for exploration without pretending the taxonomy is complete.

Recommended roots:

```txt
AI Agent Workflows
Context And Memory Systems
Human Judgment And AI Work
AI In Education And Assessment
AI Product Strategy
AI Content And Discovery
```

Example first mapping:

```txt
AI Agent Workflows
  Agent-Oriented Developer Workflows
  Agent-Ready Command Surfaces
  Agent Role Orchestration
  Multi-Agent Memory
  Codex Computer Use
  Voice-First Agent Workbenches
  Voice-Controlled Agent Safety Patterns

Context And Memory Systems
  Context Systems
  Personal CRM
  Personal Context Portability
  Structured Community Memory
  Shared AI Context For Teams

Human Judgment And AI Work
  Human Judgment in AI-Assisted Software Delivery
  Human Architecture in AI-Assisted Engineering
  Human Curation After AI Expansion
  Human-In-The-Loop AI Workflows

AI In Education And Assessment
  Assessment After Proxy Collapse
  AI-Assisted Grading
  Human-Calibrated Assessment Workflows
  LLM-as-Judge Evaluation

AI Product Strategy
  Defensibility in AI Products
  Product Judgment After Execution Scarcity
  Economic Agency for AI Agents

AI Content And Discovery
  SEO and AI Search
  Human-Written Content As A Trust Signal
  AI-Assisted Facilitation
```

This tree should be treated as an editable starting point, not a rigid ontology.

## Graph Node Types

The client graph should normalize CMS records into these node types:

```txt
category: high-level curated grouping
topic: stable reviewed topic
subtopic: deeper reviewed topic
possible: generated or suggested topic not yet reviewed
article: wikiPages record
source: Prism artifact, session, paper, tool, or external reference
```

Useful link types:

```txt
contains: category/topic -> child topic
relates_to: topic -> topic
has_article: topic -> wikiPage
has_source: topic/wikiPage -> source
candidate_for: possible topic -> parent topic
```

## Interaction Model

Primary interactions:

- click a category: zoom into child topics
- click a topic: show children, siblings, articles, sources, and possible
  expansion actions
- click an article: open a side panel with summary, review state, freshness,
  source count, and a link to `/wiki/[slug]`
- click a source: open the source link when visible and safe
- zoom out: move to the parent topic or previous graph scope
- explore siblings: show other children of the same parent
- expand with Prism: generate candidate children, siblings, article ideas, or
  research queries

Selection should use a persistent side panel. Do not rely on hover-only
interactions.

## Optimistic Generation

Topic generation should be optimistic and tactile. Requiring an approval gate
for every generated topic would make discovery feel like an admin queue.

Allowed optimistic writes:

- create suggested `wikiTopics`
- add child topics below the active node
- add lateral `relatedTopics`
- attach source queries and generation metadata
- mark low-confidence suggestions visually
- allow editors/admins/agents to archive, merge, or clean up later

These optimistic records should use:

```txt
reviewStatus: suggested
kind: possible
confidence: low | medium
```

They can appear in the graph immediately with generated/suggested styling. They
should not appear as canonical reviewed topics until reviewed.

## Article Generation Boundary

Articles should stay research-based. A topic name alone is not enough to create
a publishable article.

Allowed article-generation behavior:

- generate article candidates from a topic
- run source search through Prism
- create `wikiPages` generated drafts when sources are sufficient
- save source artifacts, source queries, model, prompt version, and confidence
- show the draft to editors/admins/agents for review

Do not publish articles optimistically. Published wiki articles must remain
reviewed and source-backed.

Minimum article evidence policy:

```txt
- at least one Portal, Prism, session, post, thread, project, or activity source
- source references saved on the wiki page
- external papers, docs, tools, or articles when useful
- no article body generated from a topic label alone
```

If evidence is thin, Prism should return research questions and suggested
queries rather than a draft article.

## Steering Prompt

Each topic can optionally carry an `expansionPrompt`. If unset, use the module
default.

Recommended default:

```txt
Expand this topic for the RaidGuild Portal Infinite Wiki.

Prefer technical, researchable, source-backed topics. Avoid generic AI hype,
marketing angles, hot takes, personal opinions, and editorial positioning.

Suggested topics should be useful for builders, researchers, educators,
protocol designers, or community operators. Each suggestion should include why
it belongs in the tree, what evidence would be needed, and what sources Prism
should search.

Do not invent facts. If the current evidence is thin, propose research
questions instead of article claims.
```

## Prism Integration

Portal should use Prism hooks for generation and research. Prism should not
directly publish canonical articles.

The relevant Prism pattern lives in the Prism site service:

- hooks are on-demand entrypoints for workflow-backed requests
- `POST /agent/hooks/:key/trigger` accepts a JSON payload with
  `x-service-token: <PRISM_AGENT_SERVICE_TOKEN>`
- the hook creates a Prism request, stores the raw payload as
  `hook-payload.json`, and optionally auto-runs the configured workflow
- hook creation/editing is agent-first, while the Prism dashboard Hooks tab can
  view hooks, enable or disable them, copy trigger endpoints, and send manual
  test payloads

Useful Prism workflows/hooks:

```txt
wiki-topic-extract-from-artifact
wiki-topic-expand
wiki-topic-research
wiki-page-draft
wiki-page-refresh-check
```

Use Prism hooks for sensing and proposal generation when new artifacts arrive:

```txt
meeting artifact created
  -> Prism extracts topics
  -> Prism compares against Portal wikiTopics/wikiPages
  -> Prism writes or returns suggested topic proposals
  -> Portal displays suggestions in graph
```

Use direct Portal-to-Prism calls for intentional graph actions:

```txt
user clicks Expand with Prism
  -> Portal triggers the wiki-topic-expand Prism hook
  -> Prism creates a workflow-backed request and stores hook-payload.json
  -> Prism searches memory and artifacts
  -> Prism writes a structured proposal artifact
  -> Portal imports the proposal into suggested topics and draft research pages
```

### Prism Hook Setup

Create the initial hook from the Prism dashboard or agent API before enabling the
Portal graph action.

Portal environment:

```txt
PRISM_AGENT_API_BASE_URL=https://<prism-site-service>
PRISM_AGENT_SERVICE_TOKEN=<same token accepted by Prism /agent routes>
PRISM_WIKI_TOPIC_EXPAND_HOOK_KEY=wiki-topic-expand
```

`PRISM_WIKI_TOPIC_EXPAND_HOOK_KEY` is optional and defaults to
`wiki-topic-expand`.

Recommended hook:

```json
{
  "key": "wiki-topic-expand",
  "name": "Wiki Topic Expand",
  "description": "Expand a Portal wiki graph topic into source-backed child topics, siblings, article candidates, and research queries.",
  "enabled": true,
  "workflowKey": "wiki-topic-expand",
  "authMode": "service-token",
  "requestTemplate": {
    "titleTemplate": "Expand Portal wiki topic: {{topicTitle}}",
    "descriptionTemplate": "Expand a Portal Infinite Wiki topic from the hook payload. Preserve source grounding and write a structured proposal artifact.\n\nPayload:\n{{payload}}",
    "requestType": "content",
    "priority": "normal",
    "constraints": {
      "source": "portal-wiki-graph",
      "output": "wiki-topic-expansion-proposal"
    },
    "acceptanceCriteria": [
      "Read hook-payload.json before generating.",
      "Return source-backed topic proposals, article candidates, source queries, and warnings.",
      "Do not publish Portal wiki pages directly.",
      "Mark unsupported article ideas as research candidates, not claims."
    ]
  },
  "autoRun": {
    "enabled": true,
    "requestedSkills": []
  }
}
```

Recommended Portal trigger payload:

```ts
type WikiTopicExpandHookPayload = {
  portalURL: string
  requestedByUserID: number | string
  topicID: number | string
  topicTitle: string
  topicSlug: string
  topicKind: 'category' | 'topic' | 'subtopic' | 'possible'
  parentPath: { id: number | string; title: string; slug: string }[]
  siblingTopics: { id: number | string; title: string; slug: string }[]
  relatedArticles: { id: number | string; title: string; slug: string; status: string }[]
  sourceSessions: { id: number | string; title: string; startsAt?: string }[]
  sourceArtifacts: { label: string; url: string; artifactID?: string }[]
  sourceQueries: string[]
  steeringPrompt: string
  requestedModes: ('children' | 'siblings' | 'articles' | 'sources')[]
}
```

Portal should persist the returned Prism request number, hook run, or proposal
artifact URL on the generated `wikiTopics` / `wikiPages` source metadata when it
imports the result.

Portal import endpoint:

```txt
POST /api/wiki/topics/expansion/import
```

Request:

```json
{
  "focusTopicID": 123,
  "requestNumber": 456
}
```

The endpoint reads Prism request artifacts through
`/agent/change-board/requests/by-number/:requestNumber/artifacts`, finds
`wiki-topic-expansion-proposal.json`, and imports:

- `suggestedTopics` as suggested `wikiTopics`
- `articleCandidates` as draft `wikiPages`
- article candidates as possible topic nodes linked to their draft page
- request/artifact provenance into `sourceArtifacts`
- session IDs into `sourceSessions` when present

The endpoint does not publish wiki pages.

### Topic Map Artifacts

Prism topic-map artifacts should be treated as first-class wiki graph source
inputs. A session may already produce a compact topic map before Portal creates
or updates `wikiTopics`.

Concrete reference:

```txt
Portal event: /events/69
Topic map artifact:
https://prism-memory-production-002c.up.railway.app/artifacts/20260623_181623Z-prism-workflow-2c5e0487
```

That artifact shape is useful because it already separates:

- session-grounded outputs
- broad wiki candidates
- narrow blog/article candidates
- source strength
- research slots
- deferred or blocked topics

Recommended import flow:

```txt
event has topic map resource
  -> Portal imports/parses topic map artifact through POST /api/wiki/topic-map/import
  -> broad wiki candidates become suggested wikiTopics
  -> narrow article candidates become candidate wikiPages or possible topics
  -> research slots become sourceQueries
  -> deferred/blocked notes become warnings or low-confidence suggestions
  -> sourceSessions and sourceArtifacts preserve the event/artifact provenance
```

Do not publish articles directly from topic maps. Topic maps are routing and
research-planning artifacts. They are strong enough to create suggested graph
nodes and article candidates, not canonical wiki pages.

Suggested response shape:

```ts
type WikiTopicExpansionProposal = {
  focusTopic: string
  mode: 'children' | 'siblings' | 'parents' | 'articles' | 'sources'
  suggestedTopics: {
    title: string
    summary: string
    kind: 'category' | 'topic' | 'subtopic' | 'possible'
    relationship: 'child' | 'sibling' | 'related'
    confidence: 'low' | 'medium' | 'high'
    rationale: string
    sourceQueries: string[]
  }[]
  candidateArticles: {
    title: string
    researchQuestion: string
    whyItBelongs: string
    requiredSources: string[]
    confidence: 'low' | 'medium' | 'high'
  }[]
  sourceArtifacts: {
    label: string
    artifactID?: string
    sourceType: string
    url?: string
    observedAt?: string
  }[]
  warnings: string[]
}
```

## Access And Visibility

Public users can browse reviewed public topics and public reviewed articles.

Authenticated users can browse authenticated-visible topics. Member-visible
topics should only appear to members.

Suggested/generated topics may be visible in the graph if their visibility
allows it, but they must have clear visual treatment:

```txt
reviewed: canonical node
suggested: generated node
needs_review: pending editor cleanup
archived: hidden from normal graph browsing
```

Agents may create suggested topics and generated article drafts. Agents must not
publish articles or create admin-only topics.

## UI Guidance

Keep the graph readable:

- start scoped to one category or focus topic
- show only immediate children, siblings, articles, and sources by default
- avoid rendering the entire graph as the first view
- use visual treatment for suggested and low-confidence nodes
- show freshness and source-count indicators in the side panel
- provide cleanup actions for editors/admins/agents

Useful actions:

```txt
Expand children
Explore siblings
Find sources
Draft article
Archive suggestion
Mark reviewed
Open wiki page
```

## Implementation Plan

1. Add `wikiTopics` collection with hierarchy, relationships, review status,
   confidence, source metadata, and expansion prompt fields.
2. Seed initial root categories and topic/page mappings from the current 29
   public reviewed wiki pages.
3. Add `/wiki/explore` as the graph discovery route using
   `react-force-graph-2d`.
4. Build graph data from visible `wikiTopics`, related `wikiPages`, and source
   artifacts.
5. Add topic-map artifact import for session resources, starting with the Event
   69 artifact shape.
6. Add optimistic topic expansion against a stubbed/proposed Prism contract.
7. Add Prism-backed topic expansion writes as `suggested` topics.
8. Add article candidate research flow.
9. Add generated `wikiPages` draft creation only when source evidence is
   sufficient.
10. Add editor cleanup affordances and e2e coverage for visibility, optimistic
   generation, and article review boundaries.

## Non-Goals

- No graph database in the first slice.
- No public inline article editing.
- No automatic article publication.
- No treating suggested topics as endorsed RaidGuild knowledge.
- No replacing the existing Portal Graph member/skills module.
- No making generated wiki articles into opinionated essays or marketing posts.
