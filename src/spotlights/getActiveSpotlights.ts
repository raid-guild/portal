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
    limit,
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

  return result.docs
}
