'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LoginForm: React.FC = () => {
  const router = useRouter()
  const [emailError, setEmailError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEmailError(null)
    setFormError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()
    const password = String(formData.get('password') || '')

    if (!email || !password.trim()) {
      setFormError('Enter your email and password.')
      setIsLoading(false)
      return
    }

    if (!emailPattern.test(email)) {
      setEmailError('Enter a valid email address.')
      setIsLoading(false)
      return
    }

    try {
      const loginRes = await fetch('/api/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!loginRes.ok) {
        setFormError('Email or password is incorrect.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setFormError('Unable to log in. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="portal-panel" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            aria-describedby={emailError ? 'login-email-error' : undefined}
            aria-invalid={Boolean(emailError)}
            autoComplete="email"
            id="login-email"
            name="email"
            required
            type="email"
          />
          {emailError ? (
            <p className="mt-2 text-sm text-destructive" id="login-email-error">
              {emailError}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="login-password">Password</Label>
          <Input
            autoComplete="current-password"
            id="login-password"
            name="password"
            required
            type="password"
          />
        </div>
      </div>
      {formError ? <p className="mt-4 text-sm text-destructive">{formError}</p> : null}
      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Logging in...' : 'Log in to the brief'}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
      <p className="mt-4 text-sm text-muted-foreground">
        Need an account?{' '}
        <Link className="font-bold text-foreground underline decoration-primary/50" href="/join">
          Join the cohort
        </Link>
        .
      </p>
    </form>
  )
}
