import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import type { Comment, User } from '../../payload-types'
import CommentForm from './CommentForm'
import HideCommentButton from './HideCommentButton'

type CommentParent = {
  relationTo: 'contributionRequests' | 'events' | 'posts' | 'projects'
  value: number | string
}

type Props = {
  canComment?: boolean
  canHide?: boolean
  className?: string
  commenterLabel?: string
  loginHref?: string
  title?: string | null
  user?: User | null
} & (
  | {
      parent?: never
      postId: number | string
    }
  | {
      parent: CommentParent
      postId?: never
    }
)

export const Comments: React.FC<Props> = async ({
  canComment = false,
  canHide = false,
  commenterLabel,
  parent,
  postId,
  className,
  loginHref,
  title = 'Comments',
  user,
}) => {
  const commentParent = parent || { relationTo: 'posts' as const, value: postId }
  const payload = await getPayload({ config: configPromise })
  const { docs: comments } = await payload.find({
    collection: 'comments',
    user,
    where: {
      'parent.relationTo': {
        equals: commentParent.relationTo,
      },
      'parent.value': {
        equals: commentParent.value,
      },
      isApproved: {
        equals: true,
      },
    },
    sort: '-createdAt',
    depth: 0,
  })

  return (
    <div className={`py-8 ${className || ''}`}>
      {title ? <h2 className="text-2xl font-bold mb-4">{title}</h2> : null}

      {/* Display existing comments */}
      <div className="space-y-4 mb-8">
        {(comments as Comment[]).map((comment) => (
          <div key={comment.id} className="p-4 border rounded">
            <div className="font-medium">{comment.author?.name}</div>
            <div className="text-sm text-muted-foreground mb-2">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
            <p>{comment.content}</p>
            {canHide && commentParent.relationTo === 'events' ? (
              <div className="mt-4">
                <HideCommentButton commentID={comment.id} />
              </div>
            ) : null}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-muted-foreground">
            {canComment ? 'No comments yet. Be the first to comment!' : 'No comments yet.'}
          </p>
        )}
      </div>

      {/* Comment form */}
      {canComment ? (
        <CommentForm commenterLabel={commenterLabel} parent={commentParent} />
      ) : (
        <div className="border border-border bg-card/20 p-4 text-sm leading-6 text-muted-foreground">
          Log in to leave a comment.
          {loginHref ? (
            <>
              {' '}
              <Link className="portal-link" href={loginHref}>
                Log in
              </Link>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
