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
  if (!isEligibleForPublishedNotification(doc)) return doc
  if (previousDoc && isEligibleForPublishedNotification(previousDoc)) return doc

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

const isEligibleForPublishedNotification = (event: Partial<Event>) =>
  event._status === 'published' &&
  event.visibility !== 'admin' &&
  Boolean(event.startsAt && new Date(event.startsAt).getTime() > Date.now())
