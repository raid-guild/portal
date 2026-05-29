import configPromise from '@payload-config'
import type { PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import {
  createEventReminderNotifications,
  type ReminderWindow,
} from '@/notifications/createEventReminderNotifications'

const REMINDER_WINDOWS = ['24h', '1h'] as const

export async function POST(request: Request) {
  const configuredSecret = process.env.AGENT_REGISTRATION_SECRET

  if (!configuredSecret) {
    return Response.json({ message: 'Notification task endpoint is not enabled.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const providedSecret = bearerToken || stringValue(body?.taskSecret)

  if (providedSecret !== configuredSecret) {
    return Response.json({ message: 'Invalid notification task secret.' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const windows = parseWindows(body?.windows)
  const lookaheadMinutes =
    body?.lookaheadMinutes === undefined ? 15 : numberValue(body.lookaheadMinutes)
  const dryRun = body?.dryRun === true
  const now = stringValue(body?.now)

  if (now && Number.isNaN(new Date(now).getTime())) {
    return Response.json({ message: 'Enter a valid now timestamp.' }, { status: 400 })
  }

  if (lookaheadMinutes === null) {
    return Response.json({ message: 'Enter a valid positive lookahead.' }, { status: 400 })
  }

  const result = await createEventReminderNotifications({
    dryRun,
    lookaheadMinutes,
    now: now ? new Date(now) : undefined,
    req: { payload } as PayloadRequest,
    windows,
  })

  return Response.json(result)
}

const parseWindows = (value: unknown): ReminderWindow[] => {
  if (!Array.isArray(value)) return [...REMINDER_WINDOWS]

  const windows = value.filter((window): window is ReminderWindow =>
    REMINDER_WINDOWS.includes(window as ReminderWindow),
  )

  return windows.length ? windows : [...REMINDER_WINDOWS]
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
