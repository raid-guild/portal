import type { PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

type DigestItem = {
  id: number | string
  title: string
  url: string
}

export type UserNotificationDigest = {
  activityItems: DigestItem[]
  badges: DigestItem[]
  briefs: DigestItem[]
  counts: {
    activityItems: number
    badges: number
    briefs: number
    projects: number
    upcomingEvents: number
  }
  projects: DigestItem[]
  since: string
  upcomingEvents: DigestItem[]
  until: string
}

type GetUserNotificationDigestArgs = {
  req: PayloadRequest
  since: Date
  until?: Date
  user: User
}

export const getUserNotificationDigest = async ({
  req,
  since,
  until = new Date(),
  user,
}: GetUserNotificationDigestArgs): Promise<UserNotificationDigest> => {
  const [briefs, activityItems, upcomingEvents, projects, badges] = await Promise.all([
    getBriefs({ req, since, until, user }),
    getActivityItems({ req, since, until, user }),
    getUpcomingEvents({ req, until, user }),
    getProjects({ req, since, until, user }),
    getBadges({ req, since, until, user }),
  ])

  return {
    activityItems,
    badges,
    briefs,
    counts: {
      activityItems: activityItems.length,
      badges: badges.length,
      briefs: briefs.length,
      projects: projects.length,
      upcomingEvents: upcomingEvents.length,
    },
    projects,
    since: since.toISOString(),
    upcomingEvents,
    until: until.toISOString(),
  }
}

export const digestHasUpdates = (digest: UserNotificationDigest) =>
  Object.values(digest.counts).some((count) => count > 0)

export const summarizeDigest = (digest: UserNotificationDigest) => {
  const parts = [
    countLabel(digest.counts.upcomingEvents, 'upcoming session'),
    countLabel(digest.counts.briefs, 'new brief'),
    countLabel(digest.counts.activityItems, 'activity update'),
    countLabel(digest.counts.projects, 'active project'),
    countLabel(digest.counts.badges, 'badge received', 'badges received'),
  ].filter(Boolean)

  return parts.length
    ? `Your weekly portal digest includes ${parts.join(', ')}.`
    : 'No new portal updates matched this digest window.'
}

const getBriefs = async ({
  req,
  since,
  until,
  user,
}: {
  req: PayloadRequest
  since: Date
  until: Date
  user: User
}): Promise<DigestItem[]> => {
  const result = await req.payload.find({
    collection: 'dailyBriefs',
    depth: 0,
    draft: false,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    req,
    sort: '-publishedAt',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          publishedAt: {
            greater_than_equal: since.toISOString(),
          },
        },
        {
          publishedAt: {
            less_than_equal: until.toISOString(),
          },
        },
      ],
    },
  })

  return result.docs.map((brief) => ({
    id: brief.id,
    title: brief.title,
    url: '/dashboard',
  }))
}

const getActivityItems = async ({
  req,
  since,
  until,
  user,
}: {
  req: PayloadRequest
  since: Date
  until: Date
  user: User
}): Promise<DigestItem[]> => {
  const result = await req.payload.find({
    collection: 'activityItems',
    depth: 0,
    draft: false,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    req,
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
            greater_than_equal: since.toISOString(),
          },
        },
        {
          happenedAt: {
            less_than_equal: until.toISOString(),
          },
        },
      ],
    },
  })

  return result.docs.map((item) => ({
    id: item.id,
    title: item.title,
    url: '/dashboard',
  }))
}

const getUpcomingEvents = async ({
  req,
  until,
  user,
}: {
  req: PayloadRequest
  until: Date
  user: User
}): Promise<DigestItem[]> => {
  const result = await req.payload.find({
    collection: 'events',
    depth: 0,
    draft: false,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    req,
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
            greater_than_equal: until.toISOString(),
          },
        },
      ],
    },
  })

  return result.docs.map((event) => ({
    id: event.id,
    title: event.title,
    url: `/events/${event.id}`,
  }))
}

const getProjects = async ({
  req,
  since,
  until,
  user,
}: {
  req: PayloadRequest
  since: Date
  until: Date
  user: User
}): Promise<DigestItem[]> => {
  const result = await req.payload.find({
    collection: 'projects',
    depth: 0,
    draft: false,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    req,
    sort: '-lastActiveAt',
    user,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          lastActiveAt: {
            greater_than_equal: since.toISOString(),
          },
        },
        {
          lastActiveAt: {
            less_than_equal: until.toISOString(),
          },
        },
      ],
    },
  })

  return result.docs.map((project) => ({
    id: project.id,
    title: project.title,
    url: `/projects/${project.slug}`,
  }))
}

const getBadges = async ({
  req,
  since,
  until,
  user,
}: {
  req: PayloadRequest
  since: Date
  until: Date
  user: User
}): Promise<DigestItem[]> => {
  const profiles = await req.payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    req,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })
  const profileIDs = profiles.docs.map((profile) => String(profile.id))

  if (!profileIDs.length) return []

  const result = await req.payload.find({
    collection: 'profileBadges',
    depth: 1,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    req,
    sort: '-awardedAt',
    user,
    where: {
      and: [
        {
          profiles: {
            in: profileIDs,
          },
        },
        {
          awardedAt: {
            greater_than_equal: since.toISOString(),
          },
        },
        {
          awardedAt: {
            less_than_equal: until.toISOString(),
          },
        },
      ],
    },
  })

  return result.docs.map((award) => {
    const badge = typeof award.badge === 'object' ? award.badge : null

    return {
      id: award.id,
      title: badge?.title || 'Badge awarded',
      url: '/badges',
    }
  })
}

const countLabel = (count: number, label: string, pluralLabel?: string) => {
  if (!count) return ''

  return `${count} ${count === 1 ? label : pluralLabel || `${label}s`}`
}
