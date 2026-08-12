# Portal Implementation Checklist

## Phase 1: Access Foundations

- [x] Add auth roles to `users`.
- [x] Add reusable access helpers for admin/editor/contributor/member checks.
- [x] Prevent contributors and unverified users from publishing posts.
- [x] Allow contributors to create draft posts through the API.
- [x] Add public/authenticated/member/admin visibility to posts, with editor/admin/agent publishing and agent visibility support.
- [x] Restrict contributors to editing their own drafts.
- [ ] Add tests for draft creation and publish blocking.

## Phase 2: Profile Data Model

- [x] Add `profileSkills` collection.
- [x] Add `profileRoles` collection.
- [x] Add `profiles` collection.
- [x] Relate `profiles.user` to `users`.
- [x] Allow imported profiles to remain unclaimed until a matching signup claims them.
- [x] Relate `profiles.profileSkills` to `profileSkills`.
- [x] Relate `profiles.profileRoles` to `profileRoles`.
- [x] Use `media` for profile avatars.
- [x] Add field-level access for private contact fields.
- [x] Add profile handle validation and uniqueness.
- [x] Add an admin-only legacy member CSV import with dry-run support.
- [x] Generate Payload types after collection changes.

## Phase 3: Member Profile Flow

- [ ] Create a member-facing `/me` route outside the Payload admin.
- [ ] Let authenticated users create or update their own profile.
- [ ] Add a simple onboarding flow with these required fields:
  - [ ] handle
  - [ ] display name
  - [ ] bio
  - [ ] at least one `profileSkill`
  - [ ] one or two `profileRoles`
- [ ] Add profile completion utility.
- [ ] Add avatar upload through Payload `media`.
- [ ] Add e2e coverage for profile creation.

## Phase 4: Directory And Public Profiles

- [x] Create `/members`.
- [ ] Create `/members/[handle]`.
- [x] Add filtering by auth role.
- [x] Add filtering by `profileSkills`.
- [x] Add filtering by `profileRoles`.
- [ ] Ensure public profile API responses exclude private fields.
- [ ] Add search indexing for profiles if Payload search remains the preferred path.

## Phase 5: Project Discoverability

- [x] Add `projects` collection.
- [x] Relate projects to contributor `profiles`.
- [x] Relate projects to `profileSkills`.
- [x] Add project links and cover images.
- [x] Add project visibility, including member-only project access.
- [x] Create `/projects`.
- [x] Create `/projects/[slug]`.
- [x] Decide whether projects use drafts/publishing.
- [ ] Add API examples for reading projects and contributors.

## Phase 5A: Cohort Spike MVP Primitives

- [x] Add `activityItems` collection for dated, factual community signals.
- [x] Add `threads` collection for persistent lines of work or thought.
- [x] Add `events` collection for sessions, join links, calendar links, and Discord event links.
- [x] Relate `dailyBriefs` to activity items, threads, and the next event.
- [x] Relate `projects` to activity items, threads, and relevant events.
- [x] Render next-session and calendar CTAs on the Update Brief view.
- [x] Render project-related events on project spike pages when present.
- [x] Create `/events` as a Sessions page with live, upcoming, and past sections plus join and add-to-calendar links.
- [x] Create `/events/new` as a contributor-friendly session creation flow.
- [x] Track session type, host/guest profiles, member-aware visibility, optional recurrence metadata, and optional Discord sync state on events.
- [x] Seed session-grounded activity, thread, and event records.
- [x] Add e2e coverage for brief, project spike, thread, activity, and event visibility.

## Phase 5B: Portal Agent Skill

- [x] Create a `portal-ops-skill` for safe Portal API operations and community memory updates.
- [x] Define the skill's source inputs: Discord summaries, meeting digests, project updates, event notes, and repo activity.
- [x] Encode the portal primitives in the skill: briefs, projects, threads, activity items, events, and profiles.
- [x] Add rules for when to create vs update records, especially updating existing threads before creating new ones.
- [x] Add confidence rules: draft low-confidence records, publish only high-confidence factual updates when policy allows.
- [x] Add source-grounding rules so activity items stay dated, factual, and traceable to real community memory.
- [x] Distinguish credited activity participants from profiles that are only referenced, derive Recent Contributors from visible activity in the last 90 days, and fall back to an honestly labeled active-member discovery surface when no qualifying activity exists.
- [x] Add guardrails against PM-tool drift: no tasks, assignees, sprint boards, or invented project state.
- [x] Document the review workflow for agent-proposed CMS updates before publication.
- [x] Add examples mapping one meeting digest into activity items, threads, event updates, and a daily brief.
- [x] Decide whether the skill should call Payload APIs directly or produce reviewable update plans first.
- [x] Serve the canonical skill from the API at `/api/portal/skills/portal-ops-skill`.
- [x] Add `/api/portal/skills` discovery and keep `/api/portal/skills/portal-memory-publisher` as a compatibility alias.
- [x] Document review-first Cohort page setup, announcements, related sessions,
      enrollment states, publishing, and route verification in the exposed
      `portal-ops-skill`.

## Phase 5C: RaidGuild Cohort Hub Module

- [x] Add reusable `cohorts` records with program and enrollment state, dates, curated context, and controlled visual variants.
- [x] Add Profile-owned `cohortCommitments` with authenticated create/read/update access, duplicate prevention, withdrawal, and rejoin behavior.
- [x] Create the public, shareable `/cohorts/[slug]` hub while keeping commitment actions behind login and Profile creation.
- [x] Support optional hero backgrounds, a validated exploration video, and curated external context links without arbitrary CMS HTML or CSS.
- [x] Relate Events to Cohorts and render next, weekly, upcoming, and past session views from the canonical Event records.
- [x] Highlight the highest-priority active, open, interest-gathering, or upcoming Cohort on the authenticated dashboard.
- [x] Replace the unauthenticated home project block with Cohort status, signup or interest actions, and prior public session themes when available.
- [x] Support a `gathering-interest` state and safely prefilled general inquiries without adding a separate interest model.
- [x] Provide a truthful general-inquiry fallback when no Cohort is scheduled.
- [x] Add deterministic Cohort seed content, a schema migration, generated Payload types, analytics, and end-to-end coverage.
- [ ] Relate Briefs to Cohorts and show the newest visible update when editorial use justifies the relationship.
- [ ] Add participant display, capacity/waitlist automation, dedicated interest records, and a Cohort archive only when real operations define their lifecycle and permissions.

## Phase 5D: Interactive Publishing Artifacts

- [x] Add a Post rich-text block for interactive workshop artifacts.
- [x] Restrict embeds to configured, exact HTTPS artifact origins.
- [x] Render embeds in a lazy iframe sandbox that grants scripts only.
- [x] Provide caption, external-open, optional preview-image, and newsletter fallback behavior.
- [x] Add generated Payload types and end-to-end validation/rendering coverage.

## Phase 6: External API Hardening

- [ ] Add signup abuse controls before public launch: rate limiting, CAPTCHA, and stricter signup email verification gates. New self-serve signups now start as `unverified`, can manage their own `/me` profile, and become `contributor` only after account email verification.
- [ ] Decide approved external origins for browser API consumers.
- [ ] Update CORS configuration intentionally.
- [ ] Document REST examples for profiles, projects, posts, and media.
- [ ] Document GraphQL examples if GraphQL remains enabled.
- [ ] Decide whether scoped API keys are needed beyond authenticated Payload users.
- [ ] Add audit notes for public/private field exposure.

## Phase 7: Points And Recognition

- [x] Add `pointEvents` ledger collection.
- [x] Restrict point issuance to admins.
- [x] Let users read their own point history.
- [x] Show point totals on authenticated portal surfaces.
- [ ] Add a narrow service endpoint for future automated awards.
- [ ] Add admin reversal workflow notes and tests.

## Phase 7A: Badges And Props Recognition

- [x] Add `badges` collection for reusable durable recognition definitions.
- [x] Add `profileBadges` collection for awarded profile badges, including multi-profile award batches.
- [ ] Add `props` collection for stackable 1up recognition records.
- [x] Keep badge and prop permissions separate from auth roles, profile roles, and point events.
- [x] Add editor/admin badge management.
- [x] Add admin/agent badge-award access.
- [ ] Add admin-only 1up prop issuance after props are no longer deferred.
- [x] Seed a small deterministic starter badge set.
- [x] Add `/badges` catalog linked from the member directory.
- [x] Show featured badges on member directory cards.
- [x] Show badge shelf on member profile pages.
- [x] Add member directory filtering by badge.
- [x] Add e2e coverage for badge display, badge filtering, badge catalog counts, multi-profile agent awards, and visibility boundaries.

## Phase 7B: Notifications

- [x] Add `notifications` collection for user-scoped in-app notification records.
- [x] Add `notificationPreferences` collection for account-level notification controls.
- [x] Add `/inbox` route for notification history with mark-read and archive actions.
- [x] Add Inbox entry and unread count to the top-right account menu.
- [x] Add `/me` notification preferences and personal portal jump links.
- [x] Keep email delivery gated behind verified account email in the UI.
- [x] Add notification creation hooks for published briefs, visible sessions, and badge awards.
- [x] Add cron-callable session reminder endpoint for external task runners.
- [x] Add email dispatcher for verified, opted-in product notifications.
- [x] Add coalesced user update utility for weekly digest generation.
- [x] Add weekly digest endpoint for external task runners.
- [x] Add daily activity digest endpoint for external task runners.
- [x] Document recommended external cron calls for notifications.
- [x] Improve notification admin list columns/search for delivery triage.

## Phase 7C: Contribution Requests

- [x] Add `contributionRequests` collection for lightweight, discoverable asks.
- [x] Relate requests to owner profiles, optional projects, related sessions,
  threads, posts, profiles, and useful skills.
- [x] Reuse portal visibility rules for public, authenticated, member, and admin
  requests.
- [x] Show open related requests on project detail pages.
- [x] Show open related requests on session detail pages.
- [x] Add `/requests/[slug]` detail pages.
- [x] Extend comments to support posts, sessions, projects, and contribution
  requests as parent records.
- [x] Show flat comments on contribution request detail pages.
- [x] Add friendly create/edit routes for contribution requests.
- [x] Let members and contributors draft requests while agents, editors, and
  admins can publish.
- [x] Add project stewards so project owners can maintain project context and
  publish project-scoped requests.
- [x] Add frontend project management for stewards to update public project
  context, contributors, related records, and external links.
- [x] Let project stewards publish project-scoped requests from the friendly
  request form.
- [x] Add e2e coverage for request creation, project display, session display,
  and detail page rendering.
- [ ] Add a global request board when enough real requests exist.
- [ ] Add session/project comment surfaces when the UX calls for them.
- [ ] Add direct notifications only after recipient intent is clear.
- [ ] Add a `projectMemberships` feature module only if project involvement
      needs join requests, active/past state, followers, filtering, or history.

## Phase 8: Modules

- [x] Decide whether first version uses only documented module conventions or a
      `modules` registry collection.
- [x] Add `modules` collection with status, owner, route, related project,
      related primitives, and graduation criteria fields.
- [x] Add module categories for grouping modules beyond lifecycle status.
- [x] Add `/modules` discovery page for visible enabled modules.
- [x] Present modules as compact discovery rows with optional CMS thumbnails
      and category-based fallback visuals.
- [x] Add unauthenticated `/modules` teaser with join/login CTAs.
- [x] Add dashboard entry point for modules.
- [x] Add verified-user email opt-in for newly available module announcements.
- [x] Add `/modules/[slug]` detail routes with access-aware metadata and a
      distinct canonical app launch action.
- [x] Add Payload admin grouping guidance: core primitives in `Portal`,
      module-owned collections in `Modules`.
- [x] Ensure core routes render without module-owned collections or enabled
      module records.
- [x] Add e2e coverage for module visibility and module cards without entry
      routes.

## Phase 9: Infinite Wiki

- [x] Add `wikiPages` collection with source audit fields.
- [x] Put `wikiPages` in the Payload admin `Modules` group.
- [x] Link Infinite Wiki to the module registry or documented module convention.
- [x] Add wiki page access rules for reviewed status and visibility.
- [x] Add `/wiki` index for published pages.
- [x] Add `/wiki/[slug]` detail route with related portal context and sources.
- [x] Add possible-topic rendering without presenting possible pages as
      canonical.
- [x] Add admin/editor/agent review workflow for generated drafts through
      Payload admin.
- [x] Add wiki guidance to the Portal ops skill.
- [ ] Add Prism-backed generation endpoint or admin action for generated drafts.
- [x] Add topic-map artifact import from session resources into suggested
      `wikiTopics` and article candidates.
- [ ] Record source queries, source artifacts, prompt version, model, and
      confidence for every generated page.
- [ ] Add refresh proposal workflow without silently overwriting reviewed
      content.
- [ ] Add e2e coverage for status, visibility, source rendering, and draft
      review boundaries.

## Phase 10: Portal Graph Module

- [x] Add `react-force-graph-2d` for the client-side graph surface.
- [x] Add authenticated `/portal-graph` route.
- [x] Build graph data from visible `profiles`, `profileRoles`, and
      `profileSkills`.
- [x] Add client-side search, filters, node selection, and side panel.
- [x] Link selected profile nodes to public member profile pages.
- [x] Register Portal Graph in the `modules` seed data.
- [x] Ensure `/modules` exposes the module with join/login CTAs for
      unauthenticated visitors and open CTA for authenticated users.
- [x] Add e2e coverage for access, module listing, and profile links.

## Phase 11: Newsletter Module

- [x] Add `newsletterCampaigns` collection as a module-owned bridge to listmonk.
- [x] Add `/newsletter` as a member-only module route with editor/admin campaign
      controls.
- [x] Add listmonk config and API client for campaign draft and test-send
      operations.
- [x] Add Portal post to email-safe HTML/text rendering for newsletter drafts.
- [x] Add API route to create or update a listmonk draft from a Portal post.
- [x] Add API route to send a listmonk test email from a newsletter campaign
      record.
- [x] Register Newsletter in module seed data as member-visible.
- [ ] Add a Payload post edit action/panel for the same workflow.
- [ ] Add focused tests for renderer, permissions, and API behavior.
- [ ] Add e2e coverage for the `/newsletter` editor flow.

## Deferred

- [ ] Points and daily engagement check-ins. First slice includes daily check-in
      points and Today's Vibe Notes gated by viewer check-in plus explicit author
      member-sharing consent. See `docs/points-and-daily-engagement-feature-spec.md`.
- [ ] Bounty board module. See `docs/modules-feature-spec.md`.
- [ ] Peer props, agent-proposed props, prop campaigns, and leaderboard-like recognition views. See `docs/badges-and-props-feature-spec.md`.
- [ ] Infinite Wiki generation and review. See `docs/infinite-wiki-feature-spec.md`.
- [ ] Public onboarding and inquiry funnels. See `docs/onboarding-funnel-feature-spec.md`.
- [ ] Generic community portal Railway template extraction. See `docs/generic-community-portal-template-spec.md`.
- [ ] Entitlements.
- [ ] Cohort modeling.
- [ ] Module/plugin registry.
- [ ] Discord replacement features.
- [ ] Project management features.
