# RaidGuild Cohort Hub Feature Spec

## Status

Planned / future. This document defines a reusable Portal feature for launching,
running, and archiving RaidGuild program cohorts. No primary implementation
exists yet.

This feature is distinct from the cohort project spike that originally shaped
the Portal product. In this document, a `Cohort` is a named, scheduled RaidGuild
program that people can commit to attend.

## Product Intent

Portal should give each RaidGuild cohort one durable home at:

```txt
/cohorts/[slug]
```

The same page should support the full program lifecycle:

- introduce and share an upcoming cohort
- explain its theme, format, examples, and expectations
- let authenticated people with Profiles commit to participate
- show the current or next cohort from the authenticated Brief/dashboard
- make cohort-specific sessions and the next live action easy to find
- accumulate related Posts, Projects, Threads, Modules, Briefs, and session
  artifacts while the cohort is active
- remain useful as a public record after the cohort is complete

The result should feel like a cohort-scoped activity hub, not a one-time
marketing page, application tracker, course platform, or project-management
system.

## Product Classification

Implement Cohorts as a feature module inside the Portal application.

The feature needs dedicated collections because cohorts and commitments have
their own lifecycle, permissions, filtering, relationships, admin management,
and future API use. A Cohort should not be modeled as a Thread, Project, Brief,
or entry in the existing Modules directory.

Existing Portal primitives keep their current responsibilities:

```txt
Cohort = durable program identity, framing, dates, and enrollment state
Event = scheduled or recorded cohort session
Brief = dated factual update related to a cohort
Thread = persistent line of thought that develops during the cohort
Project = concrete collaboration surface produced or advanced by the cohort
Post = reviewed editorial material, guide, example, or retrospective
Module = reusable Portal tool relevant to cohort participants
Profile = participant identity
Cohort Commitment = explicit intent by one Profile to attend one Cohort
```

## Core Experience

### Public And Shareable Cohort Page

The cohort page should be publicly readable when its visibility permits. A
visitor should be able to understand and share the cohort without creating an
account.

Authentication and a linked Profile are required only when the visitor commits
to participate. Related records must continue to enforce their own visibility
rules.

Recommended page composition:

1. themed cohort hero, number, status, dates, and primary CTA
2. commitment state or signup CTA
3. live or next-session card with join and calendar actions
4. cohort-specific weekly schedule
5. current cohort update, when a related Brief exists
6. theme, thesis, and starter topics
7. program details and participation expectations
8. related or featured Projects and Threads
9. related Posts, examples, and guides
10. useful Modules
11. past sessions, recordings, summaries, slides, and artifacts
12. participant display only when visibility and consent policy allow it

### Page Lifecycle

The route and cohort record remain stable as the program changes state.

#### Upcoming

Prioritize:

- theme and invitation
- dates and program format
- examples and starter topics
- enrollment timing
- commitment CTA when enrollment is open

#### Active

Prioritize:

- live or next session
- this week's schedule
- latest cohort-related Brief
- active Projects and Threads
- new Posts, Modules, and artifacts
- the viewer's existing commitment state

#### Complete

Prioritize:

- outcomes and retrospective framing
- resulting Projects and Posts
- past sessions and useful artifacts
- recordings, summaries, and durable Threads
- next-cohort interest CTA when appropriate

Do not replace the recruitment page with a separate active or archive page.
The durable route should evolve with the cohort.

## Proposed `cohorts` Collection

Collection slug:

```txt
cohorts
```

Suggested first-slice fields:

```txt
title: text, required
slug: text, required, unique
cohortNumber: number
summary: textarea
theme: text
thesis: textarea or rich text

programStatus: draft / upcoming / active / complete / archived
enrollmentStatus: closed / open / waitlist
startsAt: date
endsAt: date
enrollmentOpensAt: date
enrollmentClosesAt: date
publishedAt: date
visibility: public / authenticated / member / admin
_status: draft / published

heroMedia: relationship -> media
visualVariant: controlled select
accentTone: controlled select

participationExpectation: textarea
capacity: number, optional
starterTopics: array { title, summary, link }
programSections: array { heading, body }

highlightedThread: relationship -> threads
featuredPosts: relationship[] -> posts
featuredProjects: relationship[] -> projects
featuredModules: relationship[] -> modules
```

Keep `programStatus` separate from `enrollmentStatus`. An active cohort may have
closed enrollment, while an upcoming cohort may be published before enrollment
opens.

Capacity should only be displayed when it is factual and operationally useful.
Do not invent scarcity or urgency.

### Curated And Derived Content

The Cohort record should initially hold curated relationships for Posts,
Projects, Threads, and Modules. This gives editors control over ordering and
which records are presented as the strongest examples.

Sessions and Briefs should point back to Cohorts because those records
accumulate independently over time and should appear automatically.

If maintaining curated cohort relationships becomes burdensome, add optional
reverse cohort relationships to Posts, Projects, Threads, or Modules later.
Avoid maintaining two canonical relationship lists in the first slice.

## Sessions And Schedule

The cohort schedule must reuse the existing `events` collection. Do not store a
parallel schedule array on the Cohort record.

Add:

```txt
events.relatedCohorts: relationship[] -> cohorts
```

Use a many-value relationship so a guest talk, all-hands session, or shared
workshop can serve more than one cohort.

The cohort page queries published Events visible to the viewer where the Cohort
is related. From those records it derives:

- live session
- next upcoming session
- this week's sessions
- complete upcoming schedule
- past sessions
- recordings and follow-up artifacts

Event detail pages remain at `/events/[id]`. Join URLs, calendar actions,
speakers, recurrence, Projects, Threads, recordings, transcripts, summaries,
and resources remain owned by Event.

### Session Types

The existing reusable session types remain valid:

- brownbag
- workshop
- all-hands
- demo
- pitch
- fireside

Add generally useful types if cohort programming needs them:

- kickoff
- office-hours
- guest-talk

Use the Event title for narrower descriptions such as introductions rather
than creating a type for every agenda variation.

### Reusable Schedule UI

Generalize the existing authenticated dashboard weekly schedule component
instead of copying it into the Cohort feature.

Conceptual API:

```tsx
<WeeklySessionStrip
  events={cohortEvents}
  heading="Cohort 8 Schedule"
  scheduleHref="/cohorts/agentic-guild-operations#schedule"
/>
```

The global dashboard passes guild-wide Events. A Cohort page passes only Events
related to that Cohort. Extract the live/next-session presentation for the same
reason.

## Brief Integration

Add an optional cohort relationship to Briefs when editors need
cohort-specific updates:

```txt
dailyBriefs.relatedCohorts: relationship[] -> cohorts
```

The Cohort page may show the newest visible related Brief as its current update.
Do not embed an ever-growing update log in the Cohort record.

### Authenticated Brief/Dashboard Spotlight

The existing `Next Profile Step` area has room for a second, higher-emphasis
card. Change that section into a responsive two-card next-step row:

```txt
Next Profile Step | Current or Next Cohort
```

The cohort card should use the current Portal visual language with a stronger
accent border, controlled themed background, status pill, and concise theme
copy.

Resolve the featured cohort in this order:

1. published cohort with open enrollment
2. published active cohort
3. next published upcoming cohort
4. no scheduled cohort fallback

If a future cohort has open enrollment while another cohort is active, favor
the open enrollment action. A later iteration may add an explicit editorial
priority if automatic selection proves insufficient.

Recommended states:

| State | Example heading | Primary action |
| --- | --- | --- |
| Enrollment open | `Join Cohort 8` | View and commit |
| Upcoming | `Next cohort: Cohort 8` | Explore the cohort |
| Active | `Cohort 7 is underway` | Follow the cohort |
| No cohort scheduled | `Interested in the next cohort?` | Signal interest |

Profile-aware CTA behavior:

| Viewer state | CTA behavior |
| --- | --- |
| Profile exists and enrollment is open | `Join the cohort` |
| No Profile | `Complete profile to join` |
| Already committed | `Open your cohort` |
| Withdrawn and enrollment remains open | `Rejoin cohort` |
| Enrollment closed | `Follow the cohort` |

The dashboard card is a discovery surface. Commitment confirmation stays on
the Cohort page.

## Commitment Flow

Recommended flow:

```txt
Public cohort page
  -> logged out: login or signup with next=/cohorts/[slug]
  -> authenticated without Profile: profile creation with return path
  -> authenticated with Profile: review expectations
  -> explicit commitment confirmation
  -> cohort page success state
```

The confirmation step must show dates, participation expectations, and what
`commit` means. People must be able to withdraw their own commitment.

For the first slice, requiring a linked Profile is sufficient. Do not introduce
an arbitrary profile-completeness score unless real enrollment operations need
one.

## Proposed `cohortCommitments` Collection

Collection slug:

```txt
cohortCommitments
```

Suggested fields:

```txt
cohort: relationship -> cohorts, required
profile: relationship -> profiles, required
status: committed / waitlisted / withdrawn
shortResponse: textarea, optional
expectationsAcknowledgedAt: date
committedAt: date
withdrawnAt: date
createdAt
updatedAt
```

Rules:

- enforce one commitment record per Profile and Cohort
- do not duplicate name, email, skills, or other Profile data
- allow the owning authenticated user to create and withdraw their commitment
- allow admins/editors to review and manage commitments
- do not infer a commitment from page views, inquiries, session attendance, or
  Discord activity
- do not publish participant lists without an explicit visibility and consent
  decision

An optional short prompt such as `What do you hope to explore?` is acceptable.
Do not turn the commitment flow into an application or selection workflow
unless cohort operations genuinely require one.

## No Scheduled Cohort And Interest

When no current or upcoming cohort exists, the dashboard card and completed
cohort pages should offer a truthful interest path instead of an inactive signup
button.

First-slice fallback:

```txt
/inquire/general?context=cohort-interest
```

The inquiry page and saved source context should clearly identify this as
interest in a future cohort. Prefill authenticated user/Profile context where
the existing inquiry flow permits it.

If recurring interest becomes an operational signal that needs one-click
capture, filtering, deduplication, or conversion tracking, add a small
`cohortInterests` collection related to Profile. Do not use a cohort commitment
without a real Cohort, and do not add the collection before the lifecycle is
needed.

## Visual System And Reusable Template

Each cohort should feel distinct without allowing arbitrary CMS-controlled CSS.

Use controlled presentation fields such as:

- visual variant
- accent tone
- hero media
- optional motif or illustration

Map these fields to repository-owned components and design tokens. The page
template, accessibility behavior, responsive layout, and core information
hierarchy stay consistent across cohorts.

Do not create a bespoke route component for every cohort. Add a new controlled
variant only when the existing template cannot express a meaningful program
difference.

## Access And Visibility

### Cohorts

- public viewers can read published public Cohorts
- authenticated/member/admin visibility follows existing Portal rules
- admins/editors manage Cohort records
- contributor creation or editing can be considered later if a real steward
  workflow needs it

### Commitments

- authenticated users with a linked Profile can create their own commitment
- users can read and withdraw their own commitment
- admins/editors can read and manage all commitments
- public users cannot enumerate commitments
- cohort pages must not expose private Profile or commitment information

### Related Content

Every related Event, Brief, Post, Project, Thread, Module, and Profile continues
to enforce its own visibility. A public Cohort must not leak a restricted
record's title, summary, participant list, or artifact URL.

## Analytics

Recommended Plausible events:

```txt
Cohort CTA Clicked
Cohort Commitment Started
Cohort Commitment Created
Cohort Commitment Withdrawn
Cohort Interest Clicked
Cohort Session Clicked
```

Useful non-personal properties:

```txt
cohort_slug
cohort_number
cohort_status
placement
target_path
session_type
```

Do not send names, email addresses, free-text responses, or Profile content to
Plausible.

## Non-Goals

- No task boards, assignments, sprint state, or issue tracking.
- No attendance grading or course completion system.
- No learning management system or curriculum engine.
- No Discord replacement or cohort chat system.
- No inferred commitments or invented participant activity.
- No automated participant ranking.
- No arbitrary per-cohort CSS or custom code entered through the CMS.
- No parallel cohort calendar separate from Events.
- No duplicated Post, Project, Thread, Module, Brief, or Profile behavior.
- No application-review workflow in the first slice.
- No waitlist automation until capacity and selection rules are real.

## Recommended Implementation Slices

### Slice 1: Cohort Hub And Commitment

- add `cohorts`
- add `cohortCommitments`
- add `/cohorts/[slug]`
- render themed hero, core program sections, and curated related content
- enforce public-read and authenticated/Profile-gated commitment behavior
- support commitment creation, existing state, and withdrawal
- add dashboard cohort spotlight and no-cohort interest fallback
- add Plausible events
- add deterministic seed data and end-to-end coverage

### Slice 2: Cohort Schedule

- relate Events to Cohorts
- add kickoff, office-hours, and guest-talk types if confirmed
- generalize the weekly schedule and next-session components
- render live, upcoming, weekly, and past cohort sessions
- preserve Event join, calendar, visibility, speaker, and artifact behavior

Slice 1 and Slice 2 may ship together if schedule visibility is necessary for
the first cohort launch.

### Slice 3: Living Record

- relate Briefs to Cohorts
- show the latest cohort update
- improve past-session artifact presentation
- add editorial tooling for featured outcomes and retrospectives
- evaluate reverse relationships only after observing editor workflow

### Slice 4: Proven Operational Needs

- dedicated cohort-interest records, if inquiry reuse is insufficient
- participant display with explicit consent rules
- real capacity and waitlist behavior
- explicit editorial cohort selection on the dashboard
- cohort listing/archive route if multiple completed records justify it

## First-Slice Acceptance Criteria

- A published public Cohort has a stable, shareable `/cohorts/[slug]` page.
- The page explains the theme, schedule window, expectations, starter topics,
  and related Portal content.
- Anonymous visitors can view the page but cannot create a commitment.
- Login and profile creation preserve a return path to the Cohort.
- A Profile can create at most one commitment for a Cohort.
- The Profile owner can see and withdraw their commitment.
- The authenticated dashboard highlights the most relevant current or next
  Cohort using the defined state priority.
- When no Cohort is scheduled, the dashboard offers a working, source-labeled
  interest path.
- Cohort-related sessions come from Events and expose working detail, join, and
  calendar actions.
- Restricted related records do not leak through a more-public Cohort page.
- Cohort pages remain useful after completion by presenting past sessions and
  durable outcomes.
- Seed behavior is deterministic and does not introduce test-only production
  behavior.
- End-to-end coverage verifies public view, login return, Profile gate,
  commitment creation, duplicate prevention, withdrawal, dashboard selection,
  no-cohort fallback, schedule filtering, and visibility boundaries.

## Open Questions

- What is the first cohort's official number, slug, title, theme, dates, and
  participation expectation?
- Is enrollment always open commitment, or will any cohort require real
  capacity, waitlist, or selection rules?
- Should participant identities ever be visible publicly, only to committed
  participants, or only to admins?
- Should cohort-related Briefs be public, authenticated, or chosen per Brief?
- Can one Profile commit to overlapping Cohorts?
- Which roles may create and curate Cohorts before a dedicated cohort-steward
  workflow is justified?
- Is the general inquiry fallback sufficient for the first unscheduled period?
- Should the first implementation include a `/cohorts` archive, or wait until a
  second durable cohort record exists?
