# Onboarding And Inquiry Funnel Feature Spec

## Status

Future feature module. This spec documents the intended public onboarding and
inquiry flow before implementation. Page copy in this document is draft filler
and should receive BD/content review before launch.

## Product Intent

The portal should make RaidGuild feel like a live digital coworking space:
people can see what is happening, understand why joining matters, and choose the
right next step without needing to understand the CMS or internal workflow.

This flow should support two kinds of visitors:

- community-oriented visitors who want to join the portal
- opportunity-oriented visitors who want to bring work, funding, sponsorship,
  or partnership context to the guild

The inquiry flow should capture intent first, then ask the visitor to create an
account so future follow-up can be tied to a Portal identity.

## Experience Map

### Public Brief / Show Page

The current public brief page remains the primary "show" surface.

It should surface:

- current activity
- upcoming sessions
- active projects
- recent updates
- contribution signals
- clear join CTAs

Draft hero direction:

```txt
RaidGuild is a digital coworking space for builders, operators, and agents.
See what the guild is working on, show up for live sessions, and find the next
useful place to contribute.
```

Primary CTA:

```txt
Join the Portal
```

Secondary CTA options:

```txt
Explore current work
Bring an opportunity
```

### `/join`

The join page is the primary "tell" surface.

It should include:

- simple account creation
- a stronger explanation of RaidGuild and the Portal
- benefits of joining
- expectations for participation
- links into more specific inquiry funnels

Draft page framing:

```txt
Join RaidGuild's Portal

Create an account to connect your profile, follow live guild activity, join
sessions, and find useful places to contribute.
```

Draft benefit bullets:

- follow real guild activity without digging through chat
- build a public profile connected to sessions, projects, posts, and badges
- discover projects and contribution requests
- join live sessions and keep track of context afterward
- bring client, sponsor, grant, or partnership opportunities into the right
  intake path

After the account form, show funnel kickoff buttons:

```txt
Need a different path?

Request a build
Sponsor the guild
Offer funding or grants
Bring a collaboration opportunity
Talk to the guild
```

These labels are placeholders. BD should review final naming and page copy.

### Inquiry Funnel Routes

Each funnel route should feel like a focused intake page, not a generic contact
form. Routes may be separate pages or a typed route such as
`/inquire/[inquiryType]`.

Initial funnel types:

- client/build request
- sponsorship inquiry
- grant or funding opportunity
- partnership or collaboration opportunity
- general guild inquiry

Each page should use tailored copy and fields while writing to the same
underlying collection.

## Inquiry Submission Flow

Recommended flow for anonymous visitors:

1. Visitor fills a focused inquiry form.
2. Portal saves the inquiry immediately with submitted contact information.
3. Success screen presents account creation as the next step to continue.
4. If the visitor creates an account with the same email, Portal links or
   enriches the inquiry.
5. If the visitor leaves, the inquiry remains available for admin review.

Recommended user-facing copy after submission:

```txt
Continue your RaidGuild intake

Your request has been started. Create an account so we can connect this request
to your Portal profile, share follow-ups, and keep the conversation tied to your
work.
```

Primary CTA:

```txt
Create account
```

Secondary CTA:

```txt
I'll do this later
```

This intentionally keeps account creation at the end of the funnel while still
positioning it as the next step. Internally the inquiry is already saved so the
portal does not lose high-intent opportunities if the visitor abandons account
creation.

Recommended flow for authenticated users:

1. Prefill name, email, and profile context when available.
2. Save inquiry linked to the current user and profile.
3. Show confirmation and relevant next action.

## Proposed Collection

Use one collection for all funnel submissions instead of creating one collection
per funnel type.

Collection slug:

```txt
inquiries
```

Suggested fields:

```txt
type: client / sponsor / grant / opportunity / general
status: new / reviewing / contacted / converted / closed / spam
accountLinkStatus: unlinked / linked / skipped
name: text
email: email
organization: text
roleOrTitle: text
message: textarea
budgetRange: select or text
timeline: select or text
links: array { label, url }
sourceRoute: text
utmSource: text
utmMedium: text
utmCampaign: text
submitterUser: relationship -> users
submitterProfile: relationship -> profiles
relatedProject: relationship -> projects
notes: textarea
createdAt
updatedAt
```

The submitted contact fields should remain on the inquiry even when a user is
later linked. The user/profile relationship is enrichment, not the source of
truth for the original submission.

## Account Linking

Linking can happen in a few ways:

- authenticated submission sets `submitterUser` immediately
- post-submit signup with matching email links the newest unlinked inquiry for
  that email
- admin manually links a user or profile from the inquiry record

Recommended MVP behavior:

- save anonymous inquiry with `accountLinkStatus: 'unlinked'`
- redirect to account creation with email and inquiry ID context
- after signup/login, link the inquiry when the email matches
- avoid creating users automatically before the visitor consents to account
  creation

## Access Rules

Create:

- anyone can submit public inquiry forms
- rate limiting and spam controls are required before broad launch

Read:

- admins/editors can read all inquiries
- authenticated submitters can read their own linked inquiries later if a
  member-facing inquiry history becomes useful

Update:

- admins/editors can triage status, notes, and relationships
- public users cannot update submitted inquiries directly

Delete:

- admins only

## Relationship To Existing Portal Primitives

The onboarding funnel is a feature module. It should not overload core portal
primitives.

- `Brief`: public proof that the guild is active now.
- `Profile`: identity created after join or linked later.
- `Project`: may be created later if an inquiry becomes concrete guild work.
- `Activity Item`: may record accepted or public outcomes, not every inbound
  lead.
- `Event`: may be linked if an inquiry leads to an intake session.
- `Inquiry`: private intake record used for follow-up and conversion.

Do not create projects, activity items, or profiles automatically from every
inquiry.

## Copy Review Notes

These pages are sales and onboarding surfaces, so copy quality matters more than
on normal app screens.

Before launch, BD/content review should refine:

- hero hook on the public brief page
- explanation of RaidGuild and the Portal on `/join`
- funnel button labels
- each inquiry page headline and value proposition
- post-submit account creation copy
- spam-safe but high-conversion confirmation language

All current copy in this spec is placeholder direction.

## Open Questions

- Should `/join` create an auth account only, or also prompt for profile setup
  immediately?
- Should inquiry submitters receive transactional confirmation email before they
  create an account?
- Should an inquiry be visible to the submitter after account creation, or is it
  admin-only until follow-up workflows are clearer?
- Which funnel names should BD use for the first launch version?
- Do client/build inquiries need budget and timeline fields at MVP, or should
  those stay in freeform message copy?

## Deferred

- CRM-style pipeline management.
- Automated lead scoring.
- Bulk email or newsletter workflows.
- Public inquiry status tracking.
- Creating projects automatically from inquiries.
- Assigning internal owners or tasks from inquiry records.
