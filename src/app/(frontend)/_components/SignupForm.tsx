'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const SignupForm: React.FC = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const name = String(formData.get('name') || '').trim()
    const password = String(formData.get('password') || '')

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
        throw new Error(json?.errors?.[0]?.message || json?.message || 'Unable to create account.')
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
        router.push('/admin/login')
        return
      }

      router.push('/me')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="border border-border bg-background p-6" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input autoComplete="name" id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" name="email" required type="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>
      </div>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Creating account...' : 'Create account'}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}
