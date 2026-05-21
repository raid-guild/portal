import configPromise from '@payload-config'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

type UserRole = Exclude<NonNullable<User['roles']>[number], undefined>

const withMemberRole = (roles: User['roles']): UserRole[] => {
  const existingRoles: UserRole[] = Array.isArray(roles) ? roles.filter(Boolean) : ['contributor']
  const withoutUnverified = existingRoles.filter((role) => role !== 'unverified')

  return Array.from(new Set([...withoutUnverified, 'contributor', 'member']))
}

type ClaimTokenPayload = {
  email: string
  exp: number
  profileID: string
  userID: string
}

const CLAIM_TOKEN_TTL_MS = 1000 * 60 * 30

const signClaimPayload = (payload: ClaimTokenPayload): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

const verifyClaimToken = (token: unknown): ClaimTokenPayload | null => {
  if (typeof token !== 'string') return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET)
    .update(encodedPayload)
    .digest('base64url')

  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))

    if (
      typeof payload?.email !== 'string' ||
      typeof payload?.exp !== 'number' ||
      typeof payload?.profileID !== 'string' ||
      typeof payload?.userID !== 'string' ||
      payload.exp < Date.now()
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user?.email) {
    return Response.json({ message: 'Log in to claim a profile.' }, { status: 401 })
  }

  if (!user.id) {
    return Response.json({ message: 'Unable to identify the current user.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const profileID = body?.profileID
  const intent = body?.intent === 'request' ? 'request' : 'claim'

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

  if (intent === 'request') {
    const token = signClaimPayload({
      email: user.email.trim().toLowerCase(),
      exp: Date.now() + CLAIM_TOKEN_TTL_MS,
      profileID: String(profile.id),
      userID: String(user.id),
    })
    const claimURL = `${getServerSideURL()}/me?claimProfile=${encodeURIComponent(
      String(profile.id),
    )}&claimToken=${encodeURIComponent(token)}`

    try {
      await payload.sendEmail({
        html: `
          <p>A profile claim was requested for ${escapeHTML(profile.displayName)}.</p>
          <p><a href="${claimURL}">Verify and claim this profile</a></p>
          <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
        `,
        subject: 'Verify your RaidGuild profile claim',
        to: user.email,
      })
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: 'Failed to send profile claim verification email.',
        profileID: profile.id,
        userID: user.id,
      })

      return Response.json(
        { message: 'Unable to send profile claim verification email.' },
        { status: 502 },
      )
    }

    return Response.json({
      message: 'Verification email sent.',
      profile: {
        displayName: profile.displayName,
        handle: profile.handle,
        id: profile.id,
      },
    })
  }

  const claimToken = verifyClaimToken(body?.token)

  if (
    !claimToken ||
    claimToken.email !== user.email.trim().toLowerCase() ||
    claimToken.profileID !== String(profile.id) ||
    claimToken.userID !== String(user.id)
  ) {
    return Response.json(
      { message: 'Profile claim verification is invalid or expired.' },
      { status: 403 },
    )
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

  const updatedUser = await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      emailVerifiedAt: new Date().toISOString(),
      roles: withMemberRole(user.roles),
    },
    overrideAccess: true,
  })

  return Response.json({
    profile: {
      displayName: updatedProfile.displayName,
      handle: updatedProfile.handle,
      id: updatedProfile.id,
    },
    user: {
      id: updatedUser.id,
      roles: updatedUser.roles,
    },
  })
}

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
