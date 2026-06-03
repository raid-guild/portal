import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

import { canContributeContent } from '@/access/roles'
import { PageRange } from '@/components/PageRange'
import type { Event, Profile, Project, Thread } from '@/payload-types'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import {
  getListPageValue,
  getListQueryValue,
  PortalPagination,
  PortalSearchForm,
  type ListSearchParams,
} from '../_components/PortalListControls'

export const dynamic = 'force-dynamic'
const EVENTS_PER_PAGE = 24

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
  fireside: 'Fireside',
  pitch: 'Pitch',
  workshop: 'Workshop',
}

const sessionTypeStyles: Record<SessionType, string> = {
  'all-hands': 'border-moloch-500/30 bg-moloch-500/10',
  brownbag: 'border-guild-olive/30 bg-guild-olive/10',
  demo: 'border-success/30 bg-success/10',
  fireside: 'border-primary/40 bg-primary/10',
  pitch: 'border-warning/30 bg-warning/10',
  workshop: 'border-scroll-200/30 bg-scroll-200/10',
}

const recurrenceCadenceLabels: Record<NonNullable<Event['recurrenceCadence']>, string> = {
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  weekly: 'Weekly',
}

const sourceStatusLabels: Record<NonNullable<Event['sourceStatus']>, string> = {
  archived: 'Archived',
  processed: 'Processed',
  recorded: 'Recorded',
  scheduled: 'Scheduled',
  summarized: 'Summarized',
}

type Args = {
  searchParams?: Promise<ListSearchParams>
}

export default async function EventsPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])
  const query = getListQueryValue(searchParams?.q)
  const page = getListPageValue(searchParams?.page)
  const events = await getEvents(user, { page, query })
  const now = Date.now()
  const live = events.docs.filter((event) => isLiveEvent(event, now))
  const upcoming = events.docs.filter(
    (event) => !isLiveEvent(event, now) && new Date(event.startsAt).getTime() >= now,
  )
  const past = events.docs.filter(
    (event) => !isLiveEvent(event, now) && new Date(event.startsAt).getTime() < now,
  )
  upcoming.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
  past.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
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
        {canManageSessions ? (
          <Link className="portal-admin-link" href="/events/new">
            Create session
          </Link>
        ) : null}
      </section>

      <PortalSearchForm
        action="/events"
        label="Search sessions"
        placeholder="Search by session title, summary, location, type, or series"
        query={query}
      />

      <div className="mt-8">
        <PageRange
          collectionLabels={{ plural: 'Sessions', singular: 'Session' }}
          currentPage={events.page}
          limit={EVENTS_PER_PAGE}
          totalDocs={events.totalDocs}
        />
      </div>

      {live.length ? (
        <section className="mt-10 border border-primary/40 bg-primary/10 p-5">
          <p className="portal-kicker">Live Now</p>
          <div className="mt-5 grid gap-3">
            {live.map((event) => (
              <SessionRow
                canManageSessions={canManageSessions}
                event={event}
                isLive
                key={event.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="portal-heading">Upcoming Sessions</h2>
        <div className="mt-5 grid gap-3">
          {upcoming.length ? (
            upcoming.map((event) => (
              <SessionRow canManageSessions={canManageSessions} event={event} key={event.id} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {query
                ? 'No upcoming sessions match that search on this page.'
                : 'No upcoming sessions are published yet.'}
            </p>
          )}
        </div>
      </section>

      {past.length ? (
        <section className="mt-12">
          <h2 className="portal-heading">Past Sessions</h2>
          <div className="mt-5 grid gap-3">
            {past.map((event) => (
              <SessionRow
                canManageSessions={canManageSessions}
                event={event}
                isPast
                key={event.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      <PortalPagination
        basePath="/events"
        page={events.page}
        query={query}
        totalPages={events.totalPages}
      />
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Upcoming RaidGuild cohort sessions and calendar links.',
  title: 'Sessions',
}

const SessionRow: React.FC<{
  canManageSessions: boolean
  event: Event
  isLive?: boolean
  isPast?: boolean
}> = ({ canManageSessions, event, isLive = false, isPast = false }) => {
  const projects = relationDocs<Project>(event.relatedProjects)
  const threads = relationDocs<Thread>(event.relatedThreads)
  const speakers = relationDocs<Profile>(event.speakerProfiles)
  const hosts = relationDocs<Profile>(event.hostProfiles)
  const relatedProfiles = relationDocs<Profile>(event.relatedProfiles)
  const speaker = typeof event.speaker === 'object' ? event.speaker : null
  const hostNames = hosts.length
    ? hosts.map((profile) => profile.displayName).filter(Boolean)
    : speakers.length
      ? speakers.map((profile) => profile.displayName).filter(Boolean)
      : relatedProfiles.length
        ? relatedProfiles.map((profile) => profile.displayName).filter(Boolean)
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
      <div
        className={`rounded-sm border p-5 ${
          isLive ? 'border-primary bg-primary/15' : sessionTypeStyles[sessionType]
        }`}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isLive ? <span className="portal-pill">Live now</span> : null}
              <span className="portal-pill">{sessionTypeLabels[sessionType]}</span>
              {event.seriesKey ? (
                <span className="portal-pill">
                  {event.seriesTitle || event.seriesKey}
                  {event.recurrenceCadence
                    ? ` / ${recurrenceCadenceLabels[event.recurrenceCadence]}`
                    : ''}
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {formatDateTime(event.startsAt)}
              </span>
            </div>
            <h3 className="mt-3 portal-heading-sm">
              <Link className="transition-colors hover:text-primary" href={`/events/${event.id}`}>
                {event.title}
              </Link>
            </h3>
            {hostNames.length ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {event.sessionType === 'fireside' ? 'Featuring' : 'Hosted by'}{' '}
                {hostNames.join(', ')}
              </p>
            ) : null}
            {event.summary ? (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{event.summary}</p>
            ) : null}
            {event.sourceStatus && isPast ? (
              <p className="mt-3 inline-flex border border-border px-2 py-1 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Archive status: {sourceStatusLabels[event.sourceStatus]}
              </p>
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
            <Link className="portal-link" href={`/events/${event.id}`}>
              {isPast ? 'View archive' : 'Details'}
            </Link>
            {!isPast ? <SafeLink href={event.joinURL} label="Join" /> : null}
            {!isPast ? (
              <SafeLink
                href={event.calendarURL || getCalendarFallbackURL(event)}
                label="Add to calendar"
              />
            ) : null}
            {!isPast ? <SafeLink href={event.discordEventURL} label="Discord event" /> : null}
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

const isLiveEvent = (event: Event, now: number): boolean => {
  const startsAt = new Date(event.startsAt).getTime()
  const endsAt = event.endsAt ? new Date(event.endsAt).getTime() : startsAt + 30 * 60 * 1000

  return startsAt <= now && endsAt > now
}

const getEvents = async (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  {
    page,
    query,
  }: {
    page: number
    query: string
  },
) => {
  const payload = await getPayload({ config: configPromise })
  const where: Where = {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
    ],
  }

  if (query) {
    where.and?.push({
      or: [
        {
          title: {
            like: query,
          },
        },
        {
          summary: {
            like: query,
          },
        },
        {
          locationLabel: {
            like: query,
          },
        },
        {
          sessionType: {
            like: query,
          },
        },
        {
          seriesTitle: {
            like: query,
          },
        },
        {
          'relatedProjects.title': {
            like: query,
          },
        },
        {
          'relatedThreads.title': {
            like: query,
          },
        },
      ],
    })
  }

  const result = await payload.find({
    collection: 'events',
    depth: 2,
    draft: false,
    limit: EVENTS_PER_PAGE,
    overrideAccess: false,
    page,
    sort: '-startsAt',
    user: user || undefined,
    where,
  })

  return result
}
