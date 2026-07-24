import type { Cohort } from '@/payload-types'

export const selectFeaturedCohort = (cohorts: Cohort[]) =>
  cohorts.find((cohort) => cohort.programStatus === 'active') ||
  cohorts.find(
    (cohort) => cohort.programStatus === 'upcoming' && cohort.enrollmentStatus === 'open',
  ) ||
  cohorts.find((cohort) => cohort.programStatus === 'gathering-interest') ||
  cohorts.find((cohort) => cohort.programStatus === 'upcoming') ||
  null

export const getCohortLabel = (cohort: Pick<Cohort, 'cohortNumber' | 'title'>) =>
  cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : cohort.title

export const getCohortInquiryHref = (
  cohort: Pick<Cohort, 'cohortNumber' | 'slug' | 'title'>,
  intent: 'interested' | 'suggest-topic',
) => {
  const params = new URLSearchParams({
    cohort: cohort.slug,
    cohortTitle: getCohortLabel(cohort),
    context: 'cohort-interest',
    intent,
  })

  return `/inquire/general?${params.toString()}`
}
