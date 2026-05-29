import configPromise from '@payload-config'
import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { createActivityDigestNotifications } from '@/notifications/createActivityDigestNotifications'

export async function POST(request: Request) {
  const configuredSecret = process.env.AGENT_REGISTRATION_SECRET

  if (!configuredSecret) {
    return Response.json({ message: 'Activity digest endpoint is not enabled.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const providedSecret = bearerToken || stringValue(body?.taskSecret)

  if (providedSecret !== configuredSecret) {
    return Response.json({ message: 'Invalid notification task secret.' }, { status: 401 })
  }

  const since = dateValue(body?.since)
  const until = body?.until ? dateValue(body.until) : new Date()
  const limit = body?.limit === undefined ? 100 : numberValue(body.limit)

  if (body?.since && !since) {
    return Response.json({ message: 'Enter a valid since timestamp.' }, { status: 400 })
  }

  if (body?.until && !until) {
    return Response.json({ message: 'Enter a valid until timestamp.' }, { status: 400 })
  }

  if (limit === null) {
    return Response.json({ message: 'Enter a valid positive limit.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await createActivityDigestNotifications({
    dryRun: body?.dryRun === true,
    limit,
    req: { payload } as PayloadRequest,
    since: since || undefined,
    until: until || undefined,
  })

  return Response.json(result)
}

const stringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const dateValue = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}
