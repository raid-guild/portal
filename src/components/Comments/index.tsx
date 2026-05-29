import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Comment } from '../../payload-types'
import CommentForm from './CommentForm'

type CommentParent = {
  relationTo: 'contributionRequests' | 'events' | 'posts' | 'projects'
  value: number | string
}

type Props = { className?: string } & (
  | {
      parent?: never
      postId: number | string
    }
  | {
      parent: CommentParent
      postId?: never
    }
)

export const Comments: React.FC<Props> = async ({ parent, postId, className }) => {
  const commentParent = parent || { relationTo: 'posts' as const, value: postId }
  const payload = await getPayload({ config: configPromise })
  const { docs: comments } = await payload.find({
    collection: 'comments',
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
      <h2 className="text-2xl font-bold mb-4">Comments</h2>

      {/* Display existing comments */}
      <div className="space-y-4 mb-8">
        {(comments as Comment[]).map((comment) => (
          <div key={comment.id} className="p-4 border rounded">
            <div className="font-medium">{comment.author?.name}</div>
            <div className="text-sm text-muted-foreground mb-2">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        )}
      </div>

      {/* Comment form */}
      <CommentForm parent={commentParent} />
    </div>
  )
}
