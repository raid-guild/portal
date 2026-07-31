import React from 'react'

import {
  getCohortInquiryHref,
  getCohortLabel,
  isCohortEnrollmentOpen,
} from '@/cohorts/selectFeaturedCohort'
import type { Cohort, CohortCommitment } from '@/payload-types'

import { TrackedCohortLink } from './TrackedCohortLink'
import { TrackedInquiryLink } from './TrackedInquiryLink'

type Props = {
  cohort?: Cohort | null
  commitment?: CohortCommitment | null
  hasProfile?: boolean
  interestPlacement?: string
  placement: string
  postSlug?: string
}

export const CohortCalloutCard: React.FC<Props> = ({
  cohort,
  commitment,
  hasProfile,
  interestPlacement,
  placement,
  postSlug,
}) => {
  if (!cohort) {
    return (
      <section
        aria-label="RaidGuild cohort"
        className="portal-panel border-primary/40 bg-primary/10"
      >
        <p className="portal-kicker">Next RaidGuild cohort</p>
        <h2 className="portal-heading-sm mt-3">Interested in the next cohort?</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          No cohort is scheduled yet. Tell the guild what you would like to explore when the next
          program takes shape.
        </p>
        <TrackedInquiryLink
          className="portal-admin-link mt-5 inline-flex"
          cohortInterestIntent="interested"
          cohortSlug="unscheduled"
          href="/inquire/general?context=cohort-interest&intent=interested"
          inquiryType="general"
          placement={interestPlacement || placement}
          postSlug={postSlug}
        >
          Signal interest
        </TrackedInquiryLink>
      </section>
    )
  }

  const cohortHref = `/cohorts/${cohort.slug}`
  const isGatheringInterest = cohort.programStatus === 'gathering-interest'
  const isCommitted = commitment?.status === 'committed' || commitment?.status === 'waitlisted'
  const enrollmentOpen = isCohortEnrollmentOpen(cohort)
  const countdown = getCohortCountdown(cohort)
  const heading = isGatheringInterest
    ? `${getCohortLabel(cohort)} is gathering interest`
    : enrollmentOpen
      ? `Join ${cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : 'the cohort'}`
      : cohort.programStatus === 'active'
        ? `${cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : 'The cohort'} is underway`
        : `Next cohort${cohort.cohortNumber ? `: Cohort ${cohort.cohortNumber}` : ''}`
  const cta = isGatheringInterest
    ? 'Signal interest'
    : isCommitted
      ? 'Open your cohort'
      : hasProfile === false && enrollmentOpen
        ? 'Complete profile to join'
        : enrollmentOpen
          ? 'Join the cohort'
          : 'Explore the cohort'

  return (
    <section aria-label="RaidGuild cohort" className="portal-panel border-primary/40 bg-primary/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="portal-kicker">Current program</p>
        <span className="portal-pill">
          {isCommitted ? 'Committed' : cohort.enrollmentStatus.replace('-', ' ')}
        </span>
      </div>
      <h2 className="portal-heading-sm mt-3">{heading}</h2>
      <p className="mt-2 font-serif text-xl font-bold text-primary">{cohort.theme}</p>
      {countdown ? (
        <div className="mt-4 border-l-2 border-primary bg-background/30 px-4 py-3">
          <p className="font-serif text-lg font-bold text-foreground">{countdown.label}</p>
          <time
            className="mt-1 block font-mono text-xs uppercase tracking-wide text-muted-foreground"
            dateTime={cohort.startsAt || undefined}
          >
            Starts {countdown.startDate}
          </time>
        </div>
      ) : null}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{cohort.summary}</p>
      {isGatheringInterest ? (
        <TrackedInquiryLink
          className="portal-admin-link mt-5 inline-flex"
          cohortInterestIntent="interested"
          cohortSlug={cohort.slug}
          href={getCohortInquiryHref(cohort, 'interested')}
          inquiryType="general"
          placement={interestPlacement || placement}
          postSlug={postSlug}
        >
          {cta}
        </TrackedInquiryLink>
      ) : (
        <TrackedCohortLink
          className="portal-admin-link mt-5 inline-flex"
          cohortSlug={cohort.slug}
          href={cohortHref}
          placement={placement}
          postSlug={postSlug}
        >
          {cta}
        </TrackedCohortLink>
      )}
    </section>
  )
}

const getCohortCountdown = (cohort: Cohort, now = new Date()) => {
  if (cohort.programStatus !== 'upcoming' || !cohort.startsAt) return null

  const startsAt = new Date(cohort.startsAt)
  const millisecondsUntilStart = startsAt.getTime() - now.getTime()

  if (!Number.isFinite(startsAt.getTime()) || millisecondsUntilStart <= 0) return null

  const cohortName = cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : 'The next cohort'
  const startsToday = startsAt.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)
  const daysUntilStart = Math.ceil(millisecondsUntilStart / (24 * 60 * 60 * 1000))

  return {
    label: startsToday
      ? `${cohortName} starts today`
      : `${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'} until ${cohortName} starts`,
    startDate: new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
      year: 'numeric',
    }).format(startsAt),
  }
}
