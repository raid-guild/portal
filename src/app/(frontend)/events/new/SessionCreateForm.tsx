'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SpeakerOption = {
  id: number | string
  label: string
}

type SessionCreateFormProps = {
  canSyncDiscord: boolean
  defaultSpeakerID?: number | string | null
  defaultStart: string
  speakers: SpeakerOption[]
}

const sessionTypes = [
  ['brownbag', 'Brownbag'],
  ['workshop', 'Workshop'],
  ['all-hands', 'All hands'],
  ['demo', 'Demo'],
  ['pitch', 'Pitch'],
]

export const SessionCreateForm: React.FC<SessionCreateFormProps> = ({
  canSyncDiscord,
  defaultSpeakerID,
  defaultStart,
  speakers,
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncDiscord, setSyncDiscord] = useState(false)

  const speakerDefault = useMemo(() => {
    if (defaultSpeakerID) return String(defaultSpeakerID)

    return speakers[0] ? String(speakers[0].id) : ''
  }, [defaultSpeakerID, speakers])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const body = {
      durationMinutes: Number(formData.get('durationMinutes') || 30),
      joinURL: String(formData.get('joinURL') || ''),
      locationLabel: String(formData.get('locationLabel') || ''),
      sessionType: String(formData.get('sessionType') || 'brownbag'),
      speaker: String(formData.get('speaker') || ''),
      startsAt: toISODateTime(String(formData.get('startsAt') || '')),
      summary: String(formData.get('summary') || ''),
      syncDiscord,
      title: String(formData.get('title') || ''),
      visibility: String(formData.get('visibility') || 'public'),
    }

    try {
      const response = await fetch('/api/events/create', {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null

        throw new Error(data?.message || 'Unable to create session.')
      }

      router.push('/events')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create session.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="portal-card mt-8 grid gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field htmlFor="title" label="Title">
          <Input id="title" name="title" placeholder="Cohort demo session" required />
        </Field>
        <Field htmlFor="sessionType" label="Type">
          <select
            className="portal-select"
            defaultValue="brownbag"
            id="sessionType"
            name="sessionType"
          >
            {sessionTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="startsAt" label="Start time">
          <Input
            defaultValue={defaultStart}
            id="startsAt"
            name="startsAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field htmlFor="durationMinutes" label="Duration">
          <select
            className="portal-select"
            defaultValue="30"
            id="durationMinutes"
            name="durationMinutes"
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </Field>
        <Field htmlFor="speaker" label="Speaker">
          <select
            className="portal-select"
            defaultValue={speakerDefault}
            id="speaker"
            name="speaker"
          >
            <option value="">No speaker</option>
            {speakers.map((speaker) => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.label}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="visibility" label="Visibility">
          <select className="portal-select" defaultValue="public" id="visibility" name="visibility">
            <option value="public">Public</option>
            <option value="authenticated">Authenticated</option>
            <option value="admin">Admin only</option>
          </select>
        </Field>
      </div>
      <Field htmlFor="summary" label="Summary">
        <Textarea
          id="summary"
          name="summary"
          placeholder="What will happen in this session?"
          rows={4}
        />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field htmlFor="locationLabel" label="Location label">
          <Input id="locationLabel" name="locationLabel" placeholder="Discord #cohort-voice" />
        </Field>
        <Field htmlFor="joinURL" label="Join URL">
          <Input id="joinURL" name="joinURL" placeholder="https://..." type="url" />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input
          checked={syncDiscord}
          className="mt-1"
          disabled={!canSyncDiscord}
          onChange={(event) => setSyncDiscord(event.target.checked)}
          type="checkbox"
        />
        <span>
          Create Discord scheduled event
          {!canSyncDiscord ? ' (bot credentials not configured)' : ''}
        </span>
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create session'}
        </Button>
      </div>
    </form>
  )
}

const Field: React.FC<{ children: React.ReactNode; htmlFor: string; label: string }> = ({
  children,
  htmlFor,
  label,
}) => (
  <div className="grid gap-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
)

const toISODateTime = (value: string): string => {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString()
}
