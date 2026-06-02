import configPromise from '@payload-config'
import { canEditContent } from '@/access/roles'
import type { Event, Profile, User } from '@/payload-types'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

type Args = {
  params: Promise<{
    id?: string
  }>
}

export async function PATCH(_request: Request, { params: paramsPromise }: Args) {
  const { id } = await paramsPromise
  const commentID = numberValue(id)

  if (!commentID) {
    return Response.json({ message: 'Provide a valid comment ID.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to hide session comments.' }, { status: 401 })
  }

  const comment = await payload
    .findByID({
      collection: 'comments',
      id: commentID,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!comment) {
    return Response.json({ message: 'Comment not found.' }, { status: 404 })
  }

  if (comment.parent.relationTo !== 'events') {
    return Response.json({ message: 'Only session comments can be hidden here.' }, { status: 400 })
  }

  const eventID = relationshipID(comment.parent.value)
  const event = await payload
    .findByID({
      collection: 'events',
      id: eventID,
      depth: 2,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!event) {
    return Response.json({ message: 'Session not found.' }, { status: 404 })
  }

  if (!canEditContent(user) && !isEventHost(event, user)) {
    return Response.json(
      { message: 'Only session hosts and editors can hide session comments.' },
      { status: 403 },
    )
  }

  const updated = await payload.update({
    collection: 'comments',
    id: commentID,
    data: {
      isApproved: false,
    },
    overrideAccess: true,
    user,
  })

  return Response.json({ comment: updated })
}

const isEventHost = (event: Event, user: User): boolean => {
  const hostProfiles = event.hostProfiles?.filter(isProfile) || []

  return hostProfiles.some((profile) => relationshipID(profile.user) === user.id)
}

const isProfile = (value: number | Profile | null | undefined): value is Profile =>
  typeof value === 'object' && value !== null

const relationshipID = (value: number | string | { id?: number | string } | null | undefined) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value.id !== 'undefined') return relationshipID(value.id)

  return 0
}

const numberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)

    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }

  return null
}
