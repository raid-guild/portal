import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canEditContent, hasVerifiedAccount } from '@/access/roles'
import { ModuleNotificationSignup } from './ModuleNotificationSignup'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import type { Module, NotificationPreference, Profile, Project } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'

export const dynamic = 'force-dynamic'

const statusLabels: Record<NonNullable<Module['status']>, string> = {
  active: 'Active',
  archived: 'Archived',
  experimental: 'Experimental',
  graduated: 'Graduated',
  idea: 'Idea',
  prototype: 'Prototype',
}

const categoryLabels: Record<NonNullable<Module['category']>, string> = {
  analytics: 'Analytics',
  community: 'Community',
  games: 'Games',
  knowledge: 'Knowledge',
  ops: 'Ops',
  tools: 'Tools',
}

const categoryDescriptions: Record<NonNullable<Module['category']>, string> = {
  analytics: 'Dashboards, graphs, reporting, and discovery surfaces.',
  community: 'Member-facing coordination, recognition, and participation modules.',
  games: 'Playful, experimental, or game-like Portal experiences.',
  knowledge: 'Research, wiki, memory, and durable context modules.',
  ops: 'Internal workflows for publishing, communication, and operations.',
  tools: 'Utility modules that help members take action or maintain Portal records.',
}

const categoryOrder: NonNullable<Module['category']>[] = [
  'ops',
  'tools',
  'analytics',
  'knowledge',
  'community',
  'games',
]

const primitiveLabels: Record<string, string> = {
  activityItem: 'Activity',
  brief: 'Briefs',
  event: 'Sessions',
  post: 'Posts',
  profile: 'Profiles',
  project: 'Projects',
  thread: 'Threads',
}

export default async function ModulesPage() {
  const user = await getCurrentUser()

  if (!user) return <ModulesTeaser />
  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to open Portal modules and launch connected tools." />
    )
  }

  const modules = await getModules(user)
  const notificationPreferences = await getNotificationPreferences(user)
  const groupedModules = groupModulesByCategory(modules)
  const canManageModules = canEditContent(user)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Modules</p>
          <h1 className="portal-title">Portal modules</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Optional and experimental Portal capabilities. Modules can connect to core community
            activity without becoming primary Portal primitives.
          </p>
        </div>
        {canManageModules ? (
          <Link className="portal-admin-link" href="/admin/collections/modules">
            Manage modules
          </Link>
        ) : null}
      </section>

      <div className="mt-10">
        <ModuleNotificationSignup
          email={user.email}
          emailVerified={Boolean(user.emailVerifiedAt)}
          initialPreferences={notificationPreferences}
          userID={user.id}
        />
      </div>

      {modules.length ? (
        <div className="mt-10 space-y-12">
          {groupedModules.map((group) => (
            <ModuleSection
              description={categoryDescriptions[group.category]}
              key={group.category}
              modules={group.modules}
              title={categoryLabels[group.category]}
            />
          ))}
        </div>
      ) : (
        <section className="mt-10 portal-panel">
          <h2 className="portal-heading-sm">No modules are enabled yet.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Editors can create module records in Payload when a module is ready for member-facing
            discovery.
          </p>
        </section>
      )}
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Modules',
}

const ModulesTeaser = () => (
  <main className="container pb-24 pt-12">
    <section className="max-w-3xl">
      <p className="mb-4 portal-kicker">Modules</p>
      <h1 className="portal-title">Portal modules</h1>
      <p className="mt-5 text-base leading-7 text-muted-foreground">
        RaidGuild members use modules to explore experimental Portal capabilities like knowledge
        discovery, contribution surfaces, and recognition tools.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="portal-admin-link" href="/join">
          Join to access modules
        </Link>
        <Link className="portal-admin-link" href="/login?next=%2Fmodules">
          Log in
        </Link>
      </div>
    </section>
    <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <article className="portal-panel">
        <p className="portal-kicker">Experimental</p>
        <h2 className="mt-2 portal-heading-sm">Portal Graph</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          An interactive graph for exploring how member skills, roles, profiles, and future Portal
          records connect.
        </p>
        <Link className="portal-admin-link mt-6" href="/join">
          Join to explore
        </Link>
      </article>
    </section>
  </main>
)

const ModuleSection: React.FC<{ description?: string; modules: Module[]; title: string }> = ({
  description,
  modules,
  title,
}) => {
  if (!modules.length) return null

  return (
    <section>
      <h2 className="portal-heading-sm">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  )
}

const ModuleCard: React.FC<{ module: Module }> = ({ module }) => {
  const owners = relationDocs<Profile>(module.owners)
  const sourceProject = relationDoc<Project>(module.sourceProject)
  const entryRoute = toSafeURL(module.entryRoute, { allowRelative: true })
  const launchRoute =
    module.moduleKind === 'external' && module.authMode === 'signed_launch' && module.slug
      ? `/api/modules/${module.slug}/launch`
      : null
  const moduleRoute = launchRoute || entryRoute
  const moduleActionLabel = launchRoute
    ? 'Launch app'
    : module.moduleKind === 'external'
      ? 'Open app'
      : 'Open module'
  const specURL = toSafeURL(module.specURL, { allowRelative: true })
  const repositoryURL = toSafeURL(module.repositoryURL, { allowRelative: true })

  return (
    <article className="portal-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="portal-kicker">
            {categoryLabels[module.category || 'tools']} / {statusLabels[module.status || 'idea']}
          </p>
          <h3 className="mt-2 portal-heading-sm">{module.name}</h3>
        </div>
        {module.featured ? <span className="portal-pill">Featured</span> : null}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{module.summary}</p>

      <div className="mt-5 space-y-3 text-sm">
        {owners.length ? (
          <p>
            <span className="font-medium">Owners:</span>{' '}
            {owners.map((owner) => owner.displayName).join(', ')}
          </p>
        ) : null}
        {sourceProject ? (
          <p>
            <span className="font-medium">Project:</span> {sourceProject.title}
          </p>
        ) : null}
        {module.corePrimitiveRelationships?.length ? (
          <p>
            <span className="font-medium">Connects:</span>{' '}
            {module.corePrimitiveRelationships
              .map((relationship) => relationship.primitive)
              .filter(Boolean)
              .map((primitive) => primitiveLabels[primitive] || primitive)
              .join(', ')}
          </p>
        ) : null}
        {module.moduleKind === 'external' ? (
          <p>
            <span className="font-medium">External app</span>
            {launchRoute ? (
              <span className="text-muted-foreground"> - Uses Portal sign-in</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {launchRoute ? (
          <a
            className="portal-admin-link"
            href={launchRoute}
            rel="noopener noreferrer"
            target="_blank"
          >
            {moduleActionLabel}
          </a>
        ) : moduleRoute ? (
          <Link className="portal-admin-link" href={moduleRoute}>
            {moduleActionLabel}
          </Link>
        ) : (
          <span className="portal-pill">Coming soon</span>
        )}
        {specURL ? (
          <Link className="portal-admin-link" href={specURL}>
            Spec
          </Link>
        ) : null}
        {repositoryURL ? (
          <Link className="portal-admin-link" href={repositoryURL}>
            Source
          </Link>
        ) : null}
      </div>
    </article>
  )
}

const getModules = async (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'modules',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder,name',
    user,
    where: {
      and: [
        {
          enabled: {
            equals: true,
          },
        },
        {
          status: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs
}

const getNotificationPreferences = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
): Promise<NotificationPreference | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'notificationPreferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  return result.docs[0] || null
}

const groupModulesByCategory = (modules: Module[]) =>
  categoryOrder
    .map((category) => ({
      category,
      modules: modules.filter((module) => (module.category || 'tools') === category),
    }))
    .filter((group) => group.modules.length)

const relationDocs = <T extends { id: number | string }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const relationDoc = <T extends { id: number | string }>(item?: number | T | null): T | null =>
  item && typeof item === 'object' ? item : null
