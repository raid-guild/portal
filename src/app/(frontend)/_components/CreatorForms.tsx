'use client'

import { Send } from 'lucide-react'
import React, { useState } from 'react'

import type { Profile, Project, User } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type CreatorFormsProps = {
  profile?: Profile | null
  projects: Project[]
  user: User
}

type FormStatus = {
  error?: string
  success?: string
}

const emptyStatus: FormStatus = {}

export const CreatorForms: React.FC<CreatorFormsProps> = ({ profile, projects, user }) => {
  const [projectStatus, setProjectStatus] = useState<FormStatus>(emptyStatus)
  const [sessionStatus, setSessionStatus] = useState<FormStatus>(emptyStatus)
  const [postStatus, setPostStatus] = useState<FormStatus>(emptyStatus)

  const profileID = profile?.id

  return (
    <div className="grid gap-8">
      <ScaffoldForm
        description="Create a draft project surface that can later be reviewed, expanded, and linked into briefs."
        id="project"
        onSubmit={async (formData) => {
          setProjectStatus(emptyStatus)
          const title = textValue(formData, 'title')
          const summary = textValue(formData, 'summary')

          if (!title || !summary) {
            setProjectStatus({ error: 'Project title and summary are required.' })
            return
          }

          const res = await postJSON('/api/projects', {
            _status: 'draft',
            contributors: profileID ? [profileID] : undefined,
            currentState: compactArray([textValue(formData, 'currentState')]).map((body) => ({
              body,
            })),
            lastActiveAt: new Date().toISOString(),
            links: linkArray(formData),
            projectStatus: textValue(formData, 'projectStatus') || 'exploring',
            summary,
            title,
          })

          setProjectStatus(
            res.ok
              ? { success: 'Project draft created.' }
              : { error: res.message || 'Unable to create project draft.' },
          )
        }}
        status={projectStatus}
        title="Project"
      >
        <TextField id="project-title" label="Project title" name="title" required />
        <TextAreaField id="project-summary" label="Summary" name="summary" required />
        <TextAreaField id="project-current-state" label="Current state" name="currentState" />
        <SelectField
          id="project-status"
          label="Status"
          name="projectStatus"
          options={[
            ['exploring', 'Exploring'],
            ['building', 'Building'],
            ['shipping', 'Shipping'],
            ['active', 'Active'],
          ]}
        />
        <LinkFields />
      </ScaffoldForm>

      <ScaffoldForm
        description="Create a draft session with time, join link, calendar link, and optional project scope."
        id="session"
        onSubmit={async (formData) => {
          setSessionStatus(emptyStatus)
          const title = textValue(formData, 'title')
          const startsAt = textValue(formData, 'startsAt')

          if (!title || !startsAt) {
            setSessionStatus({ error: 'Session title and start time are required.' })
            return
          }

          const relatedProject = textValue(formData, 'relatedProject')
          const res = await postJSON('/api/events', {
            _status: 'draft',
            calendarURL: textValue(formData, 'calendarURL'),
            endsAt: textValue(formData, 'endsAt') || undefined,
            joinURL: textValue(formData, 'joinURL'),
            locationLabel: textValue(formData, 'locationLabel'),
            relatedProfiles: profileID ? [profileID] : undefined,
            relatedProjects: relatedProject ? [relatedProject] : undefined,
            startsAt: new Date(startsAt).toISOString(),
            summary: textValue(formData, 'summary'),
            title,
            visibility: 'authenticated',
          })

          setSessionStatus(
            res.ok
              ? { success: 'Session draft created.' }
              : { error: res.message || 'Unable to create session draft.' },
          )
        }}
        status={sessionStatus}
        title="Session"
      >
        <TextField id="session-title" label="Session title" name="title" required />
        <TextAreaField id="session-summary" label="Summary" name="summary" />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id="session-starts-at"
            label="Starts at"
            name="startsAt"
            required
            type="datetime-local"
          />
          <TextField id="session-ends-at" label="Ends at" name="endsAt" type="datetime-local" />
        </div>
        <TextField id="session-location" label="Location" name="locationLabel" />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField id="session-join-url" label="Join URL" name="joinURL" type="url" />
          <TextField id="session-calendar-url" label="Calendar URL" name="calendarURL" type="url" />
        </div>
        <SelectField
          id="session-related-project"
          label="Scoped project"
          name="relatedProject"
          options={[
            ['', 'No project scope'],
            ...projects.map((project) => [String(project.id), project.title] as [string, string]),
          ]}
        />
      </ScaffoldForm>

      <ScaffoldForm
        description="Create a draft post from a simple title, summary, and body. Editors can polish it later."
        id="post"
        onSubmit={async (formData) => {
          setPostStatus(emptyStatus)
          const title = textValue(formData, 'title')
          const body = textValue(formData, 'body')

          if (!title || !body) {
            setPostStatus({ error: 'Post title and body are required.' })
            return
          }

          const res = await postJSON('/api/posts', {
            _status: 'draft',
            authors: [user.id],
            content: lexicalDocument(body),
            meta: {
              description: textValue(formData, 'description'),
            },
            title,
          })

          setPostStatus(
            res.ok
              ? { success: 'Post draft created.' }
              : { error: res.message || 'Unable to create post draft.' },
          )
        }}
        status={postStatus}
        title="Post"
      >
        <TextField id="post-title" label="Post title" name="title" required />
        <TextAreaField id="post-description" label="Short description" name="description" />
        <TextAreaField id="post-body" label="Body" name="body" required rows={8} />
      </ScaffoldForm>
    </div>
  )
}

const ScaffoldForm: React.FC<{
  children: React.ReactNode
  description: string
  id: string
  onSubmit: (formData: FormData) => Promise<void>
  status: FormStatus
  title: string
}> = ({ children, description, id, onSubmit, status, title }) => (
  <form
    className="scroll-mt-8 border border-border bg-card/30 p-6"
    id={id}
    onSubmit={async (event) => {
      event.preventDefault()
      await onSubmit(new FormData(event.currentTarget))
    }}
  >
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    <div className="mt-5 grid gap-4">{children}</div>
    {status.error ? <p className="mt-4 text-sm text-destructive">{status.error}</p> : null}
    {status.success ? <p className="mt-4 text-sm text-muted-foreground">{status.success}</p> : null}
    <Button className="mt-5" type="submit">
      Create draft <Send className="ml-2 h-4 w-4" />
    </Button>
  </form>
)

const TextField: React.FC<{
  id: string
  label: string
  name: string
  required?: boolean
  type?: string
}> = ({ id, label, name, required, type = 'text' }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input className={fieldClassName} id={id} name={name} required={required} type={type} />
  </div>
)

const TextAreaField: React.FC<{
  id: string
  label: string
  name: string
  required?: boolean
  rows?: number
}> = ({ id, label, name, required, rows = 4 }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea className={fieldClassName} id={id} name={name} required={required} rows={rows} />
  </div>
)

const SelectField: React.FC<{
  id: string
  label: string
  name: string
  options: [string, string][]
}> = ({ id, label, name, options }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <select className={selectClassName} id={id} name={name}>
      {options.map(([value, labelText]) => (
        <option key={value || 'none'} value={value}>
          {labelText}
        </option>
      ))}
    </select>
  </div>
)

const LinkFields = () => (
  <div className="grid gap-4 md:grid-cols-2">
    <TextField id="project-link-label" label="Link label" name="linkLabel" />
    <TextField id="project-link-url" label="Link URL" name="linkURL" type="url" />
  </div>
)

const textValue = (formData: FormData, key: string) => String(formData.get(key) || '').trim()

const compactArray = (items: string[]) => items.filter(Boolean)

const fieldClassName =
  'border-muted-foreground/30 bg-background/80 text-foreground shadow-sm focus-visible:ring-primary'

const selectClassName = `${fieldClassName} h-10 w-full rounded px-3 text-sm`

const linkArray = (formData: FormData) => {
  const label = textValue(formData, 'linkLabel')
  const url = textValue(formData, 'linkURL')

  return label && url ? [{ label, url }] : undefined
}

const postJSON = async (url: string, body: unknown) => {
  const res = await fetch(url, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (res.ok) return { ok: true }

  const json = await res.json().catch(() => null)
  return {
    message: json?.errors?.[0]?.message || json?.message,
    ok: false,
  }
}

const lexicalDocument = (body: string) => ({
  root: {
    children: body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph,
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        type: 'paragraph',
        version: 1,
      })),
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})
