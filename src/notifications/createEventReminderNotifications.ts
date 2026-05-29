import type { PayloadRequest } from 'payload'

import type { Event } from '@/payload-types'
import { createNotificationsForEligibleUsers } from './createNotification'

const REMINDER_WINDOWS = {
  '1h': {
    label: '1 hour',
    offsetMs: 60 * 60 * 1000,
    priority: 'high',
  },
  '24h': {
    label: '24 hours',
    offsetMs: 24 * 60 * 60 * 1000,
    priority: 'normal',
  },
} as const

export type ReminderWindow = keyof typeof REMINDER_WINDOWS

type CreateEventReminderNotificationsArgs = {
  dryRun?: boolean
  lookaheadMinutes?: number
  now?: Date
  req: PayloadRequest
  windows?: ReminderWindow[]
}

export const createEventReminderNotifications = async ({
  dryRun = false,
  lookaheadMinutes = 15,
  now = new Date(),
  req,
  windows = ['24h', '1h'],
}: CreateEventReminderNotificationsArgs) => {
  const normalizedLookaheadMinutes = Math.min(Math.max(Math.floor(lookaheadMinutes), 1), 180)
  const results: {
    eventsMatched: number
    notificationsAttempted: number
    window: ReminderWindow
  }[] = []

  for (const window of windows) {
    const reminderWindow = REMINDER_WINDOWS[window]
    const startsAtFrom = new Date(now.getTime() + reminderWindow.offsetMs)
    const startsAtTo = new Date(startsAtFrom.getTime() + normalizedLookaheadMinutes * 60 * 1000)

    const events = await req.payload.find({
      collection: 'events',
      depth: 0,
      draft: false,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      req,
      sort: 'startsAt',
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            startsAt: {
              greater_than_equal: startsAtFrom.toISOString(),
            },
          },
          {
            startsAt: {
              less_than: startsAtTo.toISOString(),
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

    let notificationsAttempted = 0

    if (!dryRun) {
      for (const event of events.docs) {
        await createNotificationsForEligibleUsers({
          buildNotification: (user) => {
            notificationsAttempted += 1

            return {
              data: {
                actionLabel: 'View session',
                actionURL: `/events/${event.id}`,
                body: buildReminderBody(event, reminderWindow.label),
                priority: reminderWindow.priority,
                relatedEvent: event.id,
                title: `${event.title} starts in ${reminderWindow.label}`,
                type: 'event_reminder',
              },
              dedupeKey: `event:${event.id}:reminder:${window}:user:${user.id}`,
            }
          },
          preferenceKey: 'sessionReminders',
          req,
          visibility: event.visibility,
        })
      }
    }

    results.push({
      eventsMatched: events.totalDocs,
      notificationsAttempted,
      window,
    })
  }

  return {
    dryRun,
    lookaheadMinutes: normalizedLookaheadMinutes,
    results,
  }
}

const buildReminderBody = (event: Event, label: string) => {
  const startsAt = new Date(event.startsAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const summary = event.summary ? ` ${event.summary}` : ''

  return `Reminder: this session starts in ${label} (${startsAt}).${summary}`
}
