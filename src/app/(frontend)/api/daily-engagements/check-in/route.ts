import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import {
  DAILY_VIBE_CHECK_POINTS,
  isDailyEngagementVibe,
  normalizeEngagementDate,
} from '@/utilities/dailyEngagement'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to complete a vibe check.' }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'contributor', 'member', 'agent'])) {
    return Response.json({ message: 'Verify your account before checking in.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const vibe = body?.vibe
  const comment = stringValue(body?.comment)
  const engagementDate = normalizeEngagementDate()

  if (!isDailyEngagementVibe(vibe)) {
    return Response.json({ message: 'Choose a vibe.' }, { status: 400 })
  }

  if (comment && comment.length > 1000) {
    return Response.json({ message: 'Keep vibe notes under 1000 characters.' }, { status: 400 })
  }

  const existing = await findDailyEngagementForUser(payload, user.id, engagementDate)

  if (existing.docs[0]) {
    return Response.json({
      alreadyCheckedIn: true,
      dailyEngagement: existing.docs[0],
      pointsAwarded: 0,
    })
  }

  const profile = await getProfileForUser(payload, user.id)
  const dailyEngagementData = {
    checkedIn: true as const,
    commentStatus: comment ? ('approved' as const) : ('none' as const),
    engagementDate,
    status: 'valid' as const,
    vibe,
    user: user.id,
    ...(comment ? { comment } : {}),
    ...(profile ? { profile: profile.id } : {}),
  }
  let dailyEngagement

  try {
    dailyEngagement = await payload.create({
      collection: 'dailyEngagements',
      data: dailyEngagementData,
      draft: false,
      overrideAccess: false,
      user,
    })
  } catch (err) {
    if (!isDuplicateDailyEngagementError(err)) {
      throw err
    }

    const duplicate = await findDailyEngagementForUser(payload, user.id, engagementDate)

    return Response.json({
      alreadyCheckedIn: true,
      dailyEngagement: duplicate.docs[0] || null,
      pointsAwarded: 0,
    })
  }

  const created = await payload.findByID({
    id: dailyEngagement.id,
    collection: 'dailyEngagements',
    depth: 1,
    overrideAccess: true,
  })

  return Response.json({
    alreadyCheckedIn: false,
    dailyEngagement: created,
    pointsAwarded: DAILY_VIBE_CHECK_POINTS,
  })
}

const getProfileForUser = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  userID: number | string,
) => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const findDailyEngagementForUser = (
  payload: Awaited<ReturnType<typeof getPayload>>,
  userID: number | string,
  engagementDate: string,
) =>
  payload.find({
    collection: 'dailyEngagements',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          user: {
            equals: userID,
          },
        },
        {
          engagementDate: {
            equals: engagementDate,
          },
        },
      ],
    },
  })

const isDuplicateDailyEngagementError = (err: unknown): boolean => {
  if (err && typeof err === 'object') {
    const maybeError = err as { code?: string; message?: string }
    const message = maybeError.message?.toLowerCase() || ''

    return maybeError.code === '23505' || message.includes('duplicate') || message.includes('unique')
  }

  return false
}

const stringValue = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}
