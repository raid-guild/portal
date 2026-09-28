import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import { hasVerifiedAccount } from '@/access/roles'
import type { User } from '@/payload-types'
import {
  getAnonymousId,
  getReactionSummary,
  isReactableCollection,
} from '@/utilities/contentReactions'
import { ReactionButtons, type ReactableCollectionSlug } from './ReactionButtons'

type ReactionBarProps = {
  className?: string
  collection: ReactableCollectionSlug
  id: number | string
  /** The current page path (e.g. `/posts/my-slug`), used to build the sign-in redirect. */
  path: string
  user: User | null
}

/**
 * Server wrapper around `ReactionButtons`. Resolves the anonymous cookie and the
 * public/personal reaction summary, then hands off to the client component for
 * the interactive like/bookmark controls. Renders nothing while in draft/preview
 * mode, since draft documents should not accrue public reactions.
 */
export const ReactionBar: React.FC<ReactionBarProps> = async ({
  className,
  collection,
  id,
  path,
  user,
}) => {
  if (!isReactableCollection(collection)) return null

  const { isEnabled: isDraftMode } = await draftMode()

  if (isDraftMode) return null

  const targetId = typeof id === 'string' ? Number(id) : id

  if (!Number.isFinite(targetId)) return null

  const [anonymousId, payload] = await Promise.all([
    getAnonymousId(),
    getPayload({ config: configPromise }),
  ])

  const summary = await getReactionSummary({
    anonymousId,
    collection,
    id: targetId,
    payload,
    user,
  })

  return (
    <ReactionButtons
      className={className}
      initialBookmarked={summary.bookmarked}
      initialLikeCount={summary.likeCount}
      initialLiked={summary.liked}
      isSignedIn={Boolean(user)}
      isVerified={hasVerifiedAccount(user)}
      loginHref={`/login?next=${encodeURIComponent(path)}`}
      targetCollection={collection}
      targetId={targetId}
    />
  )
}
