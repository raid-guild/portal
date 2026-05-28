# Badges And Props Feature Spec

## Status

Future recognition module. Do not implement in the MVP until profile discovery
needs durable credentials or lightweight peer/admin recognition.

This module should add a little flex and feedback to profiles without turning the
portal into a game, ranking system, task board, or social feed.

## Product Intent

Badges and props answer different questions:

- What has this person earned, completed, or been officially recognized for?
- How has the community recently recognized this person?
- Can members filter profiles by meaningful achievements without confusing them
  with permission roles?
- Can admins or agents surface real recognition from sessions, Discord, meetings,
  or projects?

Badges should feel durable and collectible. Props should feel lightweight,
repeatable, and friendly.

## Vocabulary

- `Badge`: durable recognition, usually admin-issued, shown as profile flex.
- `ProfileBadge`: an award of a badge to a profile.
- `Prop`: a stackable recognition event. The first version is a `1up` using a
  mushroom emoji.
- `PointEvent`: numeric ledger entry. Related, but not the same as badges or
  props.

Keep auth roles, profile roles, badges, props, and points separate.

## Non-Goals

- No permission changes from badges or props.
- No all-time leaderboard in the first version.
- No economy, token, escrow, payout, or redemption logic.
- No automatic public recognition from agents without review.
- No broad reaction system with many emoji in the first version.
- No replacing Discord conversation or meeting notes.

## Badges

Badges are first-class records so admins can edit names, descriptions, visuals,
and display treatment over time.

Collection slug:

```txt
badges
```

Recommended fields:

```txt
title: text, required
slug: text, unique
description: textarea
category: cohort / contribution / craft / community / achievement
artwork: upload -> media
fallbackIcon: select, optional
accentColor: text, optional
backgroundColor: text, optional
displayStyle: standard / compact / featured
isRetired: checkbox
sortOrder: number
visibility: public / member
```

Examples:

- Cohort Grad
- Portal Shipper
- Session Speaker
- Mentor
- Community Steward

Badges should be filterable on member/profile discovery surfaces when enough
records exist.

## Profile Badges

Award records should be separate from badge definitions so the portal can show
when, why, and by whom a badge was awarded.

Collection slug:

```txt
profileBadges
```

Recommended fields:

```txt
profile: relationship -> profiles, required
badge: relationship -> badges, required
awardedAt: date, required
awardedByUser: relationship -> users
source: admin / cohort / import / system
relatedProject: relationship -> projects
relatedEvent: relationship -> events
relatedPost: relationship -> posts
note: textarea
featured: checkbox
visibility: public / member / private
```

Default rule:

- Admins and agents can award badges to one or more profiles at a time.
- Editors can manage and correct badge awards through Payload admin.
- Featured badges are managed by editors/admins in the first slice.
- Badges do not grant auth roles.

Uniqueness can be handled by policy first. If duplicate awards become a problem,
add a uniqueness constraint for `profile + badge`, except for badges that are
intentionally repeatable by context.

## Props

Props are lightweight, stackable recognition. The first version should only use
one kind:

```txt
kind: 1up
display: mushroom emoji
```

The emoji is display treatment. The stable data value should be `1up` so future
emoji or category changes do not require migrating old prop records.

Collection slug:

```txt
props
```

Recommended fields:

```txt
recipientProfile: relationship -> profiles, required
issuerProfile: relationship -> profiles
issuedByUser: relationship -> users
issuerType: peer / admin / agent / system
kind: 1up
amount: number, default 1
message: textarea
relatedEvent: relationship -> events
relatedProject: relationship -> projects
relatedThread: relationship -> threads
evidenceLabel: text
evidenceURL: text
evidenceOccurredAt: date
status: pending_review / active / hidden / rejected
issuedAt: date, required
reviewedByUser: relationship -> users
reviewedAt: date
visibility: public / member / private
```

Display examples:

```txt
🍄 35
5 props this month
Jane gave Max 🍄
Admin gave Session 4 attendees 🍄
```

Use aggregate counts for profile summary cards. Keep individual prop records for
audit, source context, moderation, and future filtering.

## Admin Props

Admins may issue props as incentives or recognition, including bulk recognition
for session attendance.

Start without a separate campaign collection. A batch can be represented by
individual `props` records that share the same `relatedEvent`, `message`,
`issuedByUser`, and timestamp.

Add a `propCampaigns` collection only if admins need to audit, rerun, reverse, or
display a batch as one object.

Possible future collection:

```txt
propCampaigns
- title
- reason
- kind: 1up
- amount
- relatedEvent
- recipients
- issuedByUser
- issuedAt
```

## Peer Props

Members may eventually give each other 1up props.

Recommended default:

- Signed-in members can give props.
- The recipient must be a visible profile.
- Props become active immediately only if moderation risk is acceptable.
- Otherwise, props enter `pending_review`.
- Add simple rate limits before broad peer issuance.

Peer props should not become private messaging. Keep messages optional and short.

## Agent Props

Agents may propose props from Discord, meeting notes, project updates, or other
source-grounded community memory.

Agent-issued props should be review-first:

- `issuerType = agent`
- `issuedByUser` is the agent user account
- `issuerProfile` can represent the human source when clear
- `evidenceLabel`, `evidenceURL`, and `evidenceOccurredAt` should be populated
- `status = pending_review` by default

Agents must not silently publish public props from one person to another. This
avoids misreading tone, sarcasm, attribution, or consent.

## Relationship To Points

Points are quantitative. Badges and props are qualitative.

Use `pointEvents` for numeric accounting. Use badges for durable recognition.
Use props for lightweight recognition signals.

Possible future links:

- A prop may optionally create a small point event.
- A points threshold may create a badge review suggestion.
- A badge award may create a point event.

Do not make any of these automatic in the first version.

## UI Surfaces

Profile header:

- featured badges
- total 1up props
- monthly 1up props

Profile detail:

- badge shelf
- recent props
- optional source context for admin/agent props

Member list:

- filter by badge
- optionally sort or filter by recent 1up count after the signal is useful

Badge catalog:

- `/badges` lists visible badge definitions and recipient counts
- link to `/badges` from `/members`
- do not add badge catalog cards to the brief/dashboard until recognition becomes
  part of the daily return loop

Admin:

- manage badge definitions
- award badges to profiles
- issue 1up props to one or many profiles
- review agent-proposed props

Avoid global leaderboards in the first version. If needed later, start with a
limited "recent recognition" view rather than all-time rankings.

## Access Model

Recommended default:

- Public users can read public badges and public active profile badges.
- Public users can read public aggregate prop counts.
- Members can read member-visible badge and prop details.
- Admins and editors can create and update badges.
- Admins and agents can award badges to multiple profiles in one award record.
- Editors can review and correct badge awards.
- Admins can issue admin props.
- Members may create peer props only after rate limits and moderation rules are
  in place.
- Agents can create draft or pending-review props only.

## First Badge Slice

The first implemented slice is badges only. Props stay designed but deferred.

1. Add `badges` and `profileBadges` collections.
2. Seed a small set of badge definitions.
3. Allow admins/agents to award badges to one or more profiles.
4. Add `/badges` as a badge catalog linked from `/members`.
5. Show awarded badges on member cards and profile pages.
6. Add member list filtering by badge.
7. Add e2e coverage for badge display, badge filtering, badge catalog counts,
   and agent-issued multi-profile badge awards.

Defer all prop work, including admin 1up issuance, peer props, agent-proposed
props, prop campaigns, aggregate 1up counts, and leaderboard-like views until
the badge display behavior is useful.

## Implementation Plan

Build this as a feature module that relates to `profiles`, not as a permission
or points-system extension. The first implementation should create durable
recognition records, show them on profile surfaces, and leave automation and
peer issuance behind explicit review gates.

### 1. Data Model And Access

Add collection configs for the badge slice:

- `badges`: reusable badge definitions managed by editors and admins.
- `profileBadges`: awarded badge instances related to one or more profiles.

Future prop collection:

- `props`: individual 1up recognition records related to profiles and optional
  source context. Deferred.

Access defaults:

- `badges`: public/member read by visibility, editor/admin create and update,
  admin delete.
- `profileBadges`: public/member read by visibility, editor/admin create and
  update, admin delete. Agents can create badge awards but cannot manage badge
  definitions.
- `props`: public/member aggregate-safe read by visibility and `active` status,
  admin create and update, admin delete or hide. Deferred.

Keep field-level admin-only access on review fields such as `reviewedByUser`,
`reviewedAt`, and hidden/rejected notes if those are added. Do not let badges,
profile badges, or props grant auth roles.

### 2. Hooks And Validation

Add hooks to keep badge authoring consistent:

- Default `awardedAt` timestamps.
- Default `awardedByUser` from `req.user`.
- Default award `source` from the issuing role when it is not provided.

Avoid uniqueness constraints at first unless duplicate awards become a real
problem. If needed later, add a targeted uniqueness policy for
`profile + badge`.

Future prop hooks should default `issuedAt`, `issuedByUser`, and
`reviewedByUser`, force admin-issued props to `active`, validate evidence URLs
through the existing safe URL utility, and keep prop `amount` positive with
`kind` fixed to `1up`.

### 3. Seeds

Seed only a small stable starter set:

- `cohort-grad`
- `portal-shipper`
- `session-speaker`
- `mentor`
- `community-steward`

Seed definitions, not broad awards. Add deterministic demo awards only inside
tests unless product surfaces need standing examples.

### 4. Profile Surfaces

Extend `/members` and `/members/[handle]` after the collections exist:

- Directory cards show awarded badge labels.
- Profile detail shows a badge shelf.
- Directory filtering includes badge once enough badge records exist.
- `/badges` shows the badge catalog and recipient counts, linked from the member
  directory rather than the brief.

Use aggregate counts for future prop summary cards. Keep individual future prop
rows for the detail view and admin audit, not as a social feed.

### 5. Admin Workflow

Use Payload admin first:

- Editors/admins manage badge definitions.
- Admins/agents award badges to one or more profiles.
- Editors/admins review and correct badge awards.
- Admin 1up prop issuance remains deferred.

Do not add prop UI, agent-prop ingestion, or prop campaign collections in the
badge implementation.

### 6. Verification

Add e2e coverage for:

- Admin creates or uses a seeded badge and awards it to a profile.
- The profile page displays the awarded badge.
- Badge filtering returns the expected profile and excludes unrelated profiles.
- The badge catalog shows recipient counts.
- Agents can create one badge award for multiple profiles.
- Public/member visibility rules hide member/private records appropriately.

Run `corepack pnpm test:e2e` for the first implementation because it touches
collections, auth/admin behavior, seeded data, routing, and rendering.

## Implementation Checklist

- [x] Add `badges` collection with visibility, category, display, and media
  fields.
- [x] Add badge access helpers for public/member visibility and editor/admin
  management.
- [x] Add `profileBadges` collection with profiles, badge, award source, context,
  featured, and visibility fields.
- [x] Add profile badge hooks for `awardedAt` and `awardedByUser` defaults.
- [ ] Add `props` collection with recipient, issuer, source context, review
  state, amount, kind, timestamps, and visibility fields.
- [ ] Add prop hooks for `issuedAt`, `issuedByUser`, active admin issuance, and
  safe evidence URL validation.
- [x] Register badge collections in `payload.config.ts`.
- [x] Generate badge migrations and Payload types.
- [x] Seed the starter badge definitions deterministically.
- [x] Add focused seed fixtures for badge display in e2e.
- [x] Add `/badges` catalog linked from `/members`.
- [x] Render featured badges on member directory cards.
- [x] Render badge shelf on member profile pages.
- [x] Add badge filtering to the member directory.
- [x] Add e2e coverage for badge award display, badge filtering, catalog counts,
  multi-profile agent awards, and visibility boundaries.
- [x] Update `docs/portal-implementation-checklist.md` as checklist items land.
- [x] Run `corepack pnpm test:e2e`.

## Open Questions

- Should profile owners choose which badges are featured, or should admins choose?
- Should props default to public, member-only, or private?
- Should peer props be active immediately or require moderation?
- Should admin bulk props need a campaign object from day one?
- Should `cohort-grad` be one badge per cohort, or one generic badge with award
  context in `profileBadges.note` or `relatedEvent`?
- Should props ever create points, or should they remain independent recognition?
