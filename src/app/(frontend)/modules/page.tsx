import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canEditContent, hasVerifiedAccount } from '@/access/roles'
import { ModuleNotificationSignup } from './ModuleNotificationSignup'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import type { Media, Module, NotificationPreference, Profile, Project } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import {
  categoryLabels,
  getModuleAction,
  getModuleImageURL,
  primitiveLabels,
  relationDoc,
  relationDocs,
  statusLabels,
} from './moduleDisplay'

export const dynamic = 'force-dynamic'

const categoryDescriptions: Record<NonNullable<Module['category']>, string> = {
  analytics: 'Dashboards, graphs, reporting, and discovery surfaces.',
  community: 'Member-facing coordination, recognition, and participation modules.',
  games: 'Playful, experimental, or game-like Portal experiences.',
  knowledge: 'Research, wiki, memory, and durable context modules.',
  ops: 'Internal workflows for publishing, communication, and operations.',
  tools: 'Utility modules that help members take action or maintain Portal records.',
}

const categoryStyles: Record<NonNullable<Module['category']>, string> = {
  analytics: 'border-primary/25 bg-primary/10',
  community: 'border-success/25 bg-success/10',
  games: 'border-warning/25 bg-warning/10',
  knowledge: 'border-accent/25 bg-accent/10',
  ops: 'border-secondary/30 bg-secondary/20',
  tools: 'border-muted-foreground/25 bg-muted/60',
}

const categoryVisualTones: Record<NonNullable<Module['category']>, string> = {
  analytics: 'bg-primary',
  community: 'bg-success',
  games: 'bg-warning',
  knowledge: 'bg-accent',
  ops: 'bg-secondary',
  tools: 'bg-muted-foreground',
}

const categoryOrder: NonNullable<Module['category']>[] = [
  'ops',
  'tools',
  'analytics',
  'knowledge',
  'community',
  'games',
]

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
      <div className="mt-4 grid gap-0">
        {modules.map((module) => (
          <ModuleRow key={module.id} module={module} />
        ))}
      </div>
    </section>
  )
}

const ModuleRow: React.FC<{ module: Module }> = ({ module }) => {
  const owners = relationDocs<Profile>(module.owners)
  const sourceProject = relationDoc<Project>(module.sourceProject)
  const thumbnail = relationDoc<Media>(module.thumbnail)
  const category = module.category || 'tools'
  const moduleAction = getModuleAction(module)
  const detailRoute = module.slug ? `/modules/${encodeURIComponent(module.slug)}` : null
  const specURL = toSafeURL(module.specURL, { allowRelative: true })
  const repositoryURL = toSafeURL(module.repositoryURL, { allowRelative: true })

  return (
    <article
      aria-label={module.name}
      className="grid gap-4 border-b border-border/70 py-5 lg:grid-cols-[14rem_minmax(0,1fr)]"
    >
      <ModuleVisual category={category} module={module} thumbnail={thumbnail} />
      <div className={`border px-5 py-4 ${categoryStyles[category]}`}>
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="portal-pill">{categoryLabels[category]}</span>
              <span className="portal-pill">{statusLabels[module.status || 'idea']}</span>
              {module.featured ? <span className="portal-pill">Featured</span> : null}
              {module.moduleKind === 'external' ? (
                <span className="font-mono text-xs text-muted-foreground">
                  External app{moduleAction.signedLaunch ? ' / Uses Portal sign-in' : ''}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 portal-heading-sm">
              {detailRoute ? (
                <Link className="transition-colors hover:text-primary" href={detailRoute}>
                  {module.name}
                </Link>
              ) : (
                module.name
              )}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {module.summary}
            </p>

            {owners.length || sourceProject ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {owners.length ? (
                  <>
                    <span className="font-medium text-foreground">Owned by</span>{' '}
                    {owners.map((owner) => owner.displayName).join(', ')}
                  </>
                ) : null}
                {owners.length && sourceProject ? <span className="mx-2">/</span> : null}
                {sourceProject ? (
                  <>
                    <span className="font-medium text-foreground">Project</span>{' '}
                    {sourceProject.title}
                  </>
                ) : null}
              </p>
            ) : null}

            {module.corePrimitiveRelationships?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {module.corePrimitiveRelationships
                  .map((relationship) => relationship.primitive)
                  .filter(Boolean)
                  .map((primitive) => (
                    <span className="portal-pill" key={`${module.id}-${primitive}`}>
                      {primitiveLabels[primitive] || primitive}
                    </span>
                  ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap content-start gap-3 xl:max-w-52 xl:justify-end">
            {moduleAction.href && moduleAction.opensNewWindow ? (
              <a
                className="portal-link"
                href={moduleAction.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {moduleAction.label}
              </a>
            ) : moduleAction.href ? (
              <Link className="portal-link" href={moduleAction.href}>
                {moduleAction.label}
              </Link>
            ) : (
              <span className="portal-pill">Coming soon</span>
            )}
            {specURL ? (
              <Link className="portal-link" href={specURL}>
                Spec
              </Link>
            ) : null}
            {repositoryURL ? (
              <Link className="portal-link" href={repositoryURL}>
                Source
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

const ModuleVisual: React.FC<{
  category: NonNullable<Module['category']>
  module: Module
  thumbnail: Media | null
}> = ({ category, module, thumbnail }) => {
  const imageURL = getModuleImageURL(thumbnail)

  return (
    <div
      className={`relative flex aspect-[4/3] min-h-32 items-center justify-center overflow-hidden border border-border/60 ${categoryVisualTones[category]}`}
    >
      {imageURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={thumbnail?.alt || ''}
          className="absolute inset-0 h-full w-full object-cover"
          src={imageURL}
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-full bg-background/35 ring-1 ring-foreground/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-9 w-9 object-contain opacity-90"
            src="/assets/symbol-white.svg"
          />
        </span>
      )}
      <span className="absolute bottom-3 left-3 border border-background/30 bg-background/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
        {module.moduleKind === 'external' ? 'External' : 'Portal'}
      </span>
    </div>
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
