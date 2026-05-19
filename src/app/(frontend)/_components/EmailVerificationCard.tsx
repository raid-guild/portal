'use client'

import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

type EmailVerificationCardProps = {
  email: string
  emailVerifiedAt?: string | null
}

export const EmailVerificationCard: React.FC<EmailVerificationCardProps> = ({
  email,
  emailVerifiedAt,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [verifiedAt, setVerifiedAt] = useState<string | null>(emailVerifiedAt || null)

  const requestVerification = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/verify-email', {
        body: JSON.stringify({ intent: 'request' }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Unable to send email verification.')
      }

      setSuccess('Verification email sent. Open the link in that email to verify this address.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send email verification.')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyEmail = async (token: string) => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/verify-email', {
        body: JSON.stringify({ token }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.message || 'Unable to verify email.')
      }

      setVerifiedAt(json?.emailVerifiedAt || new Date().toISOString())
      setSuccess('Email verified.')
      window.history.replaceState(null, '', '/me')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify email.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const token = params.get('verifyEmailToken')

    if (!token || verifiedAt) return

    void verifyEmail(token)
    // The verification URL should be consumed once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedAt])

  return (
    <div className="border-l border-border pl-6 text-sm">
      <p className="font-bold">{email}</p>
      <p className="mt-2 text-muted-foreground">
        {verifiedAt ? 'Email verified' : 'Email not verified'}
      </p>
      {verifiedAt ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Verified {new Date(verifiedAt).toLocaleDateString()}
        </p>
      ) : (
        <Button
          className="mt-4"
          disabled={isLoading}
          onClick={requestVerification}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoading ? 'Sending...' : 'Verify email'}
        </Button>
      )}
      {success ? <p className="mt-3 text-xs text-muted-foreground">{success}</p> : null}
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
