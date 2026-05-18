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

- Admins and editors can award badges.
- Members can choose featured badges from badges they already have.
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
- Admins and editors can award badges.
- Admins can issue admin props.
- Members may create peer props only after rate limits and moderation rules are
  in place.
- Agents can create draft or pending-review props only.

## First Implementation Slice

Keep the first slice narrow:

1. Add `badges`, `profileBadges`, and `props` collections.
2. Seed a small set of badges and the default `1up` prop kind.
3. Allow admins/editors to award badges.
4. Allow admins to issue 1up props.
5. Show featured badges and aggregate 1up count on profile pages.
6. Add member list filtering by badge.
7. Add e2e coverage for badge display, badge filtering, and admin-issued props.

Defer peer props, agent-proposed props, prop campaigns, and leaderboard-like
views until the core display behavior is useful.

## Open Questions

- Should profile owners choose which badges are featured, or should admins choose?
- Should props default to public, member-only, or private?
- Should peer props be active immediately or require moderation?
- Should admin bulk props need a campaign object from day one?
- Should `cohort-grad` be one badge per cohort, or one generic badge with award
  context in `profileBadges.note` or `relatedEvent`?
- Should props ever create points, or should they remain independent recognition?
