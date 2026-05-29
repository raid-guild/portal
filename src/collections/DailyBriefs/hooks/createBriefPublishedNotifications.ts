import type { CollectionAfterChangeHook } from 'payload'

import type { DailyBrief } from '@/payload-types'
import { createNotificationsForEligibleUsers } from '@/notifications/createNotification'

export const createBriefPublishedNotifications: CollectionAfterChangeHook<DailyBrief> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.skipNotificationHooks) return doc
  if (operation !== 'create' && operation !== 'update') return doc
  if (doc._status !== 'published' || previousDoc?._status === 'published') return doc
  if (doc.visibility === 'admin') return doc

  try {
    await createNotificationsForEligibleUsers({
      buildNotification: (user) => ({
        data: {
          actionLabel: 'Open dashboard',
          actionURL: '/dashboard',
          body: doc.summary || undefined,
          priority: 'normal',
          relatedBrief: doc.id,
          title: `New ${doc.briefType || 'portal'} brief: ${doc.title}`,
          type: 'brief_published',
        },
        dedupeKey: `brief:${doc.id}:published:user:${user.id}`,
      }),
      preferenceKey: 'briefs',
      req,
      visibility: doc.visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      briefID: doc.id,
      err: error,
      msg: 'Failed to create brief published notifications.',
    })
  }

  return doc
}
