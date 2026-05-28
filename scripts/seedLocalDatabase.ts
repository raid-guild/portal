import configPromise from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { seed as seedFullDemoContent } from '@/endpoints/seed'
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

process.env.DISABLE_REVALIDATE = 'true'

const payload = await getPayload({ config: configPromise })
const req = await createLocalReq({}, payload)
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
  await ensureLocalHostFixtures(localAdmin, args.adminEmail)
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
    emailVerifiedAt: new Date().toISOString(),
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
      claimedAt: new Date().toISOString(),
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

  const pastStart = new Date()
  pastStart.setDate(pastStart.getDate() - 2)
  pastStart.setHours(16, 0, 0, 0)

  const futureStart = new Date()
  futureStart.setDate(futureStart.getDate() + 2)
  futureStart.setHours(16, 0, 0, 0)

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
  ])
}

function sessionData({
  description,
  endsAt,
  joinURL,
  locationLabel,
  profileID,
  projectID,
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
      data,
      depth: 0,
      overrideAccess: true,
    }) as Promise<{ id: number | string }>
  }

  return localPayload.create({
    collection,
    data,
    depth: 0,
    overrideAccess: true,
  }) as Promise<{ id: number | string }>
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
