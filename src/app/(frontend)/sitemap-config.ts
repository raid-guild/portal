import type { MetadataRoute } from 'next'

export const PORTAL_CANONICAL_ORIGIN = 'https://portal.raidguild.org'
export const SITEMAP_PAGE_SIZE = 100
// This conservative cap stays well below both the 50,000 URL and 50 MB protocol limits.
export const SITEMAP_SHARD_ENTRY_LIMIT = 5000

// Add a route here only when it is useful without authentication and intended for indexing.
export const PUBLIC_STATIC_SITEMAP_PATHS = [
  '/',
  '/events',
  '/join',
  '/members',
  '/modules',
  '/posts',
  '/projects',
  '/sponsor',
  '/wiki',
] as const

export type SitemapDocument = {
  publishedAt?: string | null
  slug?: string | null
  updatedAt?: string | null
}

export const sitemapEntry = (
  path: string,
  lastModified?: string | null,
): MetadataRoute.Sitemap[number] => ({
  url: new URL(path, `${PORTAL_CANONICAL_ORIGIN}/`).toString(),
  ...(lastModified ? { lastModified } : {}),
})

export const documentEntry = (
  document: SitemapDocument,
  pathForSlug: (slug: string) => string,
): MetadataRoute.Sitemap[number] | null => {
  const slug = document.slug?.trim()

  if (!slug || slug.includes('/') || slug === '.' || slug === '..') return null

  return sitemapEntry(pathForSlug(slug), document.updatedAt || document.publishedAt)
}

export const deduplicateSitemap = (entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap =>
  Array.from(new Map(entries.map((entry) => [entry.url, entry])).values())
