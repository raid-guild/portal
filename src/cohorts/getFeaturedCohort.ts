import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Cohort, User } from '@/payload-types'
import { selectCohortCards, selectFeaturedCohort } from './selectFeaturedCohort'

type FeaturedCohortOptions = {
  user?: User
  visibility: 'public' | 'visible-to-user'
}

export const getCohortCandidates = async ({
  user,
  visibility,
}: FeaturedCohortOptions): Promise<Cohort[]> => {
  const payload = await getPayload({ config: configPromise })
  const cohorts: Cohort[] = []
  let page = 1
  while (true) {
    const result = await payload.find({
      collection: 'cohorts',
      depth: 1,
      draft: false,
      limit: 100,
      overrideAccess: false,
      page,
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
    cohorts.push(...result.docs)
    if (!result.hasNextPage) break
    page += 1
  }

  return cohorts
}

export const getFeaturedCohort = async (options: FeaturedCohortOptions): Promise<Cohort | null> => {
  return selectFeaturedCohort(await getCohortCandidates(options))
}

export const getCohortCards = async (options: FeaturedCohortOptions) =>
  selectCohortCards(await getCohortCandidates(options))
