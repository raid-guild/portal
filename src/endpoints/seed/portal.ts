import type { CollectionSlug, Payload, PayloadRequest } from 'payload'

import { badges } from './badges'
import { dailyBrief } from './daily-brief'
import { headingNode, lexicalRoot, paragraphNode, text } from './lexical'

type UpsertArgs = {
  collection: CollectionSlug
  data: Record<string, unknown>
  match: Record<string, unknown>
  payload: Payload
}

const publishedAt = '2026-05-11T17:34:47.664Z'
const sessionEndedAt = '2026-05-11T17:34:47.664Z'
const nextSessionCalendarURL = 'https://calendar.google.com'
const nextSessionJoinURL = 'https://discord.com'

const findOne = async ({ collection, match, payload }: Omit<UpsertArgs, 'data'>) => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: Object.entries(match).reduce<Record<string, { equals: unknown }>>(
      (where, [field, value]) => ({
        ...where,
        [field]: {
          equals: value,
        },
      }),
      {},
    ),
  })

  return result.docs[0] || null
}

const upsert = async ({ collection, data, match, payload }: UpsertArgs) => {
  const existing = await findOne({ collection, match, payload })

  if (existing) {
    return payload.update({
      id: existing.id,
      collection,
      data,
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection,
    data,
    depth: 0,
    overrideAccess: true,
  })
}

export const seedPortalContent = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const previousDisableSearchSync = req.context.disableSearchSync
  const previousDisableRevalidate = req.context.disableRevalidate

  try {
    req.context.disableSearchSync = true
    req.context.disableRevalidate = true
    payload.logger.info('Upserting portal starter content...')

    const [frontendSkill, projectManagerSkill, communitySkill] = await Promise.all([
      upsert({
        collection: 'profileSkills',
        match: { slug: 'frontend-dev' },
        payload,
        data: {
          title: 'Frontend Dev',
          slug: 'frontend-dev',
          category: 'Engineering',
          description: 'Builds usable portal views and interaction flows.',
        },
      }),
      upsert({
        collection: 'profileSkills',
        match: { slug: 'project-manager' },
        payload,
        data: {
          title: 'Project Manager',
          slug: 'project-manager',
          category: 'Coordination',
          description: 'Keeps scope, ownership, and contributor workstreams clear.',
        },
      }),
      upsert({
        collection: 'profileSkills',
        match: { slug: 'community' },
        payload,
        data: {
          title: 'Community',
          slug: 'community',
          category: 'Coordination',
          description: 'Connects contributors, sessions, onboarding, and async context.',
        },
      }),
    ])

    await Promise.all([
      upsert({
        collection: 'profileRoles',
        match: { slug: 'warrior' },
        payload,
        data: {
          title: 'Warrior',
          slug: 'warrior',
          type: 'Builder',
          group: 'builder',
          description: 'Ships concrete work in projects and client-facing delivery.',
        },
      }),
      upsert({
        collection: 'profileRoles',
        match: { slug: 'monk' },
        payload,
        data: {
          title: 'Monk',
          slug: 'monk',
          type: 'Support',
          group: 'support',
          description: 'Stewards knowledge, onboarding, and shared operating context.',
        },
      }),
    ])

    await Promise.all(
      badges.map((badge) =>
        upsert({
          collection: 'badges',
          match: { slug: badge.slug },
          payload,
          data: badge,
        }),
      ),
    )

    const portalUpdatePost = await upsert({
      collection: 'posts',
      match: { slug: 'cohort-project-spike-portal-update' },
      payload,
      data: {
        title: 'Cohort Project Spike Portal Update',
        slug: 'cohort-project-spike-portal-update',
        content: lexicalRoot([
          headingNode('h2', [text('Cohort project spike portal update')]),
          paragraphNode(
            'The portal starter content focuses on live cohort primitives: projects, threads, sessions, activity, and a brief that shows what is happening.',
          ),
        ]),
        authors: req.user ? [req.user.id] : undefined,
        meta: {
          description: 'A portal update for validating public post, comment, and moderation flows.',
        },
        visibility: 'public',
        _status: 'published',
        publishedAt,
      },
    })

    const cohortProject = await upsert({
      collection: 'projects',
      match: { slug: 'cohort-project-spike-portal' },
      payload,
      data: {
        title: 'Cohort Project Spike Portal',
        slug: 'cohort-project-spike-portal',
        summary:
          'A lightweight portal that surfaces active project spikes, recent activity, threads, events, and ways to contribute.',
        projectStatus: 'building',
        currentState: [
          {
            body: 'Base primitives are being scaffolded around briefs, projects, activity, threads, and events.',
          },
          {
            body: 'The group aligned on surfacing project state without turning the portal into project management software.',
          },
          {
            body: 'Next useful step is rendering real seeded activity and next-session CTAs in the app.',
          },
        ],
        lastActiveAt: sessionEndedAt,
        primaryCTA: {
          label: 'Join Project',
          url: '/projects/cohort-project-spike-portal',
        },
        profileSkills: [frontendSkill.id, projectManagerSkill.id, communitySkill.id],
        resources: [
          {
            label: 'Implementation spec',
            url: 'https://github.com/raidguild/portal',
            resourceType: 'doc',
          },
          {
            label: 'Contributor guidelines',
            url: 'https://github.com/raidguild/portal',
            resourceType: 'doc',
          },
        ],
        contributionActions: [
          {
            title: 'Render the Update Brief',
            description:
              'Show recent activity, active threads, and next-session CTAs from Payload.',
            url: '/',
          },
          {
            title: 'Build the Project Detail Page',
            description: 'Surface current state, related events, threads, resources, and actions.',
            url: '/projects/cohort-project-spike-portal',
          },
          {
            title: 'Add Session-Grounded Seeds',
            description:
              'Keep seed data tied to real cohort discussion instead of placeholder copy.',
            url: '/admin/collections/activityItems',
          },
        ],
        _status: 'published',
        publishedAt,
      },
    })

    const [projectObjectThread, calendarThread, ownershipThread, onboardingThread] =
      await Promise.all([
        upsert({
          collection: 'threads',
          match: { slug: 'defining-the-project-spike-object' },
          payload,
          data: {
            title: 'Defining the project spike object',
            slug: 'defining-the-project-spike-object',
            summary:
              'Clarifying what a project is in the portal: a live collaboration surface, not a task board.',
            threadStatus: 'active',
            lastActiveAt: sessionEndedAt,
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt,
          },
        }),
        upsert({
          collection: 'threads',
          match: { slug: 'calendar-and-session-coordination' },
          payload,
          data: {
            title: 'Calendar and session coordination',
            slug: 'calendar-and-session-coordination',
            summary: 'Making the next live moment visible and easy to add to personal calendars.',
            threadStatus: 'active',
            lastActiveAt: sessionEndedAt,
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt,
          },
        }),
        upsert({
          collection: 'threads',
          match: { slug: 'contribution-ownership-and-repo-workstreams' },
          payload,
          data: {
            title: 'Contribution ownership and repo workstreams',
            slug: 'contribution-ownership-and-repo-workstreams',
            summary:
              'Reducing duplicated work by defining ownership, issue structure, and shared repo boundaries.',
            threadStatus: 'active',
            lastActiveAt: sessionEndedAt,
            relatedProjects: [cohortProject.id],
            visibility: 'authenticated',
            _status: 'published',
            publishedAt,
          },
        }),
        upsert({
          collection: 'threads',
          match: { slug: 'improving-onboarding-flow' },
          payload,
          data: {
            title: 'Improving onboarding flow',
            slug: 'improving-onboarding-flow',
            summary:
              'Creating a clearer entry path beyond Discord so new contributors know what is live and where to start.',
            threadStatus: 'active',
            lastActiveAt: sessionEndedAt,
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt,
          },
        }),
      ])

    const nextCohortEvent = await upsert({
      collection: 'events',
      match: { title: 'Cohort Project Spike Sync' },
      payload,
      data: {
        title: 'Cohort Project Spike Sync',
        summary:
          'Follow-up sync to review scaffolding, work ownership, and the first rendered brief/project surfaces.',
        startsAt: '2026-06-03T17:00:00.000Z',
        endsAt: '2026-06-03T18:00:00.000Z',
        sessionType: 'workshop',
        locationLabel: 'Discord #cohort-voice',
        joinURL: nextSessionJoinURL,
        calendarURL: nextSessionCalendarURL,
        discordEventURL: 'https://discord.com',
        relatedProjects: [cohortProject.id],
        relatedThreads: [projectObjectThread.id, calendarThread.id, ownershipThread.id],
        visibility: 'public',
        _status: 'published',
        publishedAt,
      },
    })

    await Promise.all([
      upsert({
        collection: 'modules',
        match: { slug: 'infinite-wiki' },
        payload,
        data: {
          name: 'Infinite Wiki',
          slug: 'infinite-wiki',
          summary:
            'A source-backed knowledge module for turning reviewed community memory into durable topic pages.',
          status: 'experimental',
          visibility: 'authenticated',
          enabled: true,
          featured: true,
          sortOrder: 10,
          specURL:
            'https://github.com/raid-guild/portal/blob/staging/docs/infinite-wiki-feature-spec.md',
          sourceProject: cohortProject.id,
          relatedProjects: [cohortProject.id],
          relatedThreads: [projectObjectThread.id],
          ownedCollections: [
            {
              collectionSlug: 'wikiPages',
            },
          ],
          corePrimitiveRelationships: [
            { primitive: 'project' },
            { primitive: 'thread' },
            { primitive: 'event' },
            { primitive: 'profile' },
            { primitive: 'post' },
          ],
          graduationCriteria:
            'Members use reviewed pages for project and session context, and editors can reject or improve generated drafts from clear source references.',
          riskNotes:
            'Must not publish generated pages without review or leak private/member-only source material.',
          lastReviewedAt: '2026-05-29T00:00:00.000Z',
        },
      }),
      upsert({
        collection: 'modules',
        match: { slug: 'bounty-board' },
        payload,
        data: {
          name: 'Bounty Board',
          slug: 'bounty-board',
          summary:
            'A future contribution module for surfacing scoped opportunities, rewards, and claims without turning projects into task boards.',
          status: 'idea',
          visibility: 'authenticated',
          enabled: true,
          sortOrder: 20,
          sourceProject: cohortProject.id,
          relatedProjects: [cohortProject.id],
          relatedThreads: [ownershipThread.id],
          corePrimitiveRelationships: [
            { primitive: 'project' },
            { primitive: 'thread' },
            { primitive: 'profile' },
            { primitive: 'activityItem' },
          ],
          graduationCriteria:
            'The portal has repeated contribution requests that need their own lifecycle beyond project CTAs.',
        },
      }),
      upsert({
        collection: 'modules',
        match: { slug: 'leaderboard' },
        payload,
        data: {
          name: 'Leaderboard',
          slug: 'leaderboard',
          summary:
            'A future recognition module for exploring aggregate contribution signals without making points the primary community goal.',
          status: 'idea',
          visibility: 'authenticated',
          enabled: true,
          sortOrder: 30,
          relatedProjects: [cohortProject.id],
          corePrimitiveRelationships: [{ primitive: 'profile' }, { primitive: 'activityItem' }],
          graduationCriteria:
            'Recognition signals prove useful for discovery and celebration without incentivizing low-quality activity.',
          riskNotes:
            'Avoid broad ranking dynamics until points, badges, and props have stable meaning.',
        },
      }),
    ])

    const activityItems = await Promise.all([
      upsert({
        collection: 'activityItems',
        match: {
          title: 'Group narrowed the portal around project spikes instead of broad PM tooling.',
        },
        payload,
        data: {
          title: 'Group narrowed the portal around project spikes instead of broad PM tooling.',
          body: 'The MVP should surface active work, state, events, and contribution paths without becoming a task manager.',
          activityType: 'decision',
          happenedAt: '2026-05-11T17:00:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: projectObjectThread.id,
          relatedEvent: nextCohortEvent.id,
          visibility: 'public',
          _status: 'published',
          publishedAt,
        },
      }),
      upsert({
        collection: 'activityItems',
        match: { title: 'Calendar-first participation was called out as a core need.' },
        payload,
        data: {
          title: 'Calendar-first participation was called out as a core need.',
          body: 'Events should make it easy for people to add session data to their own calendars instead of relying on portal visits alone.',
          activityType: 'insight',
          happenedAt: '2026-05-11T17:12:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: calendarThread.id,
          relatedEvent: nextCohortEvent.id,
          visibility: 'public',
          _status: 'published',
          publishedAt,
        },
      }),
      upsert({
        collection: 'activityItems',
        match: { title: 'Need for a clear owner and issue structure surfaced as a blocker.' },
        payload,
        data: {
          title: 'Need for a clear owner and issue structure surfaced as a blocker.',
          body: 'Contributors want to help, but the shared repo needs clearer workstreams to avoid duplicate or conflicting implementation.',
          activityType: 'blocker',
          happenedAt: '2026-05-11T17:20:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: ownershipThread.id,
          visibility: 'authenticated',
          _status: 'published',
          publishedAt,
        },
      }),
      upsert({
        collection: 'activityItems',
        match: { title: 'Portal positioned as a pre-Discord discovery surface.' },
        payload,
        data: {
          title: 'Portal positioned as a pre-Discord discovery surface.',
          body: 'The group identified Discord as too overwhelming for first touch, so the portal should show what is live and how to join.',
          activityType: 'insight',
          happenedAt: '2026-05-11T17:28:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: onboardingThread.id,
          visibility: 'public',
          _status: 'published',
          publishedAt,
        },
      }),
    ])

    await payload.update({
      id: cohortProject.id,
      collection: 'projects',
      data: {
        activityItems: activityItems.map((item) => item.id),
        threads: [
          projectObjectThread.id,
          calendarThread.id,
          ownershipThread.id,
          onboardingThread.id,
        ],
        events: [nextCohortEvent.id],
      },
      depth: 0,
      overrideAccess: true,
    })

    await upsert({
      collection: 'dailyBriefs',
      match: { title: dailyBrief.title },
      payload,
      data: {
        ...dailyBrief,
        authors: req.user ? [req.user.id] : undefined,
        statusLabel: 'Active Now',
        focusLabel: 'Project Spike Portal',
        nextEvent: nextCohortEvent.id,
        activityItems: activityItems.map((item) => item.id),
        threads: [
          projectObjectThread.id,
          calendarThread.id,
          ownershipThread.id,
          onboardingThread.id,
        ],
        engagementActions: [
          {
            label: 'Join next session',
            description: 'Jump into the next cohort voice sync.',
            url: nextSessionJoinURL,
            style: 'primary',
          },
          {
            label: 'Add to calendar',
            description: 'Put the next sync on your own calendar.',
            url: nextSessionCalendarURL,
            style: 'secondary',
          },
          {
            label: 'View project spike',
            description: 'See the current project state and ways to contribute.',
            url: '/projects/cohort-project-spike-portal',
            style: 'secondary',
          },
        ],
        relatedProjects: [cohortProject.id],
        relatedPosts: [portalUpdatePost.id],
      },
    })

    await upsert({
      collection: 'dailyBriefs',
      match: { title: 'Weekly Brief: Project Spike Momentum' },
      payload,
      data: {
        title: 'Weekly Brief: Project Spike Momentum',
        briefDate: '2026-05-11T12:00:00.000Z',
        briefType: 'weekly',
        summary:
          'This week the cohort narrowed the portal around live project spikes, public sessions, and clear ways to join active work.',
        statusLabel: 'Weekly',
        focusLabel: 'Project Spike Portal',
        sections: [
          {
            heading: 'Project spikes over project management',
            body: 'The group aligned on surfacing project state, threads, activity, and contribution paths without building a heavy task system.',
          },
          {
            heading: 'Calendar is the public pull',
            body: 'Upcoming sessions need to be visible and easy to add to a personal calendar so participation does not depend on Discord discovery.',
          },
          {
            heading: 'Join after seeing signal',
            body: 'The public page should show real activity first, then route people into the portal when they are ready to participate.',
          },
        ],
        content: lexicalRoot([
          headingNode('h2', [text('Project spike momentum')]),
          paragraphNode(
            'The weekly brief is the public version of the cohort snapshot. It should be useful on its own while pointing people toward joining for daily context and contribution paths.',
          ),
        ]),
        mediaType: 'remotion-scene',
        nextEvent: nextCohortEvent.id,
        activityItems: activityItems.map((item) => item.id),
        threads: [projectObjectThread.id, calendarThread.id, onboardingThread.id],
        engagementActions: [
          {
            label: 'Join RaidGuild',
            description: 'Create an account to follow daily briefs and contribution paths.',
            url: '/join',
            style: 'primary',
          },
          {
            label: 'View sessions',
            description: 'See upcoming public sessions and calendar links.',
            url: '/events',
            style: 'secondary',
          },
        ],
        visibility: 'public',
        sourceNotes:
          'Public weekly starter brief assembled from the cohort project spike planning session.',
        authors: req.user ? [req.user.id] : undefined,
        relatedProjects: [cohortProject.id],
        relatedPosts: [portalUpdatePost.id],
        _status: 'published',
        publishedAt,
      },
    })

    payload.logger.info('Portal starter content upserted successfully.')
  } finally {
    req.context.disableSearchSync = previousDisableSearchSync
    req.context.disableRevalidate = previousDisableRevalidate
  }
}
