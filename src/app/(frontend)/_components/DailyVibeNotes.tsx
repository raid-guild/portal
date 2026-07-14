'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { VibeNote } from '@/utilities/dailyEngagement'

type VibeNotesResponse = {
  checkedInCount?: number
  entries?: VibeNote[]
  generatedAt?: string
  locked?: boolean
  message?: string
}

type DailyVibeNotesProps = {
  hasCheckedInToday: boolean
}

export const DailyVibeNotes: React.FC<DailyVibeNotesProps> = ({ hasCheckedInToday }) => {
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [entries, setEntries] = useState<VibeNote[]>([])
  const [error, setError] = useState<null | string>(null)
  const [generatedAt, setGeneratedAt] = useState<null | string>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(!hasCheckedInToday)

  const loadNotes = useCallback(async () => {
    if (!hasCheckedInToday) {
      setIsLocked(true)
      setEntries([])
      setError(null)
      setGeneratedAt(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/daily-engagements/today/notes', {
        credentials: 'include',
      })
      const json = (await res.json().catch(() => null)) as VibeNotesResponse | null

      if (!res.ok) {
        if (json?.locked) {
          setIsLocked(true)
          setEntries([])
          setCheckedInCount(json.checkedInCount || 0)
          setGeneratedAt(json.generatedAt || null)
          return
        }

        throw new Error(json?.message || "Unable to load today's notes.")
      }

      setIsLocked(Boolean(json?.locked))
      setEntries(json?.entries || [])
      setCheckedInCount(json?.checkedInCount || 0)
      setGeneratedAt(json?.generatedAt || new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load today's notes.")
    } finally {
      setIsLoading(false)
    }
  }, [hasCheckedInToday])

  useEffect(() => {
    loadNotes()

    if (!hasCheckedInToday) return

    const interval = window.setInterval(loadNotes, 90_000)

    return () => window.clearInterval(interval)
  }, [hasCheckedInToday, loadNotes])

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="portal-kicker">Today&apos;s Vibe Notes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlocked after your daily check-in. Resets tomorrow.
          </p>
        </div>
        {hasCheckedInToday ? (
          <Button
            disabled={isLoading}
            onClick={loadNotes}
            size="sm"
            type="button"
            variant="outline"
          >
            Refresh
          </Button>
        ) : null}
      </div>

      {isLocked ? (
        <p className="mt-4 text-sm text-muted-foreground">Check in to unlock today&apos;s notes.</p>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : isLoading && !generatedAt ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading today&apos;s notes...</p>
      ) : entries.length ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {checkedInCount} raider{checkedInCount === 1 ? '' : 's'} checked in today.
            </span>
            {generatedAt ? <span>Last updated {formatTime(generatedAt)}</span> : null}
          </div>
          <ol className="mt-4 space-y-3">
            {entries.map((entry) => (
              <li className="grid grid-cols-[auto_1fr] gap-3 text-sm" key={entry.id}>
                <VibeNoteAvatar entry={entry} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{entry.displayName}</span>
                    {entry.handle ? (
                      <span className="text-xs text-muted-foreground">@{entry.handle}</span>
                    ) : null}
                    <span className="portal-pill">
                      {entry.vibeEmoji} {entry.vibeLabel}
                    </span>
                  </div>
                  <p className="mt-2 leading-6 text-muted-foreground">{entry.note}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            More notes may appear as the guild checks in.
          </p>
        </>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>You&apos;re in. Notes will appear as raiders check in today.</p>
          {generatedAt ? <p className="text-xs">Last updated {formatTime(generatedAt)}</p> : null}
        </div>
      )}
    </div>
  )
}

const VibeNoteAvatar: React.FC<{ entry: VibeNote }> = ({ entry }) => {
  const label = entry.displayName || entry.handle || 'Member'

  if (entry.avatarURL) {
    return (
      <img
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
        loading="lazy"
        src={entry.avatarURL}
      />
    )
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-primary/15 font-mono text-[0.7rem] font-bold uppercase text-primary">
      {getInitials(label)}
    </span>
  )
}

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
