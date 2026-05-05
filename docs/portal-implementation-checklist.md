# Portal Implementation Checklist

## Phase 1: Access Foundations

- [x] Add auth roles to `users`.
- [x] Add reusable access helpers for admin/editor/contributor/member checks.
- [x] Prevent non-editor users from publishing posts.
- [x] Allow contributors to create draft posts through the API.
- [x] Restrict contributors to editing their own drafts.
- [ ] Add tests for draft creation and publish blocking.

## Phase 2: Profile Data Model

- [x] Add `profileSkills` collection.
- [x] Add `profileRoles` collection.
- [x] Add `profiles` collection.
- [x] Relate `profiles.user` to `users`.
- [x] Relate `profiles.profileSkills` to `profileSkills`.
- [x] Relate `profiles.profileRoles` to `profileRoles`.
- [x] Use `media` for profile avatars.
- [x] Add field-level access for private contact fields.
- [x] Add profile handle validation and uniqueness.
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
- [ ] Create `/projects`.
- [ ] Create `/projects/[slug]`.
- [ ] Decide whether projects use drafts/publishing.
- [ ] Add API examples for reading projects and contributors.

## Phase 6: External API Hardening

- [ ] Decide approved external origins for browser API consumers.
- [ ] Update CORS configuration intentionally.
- [ ] Document REST examples for profiles, projects, posts, and media.
- [ ] Document GraphQL examples if GraphQL remains enabled.
- [ ] Decide whether scoped API keys are needed beyond authenticated Payload users.
- [ ] Add audit notes for public/private field exposure.

## Deferred

- [ ] Bounty system.
- [ ] Entitlements.
- [ ] Cohort modeling.
- [ ] Module/plugin registry.
- [ ] Discord replacement features.
- [ ] Project management features.
