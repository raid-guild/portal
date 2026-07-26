'use client'

import { MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

export const WidgetBubble: React.FC = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState('')
  const [isTextInputFocused, setIsTextInputFocused] = useState(false)

  useEffect(() => {
    setHash(window.location.hash || '')

    const onFocusIn = (event: FocusEvent) => {
      setIsTextInputFocused(isTextEntryElement(event.target))
    }
    const onFocusOut = () => {
      window.setTimeout(() => {
        setIsTextInputFocused(isTextEntryElement(document.activeElement))
      }, 0)
    }
    const onHashChange = () => setHash(window.location.hash || '')

    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  const href = useMemo(() => {
    const query = searchParams.toString()
    const currentPath = `${pathname || '/'}${query ? `?${query}` : ''}${hash}`
    const params = new URLSearchParams({
      from: currentPath,
    })

    return `/feedback?${params.toString()}`
  }, [hash, pathname, searchParams])

  if (isTextInputFocused) return null

  return (
    <Link
      aria-label="Send feedback"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-card text-primary shadow-lg transition hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:right-6"
      href={href}
      title="Feedback"
    >
      <MessageSquarePlus className="h-5 w-5" />
    </Link>
  )
}

const isTextEntryElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  const tagName = target.tagName.toLowerCase()

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  )
}
