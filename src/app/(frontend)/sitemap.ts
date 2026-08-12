import type { MetadataRoute } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getAbsoluteURL } from '@/utilities/getURL'

// Sitemap content is CMS-backed and must not require database access during image builds.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise })
  const [pages, posts] = await Promise.all([
    payload.find({
      collection: 'pages',
      depth: 0,
      draft: false,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'posts',
      depth: 0,
      draft: false,
      limit: 0,
      overrideAccess: true,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: {
        and: [{ _status: { equals: 'published' } }, { visibility: { equals: 'public' } }],
      },
    }),
  ])

  const staticRoutes = ['/', '/posts', '/projects', '/events', '/members', '/wiki']

  return [
    ...staticRoutes.map((path) => ({ url: getAbsoluteURL(path) })),
    ...pages.docs
      .filter((page) => page.slug && page.slug !== 'home')
      .map((page) => ({ lastModified: page.updatedAt, url: getAbsoluteURL(`/${page.slug}`) })),
    ...posts.docs
      .filter((post) => post.slug)
      .map((post) => ({ lastModified: post.updatedAt, url: getAbsoluteURL(`/posts/${post.slug}`) })),
  ]
}
