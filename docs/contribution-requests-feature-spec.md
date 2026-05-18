# Contribution Requests Feature Spec

## Status

Future feature module. Do not implement in the MVP until there is clear product
pressure for a cross-portal help-wanted surface with its own lifecycle.

## Product Intent

Contribution requests make explicit asks discoverable.

They answer:

- What help is needed?
- Who is asking?
- What project, session, post, thread, or profile is it connected to?
- What skills or roles would be useful?
- Is the request still open?
- Where should someone respond?

This feature should help members find a useful next step. It should not become a
task board, issue tracker, sprint workflow, or Discord replacement.

## Why A Separate Primitive

Contribution requests are distinct from existing primitives:

- `ActivityItem` records that something happened. It is retrospective and
  factual, not the ask itself.
- `Comment` supports discussion under another record. It should not carry the
  request lifecycle.
- `Post` is editorial publishing. It can announce or summarize a request, but it
  should not be the operational record.
- `Project` can surface its own requests, but requests may also relate to
  events, posts, threads, profiles, or multiple contexts.

Add a collection only when contribution requests need independent status,
filtering, comments, review, API access, or a dedicated board/list view.

## Non-Goals

- No task assignments.
- No sprint state.
- No subtask trees.
- No acceptance workflow by default.
- No payout, escrow, or invoice logic unless a real bounty process exists.
- No automated matching that silently commits people to work.
- No replacing Discord conversation.

## Proposed Collection

Collection slug:

```txt
contributionRequests
```

Recommended fields:

```txt
title: text, required
slug: text, unique
summary: textarea, required
body: richText or textarea
status: open / in_discussion / filled / paused / archived
requestType: help / bounty / review / feedback / collaborator / resource
owner: relationship -> profiles, required
project: relationship -> projects, optional
relatedThreads: relationship -> threads, many
relatedEvents: relationship -> events, many
relatedPosts: relationship -> posts, many
relatedProfiles: relationship -> profiles, many
profileSkills: relationship -> profileSkills, many
visibility: public / authenticated / member / admin
responseURL: text, optional
publishedAt: date
```

Start without budget fields. If paid bounties become real, add a dedicated
bounty extension later rather than overloading every request with payment
semantics.

## Comments

Comments may attach to contribution requests when the request becomes a
discussion surface.

The request remains the durable object. Comments should capture replies,
clarifying questions, lightweight offers to help, and follow-up notes. Comments
should not carry status, ownership, skills, visibility, or canonical request
details.

## Access Model

Recommended default:

- Public users can read published public requests.
- Authenticated users can read authenticated requests.
- Members can read member-only requests.
- Contributors, agents, editors, and admins can create draft requests.
- Editors and admins can publish and archive requests.
- Owners can update their own draft or open requests if they retain contributor
  access.

Use the same visibility semantics as `projects` so project and request access do
not diverge.

## UI Surfaces

Start with project-local display:

- Project detail page shows open related contribution requests.
- Request cards show status, type, skills, owner, and response action.

Add a board only when enough records exist:

- `/contribute` or `/requests`
- filters by status, skill, type, project, and visibility
- sort by recently updated or newly opened

Avoid kanban columns. A list or compact card grid is enough.

## Lifecycle

Initial statuses:

```txt
open
in_discussion
filled
paused
archived
```

Status meaning:

- `open`: help is actively wanted.
- `in_discussion`: someone is discussing or scoping the request.
- `filled`: the request has a path forward or enough help.
- `paused`: the ask is temporarily not actionable.
- `archived`: the request is no longer relevant.

Do not add assignees or due dates in the first version. If a request needs an
external workflow, use `responseURL` to point to GitHub, Discord, CharmVerse, or
another tool.

## Relationship To Activity

Important lifecycle moments can create activity items:

- request opened
- request filled
- request paused or archived
- significant update posted

Activity items should remain short, dated, and factual. They should link back to
the contribution request rather than duplicating the ask.

## Relationship To Projects

Projects can own or display contribution requests, but projects should not store
a large embedded list of requests once requests need comments, status history, or
cross-portal discovery.

Project pages should answer:

- What is this project?
- Who is involved?
- What help is needed now?

Contribution requests should answer:

- What exactly is being asked?
- Who should respond?
- What context does the helper need?

## First Implementation Slice

If implemented, keep the first slice narrow:

1. Add `contributionRequests` collection.
2. Add read access using portal visibility.
3. Add create/update access for contributors and editors.
4. Relate requests to projects, profile skills, owner profile, and optional
   threads/events/posts/profiles.
5. Show open requests on project detail pages.
6. Add a simple request detail page.
7. Allow comments on request detail pages if comments can support this relation.
8. Add e2e coverage for visibility and project display.

Defer the global board until there are enough real requests to justify it.

## Open Questions

- Should the first route be `/requests`, `/contribute`, or project-local only?
- Should members be allowed to publish their own requests, or only draft them for
  editor review?
- Should response happen in comments, Discord, GitHub, or an external link?
- Do paid bounties need separate approval, budget, and completion semantics?
- Should requests be created manually first, or generated from meeting notes as
  draft proposals through the portal memory publisher workflow?
