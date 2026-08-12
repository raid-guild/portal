# Cohort Project Spike MVP Spec

## Decision

Build the first MVP as a lightweight cohort project spike portal.

The portal should answer, quickly and plainly:

- What is happening right now?
- Which project spikes are active?
- Who is involved?
- What is the next useful action?
- When is the next session?

This aligns with the current repository direction: a CMS-backed RaidGuild portal for discoverability, profiles, projects, and published updates. It does change the product emphasis from a broad RaidGuild directory toward a narrower first use case: surfacing cohort activity and project spikes without becoming a project management system.

In this document, “cohort” describes the community frame around the project
spike MVP. Durable, numbered RaidGuild programs with enrollment, a dedicated
hub, and a cohort-specific schedule are a separate feature module defined in
the [RaidGuild Cohort Hub spec](./raidguild-cohort-hub-feature-spec.md). That
module composes the primitives below rather than changing their meaning.
The public home may feature that module's active, upcoming, or
`gathering-interest` Cohort and prior public Event themes; potential-program
interest reuses the general inquiry flow rather than becoming a project task or
commitment.

The exposed `portal-ops-skill` includes a review-first Cohort setup workflow.
Agents can prepare sourced Cohort proposals and related Posts or Events, while
editor/admin review remains required to create, update, or publish the Cohort
record. Participant commitments remain self-serve Profile actions.

## Current Repo Fit

Already present:

- `profiles`, `profileSkills`, and `profileRoles` support people, roles, and contributor discovery.
- `projects` supports project records, summaries, status, links, contributors, skills, drafts, and publishing.
- `dailyBriefs` supports a dated brief with summary, sections, related posts, related projects, related profiles, visibility, drafts, and workflow enforcement.
- `/members`, `/projects`, `/me`, `/dashboard`, and the home page already exist as portal surfaces.
- `pointEvents` exists, but should stay secondary for this MVP. The meetings emphasized visibility, coordination, and contribution paths over token or reward mechanics.

Missing or incomplete for this MVP:

- Activity items as first-class records.
- Threads as first-class records.
- Events/calendar records or calendar subscription links.
- A project detail page at `/projects/[slug]`.
- A brief-first landing/dashboard view that feels live, recent, and human.
- Ways to engage/contribute modeled in data instead of hard-coded UI.

## Product Definition

A live snapshot of the cohort that shows what is happening and how to jump in.

The MVP is not:

- a project management tool
- a task board
- a Discord replacement
- a course platform
- a handbook/documentation dump
- an AI-generated content feed

The MVP is:

- a current brief
- a bulletin-board style activity feed
- project spike pages
- persistent threads that show continuity
- event/calendar calls to action
- clear contribution paths

## Guiding Principles

- Real over polished.
- Recent over comprehensive.
- Signal over content volume.
- Human notes over marketing copy.
- Clear next action over passive browsing.
- Narrow project spike focus over generic platform behavior.

If a section feels generic, over-explained, or AI-written, cut it or rewrite it.

## MVP Scope

### Ship First

1. Update Brief view
2. Project Spike index/detail view
3. Activity items
4. Threads
5. Events/calendar CTA
6. Ways to engage/contribute

### Defer

- Heavy project phases and milestone workflows
- Token mechanics
- Leaderboards
- Automated agent coordination
- Full PM board behavior
- Complex cohort modeling
- Deep resource libraries

## Information Architecture

Recommended first-route shape:

- `/` for public update brief landing if unauthenticated
- `/dashboard` or `/` for authenticated member brief
- `/projects` for active project spikes
- `/projects/[slug]` for a single project spike
- `/members` remains contributor discovery
- `/me` remains profile onboarding/editing

Keep navigation small:

- Brief
- Projects
- Members
- Join / Profile

## Update Brief View

Purpose: show real community activity, create presence, and give a clear next step.

### Required Sections

#### Top Strip

Data:

- cohort/community label, for example `RaidGuild Cohort`
- current focus, for example `Week 3 - Agent Workflows`
- active status
- latest update timestamp
- next event CTA
- calendar CTA

Primary actions:

- `Join Next Session`
- `Add to Calendar`

#### TL;DR

Use the latest `dailyBriefs.summary` plus short section content. Tone should feel like notes from someone who was in the room.

Example content:

- People are building agent workflows and OpenClaw templates.
- Onboarding is still too loose; the group wants a clearer entry path.
- The portal should show live project spikes, not become a PM system.
- Calendar visibility matters, but the real goal is getting people onto their own calendars.

#### Recent Activity

Chronological feed of short factual records.

Examples:

- Discussion on project spikes as the first useful portal surface.
- Agreement to keep the launch scope to brief, projects, activity, and contribution paths.
- Calendar-first onboarding called out as a core need.
- Project ownership and issue structure identified as blockers.

#### Active Threads

Persistent lines of work or thought that evolve across meetings and projects.

Seed examples:

- Improving onboarding flow
- Defining the project spike object
- Agent workflow experimentation
- Calendar and session coordination
- Contribution ownership and repo workstreams

#### Ways to Engage

Action cards, not explanatory content.

Seed examples:

- Join next session
- Add cohort calendar
- Pick up a good first issue
- Contribute to a project spike
- Create or update your profile

#### Presence

Lightweight signal only:

- recent contributors
- active participants this week
- avatars from related profiles

Avoid gamification in this MVP.

## Project Spike Page

Purpose: show what is being built, who is involved, and how to participate.

In under 45 seconds, the page must answer:

- What is this?
- Is it active?
- Who is involved?
- How do I jump in?

### Required Sections

#### Header

Data:

- title
- one-line summary
- status: `exploring`, `building`, `shipping`, or `archived`
- last active timestamp
- contributors
- primary CTA: `Join Project`
- secondary CTA: `Follow` or external link

#### Current State

Short bullets that describe current momentum, not evergreen description.

Example:

- Defining the project spike data model.
- Scoping activity and thread primitives.
- Preparing issues for multiple contributors.

#### Activity

Project-scoped feed using the same activity item model as the brief.

#### Threads

Project-scoped or related threads.

Examples:

- Project object definition
- Incentive model
- June launch planning

#### Ways to Contribute

Action cards.

Examples:

- Define project schema
- Build the first project detail page
- Wire calendar links
- Add seed data from session notes

#### Resources

Simple link list:

- repo
- Discord thread/channel
- Figma
- docs
- calendar

## Data Model Direction

### Keep Existing Collections

#### `dailyBriefs`

Use as the brief page backbone.

Recommended additions:

- `statusLabel`: text or select, for example `Active Now`
- `focusLabel`: text, for example `Week 3 - Agent Workflows`
- `nextEvent`: relationship to future `events`
- `activityItems`: relationship to future `activityItems`, has many
- `threads`: relationship to future `threads`, has many
- `engagementActions`: array of label, description, url, style

#### `projects`

Use as the project spike backbone.

Recommended additions:

- Update `projectStatus` options to support `exploring`, `building`, `shipping`, `archived`.
- `currentState`: array of short text bullets.
- `lastActiveAt`: date.
- `primaryCTA`: group with label and url.
- `resources`: array of label, url, type.
- `activityItems`: relationship to future `activityItems`, has many.
- `threads`: relationship to future `threads`, has many.
- `contributionActions`: array of title, description, url.
- `visibility`: `public`, `authenticated`, `member`, `admin`.

Keep drafts/publishing. Public views should only show published public project spikes.
Member-only project spikes should require the authenticated user to have the
`member` auth role.

### Add New Collections

#### `activityItems`

Purpose: a factual signal log used by briefs and projects.

Fields:

- `title`: text, required
- `body`: textarea, optional
- `activityType`: select: `discussion`, `decision`, `project`, `insight`, `blocker`, `event`, `contribution`
- `happenedAt`: date, required
- `sourceLabel`: text, optional
- `sourceURL`: text, optional safe URL
- `relatedProject`: relationship to `projects`, optional
- `relatedThread`: relationship to `threads`, optional
- `relatedProfiles`: relationship to `profiles`, has many
- `creditedProfiles`: relationship to `profiles`, has many; only profiles whose concrete participation is supported by the activity source
- `visibility`: `public`, `authenticated`, `admin`
- drafts/publishing if editorial review is needed

Access:

- public can read published public items
- authenticated users can read authenticated items
- contributors can create drafts
- editors/admins publish

The member dashboard derives Recent Contributors from `creditedProfiles` on
viewer-visible, published activity items from the last 90 days. Newer activity
is ordered first, so contributors from the first 30 days take priority before
older qualifying activity fills the remaining positions. It keeps the latest
qualifying activity per profile and shows at most eight profiles.
`relatedProfiles` alone must not qualify someone as a recent contributor. When
there are no qualifying contributors, the same dashboard surface becomes a
clearly labeled Meet Members fallback containing active, viewer-visible,
non-private profiles; it must not imply those profiles recently contributed.

#### `threads`

Purpose: persistent storylines that connect activity across briefs and project spikes.

Fields:

- `title`: text, required
- `slug`: generated, unique
- `summary`: textarea, required
- `threadStatus`: select: `active`, `paused`, `resolved`, `archived`
- `lastActiveAt`: date
- `participants`: relationship to `profiles`, has many
- `relatedProjects`: relationship to `projects`, has many
- `links`: array of label and safe URL
- `visibility`: `public`, `authenticated`, `admin`
- drafts/publishing

Avoid tasks, assignments, and due dates in the first version.

Relationship rules:

- Threads can relate to multiple projects.
- Threads can exist without a project when they represent cohort-wide continuity.
- Threads can have related activity items and sessions/events through those collections.
- Do not support threads of threads in the MVP. Use sibling threads or links instead.
- Do not support project hierarchies in the MVP. Future `track`, `initiative`, or `program` concepts should be introduced only when a real portal view needs them.

#### `events`

Purpose: make the next session visible and easy to add to a personal calendar.

Fields:

- `title`: text, required
- `sessionType`: `brownbag`, `workshop`, `all-hands`, `demo`, `pitch`, `fireside`
- `startsAt`: date, required
- `endsAt`: date, optional
- `hostProfiles`: relationship to `profiles`, has many
- `speakerProfiles`: relationship to `profiles`, has many. This stores guest/speaker profiles from the frontend `guests` payload until the underlying Payload field is renamed.
- `locationLabel`: text, optional
- `joinURL`: text, optional safe URL
- `calendarURL`: text, optional safe URL
- `discordEventURL`: text, optional safe URL
- `discordScheduledEventID`: text, optional
- `discordSyncStatus`: `not_configured`, `synced`, `failed`
- `discordSyncError`: textarea, optional
- `relatedProjects`: relationship to `projects`, has many
- `relatedThreads`: relationship to `threads`, has many
- `seriesKey`, `seriesTitle`, `recurrenceCadence`, `recurrenceUntil`: optional recurrence metadata copied between event records
- `visibility`: `public`, `authenticated`, `member`, `admin`

MVP requirement: support external calendar and Discord event links before
building native calendar subscription logic. Contributors should be able to
create a basic future session from `/events/new`; Payload admin remains
available for full editorial control and past-session enrichment. The session
list should separate live, upcoming, and past sessions.

Agent-created Events use read-before-retry idempotency: ambiguous transport
failures require an equivalent-record search, one match is reused, and multiple
matches stop for human review. Duplicate cleanup is limited to exact IDs
approved by an editor/admin after canonical-link and orphan checks, followed by
readback proving the canonical Event remains linked and the duplicate is gone.

## Implementation Phases

### Phase 1: Spec-Aligned UI on Existing Data

- Rework authenticated dashboard or home page into the Update Brief view.
- Use the latest `dailyBriefs` record for TL;DR.
- Use current `dailyBriefs.sections` as temporary activity/engagement content.
- Rework `/projects` copy from generic showcase to active project spikes.
- Add `/projects/[slug]` using existing `projects` fields.
- Keep all new UI backed by existing collections where possible.

This phase can ship without migrations.

### Phase 2: Add Activity, Threads, and Events

- Add `activityItems`, `threads`, and `events` collections.
- Add relationships from `dailyBriefs` and `projects`.
- Generate Payload types.
- Add migrations.
- Seed session-grounded activity, threads, and event examples.

### Phase 3: Replace Temporary Content Wiring

- Render Recent Activity from `activityItems`.
- Render Active Threads from `threads`.
- Render top-strip next-session data from `events`.
- Render Ways to Engage from brief/project action arrays.
- Link project cards to `/projects/[slug]`.

### Phase 4: E2E Verification and Contributor Workflow

- Add tests for public brief visibility.
- Add tests for authenticated brief visibility.
- Add tests for project index/detail navigation.
- Add tests for seeded activity/thread/event content.
- Add board/issues for parallel contributors.

## Visual Direction

Tone:

- hacker newsroom
- bulletin board
- active build space

Avoid:

- SaaS dashboard polish
- course-platform layout
- oversized marketing hero
- handbook-first structure
- decorative metrics

Use:

- dark/neutral base
- restrained RaidGuild accent
- simple tags
- feed cards
- avatar rows
- plain timestamps
- direct CTAs

## Acceptance Criteria

The MVP is ready when:

- A visitor can understand current cohort activity from the first screen.
- The latest brief includes real, dated, human-readable activity.
- A user can find the next session and calendar action immediately.
- Project spikes show status, contributors, current state, activity, and ways to contribute.
- Threads show continuity across meetings and projects.
- The UI does not imply task management features that do not exist.
- Seeded content reflects the May 11, 2026 cohort voice meeting.
- Public/authenticated/admin visibility rules are respected.
- Public Posts can contextualize approved interactive workshop artifacts in a
  scripts-only sandbox without executing arbitrary CMS HTML on the Portal origin.
- Interactive artifacts remain on the separate RaidGuild artifact origin and
  enter Posts only through the `interactiveEmbed` rich-text block. Editors and
  agents cannot paste arbitrary HTML or JavaScript, relax exact-origin
  validation, or grant same-origin, navigation, form, popup, or Portal API
  capabilities. Published results that must remain reproducible use stable,
  versioned artifact paths.
- Relevant Playwright e2e coverage passes with `corepack pnpm test:e2e`.

## Open Decisions

- Should the Update Brief replace the public home page, the authenticated dashboard, or both?
- Should activity items require editorial publishing, or can trusted contributors publish them directly?
- Should events be a local collection only, or eventually sync from Discord/calendar sources?
- Should `threads` have standalone pages in MVP, or remain cards that link later?
- Should `projectStatus` be migrated from `active/exploratory/archived` to `exploring/building/shipping/archived` immediately?

## Recommended Next Implementation Task

Start with Phase 1:

- Reframe the current home/dashboard as the Update Brief.
- Reframe `/projects` as project spikes.
- Add `/projects/[slug]`.
- Use existing `dailyBriefs` and `projects` data first.

This proves the shape with minimal migration risk, then the data model can be expanded once the team confirms the surface is useful.
