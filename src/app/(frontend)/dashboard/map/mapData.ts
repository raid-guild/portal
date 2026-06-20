import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  Event,
  Module as PortalModule,
  PointEvent,
  Post,
  Profile,
  ProfileRole,
  User,
  WikiPage,
} from '@/payload-types'
import {
  availableSpriteSlugs,
  missingArtRoleSlugs,
  roleSpriteAliases,
} from '@/app/(frontend)/dashboard/map/mapConfig'
import { engagementDateKey, normalizeEngagementDate } from '@/utilities/dailyEngagement'
import { getDashboardMapPageCopy, type ProductPageCopy } from '@/utilities/pageCopy'

export type SelectableMapRole = {
  available: boolean
  description: null | string
  slug: string
  spriteSlug?: string
  title: string
}

export type PointsLeaderboardEntry = {
  avatarURL?: string
  displayName: string
  handle?: string
  isCurrentUser: boolean
  pointsTotal: number
  rank: number
}

export type MapDashboardData = {
  copy: ProductPageCopy
  dailyEngagementSummary: {
    currentStreak: number
    hasCheckedInToday: boolean
    todayVibe?: null | string
  }
  latestPost: null | Post
  leaderboard: PointsLeaderboardEntry[]
  pointsTotal: number
  profile: null | Profile
  prototypeModules: PortalModule[]
  recentPointEvents: PointEvent[]
  recentWikiPages: WikiPage[]
  selectableRoles: SelectableMapRole[]
  upcomingEvents: Event[]
}

export const getMapDashboardData = async (user: User): Promise<MapDashboardData> => {
  const [
    copy,
    profile,
    latestPost,
    prototypeModules,
    recentWikiPages,
    upcomingEvents,
    pointSummary,
    dailyEngagementSummary,
  ] = await Promise.all([
    getDashboardMapPageCopy(),
    getProfileForUser(user.id),
    getLatestPost(user),
    getPrototypeModules(user),
    getRecentWikiPages(user),
    getUpcomingEvents(user),
    getPointSummary(user),
    getDailyEngagementSummary(user),
  ])

  return {
    copy,
    dailyEngagementSummary,
    latestPost,
    leaderboard: [],
    pointsTotal: pointSummary.total,
    profile,
    prototypeModules,
    recentPointEvents: pointSummary.events,
    recentWikiPages,
    selectableRoles: getSelectableRoles(profile),
    upcomingEvents,
  }
}

const getProfileForUser = async (userID: number | string) => {
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

const getLatestPost = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    user,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs[0] || null
}

const getPrototypeModules = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'modules',
    depth: 1,
    limit: 4,
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
            in: ['idea', 'prototype'],
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
    limit: 3,
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
    console.warn('Unable to load map daily engagement summary.', err)
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

const getSelectableRoles = (profile: null | Profile): SelectableMapRole[] => {
  const roles = profile?.profileRoles || []

  return roles.reduce<SelectableMapRole[]>((selectableRoles, role) => {
    if (!role || typeof role !== 'object') return selectableRoles

    const roleDoc = role as ProfileRole
    const slug = roleDoc.slug
    if (!slug) return selectableRoles

    const spriteSlug = roleSpriteAliases[slug] || slug
    const available =
      availableSpriteSlugs.includes(spriteSlug as (typeof availableSpriteSlugs)[number]) &&
      !missingArtRoleSlugs.includes(slug as (typeof missingArtRoleSlugs)[number])

    selectableRoles.push({
      available,
      description: roleDoc.description || null,
      slug,
      spriteSlug: available ? spriteSlug : undefined,
      title: roleDoc.title,
    })
    return selectableRoles
  }, [])
}
