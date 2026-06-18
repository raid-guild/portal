import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isAdmin } from '@/access/roles'
import { cleanupSpamSignups } from '@/utilities/spamCleanup'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!isAdmin(user)) {
    return Response.json({ message: 'Admin access required.' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const since = typeof body?.since === 'string' ? body.since : undefined
  const pageURL = typeof body?.pageURL === 'string' ? body.pageURL : undefined

  if (since && Number.isNaN(Date.parse(since))) {
    return Response.json({ message: 'Use an ISO date for since.' }, { status: 400 })
  }

  const result = await cleanupSpamSignups(payload, {
    deleteUsers: body?.deleteUsers === true,
    dryRun: body?.dryRun !== false,
    pageURL,
    since,
  })

  return Response.json(result)
}
