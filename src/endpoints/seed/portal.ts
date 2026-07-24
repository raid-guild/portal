import type {
  CollectionSlug,
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

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
const inquirySharedCopy = {
  backLinkLabel: 'Back to join',
  contextBody:
    'Submit the inquiry first. The Portal saves it immediately, then asks you to create an account so follow-up can connect to your profile.',
  contextHeading: 'How this works',
  createAccountLabel: 'Create account',
  postSubmitBody:
    'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
  postSubmitEyebrow: 'Inquiry started',
  postSubmitHeading: 'Continue your RaidGuild intake',
  submitAnotherLabel: 'Submit another',
  submitLabel: 'Start inquiry',
}

type WikiTopicSeed = {
  children?: {
    pageSlug?: string
    summary: string
    title: string
  }[]
  slug: string
  summary: string
  title: string
}

const wikiTopicSeeds: WikiTopicSeed[] = [
  {
    title: 'AI Agent Workflows',
    slug: 'ai-agent-workflows',
    summary:
      'How agents, command surfaces, roles, memory, and human checkpoints shape AI-assisted work.',
    children: [
      {
        title: 'Agent-Oriented Developer Workflows',
        summary: 'Coding-agent workflows, context setup, command execution, and verification.',
        pageSlug: 'agent-oriented-developer-workflows',
      },
      {
        title: 'Agent-Ready Command Surfaces',
        summary: 'Bounded CLIs, scripts, wrappers, APIs, and tool interfaces for agents.',
        pageSlug: 'agent-ready-command-surfaces',
      },
      {
        title: 'Agent Role Orchestration',
        summary: 'Role assignment, handoffs, turn-taking, and persona boundaries in agent systems.',
        pageSlug: 'agent-role-orchestration',
      },
      {
        title: 'Multi-Agent Memory',
        summary: 'Shared, isolated, refreshed, and cited memory across multiple agents.',
        pageSlug: 'multi-agent-memory',
      },
      {
        title: 'Codex Computer Use',
        summary: 'Computer-use workflows, browser/CLI boundaries, and frontend QA affordances.',
        pageSlug: 'codex-computer-use',
      },
      {
        title: 'Voice-First Agent Workbenches',
        summary: 'Spoken intent, visible agents, command surfaces, and local speech tooling.',
        pageSlug: 'voice-first-agent-workbenches',
      },
      {
        title: 'Voice-Controlled Agent Safety Patterns',
        summary: 'Confirmation, risk classification, approval gates, and voice failure modes.',
        pageSlug: 'voice-controlled-agent-safety-patterns',
      },
    ],
  },
  {
    title: 'Context And Memory Systems',
    slug: 'context-and-memory-systems',
    summary:
      'Personal, team, and community memory systems that preserve useful context across tools and time.',
    children: [
      {
        title: 'Context Systems',
        summary: 'AI context architecture, memory layers, and retrieval patterns.',
        pageSlug: 'context-systems',
      },
      {
        title: 'Personal CRM',
        summary:
          'Self-hosted relationship memory, follow-up context, and private communication archives.',
        pageSlug: 'personal-crm',
      },
      {
        title: 'Personal Context Portability',
        summary:
          'Moving, inspecting, and governing context across assistants, devices, and archives.',
        pageSlug: 'personal-context-portability',
      },
      {
        title: 'Structured Community Memory',
        summary:
          'Community-scale memory, provenance, asks, offers, and collaboration recommendations.',
        pageSlug: 'structured-community-memory',
      },
      {
        title: 'Shared AI Context For Teams',
        summary: 'Team context sharing, scoping, governance, and handoff across people and agents.',
        pageSlug: 'shared-ai-context-for-teams',
      },
    ],
  },
  {
    title: 'Human Judgment And AI Work',
    slug: 'human-judgment-and-ai-work',
    summary:
      'Where human taste, review, curation, architecture, and responsibility remain central in AI-heavy workflows.',
    children: [
      {
        title: 'Human Judgment in AI-Assisted Software Delivery',
        summary: 'Review boundaries, delivery judgment, and AI-assisted engineering quality.',
        pageSlug: 'human-judgment-ai-assisted-software-delivery',
      },
      {
        title: 'Human Architecture in AI-Assisted Engineering',
        summary: 'System design, scoping, and architectural responsibility around AI coding tools.',
        pageSlug: 'human-architecture-ai-assisted-engineering',
      },
      {
        title: 'Human Curation After AI Expansion',
        summary:
          'Curation, filtering, and meaning-making when generation expands available options.',
        pageSlug: 'human-curation-after-ai-expansion',
      },
      {
        title: 'Human-In-The-Loop AI Workflows',
        summary: 'Human checkpoints, review surfaces, and collaboration with AI systems.',
        pageSlug: 'human-in-the-loop-ai-workflows',
      },
    ],
  },
  {
    title: 'AI In Education And Assessment',
    slug: 'ai-in-education-and-assessment',
    summary:
      'AI-supported learning and assessment patterns, with attention to rubrics, fairness, privacy, and evidence.',
    children: [
      {
        title: 'Assessment After Proxy Collapse',
        summary:
          'How generative AI changes artifact-based assessment and evidence of understanding.',
        pageSlug: 'assessment-after-proxy-collapse',
      },
      {
        title: 'AI-Assisted Grading',
        summary: 'Rubrics, educator review, privacy, fairness, and grading reliability.',
        pageSlug: 'ai-assisted-grading',
      },
      {
        title: 'Human-Calibrated Assessment Workflows',
        summary: 'Calibration, review, and reliability in human-guided AI assessment.',
        pageSlug: 'human-calibrated-assessment-workflows',
      },
      {
        title: 'LLM-as-Judge Evaluation',
        summary: 'Using language models as evaluators while preserving calibration and review.',
        pageSlug: 'llm-as-judge-evaluation',
      },
    ],
  },
  {
    title: 'AI Product Strategy',
    slug: 'ai-product-strategy',
    summary:
      'Product defensibility, execution scarcity, economic agency, and strategy in AI-enabled markets.',
    children: [
      {
        title: 'Defensibility in AI Products',
        summary: 'Durability, distribution, workflow depth, and trust in AI products.',
        pageSlug: 'defensibility-in-ai-products',
      },
      {
        title: 'Product Judgment After Execution Scarcity',
        summary: 'Sequencing, QA, trust, and distribution when execution becomes cheaper.',
        pageSlug: 'product-judgment-after-execution-scarcity',
      },
      {
        title: 'Economic Agency for AI Agents',
        summary: 'Economic permissions, autonomy, account boundaries, and agent participation.',
        pageSlug: 'economic-agency-for-ai-agents',
      },
    ],
  },
  {
    title: 'AI Content And Discovery',
    slug: 'ai-content-and-discovery',
    summary:
      'How AI changes search, content trust, facilitation, and collective discovery workflows.',
    children: [
      {
        title: 'SEO and AI Search',
        summary: 'SEO, GEO/AEO language, source trust, and AI-mediated discovery.',
        pageSlug: 'seo-and-ai-search',
      },
      {
        title: 'Human-Written Content As A Trust Signal',
        summary: 'Human authorship, editorial signal, and trust in AI-shaped content systems.',
        pageSlug: 'human-written-content-as-a-trust-signal',
      },
      {
        title: 'AI-Assisted Facilitation',
        summary: 'Summarization, clustering, participant reflection, and shared artifacts.',
        pageSlug: 'ai-assisted-facilitation',
      },
    ],
  },
]

const pageCopySeeds = [
  {
    contextBody: 'No public sessions are scheduled yet. Join to get access to member coordination.',
    contextHeading: 'Next public session',
    createAccountLabel: 'Join RaidGuild',
    eyebrow: 'RaidGuild Portal',
    headline: 'A digital coworking space for builders',
    intro:
      'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
    key: 'brief-public',
    label: 'Public Brief Page',
    seoDescription:
      'Join sessions, find a team, build your skills, and help turn ideas into shipped work with the RaidGuild community.',
    seoTitle: 'RaidGuild Portal | A digital coworking space for builders',
    status: 'published',
    submitAnotherLabel: 'View sessions',
    surface: 'brief',
  },
  {
    benefits: [
      { body: 'Slop Swamp bubbles up the newest post.' },
      { body: 'Lava Castle shows early modules and prototypes.' },
      { body: 'The Village points toward upcoming sessions.' },
      { body: 'Lunker Lake keeps your daily check-in and guild points close.' },
    ],
    benefitsHeading: 'Map stops',
    contextBody:
      'A little hut listens better than the void. Leave a request, a bug, a question, or a signal that needs a human look.',
    contextHeading: 'Hut of Helpless Whispers',
    eyebrow: 'Guild Map',
    headline: 'Walk the Portal roads.',
    intro:
      'Choose a guild form, travel between familiar places, and open the same Portal surfaces from a stranger, livelier angle.',
    key: 'dashboard-map',
    label: 'Dashboard Map',
    secondaryIntro:
      'The map is an alternate dashboard view. Posts, sessions, wiki pages, modules, feedback, and points remain the source of truth.',
    seoDescription:
      'Explore the RaidGuild Portal through an interactive authenticated map dashboard.',
    seoTitle: 'Map Dashboard',
    status: 'published',
    submitLabel: 'Enter the map',
    surface: 'dashboard',
  },
  {
    benefits: [
      { body: 'Create a profile so guild members know who you are.' },
      { body: 'Explore live sessions, projects, posts, and member activity.' },
      { body: 'Find people and teams working on things you care about.' },
      { body: 'Share what you are working on and discover ways to get involved.' },
    ],
    benefitsHeading: 'Inside the Portal, you can:',
    eyebrow: 'Join the Portal',
    funnelEyebrow: 'Bringing something to RaidGuild?',
    funnelHeading: 'Create an account first, then route it to the right place.',
    funnelLinks: [
      {
        description: 'For client work, product ideas, prototypes, or builds that need a team.',
        href: '/inquire/client',
        label: 'Bring a project',
      },
      {
        description: 'For grants, ecosystem support, bounties, or funded experiments.',
        href: '/inquire/sponsor',
        label: 'Bring funding',
      },
      {
        description: 'For public goods funding or grant programs that need builders.',
        href: '/inquire/grant',
        label: 'Share a grant',
      },
      {
        description: 'For partnerships, research, events, or community work.',
        href: '/inquire/opportunity',
        label: 'Start a collaboration',
      },
      {
        description: 'Join the Portal, look around, and ask for help when you are ready.',
        href: '/inquire/general',
        label: 'Not sure yet?',
      },
    ],
    headline: 'Create your RaidGuild Portal account.',
    intro:
      'The Portal is RaidGuild’s shared workspace for people, projects, sessions, posts, and opportunities.',
    key: 'join',
    label: 'Join Page',
    secondaryIntro:
      'Create an account to explore what is happening, meet contributors, and find your next step.',
    seoDescription:
      'Create a RaidGuild Portal account to explore guild activity, meet contributors, and find ways to get involved.',
    seoTitle: 'Join the Portal',
    status: 'published',
    surface: 'join',
  },
  {
    ...inquirySharedCopy,
    eyebrow: 'Build Request',
    headline: 'Request a build with RaidGuild.',
    intro:
      'Share the product, technical, or strategic problem you want to move forward. This starts a private intake record for review.',
    key: 'inquire-client',
    label: 'Client Inquiry Page',
    messageLabel: 'What do you want to build, validate, or unblock?',
    seoDescription: 'Start a private build request with RaidGuild.',
    seoTitle: 'Request a build with RaidGuild.',
    status: 'published',
    surface: 'inquiry',
  },
  {
    ...inquirySharedCopy,
    eyebrow: 'Guild Inquiry',
    headline: 'Talk to the guild.',
    intro:
      'Not sure where to start? Share the question or context and the guild can route it toward the right next step.',
    key: 'inquire-general',
    label: 'General Inquiry Page',
    messageLabel: 'What should we know?',
    seoDescription: 'Start a general RaidGuild inquiry and get routed to the right next step.',
    seoTitle: 'Talk to the guild.',
    status: 'published',
    surface: 'inquiry',
  },
  {
    ...inquirySharedCopy,
    eyebrow: 'Funding Path',
    headline: 'Offer funding or grants.',
    intro:
      'Bring grants, public goods funding, ecosystem budgets, or other support opportunities into review.',
    key: 'inquire-grant',
    label: 'Grant Inquiry Page',
    messageLabel: 'What funding path or grant context are you bringing?',
    seoDescription: 'Bring grant, public goods, or ecosystem funding context into review.',
    seoTitle: 'Offer funding or grants.',
    status: 'published',
    surface: 'inquiry',
  },
  {
    ...inquirySharedCopy,
    eyebrow: 'Collaboration',
    headline: 'Bring a collaboration opportunity.',
    intro:
      'Start a partnership, research, community, or ecosystem collaboration thread without needing to know the right internal channel.',
    key: 'inquire-opportunity',
    label: 'Collaboration Inquiry Page',
    messageLabel: 'What collaboration opportunity should RaidGuild understand?',
    seoDescription: 'Share a partnership, research, community, or ecosystem collaboration.',
    seoTitle: 'Bring a collaboration opportunity.',
    status: 'published',
    surface: 'inquiry',
  },
  {
    ...inquirySharedCopy,
    eyebrow: 'Sponsorship',
    headline: 'Sponsor the guild.',
    intro:
      'Share sponsorship, bounty, paid work, or support context so it can be reviewed without getting lost in chat.',
    key: 'inquire-sponsor',
    label: 'Sponsorship Inquiry Page',
    messageLabel: 'What are you sponsoring or bringing to the guild?',
    seoDescription: 'Start a sponsorship, bounty, paid work, or support inquiry with RaidGuild.',
    seoTitle: 'Sponsor the guild.',
    status: 'published',
    surface: 'inquiry',
  },
]

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
  const context = {
    disableRevalidate: true,
    disableSearchSync: true,
  }

  if (existing) {
    return payload.update({
      id: existing.id,
      collection,
      context,
      data,
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection,
    context,
    data,
    depth: 0,
    overrideAccess: true,
  })
}

export const seedWikiTopicTree = async (payload: Payload) => {
  for (const [categoryIndex, category] of wikiTopicSeeds.entries()) {
    const categoryTopic = await upsert({
      collection: 'wikiTopics',
      match: { slug: category.slug },
      payload,
      data: {
        title: category.title,
        slug: category.slug,
        summary: category.summary,
        kind: 'category',
        reviewStatus: 'seed',
        confidence: 'medium',
        visibility: 'public',
        sortOrder: categoryIndex * 100,
        lastReviewedAt: '2026-06-24T00:00:00.000Z',
      },
    })

    for (const [childIndex, child] of (category.children || []).entries()) {
      const canonicalPage = child.pageSlug
        ? await findOne({
            collection: 'wikiPages',
            match: { slug: child.pageSlug },
            payload,
          })
        : null

      await upsert({
        collection: 'wikiTopics',
        match: { slug: child.pageSlug || child.title },
        payload,
        data: {
          title: child.title,
          slug: child.pageSlug,
          summary: child.summary,
          kind: 'topic',
          parentTopic: categoryTopic.id,
          canonicalPage: canonicalPage?.id,
          relatedPages: canonicalPage ? [canonicalPage.id] : undefined,
          reviewStatus: 'seed',
          confidence: canonicalPage ? 'high' : 'medium',
          visibility: 'public',
          sortOrder: categoryIndex * 100 + childIndex + 1,
          lastReviewedAt: '2026-06-24T00:00:00.000Z',
        },
      })
    }
  }
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

    const raidGuildCohort = await upsert({
      collection: 'cohorts',
      match: { slug: 'agentic-guild-operations' },
      payload,
      data: {
        title: 'Agentic Guild Operations',
        slug: 'agentic-guild-operations',
        cohortNumber: 8,
        summary:
          'A working cohort for building practical agent workflows, shared memory, and human checkpoints for guild operations.',
        theme: 'Agents that strengthen real community work',
        thesis:
          'Explore how agents can preserve context, improve discovery, and help contributors take a useful next step without replacing human judgment.',
        programStatus: 'upcoming',
        enrollmentStatus: 'open',
        startsAt: '2030-06-01T16:00:00.000Z',
        endsAt: '2030-07-13T23:00:00.000Z',
        participationExpectation:
          'Join the kickoff, attend or review the weekly sessions, and bring one concrete workflow, experiment, or useful question into the cohort.',
        visualVariant: 'guild',
        starterTopics: [
          {
            title: 'Agent-ready workflows',
            summary: 'Bounded tools, review points, and useful handoffs between agents and people.',
          },
          {
            title: 'Community memory',
            summary: 'Source-grounded context that makes prior work easier to find and reuse.',
          },
          {
            title: 'Participation and discovery',
            summary: 'Helping contributors see what is active and choose a concrete next step.',
          },
        ],
        programSections: [
          {
            heading: 'How we meet',
            body: 'Kickoff, open office hours, brown bags, and guest talks create recurring places to share work and unblock experiments.',
          },
          {
            heading: 'What participants make',
            body: 'Small working prototypes, documented workflows, field notes, and reusable Portal context are all valid outcomes.',
          },
        ],
        contextLinks: [
          {
            title: 'RaidGuild public site',
            summary: 'Guild background, services, and public ways to connect.',
            url: 'https://www.raidguild.org/',
          },
        ],
        highlightedThread: projectObjectThread.id,
        featuredPosts: [portalUpdatePost.id],
        featuredProjects: [cohortProject.id],
        visibility: 'public',
        _status: 'published',
        publishedAt,
      },
    })

    const nextCohortEvent = await upsert({
      collection: 'events',
      match: { title: 'Cohort Project Spike Sync' },
      payload,
      data: {
        title: 'Cohort Project Spike Sync',
        summary:
          'Follow-up sync to review scaffolding, work ownership, and the first rendered brief/project surfaces.',
        startsAt: '2030-06-03T17:00:00.000Z',
        endsAt: '2030-06-03T18:00:00.000Z',
        sessionType: 'workshop',
        locationLabel: 'Discord #cohort-voice',
        joinURL: nextSessionJoinURL,
        calendarURL: nextSessionCalendarURL,
        discordEventURL: 'https://discord.com',
        relatedCohorts: [raidGuildCohort.id],
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
        match: { slug: 'portal-graph' },
        payload,
        data: {
          name: 'Portal Graph',
          slug: 'portal-graph',
          summary:
            'An interactive graph for exploring relationships between profiles, roles, skills, projects, sessions, and other Portal records.',
          status: 'experimental',
          category: 'analytics',
          visibility: 'authenticated',
          moduleKind: 'internal',
          authMode: 'none',
          enabled: true,
          featured: true,
          sortOrder: 5,
          entryRoute: '/portal-graph',
          specURL:
            'https://github.com/raid-guild/portal/blob/main/docs/portal-graph-feature-spec.md',
          sourceProject: cohortProject.id,
          relatedProjects: [cohortProject.id],
          corePrimitiveRelationships: [{ primitive: 'profile' }],
          graduationCriteria:
            'Members use the graph to discover collaborators and understand relationships across active Portal records.',
          riskNotes:
            'Keep the module read-only until profile taxonomy and matching behavior prove useful.',
          lastReviewedAt: '2026-06-01T00:00:00.000Z',
        },
      }),
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
          category: 'knowledge',
          visibility: 'authenticated',
          moduleKind: 'internal',
          authMode: 'none',
          enabled: true,
          featured: true,
          entryRoute: '/wiki',
          adminRoute: '/admin/collections/wikiPages',
          sortOrder: 15,
          specURL:
            'https://github.com/raid-guild/portal/blob/main/docs/infinite-wiki-feature-spec.md',
          sourceProject: cohortProject.id,
          relatedProjects: [cohortProject.id],
          relatedThreads: [projectObjectThread.id],
          ownedCollections: [
            {
              collectionSlug: 'wikiPages',
            },
            {
              collectionSlug: 'wikiTopics',
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
        match: { slug: 'newsletter' },
        payload,
        data: {
          name: 'Newsletter',
          slug: 'newsletter',
          summary:
            'A member-only publishing bridge for turning approved Portal posts into listmonk campaign drafts and test emails.',
          status: 'experimental',
          category: 'ops',
          visibility: 'member',
          moduleKind: 'internal',
          authMode: 'none',
          enabled: true,
          sortOrder: 20,
          entryRoute: '/newsletter',
          adminRoute: '/admin/collections/newsletterCampaigns',
          specURL:
            'https://github.com/raid-guild/portal/blob/main/docs/newsletter-module-feature-spec.md',
          ownedCollections: [
            {
              collectionSlug: 'newsletterCampaigns',
            },
          ],
          corePrimitiveRelationships: [{ primitive: 'post' }, { primitive: 'profile' }],
          graduationCriteria:
            'Editors can reliably create listmonk drafts and test sends from Portal posts without bypassing subscriber consent or unsubscribe flows.',
          riskNotes:
            'Keep final production sends in listmonk until Portal has approval, audience, and deliverability safeguards.',
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
          category: 'tools',
          visibility: 'authenticated',
          moduleKind: 'internal',
          authMode: 'none',
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
          category: 'community',
          visibility: 'authenticated',
          moduleKind: 'internal',
          authMode: 'none',
          enabled: true,
          sortOrder: 35,
          relatedProjects: [cohortProject.id],
          corePrimitiveRelationships: [{ primitive: 'profile' }, { primitive: 'activityItem' }],
          graduationCriteria:
            'Recognition signals prove useful for discovery and celebration without incentivizing low-quality activity.',
          riskNotes:
            'Avoid broad ranking dynamics until points, badges, and props have stable meaning.',
        },
      }),
    ])

    await seedWikiTopicTree(payload)

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
      context: {
        disableRevalidate: true,
        disableSearchSync: true,
      },
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

    await Promise.all(
      pageCopySeeds.map((copy) =>
        upsert({
          collection: 'pageCopy',
          data: copy as RequiredDataFromCollectionSlug<'pageCopy'>,
          match: { key: copy.key },
          payload,
        }),
      ),
    )

    payload.logger.info('Portal starter content upserted successfully.')
  } finally {
    req.context.disableSearchSync = previousDisableSearchSync
    req.context.disableRevalidate = previousDisableRevalidate
  }
}
