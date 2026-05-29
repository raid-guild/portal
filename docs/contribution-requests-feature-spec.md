# Contribution Requests Feature Spec

## Status

First slice implemented. Keep the initial product surface narrow: durable
request records, project/session display, and a simple request detail page.

## Product Intent

Contribution requests make explicit asks discoverable.

They answer:

- What help is needed?
- Who is asking?
- What project, session/event, post, thread, or profile is it connected to?
- What skills or roles would be useful?
- Is the request still open?
- Where should someone respond?

This feature should help members find a useful next step. It should not become a
task board, issue tracker, sprint workflow, or Discord replacement.

Use an open-source contribution model as the mental frame: visible asks, clear
context, and lightweight ways to raise a hand. Good requests should feel like
`good first issue`, `help wanted`, or `review requested`, not like assigned work.

## Why A Separate Primitive

Contribution requests are distinct from existing primitives:

- `ActivityItem` records that something happened. It is retrospective and
  factual, not the ask itself.
- `Comment` supports discussion under another record. It should not carry the
  request lifecycle.
- `Post` is editorial publishing. It can announce or summarize a request, but it
  should not be the operational record.
- `Project` can surface its own requests, but requests may also relate to
  sessions/events, posts, threads, profiles, or multiple contexts.
- Project stewards can manage requests connected to their project because they
  carry the local context for the ask.
- `Event` can produce session-specific follow-ups, host asks, artifact requests,
  or lightweight calls for help after a live gathering.

This collection is now used for independent status, visibility, API access, and
project/session-local display. Flat comments can attach directly to contribution
requests through the shared comments model. Request-specific notifications and a
dedicated board/list view remain deferred.

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

Implemented first-slice fields:

```txt
title: text, required
slug: text, unique
summary: textarea, required
body: textarea
requestStatus: open / in_discussion / filled / paused / archived
requestType: good_first_contribution / help_wanted / review / feedback / collaborator / resource
owner: relationship -> profiles, required
project: relationship -> projects, optional
relatedEvents: relationship -> events, many
relatedThreads: relationship -> threads, many
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

Avoid `bounty` as a first-slice request type unless there is a real approval,
budget, and fulfillment process. Until then, paid work should be represented by
the response link or handled outside the request lifecycle.

## Comments

Comments may attach to contribution requests when the request becomes a
discussion surface.

The request remains the durable object. Comments should capture replies,
clarifying questions, lightweight offers to help, and follow-up notes. Comments
should not carry status, ownership, skills, visibility, or canonical request
details.

Use flat comments only. Do not add comment replies, threaded discussions, or
assignment semantics. If discussion becomes complex, link out to Discord,
GitHub, or another tool through `responseURL`.

## Access Model

Recommended default:

- Public users can read published public requests.
- Authenticated users can read authenticated requests.
- Members can read member-only requests.
- Members and contributors can create draft requests.
- Agents, editors, and admins can publish and archive requests.
- Project stewards can publish and archive requests connected to their project.
- A dedicated owner-only draft workspace is deferred; first-slice draft review
  still leans on Payload admin and trusted agent/editor workflows.

Use the same visibility semantics as `projects` so project and request access do
not diverge.

## UI Surfaces

Start with project-local display:

- Project detail page shows open related contribution requests.
- Request cards show status, type, skills, owner, and response action.

Also support session/event-local display:

- Session detail page shows open follow-up requests related to that event.
- Past session pages can expose artifact asks, project follow-ups, review asks,
  or good first contribution paths that emerged from the session.

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

## Relationship To Notifications

The portal now has user-scoped notifications, notification preferences, an inbox,
email dispatch, and scheduled digest endpoints. Contribution requests should use
that infrastructure instead of inventing a separate alert system.

Potential notification moments:

- a request related to a project or session becomes published
- a request owner receives a new comment or offer to help
- a request is marked filled, paused, or archived
- a digest includes recently opened good first contribution requests

Do not add broad notification fanout in the first slice by default. A new
published request can be surfaced through project/session pages and activity
digests first. Direct notifications should wait until there is a clear recipient
model, such as owners, hosts, followed projects, interested users, or explicit
participants.

If direct notifications are added, extend the existing notifications model with:

```txt
notification type: contribution_request
relatedContributionRequest: relationship -> contributionRequests
notification preference: contributionRequests
```

Recommended dedupe keys:

```txt
contributionRequest:{id}:published:user:{id}
contributionRequest:{id}:comment:{commentID}:owner:{id}
contributionRequest:{id}:status:{status}:user:{id}
```

Agents may propose contribution requests from meeting notes or memory, but they
should not silently notify broad audiences. Agent-created requests may publish
when the agent workflow is explicitly trusted for that source; otherwise they
should start as drafts or reviewable proposals.

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

## Relationship To Sessions / Events

Sessions can create very natural contribution requests because they already
have shared context, attendees, hosts, notes, artifacts, and follow-up energy.

Examples:

- A workshop produces a request for someone to clean up notes.
- A demo produces a request for review feedback.
- A fireside produces a request for someone to extract field notes.
- An all-hands produces a request for a good first contribution on a project.
- A project session produces a request for design, dev, or research help.

The session/event should remain the historical source. The contribution request
should be the current ask that someone can respond to.

In UI, past session pages should show related open requests near notes,
artifacts, and related projects. Future session pages may show planned asks only
when they are intentional and useful.

Do not turn every session action item into a contribution request. Create one
only when the ask is discoverable, still actionable, and useful to someone who
was not in the room.

## First Implementation Slice

The first slice is intentionally narrow:

1. Add `contributionRequests` collection.
2. Add read access using portal visibility.
3. Add create/update access for contributors and editors.
4. Relate requests to owner profile, profile skills, optional project, and
   optional session/event.
5. Show open requests on project detail pages.
6. Show open requests on session/event detail pages.
7. Add a simple request detail page at `/requests/[slug]`.
8. Add e2e coverage for request creation, project display, session/event
   display, and detail rendering.
9. Add friendly create/edit routes for contribution requests.

Defer the global board and direct request notifications until there are enough
real requests and enough recipient intent to justify them.

## Open Questions

- Should the first route be `/requests`, `/contribute`, or project-local only?
- Should member-owned drafts get a dedicated "my drafts" workspace, or should
  draft review stay in Payload admin for now?
- Should response happen in comments, Discord, GitHub, or an external link?
- Do paid bounties need separate approval, budget, and completion semantics?
- Should requests be created manually first, or generated from meeting notes as
  draft proposals through the portal memory publisher workflow?
- Should session hosts get a shortcut to create follow-up requests from a past
  session page?
- Which request events deserve direct notifications versus inclusion in activity
  or weekly digests?
- Do users need a dedicated contribution request notification preference, or
  should this start inside activity/weekly digests?
