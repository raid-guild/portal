'use client'

import React, { useState } from 'react'

import { Button } from '@/components/ui/button'

type MemberProfileClaimCardProps = {
  profileID: number | string
}

export const MemberProfileClaimCard: React.FC<MemberProfileClaimCardProps> = ({ profileID }) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const requestClaim = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/profiles/claim', {
        body: JSON.stringify({ intent: 'request', profileID }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Unable to send profile claim email.')
      }

      setSuccess('Verification email sent.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send profile claim email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <aside className="mt-6 portal-panel">
      <h2 className="portal-heading-sm">Is this you?</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        This imported profile has not been claimed yet. We can send a verification link to the email
        attached to the legacy profile before connecting it to your account.
      </p>
      <Button className="mt-4" disabled={isLoading} onClick={requestClaim} type="button">
        {isLoading ? 'Sending...' : 'Email claim link'}
      </Button>
      {success ? <p className="mt-4 text-sm text-muted-foreground">{success}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </aside>
  )
}
