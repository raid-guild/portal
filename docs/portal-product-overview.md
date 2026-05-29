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
- `/members`: contributor discovery.
- `/members/[handle]`: public/member profile page with projects, sessions,
  posts, and badges.
- `/badges`: recognition catalog.
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

- `Badges`: durable recognition shown on profiles and member lists.
- `Notifications`: user-scoped inbox records, reminders, and digest delivery.
- `Daily Engagements`: lightweight check-ins and point ledger events.

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
- [Badges and props feature spec](./badges-and-props-feature-spec.md):
  recognition model.
- [Implementation checklist](./portal-implementation-checklist.md): execution
  tracker, not the primary product narrative.
