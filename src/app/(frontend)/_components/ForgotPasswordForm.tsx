'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ForgotPasswordForm: React.FC = () => {
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailError(null)
    setFormError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()

    if (!emailPattern.test(email)) {
      setEmailError('Enter a valid email address.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/forgot-password', {
        body: JSON.stringify({ email }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        setFormError('Unable to send reset instructions. Try again.')
        return
      }

      setSent(true)
    } catch {
      setFormError('Unable to send reset instructions. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="portal-panel">
        <h2 className="portal-heading-sm">Check your email</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          If an account exists for that address, password reset instructions have been sent.
        </p>
        <Link className="portal-link mt-5 inline-flex" href="/login">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form className="portal-panel" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          aria-describedby={emailError ? 'forgot-email-error' : undefined}
          aria-invalid={Boolean(emailError)}
          autoComplete="email"
          id="forgot-email"
          name="email"
          required
          type="email"
        />
        {emailError ? (
          <p className="mt-2 text-sm text-destructive" id="forgot-email-error">
            {emailError}
          </p>
        ) : null}
      </div>
      {formError ? <p className="mt-4 text-sm text-destructive">{formError}</p> : null}
      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Sending...' : 'Send reset link'}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Remembered it?{' '}
        <Link className="font-bold text-foreground underline decoration-primary/50" href="/login">
          Log in
        </Link>
        .
      </p>
    </form>
  )
}
