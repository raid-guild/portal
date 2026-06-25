import configPromise from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { seed as seedFullDemoContent } from '@/endpoints/seed'
import { headingNode, lexicalRoot, paragraphNode, text } from '@/endpoints/seed/lexical'
import { seedPortalContent } from '@/endpoints/seed/portal'
import type { User } from '@/payload-types'

type ParsedArgs = {
  adminEmail: string
  adminName: string
  adminPassword: string
  full: boolean
  help: boolean
  skipAdmin: boolean
}

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
const localFixtureTimestamp = '2026-05-20T16:00:00.000Z'
const localFixturePastStart = '2026-05-18T16:00:00.000Z'
const localFixtureFutureStart = '2026-05-22T16:00:00.000Z'

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  console.log(`Seed the local Portal database for browser testing.

Usage:
  corepack pnpm db:seed:local
  corepack pnpm db:seed:local -- --skip-admin
  corepack pnpm db:seed:local -- --full

Defaults:
  mode: portal starter content upsert
  admin email: local-admin@example.com
  admin password: password

The script refuses non-local DATABASE_URI hosts.`)
  process.exit(0)
}

assertLocalDatabase()

const payload = await getPayload({ config: configPromise })
const req = await createLocalReq({}, payload)
req.context.disableSearchSync = true
req.context.disableRevalidate = true

if (args.full) {
  await seedFullDemoContent({ payload, req })
} else {
  await seedPortalContent({ payload, req })
}

if (!args.skipAdmin) {
  const localAdmin = await ensureLocalAdmin({
    email: args.adminEmail,
    name: args.adminName,
    password: args.adminPassword,
  })

  if (!args.full) {
    await ensureLocalHostFixtures(localAdmin, args.adminEmail)
    await ensureLocalWikiGraphFixtures()
  }
}

console.log(
  JSON.stringify(
    {
      admin: args.skipAdmin
        ? 'skipped'
        : {
            email: args.adminEmail,
            password: args.adminPassword,
          },
      mode: args.full ? 'full' : 'portal',
      sessionFixtures: args.full || args.skipAdmin ? 'skipped' : 'upserted',
      success: true,
    },
    null,
    2,
  ),
)

async function ensureLocalAdmin({
  email,
  name,
  password,
}: {
  email: string
  name: string
  password: string
}): Promise<User> {
  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const data = {
    email,
    emailVerifiedAt: localFixtureTimestamp,
    name,
    password,
    roles: ['admin'] satisfies NonNullable<User['roles']>,
  }

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'users',
      context: {
        skipWelcomeEmail: true,
      },
      data,
      overrideAccess: true,
    })
    return payload.findByID({
      id: existing.docs[0].id,
      collection: 'users',
      depth: 0,
      overrideAccess: true,
    })
  }

  return payload.create({
    collection: 'users',
    context: {
      skipSignupProtection: true,
      skipWelcomeEmail: true,
    },
    data,
    overrideAccess: true,
  })
}

async function ensureLocalHostFixtures(localAdmin: User, adminEmail: string) {
  const [skill, role, project, thread] = await Promise.all([
    findOne('profileSkills', { slug: 'frontend-dev' }),
    findOne('profileRoles', { slug: 'warrior' }),
    findOne('projects', { slug: 'cohort-project-spike-portal' }),
    findOne('threads', { slug: 'calendar-and-session-coordination' }),
  ])

  if (!skill || !role) {
    throw new Error('Local seed requires profileSkills/profileRoles from the portal starter seed.')
  }

  const profile = await upsertOne(
    'profiles',
    { handle: 'local-admin' },
    {
      bio: 'Local admin host profile for testing session artifact uploads and relationship enrichment.',
      claimEmail: adminEmail,
      claimedAt: localFixtureTimestamp,
      claimStatus: 'claimed',
      contact: {
        email: adminEmail,
      },
      displayName: 'Local Admin',
      handle: 'local-admin',
      profileRoles: [role.id],
      profileSkills: [skill.id],
      status: 'active',
      user: localAdmin.id,
      visibility: 'public',
    },
  )

  const pastStart = new Date(localFixturePastStart)
  const futureStart = new Date(localFixtureFutureStart)

  await Promise.all([
    upsertOne(
      'events',
      { title: 'Local Artifact Upload Test - Past Session' },
      sessionData({
        description:
          'Past hosted session for testing artifact uploads, source links, and post-session relationship enrichment.',
        endsAt: new Date(pastStart.getTime() + 60 * 60 * 1000).toISOString(),
        profileID: profile.id,
        projectID: project?.id,
        sourceStatus: 'recorded',
        startsAt: pastStart.toISOString(),
        threadID: thread?.id,
        title: 'Local Artifact Upload Test - Past Session',
      }),
    ),
    upsertOne(
      'events',
      { title: 'Local Host Planning Session - Future Session' },
      sessionData({
        description:
          'Future hosted session for testing host ownership, join/calendar actions, and project/thread context.',
        endsAt: new Date(futureStart.getTime() + 60 * 60 * 1000).toISOString(),
        joinURL: 'https://discord.com',
        locationLabel: 'Discord #local-test',
        profileID: profile.id,
        projectID: project?.id,
        startsAt: futureStart.toISOString(),
        threadID: thread?.id,
        title: 'Local Host Planning Session - Future Session',
      }),
    ),
    upsertOne(
      'events',
      { title: 'Local Topic Map Import Test' },
      sessionData({
        description:
          'Local session fixture with a Prism topic-map resource for testing wiki graph imports.',
        endsAt: new Date(pastStart.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        profileID: profile.id,
        projectID: project?.id,
        resources: [
          {
            label: 'Topic map',
            resourceType: 'artifact',
            url: 'https://prism-memory-production-002c.up.railway.app/artifacts/20260623_181623Z-prism-workflow-2c5e0487',
          },
        ],
        sourceStatus: 'processed',
        startsAt: new Date(pastStart.getTime() + 60 * 60 * 1000).toISOString(),
        threadID: thread?.id,
        title: 'Local Topic Map Import Test',
      }),
    ),
  ])
}

async function ensureLocalWikiGraphFixtures() {
  const localObservedAt = '2026-06-24T16:00:00.000Z'
  const localReviewedAt = '2026-06-24T16:30:00.000Z'

  const articleFixtures = [
    {
      title: 'Agent-Ready Command Surfaces',
      slug: 'agent-ready-command-surfaces',
      summary:
        'Local fixture article on CLIs, scripts, wrappers, and bounded tool interfaces that agents can use safely.',
      topicSlug: 'agent-ready-command-surfaces',
      relatedTopics: ['Agent-Oriented Developer Workflows', 'Tool Permission Boundaries'],
      possibleTopics: ['Structured Tool Outputs', 'Agent Instruction Files'],
      sources: [
        {
          label: 'Local Prism command-surface research packet',
          artifactID: 'local-prism-command-surfaces',
          sourceType: 'prism',
          url: 'https://prism.local/artifacts/local-prism-command-surfaces',
        },
        {
          label: 'Portal graph discovery planning session',
          sourceType: 'session',
          url: 'https://portal.local/events/wiki-graph-planning',
        },
      ],
      body: [
        'Command surfaces are the bounded interfaces an agent can use to take action without guessing how a system works.',
        'Useful surfaces return parseable output, expose scoped permissions, and leave enough evidence for a human to review the work.',
      ],
    },
    {
      title: 'Context Systems',
      slug: 'context-systems',
      summary:
        'Local fixture article on context architecture, memory layers, retrieval, and freshness boundaries.',
      topicSlug: 'context-systems',
      relatedTopics: ['Personal Context Portability', 'Structured Community Memory'],
      possibleTopics: ['Context Freshness Policies', 'Memory Scope Boundaries'],
      sources: [
        {
          label: 'Local Prism context systems digest',
          artifactID: 'local-prism-context-systems',
          sourceType: 'prism',
          url: 'https://prism.local/artifacts/local-prism-context-systems',
        },
        {
          label: 'Context engineering reference',
          sourceType: 'external',
          url: 'https://example.com/context-engineering',
        },
      ],
      body: [
        'Context systems decide what an AI workflow can see, when that context should refresh, and how provenance remains inspectable.',
        'The Portal graph treats context topics as navigational objects before treating them as finished article claims.',
      ],
    },
    {
      title: 'AI-Assisted Grading',
      slug: 'ai-assisted-grading',
      summary:
        'Local fixture article on rubrics, educator review, calibration, privacy, and grading reliability.',
      topicSlug: 'ai-assisted-grading',
      relatedTopics: ['Human-Calibrated Assessment Workflows', 'LLM-as-Judge Evaluation'],
      possibleTopics: ['Rubric Drift Detection', 'Bias Audits for AI Assessment'],
      sources: [
        {
          label: 'Local assessment interview summary',
          artifactID: 'local-prism-assessment-summary',
          sourceType: 'prism',
          url: 'https://prism.local/artifacts/local-prism-assessment-summary',
        },
        {
          label: 'Local assessment transcript',
          artifactID: 'local-prism-assessment-transcript',
          sourceType: 'session',
          url: 'https://prism.local/artifacts/local-prism-assessment-transcript',
        },
      ],
      body: [
        'AI-assisted grading is most useful when it supports rubric application and feedback drafting without removing educator calibration.',
        'The risky path is treating model judgment as final assessment instead of reviewable evidence.',
      ],
    },
    {
      title: 'Product Judgment After Execution Scarcity',
      slug: 'product-judgment-after-execution-scarcity',
      summary:
        'Local fixture article on sequencing, QA, taste, trust, and distribution when execution gets cheaper.',
      topicSlug: 'product-judgment-after-execution-scarcity',
      relatedTopics: [
        'Defensibility in AI Products',
        'Human Judgment in AI-Assisted Software Delivery',
      ],
      possibleTopics: [
        'Taste in AI-Assisted Production',
        'Attention Capacity In AI-Assisted Workflows',
      ],
      sources: [
        {
          label: 'Local product strategy research packet',
          artifactID: 'local-prism-product-judgment',
          sourceType: 'prism',
          url: 'https://prism.local/artifacts/local-prism-product-judgment',
        },
      ],
      body: [
        'When execution is less scarce, the hard work shifts toward deciding what should exist, what is worth trusting, and what deserves attention.',
        'Good product judgment becomes more visible when teams can create many plausible versions quickly.',
      ],
    },
    {
      title: 'Structured Community Memory',
      slug: 'structured-community-memory',
      summary:
        'Local fixture article on provenance, asks, offers, follow-up, and human-reviewed collaboration recommendations.',
      topicSlug: 'structured-community-memory',
      relatedTopics: ['Personal CRM', 'Context Systems'],
      possibleTopics: [
        'Asks And Offers In Community Systems',
        'Human-Reviewed Collaboration Recommendations',
      ],
      sources: [
        {
          label: 'Local community memory digest',
          artifactID: 'local-prism-community-memory',
          sourceType: 'prism',
          url: 'https://prism.local/artifacts/local-prism-community-memory',
        },
        {
          label: 'Portal local graph fixture source',
          sourceType: 'external',
          url: 'https://portal.local/wiki/explore',
        },
      ],
      body: [
        'Structured community memory turns dated activity into retrievable context without pretending every generated suggestion is canonical.',
        'The graph should make source coverage, freshness, and review status visible while keeping exploration fast.',
      ],
    },
  ] as const

  const draftFixtures = [
    {
      title: 'Computer Use vs Browser Use vs MCP',
      slug: 'computer-use-vs-browser-use-vs-mcp',
      summary:
        'Generated local draft comparing desktop computer use, browser automation, CLI tools, and MCP integrations.',
      topicSlug: 'computer-use-vs-browser-use-vs-mcp',
      parentSlug: 'codex-computer-use',
      body: [
        'This generated draft needs review before it should be treated as a canonical wiki article.',
        'The research question is where each agent interface is strongest and what safety boundaries each one needs.',
      ],
    },
    {
      title: 'Human Review Checkpoints for Agents',
      slug: 'human-review-checkpoints-for-agents',
      summary:
        'Generated local draft on checkpoints, approval moments, and evidence surfaces in AI-assisted workflows.',
      topicSlug: 'human-review-checkpoints-for-agents',
      parentSlug: 'human-judgment-ai-assisted-software-delivery',
      body: [
        'This draft explores where humans should inspect agent work without turning every generated artifact into a heavy approval workflow.',
        'It should become a reviewed article only after source coverage is strong enough.',
      ],
    },
  ] as const

  for (const fixture of articleFixtures) {
    const page = await upsertOne(
      'wikiPages',
      { slug: fixture.slug },
      wikiPageData({
        body: fixture.body,
        confidence: 'high',
        lastReviewedAt: localReviewedAt,
        lastRefreshedAt: localReviewedAt,
        possibleTopics: fixture.possibleTopics,
        relatedTopics: fixture.relatedTopics,
        reviewStatus: 'reviewed',
        slug: fixture.slug,
        sources: fixture.sources,
        status: 'published',
        summary: fixture.summary,
        title: fixture.title,
      }),
    )

    const topic = await findOne('wikiTopics', { slug: fixture.topicSlug })
    if (topic) {
      await updateOne('wikiTopics', topic.id, {
        canonicalPage: page.id,
        relatedPages: [page.id],
        sourceArtifacts: fixture.sources.map((source) => ({
          ...source,
          observedAt: localObservedAt,
          sourceQuery: `local fixture source for ${fixture.title}`,
        })),
      })
    }
  }

  for (const fixture of draftFixtures) {
    const page = await upsertOne(
      'wikiPages',
      { slug: fixture.slug },
      wikiPageData({
        body: fixture.body,
        confidence: 'medium',
        generatedAt: localObservedAt,
        possibleTopics: [],
        relatedTopics: ['Agent Workflows', 'Human Review'],
        reviewStatus: 'generated_draft',
        slug: fixture.slug,
        sources: [
          {
            label: `Local Prism draft packet: ${fixture.title}`,
            artifactID: `local-draft-${fixture.slug}`,
            sourceType: 'prism',
            url: `https://prism.local/artifacts/local-draft-${fixture.slug}`,
          },
        ],
        status: 'draft',
        summary: fixture.summary,
        title: fixture.title,
      }),
    )

    const parent = await findOne('wikiTopics', { slug: fixture.parentSlug })
    const possibleTopic = await upsertOne(
      'wikiTopics',
      { slug: fixture.topicSlug },
      {
        title: fixture.title,
        slug: fixture.slug,
        summary: fixture.summary,
        kind: 'possible',
        parentTopic: parent?.id,
        canonicalPage: page.id,
        relatedPages: [page.id],
        reviewStatus: 'suggested',
        confidence: 'medium',
        visibility: 'authenticated',
        generatedAt: localObservedAt,
        lastExpandedAt: localObservedAt,
        sourceQueries: [
          {
            query: `${fixture.title} agent workflow research`,
            filters: 'local fixture',
            resultCount: 3,
            searchedAt: localObservedAt,
          },
        ],
      },
    )

    if (parent) {
      const existingParent = await findOne('wikiTopics', { slug: fixture.parentSlug })
      await updateOne('wikiTopics', parent.id, {
        relatedTopics: [
          ...new Set([...(await relatedTopicIDs(existingParent?.id)), possibleTopic.id]),
        ],
      })
    }
  }

  const lateralPairs = [
    ['agent-ready-command-surfaces', 'context-systems'],
    ['agent-ready-command-surfaces', 'product-judgment-after-execution-scarcity'],
    ['context-systems', 'structured-community-memory'],
    ['ai-assisted-grading', 'human-calibrated-assessment-workflows'],
    ['product-judgment-after-execution-scarcity', 'human-judgment-ai-assisted-software-delivery'],
    ['structured-community-memory', 'personal-crm'],
  ]

  for (const [sourceSlug, targetSlug] of lateralPairs) {
    const source = await findOne('wikiTopics', { slug: sourceSlug })
    const target = await findOne('wikiTopics', { slug: targetSlug })

    if (source && target) {
      await updateOne('wikiTopics', source.id, {
        relatedTopics: [...new Set([...(await relatedTopicIDs(source.id)), target.id])],
      })
    }
  }
}

function sessionData({
  description,
  endsAt,
  joinURL,
  locationLabel,
  profileID,
  projectID,
  resources,
  sourceStatus,
  startsAt,
  threadID,
  title,
}: {
  description: string
  endsAt: string
  joinURL?: string
  locationLabel?: string
  profileID: number | string
  projectID?: number | string
  resources?: {
    label: string
    resourceType: 'artifact' | 'design' | 'doc' | 'link' | 'notes' | 'other' | 'repo' | 'slides'
    url: string
  }[]
  sourceStatus?: string
  startsAt: string
  threadID?: number | string
  title: string
}) {
  return {
    _status: 'published',
    endsAt,
    hostProfiles: [profileID],
    joinURL,
    locationLabel,
    publishedAt: new Date().toISOString(),
    relatedProfiles: [profileID],
    relatedProjects: projectID ? [projectID] : undefined,
    relatedThreads: threadID ? [threadID] : undefined,
    resources,
    sessionType: 'workshop',
    sourceStatus,
    speaker: profileID,
    speakerProfiles: [profileID],
    startsAt,
    summary: description,
    title,
    visibility: 'public',
  }
}

async function findOne(collection: string, match: Record<string, unknown>) {
  const localPayload = payload as any
  const result = await localPayload.find({
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

  return result.docs[0] as { id: number | string } | undefined
}

async function upsertOne(
  collection: string,
  match: Record<string, unknown>,
  data: Record<string, unknown>,
) {
  const existing = await findOne(collection, match)
  const localPayload = payload as any

  if (existing) {
    return localPayload.update({
      id: existing.id,
      collection,
      context: {
        disableRevalidate: true,
        disableSearchSync: true,
      },
      data,
      depth: 0,
      overrideAccess: true,
    }) as Promise<{ id: number | string }>
  }

  return localPayload.create({
    collection,
    context: {
      disableRevalidate: true,
      disableSearchSync: true,
    },
    data,
    depth: 0,
    overrideAccess: true,
  }) as Promise<{ id: number | string }>
}

async function updateOne(collection: string, id: number | string, data: Record<string, unknown>) {
  const localPayload = payload as any

  return localPayload.update({
    id,
    collection,
    context: {
      disableRevalidate: true,
      disableSearchSync: true,
    },
    data,
    depth: 0,
    overrideAccess: true,
  }) as Promise<{ id: number | string }>
}

async function relatedTopicIDs(id?: number | string) {
  if (!id) return []

  const localPayload = payload as any
  const topic = await localPayload.findByID({
    id,
    collection: 'wikiTopics',
    depth: 0,
    overrideAccess: true,
  })

  return Array.isArray(topic?.relatedTopics) ? topic.relatedTopics : []
}

function wikiPageData({
  body,
  confidence,
  generatedAt,
  lastRefreshedAt,
  lastReviewedAt,
  possibleTopics,
  relatedTopics,
  reviewStatus,
  slug,
  sources,
  status,
  summary,
  title,
}: {
  body: readonly string[]
  confidence: 'low' | 'medium' | 'high'
  generatedAt?: string
  lastRefreshedAt?: string
  lastReviewedAt?: string
  possibleTopics: readonly string[]
  relatedTopics: readonly string[]
  reviewStatus: 'generated_draft' | 'needs_review' | 'reviewed' | 'needs_refresh' | 'archived'
  slug: string
  sources: readonly {
    artifactID?: string
    label: string
    sourceType: string
    url?: string
  }[]
  status: 'draft' | 'published'
  summary: string
  title: string
}) {
  return {
    title,
    slug,
    summary,
    body: lexicalRoot([
      headingNode('h2', [text('Local research fixture')]),
      ...body.map((paragraph) => paragraphNode(paragraph)),
      headingNode('h2', [text('Open questions')]),
      paragraphNode(
        'Which source artifacts should be promoted before this page is treated as canonical?',
      ),
    ]),
    confidence,
    furtherReading: [
      {
        label: `${title} reading packet`,
        note: 'Local fixture link used to test graph article drawer discovery links.',
        url: `https://example.com/wiki/${slug}/reading`,
      },
    ],
    generatedAt,
    keyClaims: body.map((claim) => ({
      claim,
      sourceLabel: 'Local fixture source bundle',
    })),
    lastRefreshedAt,
    lastReviewedAt,
    papers: [
      {
        label: `${title} research reference`,
        note: 'Placeholder research reference for local graph exploration.',
        url: `https://example.com/wiki/${slug}/paper`,
      },
    ],
    possibleTopics: possibleTopics.map((topic) => ({ topic })),
    relatedTopics: relatedTopics.map((topic) => ({ topic })),
    reviewStatus,
    sourceArtifacts: sources.map((source) => ({
      ...source,
      observedAt: generatedAt || lastReviewedAt || localFixtureTimestamp,
      sourceQuery: `local fixture query for ${title}`,
    })),
    tools: [
      {
        label: `${title} tool index`,
        note: 'Placeholder tool link for validating grouped wiki page resources.',
        url: `https://example.com/wiki/${slug}/tools`,
      },
    ],
    visibility: status === 'draft' ? 'authenticated' : 'public',
    _status: status,
    publishedAt: status === 'published' ? lastReviewedAt || localFixtureTimestamp : undefined,
    promptVersion: 'local-wiki-graph-fixture-v1',
    model: 'local-seed',
  }
}

function parseArgs(values: string[]): ParsedArgs {
  const getValue = (name: string, fallback: string) => {
    const equalsValue = values.find((value) => value.startsWith(`${name}=`))
    if (equalsValue) return equalsValue.slice(name.length + 1)

    const index = values.indexOf(name)
    if (index !== -1 && values[index + 1]) return values[index + 1]

    return fallback
  }

  return {
    adminEmail: getValue('--admin-email', 'local-admin@example.com'),
    adminName: getValue('--admin-name', 'Local Admin'),
    adminPassword: getValue('--admin-password', 'password'),
    full: values.includes('--full'),
    help: values.includes('--help') || values.includes('-h'),
    skipAdmin: values.includes('--skip-admin'),
  }
}

function assertLocalDatabase() {
  const databaseURI = process.env.DATABASE_URI

  if (!databaseURI) {
    exitWithError(
      'DATABASE_URI is not set. Add it to .env or export it before running this script.',
    )
  }

  let targetURL: URL

  try {
    targetURL = new URL(databaseURI)
  } catch {
    exitWithError('DATABASE_URI is not a valid URL.')
  }

  if (!['postgres:', 'postgresql:'].includes(targetURL.protocol)) {
    exitWithError('DATABASE_URI must use a postgres:// or postgresql:// URL.')
  }

  if (!localHosts.has(targetURL.hostname)) {
    exitWithError(`Refusing to seed non-local database host: ${targetURL.hostname}`)
  }
}

function exitWithError(message: string): never {
  console.error(message)
  process.exit(1)
}
