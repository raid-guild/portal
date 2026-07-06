# Newsletter Module Feature Spec

## Status

Planned / first slice.

This module should let Portal editors turn a Portal post into a listmonk draft
campaign, send a test email, and hand final review/sending to listmonk. The
first version is a Portal-side publishing bridge, not a replacement for
listmonk.

## Product Intent

RaidGuild needs a reliable way to send newsletters, special updates, release
notes, downtime notices, and occasional promotional announcements to opted-in
audiences without moving editorial work out of Portal.

The module should answer:

- Which Portal post is being prepared for email?
- Which listmonk campaign draft was created from it?
- Which audience lists are selected?
- Has a test email been sent?
- Where should an editor review or send the campaign?

Portal owns content, roles, review rules, and post-to-email rendering. listmonk
owns audiences, unsubscribe pages, archives, campaign sending, bounces, and
delivery reporting. SendGrid remains the transport behind listmonk.

## Product Shape

The first useful workflow:

1. An editor writes or updates a normal Portal post.
2. The editor uses a newsletter action from the Portal admin post screen.
3. Portal renders the post as email-safe HTML and plain text.
4. Portal creates or updates a draft campaign in listmonk using the RaidGuild
   Updates template.
5. Portal can trigger a test send to one or more review addresses.
6. The editor opens the campaign in listmonk for final review and production
   send.

The first version should keep the production send button in listmonk. That gives
us listmonk's normal audience, suppression, unsubscribe, and campaign safeguards
while Portal owns the content conversion.

## Non-Goals

- Do not fork or customize listmonk's admin UI for the first slice.
- Do not make Portal a full email service provider.
- Do not send bulk campaigns directly through SendGrid from Portal.
- Do not bypass listmonk unsubscribe, suppression, or bounce behavior.
- Do not add a public newsletter landing page unless a real subscribe/archive
  flow needs it.
- Do not auto-send campaigns when a post is published.
- Do not email users who have not opted in or are suppressed/unsubscribed.
- Do not treat Portal notifications and newsletter campaigns as the same
  feature. They may share audiences later, but they have different consent and
  delivery expectations.

## First Slice Scope

### Ship First

- A Portal module registration record for Newsletter / Updates.
- A small newsletter campaign bridge collection or record type.
- A post admin action or custom admin view to create/update a listmonk draft.
- A post-to-email renderer that supports the Portal rich text nodes currently
  used by posts:
  - headings
  - paragraphs
  - bold, italic, underline, strikethrough, code
  - bullet and ordered lists
  - links and autolinks
  - upload/media nodes
  - media blocks
  - quote/banner/code blocks where present
- Absolute Portal media URLs for email images.
- A fixed first template: `RaidGuild Updates` in listmonk.
- Configurable default audience list IDs.
- Test-send action from Portal.
- Link from Portal to the listmonk campaign edit/review screen.
- Guardrails so only admins/editors can create/update listmonk campaigns.

### Defer

- Final bulk send from Portal.
- Audience import/export UI.
- Full campaign analytics in Portal.
- Multi-template design system.
- Newsletter subscribe/preferences page in Portal.
- Segment builder in Portal.
- Scheduled send controls.
- Campaign approval workflow.
- Per-post public archive customization.
- Automatic creation from post publish hooks.

## Recommended User Surface

## Editor Flow

The primary workflow should start from a Portal post. Portal is the source of
content; listmonk is the delivery and review backend.

1. Editor writes or opens a Portal post in Payload admin.
2. Editor opens the Newsletter panel on the post edit screen.
3. Editor confirms campaign settings:
   - subject, defaulting to the post title
   - optional preheader
   - content source: latest saved draft or published post
   - from email, defaulting to `RaidGuild <updates@updates.raidguild.org>`
   - template, defaulting to `RaidGuild Updates`
   - one or more allowlisted listmonk audience lists
4. Editor clicks `Create Campaign Draft`.
5. Portal renders the post into email-safe HTML and plain text.
6. Portal creates a draft listmonk campaign and stores the listmonk campaign ID
   on the newsletter bridge record.
7. Editor clicks `Send Test` and checks rendering, links, images, and the
   unsubscribe footer in an inbox.
8. Editor can update the Portal post and click `Update Draft From Post`.
9. Editor clicks `Open in listmonk` for final review and production send.

The UI should avoid the phrase `import content` unless a future workflow really
imports from another system. Recommended action labels:

```txt
Create Campaign Draft
Update Draft From Post
Send Test
Open in listmonk
```

If an editor changes the body directly in listmonk, `Update Draft From Post`
may overwrite those listmonk-side edits. The Portal UI should show a clear
warning before updating an existing draft.

Draft Portal posts may be used for test emails. Production sends should require
published or explicitly approved content unless a human admin overrides that
rule.

The default editor source should be the latest saved Payload draft. Unsaved
admin editor changes are not available to the newsletter renderer; editors must
save the post draft before clicking `Update Draft From Post`.

### Post Admin Action

Add a Newsletter panel or action on the Payload admin post edit screen.

Before a campaign exists:

```txt
Newsletter

Status: Not drafted
Audience: [default list selector]

[Create listmonk draft]
[Send test] disabled
```

After a campaign exists:

```txt
Newsletter

Status: Draft campaign created
Campaign: Bring Your Axe Back To The Table
listmonk ID: 12
Last synced: July 6, 2026, 10:42 AM

[Update draft from post]
[Send test]
[Open in listmonk]
```

The visible controls should stay compact. Avoid turning the post edit screen
into an email builder.

### Module Index

Register this as a member-only internal module once the first slice exists:

```txt
Name: Newsletter
Entry route: /admin or future /newsletter
Admin route: /admin/collections/newsletter-campaigns
Status: experimental or active
Visibility: member
Related primitives: posts, profiles, notification preferences
```

The `/modules` card should only be visible to authenticated members. It can
explain that this is an internal publishing module and link admins/editors to
the relevant admin route. Non-members and unauthenticated visitors should not
see this module as a public feature.

## CMS Model

Add a module-owned collection only if we need durable history and repeatable
workflow state. For this feature, that is useful because one post may be synced,
tested, updated, and reviewed over time.

Recommended collection slug:

```txt
newsletterCampaigns
```

Payload admin group:

```txt
Modules
```

Recommended fields:

```txt
title: text, required
post: relationship -> posts, required
subject: text, required
preheader: text
status: draft / test_sent / sent / archived / error
listmonkCampaignID: number
listmonkCampaignUUID: text
listmonkCampaignURL: text
templateID: number
listIDs: array of number
fromEmail: text
lastSyncedAt: date
lastTestSentAt: date
lastTestEmail: text
lastError: textarea
createdBy: relationship -> users
updatedBy: relationship -> users
```

Optional future fields:

```txt
renderedHTML: textarea
renderedText: textarea
sendStartedAt: date
sentAt: date
audienceSnapshot: json
analyticsSnapshot: json
```

Do not store listmonk API tokens or SendGrid credentials in collection data.

## Backend Module Structure

Recommended location:

```txt
src/modules/newsletter/
```

Recommended files:

```txt
src/modules/newsletter/config.ts
src/modules/newsletter/listmonkClient.ts
src/modules/newsletter/renderPortalPostEmail.ts
src/modules/newsletter/createOrUpdateCampaign.ts
src/modules/newsletter/sendCampaignTest.ts
```

Recommended API routes:

```txt
POST /api/newsletter/posts/:postId/draft
POST /api/newsletter/campaigns/:id/test
```

Optional future route:

```txt
GET /api/newsletter/posts/:postId/preview
```

The API should use the authenticated Payload user from the request. Do not use
anonymous or service-token-only writes for campaign creation.

## listmonk Integration

Portal should call listmonk through a small internal client.

Needed operations:

- create draft campaign
- update draft campaign
- send campaign test
- fetch campaign by ID for status/link display
- optionally list available listmonk lists for an admin selector

listmonk remains the source of truth for:

- subscribers
- list membership
- unsubscribes
- suppression/blocklist state
- bounces
- campaign send state
- campaign archive URLs

Default listmonk settings:

```txt
Root URL: https://updates.raidguild.org
Default from: RaidGuild <updates@updates.raidguild.org>
Template: RaidGuild Updates
```

## Environment Variables

Portal should read these from Railway:

```txt
LISTMONK_URL=https://updates.raidguild.org
LISTMONK_API_USER=portal-api
LISTMONK_API_TOKEN=...
LISTMONK_TEMPLATE_ID=...
LISTMONK_DEFAULT_LIST_IDS=...
LISTMONK_FROM_EMAIL=RaidGuild <updates@updates.raidguild.org>
NEWSLETTER_DEFAULT_TEST_EMAIL=...
```

The API token should belong to a listmonk API user with only the needed
permissions:

- campaign create/update/test permissions
- template read
- media read if needed
- list read/manage permissions for selected campaign lists

Do not grant broad user or settings management permissions to the Portal API
token.

## Rendering Rules

The renderer should produce two outputs:

- email-safe HTML for listmonk campaign body
- plain text alt body

Rules:

- Use the Portal post title as the default subject.
- Use the Portal post slug for the canonical `Open in Portal` CTA.
- Convert relative Portal media URLs to absolute `https://portal.raidguild.org`
  URLs.
- Preserve inline links and autolinks.
- Preserve meaningful image alt text.
- Skip empty nodes instead of emitting blank email sections.
- Avoid client-fragile CSS. Use inline styles for the email body.
- Keep the reusable frame/header/footer in the listmonk campaign template, not
  in each generated post body.

The renderer should be tested against real post content, including post `68`
from the initial workflow.

## Access And Consent

This should be a member-only module, not a public module. Visibility and action
permissions are separate:

- verified members may see that the module exists if it is enabled
- contributors may see the module only if they are also verified members
- editors/admins can create, update, and test campaign drafts
- agents should only act after a separate approval rule exists

Only trusted roles should create or update newsletter campaign drafts:

- admins
- editors
- possibly agents after a separate approval rule exists

Contributors should not be able to create bulk-email drafts by default.

Audience selection must use listmonk lists that represent opted-in recipients.
Initial approved sources:

- verified members who have opted in to newsletter/general updates
- previous newsletter opt-in form subscribers
- manually imported event/guest lists where prior consent is clear

Portal should not silently import all users into listmonk. Any future subscriber
sync should be explicit, auditable, and preference-aware.

## Deliverability Notes

Use `updates.raidguild.org` for the listmonk public URL and SendGrid
authentication. The same subdomain may be used for the from address:

```txt
updates@updates.raidguild.org
```

Keep SendGrid domain authentication valid before production sends:

- SPF / return-path via SendGrid CNAME records
- DKIM via SendGrid CNAME records
- DMARC record on `updates.raidguild.org`
- link branding enabled for tracked links

Avoid sending large first campaigns until the domain has a warm reputation.
Start with tests and small opted-in lists.

## Error Handling

The module should record listmonk failures on the bridge record:

- bad credentials
- invalid template ID
- invalid list IDs or missing permissions
- unsupported post content
- failed test send
- listmonk unavailable

The UI should show the last error plainly and let an editor retry after config
or content is fixed.

## Verification

Initial verification should cover:

- post-to-email renderer preserves links and media
- draft campaign creation succeeds through listmonk API
- test send succeeds to a review address
- unauthorized users cannot create campaign drafts
- generated campaign uses the configured template and list IDs

Because this affects admin flows and rendering, implementation changes should
run:

```bash
corepack pnpm test:e2e
```

If e2e cannot run locally, report the exact command and failure.

## Open Questions

- Should a post support multiple newsletter campaigns, or continue enforcing one
  active campaign bridge record per post?
- Should the UI move from the first standalone `/newsletter` tool into the
  Payload post edit view?
- Should Portal eventually allow selection across all listmonk lists, or keep
  using configured allowlisted list IDs?
- Should `sent` status be synced from listmonk after a campaign is sent, or
  entered manually in the first slice?
- Should newsletter opt-in become part of Portal notification preferences, or
  remain listmonk-only until subscriber sync is designed?

## Implementation Checklist

- [x] Add `newsletterCampaigns` collection or equivalent bridge record.
- [x] Add newsletter module config and listmonk client.
- [x] Move the proven post-to-email conversion logic into Portal.
- [x] Add draft campaign creation route.
- [x] Add test-send route.
- [x] Add first standalone `/newsletter` tool page for editors/admins.
- [ ] Add admin UI action/panel directly on posts.
- [x] Register Newsletter in module seed data.
- [ ] Add tests for rendering, permissions, and API behavior.
- [x] Document Railway environment variables.
- [ ] Run relevant e2e verification.
