import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user?.email) {
    return Response.json({ message: 'Log in to claim a profile.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const profileID = body?.profileID

  if (!profileID) {
    return Response.json({ message: 'Profile ID is required.' }, { status: 400 })
  }

  const existingProfile = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  if (existingProfile.docs.length) {
    return Response.json({ message: 'This account already has a profile.' }, { status: 409 })
  }

  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          id: {
            equals: profileID,
          },
        },
        {
          claimStatus: {
            equals: 'unclaimed',
          },
        },
        {
          claimEmail: {
            equals: user.email.trim().toLowerCase(),
          },
        },
        {
          user: {
            exists: false,
          },
        },
      ],
    },
  })

  const profile = result.docs[0]

  if (!profile) {
    return Response.json({ message: 'No claimable profile matched this account.' }, { status: 404 })
  }

  const updatedProfile = await payload.update({
    id: profile.id,
    collection: 'profiles',
    data: {
      claimedAt: new Date().toISOString(),
      claimStatus: 'claimed',
      user: user.id,
    },
    overrideAccess: true,
  })

  return Response.json({
    profile: {
      displayName: updatedProfile.displayName,
      handle: updatedProfile.handle,
      id: updatedProfile.id,
    },
  })
}
