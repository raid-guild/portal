import type { CollectionAfterDeleteHook, Payload, PayloadRequest, Where } from 'payload'
import { cookies } from 'next/headers'

import type { User } from '@/payload-types'

export type ReactionKind = 'like' | 'bookmark'

export type ReactionActorType = 'member' | 'anonymous'

export type ReactableCollectionSlug = 'posts' | 'events' | 'projects' | 'threads' | 'wikiPages'

type ReactableTargetDoc = {
  id: number | string
  slug?: null | string
}

type ReactableCollectionConfig = {
  href: (doc: ReactableTargetDoc) => string
  label: string
}

export const REACTABLE_COLLECTIONS: Record<ReactableCollectionSlug, ReactableCollectionConfig> = {
  events: {
    href: (doc) => `/events/${doc.id}`,
    label: 'Event',
  },
  posts: {
    href: (doc) => `/posts/${doc.slug || doc.id}`,
    label: 'Post',
  },
  projects: {
    href: (doc) => `/projects/${doc.slug || doc.id}`,
    label: 'Project',
  },
  threads: {
    href: (doc) => `/threads/${doc.slug || doc.id}`,
    label: 'Thread',
  },
  wikiPages: {
    href: (doc) => `/wiki/${doc.slug || doc.id}`,
    label: 'Wiki Page',
  },
}

export const REACTABLE_COLLECTION_SLUGS = Object.keys(
  REACTABLE_COLLECTIONS,
) as ReactableCollectionSlug[]

export const isReactableCollection = (value: unknown): value is ReactableCollectionSlug =>
  typeof value === 'string' &&
  (REACTABLE_COLLECTION_SLUGS as string[]).includes(value)

export const ANON_COOKIE_NAME = 'portal_anon_id'

/**
 * Reads the anonymous visitor id from the `portal_anon_id` cookie via `next/headers`.
 * Mirrors the dynamic-rendering call `getCurrentUser.ts` already makes, so pages that
 * call this stay dynamic rather than getting statically optimized.
 */
export const getAnonymousId = async (): Promise<null | string> => {
  const cookieStore = await cookies()

  return cookieStore.get(ANON_COOKIE_NAME)?.value || null
}

type ReactionActorUser = null | Pick<User, 'id'> | undefined

export type ReactionSummary = {
  bookmarked: boolean
  likeCount: number
  liked: boolean
}

/**
 * Public like count (overrideAccess) plus the current actor's own liked/bookmarked state.
 * `bookmarked` is always false for anonymous visitors — bookmarks require a member.
 */
export const getReactionSummary = async ({
  anonymousId,
  collection,
  id,
  payload,
  user,
}: {
  anonymousId?: null | string
  collection: ReactableCollectionSlug
  id: number | string
  payload: Payload
  user?: ReactionActorUser
}): Promise<ReactionSummary> => {
  const targetWhere: Where[] = [
    { targetCollection: { equals: collection } },
    { targetId: { equals: id } },
  ]

  const likeCountResult = await payload.count({
    collection: 'contentReactions',
    overrideAccess: true,
    where: {
      and: [...targetWhere, { kind: { equals: 'like' } }],
    },
  })

  const actorWhere: null | Where = user?.id
    ? { user: { equals: user.id } }
    : anonymousId
      ? { anonymousId: { equals: anonymousId } }
      : null

  if (!actorWhere) {
    return {
      bookmarked: false,
      likeCount: likeCountResult.totalDocs,
      liked: false,
    }
  }

  const actorRows = await payload.find({
    collection: 'contentReactions',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [...targetWhere, actorWhere],
    },
  })

  return {
    bookmarked: Boolean(user?.id) && actorRows.docs.some((doc) => doc.kind === 'bookmark'),
    likeCount: likeCountResult.totalDocs,
    liked: actorRows.docs.some((doc) => doc.kind === 'like'),
  }
}

export type UserReactionRow = {
  createdAt: string
  href: string
  id: number | string
  kind: ReactionKind
  label: string
  targetCollection: ReactableCollectionSlug
  targetId: number
}

export type GetUserReactionsResult = {
  docs: UserReactionRow[]
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalDocs: number
  totalPages: number
}

/**
 * Paginated rows of a member's own reactions, with targets batch-resolved per collection
 * using `overrideAccess: false` so a target the member can no longer read is dropped
 * quietly rather than surfaced as a broken row.
 */
export const getUserReactions = async ({
  collection,
  kind,
  limit = 20,
  page = 1,
  payload,
  user,
}: {
  collection?: ReactableCollectionSlug
  kind?: ReactionKind
  limit?: number
  page?: number
  payload: Payload
  user: Pick<User, 'id'>
}): Promise<GetUserReactionsResult> => {
  const where: Where[] = [{ user: { equals: user.id } }]

  if (kind) where.push({ kind: { equals: kind } })
  if (collection) where.push({ targetCollection: { equals: collection } })

  const result = await payload.find({
    collection: 'contentReactions',
    depth: 0,
    limit,
    overrideAccess: true,
    page,
    sort: '-createdAt',
    where: { and: where },
  })

  const idsByCollection = new Map<ReactableCollectionSlug, Set<number>>()

  for (const doc of result.docs) {
    const slug = doc.targetCollection
    if (!isReactableCollection(slug)) continue

    if (!idsByCollection.has(slug)) idsByCollection.set(slug, new Set())
    idsByCollection.get(slug)?.add(doc.targetId)
  }

  const targetsByCollection = new Map<ReactableCollectionSlug, Map<number, ReactableTargetDoc>>()

  await Promise.all(
    Array.from(idsByCollection.entries()).map(async ([slug, ids]) => {
      const found = await payload.find({
        collection: slug,
        depth: 0,
        limit: ids.size,
        overrideAccess: false,
        pagination: false,
        user: user as PayloadRequest['user'],
        where: {
          id: {
            in: Array.from(ids),
          },
        },
      })

      const map = new Map<number, ReactableTargetDoc>()

      for (const doc of found.docs) {
        const slugValue =
          'slug' in doc && typeof (doc as { slug?: unknown }).slug === 'string'
            ? (doc as { slug?: string }).slug
            : null

        map.set(doc.id, { id: doc.id, slug: slugValue })
      }

      targetsByCollection.set(slug, map)
    }),
  )

  const docs: UserReactionRow[] = []

  for (const doc of result.docs) {
    const slug = doc.targetCollection
    if (!isReactableCollection(slug)) continue

    const target = targetsByCollection.get(slug)?.get(doc.targetId)
    if (!target) continue

    docs.push({
      createdAt: doc.createdAt,
      href: REACTABLE_COLLECTIONS[slug].href(target),
      id: doc.id,
      kind: doc.kind as ReactionKind,
      label: REACTABLE_COLLECTIONS[slug].label,
      targetCollection: slug,
      targetId: doc.targetId,
    })
  }

  return {
    docs,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
    page: result.page || page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

const getProfileIDForUser = async (
  payload: Payload,
  userID: number,
  req?: PayloadRequest,
): Promise<number | undefined> => {
  const result = await payload.find({
    collection: 'profiles',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0]?.id
}

/**
 * Reassigns an anonymous cookie's reactions to the freshly authenticated user, so the
 * same human is not counted twice after signing in. Rows that would collide with an
 * existing member row for the same (kind, target) are deleted instead of reassigned.
 */
export const adoptAnonymousReactions = async ({
  anonymousId,
  payload,
  req,
  userId,
}: {
  anonymousId: string
  payload: Payload
  req?: PayloadRequest
  userId: number
}): Promise<void> => {
  const anonRows = await payload.find({
    collection: 'contentReactions',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [{ anonymousId: { equals: anonymousId } }, { user: { exists: false } }],
    },
  })

  if (!anonRows.docs.length) return

  const profileID = await getProfileIDForUser(payload, userId, req)

  for (const row of anonRows.docs) {
    const existing = await payload.find({
      collection: 'contentReactions',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          { user: { equals: userId } },
          { kind: { equals: row.kind } },
          { targetCollection: { equals: row.targetCollection } },
          { targetId: { equals: row.targetId } },
        ],
      },
    })

    if (existing.docs[0]) {
      await payload.delete({
        id: row.id,
        collection: 'contentReactions',
        overrideAccess: true,
        req,
      })
      continue
    }

    await payload.update({
      id: row.id,
      collection: 'contentReactions',
      data: {
        actorType: 'member',
        anonymousId: null,
        profile: profileID || undefined,
        user: userId,
      },
      overrideAccess: true,
      req,
    })
  }
}

/**
 * Factory for a target collection's `afterDelete` hook: deletes every content reaction
 * pointed at the deleted doc so likes/bookmarks don't orphan when a post, event,
 * project, thread, or wiki page is removed.
 */
export const deleteReactionsForTarget = (
  targetCollection: ReactableCollectionSlug,
): CollectionAfterDeleteHook => {
  return async ({ doc, req }) => {
    await req.payload.delete({
      collection: 'contentReactions',
      overrideAccess: true,
      req,
      where: {
        and: [
          { targetCollection: { equals: targetCollection } },
          { targetId: { equals: doc.id } },
        ],
      },
    })

    return doc
  }
}
