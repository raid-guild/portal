import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'
import type { Module, Profile, Project } from '@/payload-types'
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

  const modules = await getModules(user)
  const groupedModules = groupModules(modules)
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

      {modules.length ? (
        <div className="mt-10 space-y-10">
          <ModuleSection modules={groupedModules.ready} title="Available and experimental" />
          <ModuleSection modules={groupedModules.ideas} title="Ideas and prototypes" />
          <ModuleSection modules={groupedModules.graduated} title="Graduated" />
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

const ModuleSection: React.FC<{ modules: Module[]; title: string }> = ({ modules, title }) => {
  if (!modules.length) return null

  return (
    <section>
      <h2 className="portal-heading-sm">{title}</h2>
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
          <p className="portal-kicker">{statusLabels[module.status || 'idea']}</p>
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
            {launchRoute ? <span className="text-muted-foreground"> - Uses Portal sign-in</span> : null}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {moduleRoute ? (
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

const groupModules = (modules: Module[]) => ({
  graduated: modules.filter((module) => module.status === 'graduated'),
  ideas: modules.filter((module) => module.status === 'idea' || module.status === 'prototype'),
  ready: modules.filter((module) => module.status === 'active' || module.status === 'experimental'),
})

const relationDocs = <T extends { id: number | string }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const relationDoc = <T extends { id: number | string }>(item?: number | T | null): T | null =>
  item && typeof item === 'object' ? item : null
