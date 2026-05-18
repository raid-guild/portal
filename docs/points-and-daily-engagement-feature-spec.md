# Points And Daily Engagement Feature Spec

## Status

Future feature module. Keep this out of the MVP until the portal needs a simple
daily participation loop.

The first version should be intentionally small: a member checks a box, may leave
an optional comment, and receives a default point award once per day.

## Product Intent

Daily engagement should make lightweight participation visible and encourage
members to return without turning the portal into a game economy.

It should answer:

- Did this member check in today?
- Did they leave any useful context?
- Did the check-in award points?
- Has this member already claimed today's check-in?

This is a participation signal, not proof of contribution quality.

## Existing Primitive

The portal already has:

```txt
pointEvents
```

Use `pointEvents` as the numeric ledger. Do not store point totals directly on
profiles or users as the source of truth.

Daily engagement should create a point event after a valid daily check-in.

## Non-Goals

- No all-time leaderboard in the first version.
- No streak economy in the first version.
- No token, payout, redemption, or entitlement logic.
- No scoring comments by quality.
- No automatic badge awards.
- No replacing actual activity signals such as projects, posts, events, threads,
  or contribution requests.

## Proposed Collection

Collection slug:

```txt
dailyEngagements
```

Recommended fields:

```txt
profile: relationship -> profiles, required
user: relationship -> users, required
engagementDate: date, required
checkedIn: checkbox, required, default true
comment: textarea
pointEvent: relationship -> pointEvents
status: valid / void
voidReason: textarea
createdAt
updatedAt
```

Recommended index or uniqueness rule:

```txt
unique user + engagementDate
```

The date should be normalized to the portal's configured day boundary, not the
browser's local timestamp. If timezone handling is unclear, start with server
timezone and document it in the UI.

## Default Points

Start with a fixed award:

```txt
daily check-in = 1 point
```

The value can be configurable later, but the first version should avoid multiple
activity types or variable scoring.

When a check-in is accepted:

1. Create `dailyEngagements` record.
2. Create a related `pointEvents` record.
3. Link the point event back to the engagement record if a relationship field is
   added to `pointEvents`.

Recommended `pointEvents` values:

```txt
recipient: current user
amount: 1
reason: Daily check-in
description: optional comment summary
source: system
status: valid
issuedBy: current user or system/admin user
issuedAt: now
```

If the user has already checked in for the date, return the existing record and
do not create another point event.

## User Flow

Authenticated member-facing surface:

```txt
[ ] I checked in today
Optional comment
Submit
```

After submit:

```txt
Checked in today
+1 point
```

If already submitted:

```txt
Checked in today
Come back tomorrow
```

The checkbox can be pre-checked in the UI as long as the user still submits the
record intentionally.

## Comments

The optional comment should be lightweight context only.

Examples:

- "Joined the weekly session."
- "Reviewed the portal project spec."
- "Caught up on the latest brief."

Do not use comments as a public feed in the first version. Admins may review
comments in Payload for moderation, learning, or future product tuning.

## Access Model

Recommended default:

- Authenticated users can create their own daily engagement.
- Users can read their own daily engagement history.
- Admins can read all daily engagements.
- Admins can void daily engagements if needed.
- Public users cannot read engagement records.

If member-only behavior is desired, require the `member` auth role before check-in
creation.

## Relationship To Badges And Props

Daily engagement points should stay separate from badges and props.

Possible future links:

- A streak milestone may suggest a badge for admin review.
- A weekly participation summary may show total check-ins.
- Admins may issue 1up props for session attendance instead of relying on daily
  check-ins.

Do not automatically issue badges or props from daily check-ins in the first
version.

## Relationship To Daily Briefs

The check-in CTA can live near the latest daily brief because that is where
members already see current context.

Possible surfaces:

- authenticated home/dashboard
- `/me`
- latest brief view

The daily brief should not own the check-in record. It can link to the check-in
action, but the durable record belongs to `dailyEngagements`.

## Anti-Abuse And Integrity

First version controls:

- one check-in per user per day
- authenticated users only
- server-side uniqueness check
- no client-trusted point amount
- point event created server-side only

Later controls:

- member-only check-ins
- rate limits
- admin void/reversal workflow
- suspicious activity report

## UI Surfaces

Member-facing:

- today's check-in card
- current point total
- short recent check-in history

Admin:

- list daily engagements
- filter by date, user, profile, status
- view optional comments
- void invalid records

Avoid a leaderboard in the first version. If comparison becomes useful later,
start with a limited recent participation view rather than all-time rankings.

## First Implementation Slice

Keep the first slice narrow:

1. Add `dailyEngagements` collection.
2. Add server-side create endpoint or collection hook that enforces one check-in
   per user per day.
3. Create a `pointEvents` record worth 1 point after a valid check-in.
4. Show a simple check-in card on the authenticated dashboard or `/me`.
5. Show recent personal check-ins.
6. Add e2e coverage for first check-in, duplicate prevention, and point award.

Defer streaks, leaderboards, categories, configurable point amounts, and public
engagement feeds.

## Open Questions

- Should check-ins be open to all authenticated contributors or only members?
- Should the day boundary use server timezone, UTC, or a configured community
  timezone?
- Should admins be able to edit comments, or only void records?
- Should `pointEvents` add a `relatedDailyEngagement` field?
- Should a daily check-in require the latest brief to exist?
