import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canContributeContent } from '@/access/roles'
import type { Event, Profile, Project, Thread } from '@/payload-types'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
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

type SessionType = NonNullable<Event['sessionType']>

const sessionTypeLabels: Record<SessionType, string> = {
  'all-hands': 'All hands',
  brownbag: 'Brownbag',
  demo: 'Demo',
  pitch: 'Pitch',
  workshop: 'Workshop',
}

const sessionTypeStyles: Record<SessionType, string> = {
  'all-hands': 'border-moloch-500/30 bg-moloch-500/10',
  brownbag: 'border-guild-olive/30 bg-guild-olive/10',
  demo: 'border-success/30 bg-success/10',
  pitch: 'border-warning/30 bg-warning/10',
  workshop: 'border-scroll-200/30 bg-scroll-200/10',
}

export default async function EventsPage() {
  const user = await getCurrentUser()
  const events = await getEvents(user)
  const now = Date.now()
  const upcoming = events.filter((event) => new Date(event.startsAt).getTime() >= now)
  const past = events.filter((event) => new Date(event.startsAt).getTime() < now)
  const canManageSessions = canContributeContent(user)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Sessions</p>
          <h1 className="portal-title">Cohort sessions</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Live sessions, project spike syncs, and calendar anchors. Add sessions to your own
            calendar so the next live moment is not buried in Discord.
          </p>
        </div>
        {user ? (
          <Link className="portal-admin-link" href="/events/new">
            Create session
          </Link>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="portal-heading">Upcoming Sessions</h2>
        <div className="mt-5 grid gap-3">
          {upcoming.length ? (
            upcoming.map((event) => (
              <SessionRow canManageSessions={canManageSessions} event={event} key={event.id} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming sessions are published yet.</p>
          )}
        </div>
      </section>

      {past.length ? (
        <section className="mt-12">
          <h2 className="portal-heading">Past Sessions</h2>
          <div className="mt-5 grid gap-3">
            {past.map((event) => (
              <SessionRow canManageSessions={canManageSessions} event={event} key={event.id} />
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

const SessionRow: React.FC<{ canManageSessions: boolean; event: Event }> = ({
  canManageSessions,
  event,
}) => {
  const projects = relationDocs<Project>(event.relatedProjects)
  const threads = relationDocs<Thread>(event.relatedThreads)
  const speakers = relationDocs<Profile>(event.relatedProfiles)
  const speaker = typeof event.speaker === 'object' ? event.speaker : null
  const hostNames = speakers.length
    ? speakers.map((profile) => profile.displayName).filter(Boolean)
    : speaker
      ? [speaker.displayName].filter(Boolean)
      : []
  const sessionType = event.sessionType || 'brownbag'
  const startsAt = new Date(event.startsAt)
  const day = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(startsAt)
  const date = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(startsAt)

  return (
    <article className="grid gap-4 border-b border-border py-4 sm:grid-cols-[4rem_1fr]">
      <div className="flex items-baseline gap-2 sm:block">
        <p className="font-mono text-xs uppercase text-muted-foreground">{day}</p>
        <p className="font-display text-2xl font-bold leading-none text-foreground">{date}</p>
      </div>
      <div className={`rounded-sm border p-5 ${sessionTypeStyles[sessionType]}`}>
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="portal-pill">{sessionTypeLabels[sessionType]}</span>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(event.startsAt)}
              </span>
            </div>
            <h3 className="mt-3 portal-heading-sm">{event.title}</h3>
            {hostNames.length ? (
              <p className="mt-2 text-sm text-muted-foreground">Hosted by {hostNames.join(', ')}</p>
            ) : null}
            {event.summary ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
            ) : null}
            {event.locationLabel ? (
              <p className="mt-3 text-sm text-muted-foreground">{event.locationLabel}</p>
            ) : null}
            {canManageSessions && event.discordSyncStatus === 'failed' ? (
              <p className="mt-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Discord sync failed: {formatDiscordSyncError(event.discordSyncError)}
              </p>
            ) : null}
            {projects.length || threads.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {projects.map((project) => (
                  <span className="portal-pill" key={`project-${project.id}`}>
                    {project.title}
                  </span>
                ))}
                {threads.map((thread) => (
                  <span className="portal-pill" key={`thread-${thread.id}`}>
                    {thread.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap content-start gap-3 lg:justify-end">
            <SafeLink href={event.joinURL} label="Join" />
            <SafeLink
              href={event.calendarURL || getCalendarFallbackURL(event)}
              label="Add to calendar"
            />
            <SafeLink href={event.discordEventURL} label="Discord event" />
          </div>
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
      className="portal-link"
      href={safeURL}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}

const formatDiscordSyncError = (value?: string | null): string => {
  if (!value) return 'No error details were returned.'

  try {
    const parsed = JSON.parse(value) as { code?: number | string; message?: string }
    const message = parsed.message || value

    return parsed.code ? `${message} (${parsed.code})` : message
  } catch {
    return value
  }
}

const getCalendarFallbackURL = (event: Event): string | null => {
  if (!event.startsAt) return null

  const endsAt =
    event.endsAt || new Date(new Date(event.startsAt).getTime() + 30 * 60 * 1000).toISOString()

  return createGoogleCalendarURL({
    description: event.summary,
    endsAt,
    location: event.joinURL || event.discordEventURL || event.locationLabel,
    startsAt: event.startsAt,
    title: event.title,
  })
}

const getEvents = async (user: Awaited<ReturnType<typeof getCurrentUser>>) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'events',
    depth: 2,
    draft: false,
    limit: 100,
    overrideAccess: false,
    sort: 'startsAt',
    user: user || undefined,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}
