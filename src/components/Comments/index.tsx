import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Comment } from '../../payload-types'
import CommentForm from './CommentForm'

type Props = {
  postId: number | string
  className?: string
}

export const Comments: React.FC<Props> = async ({ postId, className }) => {
  const payload = await getPayload({ config: configPromise })
  const { docs: comments } = await payload.find({
    collection: 'comments',
    where: {
      post: {
        equals: postId,
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
            <div className="text-sm text-gray-500 mb-2">
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
            <p>{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        )}
      </div>

      {/* Comment form */}
      <CommentForm postId={postId} />
    </div>
  )
}
