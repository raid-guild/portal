import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import configPromise from '@payload-config'
import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canContributeContent, canPublishContent } from '@/access/roles'
import { toActivityVisibility } from '@/activityItems/activityVisibility'
import { recordPortalActivity } from '@/activityItems/recordPortalActivity'
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
  transcript?: {
    markdown?: unknown
    sourceSessionID?: unknown
  }
}

const SOURCE_STATUSES = ['recorded', 'summarized', 'processed', 'archived'] as const
const MAX_INGEST_BYTES = 2 * 1024 * 1024
const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  if (Number(request.headers.get('content-length')) > MAX_INGEST_BYTES) {
    return Response.json({ message: 'Request is too large.' }, { status: 413 })
  }
  const reader = request.body?.getReader()
  if (!reader) return Response.json({ message: 'Enter valid JSON.' }, { status: 400 })
  const chunks: Uint8Array[] = []
  let byteCount = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    byteCount += value.byteLength
    if (byteCount > MAX_INGEST_BYTES) {
      await reader.cancel()
      return Response.json({ message: 'Request is too large.' }, { status: 413 })
    }
    chunks.push(value)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  let body: IngestBody | null = null
  try {
    body = JSON.parse(raw) as IngestBody
  } catch {
    return Response.json({ message: 'Enter valid JSON.' }, { status: 400 })
  }
  const eventID = numberValue(body?.eventID)
  const discordScheduledEventID = stringValue(body?.discord?.scheduledEventID)
  const transcriptRequested = body?.transcript !== undefined
  const transcriptMarkdown = body?.transcript?.markdown
  const sourceSessionID = stringValue(body?.transcript?.sourceSessionID)

  if ((transcriptRequested || body?.artifacts?.transcriptURL) && !canPublishContent(user)) {
    return Response.json({ message: 'You do not have permission to attach a transcript.' }, { status: 403 })
  }

  if (transcriptRequested && (
    typeof transcriptMarkdown !== 'string' ||
    !transcriptMarkdown.trim() ||
    !SESSION_ID.test(sourceSessionID) ||
    Buffer.byteLength(transcriptMarkdown, 'utf8') > MAX_INGEST_BYTES
  )) {
    return Response.json({ message: 'Enter a transcript and valid source session ID.' }, { status: 400 })
  }

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

  if (eventID && discordScheduledEventID && event.discordScheduledEventID !== discordScheduledEventID) {
    return Response.json({ message: 'Event identifiers do not match.' }, { status: 409 })
  }

  const sha256 = transcriptRequested
    ? createHash('sha256').update(transcriptMarkdown as string, 'utf8').digest('hex')
    : null
  const ingestedAt = transcriptRequested ? new Date().toISOString() : null
  const transactionID = transcriptRequested ? await payload.db.beginTransaction() : null
  if (transcriptRequested && !transactionID) {
    return Response.json({ message: 'Transcript storage is unavailable.' }, { status: 503 })
  }
  const transactionReq = transactionID ? { transactionID } : undefined
  let updated: Event
  try {
    if (transcriptRequested && transactionID) {
      // The conditional write and Payload's versioned update share one database
      // transaction. A competing publisher waits for the winner, then sees its
      // committed transcript and can only retry the identical content.
      const db = (payload.db as PostgresAdapter).sessions[String(transactionID)]?.db
      if (!db) throw new Error('Transcript transaction unavailable')
      const claim = await db.execute(sql`
        UPDATE "events"
           SET "transcript_markdown" = ${transcriptMarkdown as string},
               "transcript_source_session_i_d" = ${sourceSessionID},
               "transcript_sha256" = ${sha256 as string},
               "transcript_ingested_at" = ${ingestedAt}::timestamptz,
               "updated_at" = NOW()
         WHERE "id" = ${event.id}
           AND "transcript_markdown" IS NULL
         RETURNING "id"
      `)
      if (claim.rows.length === 0) {
        const current = await getEventByID(payload, event.id, transactionReq)
        await payload.db.rollbackTransaction(transactionID)
        if (current?.transcript?.sourceSessionID !== sourceSessionID ||
          current.transcript.sha256 !== sha256 ||
          current.transcript.markdown !== transcriptMarkdown) {
          return Response.json({ message: 'A different transcript is already attached to this event.' }, { status: 409 })
        }
        return Response.json({ eventID: event.id, matchedBy: eventID ? 'eventID' : 'discordScheduledEventID', transcript: 'unchanged' })
      }
    }

    updated = await payload.update({
      id: event.id,
      collection: 'events',
      data: {
        recordingURL: recordingURL || undefined,
        sourceArtifactID: sourceArtifactID || undefined,
        sourceArtifactURL: sourceArtifactURL || undefined,
        sourceStatus: (recordingURL || summaryArtifactURL || sourceArtifactURL || sourceArtifactID) ? sourceStatus : undefined,
        summaryArtifactURL: summaryArtifactURL || undefined,
        transcriptArtifactURL: transcriptArtifactURL || undefined,
        transcript: transcriptRequested ? {
          markdown: transcriptMarkdown as string,
          sourceSessionID,
          sha256: sha256 as string,
          ingestedAt: ingestedAt as string,
        } : undefined,
      },
      overrideAccess: true,
      req: transactionReq,
      user,
    })
    if (transactionID) await payload.db.commitTransaction(transactionID)
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)
    throw error
  }

  const visibility = toActivityVisibility(updated.visibility)
  if (visibility && !transcriptRequested) {
    try {
      await recordPortalActivity({
        activityType: 'event',
        body: updated.summary || undefined,
        happenedAt: new Date(),
        relatedEvent: updated.id,
        relatedProfiles: [
          updated.speaker,
          ...(updated.hostProfiles || []),
          ...(updated.speakerProfiles || []),
        ],
        req: {
          payload,
          user,
        },
        sourceKey: `event:${updated.id}:artifact-ingested`,
        sourceLabel: sourceStatus === 'summarized' ? 'Session summary' : 'Session artifact',
        sourceURL: sourceArtifactURL || recordingURL || undefined,
        title: `Added session artifacts: ${updated.title}`,
        visibility,
      })
    } catch (error) {
      payload.logger.warn({
        err: error,
        eventID: updated.id,
        msg: 'Failed to record event artifact activity.',
      })
    }
  }

  return Response.json({
    eventID: updated.id,
    matchedBy: eventID ? 'eventID' : 'discordScheduledEventID',
    transcript: transcriptRequested ? 'stored' : undefined,
  })
}

const getEventByID = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  eventID: number,
  req?: { transactionID: string | number },
): Promise<Event | null> => {
  try {
    return await payload.findByID({
      id: eventID,
      collection: 'events',
      depth: 0,
      overrideAccess: true,
      req,
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
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      discordScheduledEventID: {
        equals: discordScheduledEventID,
      },
    },
  })

  return result.docs.length === 1 ? result.docs[0] : null
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
