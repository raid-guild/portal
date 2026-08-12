import { getPayload, type CollectionSlug, type Where } from 'payload'

import configPromise from '@payload-config'
import { SITEMAP_SHARD_ENTRY_LIMIT } from './sitemap-config'

type SitemapCollection = Extract<
  CollectionSlug,
  'cohorts' | 'pages' | 'posts' | 'projects' | 'threads' | 'wikiPages'
>

export type SitemapCollectionDefinition = {
  collection: SitemapCollection
  id: string
  pathForSlug: (slug: string) => string
  where: Where
}

const published = { _status: { equals: 'published' as const } }
const publicVisibility = { visibility: { equals: 'public' as const } }
const hasSlug = { slug: { exists: true } }
const reviewed = { reviewStatus: { equals: 'reviewed' as const } }

export const SITEMAP_COLLECTIONS: SitemapCollectionDefinition[] = [
  {
    collection: 'pages',
    id: 'pages',
    pathForSlug: (slug) => `/${slug}`,
    where: { and: [published, hasSlug, { slug: { not_equals: 'home' } }] },
  },
  {
    collection: 'posts',
    id: 'posts',
    pathForSlug: (slug) => `/posts/${slug}`,
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'cohorts',
    id: 'cohorts',
    pathForSlug: (slug) => `/cohorts/${slug}`,
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'projects',
    id: 'projects',
    pathForSlug: (slug) => `/projects/${slug}`,
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'threads',
    id: 'threads',
    pathForSlug: (slug) => `/threads/${slug}`,
    where: { and: [published, publicVisibility, hasSlug] },
  },
  {
    collection: 'wikiPages',
    id: 'wiki-pages',
    pathForSlug: (slug) => `/wiki/${slug}`,
    where: { and: [published, publicVisibility, reviewed, hasSlug] },
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
