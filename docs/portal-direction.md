# Portal Direction

## Product Frame

The Portal should be a structured discoverability layer for RaidGuild. Its primary
job is to answer:

- Who are the people in the network?
- What skills and profile roles do they identify with?
- What projects exist, and who worked on them?
- What updates, case studies, or session notes have been published?
- Which profile and project data can other RaidGuild tools consume through APIs?

This is not intended to replace Discord, host meetings, run education directly, or
act as a project management tool.

## Naming Decisions

Use these names consistently:

- `profiles`: public/member-facing profile records
- `profileSkills`: reusable skill taxonomy for profiles
- `profileRoles`: reusable RaidGuild role taxonomy for profiles
- `projects`: public/internal project records

Avoid `cohorts` for now. The first pass should not model cohort participation.

## Auth Roles vs Profile Roles

Keep permission roles separate from profile roles.

Auth roles belong on `users` and control application permissions:

- `admin`
- `editor`
- `contributor`
- `member`

New accounts should start as `contributor`, except the first user in a fresh
install, who must become `admin` to preserve the Payload onboarding flow. The
`member` role should be assigned manually by an admin when the community process
is ready for it, or automatically when an imported legacy member profile is
claimed through email verification.

Users also track `emailVerifiedAt` after they verify their signup email from the
profile page. Account email verification is separate from member status; it only
proves control of the auth email address.

Profile roles belong on `profiles` through relationships to `profileRoles`.
They describe how a member contributes and should be usable for discovery,
filtering, and profile display. They must not grant permissions.

## Recommended Collections

### users

Auth identity and permissions only.

Fields to add:

- `roles`: select/multi-select for auth permissions

Do not use `users` as the public profile surface.

### profiles

Public/member profile surface.

Suggested fields:

- `user`: relationship to `users`
- `handle`
- `displayName`
- `bio`
- `avatar`: upload relationship to `media`
- `location`
- `walletAddress`
- `links`
- `contact`
- `profileSkills`: relationship to `profileSkills`, has many
- `profileRoles`: relationship to `profileRoles`, has many
- `claimStatus`: `unclaimed` or `claimed`
- `claimEmail`: private legacy email used to send a profile claim verification link
- `claimedAt`
- `sourceCRMID`
- `status`: draft/review/published or active/inactive, final naming TBD
- `visibility`: public/authenticated/private, final shape TBD

Imported legacy CRM profiles can leave `user` blank and set `claimStatus` to
`unclaimed`. A logged-in user can request a claim when their account email
matches the private `claimEmail`, but the claim is only completed after they
open the signed verification link sent to that email.

Legacy CRM records should be imported through the admin-only
`/api/profiles/import-legacy` route instead of normal production seed behavior.
Run the import with `?dryRun=true` first, then POST the same CSV without the
query flag once the summary looks correct. The import upserts by `sourceCRMID`
from the old `member_id`, maps legacy class/skill fields into the current
profile role and skill taxonomy, and preserves already claimed profile
ownership.

### profileSkills

Reusable profile skill taxonomy.

Suggested fields:

- `title`
- `slug`
- `category`
- `description`

### profileRoles

Reusable RaidGuild profile role taxonomy.

Suggested fields:

- `title`
- `slug`
- `type`
- `description`
- `group`
- `icon`: optional upload relationship to `media`

Future profile recognition should use a separate badges and props module instead
of overloading profile roles. Badges are durable profile flex such as
`cohort-grad`; props are stackable lightweight `1up` recognition using a
mushroom emoji. See `docs/badges-and-props-feature-spec.md`.

### projects

Discoverability records for work RaidGuild members have built or contributed to.

Suggested fields:

- `title`
- `slug`
- `summary`
- `description`
- `status`
- `links`
- `coverImage`: upload relationship to `media`
- `contributors`: relationship to `profiles`, has many
- `profileSkills`: relationship to `profileSkills`, has many
- `publishedAt`
- `visibility`

Projects should show details, links, and contributors. They should not become
tasks, milestones, assignments, or PM workflow records.

Future requests for help should use a lightweight `contributionRequests` feature
module if they need independent status, comments, filtering, or cross-portal
discovery. Keep project-local help fields embedded only while the request surface
is simple. See `docs/contribution-requests-feature-spec.md`.

### events

Session records for cohort gatherings, demos, workshops, brownbags, all hands,
and pitches. Events should stay focused on calendar visibility, joining, and
light coordination rather than becoming a course or scheduling platform.

The frontend session creation flow lives at `/events/new` for contributors and
records the session type, start/end time, speaker, visibility, and optional
Discord scheduled event sync state. Payload admin remains the canonical place
for deeper editorial cleanup.

Future daily participation should use a separate `dailyEngagements` module that
creates `pointEvents` for simple once-per-day check-ins. Keep points as a ledger,
not profile state. See `docs/points-and-daily-engagement-feature-spec.md`.

## Publishing Flow

The current API draft-post flow works, but permissions are too broad. The desired
flow is:

- contributors can create draft posts through the API
- contributors can edit their own drafts
- editors and admins can review and publish
- public users can only read published content

This applies to blog posts, project updates, session notes, and future editorial
content.

## API Direction

Payload already exposes REST and GraphQL for collections. The Portal should make
API boundaries explicit:

- public profile reads should expose only safe public fields
- authenticated profile reads can include additional fields for the owner
- project reads should respect visibility
- external browser clients may require CORS configuration
- server-to-server publishing should use authenticated API users or future scoped
  API keys

Custom endpoints should be added only where Payload's collection APIs are not
specific enough.
