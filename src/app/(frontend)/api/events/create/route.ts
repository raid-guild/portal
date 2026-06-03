import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
import { createDiscordScheduledEvent } from '@/utilities/discordScheduledEvents'
import { validateSafeURL } from '@/utilities/safeURL'

const SESSION_TYPES = ['brownbag', 'workshop', 'all-hands', 'demo', 'pitch', 'fireside'] as const
const DURATIONS = [30, 60] as const
const VISIBILITIES = ['public', 'authenticated', 'member', 'admin'] as const
const RECURRENCE_CADENCES = ['weekly', 'biweekly', 'monthly'] as const

type SessionType = (typeof SESSION_TYPES)[number]
type Duration = (typeof DURATIONS)[number]
type Visibility = (typeof VISIBILITIES)[number]
type RecurrenceCadence = (typeof RECURRENCE_CADENCES)[number]

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
  const relatedProjects = numberArrayValue(body?.relatedProjects)
  const relatedThreads = numberArrayValue(body?.relatedThreads)
  const hosts = numberArrayValue(body?.hosts)
  const guests = numberArrayValue(body?.guests)
  const speakers = guests.length ? guests : numberArrayValue(body?.speakers)
  const speaker = speakers[0] || hosts[0] || numberValue(body?.speaker)
  const relatedProfiles = uniqueNumbers([...hosts, ...speakers, ...(speaker ? [speaker] : [])])
  const locationLabel = stringValue(body?.locationLabel)
  const joinURL = stringValue(body?.joinURL)
  const explicitDiscordEventURL = stringValue(body?.discordEventURL)
  const joinDiscordEventURL = extractDiscordScheduledEventID(joinURL) ? joinURL : ''
  const discordEventURL = explicitDiscordEventURL || joinDiscordEventURL
  const linkedDiscordScheduledEventID = extractDiscordScheduledEventID(discordEventURL)
  const seriesKey = normalizeSeriesKey(body?.seriesKey)
  const seriesTitle = stringValue(body?.seriesTitle)
  const recurrenceCadence = enumValue<RecurrenceCadence>(
    body?.recurrenceCadence,
    RECURRENCE_CADENCES,
  )
  const recurrenceUntil = stringValue(body?.recurrenceUntil)
  const syncDiscord = booleanValue(body?.syncDiscord)

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

  if (discordEventURL && !linkedDiscordScheduledEventID) {
    return Response.json({ message: 'Enter a valid Discord event URL.' }, { status: 400 })
  }

  const hasRecurrenceDetails = Boolean(
    seriesKey || seriesTitle || recurrenceCadence || recurrenceUntil,
  )

  if (hasRecurrenceDetails && (!seriesKey || !recurrenceCadence)) {
    return Response.json(
      { message: 'Recurring sessions need a series key and cadence.' },
      { status: 400 },
    )
  }

  const startsAtDate = new Date(startsAt)

  if (startsAtDate.getTime() <= Date.now()) {
    return Response.json(
      { message: 'Use Payload admin to add or enrich past sessions.' },
      { status: 400 },
    )
  }

  const recurrenceUntilDate = recurrenceUntil ? new Date(recurrenceUntil) : null

  if (recurrenceUntil && (!recurrenceUntilDate || Number.isNaN(recurrenceUntilDate.getTime()))) {
    return Response.json({ message: 'Enter a valid recurrence end date.' }, { status: 400 })
  }

  if (recurrenceUntilDate && recurrenceUntilDate.getTime() <= startsAtDate.getTime()) {
    return Response.json(
      { message: 'Recurrence end date must be after the session start time.' },
      { status: 400 },
    )
  }

  const endsAtDate = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000)
  const location = joinURL || discordEventURL || locationLabel
  const initialCalendarURL = createGoogleCalendarURL({
    description: summary,
    endsAt: endsAtDate.toISOString(),
    location,
    startsAt: startsAtDate.toISOString(),
    title,
  })

  const created = await payload.create({
    collection: 'events',
    data: {
      _status: 'published',
      calendarURL: initialCalendarURL,
      discordEventURL: discordEventURL || undefined,
      discordScheduledEventID: linkedDiscordScheduledEventID || undefined,
      discordSyncStatus: discordEventURL ? 'synced' : syncDiscord ? 'failed' : 'not_configured',
      endsAt: endsAtDate.toISOString(),
      joinURL: joinURL || discordEventURL || undefined,
      locationLabel: locationLabel || undefined,
      publishedAt: new Date().toISOString(),
      hostProfiles: hosts.length ? hosts : undefined,
      relatedProfiles: relatedProfiles.length ? relatedProfiles : undefined,
      relatedProjects: relatedProjects.length ? relatedProjects : undefined,
      relatedThreads: relatedThreads.length ? relatedThreads : undefined,
      recurrenceCadence: recurrenceCadence || undefined,
      recurrenceUntil: recurrenceUntilDate ? recurrenceUntilDate.toISOString() : undefined,
      sessionType,
      seriesKey: seriesKey || undefined,
      seriesTitle: seriesTitle || undefined,
      speaker: speaker || undefined,
      speakerProfiles: speakers.length ? speakers : undefined,
      startsAt: startsAtDate.toISOString(),
      summary: summary || undefined,
      title,
      visibility,
    },
    overrideAccess: false,
    user,
  })

  if (discordEventURL || !syncDiscord) {
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
        calendarURL:
          joinURL || locationLabel
            ? initialCalendarURL
            : createGoogleCalendarURL({
                description: summary,
                endsAt: endsAtDate.toISOString(),
                location: discordEvent.discordEventURL,
                startsAt: startsAtDate.toISOString(),
                title,
              }),
        discordSyncError: null,
        discordSyncStatus: 'synced',
        joinURL: joinURL || discordEvent.discordEventURL,
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

const numberArrayValue = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []

  const seen = new Set<number>()

  return value.flatMap((item) => {
    const parsed = numberValue(item)
    if (parsed === null || !Number.isSafeInteger(parsed) || parsed < 1 || seen.has(parsed)) {
      return []
    }

    seen.add(parsed)
    return [parsed]
  })
}

const uniqueNumbers = (values: number[]): number[] => {
  return [...new Set(values)]
}

const enumValue = <T extends string>(value: unknown, options: readonly T[]): T | null => {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : null
}

const booleanValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'

  return false
}

const normalizeSeriesKey = (value: unknown): string => {
  if (typeof value !== 'string') return ''

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const extractDiscordScheduledEventID = (value: string): string => {
  if (!value) return ''

  try {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) return ''

    const allowedHosts = new Set([
      'canary.discord.com',
      'discord.com',
      'ptb.discord.com',
      'www.discord.com',
    ])

    if (!allowedHosts.has(url.hostname)) return ''

    const match = url.pathname.match(/^\/events\/\d+\/(\d+)\/?$/)

    return match?.[1] || ''
  } catch {
    return ''
  }
}
