import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import {
  deduplicateSitemap,
  documentEntry,
  SITEMAP_PAGE_SIZE,
  SITEMAP_SHARD_ENTRY_LIMIT,
  type SitemapDocument,
} from '../sitemap-config'
import { getSitemapShardIDs, SITEMAP_COLLECTIONS } from '../sitemap-shards'

export const revalidate = 3600

type SitemapPage = {
  docs: SitemapDocument[]
  hasNextPage: boolean
  nextPage?: number | null
}

const collectDocuments = async (
  fetchPage: (page: number) => Promise<SitemapPage>,
  firstPage: number,
): Promise<SitemapDocument[]> => {
  const documents: SitemapDocument[] = []
  const pagesPerShard = SITEMAP_SHARD_ENTRY_LIMIT / SITEMAP_PAGE_SIZE
  let page = firstPage

  for (let offset = 0; offset < pagesPerShard; offset += 1) {
    const result = await fetchPage(page)
    documents.push(...result.docs)

    if (!result.hasNextPage || !result.nextPage) break
    page = result.nextPage
  }

  return documents.slice(0, SITEMAP_SHARD_ENTRY_LIMIT)
}

export async function generateSitemaps(): Promise<Array<{ id: string }>> {
  return getSitemapShardIDs()
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>
}): Promise<MetadataRoute.Sitemap> {
  const shardID = await id
  const definition = SITEMAP_COLLECTIONS.find(({ id: prefix }) => shardID.startsWith(`${prefix}-`))
  const shardIndex = definition ? Number(shardID.slice(definition.id.length + 1)) : Number.NaN

  if (!definition || !Number.isSafeInteger(shardIndex) || shardIndex < 0) return []

  const payload = await getPayload({ config: configPromise })
  const firstPage = shardIndex * (SITEMAP_SHARD_ENTRY_LIMIT / SITEMAP_PAGE_SIZE) + 1
  const select = { publishedAt: true, slug: true, updatedAt: true } as const
  const documents = await collectDocuments(
    (page) =>
      payload.find({
        collection: definition.collection,
        draft: false,
        limit: SITEMAP_PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: definition.where,
      }),
    firstPage,
  )

  return deduplicateSitemap(
    documents
      .map((document) => documentEntry(document, definition.pathForSlug))
      .filter((entry): entry is MetadataRoute.Sitemap[number] => Boolean(entry)),
  )
}
