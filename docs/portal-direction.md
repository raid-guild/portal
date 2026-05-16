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
is ready for it.

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
- `claimEmail`: private legacy email used to let a matching signup claim the profile
- `claimedAt`
- `sourceCRMID`
- `status`: draft/review/published or active/inactive, final naming TBD
- `visibility`: public/authenticated/private, final shape TBD

Imported legacy CRM profiles can leave `user` blank and set `claimStatus` to
`unclaimed`. A new signup can claim the profile when their account email matches
the private `claimEmail`.

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
