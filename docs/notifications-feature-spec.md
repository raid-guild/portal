# Notifications Feature Spec

## Status

First slice implemented. Portal now has user-scoped in-app notifications,
preferences, inbox, publish hooks, reminders, digest endpoints, and an email
dispatcher. Future work should stay scoped to existing users and profiles.
Notifications should not replace launch invite tracking, SendGrid Marketing
Campaigns, Discord, or newsletter-style broadcast tooling.

This spec covers product notifications for:

- new and upcoming sessions
- newly published daily or weekly briefs
- activity digests
- weekly portal digests for existing users
- personal portal events such as badges, profile claims, or later project
  follow events

## Product Intent

Notifications should help a logged-in user notice timely portal activity and
return to a useful next step.

They should answer:

- What happened?
- Why is this relevant to me?
- Where should I go next?
- Have I already read, archived, or muted this kind of notification?
- Was an email delivery attempted, sent, skipped, or failed?

Notifications should stay lightweight. They should surface portal activity, not
turn the portal into a campaign manager, Discord replacement, or project
management inbox.

## Relationship To Launch Invites

Launch invites and notifications are separate modules.

`launchInvites` is for launch and onboarding flows:

- unclaimed member profile claim emails
- early signup list campaign tracking
- invite status such as sent, claimed, bounced, suppressed, or expired

`notifications` is for existing portal users:

- in-app notification records
- user-specific product emails
- session reminders
- brief and activity digests

Bulk launch announcements, early signup list emails, newsletters, and campaign
style sends should remain in SendGrid Marketing Campaigns or another dedicated
bulk email tool until the portal needs its own editorial workflow for bulk
email.

Guardrails inherited from the launch invite spec:

- Do not import email-only lists as users, profiles, or notification
  recipients.
- Do not infer membership from email-only lists.
- Do not silently email scraped or unverified addresses from the app.
- Respect suppression, unsubscribe, and bounce state before sending product
  email.
- Keep send state factual and auditable.
- Do not let agents publish broad notification sends without review.

## Notification Types

Start with a small enum and expand only when the UI or delivery behavior needs
it.

Recommended initial types:

```txt
event_published
event_reminder
brief_published
activity_digest
weekly_digest
module_published
badge_awarded
profile_claim
system
```

Examples:

- `event_published`: A new session was published and is visible to the user.
- `event_reminder`: A visible session starts soon.
- `brief_published`: A daily or weekly brief was published.
- `activity_digest`: A grouped summary of recent activity items.
- `weekly_digest`: A weekly portal digest for an existing user.
- `module_published`: A new active or experimental module became visible to an
  opted-in user.
- `badge_awarded`: A badge was issued to the user profile.
- `profile_claim`: A profile claim was approved or needs action.
- `system`: Account or portal notices that do not belong to another type.

## Proposed Collections

### Notifications

Collection slug:

```txt
notifications
```

Recommended fields:

```txt
recipient: relationship -> users, required
title: text, required
body: textarea
type: select, required
status: unread / read / archived
priority: normal / high
deliveryChannels: array/select: in_app / email
emailStatus: none / pending / sent / failed / skipped
emailError: textarea
readAt: date
archivedAt: date
emailedAt: date
dedupeKey: text
actionLabel: text
actionURL: text
relatedEvent: relationship -> events
relatedBrief: relationship -> dailyBriefs
relatedActivityItem: relationship -> activityItems
relatedProject: relationship -> projects
relatedModule: relationship -> modules
relatedThread: relationship -> threads
relatedBadgeAward: relationship -> profileBadges
metadata: json
createdAt
updatedAt
```

Recommended indexes:

```txt
recipient + status + createdAt
recipient + type + createdAt
dedupeKey
emailStatus + createdAt
```

Use `dedupeKey` to prevent duplicate records from publish hooks and scheduled
jobs, for example:

```txt
event:123:published:user:456
event:123:reminder:24h:user:456
brief:99:published:user:456
module:77:published:user:456
```

### Notification Preferences

Collection slug:

```txt
notificationPreferences
```

Recommended fields:

```txt
user: relationship -> users, required, unique
sessionAnnouncements: in_app / email / muted
sessionReminders: in_app / email / muted
briefs: in_app / email / muted
moduleAnnouncements: in_app / email / muted
activityDigestFrequency: none / daily / weekly
weeklyDigest: in_app / email / muted
badgeAwards: in_app / email / muted
emailEnabled: legacy/derived checkbox, not a delivery gate
updatedAt
createdAt
```

A separate collection is preferred over adding many fields to `users` because
preferences are likely to grow and may need their own admin workflow.

Choosing `email` for a notification type is the email opt-in for that type.
Email preferences require a verified account email. Users without a verified
email can still receive in-app notifications and use the inbox. The preference
UI should disable email choices and point them to email verification until
`emailVerifiedAt` is set. The legacy `emailEnabled` field may be derived for
admin visibility or compatibility, but delivery must not depend on a separate
global email checkbox.

`moduleAnnouncements` defaults to `muted`. Users opt in from `/modules` or
manage the preference from `/me#notifications`; the Portal should not silently
email or inbox-notify all users when editors add modules.

### Notification Deliveries

Optional later collection for richer delivery audit and retry behavior.

Collection slug:

```txt
notificationDeliveries
```

Recommended fields:

```txt
notification: relationship -> notifications, required
recipient: relationship -> users, required
channel: in_app / email
status: pending / sent / failed / skipped
provider: payload-email / sendgrid
providerMessageID: text
attemptedAt: date
sentAt: date
error: textarea
createdAt
updatedAt
```

For the first implementation, `emailStatus` fields on `notifications` are enough.
Add `notificationDeliveries` only when retry history, provider reconciliation,
or multiple channels become important.

## Trigger Model

Use Payload collection hooks to create notification intent. Do not make hooks do
heavy delivery work.

Recommended pattern:

1. A collection hook detects a meaningful state transition.
2. The hook creates one or more `notifications` records with dedupe keys.
3. Inbox, dashboard, and API surfaces read from `notifications`.
4. A dispatcher sends email for pending email notifications.
5. Scheduled jobs create reminders and digests.

This keeps notification creation auditable and prevents hidden bulk email sends
inside content hooks.

## Initial Hooks

### New Published Module

Source collection:

```txt
modules
```

Trigger:

- `afterChange`
- module becomes enabled
- module status becomes `active` or `experimental`
- module visibility is not admin-only
- previous module state was not already eligible

Behavior:

- create `module_published` notifications for eligible users who opted in to
  module announcements
- use dedupe keys such as `module:123:published:user:456`
- link to the module entry route, signed launch route, or `/modules`
- keep email delivery in the normal pending-email dispatcher

### New Published Session

Source collection:

```txt
events
```

Trigger:

- `afterChange`
- event becomes published
- event visibility is not admin-only
- event start time is in the future

Behavior:

- create `event_published` notifications for eligible users
- respect each user's session announcement preference
- include link to the session detail page
- dedupe by event and recipient

### Published Brief

Source collection:

```txt
dailyBriefs
```

Trigger:

- `afterChange`
- brief becomes published
- brief visibility is not admin-only

Behavior:

- create `brief_published` notifications for eligible users
- respect each user's brief preference
- link to `/dashboard` or the public brief URL when applicable
- dedupe by brief and recipient

### Badge Awarded

Source collection:

```txt
profileBadges
```

Trigger:

- `afterChange`
- new badge award is created

Behavior:

- notify users linked to awarded profiles
- respect badge notification preference
- do not notify for private awards unless the recipient is allowed to see the
  award
- link to the member profile page

## Session Relevance

Notifications should not own RSVP, attendance, or session participation state.
Those concepts belong to the sessions model or a future session participation
feature.

The first notifications version can use broad visible-session announcements and
reminders. More targeted session notifications should wait until the sessions
rework settles around user intent and attendance.

Future relevance signals:

- interested: user clicked Interested, Remind me, or similar
- attending: user RSVP'd or opted into a session reminder
- attended: user checked in, joined, or was marked present
- hosted or spoke: user profile is related through host or speaker fields
- followed context: user follows a related project or thread later

Possible future collection:

```txt
eventParticipants
  event -> events
  user -> users
  profile -> profiles
  status: interested / attending / attended / skipped
  source: self / admin / discord / check_in
  reminderPreference: default / muted / email
```

Notification behavior can then target users who showed interest, attended, or
follow related context. Until that exists, avoid creating a parallel session
state model inside notifications.

## Scheduled Jobs

Some notifications are time-based and should not live only in collection hooks.

### Session Reminders

Run from an external cron or task runner, for example every 15 minutes. The
portal should expose a small authenticated endpoint and should not own a task
scheduler.

Endpoint:

```txt
POST /api/notifications/reminders/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
```

Default behavior:

- scan both `24h` and `1h` reminder windows
- use a 15 minute lookahead window
- create notifications only; email delivery remains a separate dispatcher step
- allow retries by relying on dedupe keys

Optional request body:

```json
{
  "windows": ["24h", "1h"],
  "lookaheadMinutes": 15,
  "dryRun": false
}
```

Find published visible events starting soon:

```txt
startsAt between now and now + 24h
startsAt between now and now + 1h
```

Create `event_reminder` notifications using dedupe keys such as:

```txt
event:123:reminder:24h:user:456
event:123:reminder:1h:user:456
```

### Email Dispatch

Run from an external cron or task runner after notification creation jobs. The
portal should send only existing notification intent records and should not let
content hooks send email directly.

Endpoint:

```txt
POST /api/notifications/email/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
```

Default behavior:

- find `notifications` where `deliveryChannel` is `email` and `emailStatus` is
  `pending`
- re-check that the recipient has an email and `emailVerifiedAt`
- send through Payload email, backed by SendGrid when configured
- mark each notification `sent`, `failed`, or `skipped`
- keep retry behavior explicit by leaving failed records visible in Payload

Optional request body:

```json
{
  "limit": 50,
  "dryRun": false
}
```

### Activity Digests

Run daily or weekly depending on preference.

Endpoint:

```txt
POST /api/notifications/digests/activity/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
```

Default behavior:

- use the last 24 hours when `since` is omitted
- create one `activity_digest` notification per eligible user
- include visible `activityItems` only
- skip users with no visible activity in the digest window
- respect `activityDigestFrequency`; `none` mutes this digest
- rely on notification dedupe keys for safe retries

Optional request body:

```json
{
  "since": "2026-05-28T00:00:00.000Z",
  "until": "2026-05-29T00:00:00.000Z",
  "limit": 100,
  "dryRun": false
}
```

Find recent visible `activityItems`, group them into a short digest, and create
one `activity_digest` notification per recipient.

Avoid creating per-activity notifications unless a future feature introduces a
strong relevance model such as following a project or thread.

### Weekly Portal Digest

Run weekly from an external cron or task runner for existing users who have not
muted weekly digests. This is a product notification, not a general newsletter
campaign.

Endpoint:

```txt
POST /api/notifications/digests/weekly/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
```

Default behavior:

- use the last seven days when `since` is omitted
- create one `weekly_digest` notification per eligible user
- skip users with no visible updates in the digest window
- store grouped counts and item summaries in `metadata`
- rely on notification dedupe keys for safe retries

Optional request body:

```json
{
  "since": "2026-05-22T00:00:00.000Z",
  "until": "2026-05-29T00:00:00.000Z",
  "limit": 100,
  "dryRun": false
}
```

Inputs can include:

- latest weekly brief
- new or upcoming sessions
- sessions with new summaries, recordings, or artifacts
- notable activity items
- active projects and threads
- badges or recognition
- user-specific updates such as badges received or sessions they showed
  interest in

Output one `weekly_digest` notification per recipient. The notification can use
`metadata` to store grouped counts and section summaries, for example:

```txt
2 upcoming sessions
1 new weekly brief
4 project and activity updates
1 badge received
```

If email is enabled and verified, the same notification can become a weekly
digest email. If email is not verified or not enabled, it should remain in-app
only.

## Operations

External cron or task runners should call the notification endpoints with
explicit periods where relevant.

Recommended baseline:

```txt
Every 15 minutes:
POST /api/notifications/reminders/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
{ "windows": ["24h", "1h"], "lookaheadMinutes": 15 }

Every 5 minutes:
POST /api/notifications/email/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
{ "limit": 50 }

Daily, after the UTC day closes:
POST /api/notifications/digests/activity/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
{ "since": "<start-of-day>", "until": "<end-of-day>", "limit": 100 }

Weekly, after the UTC week closes:
POST /api/notifications/digests/weekly/run
Authorization: Bearer $AGENT_REGISTRATION_SECRET
{ "since": "<start-of-week>", "until": "<end-of-week>", "limit": 100 }
```

Run the email dispatcher after digest jobs if email delivery should happen
soon after digest records are created.

Do not send weekly digests to early signup lists, unclaimed profile emails, or
other email-only audiences.

## Coalesced User Updates

The portal may need a server utility before it needs a public API endpoint.

Recommended utility:

```txt
getUserNotificationDigest(user, since)
```

This utility should coalesce user-visible updates across portal primitives:

- briefs
- events
- activity items
- projects
- threads
- badges
- point or daily engagement signals when relevant

Use it from:

- `/dashboard` for a high-level current-state summary
- weekly digest generation
- future `/inbox` digest detail views
- a later API endpoint only if another client needs it

Prefer one high-level digest notification for low-urgency activity over many
small one-off notifications.

## Eligibility And Visibility

Recipients must be existing `users`. Notification creation should not create
users or profiles.

Visibility rules should mirror the source content:

- public content can notify authenticated users if their preferences allow it
- authenticated/member-only content should notify only users who can read it
- admin-only content should not create general user notifications
- private badge awards should notify only the recipient and users with admin
  access if an admin workflow needs it

When in doubt, create fewer notifications.

## Inbox And Dashboard Experience

Initial inbox scope:

- add an Inbox item to the top-right profile dropdown
- show an unread count badge when there are unread notifications
- route to `/inbox` for the full notification history
- allow mark read
- allow archive
- group digest notifications clearly instead of expanding every low-priority
  update into its own row

Recommended routes:

```txt
/inbox
/dashboard
/me
```

Use `/inbox` as the user-facing notification center, backed by the
`notifications` collection. Use `/dashboard` for brief-first portal state and
optional lightweight notification or digest summaries. Use `/me` for
notification preferences.

The dashboard should not become the notification center. Notifications should
support the portal's brief-first dashboard instead of competing with it.

## Me Page Experience

Notification preferences belong on `/me`, but not inside the profile wizard.
They are private account settings, not public profile completeness.

Recommended `/me` structure:

```txt
Summary/status strip
Profile section
Account section
Notifications section
Activity section
```

The page can use anchor sections or a sticky section nav before moving to true
tabs. Suggested anchors:

```txt
/me#profile
/me#account
/me#notifications
/me#activity
```

Add a compact personal portal panel near the top of `/me` with jump-off points:

- Inbox
- Dashboard
- Daily check-in
- Badges
- Public profile, when a profile exists

The daily check-in link should point to `/dashboard` unless that workflow grows
into its own route.

Notification preferences should use compact rows and segmented controls:

- Session announcements: In-app / Email / Off
- Session reminders: In-app / Email / Off
- Briefs: In-app / Email / Off
- Weekly digest: In-app / Email / Off
- Activity digest: Off / Daily / Weekly
- Badge awards: In-app / Email / Off

If the account email is not verified, keep in-app options enabled and disable
email choices with a verify-email prompt.

Later dashboard scope:

- show latest unread notifications in a compact dashboard panel if it helps
  users notice important activity
- allow mark read
- allow archive
- link to `/inbox`

## Email Delivery

Use the existing Payload email adapter. In production this is backed by SendGrid
SMTP when `SENDGRID_API_KEY` is configured.

Email delivery should be opt-in by notification type and preference. For the
first version, send only transactional, user-specific product email:

- session reminder for a user who enabled reminders
- badge awarded to that user's profile
- brief notification for a user who enabled brief emails
- module announcement for a verified existing user who explicitly enabled
  module announcement email
- weekly digest for a verified existing user who enabled weekly digest email

Do not send broad launch announcements or campaign email from this module. Module
announcement email is allowed only for existing verified portal users who opt in
through notification preferences. Weekly digest email is allowed only for
existing portal users and should respect the same verification, preference,
suppression, and audit rules as other product notification email.

Recommended delivery flow:

1. Query `notifications` with `emailStatus = pending`.
2. Check user email, verification, role, and preferences.
3. Check suppression/unsubscribe state when available.
4. Send with `req.payload.sendEmail`.
5. Mark `emailStatus` as sent, skipped, or failed.
6. Store `emailedAt` and any provider or error details available.

## Agent Behavior

Agents may propose notification-worthy content, but should not silently create
broad notification sends.

Allowed early agent behavior:

- create source content such as draft events, briefs, or activity items
- propose a notification preview for admin review
- create low-risk recipient-specific notifications when explicitly allowed by
  an admin-owned workflow

Disallowed early agent behavior:

- emailing early signup lists
- creating notification recipients from raw email lists
- sending broad notifications without review
- bypassing user preferences or suppression state

## Open Questions

- Should in-app notification preferences default to on for all existing users?
- Should member-only notifications include contributors, or only `member` role
  users?
- Should admins be able to send a manual notification to selected users from
  Payload admin?
- Should event reminders default to in-app only until email preferences exist?
- Do we need a first-class unsubscribe token for product notification email, or
  can it live behind authenticated `/me` preferences initially?
- Should activity and weekly digests be generated from `dailyBriefs`,
  `activityItems`, or both?
- Should the user-facing route be permanently `/inbox`, or should
  `/notifications` exist as an alias?
- Which session rework fields should become the canonical interested,
  attending, and attended signals?
