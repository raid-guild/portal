import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Spotlight, User } from '@/payload-types'

type GetActiveSpotlightsArgs = {
  limit?: number
  user?: User | null
}

export const getActiveSpotlights = async ({
  limit = 3,
  user,
}: GetActiveSpotlightsArgs = {}): Promise<Spotlight[]> => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'spotlights',
    depth: 1,
    draft: false,
    limit: Math.max(limit, 10),
    overrideAccess: false,
    pagination: false,
    sort: '-priority',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          or: [
            {
              startsAt: {
                exists: false,
              },
            },
            {
              startsAt: {
                less_than_equal: now,
              },
            },
          ],
        },
        {
          or: [
            {
              expiresAt: {
                exists: false,
              },
            },
            {
              expiresAt: {
                greater_than: now,
              },
            },
          ],
        },
      ],
    },
  })

  const featured = result.docs.find((spotlight) => spotlight.kind === 'featured')
  const announcementLimit = Math.max(limit - (featured ? 1 : 0), 0)
  const announcements = result.docs
    .filter((spotlight) => spotlight.kind === 'announcement' && spotlight.id !== featured?.id)
    .slice(0, announcementLimit)

  return featured ? [featured, ...announcements] : announcements.slice(0, limit)
}
