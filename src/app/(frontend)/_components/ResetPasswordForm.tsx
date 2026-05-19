'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const ResetPasswordForm: React.FC<{ token?: string }> = ({ token }) => {
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [reset, setReset] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (!token) {
      setFormError('Reset token is missing. Request a new password reset link.')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/reset-password', {
        body: JSON.stringify({
          password,
          token,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        setFormError('Reset link is invalid or expired. Request a new password reset link.')
        return
      }

      setReset(true)
    } catch {
      setFormError('Unable to reset password. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (reset) {
    return (
      <div className="portal-panel">
        <h2 className="portal-heading-sm">Password reset</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your password has been updated. You can now log in with the new password.
        </p>
        <Link className="portal-link mt-5 inline-flex" href="/login">
          Log in
        </Link>
      </div>
    )
  }

  return (
    <form className="portal-panel" onSubmit={handleSubmit}>
      {!token ? (
        <p className="mb-5 text-sm text-destructive">
          Reset token is missing. Request a new password reset link.
        </p>
      ) : null}
      <div className="space-y-5">
        <div>
          <Label htmlFor="reset-password">New password</Label>
          <Input
            autoComplete="new-password"
            id="reset-password"
            name="password"
            required
            type="password"
          />
        </div>
        <div>
          <Label htmlFor="reset-confirm-password">Confirm password</Label>
          <Input
            autoComplete="new-password"
            id="reset-confirm-password"
            name="confirmPassword"
            required
            type="password"
          />
        </div>
      </div>
      {formError ? <p className="mt-4 text-sm text-destructive">{formError}</p> : null}
      <Button className="mt-6 w-full" disabled={isLoading || !token} type="submit">
        {isLoading ? 'Resetting...' : 'Reset password'}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Need a new link?{' '}
        <Link
          className="font-bold text-foreground underline decoration-primary/50"
          href="/forgot-password"
        >
          Request one
        </Link>
        .
      </p>
    </form>
  )
}
