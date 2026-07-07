import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to view newsletter posts.' }, { status: 401 })
  }

  if (!canEditContent(user)) {
    return Response.json(
      { message: 'Editor access is required to view newsletter posts.' },
      { status: 403 },
    )
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim()

  try {
    const result = await payload.find({
      collection: 'posts',
      depth: 0,
      draft: true,
      limit: 25,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: query
        ? {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          }
        : undefined,
    })

    return Response.json({
      posts: result.docs.map((post) => ({
        id: post.id,
        slug: post.slug || null,
        status: post._status || null,
        title: post.title || `Post ${post.id}`,
        updatedAt: post.updatedAt || null,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load newsletter posts.'

    return Response.json({ message }, { status: 400 })
  }
}
