'use client'

import { ArrowRight } from 'lucide-react'
import React, { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trackPortalEvent } from '@/utilities/analytics'

const sponsorTypes = [
  ['project-opportunity', 'Project opportunity'],
  ['bounty-paid-work', 'Bounty / paid work'],
  ['grant-funding', 'Grant / funding'],
  ['mentorship-office-hours', 'Mentorship / office hours'],
  ['tooling-infrastructure', 'Tooling / infrastructure'],
  ['other', 'Other'],
]

const budgetRanges = [
  ['unknown', 'Unknown'],
  ['no-budget-yet', 'No budget yet'],
  ['under-1k', 'Under $1k'],
  ['1k-5k', '$1k-$5k'],
  ['5k-15k', '$5k-$15k'],
  ['15k-plus', '$15k+'],
]

const timelines = [
  ['flexible', 'Flexible'],
  ['this-week', 'This week'],
  ['this-month', 'This month'],
  ['next-cohort-cycle', 'Next cohort cycle'],
]

const nextSteps = [
  ['talk-to-someone', 'Talk to someone'],
  ['submit-for-review', 'Submit for review'],
  ['join-a-session', 'Join a session'],
]

export const SponsorInquiryForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const hasTrackedStart = useRef(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const linkURL = String(formData.get('linkURL') || '').trim()
    const linkLabel = String(formData.get('linkLabel') || '').trim()

    const payload = {
      budgetRange: String(formData.get('budgetRange') || 'unknown'),
      canShowPublicly: formData.get('canShowPublicly') === 'on',
      contributorNeeds: String(formData.get('contributorNeeds') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      links: linkURL
        ? [
            {
              label: linkLabel || 'Sponsor link',
              url: linkURL,
            },
          ]
        : undefined,
      name: String(formData.get('name') || '').trim(),
      opportunity: String(formData.get('opportunity') || '').trim(),
      organization: String(formData.get('organization') || '').trim(),
      preferredNextStep: String(formData.get('preferredNextStep') || 'talk-to-someone'),
      sponsorType: String(formData.get('sponsorType') || 'project-opportunity'),
      timeline: String(formData.get('timeline') || 'flexible'),
    }

    if (!payload.name || !payload.email || !payload.organization || !payload.opportunity) {
      trackPortalEvent('Inquiry Failed', {
        error_stage: 'validation',
        form_variant: 'legacy_sponsor',
        inquiry_type: 'sponsor',
        status_code: 'not_applicable',
      })
      setError('Please fill in the required fields.')
      setIsLoading(false)
      return
    }

    let hasTrackedFailure = false

    try {
      const response = await fetch('/api/sponsorInquiries', {
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
          form_variant: 'legacy_sponsor',
          inquiry_type: 'sponsor',
          status_code: String(response.status),
        })
        const json = await response.json().catch(() => null)
        throw new Error(json?.errors?.[0]?.message || json?.message || 'Unable to submit inquiry.')
      }

      trackPortalEvent('Inquiry Submitted', {
        budget_range: payload.budgetRange,
        form_variant: 'legacy_sponsor',
        has_link: linkURL ? 'yes' : 'no',
        inquiry_type: 'sponsor',
        timeline: payload.timeline,
      })
      form.reset()
      setIsSubmitted(true)
    } catch (err) {
      if (!hasTrackedFailure) {
        trackPortalEvent('Inquiry Failed', {
          error_stage: 'network',
          form_variant: 'legacy_sponsor',
          inquiry_type: 'sponsor',
          status_code: 'not_applicable',
        })
      }
      setError(err instanceof Error ? err.message : 'Unable to submit inquiry.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="portal-panel">
        <h2 className="portal-heading-sm">Sponsor inquiry received</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The opportunity is now in review. A RaidGuild contributor will follow up if it is a fit
          for the current cohort cycle.
        </p>
        <Button className="mt-6" onClick={() => setIsSubmitted(false)} variant="outline">
          Submit another inquiry
        </Button>
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
          form_variant: 'legacy_sponsor',
          inquiry_type: 'sponsor',
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

        <div>
          <Label htmlFor="organization">Organization / project</Label>
          <Input id="organization" name="organization" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Sponsor type" name="sponsorType" options={sponsorTypes} />
          <SelectField label="Budget range" name="budgetRange" options={budgetRanges} />
        </div>

        <div>
          <Label htmlFor="opportunity">What are you bringing?</Label>
          <Textarea id="opportunity" maxLength={3000} name="opportunity" required rows={5} />
        </div>

        <div>
          <Label htmlFor="contributorNeeds">What kind of contributors are you looking for?</Label>
          <Textarea id="contributorNeeds" maxLength={1200} name="contributorNeeds" rows={3} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="Timeline" name="timeline" options={timelines} />
          <SelectField label="Preferred next step" name="preferredNextStep" options={nextSteps} />
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

        <label className="flex items-start gap-3 text-sm leading-6">
          <input className="mt-1" name="canShowPublicly" type="checkbox" />
          <span>This opportunity can be mentioned publicly after review.</span>
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <Button className="mt-6 w-full" disabled={isLoading} type="submit">
        {isLoading ? 'Submitting...' : 'Submit sponsor inquiry'}
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
