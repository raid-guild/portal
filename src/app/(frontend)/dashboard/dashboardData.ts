import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getActiveSpotlights } from '@/spotlights/getActiveSpotlights'
import { engagementDateKey, normalizeEngagementDate } from '@/utilities/dailyEngagement'

export const getAuthenticatedDashboardData = async (user: User) => {
  const [
    dailyBrief,
    dailyEngagementSummary,
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
    getLatestDashboardBrief(user),
    getDailyEngagementSummary(user),
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

  return {
    activeProfiles,
    dailyBrief,
    dailyEngagementSummary,
    dashboardStats,
    featuredModules,
    pointSummary,
    profile,
    recentPosts,
    recentWikiPages,
    spotlights,
    upcomingEvents,
    weekEvents,
  }
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

const getLatestDashboardBrief = async (user: User) => {
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
  const windowStart = new Date()
  windowStart.setHours(0, 0, 0, 0)
  windowStart.setDate(windowStart.getDate() - 3)
  const windowEnd = new Date()
  windowEnd.setHours(0, 0, 0, 0)
  windowEnd.setDate(windowEnd.getDate() + 7)

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
            greater_than_equal: windowStart.toISOString(),
          },
        },
        {
          startsAt: {
            less_than: windowEnd.toISOString(),
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
