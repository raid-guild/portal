import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  PayloadRequest,
  File,
  RequiredDataFromCollectionSlug,
} from 'payload'
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { dailyBrief } from './daily-brief'
import { badges } from './badges'
import { home } from './home'
import { image2 } from './image-2'
import { headingNode, lexicalRoot, paragraphNode, text } from './lexical'
import { profileRoles } from './profile-roles'
import { profileSkills } from './profile-skills'

const collections: CollectionSlug[] = [
  'activityItems',
  'profileBadges',
  'badges',
  'modules',
  'pageCopy',
  'notifications',
  'notificationPreferences',
  'contributionRequests',
  'categories',
  'dailyBriefs',
  'events',
  'projects',
  'profiles',
  'profileSkills',
  'profileRoles',
  'threads',
  'media',
  'pages',
  'posts',
  'forms',
  'form-submissions',
  'search',
]
const globals: GlobalSlug[] = ['header', 'footer']

const seedDirectory = path.dirname(fileURLToPath(import.meta.url))

const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const isDefined = <T>(value: T | null | undefined): value is T => value != null

async function fetchFileByURL(url: string): Promise<File> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
    signal: controller.signal,
  })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timed out fetching file from ${url}`)
      }

      throw error
    })
    .finally(() => clearTimeout(timeout))

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()
  const ext = path.extname(new URL(url).pathname).toLowerCase()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: mimeTypes[ext] || 'application/octet-stream',
    size: data.byteLength,
  }
}

async function loadSeedFile(filename: string, outputName = filename): Promise<File> {
  const filePath = path.join(seedDirectory, filename)
  const data = await fs.readFile(filePath)
  const ext = path.extname(filename).toLowerCase()

  return {
    name: outputName,
    data,
    mimetype: mimeTypes[ext] || 'application/octet-stream',
    size: data.byteLength,
  }
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const previousDisableSearchSync = req.context.disableSearchSync
  const previousDisableRevalidate = req.context.disableRevalidate

  try {
    const useLocalSeedMedia = process.env.USE_LOCAL_SEED_MEDIA === 'true'
    req.context.disableSearchSync = true
    req.context.disableRevalidate = true
    payload.logger.info('Seeding database...')

    // we need to clear the media directory before seeding
    // as well as the collections and globals
    // this is because while `yarn seed` drops the database
    // the custom `/api/seed` endpoint does not

    payload.logger.info(`- Clearing media...`)
    payload.logger.info(`- Clearing collections and globals...`)

    // First, clear the search collection to avoid ID conflicts
    await payload.delete({
      collection: 'search',
      where: {
        id: {
          exists: true,
        },
      },
    })

    // clear the database
    for (const global of globals) {
      await payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
      })
    }

    // Then clear other collections
    for (const collection of collections.filter((c) => c !== 'search')) {
      await payload.delete({
        collection: collection,
        where: {
          id: {
            exists: true,
          },
        },
      })
    }

    payload.logger.info(`- Seeding demo author and user...`)

    await payload.delete({
      collection: 'users',
      where: {
        email: {
          equals: 'demo-author@payloadcms.com',
        },
      },
    })

    const demoAuthor = await payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@payloadcms.com',
        password: 'password',
      },
    })

    let demoAuthorID: number | string = demoAuthor.id

    payload.logger.info(`- Seeding profile skills and roles...`)

    const createdProfileSkills = await Promise.all(
      profileSkills.map((skill) =>
        payload.create({
          collection: 'profileSkills',
          data: skill,
        }),
      ),
    )

    const createdProfileRoles = await Promise.all(
      profileRoles.map((role) =>
        payload.create({
          collection: 'profileRoles',
          data: role,
        }),
      ),
    )

    payload.logger.info(`- Seeding badges...`)

    await Promise.all(
      badges.map((badge) =>
        payload.create({
          collection: 'badges',
          data: badge,
        }),
      ),
    )

    payload.logger.info(`- Seeding media...`)

    // Load all files first
    const [imageHomeFile, image2File] = useLocalSeedMedia
      ? await Promise.all([
          loadSeedFile('raidguild-cohort-hero.webp'),
          loadSeedFile('image-post2.webp'),
        ])
      : await Promise.all([
          loadSeedFile('raidguild-cohort-hero.webp'),
          fetchFileByURL(
            'https://res.cloudinary.com/hczpmiapo/image/upload/v1732740471/Static%20assets/graphics/payload%203/payload-2-cover_ortrhb.png',
          ),
        ])

    payload.logger.info(`- Creating media documents...`)

    // Create media documents
    const [image2Doc, imageHomeDoc] = await Promise.all([
      payload.create({
        collection: 'media',
        data: image2,
        file: image2File,
      }),
      payload.create({
        collection: 'media',
        data: image2,
        file: imageHomeFile,
      }),
    ])

    let image2ID: number | string = image2Doc.id
    let imageHomeID: number | string = imageHomeDoc.id

    if (payload.db.defaultIDType === 'text') {
      image2ID = `"${image2Doc.id}"`
      imageHomeID = `"${imageHomeDoc.id}"`
      demoAuthorID = `"${demoAuthorID}"`
    }

    // Create categories
    payload.logger.info(`- Seeding categories...`)
    await Promise.all([
      payload.create({
        collection: 'categories',
        data: {
          title: 'Technology',
        },
      }),
      payload.create({
        collection: 'categories',
        data: {
          title: 'News',
        },
      }),
      payload.create({
        collection: 'categories',
        data: {
          title: 'Finance',
        },
      }),
    ])

    await Promise.all([
      payload.create({
        collection: 'categories',
        data: {
          title: 'Design',
        },
      }),
      payload.create({
        collection: 'categories',
        data: {
          title: 'Software',
        },
      }),
      payload.create({
        collection: 'categories',
        data: {
          title: 'Engineering',
        },
      }),
    ])

    payload.logger.info(`- Seeding portal update post...`)

    const portalUpdatePost = await payload.create({
      collection: 'posts',
      data: {
        title: 'Cohort Project Spike Portal Update',
        slug: 'cohort-project-spike-portal-update',
        content: lexicalRoot([
          headingNode('h2', [text('Cohort project spike portal update')]),
          paragraphNode(
            'The portal seed now focuses on live cohort primitives: projects, threads, sessions, activity, and a brief that shows what is happening.',
          ),
        ]),
        authors: [demoAuthor.id],
        meta: {
          description:
            'A seeded portal update for validating public post, comment, and moderation flows.',
        },
        visibility: 'public',
        _status: 'published',
        publishedAt: '2026-05-11T17:34:47.664Z',
      },
    })

    // Clear any existing search documents
    await payload.delete({
      collection: 'search',
      where: {
        id: {
          exists: true,
        },
      },
    })

    payload.logger.info(`- Seeding cohort spike primitives...`)

    const frontendSkill = createdProfileSkills.find((skill) => skill.slug === 'frontend-dev')
    const projectManagerSkill = createdProfileSkills.find(
      (skill) => skill.slug === 'project-manager',
    )
    const communitySkill = createdProfileSkills.find((skill) => skill.slug === 'community')
    const warriorRole = createdProfileRoles.find((role) => role.slug === 'warrior')
    const monkRole = createdProfileRoles.find((role) => role.slug === 'monk')

    const demoProfile = await payload.create({
      collection: 'profiles',
      data: {
        bio: 'Cohort contributor helping turn meeting context into a visible project spike portal.',
        claimedAt: '2026-05-11T17:34:47.664Z',
        claimStatus: 'claimed',
        displayName: 'duckanbro',
        handle: 'duckanbro',
        profileSkills: [frontendSkill?.id, projectManagerSkill?.id, communitySkill?.id].filter(
          isDefined,
        ),
        profileRoles: [warriorRole?.id, monkRole?.id].filter(isDefined),
        status: 'active',
        user: demoAuthor.id,
        visibility: 'public',
      },
    })

    const cohortProject = await payload.create({
      collection: 'projects',
      data: {
        title: 'Cohort Project Spike Portal',
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
        lastActiveAt: '2026-05-11T17:34:47.664Z',
        primaryCTA: {
          label: 'Join Project',
          url: '/projects/cohort-project-spike-portal',
        },
        contributors: [demoProfile.id],
        profileSkills: [frontendSkill?.id, projectManagerSkill?.id, communitySkill?.id].filter(
          isDefined,
        ),
        resources: [
          {
            label: 'Implementation spec',
            url: 'https://github.com/raidguild/payload-3-boilerplate',
            resourceType: 'doc',
          },
          {
            label: 'Contributor guidelines',
            url: 'https://github.com/raidguild/payload-3-boilerplate',
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
        publishedAt: '2026-05-11T17:34:47.664Z',
      },
    })

    const [projectObjectThread, calendarThread, ownershipThread, onboardingThread] =
      await Promise.all([
        payload.create({
          collection: 'threads',
          data: {
            title: 'Defining the project spike object',
            summary:
              'Clarifying what a project is in the portal: a live collaboration surface, not a task board.',
            threadStatus: 'active',
            lastActiveAt: '2026-05-11T17:34:47.664Z',
            participants: [demoProfile.id],
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt: '2026-05-11T17:34:47.664Z',
          },
        }),
        payload.create({
          collection: 'threads',
          data: {
            title: 'Calendar and session coordination',
            summary: 'Making the next live moment visible and easy to add to personal calendars.',
            threadStatus: 'active',
            lastActiveAt: '2026-05-11T17:34:47.664Z',
            participants: [demoProfile.id],
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt: '2026-05-11T17:34:47.664Z',
          },
        }),
        payload.create({
          collection: 'threads',
          data: {
            title: 'Contribution ownership and repo workstreams',
            summary:
              'Reducing duplicated work by defining ownership, issue structure, and shared repo boundaries.',
            threadStatus: 'active',
            lastActiveAt: '2026-05-11T17:34:47.664Z',
            participants: [demoProfile.id],
            relatedProjects: [cohortProject.id],
            visibility: 'authenticated',
            _status: 'published',
            publishedAt: '2026-05-11T17:34:47.664Z',
          },
        }),
        payload.create({
          collection: 'threads',
          data: {
            title: 'Improving onboarding flow',
            summary:
              'Creating a clearer entry path beyond Discord so new contributors know what is live and where to start.',
            threadStatus: 'active',
            lastActiveAt: '2026-05-11T17:34:47.664Z',
            participants: [demoProfile.id],
            relatedProjects: [cohortProject.id],
            visibility: 'public',
            _status: 'published',
            publishedAt: '2026-05-11T17:34:47.664Z',
          },
        }),
      ])

    const nextCohortEvent = await payload.create({
      collection: 'events',
      data: {
        title: 'Cohort Project Spike Sync',
        summary:
          'Follow-up sync to review scaffolding, work ownership, and the first rendered brief/project surfaces.',
        startsAt: '2026-06-03T17:00:00.000Z',
        endsAt: '2026-06-03T18:00:00.000Z',
        sessionType: 'workshop',
        speaker: demoProfile.id,
        locationLabel: 'Discord #cohort-voice',
        joinURL: 'https://discord.com',
        calendarURL: 'https://calendar.google.com',
        discordEventURL: 'https://discord.com',
        relatedProjects: [cohortProject.id],
        relatedThreads: [projectObjectThread.id, calendarThread.id, ownershipThread.id],
        relatedProfiles: [demoProfile.id],
        visibility: 'public',
        _status: 'published',
        publishedAt: '2026-05-11T17:34:47.664Z',
      },
    })

    await Promise.all([
      payload.create({
        collection: 'modules',
        data: {
          name: 'Portal Graph',
          slug: 'portal-graph',
          summary:
            'An interactive graph for exploring relationships between profiles, roles, skills, projects, sessions, and other Portal records.',
          status: 'experimental',
          visibility: 'authenticated',
          enabled: true,
          featured: true,
          sortOrder: 5,
          entryRoute: '/portal-graph',
          specURL:
            'https://github.com/raid-guild/portal/blob/main/docs/portal-graph-feature-spec.md',
          owners: [demoProfile.id],
          relatedProfiles: [demoProfile.id],
          corePrimitiveRelationships: [{ primitive: 'profile' }],
          graduationCriteria:
            'Members use the graph to discover collaborators and understand relationships across active Portal records.',
          riskNotes:
            'Keep the module read-only until profile taxonomy and matching behavior prove useful.',
          lastReviewedAt: '2026-06-01T00:00:00.000Z',
        },
      }),
      payload.create({
        collection: 'modules',
        data: {
          name: 'Infinite Wiki',
          slug: 'infinite-wiki',
          summary:
            'A source-backed knowledge module for turning reviewed community memory into durable topic pages.',
          status: 'experimental',
          visibility: 'authenticated',
          enabled: true,
          featured: true,
          sortOrder: 15,
          specURL:
            'https://github.com/raid-guild/portal/blob/main/docs/infinite-wiki-feature-spec.md',
          owners: [demoProfile.id],
          sourceProject: cohortProject.id,
          relatedProjects: [cohortProject.id],
          relatedThreads: [projectObjectThread.id],
          relatedProfiles: [demoProfile.id],
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
      payload.create({
        collection: 'modules',
        data: {
          name: 'Bounty Board',
          slug: 'bounty-board',
          summary:
            'A future contribution module for surfacing scoped opportunities, rewards, and claims without turning projects into task boards.',
          status: 'idea',
          visibility: 'authenticated',
          enabled: true,
          sortOrder: 25,
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
      payload.create({
        collection: 'modules',
        data: {
          name: 'Leaderboard',
          slug: 'leaderboard',
          summary:
            'A future recognition module for exploring aggregate contribution signals without making points the primary community goal.',
          status: 'idea',
          visibility: 'authenticated',
          enabled: true,
          sortOrder: 35,
          relatedProjects: [cohortProject.id],
          relatedProfiles: [demoProfile.id],
          corePrimitiveRelationships: [{ primitive: 'profile' }, { primitive: 'activityItem' }],
          graduationCriteria:
            'Recognition signals prove useful for discovery and celebration without incentivizing low-quality activity.',
          riskNotes:
            'Avoid broad ranking dynamics until points, badges, and props have stable meaning.',
        },
      }),
    ])

    const activityItems = await Promise.all([
      payload.create({
        collection: 'activityItems',
        data: {
          title: 'Group narrowed the portal around project spikes instead of broad PM tooling.',
          body: 'The MVP should surface active work, state, events, and contribution paths without becoming a task manager.',
          activityType: 'decision',
          happenedAt: '2026-05-11T17:00:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: projectObjectThread.id,
          relatedEvent: nextCohortEvent.id,
          relatedProfiles: [demoProfile.id],
          visibility: 'public',
          _status: 'published',
          publishedAt: '2026-05-11T17:34:47.664Z',
        },
      }),
      payload.create({
        collection: 'activityItems',
        data: {
          title: 'Calendar-first participation was called out as a core need.',
          body: 'Events should make it easy for people to add session data to their own calendars instead of relying on portal visits alone.',
          activityType: 'insight',
          happenedAt: '2026-05-11T17:12:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: calendarThread.id,
          relatedEvent: nextCohortEvent.id,
          relatedProfiles: [demoProfile.id],
          visibility: 'public',
          _status: 'published',
          publishedAt: '2026-05-11T17:34:47.664Z',
        },
      }),
      payload.create({
        collection: 'activityItems',
        data: {
          title: 'Need for a clear owner and issue structure surfaced as a blocker.',
          body: 'Contributors want to help, but the shared repo needs clearer workstreams to avoid duplicate or conflicting implementation.',
          activityType: 'blocker',
          happenedAt: '2026-05-11T17:20:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: ownershipThread.id,
          relatedProfiles: [demoProfile.id],
          visibility: 'authenticated',
          _status: 'published',
          publishedAt: '2026-05-11T17:34:47.664Z',
        },
      }),
      payload.create({
        collection: 'activityItems',
        data: {
          title: 'Portal positioned as a pre-Discord discovery surface.',
          body: 'The group identified Discord as too overwhelming for first touch, so the portal should show what is live and how to join.',
          activityType: 'insight',
          happenedAt: '2026-05-11T17:28:00.000Z',
          sourceLabel: 'Cohort Voice session',
          relatedProject: cohortProject.id,
          relatedThread: onboardingThread.id,
          relatedProfiles: [demoProfile.id],
          visibility: 'public',
          _status: 'published',
          publishedAt: '2026-05-11T17:34:47.664Z',
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
    })

    payload.logger.info(`- Seeding daily brief...`)

    const seededDailyBrief = JSON.parse(
      JSON.stringify(dailyBrief).replace(/"\{\{AUTHOR\}\}"/g, JSON.stringify(demoAuthorID)),
    )

    await payload.create({
      collection: 'dailyBriefs',
      data: {
        ...seededDailyBrief,
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
            url: nextCohortEvent.joinURL,
            style: 'primary',
          },
          {
            label: 'Add to calendar',
            description: 'Put the next sync on your own calendar.',
            url: nextCohortEvent.calendarURL,
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
        relatedProfiles: [demoProfile.id],
      },
    })

    // Create home page
    payload.logger.info(`- Seeding home page...`)

    await payload.create({
      collection: 'pages',
      data: JSON.parse(
        JSON.stringify(home)
          .replace(/"\{\{IMAGE_1\}\}"/g, String(imageHomeID))
          .replace(/"\{\{IMAGE_2\}\}"/g, String(image2ID)),
      ),
    })

    payload.logger.info(`- Seeding product page copy...`)

    await Promise.all(
      [
        {
          key: 'brief-public',
          label: 'Public Brief Page',
          surface: 'brief',
          status: 'published',
          eyebrow: 'RaidGuild Portal',
          headline: 'A digital coworking space for builders',
          intro:
            'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
          contextHeading: 'Next public session',
          contextBody:
            'No public sessions are scheduled yet. Join to get access to member coordination.',
          createAccountLabel: 'Join RaidGuild',
          submitAnotherLabel: 'View sessions',
          seoTitle: 'RaidGuild Portal | A digital coworking space for builders',
          seoDescription:
            'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
        },
        {
          key: 'join',
          label: 'Join Page',
          surface: 'join',
          status: 'published',
          eyebrow: 'Join the Portal',
          headline: "Join RaidGuild's digital coworking space.",
          intro:
            'Create an account to connect your profile, follow live guild activity, join sessions, and find useful places to contribute.',
          secondaryIntro:
            'The Portal shows the current brief, upcoming sessions, active projects, contributor requests, and the people building around them.',
          benefitsHeading: 'Turn participation into skills, visibility, and opportunity.',
          benefits: [
            {
              body: 'Follow real guild activity without digging through chat.',
            },
            {
              body: 'Build a public profile connected to sessions, projects, posts, and badges.',
            },
            {
              body: 'Discover projects and contribution requests.',
            },
            {
              body: 'Join live sessions and keep track of context afterward.',
            },
            {
              body: 'Bring client, sponsor, grant, or partnership opportunities into the right intake path.',
            },
          ],
          funnelEyebrow: 'Need a different path?',
          funnelHeading: 'Start with the right intake.',
          funnelLinks: [
            {
              label: 'Request a build',
              description:
                'Talk through a client build, product spike, or technical implementation need.',
              href: '/inquire/client',
            },
            {
              label: 'Sponsor the guild',
              description: 'Bring sponsorship, bounties, or paid work into the guild review path.',
              href: '/inquire/sponsor',
            },
            {
              label: 'Offer funding or grants',
              description:
                'Route grants, public goods funding, or ecosystem support to the right context.',
              href: '/inquire/grant',
            },
            {
              label: 'Bring a collaboration',
              description:
                'Start a partnership, collaboration, research, or community opportunity.',
              href: '/inquire/opportunity',
            },
            {
              label: 'Talk to the guild',
              description: 'Ask a general question and get routed toward the right next step.',
              href: '/inquire/general',
            },
          ],
          seoTitle: 'Join the Portal',
          seoDescription:
            'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
        },
        {
          key: 'inquire-general',
          label: 'General Inquiry Page',
          surface: 'inquiry',
          status: 'published',
          eyebrow: 'Guild Inquiry',
          headline: 'Talk to the guild.',
          intro:
            'Not sure where to start? Share the question or context and the guild can route it toward the right next step.',
          contextHeading: 'How this works',
          contextBody:
            'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
          messageLabel: 'What should we know?',
          submitLabel: 'Start inquiry',
          postSubmitEyebrow: 'Inquiry started',
          postSubmitHeading: 'Continue your RaidGuild intake',
          postSubmitBody:
            'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
          createAccountLabel: 'Create account',
          submitAnotherLabel: 'Submit another',
          backLinkLabel: 'Back to join',
          seoTitle: 'Talk to the guild.',
          seoDescription:
            'Start a general RaidGuild inquiry and get routed to the right next step.',
        },
        {
          key: 'inquire-client',
          label: 'Client Inquiry Page',
          surface: 'inquiry',
          status: 'published',
          eyebrow: 'Build Request',
          headline: 'Request a build with RaidGuild.',
          intro:
            'Share the product, technical, or strategic problem you want to move forward. This starts a private intake record for review.',
          contextHeading: 'How this works',
          contextBody:
            'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
          messageLabel: 'What do you want to build, validate, or unblock?',
          submitLabel: 'Start inquiry',
          postSubmitEyebrow: 'Inquiry started',
          postSubmitHeading: 'Continue your RaidGuild intake',
          postSubmitBody:
            'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
          createAccountLabel: 'Create account',
          submitAnotherLabel: 'Submit another',
          backLinkLabel: 'Back to join',
          seoTitle: 'Request a build with RaidGuild.',
          seoDescription: 'Start a private build request with RaidGuild.',
        },
        {
          key: 'inquire-sponsor',
          label: 'Sponsorship Inquiry Page',
          surface: 'inquiry',
          status: 'published',
          eyebrow: 'Sponsorship',
          headline: 'Sponsor the guild.',
          intro:
            'Share sponsorship, bounty, paid work, or support context so it can be reviewed without getting lost in chat.',
          contextHeading: 'How this works',
          contextBody:
            'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
          messageLabel: 'What are you sponsoring or bringing to the guild?',
          submitLabel: 'Start inquiry',
          postSubmitEyebrow: 'Inquiry started',
          postSubmitHeading: 'Continue your RaidGuild intake',
          postSubmitBody:
            'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
          createAccountLabel: 'Create account',
          submitAnotherLabel: 'Submit another',
          backLinkLabel: 'Back to join',
          seoTitle: 'Sponsor the guild.',
          seoDescription:
            'Start a sponsorship, bounty, paid work, or support inquiry with RaidGuild.',
        },
        {
          key: 'inquire-grant',
          label: 'Grant Inquiry Page',
          surface: 'inquiry',
          status: 'published',
          eyebrow: 'Funding Path',
          headline: 'Offer funding or grants.',
          intro:
            'Bring grants, public goods funding, ecosystem budgets, or other support opportunities into review.',
          contextHeading: 'How this works',
          contextBody:
            'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
          messageLabel: 'What funding path or grant context are you bringing?',
          submitLabel: 'Start inquiry',
          postSubmitEyebrow: 'Inquiry started',
          postSubmitHeading: 'Continue your RaidGuild intake',
          postSubmitBody:
            'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
          createAccountLabel: 'Create account',
          submitAnotherLabel: 'Submit another',
          backLinkLabel: 'Back to join',
          seoTitle: 'Offer funding or grants.',
          seoDescription: 'Bring grant, public goods, or ecosystem funding context into review.',
        },
        {
          key: 'inquire-opportunity',
          label: 'Collaboration Inquiry Page',
          surface: 'inquiry',
          status: 'published',
          eyebrow: 'Collaboration',
          headline: 'Bring a collaboration opportunity.',
          intro:
            'Start a partnership, research, community, or ecosystem collaboration thread without needing to know the right internal channel.',
          contextHeading: 'How this works',
          contextBody:
            'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
          messageLabel: 'What collaboration opportunity should RaidGuild understand?',
          submitLabel: 'Start inquiry',
          postSubmitEyebrow: 'Inquiry started',
          postSubmitHeading: 'Continue your RaidGuild intake',
          postSubmitBody:
            'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
          createAccountLabel: 'Create account',
          submitAnotherLabel: 'Submit another',
          backLinkLabel: 'Back to join',
          seoTitle: 'Bring a collaboration opportunity.',
          seoDescription: 'Share a partnership, research, community, or ecosystem collaboration.',
        },
      ].map((copy) =>
        payload.create({
          collection: 'pageCopy',
          data: copy as RequiredDataFromCollectionSlug<'pageCopy'>,
        }),
      ),
    )

    // Create contact form
    payload.logger.info(`- Seeding contact form...`)

    const contactForm = await payload.create({
      collection: 'forms',
      data: JSON.parse(JSON.stringify(contactFormData)),
    })

    let contactFormID: number | string = contactForm.id

    if (payload.db.defaultIDType === 'text') {
      contactFormID = `"${contactFormID}"`
    }

    // Create contact page
    payload.logger.info(`- Seeding contact page...`)

    const contactPage = await payload.create({
      collection: 'pages',
      data: JSON.parse(
        JSON.stringify(contactPageData).replace(
          /"\{\{CONTACT_FORM_ID\}\}"/g,
          String(contactFormID),
        ),
      ),
    })

    // Update header
    payload.logger.info(`- Seeding header...`)

    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Sessions',
              url: '/events',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Inquire',
              url: '/inquire/general',
            },
          },
        ],
      },
    })

    // Update footer
    payload.logger.info(`- Seeding footer...`)

    await payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    })

    payload.logger.info(' Database seeded successfully!')
  } catch (error) {
    payload.logger.error('Error seeding database:')
    payload.logger.error(error)
    throw error
  } finally {
    req.context.disableSearchSync = previousDisableSearchSync
    req.context.disableRevalidate = previousDisableRevalidate
  }
}
