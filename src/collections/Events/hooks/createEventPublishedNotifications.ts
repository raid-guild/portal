import type { CollectionAfterChangeHook } from 'payload'

import type { Event } from '@/payload-types'
import { createNotificationsForEligibleUsers } from '@/notifications/createNotification'

export const createEventPublishedNotifications: CollectionAfterChangeHook<Event> = async ({
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
  if (!doc.startsAt || new Date(doc.startsAt).getTime() <= Date.now()) return doc

  try {
    await createNotificationsForEligibleUsers({
      buildNotification: (user) => ({
        data: {
          actionLabel: 'View session',
          actionURL: `/events/${doc.id}`,
          body: doc.summary || undefined,
          priority: 'normal',
          relatedEvent: doc.id,
          title: `New session: ${doc.title}`,
          type: 'event_published',
        },
        dedupeKey: `event:${doc.id}:published:user:${user.id}`,
      }),
      preferenceKey: 'sessionAnnouncements',
      req,
      visibility: doc.visibility,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      eventID: doc.id,
      msg: 'Failed to create event published notifications.',
    })
  }

  return doc
}
