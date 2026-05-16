import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isAdmin } from '@/access/roles'
import { importLegacyMemberProfiles } from '@/utilities/importLegacyMemberProfiles'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!isAdmin(user)) {
    return Response.json({ message: 'Admin access is required.' }, { status: 403 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === 'true'
  const contentType = request.headers.get('content-type') || ''
  const csv = contentType.includes('application/json')
    ? await request
        .json()
        .then((body) => (typeof body?.csv === 'string' ? body.csv : ''))
        .catch(() => '')
    : await request.text()

  if (!csv.trim()) {
    return Response.json({ message: 'CSV body is required.' }, { status: 400 })
  }

  const result = await importLegacyMemberProfiles({ csv, dryRun, payload })

  return Response.json(result)
}
