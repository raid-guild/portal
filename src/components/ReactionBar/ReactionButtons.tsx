'use client'

import { Bookmark, Heart } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

// Type-only import: erased at compile time, so the server-only
// `@/utilities/contentReactions` module (it reads cookies and calls Payload) never
// ends up in this client bundle.
import type { ReactableCollectionSlug } from '@/utilities/contentReactions'

export type { ReactableCollectionSlug }

type ReactionKind = 'bookmark' | 'like'

type ReactionResponse = {
  bookmarked?: boolean
  likeCount?: number
  liked?: boolean
  message?: string
}

type ReactionButtonsProps = {
  className?: string
  initialBookmarked: boolean
  initialLikeCount: number
  initialLiked: boolean
  isSignedIn: boolean
  isVerified: boolean
  loginHref: string
  targetCollection: ReactableCollectionSlug
  targetId: number
}

const getReactionErrorMessage = (status: number, kind: ReactionKind): string => {
  if (status === 401) return 'Sign in to save this.'
  if (status === 403) return 'Verify your account to continue.'
  if (status === 404) return 'This item is no longer available.'
  if (status === 429) return 'Too many requests. Try again in a moment.'

  return kind === 'like'
    ? 'Unable to update your like. Try again.'
    : 'Unable to update your bookmark. Try again.'
}

export const ReactionButtons: React.FC<ReactionButtonsProps> = ({
  className,
  initialBookmarked,
  initialLikeCount,
  initialLiked,
  isSignedIn,
  isVerified,
  loginHref,
  targetCollection,
  targetId,
}) => {
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false)
  const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false)

  const sendReaction = async (kind: ReactionKind, active: boolean): Promise<ReactionResponse> => {
    const res = await fetch('/api/reactions', {
      body: JSON.stringify({ active, kind, targetCollection, targetId }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const json = (await res.json().catch(() => null)) as ReactionResponse | null

    if (!res.ok) {
      throw new Error(json?.message || getReactionErrorMessage(res.status, kind))
    }

    return json || {}
  }

  const toggleLike = async () => {
    const previous = { likeCount, liked }
    const nextLiked = !liked

    setLikeError(null)
    setLiked(nextLiked)
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)))
    setIsLikeSubmitting(true)

    try {
      const json = await sendReaction('like', nextLiked)

      setLiked(Boolean(json.liked))
      setLikeCount(typeof json.likeCount === 'number' ? json.likeCount : previous.likeCount)
      if (typeof json.bookmarked === 'boolean') setBookmarked(json.bookmarked)
      router.refresh()
    } catch (err) {
      setLiked(previous.liked)
      setLikeCount(previous.likeCount)
      setLikeError(err instanceof Error ? err.message : getReactionErrorMessage(0, 'like'))
    } finally {
      setIsLikeSubmitting(false)
    }
  }

  const toggleBookmark = async () => {
    if (!isVerified) return

    const previous = bookmarked
    const nextBookmarked = !bookmarked

    setBookmarkError(null)
    setBookmarked(nextBookmarked)
    setIsBookmarkSubmitting(true)

    try {
      const json = await sendReaction('bookmark', nextBookmarked)

      setBookmarked(Boolean(json.bookmarked))
      if (typeof json.liked === 'boolean') setLiked(json.liked)
      if (typeof json.likeCount === 'number') setLikeCount(json.likeCount)
      router.refresh()
    } catch (err) {
      setBookmarked(previous)
      setBookmarkError(err instanceof Error ? err.message : getReactionErrorMessage(0, 'bookmark'))
    } finally {
      setIsBookmarkSubmitting(false)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ''}`}>
      <button
        aria-label={liked ? 'Remove like' : 'Like'}
        aria-pressed={liked}
        className={`portal-pill inline-flex items-center gap-2 transition-colors hover:text-primary ${
          liked ? 'border-primary text-primary' : ''
        }`}
        disabled={isLikeSubmitting}
        onClick={() => void toggleLike()}
        type="button"
      >
        <Heart aria-hidden="true" className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
        <span>{likeCount}</span>
      </button>

      {!isSignedIn ? (
        <Link
          className="portal-pill inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          href={loginHref}
        >
          <Bookmark aria-hidden="true" className="h-4 w-4" />
          <span>Sign in to save this</span>
        </Link>
      ) : !isVerified ? (
        <Link
          className="portal-pill inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          href="/me"
        >
          <Bookmark aria-hidden="true" className="h-4 w-4" />
          <span>Verify to save this</span>
        </Link>
      ) : (
        <button
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          aria-pressed={bookmarked}
          className={`portal-pill inline-flex items-center gap-2 transition-colors hover:text-primary ${
            bookmarked ? 'border-primary text-primary' : ''
          }`}
          disabled={isBookmarkSubmitting}
          onClick={() => void toggleBookmark()}
          type="button"
        >
          <Bookmark
            aria-hidden="true"
            className="h-4 w-4"
            fill={bookmarked ? 'currentColor' : 'none'}
          />
          <span>{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      )}

      {likeError ? <p className="basis-full text-sm text-destructive">{likeError}</p> : null}
      {bookmarkError ? (
        <p className="basis-full text-sm text-destructive">{bookmarkError}</p>
      ) : null}
    </div>
  )
}
