'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DAILY_VIBE_CHECK_POINTS,
  type DailyEngagementVibe,
  dailyEngagementVibeEmojis,
  dailyEngagementVibeLabels,
  dailyEngagementVibes,
} from '@/utilities/dailyEngagement'

type VibeCheckButtonProps = {
  currentStreak: number
  hasCheckedInToday: boolean
  todayVibe?: string | null
}

export const VibeCheckButton: React.FC<VibeCheckButtonProps> = ({
  currentStreak,
  hasCheckedInToday,
  todayVibe,
}) => {
  const router = useRouter()
  const descriptionID = useId()
  const titleID = useId()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVibe, setSelectedVibe] = useState<DailyEngagementVibe>('raiding')
  const [checkedIn, setCheckedIn] = useState(hasCheckedInToday)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => closeButtonRef.current?.focus(), 0)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousActiveElement?.focus()
    }
  }, [isOpen])

  const submit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/daily-engagements/check-in', {
        body: JSON.stringify({
          comment,
          vibe: selectedVibe,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(json?.message || 'Unable to complete vibe check.')
      }

      setCheckedIn(true)
      setIsOpen(false)
      setComment('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete vibe check.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={checkedIn}
          onClick={() => setIsOpen(true)}
          size="sm"
          type="button"
        >
          {checkedIn ? 'Vibe checked' : 'Vibe check'}
        </Button>
        <p className="text-xs text-muted-foreground">
          {checkedIn
            ? `${todayVibe ? dailyEngagementVibeEmojis[todayVibe as DailyEngagementVibe] || '' : ''} Current streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`
            : `Check in today for +${DAILY_VIBE_CHECK_POINTS}`}
        </p>
      </div>

      {isOpen ? (
        <div
          aria-describedby={descriptionID}
          aria-labelledby={titleID}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-lg border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="portal-kicker">Daily Vibe Check</p>
                <h3 className="mt-2 portal-heading-sm" id={titleID}>
                  What are you on today?
                </h3>
                <p className="sr-only" id={descriptionID}>
                  Choose today's vibe and optionally leave a note for moderator review.
                </p>
              </div>
              <Button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Close
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dailyEngagementVibes.map((vibe) => {
                const isSelected = vibe === selectedVibe

                return (
                  <button
                    className={`border px-3 py-4 text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-foreground'
                        : 'border-border bg-card/30 text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                    key={vibe}
                    onClick={() => setSelectedVibe(vibe)}
                    type="button"
                  >
                    <span className="block text-2xl">{dailyEngagementVibeEmojis[vibe]}</span>
                    <span className="mt-2 block font-mono text-xs font-bold uppercase">
                      {dailyEngagementVibeLabels[vibe]}
                    </span>
                  </button>
                )
              })}
            </div>

            <label className="mt-5 block">
              <span className="portal-kicker">Optional note</span>
              <Textarea
                className="mt-2"
                maxLength={1000}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What did you notice today?"
                value={comment}
              />
            </label>

            {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isSubmitting} onClick={submit} type="button">
                {isSubmitting ? 'Checking in...' : `Check in +${DAILY_VIBE_CHECK_POINTS}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
