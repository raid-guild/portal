import configPromise from '@payload-config'
import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { dispatchNotificationEmails } from '@/notifications/dispatchNotificationEmails'

export async function POST(request: Request) {
  const configuredSecret = process.env.AGENT_REGISTRATION_SECRET

  if (!configuredSecret) {
    return Response.json(
      { message: 'Notification email endpoint is not enabled.' },
      { status: 404 },
    )
  }

  const body = await request.json().catch(() => null)
  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const providedSecret = bearerToken || stringValue(body?.taskSecret)

  if (providedSecret !== configuredSecret) {
    return Response.json({ message: 'Invalid notification task secret.' }, { status: 401 })
  }

  const limit = body?.limit === undefined ? 50 : numberValue(body.limit)

  if (limit === null) {
    return Response.json({ message: 'Enter a valid positive limit.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await dispatchNotificationEmails({
    dryRun: body?.dryRun === true,
    limit,
    req: { payload } as PayloadRequest,
  })

  return Response.json(result)
}

const stringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  return null
}
