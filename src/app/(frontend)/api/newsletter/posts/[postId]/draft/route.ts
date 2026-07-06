import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { canEditContent } from '@/access/roles'
import { createOrUpdateNewsletterCampaign } from '@/modules/newsletter/createOrUpdateCampaign'

type RouteContext = {
  params: Promise<{
    postId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to create newsletter campaigns.' }, { status: 401 })
  }

  if (!canEditContent(user)) {
    return Response.json(
      { message: 'Editor access is required to create newsletter campaigns.' },
      { status: 403 },
    )
  }

  const { postId } = await context.params
  const postID = Number(postId)

  if (!Number.isInteger(postID) || postID <= 0) {
    return Response.json({ message: 'Valid post ID is required.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))

  try {
    const result = await createOrUpdateNewsletterCampaign({
      payload,
      postID,
      requestBody: body,
      user,
    })

    return Response.json({
      campaign: result.campaign,
      listmonkCampaign: result.listmonkCampaign,
      postURL: result.rendered.postURL,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create newsletter campaign.'

    return Response.json({ message }, { status: 400 })
  }
}
