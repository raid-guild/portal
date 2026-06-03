import configPromise from '@payload-config'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { renderTransactionalEmail } from '@/utilities/transactionalEmail'

type UserRole = Exclude<NonNullable<User['roles']>[number], undefined>

type EmailVerificationTokenPayload = {
  email: string
  exp: number
  purpose: 'account-email'
  userID: string
}

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 30

const verifiedRoles = (roles: User['roles']): UserRole[] => {
  const existingRoles: UserRole[] = Array.isArray(roles) ? roles.filter(Boolean) : ['unverified']
  const withoutUnverified = existingRoles.filter((role) => role !== 'unverified')

  return Array.from(new Set([...withoutUnverified, 'contributor']))
}

const signEmailVerificationPayload = (payload: EmailVerificationTokenPayload): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET)
    .update(encodedPayload)
    .digest('base64url')

  return `${encodedPayload}.${signature}`
}

const verifyEmailVerificationToken = (token: unknown): EmailVerificationTokenPayload | null => {
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
      payload?.purpose !== 'account-email' ||
      typeof payload?.email !== 'string' ||
      typeof payload?.exp !== 'number' ||
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

  if (!user?.email || !user.id) {
    return Response.json({ message: 'Log in to verify your email.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const intent = body?.intent === 'request' ? 'request' : 'verify'
  const email = user.email.trim().toLowerCase()

  if (intent === 'request') {
    if (user.emailVerifiedAt) {
      return Response.json({ message: 'Email is already verified.' })
    }

    const token = signEmailVerificationPayload({
      email,
      exp: Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS,
      purpose: 'account-email',
      userID: String(user.id),
    })
    const verificationURL = `${getServerSideURL()}/me?verifyEmailToken=${encodeURIComponent(token)}`

    try {
      await payload.sendEmail({
        html: renderTransactionalEmail({
          action: {
            href: verificationURL,
            label: 'Verify email',
          },
          footer:
            'This link expires in 30 minutes. If you did not request it, you can ignore this email.',
          intro:
            'Confirm this address so your Portal account can use contributor actions, check-ins, and notification delivery.',
          preheader: 'Verify your RaidGuild Portal account email.',
          sections: [
            'Email verification helps keep member and contributor activity tied to a trusted account.',
          ],
          title: 'Verify your Portal email',
        }),
        subject: 'Verify your RaidGuild Portal email',
        to: user.email,
      })
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: 'Failed to send account email verification.',
        userID: user.id,
      })

      return Response.json({ message: 'Unable to send email verification.' }, { status: 502 })
    }

    return Response.json({ message: 'Verification email sent.' })
  }

  const verificationToken = verifyEmailVerificationToken(body?.token)

  if (
    !verificationToken ||
    verificationToken.email !== email ||
    verificationToken.userID !== String(user.id)
  ) {
    return Response.json({ message: 'Email verification is invalid or expired.' }, { status: 403 })
  }

  const updatedUser = await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      emailVerifiedAt: new Date().toISOString(),
      roles: verifiedRoles(user.roles),
    },
    overrideAccess: true,
  })

  return Response.json({
    emailVerifiedAt: updatedUser.emailVerifiedAt,
    message: 'Email verified.',
  })
}
