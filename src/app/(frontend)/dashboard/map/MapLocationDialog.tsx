'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { VibeCheckButton } from '../../_components/VibeCheckButton'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
import type { MapDashboardData, PointsLeaderboardEntry } from './mapData'
import type { MapLocationConfig } from './mapConfig'
import { MapDialog } from './MapDialog'

type MapLocationDialogProps = {
  data: MapDashboardData
  location: MapLocationConfig
  onClose: () => void
}

export const MapLocationDialog: React.FC<MapLocationDialogProps> = ({ data, location, onClose }) => {
  return (
    <MapDialog description={location.region} onClose={onClose} title={location.label}>
      <LocationContent data={data} location={location} />
    </MapDialog>
  )
}

const LocationContent: React.FC<Pick<MapLocationDialogProps, 'data' | 'location'>> = ({
  data,
  location,
}) => {
  switch (location.id) {
    case 'slop-swamp':
      return <SlopSwamp data={data} />
    case 'lava-castle':
      return <LavaCastle data={data} />
    case 'forest-knowledge':
      return <KnowledgeForest data={data} />
    case 'village':
      return <Village data={data} />
    case 'guild-castle':
      return <GuildCastle />
    case 'whispers-hut':
      return <WhispersHut data={data} />
    case 'lunker-lake':
      return <LunkerLake data={data} />
    default:
      return null
  }
}

const SlopSwamp: React.FC<{ data: MapDashboardData }> = ({ data }) => {
  const post = data.latestPost

  return (
    <div>
      {post ? (
        <div className="border border-border bg-card/30 p-4">
          <p className="portal-kicker">Fresh from the muck</p>
          <h3 className="mt-2 portal-heading-sm">{post.title}</h3>
          {post.publishedAt ? (
            <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(post.publishedAt)}</p>
          ) : null}
          {post.meta?.description ? (
            <p className="mt-3 portal-body-sm">{post.meta.description}</p>
          ) : null}
        </div>
      ) : (
        <p className="portal-body-sm">The muck is quiet. No fresh post has bubbled up yet.</p>
      )}
      <DialogAction href="/posts">Read posts</DialogAction>
    </div>
  )
}

const LavaCastle: React.FC<{ data: MapDashboardData }> = ({ data }) => (
  <div>
    {data.prototypeModules.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {data.prototypeModules.map((module) => (
          <article className="border border-border bg-card/30 p-4" key={module.id}>
            <p className="portal-kicker">{module.status}</p>
            <h3 className="mt-2 portal-heading-sm">{module.name}</h3>
            <p className="mt-2 portal-body-sm">{module.summary}</p>
          </article>
        ))}
      </div>
    ) : (
      <p className="portal-body-sm">No volatile prototypes are glowing today.</p>
    )}
    <DialogAction href="/modules">View modules</DialogAction>
  </div>
)

const KnowledgeForest: React.FC<{ data: MapDashboardData }> = ({ data }) => (
  <div>
    {data.recentWikiPages.length ? (
      <div className="space-y-3">
        {data.recentWikiPages.map((page) => (
          <article className="border border-border bg-card/30 p-4" key={page.id}>
            <h3 className="portal-heading-sm">{page.title}</h3>
            <p className="mt-2 portal-body-sm">
              {page.summary || page.keyClaims?.[0]?.claim || 'Reviewed knowledge awaits.'}
            </p>
          </article>
        ))}
      </div>
    ) : (
      <p className="portal-body-sm">The forest is quiet. No reviewed pages are glowing yet.</p>
    )}
    <DialogAction href="/wiki">Open wiki</DialogAction>
  </div>
)

const Village: React.FC<{ data: MapDashboardData }> = ({ data }) => (
  <div>
    {data.upcomingEvents.length ? (
      <div className="space-y-3">
        {data.upcomingEvents.map((event) => {
          const calendarURL =
            event.calendarURL ||
            (event.endsAt
              ? createGoogleCalendarURL({
                  description: event.summary,
                  endsAt: event.endsAt,
                  location: event.locationLabel || event.joinURL,
                  startsAt: event.startsAt,
                  title: event.title,
                })
              : null)

          return (
            <article className="border border-border bg-card/30 p-4" key={event.id}>
              <p className="portal-kicker">{formatDateTime(event.startsAt)}</p>
              <h3 className="mt-2 portal-heading-sm">{event.title}</h3>
              {event.summary ? <p className="mt-2 portal-body-sm">{event.summary}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {event.joinURL ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={event.joinURL}>Join</a>
                  </Button>
                ) : null}
                {calendarURL ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={calendarURL}>Add to calendar</a>
                  </Button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    ) : (
      <p className="portal-body-sm">The square is empty. No upcoming sessions are posted.</p>
    )}
    <DialogAction href="/events">View sessions</DialogAction>
  </div>
)

const GuildCastle = () => (
  <div>
    <p className="portal-body-sm">
      This is where the guild does work. No work is posted here right now. Come back soon.
    </p>
    <Button className="mt-5" disabled size="sm" type="button" variant="outline">
      No destination yet
    </Button>
  </div>
)

const WhispersHut: React.FC<{ data: MapDashboardData }> = ({ data }) => (
  <div>
    <p className="portal-body-sm">
      {data.copy.contextBody ||
        'A little hut listens better than the void. Leave a request, a bug, a question, or a signal that needs a human look.'}
    </p>
    <DialogAction href="/feedback">Leave feedback</DialogAction>
  </div>
)

const LunkerLake: React.FC<{ data: MapDashboardData }> = ({ data }) => {
  const [leaderboard, setLeaderboard] = useState<PointsLeaderboardEntry[]>(data.leaderboard)
  const [error, setError] = useState<null | string>(null)

  useEffect(() => {
    let isActive = true

    fetch('/api/portal/leaderboard/points', {
      credentials: 'include',
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.message || 'Unable to load leaderboard.')
        return json
      })
      .then((json) => {
        if (isActive) setLeaderboard(json.entries || [])
      })
      .catch((err) => {
        if (isActive) setError(err instanceof Error ? err.message : 'Unable to load leaderboard.')
      })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <section className="border border-border bg-card/30 p-4">
        <p className="portal-kicker">Guild points</p>
        <p className="mt-2 font-mono text-4xl font-bold">{data.pointsTotal}</p>
        <div className="mt-4">
          <VibeCheckButton
            currentStreak={data.dailyEngagementSummary.currentStreak}
            hasCheckedInToday={data.dailyEngagementSummary.hasCheckedInToday}
            todayVibe={data.dailyEngagementSummary.todayVibe}
          />
        </div>

        <div className="mt-5">
          <p className="portal-kicker">Recent point signals</p>
          {data.recentPointEvents.length ? (
            <ul className="mt-3 space-y-2">
              {data.recentPointEvents.map((event) => (
                <li className="flex justify-between gap-3 text-sm" key={event.id}>
                  <span className="text-muted-foreground">{event.reason}</span>
                  <span className="font-mono font-bold">+{event.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 portal-body-sm">No point events have surfaced yet.</p>
          )}
        </div>
      </section>

      <section className="border border-border bg-card/30 p-4">
        <p className="portal-kicker">Lake standings</p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        {leaderboard.length ? (
          <ol className="mt-3 space-y-2">
            {leaderboard.map((entry) => (
              <li
                className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 text-sm ${
                  entry.isCurrentUser ? 'text-scroll-100' : 'text-muted-foreground'
                }`}
                key={`${entry.rank}-${entry.handle || entry.displayName}`}
              >
                <span className="font-mono">#{entry.rank}</span>
                <span className="truncate">{entry.displayName}</span>
                <span className="font-mono font-bold">{entry.pointsTotal}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 portal-body-sm">The lake has not ranked any point totals yet.</p>
        )}
      </section>
    </div>
  )
}

const DialogAction: React.FC<{ children: React.ReactNode; href: string }> = ({ children, href }) => (
  <Button asChild className="mt-5" size="sm">
    <Link href={href}>{children}</Link>
  </Button>
)
