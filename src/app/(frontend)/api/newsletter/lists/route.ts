import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'
import { getAllowedNewsletterLists } from '@/modules/newsletter/getAllowedLists'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to view newsletter lists.' }, { status: 401 })
  }

  if (!canEditContent(user)) {
    return Response.json(
      { message: 'Editor access is required to view newsletter lists.' },
      { status: 403 },
    )
  }

  try {
    const lists = await getAllowedNewsletterLists()

    return Response.json({ lists })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load newsletter lists.'

    return Response.json({ message }, { status: 400 })
  }
}
