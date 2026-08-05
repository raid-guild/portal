import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import {
  deduplicateSitemap,
  documentEntry,
  PUBLIC_STATIC_SITEMAP_PATHS,
  sitemapEntry,
  type SitemapDocument,
} from './sitemap-config'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 100

type SitemapPage = {
  docs: SitemapDocument[]
  hasNextPage: boolean
  nextPage?: number | null
}

const collectDocuments = async (
  fetchPage: (page: number) => Promise<SitemapPage>,
): Promise<SitemapDocument[]> => {
  const documents: SitemapDocument[] = []
  let page = 1

  while (true) {
    const result = await fetchPage(page)
    documents.push(...result.docs)

    if (!result.hasNextPage || !result.nextPage) return documents
    page = result.nextPage
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise })
  const published = { _status: { equals: 'published' as const } }
  const publicVisibility = { visibility: { equals: 'public' as const } }
  const hasSlug = { slug: { exists: true } }
  const select = { publishedAt: true, slug: true, updatedAt: true }

  const [pages, posts, cohorts, projects, threads, wikiPages] = await Promise.all([
    collectDocuments((page) =>
      payload.find({
        collection: 'pages',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: { and: [published, hasSlug] },
      }),
    ),
    collectDocuments((page) =>
      payload.find({
        collection: 'posts',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: { and: [published, publicVisibility, hasSlug] },
      }),
    ),
    collectDocuments((page) =>
      payload.find({
        collection: 'cohorts',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: { and: [published, publicVisibility, hasSlug] },
      }),
    ),
    collectDocuments((page) =>
      payload.find({
        collection: 'projects',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: { and: [published, publicVisibility, hasSlug] },
      }),
    ),
    collectDocuments((page) =>
      payload.find({
        collection: 'threads',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: { and: [published, publicVisibility, hasSlug] },
      }),
    ),
    collectDocuments((page) =>
      payload.find({
        collection: 'wikiPages',
        draft: false,
        limit: PAGE_SIZE,
        overrideAccess: false,
        page,
        select,
        sort: 'slug',
        where: {
          and: [
            published,
            publicVisibility,
            { reviewStatus: { equals: 'reviewed' } },
            hasSlug,
          ],
        },
      }),
    ),
  ])

  const entries: MetadataRoute.Sitemap = [
    ...PUBLIC_STATIC_SITEMAP_PATHS.map((path) => sitemapEntry(path)),
    ...pages.map((page) => documentEntry(page, (slug) => (slug === 'home' ? '/' : `/${slug}`))),
    ...posts.map((post) => documentEntry(post, (slug) => `/posts/${slug}`)),
    ...cohorts.map((cohort) => documentEntry(cohort, (slug) => `/cohorts/${slug}`)),
    ...projects.map((project) => documentEntry(project, (slug) => `/projects/${slug}`)),
    ...threads.map((thread) => documentEntry(thread, (slug) => `/threads/${slug}`)),
    ...wikiPages.map((wikiPage) => documentEntry(wikiPage, (slug) => `/wiki/${slug}`)),
  ].filter((entry): entry is MetadataRoute.Sitemap[number] => Boolean(entry))

  return deduplicateSitemap(entries)
}
