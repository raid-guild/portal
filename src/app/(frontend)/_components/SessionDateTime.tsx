'use client'

import { useEffect, useState } from 'react'
import type { FC } from 'react'

type DateStyle = 'full' | 'long' | 'medium' | 'short'

type SessionDateTimeProps = {
  className?: string
  dateStyle?: DateStyle
  endsAt?: string | null
  startsAt?: string | null
}

type SessionDateBadgeProps = {
  dateClassName?: string
  dayClassName?: string
  startsAt?: string | null
}

const fallbackTimeZone = 'UTC'

export const SessionDateTime: FC<SessionDateTimeProps> = ({
  className,
  dateStyle = 'long',
  endsAt,
  startsAt,
}) => {
  const [timeZone, setTimeZone] = useState(fallbackTimeZone)
  const label = formatSessionDateTime({ dateStyle, endsAt, startsAt, timeZone })

  useEffect(() => {
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (localTimeZone) setTimeZone(localTimeZone)
  }, [])

  if (!startsAt || !label) return null

  return (
    <time className={className} dateTime={startsAt} suppressHydrationWarning>
      {label}
    </time>
  )
}

export const SessionDateBadge: FC<SessionDateBadgeProps> = ({
  dateClassName,
  dayClassName,
  startsAt,
}) => {
  const [timeZone, setTimeZone] = useState(fallbackTimeZone)
  const badge = formatSessionDateBadge(startsAt, timeZone)

  useEffect(() => {
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (localTimeZone) setTimeZone(localTimeZone)
  }, [])

  if (!startsAt || !badge) return null

  return (
    <>
      <p className={dayClassName} suppressHydrationWarning>
        {badge.day}
      </p>
      <p className={dateClassName} suppressHydrationWarning>
        {badge.date}
      </p>
    </>
  )
}

const formatSessionDateTime = ({
  dateStyle,
  endsAt,
  startsAt,
  timeZone,
}: {
  dateStyle: DateStyle
  endsAt?: string | null
  startsAt?: string | null
  timeZone: string
}): string | null => {
  if (!startsAt) return null

  const start = toValidDate(startsAt)
  const end = endsAt ? toValidDate(endsAt) : null

  if (!start) return null

  const timeZoneLabel = getTimeZoneLabel(start, timeZone)
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle,
    timeZone,
  })
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
  const startDate = dateFormatter.format(start)
  const startTime = timeFormatter.format(start)

  if (!end) return `${startDate}, ${startTime} ${timeZoneLabel}`

  const endDate = dateFormatter.format(end)
  const endTime = timeFormatter.format(end)
  const range =
    startDate === endDate
      ? `${startDate}, ${startTime}-${endTime}`
      : `${startDate}, ${startTime}-${endDate}, ${endTime}`

  return `${range} ${timeZoneLabel}`
}

const formatSessionDateBadge = (
  startsAt: string | null | undefined,
  timeZone: string,
): { date: string; day: string } | null => {
  if (!startsAt) return null

  const start = toValidDate(startsAt)

  if (!start) return null

  return {
    date: new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      timeZone,
    }).format(start),
    day: new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
    }).format(start),
  }
}

const getTimeZoneLabel = (date: Date, timeZone: string): string => {
  const label =
    getTimeZoneName(date, timeZone, 'longGeneric') ||
    getTimeZoneName(date, timeZone, 'long') ||
    timeZone

  return simplifyTimeZoneLabel(label)
}

const getTimeZoneName = (
  date: Date,
  timeZone: string,
  timeZoneName: Intl.DateTimeFormatOptions['timeZoneName'],
): string | null =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName,
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value || null

const simplifyTimeZoneLabel = (label: string): string =>
  label.replace(/\s+(Standard|Daylight) Time$/, '').replace(/\s+Time$/, '')

const toValidDate = (value: string): Date | null => {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}
