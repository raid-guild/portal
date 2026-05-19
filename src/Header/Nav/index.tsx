'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { authChangeEvent } from '@/utilities/authEvents'

const hiddenNavLabels = new Set(['posts'])
const hiddenNavUrls = new Set(['/posts'])

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navItems = (header?.navItems || []).filter(({ link }) => {
    const label = typeof link?.label === 'string' ? link.label.toLowerCase() : ''
    const url = typeof link?.url === 'string' ? link.url.toLowerCase() : ''

    return !hiddenNavLabels.has(label) && !hiddenNavUrls.has(url)
  })

  const loadAuthState = useCallback(async () => {
    const response = await fetch('/api/users/me', {
      credentials: 'include',
    }).catch(() => null)
    const data = response?.ok ? await response.json().catch(() => null) : null

    setIsLoggedIn(Boolean(data?.user?.id))
  }, [])

  useEffect(() => {
    void loadAuthState()
    window.addEventListener(authChangeEvent, loadAuthState)

    return () => {
      window.removeEventListener(authChangeEvent, loadAuthState)
    }
  }, [loadAuthState])

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      <Link
        className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:text-foreground"
        href={isLoggedIn ? '/dashboard' : '/login'}
      >
        {isLoggedIn ? 'Dashboard' : 'Login'}
      </Link>
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}
