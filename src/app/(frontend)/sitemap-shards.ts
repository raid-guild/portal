import { getPayload, type CollectionSlug, type Where } from 'payload'

import configPromise from '@payload-config'
import { SITEMAP_SHARD_ENTRY_LIMIT, type SitemapDocument } from './sitemap-config'

type SitemapCollection = Extract<
  CollectionSlug,
  'cohorts' | 'events' | 'modules' | 'pages' | 'posts' | 'profiles' | 'projects' | 'threads' | 'wikiPages'
>

export type SitemapCollectionDefinition = {
  collection: SitemapCollection
  id: string
  pathForDocument: (document: SitemapDocument) => string | null
  sort?: string
  where: Where
}

const published = { _status: { equals: 'published' as const } }
const publicVisibility = { visibility: { equals: 'public' as const } }
const hasSlug = { slug: { exists: true } }
const reviewed = { reviewStatus: { equals: 'reviewed' as const } }
const slugPath = (prefix: string) => (document: SitemapDocument) =>
  document.slug ? `${prefix}/${document.slug}` : null

export const SITEMAP_COLLECTIONS: SitemapCollectionDefinition[] = [
  {
    collection: 'pages',
    id: 'pages',
    pathForDocument: (document) => (document.slug ? `/${document.slug}` : null),
    where: { and: [published, hasSlug, { slug: { not_equals: 'home' } }] },
  },
  {
    collection: 'posts',
    id: 'posts',
    pathForDocument: slugPath('/posts'),
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'cohorts',
    id: 'cohorts',
    pathForDocument: slugPath('/cohorts'),
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'projects',
    id: 'projects',
    pathForDocument: slugPath('/projects'),
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'threads',
    id: 'threads',
    pathForDocument: slugPath('/threads'),
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'wikiPages',
    id: 'wiki-pages',
    pathForDocument: slugPath('/wiki'),
    where: { and: [published, publicVisibility, reviewed, hasSlug] },
  },
  {
    collection: 'modules',
    id: 'modules',
    pathForDocument: slugPath('/modules'),
    where: { and: [publicVisibility, hasSlug, { enabled: { equals: true } }] },
  },
  {
    collection: 'profiles',
    id: 'profiles',
    pathForDocument: (document) => (document.handle ? `/members/${document.handle}` : null),
    sort: 'handle',
    where: { and: [publicVisibility, { handle: { exists: true } }] },
  },
  {
    collection: 'events',
    id: 'events',
    pathForDocument: (document) => (document.id ? `/events/${document.id}` : null),
    sort: 'id',
    where: { and: [published, publicVisibility] },
  },
]

export const getSitemapShardIDs = async (): Promise<Array<{ id: string }>> => {
  const payload = await getPayload({ config: configPromise })
  const counts = await Promise.all(
    SITEMAP_COLLECTIONS.map(async (definition) => ({
      definition,
      totalDocs: (
        await payload.count({
          collection: definition.collection,
          overrideAccess: false,
          where: definition.where,
        })
      ).totalDocs,
    })),
  )

  return counts.flatMap(({ definition, totalDocs }) =>
    Array.from({ length: Math.ceil(totalDocs / SITEMAP_SHARD_ENTRY_LIMIT) }, (_, index) => ({
      id: `${definition.id}-${index}`,
    })),
  )
}
