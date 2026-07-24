import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PortalDashboard, PortalPublicHome } from './_components/PortalShell'
import { getAuthenticatedDashboardData } from './dashboard/dashboardData'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getBriefPublicPageCopy } from '@/utilities/pageCopy'
import { getActiveSpotlights } from '@/spotlights/getActiveSpotlights'
import { selectFeaturedCohort } from '@/cohorts/selectFeaturedCohort'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    const dashboardData = await getAuthenticatedDashboardData(user)

    return (
      <PortalDashboard
        cohortCommitment={dashboardData.cohortCommitment}
        dashboardStats={dashboardData.dashboardStats}
        dailyBrief={dashboardData.dailyBrief}
        dailyEngagementSummary={dashboardData.dailyEngagementSummary}
        featuredModules={dashboardData.featuredModules}
        featuredCohort={dashboardData.featuredCohort}
        pointEvents={dashboardData.pointSummary.events}
        pointsTotal={dashboardData.pointSummary.total}
        profile={dashboardData.profile}
        recentPosts={dashboardData.recentPosts}
        recentContributorMode={dashboardData.recentContributorMode}
        recentWikiPages={dashboardData.recentWikiPages}
        recentContributors={dashboardData.recentContributors}
        spotlights={dashboardData.spotlights}
        upcomingEvents={dashboardData.upcomingEvents}
        weekEvents={dashboardData.weekEvents}
        user={user}
      />
    )
  }

  const [copy, posts, cohortSnapshot, upcomingEvents, weeklyBrief, spotlights] = await Promise.all([
    getBriefPublicPageCopy(),
    getRecentPosts(),
    getPublicCohortSnapshot(),
    getPublicUpcomingEvents(),
    getLatestWeeklyBrief(),
    getActiveSpotlights(),
  ])

  return (
    <PortalPublicHome
      cohortSessionThemes={cohortSnapshot.sessionThemes}
      copy={copy}
      featuredCohort={cohortSnapshot.cohort}
      posts={posts}
      spotlights={spotlights}
      upcomingEvents={upcomingEvents}
      weeklyBrief={weeklyBrief}
    />
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getBriefPublicPageCopy()

  return {
    description: copy.seoDescription,
    openGraph: mergeOpenGraph({
      description: copy.seoDescription,
      title: copy.seoTitle,
      url: '/',
    }),
    title: copy.seoTitle,
    twitter: {
      card: 'summary_large_image',
      description: copy.seoDescription,
      images: ['/assets/image.png'],
      title: copy.seoTitle,
    },
  }
}

const getRecentPosts = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: 4,
    overrideAccess: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}

const getPublicCohortSnapshot = async () => {
  const payload = await getPayload({ config: configPromise })
  const cohorts = await payload.find({
    collection: 'cohorts',
    depth: 1,
    draft: false,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { programStatus: { in: ['gathering-interest', 'upcoming', 'active'] } },
        { visibility: { equals: 'public' } },
      ],
    },
  })

  const pastSessions = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 12,
    overrideAccess: false,
    pagination: false,
    sort: '-startsAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { startsAt: { less_than: new Date().toISOString() } },
        { visibility: { equals: 'public' } },
        { relatedCohorts: { exists: true } },
      ],
    },
  })

  return {
    cohort: selectFeaturedCohort(cohorts.docs),
    sessionThemes: pastSessions.docs.slice(0, 3),
  }
}

const getPublicUpcomingEvents = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          startsAt: {
            greater_than_equal: new Date().toISOString(),
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    },
  })

  return result.docs
}

const getLatestWeeklyBrief = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'dailyBriefs',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-briefDate',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          briefType: {
            equals: 'weekly',
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}
