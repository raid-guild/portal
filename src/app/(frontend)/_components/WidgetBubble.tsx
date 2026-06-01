'use client'

import { MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'

export const WidgetBubble: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('/')
  const [isTextInputFocused, setIsTextInputFocused] = useState(false)

  useEffect(() => {
    setCurrentPath(`${window.location.pathname}${window.location.search}${window.location.hash}`)

    const onFocusIn = (event: FocusEvent) => {
      setIsTextInputFocused(isTextEntryElement(event.target))
    }
    const onFocusOut = () => {
      window.setTimeout(() => {
        setIsTextInputFocused(isTextEntryElement(document.activeElement))
      }, 0)
    }

    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)

    return () => {
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const href = useMemo(() => {
    const params = new URLSearchParams({
      from: currentPath,
    })

    return `/feedback?${params.toString()}`
  }, [currentPath])

  if (isTextInputFocused) return null

  return (
    <Link
      aria-label="Send feedback"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-card text-primary shadow-lg transition hover:border-primary hover:bg-moloch-500 hover:text-scroll-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:right-6"
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

  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}
