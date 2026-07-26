'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'

type CommentParent = {
  relationTo: 'contributionRequests' | 'events' | 'posts' | 'projects'
  value: number | string
}

type CommentFormProps = {
  commenterLabel?: string
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

const CommentForm: React.FC<CommentFormProps> = ({ commenterLabel, parent, postId }) => {
  const commentParent = parent || { relationTo: 'posts' as const, value: postId }
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent: commentParent,
        }),
      })

      if (!res.ok) {
        throw new Error(await getResponseErrorMessage(res))
      }

      setSuccess(true)
      setContent('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit comment. Please try again.')
      console.error('Comment submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Leave a comment</h3>
      {commenterLabel ? (
        <p className="text-sm text-muted-foreground">Posting as {commenterLabel}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
      </div>

      {error && <div className="text-destructive">{error}</div>}
      {success && <div className="text-success">Comment submitted successfully.</div>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Comment'}
      </Button>
    </form>
  )
}

const getResponseErrorMessage = async (res: Response): Promise<string> => {
  const fallback = 'Failed to submit comment'
  const text = await res.text().catch(() => '')

  if (!text) return fallback

  try {
    const error = JSON.parse(text) as { errors?: { message?: string }[]; message?: string }

    return error.errors?.[0]?.message || error.message || fallback
  } catch {
    return text || fallback
  }
}

export default CommentForm
