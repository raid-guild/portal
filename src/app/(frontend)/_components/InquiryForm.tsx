'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trackPortalEvent } from '@/utilities/analytics'

type InquiryType = 'client' | 'sponsor' | 'grant' | 'opportunity' | 'general'

const budgetRanges = [
  ['unknown', 'Unknown'],
  ['no-budget-yet', 'No budget yet'],
  ['under-5k', 'Under $5k'],
  ['5k-15k', '$5k-$15k'],
  ['15k-50k', '$15k-$50k'],
  ['50k-plus', '$50k+'],
]

const timelines = [
  ['flexible', 'Flexible'],
  ['this-week', 'This week'],
  ['this-month', 'This month'],
  ['this-quarter', 'This quarter'],
]

export const InquiryForm: React.FC<{
  createAccountLabel?: string
  messageLabel: string
  postSubmitBody?: string
  postSubmitEyebrow?: string
  postSubmitHeading?: string
  sourceRoute: string
  submitAnotherLabel?: string
  submitLabel?: string
  type: InquiryType
}> = ({
  createAccountLabel = 'Create account',
  messageLabel,
  postSubmitBody = 'Your request has been started. Create an account so we can connect this request to your Portal profile, share follow-ups, and keep the conversation tied to your work.',
  postSubmitEyebrow = 'Inquiry started',
  postSubmitHeading = 'Continue your RaidGuild intake',
  sourceRoute,
  submitAnotherLabel = 'Submit another',
  submitLabel = 'Start inquiry',
  type,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState<{ email: string; id: number | string } | null>(null)
  const hasTrackedStart = useRef(false)
  const showBudgetFields = type !== 'general'

  const joinHref = useMemo(() => {
    if (!submitted) return '/join'

    const params = new URLSearchParams({
      email: submitted.email,
      inquiry: String(submitted.id),
      inquiryType: type,
    })

    return `/join?${params.toString()}`
  }, [submitted])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()
    const linkURL = String(formData.get('linkURL') || '').trim()
    const linkLabel = String(formData.get('linkLabel') || '').trim()

    const payload = {
      budgetRange: showBudgetFields ? String(formData.get('budgetRange') || 'unknown') : undefined,
      email,
      links: linkURL
        ? [
            {
              label: linkLabel || 'Inquiry link',
              url: linkURL,
            },
          ]
        : undefined,
      message: String(formData.get('message') || '').trim(),
      name: String(formData.get('name') || '').trim(),
      organization: String(formData.get('organization') || '').trim(),
      roleOrTitle: String(formData.get('roleOrTitle') || '').trim(),
      sourceRoute,
      timeline: showBudgetFields ? String(formData.get('timeline') || 'flexible') : undefined,
      type,
      utmCampaign: readSearchParam('utm_campaign'),
      utmMedium: readSearchParam('utm_medium'),
      utmSource: readSearchParam('utm_source'),
    }

    if (!payload.name || !payload.email || !payload.message) {
      trackPortalEvent('Inquiry Failed', {
        error_stage: 'validation',
        form_variant: 'typed',
        inquiry_type: type,
        status_code: 'not_applicable',
      })
      setError('Please fill in the required fields.')
      setIsLoading(false)
      return
    }

    let hasTrackedFailure = false

    try {
      const response = await fetch('/api/inquiries', {
        body: JSON.stringify(payload),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        hasTrackedFailure = true
        trackPortalEvent('Inquiry Failed', {
          error_stage: 'api',
          form_variant: 'typed',
          inquiry_type: type,
          status_code: String(response.status),
        })
        const json = await response.json().catch(() => null)
        throw new Error(json?.errors?.[0]?.message || json?.message || 'Unable to submit inquiry.')
      }

      const json = await response.json()
      trackPortalEvent('Inquiry Submitted', {
        budget_range: payload.budgetRange || 'not_applicable',
        form_variant: 'typed',
        has_link: linkURL ? 'yes' : 'no',
        inquiry_type: type,
        timeline: payload.timeline || 'not_applicable',
      })
      form.reset()
      setSubmitted({ email, id: json.doc?.id || json.id })
    } catch (err) {
      if (!hasTrackedFailure) {
        trackPortalEvent('Inquiry Failed', {
          error_stage: 'network',
          form_variant: 'typed',
          inquiry_type: type,
          status_code: 'not_applicable',
        })
      }
      setError(err instanceof Error ? err.message : 'Unable to submit inquiry.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="portal-panel">
        <p className="portal-kicker">{postSubmitEyebrow}</p>
        <h2 className="mt-3 portal-heading-sm">{postSubmitHeading}</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{postSubmitBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="portal-admin-link"
            href={joinHref}
            onClick={() =>
              trackPortalEvent('Inquiry Account Clicked', {
                form_variant: 'typed',
                inquiry_type: type,
              })
            }
          >
            {createAccountLabel}
          </Link>
          <button className="portal-admin-link" onClick={() => setSubmitted(null)} type="button">
            {submitAnotherLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="portal-panel"
      onFocusCapture={() => {
        if (hasTrackedStart.current) return

        hasTrackedStart.current = true
        trackPortalEvent('Inquiry Started', {
          form_variant: 'typed',
          inquiry_type: type,
        })
      }}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input autoComplete="name" id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input autoComplete="email" id="email" name="email" required type="email" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="organization">Organization / project</Label>
            <Input id="organization" name="organization" />
          </div>
          <div>
            <Label htmlFor="roleOrTitle">Role / title</Label>
            <Input id="roleOrTitle" name="roleOrTitle" />
          </div>
        </div>

        {showBudgetFields ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Budget range" name="budgetRange" options={budgetRanges} />
            <SelectField label="Timeline" name="timeline" options={timelines} />
          </div>
        ) : null}

        <div>
          <Label htmlFor="message">{messageLabel}</Label>
          <Textarea id="message" maxLength={4000} name="message" required rows={6} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="linkLabel">Link label</Label>
            <Input id="linkLabel" name="linkLabel" placeholder="Deck, repo, brief, website" />
          </div>
          <div>
            <Label htmlFor="linkURL">Relevant link</Label>
            <Input id="linkURL" name="linkURL" placeholder="https://..." type="url" />
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Submitting...' : submitLabel}
        {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}

const SelectField: React.FC<{
  label: string
  name: string
  options: string[][]
}> = ({ label, name, options }) => (
  <div>
    <Label htmlFor={name}>{label}</Label>
    <select
      className="flex h-10 w-full rounded-sm border border-border bg-background/70 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      id={name}
      name={name}
    >
      {options.map(([value, optionLabel]) => (
        <option key={value} value={value}>
          {optionLabel}
        </option>
      ))}
    </select>
  </div>
)

const readSearchParam = (key: string) => {
  if (typeof window === 'undefined') return undefined

  return new URLSearchParams(window.location.search).get(key) || undefined
}
