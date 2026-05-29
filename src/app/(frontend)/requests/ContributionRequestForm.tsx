'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContributionRequest } from '@/payload-types'
import { cn } from '@/utilities/cn'

export type RequestRelationOption = {
  id: number | string
  href?: string
  label: string
}

type RequestFormValue = {
  body?: string | null
  id?: number | string
  project?: number | string | null
  owner?: number | string | null
  relatedEvents?: (number | string)[]
  relatedPosts?: (number | string)[]
  relatedProfiles?: (number | string)[]
  relatedThreads?: (number | string)[]
  profileSkills?: (number | string)[]
  requestStatus?: ContributionRequest['requestStatus']
  requestType?: ContributionRequest['requestType']
  responseURL?: string | null
  slug?: string | null
  summary?: string | null
  title?: string | null
  visibility?: ContributionRequest['visibility']
}

type Props = {
  canPublish: boolean
  defaultOwnerID?: number | string | null
  events: RequestRelationOption[]
  initialValue?: RequestFormValue | null
  mode: 'create' | 'edit'
  posts: RequestRelationOption[]
  profiles: RequestRelationOption[]
  projects: RequestRelationOption[]
  stewardedProjectIDs?: (number | string)[]
  skills: RequestRelationOption[]
  threads: RequestRelationOption[]
}

const requestTypes = [
  ['good_first_contribution', 'Good first'],
  ['help_wanted', 'Help wanted'],
  ['review', 'Review'],
  ['feedback', 'Feedback'],
  ['collaborator', 'Collaborator'],
  ['resource', 'Resource'],
] as const

const requestStatuses = [
  ['open', 'Open'],
  ['in_discussion', 'Discussing'],
  ['filled', 'Filled'],
  ['paused', 'Paused'],
  ['archived', 'Archived'],
] as const

const visibilityOptions = [
  ['public', 'Public'],
  ['authenticated', 'Portal'],
  ['member', 'Members'],
  ['admin', 'Admin'],
] as const

export const ContributionRequestForm: React.FC<Props> = ({
  canPublish,
  defaultOwnerID,
  events,
  initialValue,
  mode,
  posts,
  profiles,
  projects,
  stewardedProjectIDs = [],
  skills,
  threads,
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectID, setProjectID] = useState<string[]>(toIDs(initialValue?.project))
  const [eventIDs, setEventIDs] = useState<string[]>(toIDs(initialValue?.relatedEvents))
  const [postIDs, setPostIDs] = useState<string[]>(toIDs(initialValue?.relatedPosts))
  const [profileIDs, setProfileIDs] = useState<string[]>(toIDs(initialValue?.relatedProfiles))
  const [threadIDs, setThreadIDs] = useState<string[]>(toIDs(initialValue?.relatedThreads))
  const [skillIDs, setSkillIDs] = useState<string[]>(toIDs(initialValue?.profileSkills))
  const [ownerID, setOwnerID] = useState<string[]>(
    toIDs(initialValue?.owner || defaultOwnerID || null),
  )
  const [projectQuery, setProjectQuery] = useState('')
  const [eventQuery, setEventQuery] = useState('')
  const [postQuery, setPostQuery] = useState('')
  const [profileQuery, setProfileQuery] = useState('')
  const [threadQuery, setThreadQuery] = useState('')
  const [skillQuery, setSkillQuery] = useState('')
  const [ownerQuery, setOwnerQuery] = useState('')
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState(initialValue?.requestStatus || 'open')
  const [requestType, setRequestType] = useState(initialValue?.requestType || 'help_wanted')
  const [visibility, setVisibility] = useState(initialValue?.visibility || 'public')
  const effectiveCanPublish =
    canPublish || isSelectedProjectStewarded(projectID[0], stewardedProjectIDs)
  const [publishNow, setPublishNow] = useState(effectiveCanPublish)

  useEffect(() => {
    if (mode === 'create' && effectiveCanPublish) {
      setPublishNow(true)
    }
  }, [effectiveCanPublish, mode])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const owner = ownerID[0]
    const project = projectID[0]
    const payload = {
      body: String(formData.get('body') || ''),
      owner,
      profileSkills: skillIDs,
      project: project || null,
      relatedEvents: eventIDs,
      relatedPosts: postIDs,
      relatedProfiles: profileIDs,
      relatedThreads: threadIDs,
      requestStatus,
      requestType,
      responseURL: String(formData.get('responseURL') || ''),
      summary: String(formData.get('summary') || ''),
      title: String(formData.get('title') || ''),
      visibility,
      ...(mode === 'create'
        ? { _status: effectiveCanPublish && publishNow ? 'published' : 'draft' }
        : {}),
    }

    if (!owner) {
      setError('Select an owner profile before saving.')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(
        mode === 'create'
          ? '/api/contributionRequests'
          : `/api/contributionRequests/${initialValue?.id}`,
        {
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
          method: mode === 'create' ? 'POST' : 'PATCH',
        },
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message || 'Unable to save contribution request.')
      }

      const data = await response.json()
      const doc = data.doc || data
      const slug = doc.slug || initialValue?.slug
      const isPublished = doc._status === 'published'

      if (isPublished && slug) {
        router.push(`/requests/${slug}`)
      } else if (project) {
        const selectedProject = projects.find((option) => String(option.id) === project)
        router.push(selectedProject?.href || '/projects')
      } else {
        router.push('/projects')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save contribution request.')
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
            defaultValue={initialValue?.title || ''}
            id="title"
            name="title"
            placeholder="Help polish the session notes"
            required
          />
        </Field>
        <Field label="Owner">
          <RelationTypeahead
            emptyLabel="No owner selected"
            filteredOptions={useRelationFilter(profiles, ownerID, ownerQuery)}
            inputID="ownerSearch"
            maxSelected={1}
            noSelectionLabel="No owner"
            onAdd={(option) => setOwnerID([String(option.id)])}
            onClear={() => setOwnerID([])}
            onQueryChange={setOwnerQuery}
            onRemove={() => setOwnerID([])}
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'owner' : null)}
            placeholder="Search owner"
            query={ownerQuery}
            selectedOptions={useSelectedRelations(profiles, ownerID)}
            showResults={openPicker === 'owner'}
          />
        </Field>
      </div>

      <Field htmlFor="summary" label="Summary">
        <Textarea
          className="min-h-24 border-scroll-100/25 bg-card/35"
          defaultValue={initialValue?.summary || ''}
          id="summary"
          name="summary"
          placeholder="What help is needed and what would make this successful?"
          required
          rows={3}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <SegmentedGrid className="grid-cols-2 lg:grid-cols-3">
            {requestTypes.map(([value, label]) => (
              <SquareOption
                isSelected={requestType === value}
                key={value}
                label={label}
                onClick={() => setRequestType(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
        <Field label="Visibility">
          <SegmentedGrid className="grid-cols-2">
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
        <Field className="sm:col-span-2" label="Status">
          <SegmentedGrid className="grid-cols-2 sm:grid-cols-5">
            {requestStatuses.map(([value, label]) => (
              <SquareOption
                isSelected={requestStatus === value}
                key={value}
                label={label}
                onClick={() => setRequestStatus(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
      </div>

      <Field htmlFor="body" label="Context">
        <Textarea
          className="min-h-32 border-scroll-100/25 bg-card/35"
          defaultValue={initialValue?.body || ''}
          id="body"
          name="body"
          placeholder="Add constraints, links, background, and response instructions."
          rows={5}
        />
      </Field>

      <details className="border border-border bg-card/20" open={mode === 'edit'}>
        <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-primary">
          Related context
        </summary>
        <div className="grid gap-5 border-t border-border p-4 sm:grid-cols-2">
          <RelationField
            emptyLabel="No project selected"
            filteredOptions={useRelationFilter(projects, projectID, projectQuery)}
            inputID="projectSearch"
            label="Project"
            maxSelected={1}
            noSelectionLabel="No project"
            onAdd={(option) => setProjectID([String(option.id)])}
            onClear={() => setProjectID([])}
            onQueryChange={setProjectQuery}
            onRemove={() => setProjectID([])}
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'project' : null)}
            placeholder="Search project"
            query={projectQuery}
            selectedOptions={useSelectedRelations(projects, projectID)}
            showResults={openPicker === 'project'}
          />
          <RelationField
            emptyLabel="No skills selected"
            filteredOptions={useRelationFilter(skills, skillIDs, skillQuery)}
            inputID="skillSearch"
            label="Useful skills"
            noSelectionLabel="No skills"
            onAdd={(option) => setSkillIDs((current) => [...current, String(option.id)])}
            onClear={() => setSkillIDs([])}
            onQueryChange={setSkillQuery}
            onRemove={(option) =>
              setSkillIDs((current) => current.filter((id) => id !== String(option.id)))
            }
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'skills' : null)}
            placeholder="Search skill"
            query={skillQuery}
            selectedOptions={useSelectedRelations(skills, skillIDs)}
            showResults={openPicker === 'skills'}
          />
          <RelationField
            emptyLabel="No sessions selected"
            filteredOptions={useRelationFilter(events, eventIDs, eventQuery)}
            inputID="eventSearch"
            label="Related sessions"
            noSelectionLabel="No sessions"
            onAdd={(option) => setEventIDs((current) => [...current, String(option.id)])}
            onClear={() => setEventIDs([])}
            onQueryChange={setEventQuery}
            onRemove={(option) =>
              setEventIDs((current) => current.filter((id) => id !== String(option.id)))
            }
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'events' : null)}
            placeholder="Search session"
            query={eventQuery}
            selectedOptions={useSelectedRelations(events, eventIDs)}
            showResults={openPicker === 'events'}
          />
          <RelationField
            emptyLabel="No threads selected"
            filteredOptions={useRelationFilter(threads, threadIDs, threadQuery)}
            inputID="threadSearch"
            label="Related threads"
            noSelectionLabel="No threads"
            onAdd={(option) => setThreadIDs((current) => [...current, String(option.id)])}
            onClear={() => setThreadIDs([])}
            onQueryChange={setThreadQuery}
            onRemove={(option) =>
              setThreadIDs((current) => current.filter((id) => id !== String(option.id)))
            }
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'threads' : null)}
            placeholder="Search thread"
            query={threadQuery}
            selectedOptions={useSelectedRelations(threads, threadIDs)}
            showResults={openPicker === 'threads'}
          />
          <RelationField
            emptyLabel="No posts selected"
            filteredOptions={useRelationFilter(posts, postIDs, postQuery)}
            inputID="postSearch"
            label="Related posts"
            noSelectionLabel="No posts"
            onAdd={(option) => setPostIDs((current) => [...current, String(option.id)])}
            onClear={() => setPostIDs([])}
            onQueryChange={setPostQuery}
            onRemove={(option) =>
              setPostIDs((current) => current.filter((id) => id !== String(option.id)))
            }
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'posts' : null)}
            placeholder="Search post"
            query={postQuery}
            selectedOptions={useSelectedRelations(posts, postIDs)}
            showResults={openPicker === 'posts'}
          />
          <RelationField
            emptyLabel="No profiles selected"
            filteredOptions={useRelationFilter(profiles, profileIDs, profileQuery)}
            inputID="profileSearch"
            label="Related people"
            noSelectionLabel="No people"
            onAdd={(option) => setProfileIDs((current) => [...current, String(option.id)])}
            onClear={() => setProfileIDs([])}
            onQueryChange={setProfileQuery}
            onRemove={(option) =>
              setProfileIDs((current) => current.filter((id) => id !== String(option.id)))
            }
            onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'profiles' : null)}
            placeholder="Search person"
            query={profileQuery}
            selectedOptions={useSelectedRelations(profiles, profileIDs)}
            showResults={openPicker === 'profiles'}
          />
          <Field className="sm:col-span-2" htmlFor="responseURL" label="Response URL">
            <Input
              className="h-12 border-scroll-100/25 bg-card/35"
              defaultValue={initialValue?.responseURL || ''}
              id="responseURL"
              name="responseURL"
              placeholder="https://github.com/... or /projects/project-slug"
            />
          </Field>
        </div>
      </details>

      {effectiveCanPublish && mode === 'create' ? (
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            checked={publishNow}
            className="mt-1 accent-primary"
            onChange={(event) => setPublishNow(event.target.checked)}
            type="checkbox"
          />
          <span>Publish immediately</span>
        </label>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <Button className="h-12 w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create request' : 'Save request'}
        </Button>
        {!effectiveCanPublish && mode === 'create' ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Contributor requests are saved as drafts for editor review.
          </p>
        ) : null}
      </div>
    </form>
  )
}

export const Field: React.FC<{
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

export const RelationField: React.FC<
  React.ComponentProps<typeof RelationTypeahead> & { label: string }
> = ({ label, ...props }) => (
  <Field htmlFor={props.inputID} label={label}>
    <RelationTypeahead {...props} />
  </Field>
)

export const RelationTypeahead: React.FC<{
  emptyLabel: string
  filteredOptions: RequestRelationOption[]
  inputID: string
  maxSelected?: number
  noSelectionLabel: string
  onAdd: (option: RequestRelationOption) => void
  onClear: () => void
  onQueryChange: (query: string) => void
  onRemove: (option: RequestRelationOption) => void
  onResultsOpenChange: (isOpen: boolean) => void
  placeholder: string
  query: string
  selectedOptions: RequestRelationOption[]
  showResults: boolean
}> = ({
  emptyLabel,
  filteredOptions,
  inputID,
  maxSelected,
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
  <RelationTypeaheadInner
    emptyLabel={emptyLabel}
    filteredOptions={filteredOptions}
    inputID={inputID}
    maxSelected={maxSelected}
    noSelectionLabel={noSelectionLabel}
    onAdd={onAdd}
    onClear={onClear}
    onQueryChange={onQueryChange}
    onRemove={onRemove}
    onResultsOpenChange={onResultsOpenChange}
    placeholder={placeholder}
    query={query}
    selectedOptions={selectedOptions}
    showResults={showResults}
  />
)

const RelationTypeaheadInner: React.FC<React.ComponentProps<typeof RelationTypeahead>> = ({
  emptyLabel,
  filteredOptions,
  inputID,
  maxSelected,
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget

    if (nextTarget instanceof Node && containerRef.current?.contains(nextTarget)) {
      return
    }

    window.setTimeout(() => {
      if (containerRef.current?.contains(document.activeElement)) return
      onResultsOpenChange(false)
    }, 120)
  }

  return (
    <div className="relative" ref={containerRef}>
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
        disabled={Boolean(maxSelected && selectedOptions.length >= maxSelected)}
        id={inputID}
        onBlur={handleBlur}
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
                onResultsOpenChange(!maxSelected || selectedOptions.length + 1 < maxSelected)
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
}

export const SegmentedGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('grid grid-cols-2 gap-2', className)}>{children}</div>

export const SquareOption: React.FC<{
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

export const useRelationFilter = (
  options: RequestRelationOption[],
  selectedIDs: string[],
  query: string,
): RequestRelationOption[] =>
  useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const selected = new Set(selectedIDs)
    const available = options.filter((option) => !selected.has(String(option.id)))
    const matches = normalizedQuery
      ? available.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      : available

    return matches.slice(0, 8)
  }, [options, query, selectedIDs])

export const useSelectedRelations = (
  options: RequestRelationOption[],
  selectedIDs: string[],
): RequestRelationOption[] =>
  useMemo(() => {
    const selected = new Set(selectedIDs)

    return options.filter((option) => selected.has(String(option.id)))
  }, [options, selectedIDs])

const toIDs = (value?: (number | string)[] | number | string | null): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)

  return [String(value)]
}

const isSelectedProjectStewarded = (
  selectedProjectID: string | undefined,
  stewardedProjectIDs: (number | string)[],
) => {
  if (!selectedProjectID) return false

  return stewardedProjectIDs.map(String).includes(selectedProjectID)
}
