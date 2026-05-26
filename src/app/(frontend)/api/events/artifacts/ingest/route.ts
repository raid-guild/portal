import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import type { Event } from '@/payload-types'
import { validateSafeURL } from '@/utilities/safeURL'

type IngestBody = {
  artifacts?: {
    artifactID?: unknown
    recordingURL?: unknown
    sourceURL?: unknown
    summaryURL?: unknown
    transcriptURL?: unknown
  }
  discord?: {
    scheduledEventID?: unknown
  }
  eventID?: unknown
  sourceStatus?: unknown
}

const SOURCE_STATUSES = ['recorded', 'summarized', 'processed', 'archived'] as const

type SourceStatus = (typeof SOURCE_STATUSES)[number]

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to attach session artifacts.' }, { status: 401 })
  }

  if (!canContributeContent(user)) {
    return Response.json(
      { message: 'You do not have permission to attach session artifacts.' },
      { status: 403 },
    )
  }

  const body = (await request.json().catch(() => null)) as IngestBody | null
  const eventID = numberValue(body?.eventID)
  const discordScheduledEventID = stringValue(body?.discord?.scheduledEventID)

  if (!eventID && !discordScheduledEventID) {
    return Response.json(
      { message: 'Provide eventID or discord.scheduledEventID.' },
      { status: 400 },
    )
  }

  const recordingURL = stringValue(body?.artifacts?.recordingURL)
  const transcriptArtifactURL = stringValue(body?.artifacts?.transcriptURL)
  const summaryArtifactURL = stringValue(body?.artifacts?.summaryURL)
  const sourceArtifactURL = stringValue(body?.artifacts?.sourceURL) || summaryArtifactURL
  const sourceArtifactID = stringValue(body?.artifacts?.artifactID)
  const sourceStatus =
    enumValue<SourceStatus>(body?.sourceStatus, SOURCE_STATUSES) ||
    (summaryArtifactURL ? 'summarized' : 'recorded')

  for (const [label, value] of [
    ['recordingURL', recordingURL],
    ['transcriptURL', transcriptArtifactURL],
    ['summaryURL', summaryArtifactURL],
    ['sourceURL', sourceArtifactURL],
  ] as const) {
    if (
      value &&
      validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }) !== true
    ) {
      return Response.json({ message: `Enter a valid ${label}.` }, { status: 400 })
    }
  }

  const event = eventID
    ? await getEventByID(payload, eventID)
    : await getEventByDiscordScheduledEventID(payload, discordScheduledEventID)

  if (!event) {
    return Response.json({ message: 'No matching event found.' }, { status: 404 })
  }

  const updated = await payload.update({
    id: event.id,
    collection: 'events',
    data: {
      recordingURL: recordingURL || undefined,
      sourceArtifactID: sourceArtifactID || undefined,
      sourceArtifactURL: sourceArtifactURL || undefined,
      sourceStatus,
      summaryArtifactURL: summaryArtifactURL || undefined,
      transcriptArtifactURL: transcriptArtifactURL || undefined,
    },
    overrideAccess: true,
    user,
  })

  return Response.json({
    event: updated,
    matchedBy: eventID ? 'eventID' : 'discordScheduledEventID',
  })
}

const getEventByID = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  eventID: number,
): Promise<Event | null> => {
  try {
    return await payload.findByID({
      id: eventID,
      collection: 'events',
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

const getEventByDiscordScheduledEventID = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  discordScheduledEventID: string,
): Promise<Event | null> => {
  const result = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      discordScheduledEventID: {
        equals: discordScheduledEventID,
      },
    },
  })

  return result.docs[0] || null
}

const stringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}

const enumValue = <T extends string>(value: unknown, options: readonly T[]): T | null => {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : null
}
