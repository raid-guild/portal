'use client'

import React, { useState } from 'react'

import { Button } from '../ui/button'

type Props = {
  commentID: number | string
}

const HideCommentButton: React.FC<Props> = ({ commentID }) => {
  const [isHiding, setIsHiding] = useState(false)
  const [error, setError] = useState('')
  const [isHidden, setIsHidden] = useState(false)

  const hideComment = async () => {
    setIsHiding(true)
    setError('')

    try {
      const response = await fetch(`/api/comments/${commentID}/hide`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response))
      }

      setIsHidden(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide comment.')
    } finally {
      setIsHiding(false)
    }
  }

  if (isHidden) {
    return <p className="text-sm text-muted-foreground">Comment hidden.</p>
  }

  return (
    <div className="space-y-2">
      <Button disabled={isHiding} onClick={hideComment} type="button" variant="outline">
        {isHiding ? 'Hiding...' : 'Hide comment'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

const getResponseErrorMessage = async (response: Response): Promise<string> => {
  const fallback = 'Failed to hide comment.'
  const text = await response.text().catch(() => '')

  if (!text) return fallback

  try {
    const error = JSON.parse(text) as { message?: string }

    return error.message || fallback
  } catch {
    return text || fallback
  }
}

export default HideCommentButton
