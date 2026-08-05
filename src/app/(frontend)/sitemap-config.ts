import type { MetadataRoute } from 'next'

export const PORTAL_CANONICAL_ORIGIN = 'https://portal.raidguild.org'

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
