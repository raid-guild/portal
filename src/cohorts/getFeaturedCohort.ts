import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Cohort, User } from '@/payload-types'
import { selectFeaturedCohort } from './selectFeaturedCohort'

type FeaturedCohortOptions = {
  user?: User
  visibility: 'public' | 'visible-to-user'
}

export const getFeaturedCohort = async ({
  user,
  visibility,
}: FeaturedCohortOptions): Promise<Cohort | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cohorts',
    depth: 1,
    draft: false,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    user,
    where: {
      and: [
        { _status: { equals: 'published' } },
        { programStatus: { in: ['gathering-interest', 'upcoming', 'active'] } },
        visibility === 'public'
          ? { visibility: { equals: 'public' } }
          : { visibility: { not_equals: 'admin' } },
      ],
    },
  })

  return selectFeaturedCohort(result.docs)
}
