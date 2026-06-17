import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { User } from '@/payload-types'
import { PortalDashboard, PortalPublicHome } from './_components/PortalShell'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getBriefPublicPageCopy } from '@/utilities/pageCopy'
import { getActiveSpotlights } from '@/spotlights/getActiveSpotlights'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    const [
      dailyBrief,
      profile,
      pointSummary,
      recentPosts,
      upcomingEvents,
      spotlights,
      dashboardStats,
      featuredModules,
      recentWikiPages,
      weekEvents,
      activeProfiles,
    ] = await Promise.all([
      getLatestDailyBrief(user),
      getProfileForUser(user.id),
      getPointSummary(user),
      getRecentPosts(),
      getUpcomingEvents(user),
      getActiveSpotlights({ user }),
      getDashboardStats(user),
      getFeaturedModules(user),
      getRecentWikiPages(user),
      getWeekEvents(user),
      getActiveProfiles(user),
    ])

    return (
      <PortalDashboard
        activeProfiles={activeProfiles}
        dashboardStats={dashboardStats}
        dailyBrief={dailyBrief}
        featuredModules={featuredModules}
        pointEvents={pointSummary.events}
        pointsTotal={pointSummary.total}
        profile={profile}
        recentPosts={recentPosts}
        recentWikiPages={recentWikiPages}
        spotlights={spotlights}
        upcomingEvents={upcomingEvents}
        weekEvents={weekEvents}
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

const getProfileForUser = async (userID: string | number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const getLatestDailyBrief = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'dailyBriefs',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-briefDate',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          visibility: {
            not_equals: 'admin',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}

const getUpcomingEvents = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    user,
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
            not_equals: 'admin',
          },
        },
      ],
    },
  })

  return result.docs
}

const getDashboardStats = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const publishedOnly = {
    _status: {
      equals: 'published',
    },
  }
  const nonAdminVisibility = {
    visibility: {
      not_equals: 'admin',
    },
  }

  const [sessions, posts, modules, wikiPages] = await Promise.all([
    payload.count({
      collection: 'events',
      overrideAccess: false,
      user,
      where: {
        and: [publishedOnly, nonAdminVisibility],
      },
    }),
    payload.count({
      collection: 'posts',
      overrideAccess: false,
      user,
      where: publishedOnly,
    }),
    payload.count({
      collection: 'modules',
      overrideAccess: false,
      user,
      where: {
        and: [
          {
            enabled: {
              equals: true,
            },
          },
          {
            status: {
              not_equals: 'archived',
            },
          },
        ],
      },
    }),
    payload.count({
      collection: 'wikiPages',
      overrideAccess: false,
      user,
      where: {
        and: [
          publishedOnly,
          {
            reviewStatus: {
              equals: 'reviewed',
            },
          },
          nonAdminVisibility,
        ],
      },
    }),
  ])

  return {
    modules: modules.totalDocs,
    posts: posts.totalDocs,
    sessions: sessions.totalDocs,
    wikiPages: wikiPages.totalDocs,
  }
}

const getActiveProfiles = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 1,
    limit: 8,
    overrideAccess: false,
    pagination: false,
    sort: '-updatedAt',
    user,
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          visibility: {
            not_equals: 'private',
          },
        },
      ],
    },
  })

  return result.docs
}

const getFeaturedModules = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'modules',
    depth: 1,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    sort: '-featured,sortOrder,name',
    user,
    where: {
      and: [
        {
          enabled: {
            equals: true,
          },
        },
        {
          status: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs
}

const getRecentWikiPages = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'wikiPages',
    depth: 1,
    draft: false,
    limit: 4,
    overrideAccess: false,
    pagination: false,
    sort: '-lastReviewedAt',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          reviewStatus: {
            equals: 'reviewed',
          },
        },
        {
          visibility: {
            not_equals: 'admin',
          },
        },
      ],
    },
  })

  return result.docs
}

const getWeekEvents = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)

  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          startsAt: {
            greater_than_equal: now.toISOString(),
          },
        },
        {
          startsAt: {
            less_than: weekEnd.toISOString(),
          },
        },
        {
          visibility: {
            not_equals: 'admin',
          },
        },
      ],
    },
  })

  return result.docs
}

const getPointSummary = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pointEvents',
    depth: 1,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    sort: '-issuedAt',
    user,
    where: {
      and: [
        {
          recipient: {
            equals: user.id,
          },
        },
        {
          status: {
            equals: 'valid',
          },
        },
      ],
    },
  })

  return {
    events: result.docs.slice(0, 5),
    total: result.docs.reduce((sum, event) => sum + (event.amount || 0), 0),
  }
}
