'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const COMPLETE_DELAY_MS = 240
const STALL_TIMEOUT_MS = 20000
const START_PROGRESS = 0.08
const TRICKLE_CEILING = 0.94
const TRICKLE_INTERVAL_MS = 220
const TRICKLE_RATE = 0.12

const START_EVENT = 'portal:top-loader-start'

/**
 * Starts the top loader for navigations the click handler cannot see, such as
 * `router.push` calls inside client components.
 */
export const startTopLoader = (): void => {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new Event(START_EVENT))
}

// No defaultPrevented check here: next/link's own click handler always calls
// preventDefault() to perform its client-side navigation, so that flag can't
// tell a cancelled click apart from an ordinary Link click. A click that
// really doesn't lead anywhere is caught by the stall timeout below instead.
const isPlainLeftClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey

const startsInAppNavigation = (anchor: HTMLAnchorElement): boolean => {
  if (anchor.hasAttribute('download') || anchor.dataset.topLoader === 'off') return false

  const target = anchor.getAttribute('target')
  if (target && target !== '_self') return false

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#')) return false

  let url: URL

  try {
    url = new URL(anchor.href, window.location.href)
  } catch {
    return false
  }

  if (url.origin !== window.location.origin) return false

  // Same route: nothing will change, so the loader would never complete.
  return url.pathname !== window.location.pathname || url.search !== window.location.search
}

export const TopLoader: React.FC = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams.toString()}`

  const [active, setActive] = useState(false)
  const [progress, setProgress] = useState(0)

  const activeRef = useRef(false)
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trickleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (trickleIntervalRef.current) {
      clearInterval(trickleIntervalRef.current)
      trickleIntervalRef.current = null
    }

    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current)
      completeTimeoutRef.current = null
    }

    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current)
      stallTimeoutRef.current = null
    }
  }, [])

  const complete = useCallback(() => {
    if (!activeRef.current) return

    activeRef.current = false
    clearTimers()
    setProgress(1)

    completeTimeoutRef.current = setTimeout(() => {
      setActive(false)
      setProgress(0)
    }, COMPLETE_DELAY_MS)
  }, [clearTimers])

  const start = useCallback(() => {
    if (activeRef.current) return

    activeRef.current = true
    clearTimers()
    setActive(true)
    setProgress(START_PROGRESS)

    trickleIntervalRef.current = setInterval(() => {
      setProgress((current) => current + (TRICKLE_CEILING - current) * TRICKLE_RATE)
    }, TRICKLE_INTERVAL_MS)

    // The loader must never stick if a navigation is abandoned.
    stallTimeoutRef.current = setTimeout(complete, STALL_TIMEOUT_MS)
  }, [clearTimers, complete])

  // A committed route render is the signal that the navigation finished.
  useEffect(() => {
    complete()
  }, [complete, routeKey])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest<HTMLAnchorElement>('a')
      if (!anchor || !startsInAppNavigation(anchor)) return

      start()
    }

    window.addEventListener('click', handleClick, true)
    // Back/forward navigations are usually served from the router cache and can
    // commit before this listener runs, which would leave the bar stuck. Treat
    // popstate as a reason to settle, never to start.
    window.addEventListener('popstate', complete)
    window.addEventListener(START_EVENT, start)

    return () => {
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', complete)
      window.removeEventListener(START_EVENT, start)
    }
  }, [complete, start])

  useEffect(() => clearTimers, [clearTimers])

  return (
    <>
      <div aria-hidden="true" className="portal-top-loader" data-active={active ? 'true' : 'false'}>
        <span
          className="portal-top-loader-bar"
          style={{ width: `${Math.min(progress, 1) * 100}%` }}
        />
      </div>
      <span aria-live="polite" className="sr-only" role="status">
        {active && progress < 1 ? 'Loading page' : ''}
      </span>
    </>
  )
}
