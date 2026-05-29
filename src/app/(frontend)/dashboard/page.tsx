import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { PortalDashboard } from '../_components/PortalShell'
import { engagementDateKey, normalizeEngagementDate } from '@/utilities/dailyEngagement'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  const [
    dailyBrief,
    dailyEngagementSummary,
    profile,
    pointSummary,
    recentPosts,
    upcomingEvents,
    recentProjects,
  ] =
    await Promise.all([
      getLatestDailyBrief(user),
      getDailyEngagementSummary(user),
      getProfileForUser(user.id),
      getPointSummary(user),
      getRecentPosts(),
      getUpcomingEvents(user),
      getRecentlyActiveProjects(user),
    ])

  return (
    <PortalDashboard
      dailyBrief={dailyBrief}
      dailyEngagementSummary={dailyEngagementSummary}
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

export const metadata: Metadata = {
  title: 'Dashboard',
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

const getRecentPosts = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 5,
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

const getDailyEngagementSummary = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const today = engagementDateKey(normalizeEngagementDate())
  try {
    const result = await payload.find({
      collection: 'dailyEngagements',
      depth: 0,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      sort: '-engagementDate',
      user,
      where: {
        and: [
          {
            user: {
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

    const checkedDates = new Set(
      result.docs
        .map((engagement) => engagementDateKey(engagement.engagementDate))
        .filter((date): date is string => Boolean(date)),
    )
    const todayEngagement = result.docs.find(
      (engagement) => engagementDateKey(engagement.engagementDate) === today,
    )

    return {
      currentStreak: getCurrentStreak(checkedDates),
      hasCheckedInToday: Boolean(today && checkedDates.has(today)),
      todayVibe: todayEngagement?.vibe || null,
    }
  } catch (err) {
    console.warn('Unable to load daily engagement summary.', err)
  }

  return {
    currentStreak: 0,
    hasCheckedInToday: false,
    todayVibe: null,
  }
}

const getCurrentStreak = (checkedDates: Set<string>) => {
  let streak = 0
  const cursor = new Date(normalizeEngagementDate())

  while (checkedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}
