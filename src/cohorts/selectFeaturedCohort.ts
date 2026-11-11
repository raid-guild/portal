import type { Cohort } from '@/payload-types'

export const selectFeaturedCohort = (cohorts: Cohort[]) =>
  cohorts.find((cohort) => cohort.programStatus === 'active') ||
  cohorts.find(
    (cohort) => cohort.programStatus === 'upcoming' && cohort.enrollmentStatus === 'open',
  ) ||
  cohorts.find((cohort) => cohort.programStatus === 'gathering-interest') ||
  cohorts.find((cohort) => cohort.programStatus === 'upcoming') ||
  null

const byStartDate = (a: Cohort, b: Cohort) => {
  const date = (value?: string | null) => {
    if (!value) return Number.POSITIVE_INFINITY
    const timestamp = new Date(value).getTime()
    return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY
  }

  const first = date(a.startsAt)
  const second = date(b.startsAt)
  return (first === second ? 0 : first - second) || a.slug.localeCompare(b.slug) || a.id - b.id
}

const timestamp = (date?: string | null) => {
  if (!date) return null
  const value = new Date(date).getTime()
  return Number.isFinite(value) ? value : null
}

/** Dates describe a published upcoming cohort's display status without editing its CMS status. */
export const getCohortPresentationStatus = (
  cohort: Cohort,
  now = Date.now(),
): Cohort['programStatus'] => {
  if (cohort.programStatus !== 'upcoming') return cohort.programStatus
  const start = timestamp(cohort.startsAt)
  const end = timestamp(cohort.endsAt)
  if (start === null || end === null || start >= end) return 'upcoming'
  if (now >= end) return 'complete'
  if (now >= start) return 'active'
  return 'upcoming'
}

/** The dashboard and public home show the active and next programs independently. */
export const selectCohortCards = (cohorts: Cohort[], now = Date.now()) => {
  const current =
    cohorts.filter((cohort) => cohort.programStatus === 'active').sort(byStartDate)[0] ||
    cohorts
      .filter((cohort) => getCohortPresentationStatus(cohort, now) === 'active')
      .sort(byStartDate)
      .map((cohort) => ({ ...cohort, programStatus: 'active' as const }))[0] ||
    null
  const next =
    cohorts
      .filter((cohort) => {
        if (cohort.programStatus !== 'upcoming' || cohort.id === current?.id) return false
        const start = timestamp(cohort.startsAt)
        const end = timestamp(cohort.endsAt)
        if (start === null || start <= now) return false
        return end === null || (end > now && end > start)
      })
      .sort(byStartDate)[0] ||
    cohorts
      .filter((cohort) => {
        if (cohort.programStatus !== 'upcoming' || cohort.id === current?.id) return false
        if (cohort.startsAt) return false
        const end = timestamp(cohort.endsAt)
        return end === null || end > now
      })
      .sort(byStartDate)[0] ||
    cohorts
      .filter(
        (cohort) => cohort.programStatus === 'gathering-interest' && cohort.id !== current?.id,
      )
      .sort(byStartDate)[0] ||
    null

  return { current, next }
}

export const getCohortLabel = (cohort: Pick<Cohort, 'cohortNumber' | 'title'>) =>
  cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : cohort.title

export const isCohortEnrollmentOpen = (
  cohort: Pick<
    Cohort,
    'enrollmentClosesAt' | 'enrollmentOpensAt' | 'enrollmentStatus' | 'programStatus'
  >,
  now = Date.now(),
) =>
  cohort.programStatus !== 'gathering-interest' &&
  cohort.enrollmentStatus === 'open' &&
  (!cohort.enrollmentOpensAt || new Date(cohort.enrollmentOpensAt).getTime() <= now) &&
  (!cohort.enrollmentClosesAt || new Date(cohort.enrollmentClosesAt).getTime() >= now)

export const getCohortEnrollmentLabel = (
  cohort: Pick<
    Cohort,
    'enrollmentClosesAt' | 'enrollmentOpensAt' | 'enrollmentStatus' | 'programStatus'
  >,
  now = Date.now(),
) => {
  if (cohort.programStatus === 'gathering-interest') return 'Gathering interest'
  if (isCohortEnrollmentOpen(cohort, now)) return 'Enrollment open'
  if (cohort.enrollmentClosesAt && new Date(cohort.enrollmentClosesAt).getTime() < now) {
    return 'Enrollment closed'
  }
  if (cohort.enrollmentOpensAt && new Date(cohort.enrollmentOpensAt).getTime() > now) {
    return 'Enrollment not open yet'
  }
  if (cohort.enrollmentStatus === 'waitlist') return 'Waitlist open'
  if (cohort.enrollmentStatus === 'closed') return 'Enrollment closed'
  return 'Enrollment not open yet'
}

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
