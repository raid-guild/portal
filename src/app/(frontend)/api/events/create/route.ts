import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import { createDiscordScheduledEvent } from '@/utilities/discordScheduledEvents'
import { validateSafeURL } from '@/utilities/safeURL'

const SESSION_TYPES = ['brownbag', 'workshop', 'all-hands', 'demo', 'pitch'] as const
const DURATIONS = [30, 60] as const
const VISIBILITIES = ['public', 'authenticated', 'admin'] as const

type SessionType = (typeof SESSION_TYPES)[number]
type Duration = (typeof DURATIONS)[number]
type Visibility = (typeof VISIBILITIES)[number]

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to create a session.' }, { status: 401 })
  }

  if (!canContributeContent(user)) {
    return Response.json(
      { message: 'You do not have permission to create sessions.' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const title = stringValue(body?.title)
  const summary = stringValue(body?.summary)
  const startsAt = stringValue(body?.startsAt)
  const durationMinutes = numberValue(body?.durationMinutes)
  const sessionType = enumValue<SessionType>(body?.sessionType, SESSION_TYPES)
  const visibility = enumValue<Visibility>(body?.visibility, VISIBILITIES) || 'public'
  const speaker = numberValue(body?.speaker)
  const locationLabel = stringValue(body?.locationLabel)
  const joinURL = stringValue(body?.joinURL)
  const syncDiscord = Boolean(body?.syncDiscord)

  if (!title) {
    return Response.json({ message: 'Session title is required.' }, { status: 400 })
  }

  if (!startsAt || Number.isNaN(new Date(startsAt).getTime())) {
    return Response.json({ message: 'Start time is required.' }, { status: 400 })
  }

  if (!durationMinutes || !DURATIONS.includes(durationMinutes as Duration)) {
    return Response.json({ message: 'Choose a 30 or 60 minute duration.' }, { status: 400 })
  }

  if (!sessionType) {
    return Response.json({ message: 'Choose a session type.' }, { status: 400 })
  }

  if (
    joinURL &&
    validateSafeURL(joinURL, { allowRelative: false, protocols: ['http:', 'https:'] }) !== true
  ) {
    return Response.json({ message: 'Enter a valid join URL.' }, { status: 400 })
  }

  const startsAtDate = new Date(startsAt)
  const endsAtDate = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000)

  const created = await payload.create({
    collection: 'events',
    data: {
      _status: 'published',
      discordSyncStatus: syncDiscord ? 'failed' : 'not_configured',
      endsAt: endsAtDate.toISOString(),
      joinURL: joinURL || undefined,
      locationLabel: locationLabel || undefined,
      publishedAt: new Date().toISOString(),
      sessionType,
      speaker: speaker || undefined,
      startsAt: startsAtDate.toISOString(),
      summary: summary || undefined,
      title,
      visibility,
    },
    overrideAccess: false,
    user,
  })

  if (!syncDiscord) {
    return Response.json({ event: created })
  }

  try {
    const discordEvent = await createDiscordScheduledEvent({
      description: summary,
      endsAt: endsAtDate.toISOString(),
      locationLabel: joinURL || locationLabel,
      startsAt: startsAtDate.toISOString(),
      title,
    })

    const updated = await payload.update({
      id: created.id,
      collection: 'events',
      data: {
        ...discordEvent,
        discordSyncError: null,
        discordSyncStatus: 'synced',
      },
      overrideAccess: false,
      user,
    })

    return Response.json({ event: updated })
  } catch (error) {
    const updated = await payload.update({
      id: created.id,
      collection: 'events',
      data: {
        discordSyncError: error instanceof Error ? error.message : 'Discord sync failed.',
        discordSyncStatus: 'failed',
      },
      overrideAccess: false,
      user,
    })

    return Response.json({
      event: updated,
      warning: 'Session was created, but Discord sync failed.',
    })
  }
}

const stringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const enumValue = <T extends string>(value: unknown, options: readonly T[]): T | null => {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : null
}
