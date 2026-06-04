'use client'

import React, { useEffect, useState } from 'react'

type DateTimeVariant = 'medium' | 'full'

const formatDateTime = (timestamp: string, variant: DateTimeVariant, timeZone?: string): string => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  const options =
    variant === 'full'
      ? ({
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          month: 'long',
          timeZone,
          timeZoneName: 'short',
          weekday: 'long',
          year: 'numeric',
        } satisfies Intl.DateTimeFormatOptions)
      : ({
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          month: 'short',
          timeZone,
          timeZoneName: 'short',
          year: 'numeric',
        } satisfies Intl.DateTimeFormatOptions)

  return new Intl.DateTimeFormat('en', options).format(date)
}

const formatDatePart = (
  timestamp: string,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): string => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en', { ...options, timeZone }).format(date)
}

const getBrowserTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export const LocalDateTime: React.FC<{
  className?: string
  timestamp?: string | null
  variant?: DateTimeVariant
}> = ({ className, timestamp, variant = 'medium' }) => {
  const [label, setLabel] = useState(() =>
    timestamp ? formatDateTime(timestamp, variant, 'UTC') : '',
  )

  useEffect(() => {
    if (!timestamp) return

    setLabel(formatDateTime(timestamp, variant, getBrowserTimeZone()))
  }, [timestamp, variant])

  if (!timestamp || !label) return null

  return (
    <time className={className} dateTime={timestamp}>
      {label}
    </time>
  )
}

export const LocalDateBadge: React.FC<{
  timestamp: string
}> = ({ timestamp }) => {
  const [parts, setParts] = useState(() => ({
    date: formatDatePart(timestamp, { day: '2-digit' }, 'UTC'),
    day: formatDatePart(timestamp, { weekday: 'short' }, 'UTC'),
  }))

  useEffect(() => {
    const timeZone = getBrowserTimeZone()

    setParts({
      date: formatDatePart(timestamp, { day: '2-digit' }, timeZone),
      day: formatDatePart(timestamp, { weekday: 'short' }, timeZone),
    })
  }, [timestamp])

  return (
    <time className="flex items-baseline gap-2 sm:block" dateTime={timestamp}>
      <span className="block font-mono text-xs uppercase text-muted-foreground">{parts.day}</span>
      <span className="block font-display text-2xl font-bold leading-none text-foreground">
        {parts.date}
      </span>
    </time>
  )
}
