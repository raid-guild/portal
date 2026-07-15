import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import type { DailyEngagement, Media } from '@/payload-types'
import {
  type VibeNote,
  dailyEngagementVibeEmojis,
  dailyEngagementVibeLabels,
  normalizeEngagementDate,
} from '@/utilities/dailyEngagement'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: "Log in to view today's vibe notes." }, { status: 401 })
  }

  if (!hasRole(user, ['admin', 'editor', 'contributor', 'member', 'agent'])) {
    return Response.json(
      { message: "Verify your account to view today's vibe notes." },
      { status: 403 },
    )
  }

  const engagementDate = normalizeEngagementDate()
  const ownCheckIn = await payload.find({
    collection: 'dailyEngagements',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          user: {
            equals: user.id,
          },
        },
        {
          engagementDate: {
            equals: engagementDate,
          },
        },
        {
          checkedIn: {
            equals: true,
          },
        },
        {
          status: {
            equals: 'valid',
          },
        },
      ],
    },
  })

  if (!ownCheckIn.docs[0]) {
    return Response.json(
      {
        checkedInCount: 0,
        entries: [],
        locked: true,
        message: "Check in to unlock today's notes.",
      },
      { status: 403 },
    )
  }

  const [todayCheckIns, noteResult] = await Promise.all([
    payload.count({
      collection: 'dailyEngagements',
      overrideAccess: true,
      where: {
        and: [
          {
            engagementDate: {
              equals: engagementDate,
            },
          },
          {
            checkedIn: {
              equals: true,
            },
          },
          {
            status: {
              equals: 'valid',
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'dailyEngagements',
      depth: 2,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      sort: '-createdAt',
      where: {
        and: [
          {
            engagementDate: {
              equals: engagementDate,
            },
          },
          {
            checkedIn: {
              equals: true,
            },
          },
          {
            status: {
              equals: 'valid',
            },
          },
          {
            commentStatus: {
              equals: 'approved',
            },
          },
          {
            commentShareWithMembers: {
              equals: true,
            },
          },
          {
            comment: {
              exists: true,
            },
          },
        ],
      },
    }),
  ])

  const entries = noteResult.docs.flatMap((engagement) => {
    const note = engagement.comment?.trim()
    if (!note) return []

    return [serializeNote(engagement, user.id, note)]
  })

  return Response.json({
    checkedInCount: todayCheckIns.totalDocs,
    entries,
    generatedAt: new Date().toISOString(),
    locked: false,
  })
}

const serializeNote = (
  engagement: DailyEngagement,
  currentUserID: number | string,
  note: string,
): VibeNote => {
  const profile =
    engagement.profile && typeof engagement.profile === 'object' ? engagement.profile : null
  const isCurrentUser = String(relationID(engagement.user)) === String(currentUserID)
  const canShowProfile = Boolean(profile && (isCurrentUser || profile.visibility !== 'private'))
  const displayName = canShowProfile ? profile?.displayName || 'Member' : 'Member'
  const handle = canShowProfile ? profile?.handle || undefined : undefined
  const avatarURL = canShowProfile ? mediaURL(profile?.avatar) : undefined

  return {
    avatarURL,
    checkedInAt: engagement.createdAt,
    displayName,
    handle,
    id: engagement.id,
    isCurrentUser,
    note,
    vibe: engagement.vibe,
    vibeEmoji: dailyEngagementVibeEmojis[engagement.vibe],
    vibeLabel: dailyEngagementVibeLabels[engagement.vibe],
  }
}

const relationID = (value: unknown): null | string => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id
    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }

  return null
}

const mediaURL = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const url = (value as Media).url

  return typeof url === 'string' ? url : undefined
}
