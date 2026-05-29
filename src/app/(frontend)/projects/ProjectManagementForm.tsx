'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import {
  Field,
  RelationField,
  SegmentedGrid,
  SquareOption,
  type RequestRelationOption,
  useRelationFilter,
  useSelectedRelations,
} from '@/app/(frontend)/requests/ContributionRequestForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Project } from '@/payload-types'

type LinkRow = {
  id?: string | null
  label?: string | null
  resourceType?: string | null
  url?: string | null
}

export type ProjectManagementValue = {
  contributors?: (number | string)[]
  events?: (number | string)[]
  id: number | string
  links?: LinkRow[]
  primaryCTA?: Project['primaryCTA']
  projectStatus?: Project['projectStatus']
  relatedProjects?: (number | string)[]
  resources?: LinkRow[]
  slug?: string | null
  summary?: string | null
  threads?: (number | string)[]
  title?: string | null
  visibility?: Project['visibility']
}

type Props = {
  contributors: RequestRelationOption[]
  events: RequestRelationOption[]
  initialValue: ProjectManagementValue
  projects: RequestRelationOption[]
  threads: RequestRelationOption[]
}

const projectStatuses = [
  ['active', 'Active'],
  ['building', 'Building'],
  ['shipping', 'Shipping'],
  ['exploratory', 'Exploring'],
  ['archived', 'Archived'],
] as const

const visibilityOptions = [
  ['public', 'Public'],
  ['authenticated', 'Portal'],
  ['member', 'Members'],
  ['admin', 'Admin'],
] as const

const resourceTypes = ['link', 'repo', 'design', 'doc', 'calendar', 'discord'] as const

export const ProjectManagementForm: React.FC<Props> = ({
  contributors,
  events,
  initialValue,
  projects,
  threads,
}) => {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectStatus, setProjectStatus] = useState(initialValue.projectStatus || 'active')
  const [visibility, setVisibility] = useState(initialValue.visibility || 'public')
  const [contributorIDs, setContributorIDs] = useState<string[]>(toIDs(initialValue.contributors))
  const [relatedProjectIDs, setRelatedProjectIDs] = useState<string[]>(
    toIDs(initialValue.relatedProjects),
  )
  const [eventIDs, setEventIDs] = useState<string[]>(toIDs(initialValue.events))
  const [threadIDs, setThreadIDs] = useState<string[]>(toIDs(initialValue.threads))
  const [contributorQuery, setContributorQuery] = useState('')
  const [projectQuery, setProjectQuery] = useState('')
  const [eventQuery, setEventQuery] = useState('')
  const [threadQuery, setThreadQuery] = useState('')
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const [resources, setResources] = useState<LinkRow[]>(
    initialValue.resources?.length ? initialValue.resources : [emptyResource()],
  )
  const [links, setLinks] = useState<LinkRow[]>(
    initialValue.links?.length ? initialValue.links : [emptyLink()],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = {
      contributors: normalizeIDs(contributorIDs),
      events: normalizeIDs(eventIDs),
      links: cleanLinks(links),
      primaryCTA: {
        label: String(formData.get('primaryCTALabel') || ''),
        url: String(formData.get('primaryCTAURL') || ''),
      },
      projectStatus,
      relatedProjects: normalizeIDs(relatedProjectIDs),
      resources: cleanLinks(resources),
      summary: String(formData.get('summary') || ''),
      threads: normalizeIDs(threadIDs),
      title: String(formData.get('title') || ''),
      visibility,
    }

    try {
      const response = await fetch(`/api/projects/${initialValue.id}`, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(data?.message || 'Unable to save project.')
      }

      router.push(initialValue.slug ? `/projects/${initialValue.slug}` : '/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="title" label="Title">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            defaultValue={initialValue.title || ''}
            id="title"
            name="title"
            required
          />
        </Field>
        <Field label="Status">
          <SegmentedGrid className="grid-cols-2 lg:grid-cols-3">
            {projectStatuses.map(([value, label]) => (
              <SquareOption
                isSelected={projectStatus === value}
                key={value}
                label={label}
                onClick={() => setProjectStatus(value)}
              />
            ))}
          </SegmentedGrid>
        </Field>
      </div>

      <Field htmlFor="summary" label="Summary">
        <Textarea
          className="min-h-24 border-scroll-100/25 bg-card/35"
          defaultValue={initialValue.summary || ''}
          id="summary"
          name="summary"
          required
          rows={3}
        />
      </Field>

      <Field label="Visibility">
        <SegmentedGrid className="grid-cols-2 md:grid-cols-4">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="primaryCTALabel" label="Primary CTA label">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            defaultValue={initialValue.primaryCTA?.label || ''}
            id="primaryCTALabel"
            name="primaryCTALabel"
            placeholder="Open repo"
          />
        </Field>
        <Field htmlFor="primaryCTAURL" label="Primary CTA URL">
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            defaultValue={initialValue.primaryCTA?.url || ''}
            id="primaryCTAURL"
            name="primaryCTAURL"
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <RelationField
          emptyLabel="No contributors selected"
          filteredOptions={useRelationFilter(contributors, contributorIDs, contributorQuery)}
          inputID="projectContributors"
          label="Contributors"
          noSelectionLabel="No contributors"
          onAdd={(option) => setContributorIDs((current) => [...current, String(option.id)])}
          onClear={() => setContributorIDs([])}
          onQueryChange={setContributorQuery}
          onRemove={(option) =>
            setContributorIDs((current) => current.filter((id) => id !== String(option.id)))
          }
          onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'contributors' : null)}
          placeholder="Search contributor"
          query={contributorQuery}
          selectedOptions={useSelectedRelations(contributors, contributorIDs)}
          showResults={openPicker === 'contributors'}
        />
        <RelationField
          emptyLabel="No related projects selected"
          filteredOptions={useRelationFilter(projects, relatedProjectIDs, projectQuery)}
          inputID="relatedProjects"
          label="Related projects"
          noSelectionLabel="No related projects"
          onAdd={(option) => setRelatedProjectIDs((current) => [...current, String(option.id)])}
          onClear={() => setRelatedProjectIDs([])}
          onQueryChange={setProjectQuery}
          onRemove={(option) =>
            setRelatedProjectIDs((current) => current.filter((id) => id !== String(option.id)))
          }
          onResultsOpenChange={(isOpen) => setOpenPicker(isOpen ? 'projects' : null)}
          placeholder="Search project"
          query={projectQuery}
          selectedOptions={useSelectedRelations(projects, relatedProjectIDs)}
          showResults={openPicker === 'projects'}
        />
        <RelationField
          emptyLabel="No sessions selected"
          filteredOptions={useRelationFilter(events, eventIDs, eventQuery)}
          inputID="projectEvents"
          label="Sessions"
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
          inputID="projectThreads"
          label="Threads"
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
      </div>

      <LinkRows label="Resources" onChange={setResources} rows={resources} showType />
      <LinkRows label="Links" onChange={setLinks} rows={links} />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div>
        <Button className="h-12 w-full sm:w-auto" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : 'Save project'}
        </Button>
      </div>
    </form>
  )
}

const LinkRows: React.FC<{
  label: string
  onChange: (rows: LinkRow[]) => void
  rows: LinkRow[]
  showType?: boolean
}> = ({ label, onChange, rows, showType }) => (
  <section className="grid gap-3">
    <div className="flex items-center justify-between gap-3">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <button
        className="portal-link text-sm"
        onClick={() => onChange([...rows, showType ? emptyResource() : emptyLink()])}
        type="button"
      >
        Add
      </button>
    </div>
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <div
          className="grid gap-3 border border-border bg-card/20 p-3 md:grid-cols-[1fr_1.4fr_auto]"
          key={index}
        >
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            onChange={(event) => updateRow(rows, onChange, index, { label: event.target.value })}
            placeholder="Label"
            value={row.label || ''}
          />
          <Input
            className="h-12 border-scroll-100/25 bg-card/35"
            onChange={(event) => updateRow(rows, onChange, index, { url: event.target.value })}
            placeholder="https://..."
            value={row.url || ''}
          />
          <div className="flex gap-2">
            {showType ? (
              <select
                className="h-12 border border-scroll-100/25 bg-card/35 px-3 text-sm"
                onChange={(event) =>
                  updateRow(rows, onChange, index, { resourceType: event.target.value })
                }
                value={row.resourceType || 'link'}
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              className="border border-border px-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
              type="button"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
)

const updateRow = (
  rows: LinkRow[],
  onChange: (rows: LinkRow[]) => void,
  index: number,
  patch: Partial<LinkRow>,
) => {
  onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
}

const cleanLinks = (rows: LinkRow[]) =>
  rows
    .map((row) => ({
      label: row.label?.trim() || '',
      resourceType: row.resourceType || undefined,
      url: row.url?.trim() || '',
    }))
    .filter((row) => row.label && row.url)

const emptyLink = (): LinkRow => ({ label: '', url: '' })

const emptyResource = (): LinkRow => ({ label: '', resourceType: 'link', url: '' })

const toIDs = (value?: (number | string)[] | number | string | null): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)

  return [String(value)]
}

const normalizeIDs = (ids: string[]) =>
  ids.map((id) => {
    const numericID = Number(id)

    return Number.isNaN(numericID) ? id : numericID
  })
