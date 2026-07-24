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

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    const dashboardData = await getAuthenticatedDashboardData(user)

    return (
      <PortalDashboard
        dashboardStats={dashboardData.dashboardStats}
        dailyBrief={dashboardData.dailyBrief}
        dailyEngagementSummary={dashboardData.dailyEngagementSummary}
        featuredModules={dashboardData.featuredModules}
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

  const [copy, posts, projects, upcomingEvents, weeklyBrief, spotlights] = await Promise.all([
    getBriefPublicPageCopy(),
    getRecentPosts(),
    getProjects(),
    getPublicUpcomingEvents(),
    getLatestWeeklyBrief(),
    getActiveSpotlights(),
  ])

  return (
    <PortalPublicHome
      copy={copy}
      posts={posts}
      projects={projects}
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

const getProjects = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 1,
    draft: false,
    limit: 3,
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
