# Notifications Feature Spec

## Status

Future feature module. Notifications are for existing portal users and profiles.
They should not replace launch invite tracking, SendGrid Marketing Campaigns,
Discord, or newsletter-style broadcast tooling.

This spec covers product notifications for:

- new and upcoming sessions
- newly published daily or weekly briefs
- activity digests
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
badge_awarded
profile_claim
system
```

Examples:

- `event_published`: A new session was published and is visible to the user.
- `event_reminder`: A visible session starts soon.
- `brief_published`: A daily or weekly brief was published.
- `activity_digest`: A grouped summary of recent activity items.
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
relatedThread: relationship -> threads
relatedBadgeAward: relationship -> profileBadges
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
```

### Notification Preferences

Collection slug:

```txt
notificationPreferences
```

Recommended fields:

```txt
user: relationship -> users, required, unique
emailEnabled: checkbox
sessionAnnouncements: in_app / email / muted
sessionReminders: in_app / email / muted
briefs: in_app / email / muted
activityDigestFrequency: none / daily / weekly
badgeAwards: in_app / email / muted
updatedAt
createdAt
```

A separate collection is preferred over adding many fields to `users` because
preferences are likely to grow and may need their own admin workflow.

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
3. Dashboard and API surfaces read from `notifications`.
4. A dispatcher sends email for pending email notifications.
5. Scheduled jobs create reminders and digests.

This keeps notification creation auditable and prevents hidden bulk email sends
inside content hooks.

## Initial Hooks

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

## Scheduled Jobs

Some notifications are time-based and should not live only in collection hooks.

### Session Reminders

Run on a schedule, for example every 15 minutes.

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

### Activity Digests

Run daily or weekly depending on preference.

Find recent visible `activityItems`, group them into a short digest, and create
one `activity_digest` notification per recipient.

Avoid creating per-activity notifications unless a future feature introduces a
strong relevance model such as following a project or thread.

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

## Dashboard Experience

Initial dashboard scope:

- show latest unread notifications in a compact dashboard panel
- show an unread count in account navigation later
- allow mark read
- allow archive
- link to a notification management page when the list grows

Recommended routes:

```txt
/dashboard
/notifications
/me
```

Use `/dashboard` for the lightweight notification panel, `/notifications` for
the full inbox/history, and `/me` for notification preferences.

The notification panel should support the portal's brief-first dashboard instead
of competing with it. It should not become a general task inbox.

## Email Delivery

Use the existing Payload email adapter. In production this is backed by SendGrid
SMTP when `SENDGRID_API_KEY` is configured.

Email delivery should be opt-in by notification type and preference. For the
first version, send only transactional, user-specific product email:

- session reminder for a user who enabled reminders
- badge awarded to that user's profile
- brief notification for a user who enabled brief emails

Do not send broad launch announcements or campaign email from this module.

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

- Should notification preferences require verified email before email delivery?
- Should member-only notifications include contributors, or only `member` role
  users?
- Should admins be able to send a manual notification to selected users from
  Payload admin?
- Should event reminders default to in-app only until email preferences exist?
- Do we need a first-class unsubscribe token for product notification email, or
  can it live behind authenticated `/me` preferences initially?
- Should activity digests be generated from `dailyBriefs`, `activityItems`, or
  both?
