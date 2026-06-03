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
    <div className="border border-border bg-card/25 p-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="portal-kicker">Account email</p>
          <p className="mt-2 break-all font-mono text-sm font-bold text-foreground">{email}</p>
        </div>
        <span
          className={`border px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] ${
            verifiedAt
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-warning/40 bg-warning/10 text-warning'
          }`}
        >
          {verifiedAt ? 'Verified' : 'Unverified'}
        </span>
      </div>
      {verifiedAt ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="font-medium text-foreground">You are cleared for full Portal actions.</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Verified {new Date(verifiedAt).toLocaleDateString()}. This email can receive Portal
            notifications and account messages.
          </p>
        </div>
      ) : (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Verify this address to unlock check-ins, email notifications, and contributor actions
            that require a trusted account.
          </p>
          <Button
            className="mt-4 w-full justify-center"
            disabled={isLoading}
            onClick={requestVerification}
            size="sm"
            type="button"
            variant="outline"
          >
            {isLoading ? 'Sending...' : 'Send verification link'}
          </Button>
        </div>
      )}
      {success ? (
        <p className="mt-4 border border-success/30 bg-success/10 p-3 text-xs leading-5 text-success">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 border border-destructive/30 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
