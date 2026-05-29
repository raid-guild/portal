import type { PayloadRequest } from 'payload'

import { createNotificationForUser } from './createNotification'
import {
  digestHasUpdates,
  getUserNotificationDigest,
  summarizeDigest,
} from './getUserNotificationDigest'

type CreateWeeklyDigestNotificationsArgs = {
  dryRun?: boolean
  limit?: number
  req: PayloadRequest
  since?: Date
  until?: Date
}

export const createWeeklyDigestNotifications = async ({
  dryRun = false,
  limit = 100,
  req,
  since,
  until = new Date(),
}: CreateWeeklyDigestNotificationsArgs) => {
  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 250)
  const digestSince = since || new Date(until.getTime() - 7 * 24 * 60 * 60 * 1000)
  const users = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: normalizedLimit,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
  })
  const result = {
    created: 0,
    dryRun,
    skippedEmpty: 0,
    usersChecked: users.docs.length,
  }

  for (const user of users.docs) {
    if (Array.isArray(user.roles) && user.roles.includes('agent')) continue

    const digest = await getUserNotificationDigest({
      req,
      since: digestSince,
      until,
      user,
    })

    if (!digestHasUpdates(digest)) {
      result.skippedEmpty += 1
      continue
    }

    if (dryRun) continue

    const notification = await createNotificationForUser({
      data: {
        actionLabel: 'Open dashboard',
        actionURL: '/dashboard',
        body: summarizeDigest(digest),
        metadata: digest,
        priority: 'normal',
        title: 'Your weekly RaidGuild portal digest',
        type: 'weekly_digest',
      },
      dedupeKey: `weekly-digest:${digestSince.toISOString().slice(0, 10)}:${until
        .toISOString()
        .slice(0, 10)}:user:${user.id}`,
      preferenceKey: 'weeklyDigest',
      req,
      user,
    })

    if (notification) result.created += 1
  }

  return {
    ...result,
    since: digestSince.toISOString(),
    until: until.toISOString(),
  }
}
