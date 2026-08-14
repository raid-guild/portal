import configPromise from '@payload-config'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { getAddress, isAddress, verifyMessage, type Hex } from 'viem'

const WALLET_CHALLENGE_TTL_MS = 10 * 60 * 1000

const noStoreJSON = (body: Record<string, unknown>, init?: ResponseInit) =>
  Response.json(body, {
    ...init,
    headers: {
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
  })

const messageHash = (message: string) => crypto.createHash('sha256').update(message).digest('hex')

const normalizeAddress = (value: unknown): `0x${string}` | null => {
  if (typeof value !== 'string' || !isAddress(value)) return null

  return getAddress(value)
}

const getOwnedProfile = async (
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

const buildVerificationMessage = ({
  address,
  nonce,
  origin,
  profileID,
}: {
  address: string
  nonce: string
  origin: string
  profileID: number | string
}) => {
  const url = new URL(origin)
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + WALLET_CHALLENGE_TTL_MS)
  const message = `${url.host} wants you to sign in with your Ethereum account:
${address}

Verify this address as the RaidGuild DAO member address for your Portal profile. This request does not initiate a transaction or cost gas.

URI: ${url.origin}/me
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${issuedAt.toISOString()}
Expiration Time: ${expiresAt.toISOString()}
Request ID: raidguild-profile-${profileID}`

  return { expiresAt, message }
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user?.id) {
    return noStoreJSON({ message: 'Log in to verify a wallet.' }, { status: 401 })
  }

  const profile = await getOwnedProfile(payload, user.id)

  if (!profile) {
    return noStoreJSON(
      { message: 'Create or claim your profile before verifying a wallet.' },
      { status: 409 },
    )
  }

  const body = await request.json().catch(() => null)
  const intent = body?.intent === 'challenge' ? 'challenge' : 'verify'
  const address = normalizeAddress(body?.address)

  if (!address) {
    return noStoreJSON({ message: 'Connect a valid Ethereum address.' }, { status: 400 })
  }

  if (intent === 'challenge') {
    const nonce = crypto.randomBytes(16).toString('hex')
    const { expiresAt, message } = buildVerificationMessage({
      address,
      nonce,
      origin: new URL(request.url).origin,
      profileID: profile.id,
    })

    await payload.update({
      id: profile.id,
      collection: 'profiles',
      context: {
        walletVerification: true,
      },
      data: {
        walletVerificationAddress: address,
        walletVerificationChallengeHash: messageHash(message),
        walletVerificationExpiresAt: expiresAt.toISOString(),
      },
      overrideAccess: true,
    })

    return noStoreJSON({ address, expiresAt: expiresAt.toISOString(), message })
  }

  const message = typeof body?.message === 'string' ? body.message : ''
  const signature = typeof body?.signature === 'string' ? body.signature : ''
  const expiresAt = profile.walletVerificationExpiresAt
    ? new Date(profile.walletVerificationExpiresAt)
    : null
  const challengeIsValid =
    message &&
    /^0x[0-9a-fA-F]+$/.test(signature) &&
    profile.walletVerificationAddress === address &&
    profile.walletVerificationChallengeHash === messageHash(message) &&
    expiresAt &&
    Number.isFinite(expiresAt.getTime()) &&
    expiresAt.getTime() > Date.now()

  if (!challengeIsValid) {
    return noStoreJSON(
      { message: 'Wallet verification is invalid or expired. Request a new signature.' },
      { status: 403 },
    )
  }

  const signatureIsValid = await verifyMessage({
    address,
    message,
    signature: signature as Hex,
  }).catch(() => false)

  if (!signatureIsValid) {
    return noStoreJSON(
      { message: 'The signature does not match the connected wallet.' },
      { status: 403 },
    )
  }

  const existing = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { id: { not_equals: profile.id } },
        { walletAddress: { equals: address } },
        { walletVerifiedAt: { exists: true } },
      ],
    },
  })

  if (existing.docs.length) {
    return noStoreJSON(
      { message: 'This wallet is already verified by another Portal profile.' },
      { status: 409 },
    )
  }

  const walletVerifiedAt = new Date().toISOString()

  await payload.update({
    id: profile.id,
    collection: 'profiles',
    context: {
      walletVerification: true,
    },
    data: {
      walletAddress: address,
      walletVerificationAddress: null,
      walletVerificationChallengeHash: null,
      walletVerificationExpiresAt: null,
      walletVerifiedAt,
    },
    overrideAccess: true,
  })

  return noStoreJSON({ address, walletVerifiedAt })
}
