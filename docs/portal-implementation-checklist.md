# Portal Implementation Checklist

## Phase 1: Access Foundations

- [x] Add auth roles to `users`.
- [x] Add reusable access helpers for admin/editor/contributor/member checks.
- [x] Prevent non-editor users from publishing posts.
- [x] Allow contributors to create draft posts through the API.
- [x] Add public/authenticated/member/admin visibility to posts, with editor/admin review and agent draft visibility support.
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

- [x] Create a `portal-memory-publisher` skill for converting community memory into CMS updates.
- [x] Define the skill's source inputs: Discord summaries, meeting digests, project updates, event notes, and repo activity.
- [x] Encode the portal primitives in the skill: briefs, projects, threads, activity items, events, and profiles.
- [x] Add rules for when to create vs update records, especially updating existing threads before creating new ones.
- [x] Add confidence rules: draft low-confidence records, publish only high-confidence factual updates when policy allows.
- [x] Add source-grounding rules so activity items stay dated, factual, and traceable to real community memory.
- [x] Add guardrails against PM-tool drift: no tasks, assignees, sprint boards, or invented project state.
- [x] Document the review workflow for agent-proposed CMS updates before publication.
- [x] Add examples mapping one meeting digest into activity items, threads, event updates, and a daily brief.
- [x] Decide whether the skill should call Payload APIs directly or produce reviewable update plans first.
- [x] Serve the skill from the API at `/api/portal/skills/portal-memory-publisher`.

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
- [ ] Add scheduled digest endpoint for external task runners.
- [ ] Add coalesced user update utility for weekly digest generation.

## Deferred

- [ ] Points and daily engagement check-ins. See `docs/points-and-daily-engagement-feature-spec.md`.
- [ ] Contribution requests / bounty system. See `docs/contribution-requests-feature-spec.md`.
- [ ] Peer props, agent-proposed props, prop campaigns, and leaderboard-like recognition views. See `docs/badges-and-props-feature-spec.md`.
- [ ] Entitlements.
- [ ] Cohort modeling.
- [ ] Module/plugin registry.
- [ ] Discord replacement features.
- [ ] Project management features.
