'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SignupFieldErrors = {
  email?: string
  form?: string
  name?: string
  password?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formatSignupError = (message: string): SignupFieldErrors => {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid') && normalized.includes('email')) {
    return {
      email: 'Enter a valid email address.',
    }
  }

  if (
    normalized.includes('email') &&
    (normalized.includes('already') ||
      normalized.includes('duplicate') ||
      normalized.includes('unique'))
  ) {
    return {
      email: 'An account already exists for this email. Log in instead.',
    }
  }

  if (normalized.includes('password')) {
    return {
      password: message,
    }
  }

  return {
    form: message || 'Unable to create account.',
  }
}

export const SignupForm: React.FC<{ initialEmail?: string; nextPath?: string }> = ({
  initialEmail,
  nextPath,
}) => {
  const router = useRouter()
  const [errors, setErrors] = useState<SignupFieldErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()
    const name = String(formData.get('name') || '').trim()
    const password = String(formData.get('password') || '')

    if (!email || !name || !password.trim()) {
      setErrors({
        form: 'Please fill in all required fields.',
      })
      setIsLoading(false)
      return
    }

    if (!emailPattern.test(email)) {
      setErrors({
        email: 'Enter a valid email address.',
      })
      setIsLoading(false)
      return
    }

    try {
      const createRes = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          password,
        }),
      })

      if (!createRes.ok) {
        const json = await createRes.json().catch(() => null)
        setErrors(
          formatSignupError(
            json?.errors?.[0]?.message || json?.message || 'Unable to create account.',
          ),
        )
        return
      }

      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!loginRes.ok) {
        router.push('/login')
        return
      }

      router.push(nextPath || '/dashboard')
      router.refresh()
    } catch (err) {
      setErrors(formatSignupError(err instanceof Error ? err.message : 'Unable to create account.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="portal-panel" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            id="name"
            name="name"
            required
          />
          {errors.name ? <p className="mt-2 text-sm text-destructive">{errors.name}</p> : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="email"
            name="email"
            defaultValue={initialEmail}
            required
            type="email"
          />
          {errors.email ? (
            <p className="mt-2 text-sm text-destructive" id="signup-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          {errors.password ? (
            <p className="mt-2 text-sm text-destructive" id="signup-password-error">
              {errors.password}
            </p>
          ) : null}
        </div>
      </div>
      {errors.form ? <p className="mt-4 text-sm text-destructive">{errors.form}</p> : null}
      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Creating account...' : 'Create account'}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}
