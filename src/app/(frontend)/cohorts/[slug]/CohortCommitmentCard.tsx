'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Cohort } from '@/payload-types'
import { getCohortInquiryHref } from '@/cohorts/selectFeaturedCohort'
import { trackPortalEvent } from '@/utilities/analytics'
import { TrackedInquiryLink } from '../../_components/TrackedInquiryLink'

type Props = {
  cohortID: number
  cohortLabel: string
  cohortSlug: string
  commitmentID?: number
  commitmentStatus?: 'committed' | 'waitlisted' | 'withdrawn'
  enrollmentOpen: boolean
  hasProfile: boolean
  isAuthenticated: boolean
  programStatus: Cohort['programStatus']
}

export const CohortCommitmentCard = ({
  cohortID,
  cohortLabel,
  cohortSlug,
  commitmentID,
  commitmentStatus,
  enrollmentOpen,
  hasProfile,
  isAuthenticated,
  programStatus,
}: Props) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const returnPath = `/cohorts/${cohortSlug}`
  const inquiryCohort = { cohortNumber: null, slug: cohortSlug, title: cohortLabel }

  const updateCommitment = async (status: 'committed' | 'withdrawn') => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(
        commitmentID ? `/api/cohortCommitments/${commitmentID}` : '/api/cohortCommitments',
        {
          body: JSON.stringify(commitmentID ? { status } : { cohort: cohortID, status }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: commitmentID ? 'PATCH' : 'POST',
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(
          body?.errors?.[0]?.message || body?.message || 'Unable to update commitment.',
        )
      }

      trackPortalEvent(
        status === 'withdrawn' ? 'Cohort Commitment Withdrawn' : 'Cohort Commitment Created',
        { cohort_slug: cohortSlug },
      )
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update commitment.')
    } finally {
      setIsLoading(false)
    }
  }

  if (programStatus === 'gathering-interest') {
    return (
      <div className="portal-panel border-primary/50 bg-primary/10">
        <p className="portal-kicker">Gathering interest</p>
        <h2 className="portal-heading-sm mt-3">Help shape this future cohort</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Dates and enrollment are not official yet. Tell the guild you would participate or suggest
          a topic that would make the cohort useful.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <TrackedInquiryLink
            className="portal-admin-link"
            cohortInterestIntent="interested"
            cohortSlug={cohortSlug}
            href={getCohortInquiryHref(inquiryCohort, 'interested')}
            inquiryType="general"
            placement="cohort_interest_card"
          >
            I&apos;m interested
          </TrackedInquiryLink>
          <TrackedInquiryLink
            className="portal-admin-link"
            cohortInterestIntent="suggest-topic"
            cohortSlug={cohortSlug}
            href={getCohortInquiryHref(inquiryCohort, 'suggest-topic')}
            inquiryType="general"
            placement="cohort_interest_topic"
          >
            Suggest a topic
          </TrackedInquiryLink>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="portal-panel border-primary/50 bg-primary/10">
        <p className="portal-kicker">Commit to participate</p>
        <h2 className="portal-heading-sm mt-3">Join this cohort</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Log in or create an account, then connect your Portal profile to confirm your place.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(returnPath)}`}>Log in to join</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/join?next=${encodeURIComponent(returnPath)}`}>Create account</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="portal-panel border-primary/50 bg-primary/10">
        <p className="portal-kicker">One step left</p>
        <h2 className="portal-heading-sm mt-3">Complete your Portal profile</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Cohort commitments attach to Profiles so participation stays connected to your work.
        </p>
        <Button asChild className="mt-5">
          <Link href={`/me?next=${encodeURIComponent(returnPath)}`}>Create profile</Link>
        </Button>
      </div>
    )
  }

  if (commitmentStatus === 'committed' || commitmentStatus === 'waitlisted') {
    return (
      <div className="portal-panel border-success/50 bg-success/10">
        <p className="portal-kicker">
          {commitmentStatus === 'waitlisted' ? 'Waitlisted' : 'Committed'}
        </p>
        <h2 className="portal-heading-sm mt-3">You are connected to this cohort.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Return here for the next session, schedule, and new cohort work.
        </p>
        <Button
          className="mt-5"
          disabled={isLoading}
          onClick={() => updateCommitment('withdrawn')}
          variant="outline"
        >
          {isLoading ? 'Updating...' : 'Withdraw commitment'}
        </Button>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>
    )
  }

  if (!enrollmentOpen) {
    return (
      <div className="portal-panel">
        <p className="portal-kicker">Enrollment closed</p>
        <h2 className="portal-heading-sm mt-3">Follow the cohort</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sessions and published outcomes will continue to appear on this page.
        </p>
      </div>
    )
  }

  return (
    <div className="portal-panel border-primary/50 bg-primary/10">
      <p className="portal-kicker">Enrollment open</p>
      <h2 className="portal-heading-sm mt-3">
        {commitmentStatus === 'withdrawn' ? 'Rejoin this cohort' : 'Commit to participate'}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Confirm that you intend to show up and participate in the cohort program.
      </p>
      <Button className="mt-5" disabled={isLoading} onClick={() => updateCommitment('committed')}>
        {isLoading ? 'Saving commitment...' : 'Join the cohort'}
      </Button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
