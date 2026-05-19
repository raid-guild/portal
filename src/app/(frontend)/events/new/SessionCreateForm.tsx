'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/cn'

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
] as const

const durations = [
  [30, '30 min'],
  [60, '1 hour'],
] as const

const visibilityOptions = [
  ['public', 'Public'],
  ['authenticated', 'Members'],
  ['admin', 'Admin'],
] as const

export const SessionCreateForm: React.FC<SessionCreateFormProps> = ({
  canSyncDiscord,
  defaultSpeakerID,
  defaultStart,
  speakers,
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [sessionType, setSessionType] = useState('brownbag')
  const [speakerID, setSpeakerID] = useState(() => String(defaultSpeakerID || ''))
  const [speakerQuery, setSpeakerQuery] = useState(() => {
    const selected = speakers.find((speaker) => String(speaker.id) === String(defaultSpeakerID))

    return selected?.label || ''
  })
  const [showSpeakerResults, setShowSpeakerResults] = useState(false)
  const [syncDiscord, setSyncDiscord] = useState(canSyncDiscord)
  const [visibility, setVisibility] = useState('public')

  const filteredSpeakers = useMemo(() => {
    const query = speakerQuery.trim().toLowerCase()
    const matches = query
      ? speakers.filter((speaker) => speaker.label.toLowerCase().includes(query))
      : speakers

    return matches.slice(0, 8)
  }, [speakerQuery, speakers])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const body = {
      durationMinutes,
      joinURL: String(formData.get('joinURL') || ''),
      locationLabel: String(formData.get('locationLabel') || ''),
      sessionType,
      speaker: speakerID,
      startsAt: toISODateTime(String(formData.get('startsAt') || '')),
      summary: String(formData.get('summary') || ''),
      syncDiscord,
      title: String(formData.get('title') || ''),
      visibility,
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
    <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="title" label="Title">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            id="title"
            name="title"
            placeholder="Cohort demo session"
            required
          />
        </Field>
        <Field className="sm:col-span-2" label="Type">
          <SegmentedGrid className="grid-cols-2 sm:grid-cols-5">
            {sessionTypes.map(([value, label]) => (
              <SquareOption
                isSelected={sessionType === value}
                key={value}
                label={label}
                onClick={() => setSessionType(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
        <Field htmlFor="startsAt" label="Start time">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35 font-mono text-xs uppercase accent-primary"
            defaultValue={defaultStart}
            id="startsAt"
            name="startsAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field label="Duration">
          <SegmentedGrid>
            {durations.map(([value, label]) => (
              <SquareOption
                isSelected={durationMinutes === value}
                key={value}
                label={label}
                onClick={() => setDurationMinutes(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
        <Field className="sm:col-span-2" htmlFor="speakerSearch" label="Speaker">
          <div className="relative">
            <input name="speaker" type="hidden" value={speakerID} />
            <Input
              autoComplete="off"
              className="h-12 border-scroll-100/25 bg-card/35"
              id="speakerSearch"
              onBlur={() => window.setTimeout(() => setShowSpeakerResults(false), 120)}
              onChange={(event) => {
                setSpeakerQuery(event.target.value)
                setSpeakerID('')
                setShowSpeakerResults(true)
              }}
              onFocus={() => setShowSpeakerResults(true)}
              placeholder="Search speaker"
              value={speakerQuery}
            />
            {showSpeakerResults ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-56 overflow-y-auto border border-border bg-neutral-black shadow-xl">
                <button
                  className="block w-full border-b border-border px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSpeakerID('')
                    setSpeakerQuery('')
                    setShowSpeakerResults(false)
                  }}
                  type="button"
                >
                  No speaker
                </button>
                {filteredSpeakers.map((speaker) => (
                  <button
                    className="block w-full border-b border-border px-3 py-3 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-card/70 hover:text-primary"
                    key={speaker.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSpeakerID(String(speaker.id))
                      setSpeakerQuery(speaker.label)
                      setShowSpeakerResults(false)
                    }}
                    type="button"
                  >
                    {speaker.label}
                  </button>
                ))}
                {!filteredSpeakers.length ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">No matching speakers.</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </Field>
        <Field className="sm:col-span-2" label="Visibility">
          <SegmentedGrid className="sm:grid-cols-3">
            {visibilityOptions.map(([value, label]) => (
              <SquareOption
                isSelected={visibility === value}
                key={value}
                label={label}
                onClick={() => setVisibility(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
      </div>
      <Field htmlFor="summary" label="Summary">
        <Textarea
          className="min-h-28 border-scroll-100/25 bg-card/35"
          id="summary"
          name="summary"
          placeholder="What will happen in this session?"
          rows={4}
        />
      </Field>
      <details className="border border-border bg-card/20">
        <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary">
          Advanced
        </summary>
        <div className="grid gap-5 border-t border-border p-4 sm:grid-cols-2">
          <Field htmlFor="locationLabel" label="Location label">
            <Input
              className="h-12 border-scroll-100/25 bg-background/70"
              id="locationLabel"
              name="locationLabel"
              placeholder="Discord #cohort-voice"
            />
          </Field>
          <Field htmlFor="joinURL" label="Join URL">
            <Input
              className="h-12 border-scroll-100/25 bg-background/70"
              id="joinURL"
              name="joinURL"
              placeholder="https://..."
              type="url"
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-muted-foreground sm:col-span-2">
            <input
              checked={syncDiscord}
              className="mt-1 accent-primary"
              disabled={!canSyncDiscord}
              onChange={(event) => setSyncDiscord(event.target.checked)}
              type="checkbox"
            />
            <span>
              Create Discord scheduled event
              {!canSyncDiscord ? ' (bot credentials not configured)' : ''}
            </span>
          </label>
        </div>
      </details>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button className="h-12 w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create session'}
        </Button>
      </div>
    </form>
  )
}

const Field: React.FC<{
  children: React.ReactNode
  className?: string
  htmlFor?: string
  label: string
}> = ({ children, className, htmlFor, label }) => (
  <div className={cn('grid gap-2', className)}>
    <Label
      className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
      htmlFor={htmlFor}
    >
      {label}
    </Label>
    {children}
  </div>
)

const SegmentedGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('grid grid-cols-2 gap-2', className)}>{children}</div>

const SquareOption: React.FC<{
  isSelected: boolean
  label: string
  onClick: () => void
}> = ({ isSelected, label, onClick }) => (
  <button
    aria-pressed={isSelected}
    className={cn(
      'flex h-12 items-center justify-center border px-3 text-center font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      isSelected
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-card/35 text-muted-foreground hover:border-primary hover:text-primary',
    )}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
)

const toISODateTime = (value: string): string => {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString()
}
