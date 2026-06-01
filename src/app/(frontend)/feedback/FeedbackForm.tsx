'use client'

import { ArrowRight } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type FeedbackType = 'account_issue' | 'bug' | 'content_issue' | 'feedback' | 'idea' | 'other'

const feedbackTypes: [FeedbackType, string][] = [
  ['bug', 'Bug'],
  ['feedback', 'Feedback'],
  ['idea', 'Idea'],
  ['content_issue', 'Content issue'],
  ['account_issue', 'Account issue'],
  ['other', 'Other'],
]

export const FeedbackForm: React.FC<{
  defaultEmail?: string | null
  from?: string | null
}> = ({ defaultEmail, from }) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const pageURL = useMemo(() => normalizePageURL(from), [from])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') || '').trim()
    const message = String(formData.get('message') || '').trim()
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()

    if (!title || !message) {
      setError('Please add a title and message.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/feedbackSubmissions', {
        body: JSON.stringify({
          email: email || undefined,
          message,
          metadata: {
            language: navigator.language,
            referrer: document.referrer || undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          pageURL,
          title,
          type: String(formData.get('type') || 'feedback'),
          userAgent: navigator.userAgent,
          viewport: {
            height: window.innerHeight,
            width: window.innerWidth,
          },
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const json = await response.json().catch(() => null)
        throw new Error(json?.errors?.[0]?.message || json?.message || 'Unable to submit feedback.')
      }

      form.reset()
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit feedback.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="portal-panel">
        <p className="portal-kicker">Feedback submitted</p>
        <h2 className="mt-3 portal-heading-sm">Thanks for the signal</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Your note is in the admin queue for triage. If follow-up is needed, we will use your
          account email or the contact email you provided.
        </p>
        <button className="portal-admin-link mt-6" onClick={() => setSubmitted(false)} type="button">
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form className="portal-panel" onSubmit={handleSubmit}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              className="flex h-10 w-full rounded-sm border border-border bg-background/70 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              defaultValue="feedback"
              id="type"
              name="type"
            >
              {feedbackTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="email">Contact email</Label>
            <Input
              autoComplete="email"
              defaultValue={defaultEmail || ''}
              id="email"
              name="email"
              type="email"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" maxLength={160} name="title" required />
        </div>

        <div>
          <Label htmlFor="message">What happened?</Label>
          <Textarea id="message" maxLength={4000} name="message" required rows={7} />
        </div>

        {pageURL ? (
          <div>
            <Label htmlFor="pageURL">Page</Label>
            <Input id="pageURL" readOnly value={pageURL} />
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Submitting...' : 'Submit feedback'}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}

const normalizePageURL = (value?: null | string) => {
  const trimmed = value?.trim()

  if (!trimmed) return ''
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed

  try {
    const url = new URL(trimmed)

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return ''
  }
}
