# Points And Daily Engagement Feature Spec

## Status

First slice implemented. Portal now has `dailyEngagements`, point events, and a
daily vibe check surfaced from member areas. Streaks, richer scoring, and broader
automation remain future.

The first version should be intentionally small: a member completes a daily vibe
check, may leave an optional comment, and receives a default point award once per
day.

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
vibe: raiding / ripping / meeting / learning / vibing / blocked / resting
comment: textarea
commentStatus: none / pending_review / approved / hidden / rejected
commentApprovedBy: relationship -> users
commentApprovedAt: date
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
daily vibe check = 5 points
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
Choose today's vibe:

⚔️ Raiding
🔥 Ripping
🗣️ Meeting
🔎 Learning
🌊 Vibing
🧱 Blocked
💤 Resting

Optional comment
Submit
```

After submit:

```txt
Checked in today
+5 points
```

If the user included a comment:

```txt
Comment submitted for review
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
- "Feeling heads-down today."
- "Blocked and could use another set of eyes."

The check-in, member-sharing consent, and the comment display state should be
separate.

- `status` controls whether the check-in is valid.
- `pointEvent.status` controls whether the point award is valid.
- `commentShareWithMembers` records whether the author explicitly agreed that
  the optional note may be shown to other checked-in members for the current
  daily note surface.
- `commentStatus` controls whether the optional comment can be shown.

Points should be awarded immediately for a valid check-in. Notes may only appear
in the member-facing daily notes surface when the author opted into member
sharing and the comment is approved. Notes without member-sharing consent remain
review-only for moderators and must not be shown retroactively if a new display
surface is added later. If a comment becomes an issue, admins can hide or reject
the comment later. Rejecting or hiding a comment should not remove the daily
point unless an admin voids the whole engagement or reverses the point event.

Recommended comment defaults:

```txt
no comment -> commentStatus: none
with comment, no member-sharing consent -> commentStatus: pending_review
with comment and member-sharing consent -> commentStatus: approved
```

Admins and editors can hide or reject comments after the fact. Public/member
surfaces should only show comments where `commentStatus = approved` and
`commentShareWithMembers = true`. Separate public comment visibility can be
added later if public and member display rules diverge.

Do not use daily engagement comments as a broad public feed in the first version.
Admins may review comments in Payload for moderation, learning, or future product
tuning.

The first member-facing notes surface is Today's Vibe Notes on the authenticated
dashboard. It is gated by a valid same-day check-in. Anonymous users receive
`401`, verified users without a same-day check-in remain locked, and checked-in
members only see approved, opted-in notes from the current UTC engagement day.
Private profiles are anonymized for other members.

## Access Model

Recommended default:

- Authenticated users can create their own daily engagement.
- Users can read their own daily engagement history.
- Admins can read all daily engagements.
- Admins can void daily engagements if needed.
- Admins and editors can approve, hide, or reject optional comments.
- Checked-in members can read same-day approved notes only when the author opted
  into member sharing.
- Public users cannot read engagement records.
- Public users can only read approved public comment excerpts if a public display
  surface is added later.

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
- same-day Vibe Notes, gated by the viewer's own check-in and author opt-in

Admin:

- list daily engagements
- filter by date, user, profile, status
- filter comments by review status
- approve, hide, or reject optional comments for display
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
6. Add admin controls to hide or reject optional comments.
7. Add e2e coverage for first check-in, duplicate prevention, point award, and
   comment visibility.
8. Add Today's Vibe Notes with explicit author member-sharing consent,
   same-day check-in gating, and e2e coverage for auth/privacy behavior.

Defer streaks, leaderboards, categories, configurable point amounts, and public
engagement feeds.

## Open Questions

- Should check-ins be open to all authenticated contributors or only members?
- Should the day boundary use server timezone, UTC, or a configured community
  timezone?
- Should admins be able to edit comments, or only void records?
- Should `pointEvents` add a `relatedDailyEngagement` field?
- Should a daily check-in require the latest brief to exist?
