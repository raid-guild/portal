# RaidGuild Portal Product Overview

## Purpose

The RaidGuild Portal is a live, CMS-backed surface for understanding what is
happening in the community and finding a useful next step.

It should help a visitor or member answer:

- What is active right now?
- Which sessions are coming up?
- What projects, threads, and activity are moving?
- Who is involved?
- What should I do next?

The Portal should make real community activity visible. It should not become a
project management system, Discord replacement, course platform, handbook dump,
or generic AI content feed.

## Primary Audiences

- Public visitors who need a credible snapshot of RaidGuild activity.
- New contributors who need onboarding, context, and a next action.
- Members who need quick visibility into sessions, projects, activity, and
  recognition.
- Editors and agents who publish factual updates from meetings, Discord
  summaries, repo activity, and session artifacts.

## Core User Surfaces

- `/`: public portal snapshot with recent brief, sessions, projects, and join
  path.
- `/dashboard`: authenticated brief-first dashboard with current activity and
  engagement actions.
- `/projects`: active and archived project discovery.
- `/projects/[slug]`: project context, state, contributors, threads, sessions,
  and contribution paths.
- `/events`: upcoming and past sessions.
- `/events/[id]`: session details, join/calendar actions, artifacts, and related
  context.
- `/cohorts/[slug]`: public program hub with theme, expectations, related work,
  Event-backed schedule, and authenticated Profile commitment.
- `/requests/[slug]`: focused contribution request detail page for a clear ask
  connected to a project, session, thread, post, or profile.
- `/members`: contributor discovery.
- `/members/[handle]`: public/member profile page with projects, sessions,
  posts, and badges.
- `/badges`: recognition catalog.
- `/modules`: optional and experimental Portal modules.
- `/inbox`: personal notifications and digest updates.
- `/me`: private profile, account, notification preferences, and personal portal
  jump links.

## Core Product Primitives

- `Brief`: the current snapshot of what is happening overall.
- `Project`: a focused collaboration surface for something being built.
- `Thread`: a persistent line of thought or work that evolves over time.
- `Activity Item`: a factual signal that something happened.
- `Event`: a scheduled session or calendar anchor.
- `Profile`: a person or contributor identity.

Feature modules should stay separate when they have their own lifecycle or
workflow:

- `Modules`: registry and boundary for optional product capabilities.
- `Badges`: durable recognition shown on profiles and member lists.
- `Notifications`: user-scoped inbox records, reminders, and digest delivery.
- `Daily Engagements`: lightweight check-ins and point ledger events.
- `Infinite Wiki`: reviewed, source-backed knowledge pages generated from
  community memory and portal records.
- `Contribution Requests`: lightweight asks for help surfaced from projects and
  sessions without becoming tasks or assignments.

Projects can have profile-based stewards. Stewards are responsible for keeping a
project page accurate, attaching relevant context, and managing project-scoped
requests/activity. Contributors remain the people visibly involved or credited;
stewardship is accountability for the presentation surface, not assignment
workflow.

Project steward management should stay focused on the presentation layer:
summary, public status, contributors, related sessions/threads/projects,
resources, links, and project-scoped requests. It should not introduce tasks,
assignees, sprint state, or a project-management workflow.

## Product Principles

- Real over polished.
- Recent over comprehensive.
- Signal over content volume.
- Human notes over marketing copy.
- Clear next action over passive browsing.
- Narrow community visibility over broad platform behavior.
- Structured records over inferred commitments.

## Current Notification Model

Notifications support portal activity without replacing Discord or newsletter
tools.

- Collection hooks create notification intent for published sessions, published
  briefs, and badge awards.
- External task runners call protected endpoints for reminders and digests.
- The email dispatcher sends pending email notifications through Payload email
  and SendGrid when configured.
- Users manage notification preferences from `/me#notifications`.
- Users read and archive notifications from `/inbox`.

Notification operations are documented in
[Notifications feature spec](./notifications-feature-spec.md).

The public home uses the Cohort module as its primary program-discovery surface:
it shows the current, next, or interest-gathering Cohort and derives previous
session themes from public Event records. Interest and topic suggestions reuse
the general inquiry flow until a distinct operational lifecycle justifies a new
model.

## Product Documentation Map

- [Portal direction](./portal-direction.md): long-running product direction and
  modeling decisions.
- [Cohort project spike MVP spec](./cohort-spike-mvp-spec.md): first focused MVP
  scope and anti-scope.
- [Sessions MVP spec](./sessions-mvp-spec.md): session creation, visibility, and
  artifacts.
- [Roles and capabilities](./roles-and-capabilities.md): permission model.
- [Notifications feature spec](./notifications-feature-spec.md): inbox,
  reminders, digests, and email delivery.
- [Modules feature spec](./modules-feature-spec.md): experimental module
  registry, CMS grouping, and dependency boundaries.
- [Contribution requests feature spec](./contribution-requests-feature-spec.md):
  request records, project/session display, and future board/comment options.
- [Badges and props feature spec](./badges-and-props-feature-spec.md):
  recognition model.
- [Infinite Wiki feature spec](./infinite-wiki-feature-spec.md):
  source-backed knowledge graph and review workflow.
- [Implementation checklist](./portal-implementation-checklist.md): execution
  tracker, not the primary product narrative.
