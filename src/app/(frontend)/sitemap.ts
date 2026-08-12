import type { MetadataRoute } from 'next'

import { deduplicateSitemap, PUBLIC_STATIC_SITEMAP_PATHS, sitemapEntry } from './sitemap-config'

export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  return deduplicateSitemap(PUBLIC_STATIC_SITEMAP_PATHS.map((path) => sitemapEntry(path)))
}
