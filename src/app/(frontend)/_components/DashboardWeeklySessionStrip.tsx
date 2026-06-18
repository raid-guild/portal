'use client'

import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'
import type { Event } from '@/payload-types'

export const DashboardWeeklySessionStrip: React.FC<{ className?: string; events: Event[] }> = ({
  className,
  events,
}) => {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <section className={className}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="portal-heading-sm">This Week&apos;s Sessions</h2>
          <Link className="portal-link" href="/events">
            Full schedule
          </Link>
        </div>
        <div className="mt-4 min-h-28 border border-border bg-card/20 p-3 text-xs text-muted-foreground">
          Loading local schedule...
        </div>
      </section>
    )
  }

  const weekDays = getDashboardWeekDays()

  return (
    <section className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="portal-heading-sm">This Week&apos;s Sessions</h2>
        <Link className="portal-link" href="/events">
          Full schedule
        </Link>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-7">
        {weekDays.map((day) => {
          const dayEvents = events.filter((event) => isSameDashboardDay(event.startsAt, day.date))

          return (
            <div className="min-h-28 border border-border bg-card/20 p-3" key={day.key}>
              <p className="portal-kicker">{day.weekday}</p>
              <p className="mt-1 text-2xl font-bold">{day.dayNumber}</p>
              <div className="mt-3 space-y-2">
                {dayEvents.length ? (
                  dayEvents.slice(0, 2).map((event) => {
                    const isPast = isPastDashboardEvent(event.endsAt || event.startsAt)

                    return (
                      <Link
                        className={cn(
                          'block border-l-2 pl-2 text-xs leading-5 transition-colors',
                          isPast
                            ? 'border-muted-foreground/40 text-muted-foreground/70 hover:text-muted-foreground'
                            : 'border-primary text-muted-foreground hover:text-foreground',
                        )}
                        href={`/events/${event.id}`}
                        key={event.id}
                      >
                        <span
                          className={cn(
                            'font-medium',
                            isPast ? 'text-muted-foreground' : 'text-foreground',
                          )}
                        >
                          {formatShortTime(event.startsAt)}
                        </span>
                        <br />
                        {event.title}
                      </Link>
                    )
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">Open</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const getDashboardWeekDays = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    return {
      date,
      dayNumber: new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date),
      key: date.toISOString().slice(0, 10),
      weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
    }
  })
}

const isSameDashboardDay = (value: string | null | undefined, date: Date) => {
  if (!value) return false

  const eventDate = new Date(value)

  return (
    eventDate.getFullYear() === date.getFullYear() &&
    eventDate.getMonth() === date.getMonth() &&
    eventDate.getDate() === date.getDate()
  )
}

const isPastDashboardEvent = (value: string | null | undefined) => {
  if (!value) return false

  return new Date(value).getTime() < Date.now()
}

const formatShortTime = (value: string | null | undefined) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
