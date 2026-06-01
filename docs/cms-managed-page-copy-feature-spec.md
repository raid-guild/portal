# CMS-Managed Page Copy Feature Spec

Future feature module. This spec documents how Portal product-flow pages can
support CMS-managed copy without turning core application routes into fragile
page-builder experiences.

## Purpose

Give BD, content, and community operators a safe way to update public-facing
copy for onboarding, intake, and brief surfaces without code changes.

This should preserve the Portal's product behavior:

- fixed routes for important flows
- stable form handling and account linking
- predictable analytics and UTM handling
- access-controlled application pages
- safe fallbacks when CMS copy is missing

## Current Context

The repository includes a generic `Pages` collection with seeded Home and
Contact records, but the current Portal experience is mostly route-driven:

- `/`
- `/brief`
- `/join`
- `/inquire/[type]`
- `/dashboard`
- `/me`
- `/sessions`
- `/projects`
- `/members`

These are product surfaces with state, permissions, relationships, and
workflow logic. They should not become fully generic CMS pages by default.

## Product Principle

Use the existing `Pages` collection for generic editorial pages.

Use structured CMS copy records for product-flow pages.

This gives editors control over message and CTA copy while keeping layouts,
forms, permissions, and workflow behavior in code.

## In Scope

CMS-managed copy for:

- `/join`
- `/inquire/client`
- `/inquire/sponsor`
- `/inquire/grant`
- `/inquire/opportunity`
- `/inquire/general`
- `/brief`
- unauthenticated CTA blocks around brief/activity/session preview surfaces

CMS-managed page wrapper fields:

- eyebrow
- headline
- intro/body copy
- primary CTA label
- secondary CTA label
- benefit cards
- FAQ rows
- form intro text
- post-submit copy
- empty-state copy
- SEO title and description

## Out Of Scope

- generic drag-and-drop layouts for product routes
- arbitrary form construction for intake routes
- replacing the `Brief` content model
- replacing the `Pages` collection
- CRM pipeline management
- public inquiry status tracking
- entitlement or paywall copy systems

## Recommended Model

Add a structured collection:

`PageCopy`

Fields:

- `key`
  - unique
  - examples: `join`, `inquire-client`, `inquire-sponsor`,
    `inquire-grant`, `inquire-opportunity`, `inquire-general`,
    `brief-public`
- `surface`
  - `join`
  - `inquiry`
  - `brief`
  - `module`
  - `other`
- `status`
  - draft/published if versioning is useful
- `eyebrow`
- `headline`
- `intro`
- `primaryCTA`
  - label
  - url
- `secondaryCTA`
  - label
  - url
- `benefits`
  - title
  - body
- `faq`
  - question
  - answer
- `formIntro`
- `postSubmitHeading`
- `postSubmitBody`
- `seo`
  - title
  - description

The route owns the structure. The CMS record fills the text.

## Alternative Model

Use globals instead of a collection:

- `JoinPageSettings`
- `InquiryPageSettings`
- `BriefPageSettings`

This is simpler for one-off pages, but it becomes awkward when intake funnels
need one record per type. A collection keyed by surface is more flexible.

## Relationship To Current Pages Collection

Keep `Pages` for conventional editorial pages:

- `/about`
- `/how-it-works`
- `/for-clients`
- `/for-contributors`
- `/launch`
- campaign-specific pages

Avoid using `Pages` as the source of truth for product-flow routes:

- `/join`
- `/inquire/[type]`
- `/brief`
- `/dashboard`
- `/me`
- `/sessions/create`

Those routes should remain application experiences.

## Rendering Pattern

Each route should:

1. Load copy by key.
2. Fall back to code defaults if no published record exists.
3. Render the fixed product layout.
4. Keep form submission and workflow logic in code.
5. Use CMS-managed SEO metadata when present.

Example:

- `/inquire/client` loads `PageCopy.key = inquire-client`
- if no record exists, use the current hardcoded fallback copy
- the form still writes to the `inquiries` collection with `type = client`

## Admin UX

Editors should see a small set of clearly named records:

- Join Page
- Client Inquiry Page
- Sponsorship Inquiry Page
- Grant Inquiry Page
- Collaboration Inquiry Page
- General Inquiry Page
- Public Brief Page

Avoid exposing implementation keys as the primary editing affordance. Use
admin descriptions and default columns that make ownership obvious.

## Permissions

Only admins and editors should create or update page copy.

Public users can read published copy through frontend rendering. Direct API
read access can remain editor-only unless external sites need to consume the
copy.

## Preview And Drafting

Draft support is useful but not mandatory for MVP.

If enabled, use Payload draft/preview mode so editors can review copy changes
without publishing them to the public site.

## Seed Strategy

Seed default copy records for local and staging environments.

Production should not require test seed data to make the pages work. Code
fallbacks must stay in place so missing records do not break launch flows.

## Open Questions

- Should `PageCopy` support reusable CTA presets, or should CTAs stay inline?
- Should external sites ever read this copy through API?
- Should the seeded Home and Contact pages be removed, hidden, or converted
  into real editorial pages?
- Do we want copy approval workflow before launch, or is editor-only access
  enough?
