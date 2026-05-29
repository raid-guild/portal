import type { PayloadRequest } from 'payload'

import { createNotificationForUser } from './createNotification'
import { getUserNotificationDigest } from './getUserNotificationDigest'

type CreateActivityDigestNotificationsArgs = {
  dryRun?: boolean
  limit?: number
  req: PayloadRequest
  since?: Date
  until?: Date
}

export const createActivityDigestNotifications = async ({
  dryRun = false,
  limit = 100,
  req,
  since,
  until = new Date(),
}: CreateActivityDigestNotificationsArgs) => {
  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 250)
  const digestSince = since || new Date(until.getTime() - 24 * 60 * 60 * 1000)
  const result = {
    created: 0,
    dryRun,
    skippedEmpty: 0,
    usersChecked: 0,
  }
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const users = await req.payload.find({
      collection: 'users',
      depth: 0,
      limit: normalizedLimit,
      overrideAccess: true,
      page,
      req,
      sort: 'createdAt',
    })

    result.usersChecked += users.docs.length

    for (const user of users.docs) {
      if (Array.isArray(user.roles) && user.roles.includes('agent')) continue

      const digest = await getUserNotificationDigest({
        req,
        since: digestSince,
        until,
        user,
      })

      if (!digest.activityItems.length) {
        result.skippedEmpty += 1
        continue
      }

      if (dryRun) continue

      const notification = await createNotificationForUser({
        data: {
          actionLabel: 'Open dashboard',
          actionURL: '/dashboard',
          body: summarizeActivityDigest(digest.activityItems.length),
          metadata: {
            activityItems: digest.activityItems,
            count: digest.activityItems.length,
            since: digest.since,
            until: digest.until,
          },
          priority: 'normal',
          title: 'Your RaidGuild activity digest',
          type: 'activity_digest',
        },
        dedupeKey: `activity-digest:${digestSince.toISOString().slice(0, 10)}:${until
          .toISOString()
          .slice(0, 10)}:user:${user.id}`,
        preferenceKey: 'activityDigest',
        req,
        user,
      })

      if (notification) result.created += 1
    }

    hasNextPage = Boolean(users.hasNextPage)
    page += 1
  }

  return {
    ...result,
    since: digestSince.toISOString(),
    until: until.toISOString(),
  }
}

const summarizeActivityDigest = (count: number) =>
  `Your activity digest includes ${count} portal activity update${count === 1 ? '' : 's'}.`
