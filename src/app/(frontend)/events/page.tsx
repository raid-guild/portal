import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Event, Project, Thread } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'

export const dynamic = 'force-dynamic'

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export default async function EventsPage() {
  const [events, user] = await Promise.all([getEvents(), getCurrentUser()])
  const now = Date.now()
  const upcoming = events.filter((event) => new Date(event.startsAt).getTime() >= now)
  const past = events.filter((event) => new Date(event.startsAt).getTime() < now)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Sessions
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Cohort sessions</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Live sessions, project spike syncs, and calendar anchors. Add sessions to your own
            calendar so the next live moment is not buried in Discord.
          </p>
        </div>
        {user ? (
          <Link
            className="border border-border px-4 py-2 text-sm font-medium"
            href="/admin/collections/events/create"
          >
            Create session
          </Link>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Upcoming</h2>
        <div className="mt-5 grid gap-4">
          {upcoming.length ? (
            upcoming.map((event) => <SessionCard event={event} key={event.id} />)
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming sessions are published yet.</p>
          )}
        </div>
      </section>

      {past.length ? (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Past Sessions</h2>
          <div className="mt-5 grid gap-4">
            {past.map((event) => (
              <SessionCard event={event} key={event.id} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Upcoming RaidGuild cohort sessions and calendar links.',
  title: 'Sessions',
}

const SessionCard: React.FC<{ event: Event }> = ({ event }) => {
  const projects = relationDocs<Project>(event.relatedProjects)
  const threads = relationDocs<Thread>(event.relatedThreads)

  return (
    <article className="border border-border p-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-xs uppercase tracking-normal text-muted-foreground">
            {formatDateTime(event.startsAt)}
          </p>
          <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
          {event.summary ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
          ) : null}
          {event.locationLabel ? (
            <p className="mt-3 text-sm text-muted-foreground">{event.locationLabel}</p>
          ) : null}
          {projects.length || threads.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {projects.map((project) => (
                <span
                  className="border border-border px-2 py-1 text-xs"
                  key={`project-${project.id}`}
                >
                  {project.title}
                </span>
              ))}
              {threads.map((thread) => (
                <span
                  className="border border-border px-2 py-1 text-xs"
                  key={`thread-${thread.id}`}
                >
                  {thread.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap content-start gap-3 lg:justify-end">
          <SafeLink href={event.joinURL} label="Join" />
          <SafeLink href={event.calendarURL} label="Add to calendar" />
          <SafeLink href={event.discordEventURL} label="Discord event" />
        </div>
      </div>
    </article>
  )
}

const SafeLink: React.FC<{ href?: string | null; label: string }> = ({ href, label }) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) return null

  const isExternal = safeURL.startsWith('http')

  return (
    <Link
      className="text-sm font-medium underline"
      href={safeURL}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}

const getEvents = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    depth: 2,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'startsAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}
