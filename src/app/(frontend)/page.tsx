import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { User } from '@/payload-types'
import { PortalDashboard, PortalPublicHome } from './_components/PortalShell'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getBriefPublicPageCopy } from '@/utilities/pageCopy'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    const [dailyBrief, profile, pointSummary, recentPosts, upcomingEvents, recentProjects] =
      await Promise.all([
        getLatestDailyBrief(user),
        getProfileForUser(user.id),
        getPointSummary(user),
        getRecentPosts(),
        getUpcomingEvents(user),
        getRecentlyActiveProjects(user),
      ])

    return (
      <PortalDashboard
        dailyBrief={dailyBrief}
        pointEvents={pointSummary.events}
        pointsTotal={pointSummary.total}
        profile={profile}
        recentProjects={recentProjects}
        recentPosts={recentPosts}
        upcomingEvents={upcomingEvents}
        user={user}
      />
    )
  }

  const [copy, posts, projects, upcomingEvents, weeklyBrief] = await Promise.all([
    getBriefPublicPageCopy(),
    getRecentPosts(),
    getProjects(),
    getPublicUpcomingEvents(),
    getLatestWeeklyBrief(),
  ])

  return (
    <PortalPublicHome
      copy={copy}
      posts={posts}
      projects={projects}
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
          briefType: {
            equals: 'daily',
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

const getRecentlyActiveProjects = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    depth: 1,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    sort: '-lastActiveAt',
    user,
    where: {
      _status: {
        equals: 'published',
      },
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
