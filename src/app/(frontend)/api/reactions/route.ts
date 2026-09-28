import configPromise from '@payload-config'
import crypto from 'crypto'
import { cookies, headers as nextHeaders } from 'next/headers'
import { getPayload, type Where } from 'payload'

import { hasVerifiedAccount } from '@/access/roles'
import type { User } from '@/payload-types'
import {
  ANON_COOKIE_NAME,
  adoptAnonymousReactions,
  getReactionSummary,
  isReactableCollection,
  type ReactableCollectionSlug,
} from '@/utilities/contentReactions'

type ReactorUser = Pick<User, 'id'>

const ANON_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_WRITES = 30

// Cheap in-process throttle keyed by ipHash. Not a full rate limiter — it resets on
// deploy/restart and is per-process, so it will not catch abuse spread across many
// server instances. Good enough to blunt a single runaway client; document the
// limitation rather than pretend it's more than that.
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

const isRateLimited = (key: string): boolean => {
  const now = Date.now()
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  bucket.count += 1

  return bucket.count > RATE_LIMIT_MAX_WRITES
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await nextHeaders()
  const { user } = await payload.auth({ headers: requestHeaders })

  const body = await request.json().catch(() => null)

  const targetCollection = body?.targetCollection
  const targetId = normalizeTargetId(body?.targetId)
  const kind = body?.kind
  const active = body?.active

  if (!isReactableCollection(targetCollection)) {
    return Response.json({ message: 'Unknown reactable collection.' }, { status: 400 })
  }

  if (targetId === null) {
    return Response.json({ message: 'A valid targetId is required.' }, { status: 400 })
  }

  if (kind !== 'like' && kind !== 'bookmark') {
    return Response.json({ message: 'kind must be "like" or "bookmark".' }, { status: 400 })
  }

  if (typeof active !== 'boolean') {
    return Response.json({ message: 'active must be a boolean.' }, { status: 400 })
  }

  if (kind === 'bookmark' && !user) {
    return Response.json({ message: 'Log in to bookmark content.' }, { status: 401 })
  }

  // Only bookmarks require a verified account. Likes are open to anonymous visitors,
  // so blocking an unverified member from liking would be pointless — they could log
  // out and like the same page anyway.
  if (kind === 'bookmark' && !hasVerifiedAccount(user)) {
    return Response.json({ message: 'Verify your account before saving.' }, { status: 403 })
  }

  const clientIP = getClientIP(requestHeaders)
  const ipHash = hashIP(clientIP)

  if (isRateLimited(ipHash)) {
    return Response.json({ message: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  const cookieStore = await cookies()
  const cookieAnonymousId = cookieStore.get(ANON_COOKIE_NAME)?.value || null
  const mintedAnonymousId = !user && !cookieAnonymousId ? crypto.randomUUID() : null
  const anonymousId = cookieAnonymousId || mintedAnonymousId

  // Confirm the target is visible before touching a reaction. Enforces the target
  // collection's own read access (published/public-visibility) so drafts, hidden, or
  // members-only content can't be reacted to.
  const target = await findVisibleTarget(payload, targetCollection, targetId, user)

  if (!target) {
    return Response.json({ message: 'Not found.' }, { status: 404 })
  }

  if (user?.id && cookieAnonymousId) {
    await adoptAnonymousReactions({ anonymousId: cookieAnonymousId, payload, userId: user.id })
  }

  if (active) {
    await createReaction({
      anonymousId,
      ipHash,
      kind,
      payload,
      targetCollection,
      targetId,
      user,
    })
  } else {
    await removeReaction({ anonymousId, kind, payload, targetCollection, targetId, user })
  }

  const summary = await getReactionSummary({
    anonymousId,
    collection: targetCollection,
    id: targetId,
    payload,
    user,
  })

  const response = Response.json(
    {
      bookmarked: summary.bookmarked,
      likeCount: summary.likeCount,
      liked: summary.liked,
    },
    { status: 200 },
  )

  response.headers.set('Cache-Control', 'no-store')

  if (mintedAnonymousId) {
    cookieStore.set(ANON_COOKIE_NAME, mintedAnonymousId, {
      httpOnly: true,
      maxAge: ANON_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
      // Secure must follow the actual request scheme, not NODE_ENV: a production
      // build served over plain HTTP (local `next start`, the e2e harness, an
      // internal deployment) would have its Secure cookie dropped by the browser,
      // silently losing every anonymous visitor's identity on the next request.
      secure: isSecureRequest(request, requestHeaders),
    })
  }

  return response
}

const findVisibleTarget = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: ReactableCollectionSlug,
  id: number,
  user: ReactorUser | null | undefined,
) => {
  try {
    return await payload.findByID({
      id,
      collection,
      depth: 0,
      overrideAccess: false,
      user: user || undefined,
    })
  } catch {
    return null
  }
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

const createReaction = async ({
  anonymousId,
  ipHash,
  kind,
  payload,
  targetCollection,
  targetId,
  user,
}: {
  anonymousId: null | string
  ipHash: string
  kind: 'bookmark' | 'like'
  payload: Awaited<ReturnType<typeof getPayload>>
  targetCollection: ReactableCollectionSlug
  targetId: number
  user?: ReactorUser | null
}) => {
  const profile = user?.id ? await getProfileForUser(payload, user.id) : null

  const data = {
    actorType: user ? ('member' as const) : ('anonymous' as const),
    anonymousId: user ? undefined : anonymousId,
    ipHash,
    kind,
    profile: profile?.id,
    targetCollection,
    targetId,
    user: user?.id,
  }

  // `active: true` is an idempotent set, so an existing row is already the desired
  // state. Check first to avoid a pointless write on every repeat click.
  if (await reactionExists({ anonymousId, kind, payload, targetCollection, targetId, user })) {
    return
  }

  try {
    await payload.create({
      collection: 'contentReactions',
      data,
      overrideAccess: true,
      // Pass the actor through explicitly so the collection's beforeValidate hook
      // sees the real req.user (it forces `user` from req.user for non-editors) even
      // though access control itself is bypassed for anonymous visitors.
      user: user || undefined,
    })
  } catch (err) {
    // Losing a race against a concurrent identical write is success, not an error.
    // Don't try to recognise that by error shape: Payload rewrites the Postgres
    // 23505 unique violation into a ValidationError ("The following field is
    // invalid: user_id, kind, target_collection, target_id") that carries neither
    // the SQL code nor the words "duplicate"/"unique". Re-reading the row is the
    // only reliable test, and it keeps working if that wrapping ever changes.
    if (await reactionExists({ anonymousId, kind, payload, targetCollection, targetId, user })) {
      return
    }

    throw err
  }
}

const reactionExists = async ({
  anonymousId,
  kind,
  payload,
  targetCollection,
  targetId,
  user,
}: {
  anonymousId: null | string
  kind: 'bookmark' | 'like'
  payload: Awaited<ReturnType<typeof getPayload>>
  targetCollection: ReactableCollectionSlug
  targetId: number
  user?: ReactorUser | null
}): Promise<boolean> => {
  const actorWhere = buildActorWhere(anonymousId, user)

  if (!actorWhere) return false

  const existing = await payload.find({
    collection: 'contentReactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        actorWhere,
        { kind: { equals: kind } },
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
  })

  return existing.docs.length > 0
}

const buildActorWhere = (
  anonymousId: null | string,
  user?: ReactorUser | null,
): null | Where =>
  user?.id
    ? { user: { equals: user.id } }
    : anonymousId
      ? { anonymousId: { equals: anonymousId } }
      : null

const removeReaction = async ({
  anonymousId,
  kind,
  payload,
  targetCollection,
  targetId,
  user,
}: {
  anonymousId: null | string
  kind: 'bookmark' | 'like'
  payload: Awaited<ReturnType<typeof getPayload>>
  targetCollection: ReactableCollectionSlug
  targetId: number
  user?: ReactorUser | null
}) => {
  const actorWhere = buildActorWhere(anonymousId, user)

  if (!actorWhere) return

  await payload.delete({
    collection: 'contentReactions',
    overrideAccess: true,
    where: {
      and: [
        actorWhere,
        { kind: { equals: kind } },
        { targetCollection: { equals: targetCollection } },
        { targetId: { equals: targetId } },
      ],
    },
  })
}

const normalizeTargetId = (value: unknown): null | number => {
  const numeric = typeof value === 'string' ? Number(value) : value

  return typeof numeric === 'number' && Number.isFinite(numeric) && Number.isInteger(numeric)
    ? numeric
    : null
}

/**
 * True only when the visitor's connection is actually HTTPS, honouring the
 * proxy header first (Railway and similar terminate TLS upstream, so the
 * request URL reaching the app is http).
 */
const isSecureRequest = (request: Request, requestHeaders: Headers): boolean => {
  const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()

  if (forwardedProto) return forwardedProto === 'https'

  try {
    return new URL(request.url).protocol === 'https:'
  } catch {
    return false
  }
}

const getClientIP = (requestHeaders: Headers): string => {
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIP = requestHeaders.get('x-real-ip')?.trim()
  const railwayIP = requestHeaders.get('x-railway-edge-ip')?.trim()

  return forwardedFor || realIP || railwayIP || 'unknown'
}

const hashIP = (ip: string): string =>
  crypto
    .createHmac('sha256', process.env.PAYLOAD_SECRET || 'portal-content-reactions')
    .update(ip)
    .digest('hex')
