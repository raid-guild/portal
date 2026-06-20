import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { hasVerifiedAccount } from '@/access/roles'
import type { Media, PointEvent, Profile } from '@/payload-types'

type LeaderboardEntry = {
  avatarURL?: string
  displayName: string
  handle?: string
  isCurrentUser: boolean
  pointsTotal: number
  rank: number
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return Response.json({ message: 'Log in to view point standings.' }, { status: 401 })
  }

  if (!hasVerifiedAccount(user)) {
    return Response.json({ message: 'Verify your account to view point standings.' }, { status: 403 })
  }

  const pointEvents = await payload.find({
    collection: 'pointEvents',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
    where: {
      status: {
        equals: 'valid',
      },
    },
  })

  const totals = aggregatePointTotals(pointEvents.docs)
  const userIDs = [...totals.keys()]

  if (!userIDs.length) {
    return Response.json({
      entries: [],
      generatedAt: new Date().toISOString(),
    })
  }

  const profiles = await payload.find({
    collection: 'profiles',
    depth: 1,
    limit: 10000,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          user: {
            in: userIDs,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const profilesByUserID = new Map<string, Profile>()

  profiles.docs.forEach((profile) => {
    const profileUserID = relationID(profile.user)
    if (!profileUserID) return
    if (profilesByUserID.has(profileUserID)) return
    profilesByUserID.set(profileUserID, profile)
  })

  const entries = userIDs
    .flatMap((userID) => {
      const profile = profilesByUserID.get(userID)
      const isCurrentUser = String(userID) === String(user.id)
      const pointsTotal = totals.get(userID) || 0

      if (pointsTotal <= 0) return []
      if (!profile) return []
      if (!isCurrentUser && !['public', 'authenticated'].includes(profile.visibility)) return []

      return [
        {
          avatarURL: mediaURL(profile.avatar),
          displayName: profile.displayName,
          handle: profile.handle,
          isCurrentUser,
          pointsTotal,
        },
      ]
    })
    .sort((a, b) => b.pointsTotal - a.pointsTotal || a.displayName.localeCompare(b.displayName))
    .slice(0, 10)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

  return Response.json({
    entries,
    generatedAt: new Date().toISOString(),
  })
}

const aggregatePointTotals = (events: PointEvent[]) => {
  const totals = new Map<string, number>()

  events.forEach((event) => {
    const recipientID = relationID(event.recipient)
    if (!recipientID) return

    totals.set(recipientID, (totals.get(recipientID) || 0) + (event.amount || 0))
  })

  return totals
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
