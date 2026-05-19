# Launch Invites Feature Spec

## Status

Future feature module. Use the current SendGrid setup for transactional emails
only. Do not import email-only lists as users or profiles during launch.

This spec covers launch notification and invite handling for:

- current members with unclaimed profile records
- early signup emails from external lists
- existing portal users

## Product Intent

Launch invites should help real people find the right path into the portal
without polluting member data or turning Payload into a newsletter system.

It should answer:

- Who should receive a launch notification?
- Are they claiming an existing profile or creating a new account?
- Has the invite been sent, claimed, bounced, or unsubscribed?
- Can admins see basic invite status without managing a full email campaign in
  Payload?

## Audience Segments

### Unclaimed Member Profiles

These are existing profile records that represent known RaidGuild members.

Recommended flow:

1. Send a targeted claim-your-profile email.
2. User signs up or logs in with the same email address.
3. The portal links the auth user to the existing profile.
4. The claimed profile receives the `member` role if appropriate.

Do not create auth users for unclaimed profiles before the person takes action.

### Early Signup List

This list may contain spam, stale addresses, or people who are interested but
not yet members.

Recommended flow:

1. Treat the list as a marketing or interest list.
2. Send a launch invite through SendGrid Marketing Campaigns or a similar bulk
   email tool.
3. Require recipients to sign up normally.
4. Do not create profiles or users from email-only records.

The launch email can include a signup link with tracking parameters, but the
portal should not grant member status from this list alone.

### Existing Portal Users

Existing users can receive a product or system notification later if needed.
They do not need the same claim flow unless their account is not connected to a
profile.

## Transactional vs Bulk Email

Keep these responsibilities separate:

- Transactional app email: password reset, welcome email, profile claim, account
  lifecycle.
- Bulk launch email: early signup list, broad launch announcement, newsletter or
  campaign-style messaging.

Use SendGrid SMTP or API from the app for transactional email. Use SendGrid
Marketing Campaigns, suppression lists, unsubscribe handling, and deliverability
tools for bulk launch sends.

Do not build newsletter campaign management in Payload until the portal needs
its own editorial workflow for bulk email.

## Proposed Collection

Add an invite tracking collection only when the launch needs per-recipient state
inside the portal.

Collection slug:

```txt
launchInvites
```

Recommended fields:

```txt
email: email, required
source: legacy-member / early-signup / manual
status: pending / sent / claimed / bounced / unsubscribed / suppressed / expired
sentAt: date
claimedAt: date
claimedUser: relationship -> users
claimedProfile: relationship -> profiles
relatedProfile: relationship -> profiles
sendgridMessageId: text
sendgridContactId: text
unsubscribeURL: text
notes: textarea
createdAt
updatedAt
```

Recommended index or uniqueness rule:

```txt
unique email + source
```

If the same email exists in both the unclaimed member profile list and the early
signup list, prefer the member profile claim path.

## Claim Flow

The first profile-claim version should be conservative:

1. User signs up with an email address.
2. The portal looks for an unclaimed profile with the same normalized email.
3. If exactly one match exists, send a signed verification link to that email.
4. When the user opens the verification link while logged in, link the profile to
   the user and mark it claimed.
5. If multiple matches exist, require admin review.
6. If no match exists, continue as a normal signup.

Recommended profile fields:

```txt
claimedByUser: relationship -> users
claimedAt: date
claimStatus: unclaimed / claimed / needs_review
claimSource: signup_email / admin / import
```

If claimed profiles should become members, add the `member` role during the
claim transaction. Do not grant `admin` from profile claims.

## Admin Workflow

Admins should be able to:

- import invite records from a cleaned CSV
- filter by source and status
- see claim status for legacy member profiles
- resend a transactional claim email for one person
- mark an invite suppressed or expired
- export status for campaign reconciliation

Bulk sends to the early signup list should remain outside Payload until there is
a clear reason to manage campaign creation from the portal.

## Guardrails

- Do not infer membership from email-only lists.
- Do not silently email scraped or unverified addresses from the app.
- Respect unsubscribe, bounce, and suppression state before any bulk send.
- Keep invite records factual and auditable.
- Avoid adding project, thread, or activity behavior to invite records.
- Do not let agents publish invite sends without review.

## Open Questions

- Which external list source is authoritative for early signups?
- Does the legacy CRM export include reliable profile email addresses for all
  unclaimed members?
- Should claim tokens be persisted for one-time use, or are short-lived signed
  links enough for launch?
- Who owns final copy and compliance for the launch campaign?
