'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/cn'

export type RelationOption = {
  id: number | string
  label: string
}

type SessionCreateFormProps = {
  canSyncDiscord: boolean
  defaultHostID?: number | string | null
  defaultStart: string
  minStart: string
  projects: RelationOption[]
  profileOptions: RelationOption[]
  threads: RelationOption[]
}

const sessionTypes = [
  ['fireside', 'Fireside'],
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
  ['authenticated', 'Portal'],
  ['member', 'Members'],
] as const

const recurrenceCadences = [
  ['weekly', 'Weekly'],
  ['biweekly', 'Every 2 weeks'],
  ['monthly', 'Monthly'],
] as const

export const SessionCreateForm: React.FC<SessionCreateFormProps> = ({
  canSyncDiscord,
  defaultHostID,
  defaultStart,
  minStart,
  profileOptions,
  projects,
  threads,
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [minimumStart, setMinimumStart] = useState(minStart)
  const [startValue, setStartValue] = useState(defaultStart)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceCadence, setRecurrenceCadence] = useState('weekly')
  const [sessionType, setSessionType] = useState('brownbag')
  const [guestIDs, setGuestIDs] = useState<string[]>([])
  const [guestQuery, setGuestQuery] = useState('')
  const [showGuestResults, setShowGuestResults] = useState(false)
  const [hostIDs, setHostIDs] = useState<string[]>(() =>
    defaultHostID ? [String(defaultHostID)] : [],
  )
  const [hostQuery, setHostQuery] = useState('')
  const [showHostResults, setShowHostResults] = useState(false)
  const [projectIDs, setProjectIDs] = useState<string[]>([])
  const [projectQuery, setProjectQuery] = useState('')
  const [showProjectResults, setShowProjectResults] = useState(false)
  const [syncDiscord, setSyncDiscord] = useState(canSyncDiscord)
  const [threadIDs, setThreadIDs] = useState<string[]>([])
  const [threadQuery, setThreadQuery] = useState('')
  const [showThreadResults, setShowThreadResults] = useState(false)
  const [visibility, setVisibility] = useState('public')

  const filteredGuests = useRelationFilter(profileOptions, guestIDs, guestQuery)
  const filteredHosts = useRelationFilter(profileOptions, hostIDs, hostQuery)
  const filteredProjects = useRelationFilter(projects, projectIDs, projectQuery)
  const filteredThreads = useRelationFilter(threads, threadIDs, threadQuery)

  const selectedGuests = useSelectedRelations(profileOptions, guestIDs)
  const selectedHosts = useSelectedRelations(profileOptions, hostIDs)
  const selectedProjects = useSelectedRelations(projects, projectIDs)
  const selectedThreads = useSelectedRelations(threads, threadIDs)

  useEffect(() => {
    setMinimumStart(getBrowserMinimumStart())
    setStartValue(getBrowserDefaultStart())
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const body = {
      durationMinutes,
      joinURL: String(formData.get('joinURL') || ''),
      locationLabel: String(formData.get('locationLabel') || ''),
      recurrenceCadence: isRecurring ? recurrenceCadence : '',
      recurrenceUntil: isRecurring ? String(formData.get('recurrenceUntil') || '') : '',
      guests: guestIDs,
      hosts: hostIDs,
      relatedProjects: projectIDs,
      relatedThreads: threadIDs,
      sessionType,
      seriesKey: isRecurring ? String(formData.get('seriesKey') || '') : '',
      seriesTitle: isRecurring ? String(formData.get('seriesTitle') || '') : '',
      speaker: guestIDs[0] || hostIDs[0] || '',
      speakers: guestIDs,
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
        <Field htmlFor="startsAt" label="Start time">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35 font-mono text-xs uppercase accent-primary"
            id="startsAt"
            min={minimumStart}
            name="startsAt"
            onChange={(event) => setStartValue(event.target.value)}
            required
            type="datetime-local"
            value={startValue}
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
        <Field label="Visibility">
          <SegmentedGrid className="grid-cols-3">
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
        <Field className="sm:col-span-2" label="Type">
          <SegmentedGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
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
        <Field className="sm:col-span-2" htmlFor="hostSearch" label="Host(s)">
          <RelationTypeahead
            emptyLabel="No hosts selected"
            filteredOptions={filteredHosts}
            inputID="hostSearch"
            noSelectionLabel="No host"
            onAdd={(option) => setHostIDs((current) => [...current, String(option.id)])}
            onClear={() => setHostIDs([])}
            onQueryChange={setHostQuery}
            onRemove={(option) =>
              setHostIDs((current) => current.filter((hostID) => hostID !== String(option.id)))
            }
            onResultsOpenChange={setShowHostResults}
            placeholder="Search host"
            query={hostQuery}
            selectedOptions={selectedHosts}
            showResults={showHostResults}
          />
        </Field>
        <Field className="sm:col-span-2" htmlFor="guestSearch" label="Guest(s)">
          <RelationTypeahead
            emptyLabel="No guests selected"
            filteredOptions={filteredGuests}
            inputID="guestSearch"
            noSelectionLabel="No guest"
            onAdd={(option) => setGuestIDs((current) => [...current, String(option.id)])}
            onClear={() => setGuestIDs([])}
            onQueryChange={setGuestQuery}
            onRemove={(option) =>
              setGuestIDs((current) => current.filter((guestID) => guestID !== String(option.id)))
            }
            onResultsOpenChange={setShowGuestResults}
            placeholder="Search guest"
            query={guestQuery}
            selectedOptions={selectedGuests}
            showResults={showGuestResults}
          />
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
          <Field htmlFor="relatedProjectSearch" label="Related projects">
            <RelationTypeahead
              emptyLabel="No projects selected"
              filteredOptions={filteredProjects}
              inputID="relatedProjectSearch"
              noSelectionLabel="No project"
              onAdd={(option) => setProjectIDs((current) => [...current, String(option.id)])}
              onClear={() => setProjectIDs([])}
              onQueryChange={setProjectQuery}
              onRemove={(option) =>
                setProjectIDs((current) =>
                  current.filter((projectID) => projectID !== String(option.id)),
                )
              }
              onResultsOpenChange={setShowProjectResults}
              placeholder="Search project"
              query={projectQuery}
              selectedOptions={selectedProjects}
              showResults={showProjectResults}
            />
          </Field>
          <Field htmlFor="relatedThreadSearch" label="Related threads">
            <RelationTypeahead
              emptyLabel="No threads selected"
              filteredOptions={filteredThreads}
              inputID="relatedThreadSearch"
              noSelectionLabel="No thread"
              onAdd={(option) => setThreadIDs((current) => [...current, String(option.id)])}
              onClear={() => setThreadIDs([])}
              onQueryChange={setThreadQuery}
              onRemove={(option) =>
                setThreadIDs((current) =>
                  current.filter((threadID) => threadID !== String(option.id)),
                )
              }
              onResultsOpenChange={setShowThreadResults}
              placeholder="Search thread"
              query={threadQuery}
              selectedOptions={selectedThreads}
              showResults={showThreadResults}
            />
          </Field>
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
              placeholder="Discord event URL, channel link, or meeting link"
              type="url"
            />
          </Field>
          <div className="grid gap-4 border border-border bg-background/40 p-4 sm:col-span-2">
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                checked={isRecurring}
                className="mt-1 accent-primary"
                onChange={(event) => setIsRecurring(event.target.checked)}
                type="checkbox"
              />
              <span>Part of a recurring session series</span>
            </label>
            {isRecurring ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field htmlFor="seriesKey" label="Series key">
                  <Input
                    className="h-12 border-scroll-100/25 bg-background/70"
                    id="seriesKey"
                    name="seriesKey"
                    placeholder="weekly-all-hands"
                    required={isRecurring}
                  />
                </Field>
                <Field htmlFor="seriesTitle" label="Series title">
                  <Input
                    className="h-12 border-scroll-100/25 bg-background/70"
                    id="seriesTitle"
                    name="seriesTitle"
                    placeholder="Weekly All Hands"
                  />
                </Field>
                <Field className="sm:col-span-2" label="Cadence">
                  <SegmentedGrid className="grid-cols-1 sm:grid-cols-3">
                    {recurrenceCadences.map(([value, label]) => (
                      <SquareOption
                        isSelected={recurrenceCadence === value}
                        key={value}
                        label={label}
                        onClick={() => setRecurrenceCadence(value)}
                      />
                    ))}
                  </SegmentedGrid>
                </Field>
                <Field htmlFor="recurrenceUntil" label="End date">
                  <Input
                    className="h-12 border-scroll-100/25 bg-background/70 font-mono text-xs uppercase accent-primary"
                    id="recurrenceUntil"
                    name="recurrenceUntil"
                    type="date"
                  />
                </Field>
              </div>
            ) : null}
          </div>
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

const RelationTypeahead: React.FC<{
  emptyLabel: string
  filteredOptions: RelationOption[]
  inputID: string
  noSelectionLabel: string
  onAdd: (option: RelationOption) => void
  onClear: () => void
  onQueryChange: (query: string) => void
  onRemove: (option: RelationOption) => void
  onResultsOpenChange: (isOpen: boolean) => void
  placeholder: string
  query: string
  selectedOptions: RelationOption[]
  showResults: boolean
}> = ({
  emptyLabel,
  filteredOptions,
  inputID,
  noSelectionLabel,
  onAdd,
  onClear,
  onQueryChange,
  onRemove,
  onResultsOpenChange,
  placeholder,
  query,
  selectedOptions,
  showResults,
}) => (
  <div className="relative">
    <div className="mb-2 flex min-h-10 flex-wrap gap-2">
      {selectedOptions.length ? (
        selectedOptions.map((option) => (
          <button
            className="border border-primary/60 bg-primary/20 px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            key={option.id}
            onClick={() => onRemove(option)}
            type="button"
          >
            {option.label} x
          </button>
        ))
      ) : (
        <p className="flex items-center text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
    <Input
      autoComplete="off"
      className="h-12 border-scroll-100/25 bg-card/35"
      id={inputID}
      onBlur={() => window.setTimeout(() => onResultsOpenChange(false), 120)}
      onChange={(event) => {
        onQueryChange(event.target.value)
        onResultsOpenChange(true)
      }}
      onFocus={() => onResultsOpenChange(true)}
      placeholder={placeholder}
      value={query}
    />
    {showResults ? (
      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-56 overflow-y-auto border border-border bg-neutral-black shadow-xl">
        <button
          className="block w-full border-b border-border px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onClear()
            onQueryChange('')
            onResultsOpenChange(false)
          }}
          type="button"
        >
          {noSelectionLabel}
        </button>
        {filteredOptions.map((option) => (
          <button
            className="block w-full border-b border-border px-3 py-3 text-left text-sm text-foreground transition-colors last:border-b-0 hover:bg-card/70 hover:text-primary"
            key={option.id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onAdd(option)
              onQueryChange('')
              onResultsOpenChange(true)
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
        {!filteredOptions.length ? (
          <p className="px-3 py-3 text-sm text-muted-foreground">No matching results.</p>
        ) : null}
      </div>
    ) : null}
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

const useRelationFilter = (
  options: RelationOption[],
  selectedIDs: string[],
  query: string,
): RelationOption[] =>
  useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const selected = new Set(selectedIDs)
    const available = options.filter((option) => !selected.has(String(option.id)))
    const matches = normalizedQuery
      ? available.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      : available

    return matches.slice(0, 8)
  }, [options, query, selectedIDs])

const useSelectedRelations = (options: RelationOption[], selectedIDs: string[]): RelationOption[] =>
  useMemo(() => {
    const selected = new Set(selectedIDs)

    return options.filter((option) => selected.has(String(option.id)))
  }, [options, selectedIDs])

const getBrowserDefaultStart = (): string => {
  const date = new Date()
  date.setHours(date.getHours() + 1)
  date.setMinutes(date.getMinutes() < 30 ? 30 : 0, 0, 0)

  if (date.getMinutes() === 0) {
    date.setHours(date.getHours() + 1)
  }

  return toDateTimeLocalValue(date)
}

const getBrowserMinimumStart = (): string => {
  const date = new Date()
  date.setSeconds(0, 0)

  return toDateTimeLocalValue(date)
}

const toDateTimeLocalValue = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)

  return local.toISOString().slice(0, 16)
}

const toISODateTime = (value: string): string => {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toISOString()
}
