import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache, type ReactNode } from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'
import type { Media, Module, Profile, Project, Thread } from '@/payload-types'
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
} from '../moduleDisplay'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ModuleDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const { moduleRecord, user } = await getModulePageData(slug)

  if (!moduleRecord) notFound()

  const category = moduleRecord.category || 'tools'
  const thumbnail = relationDoc<Media>(moduleRecord.thumbnail)
  const imageURL = getModuleImageURL(thumbnail)
  const owners = relationDocs<Profile>(moduleRecord.owners)
  const sourceProject = relationDoc<Project>(moduleRecord.sourceProject)
  const relatedProjects = relationDocs<Project>(moduleRecord.relatedProjects)
  const relatedThreads = relationDocs<Thread>(moduleRecord.relatedThreads)
  const action = getModuleAction(moduleRecord)
  const specURL = toSafeURL(moduleRecord.specURL, { allowRelative: true })
  const repositoryURL = toSafeURL(moduleRecord.repositoryURL, { allowRelative: true })

  return (
    <main className="container pb-24 pt-12">
      <Link className="portal-link" href="/modules">
        Back to modules
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="portal-pill">{categoryLabels[category]}</span>
            <span className="portal-pill">{statusLabels[moduleRecord.status || 'idea']}</span>
            {moduleRecord.featured ? <span className="portal-pill">Featured</span> : null}
            {moduleRecord.moduleKind === 'external' ? (
              <span className="font-mono text-xs text-muted-foreground">External app</span>
            ) : null}
          </div>
          <h1 className="mt-5 portal-title">{moduleRecord.name}</h1>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-7 text-muted-foreground">
            {moduleRecord.summary}
          </p>

          {moduleRecord.corePrimitiveRelationships?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {moduleRecord.corePrimitiveRelationships
                .map((relationship) => relationship.primitive)
                .filter(Boolean)
                .map((primitive) => (
                  <span className="portal-pill" key={`${moduleRecord.id}-${primitive}`}>
                    {primitiveLabels[primitive] || primitive}
                  </span>
                ))}
            </div>
          ) : null}

          {canEditContent(user) ? (
            <Link
              className="portal-admin-link mt-6 inline-flex"
              href={`/admin/collections/modules/${moduleRecord.id}`}
            >
              Edit module
            </Link>
          ) : null}
        </div>

        <aside className="portal-panel overflow-hidden p-0">
          <ModuleImage imageURL={imageURL} name={moduleRecord.name} thumbnail={thumbnail} />
          <div className="p-5">
            <p className="portal-kicker">Open module</p>
            {action.href ? (
              action.opensNewWindow ? (
                <a
                  className="portal-admin-link mt-4 flex w-full justify-center px-5 py-3 text-center"
                  href={action.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {action.label}
                </a>
              ) : (
                <Link
                  className="portal-admin-link mt-4 flex w-full justify-center px-5 py-3 text-center"
                  href={action.href}
                >
                  {action.label}
                </Link>
              )
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This module does not have an available app destination yet.
              </p>
            )}
            {moduleRecord.moduleKind === 'external' && action.signedLaunch ? (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Opens the connected app using your Portal sign-in.
              </p>
            ) : null}
          </div>
        </aside>
      </section>

      {owners.length || sourceProject ? (
        <Section title="Stewardship">
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            {owners.length ? (
              <div>
                <dt className="font-medium text-foreground">Owners</dt>
                <dd className="mt-2 text-muted-foreground">
                  {owners.map((owner) => owner.displayName).join(', ')}
                </dd>
              </div>
            ) : null}
            {sourceProject ? (
              <div>
                <dt className="font-medium text-foreground">Source project</dt>
                <dd className="mt-2 text-muted-foreground">
                  {sourceProject.slug ? (
                    <Link className="hover:underline" href={`/projects/${sourceProject.slug}`}>
                      {sourceProject.title}
                    </Link>
                  ) : (
                    sourceProject.title
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
        </Section>
      ) : null}

      {relatedProjects.length || relatedThreads.length || specURL || repositoryURL ? (
        <Section title="Related context">
          <div className="flex flex-wrap gap-3">
            {relatedProjects.map((project) =>
              project.slug ? (
                <Link className="portal-link" href={`/projects/${project.slug}`} key={project.id}>
                  {project.title}
                </Link>
              ) : null,
            )}
            {relatedThreads.map((thread) =>
              thread.slug ? (
                <Link className="portal-link" href={`/threads/${thread.slug}`} key={thread.id}>
                  {thread.title}
                </Link>
              ) : null,
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
        </Section>
      ) : null}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const { moduleRecord } = await getModulePageData(slug)

  if (!moduleRecord) return { title: 'Module not found' }

  const thumbnail = relationDoc<Media>(moduleRecord.thumbnail)
  const imageURL = getModuleImageURL(thumbnail)

  return {
    description: moduleRecord.summary,
    openGraph: {
      description: moduleRecord.summary,
      images: imageURL ? [{ alt: thumbnail?.alt || moduleRecord.name, url: imageURL }] : undefined,
      title: moduleRecord.name,
    },
    title: moduleRecord.name,
  }
}

const getModulePageData = cache(async (slug: string) => {
  const user = await getCurrentUser()
  const moduleRecord = await queryModule(slug, user)

  return { moduleRecord, user }
})

const queryModule = async (
  slug: string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Module | null> => {
  if (!slug || !user) return null

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'modules',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        { slug: { equals: slug } },
        { enabled: { equals: true } },
        { status: { not_equals: 'archived' } },
      ],
    },
  })

  return result.docs[0] || null
}

const ModuleImage = ({
  imageURL,
  name,
  thumbnail,
}: {
  imageURL: string | null
  name: string
  thumbnail: Media | null
}) => (
  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-border bg-muted-foreground">
    {imageURL ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={thumbnail?.alt || name}
        className="absolute inset-0 h-full w-full object-cover"
        src={imageURL}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className="h-14 w-14 object-contain opacity-90" src="/assets/symbol-white.svg" />
    )}
  </div>
)

const Section = ({ children, title }: { children: ReactNode; title: string }) => (
  <section className="mt-10 portal-panel">
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
)
