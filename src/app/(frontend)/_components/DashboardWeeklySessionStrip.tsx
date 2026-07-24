'use client'

import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'
import type { Event } from '@/payload-types'

export const DashboardWeeklySessionStrip: React.FC<{
  className?: string
  emptyLabel?: string
  events: Event[]
  heading?: string
  scheduleHref?: string
}> = ({
  className,
  emptyLabel = 'Open',
  events,
  heading = "This Week's Sessions",
  scheduleHref = '/events',
}) => {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <section className={className}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="portal-heading-sm">{heading}</h2>
          <Link className="portal-link" href={scheduleHref}>
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
        <h2 className="portal-heading-sm">{heading}</h2>
        <Link className="portal-link" href={scheduleHref}>
          Full schedule
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dayEvents = events.filter((event) => isSameDashboardDay(event.startsAt, day.date))

          return (
            <div
              className={cn(
                'min-h-28 border bg-card/20 p-3',
                day.isToday ? 'border-primary bg-card/35' : 'border-border',
              )}
              key={day.key}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="portal-kicker">{day.weekday}</p>
                {day.isToday ? <span className="portal-pill text-[10px]">Today</span> : null}
              </div>
              <p className={cn('mt-1 text-2xl font-bold', day.isToday ? 'text-primary' : null)}>
                {day.dayNumber}
              </p>
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
                  <span className="text-xs text-muted-foreground">{emptyLabel}</span>
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
    date.setDate(today.getDate() - 3 + index)

    return {
      date,
      dayNumber: new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date),
      isToday: date.getTime() === today.getTime(),
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
