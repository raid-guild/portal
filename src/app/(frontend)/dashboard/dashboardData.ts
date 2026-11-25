import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { ActivityItem, Profile, User } from '@/payload-types'
import { getCohortCards } from '@/cohorts/getFeaturedCohort'
import { getActiveSpotlights } from '@/spotlights/getActiveSpotlights'
import { getHomeFeaturedModules } from '@/modules/getHomeFeaturedModules'
import type { RecentContributor, RecentContributorMode } from './dashboardTypes'

const recentContributorWindowDays = 90
const memberDiscoveryPoolLimit = 1000

export const getAuthenticatedDashboardData = async (user: User) => {
  const [
    dailyBrief,
    profile,
    recentPosts,
    upcomingEvents,
    spotlights,
    dashboardStats,
    featuredModules,
    recentWikiPages,
    weekEvents,
    recentContributorResult,
    cohortCards,
  ] = await Promise.all([
    getLatestDashboardBrief(user),
    getProfileForUser(user.id),
    getRecentPosts(),
    getUpcomingEvents(user),
    getActiveSpotlights({ user }),
    getDashboardStats(user),
    getHomeFeaturedModules(user),
    getRecentWikiPages(user),
    getWeekEvents(user),
    getRecentContributors(user),
    getCohortCards({ user, visibility: 'visible-to-user' }),
  ])

  const [currentCommitment, nextCommitment] = await Promise.all([
    cohortCards.current && profile
      ? getCohortCommitment(user, cohortCards.current.id, profile.id)
      : null,
    cohortCards.next && profile ? getCohortCommitment(user, cohortCards.next.id, profile.id) : null,
  ])

  return {
    recentContributorMode: recentContributorResult.mode,
    recentContributors: recentContributorResult.contributors,
    dailyBrief,
    dashboardStats,
    featuredModules,
    cohortCards,
    currentCommitment,
    nextCommitment,
    profile,
    recentPosts,
    recentWikiPages,
    spotlights,
    upcomingEvents,
    weekEvents,
  }
}

const getCohortCommitment = async (user: User, cohortID: number, profileID: number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cohortCommitments',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [{ cohort: { equals: cohortID } }, { profile: { equals: profileID } }],
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

const getRecentContributors = async (
  user: User,
): Promise<{ contributors: RecentContributor[]; mode: RecentContributorMode }> => {
  const payload = await getPayload({ config: configPromise })
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - recentContributorWindowDays)

  const activityResult = await payload.find({
    collection: 'activityItems',
    depth: 0,
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    sort: '-happenedAt',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          happenedAt: {
            greater_than_equal: cutoff.toISOString(),
          },
        },
      ],
    },
  })

  const latestActivityByProfileID = new Map<string, ActivityItem>()

  activityResult.docs.forEach((activity) => {
    activity.creditedProfiles?.forEach((profile) => {
      const profileID = getRelationshipID(profile)
      if (!profileID || latestActivityByProfileID.has(profileID)) return
      latestActivityByProfileID.set(profileID, activity)
    })
  })

  const profileIDs = [...latestActivityByProfileID.keys()]
  if (profileIDs.length) {
    const profileResult = await payload.find({
      collection: 'profiles',
      depth: 1,
      limit: profileIDs.length,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        and: [
          {
            id: {
              in: profileIDs,
            },
          },
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

    const profilesByID = new Map(
      profileResult.docs.map((profile) => [String(profile.id), profile] as const),
    )
    const contributors = profileIDs
      .flatMap((profileID) => {
        const activity = latestActivityByProfileID.get(profileID)
        const profile = profilesByID.get(profileID)
        if (!activity || !profile) return []

        return [
          {
            activity: {
              activityType: activity.activityType,
              happenedAt: activity.happenedAt,
              title: activity.title,
            },
            profile,
          },
        ]
      })
      .slice(0, 8)

    if (contributors.length) {
      return {
        contributors,
        mode: 'recent-contributors',
      }
    }
  }

  const fallbackProfiles = await payload.find({
    collection: 'profiles',
    depth: 1,
    limit: memberDiscoveryPoolLimit,
    overrideAccess: false,
    pagination: false,
    sort: 'displayName',
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
  const memberDiscoverySeed = getMemberDiscoverySeed()
  const memberDiscoveryProfiles = fallbackProfiles.docs
    .map((profile) => ({
      profile,
      contentScore: getFallbackProfileContentScore(profile),
      rotationScore: hashString(`${memberDiscoverySeed}:${profile.id}`),
    }))
    .sort((a, b) => {
      if (b.contentScore !== a.contentScore) return b.contentScore - a.contentScore
      if (a.rotationScore !== b.rotationScore) return a.rotationScore - b.rotationScore
      return a.profile.displayName.localeCompare(b.profile.displayName)
    })
    .slice(0, 8)

  return {
    contributors: memberDiscoveryProfiles.map(({ profile }) => ({ profile })),
    mode: 'member-discovery',
  }
}

const getRelationshipID = (value: number | Profile | string): string | null => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  return value?.id === undefined ? null : String(value.id)
}

const getMemberDiscoverySeed = () => new Date().toISOString().slice(0, 10)

const getFallbackProfileContentScore = (profile: Profile) => {
  let score = 0
  if (profile.bio?.trim()) score += 2
  if (profile.avatar) score += 2
  if (profile.links?.length) score += 1
  return score
}

const hashString = (value: string) => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return hash >>> 0
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
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 4),
  )
  const windowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 5),
  )

  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 100,
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
