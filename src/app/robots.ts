import type { MetadataRoute } from 'next'

import { PORTAL_CANONICAL_ORIGIN } from './(frontend)/sitemap-config'
import { getSitemapShardIDs } from './(frontend)/sitemap-shards'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const shards = await getSitemapShardIDs()

  return {
    host: PORTAL_CANONICAL_ORIGIN,
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/forgot-password',
        '/inbox/',
        '/login',
        '/me/',
        '/newsletter/',
        '/next/',
        '/requests/new',
        '/reset-password',
        '/search',
      ],
    },
    sitemap: [
      `${PORTAL_CANONICAL_ORIGIN}/sitemap.xml`,
      ...shards.map(({ id }) => `${PORTAL_CANONICAL_ORIGIN}/sitemaps/sitemap/${id}.xml`),
    ],
  }
}
