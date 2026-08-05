import type { MetadataRoute } from 'next'

import { PORTAL_CANONICAL_ORIGIN } from './sitemap-config'

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${PORTAL_CANONICAL_ORIGIN}/sitemap.xml`,
  }
}
