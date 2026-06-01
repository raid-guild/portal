'use client'

import React, { useCallback, useEffect, useState } from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { ChevronDown, Inbox, LogOut, SearchIcon, Shield, UserRound } from 'lucide-react'
import { authChangeEvent, notifyAuthChanged } from '@/utilities/authEvents'
import { useRouter } from 'next/navigation'

const hiddenNavLabels = new Set(['posts'])
const hiddenNavUrls = new Set(['/posts'])

type AccountUser = {
  email?: string | null
  id?: number | string
  name?: string | null
}

type AccountProfile = {
  avatar?: {
    alt?: string | null
    url?: string | null
  } | null
  displayName?: string | null
  handle?: string | null
}

type HeaderNavLink = NonNullable<HeaderType['navItems']>[number]['link']

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<AccountUser | null>(null)
  const router = useRouter()
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
    const currentUser = data?.user || null

    setUser(currentUser)
    if (!currentUser?.id) {
      setOpen(false)
      setProfile(null)
      setUnreadCount(0)
      return
    }

    const [profileResponse, notificationsResponse] = await Promise.all([
      fetch(`/api/profiles?depth=1&limit=1&where[user][equals]=${currentUser.id}`, {
        credentials: 'include',
      }).catch(() => null),
      fetch('/api/notifications?depth=0&limit=1&where[status][equals]=unread', {
        credentials: 'include',
      }).catch(() => null),
    ])
    const profileData = profileResponse?.ok ? await profileResponse.json().catch(() => null) : null
    const notificationsData = notificationsResponse?.ok
      ? await notificationsResponse.json().catch(() => null)
      : null

    setProfile(profileData?.docs?.[0] || null)
    setUnreadCount(Number(notificationsData?.totalDocs || 0))
  }, [])

  useEffect(() => {
    void loadAuthState()
    window.addEventListener(authChangeEvent, loadAuthState)

    return () => {
      window.removeEventListener(authChangeEvent, loadAuthState)
    }
  }, [loadAuthState])

  const logout = async () => {
    await fetch('/api/users/logout', {
      credentials: 'include',
      method: 'POST',
    })

    setOpen(false)
    setProfile(null)
    setUnreadCount(0)
    setUser(null)
    notifyAuthChanged()
    router.push('/')
    router.refresh()
  }

  const accountName = profile?.displayName || user?.name || user?.email || 'Account'
  const avatarURL =
    profile?.avatar && typeof profile.avatar === 'object' ? profile.avatar.url || null : null
  const initials = accountName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...normalizeNavLink(link)} appearance="link" />
      })}
      {user?.id ? (
        <div className="relative">
          <button
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Open account menu"
            className="flex h-9 items-center gap-2 rounded-sm border border-border bg-card/30 px-2 text-foreground transition hover:border-primary hover:text-primary"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border bg-card/60 text-[0.625rem] font-bold">
              {avatarURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={profile?.avatar?.alt || accountName}
                  className="h-full w-full object-cover"
                  src={avatarURL}
                />
              ) : (
                initials || <UserRound className="h-4 w-4" />
              )}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {open ? (
            <div
              className="absolute right-0 top-11 z-50 w-56 border border-border bg-background p-2 text-foreground shadow-lg"
              role="menu"
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-bold">{accountName}</p>
                {profile?.handle ? (
                  <p className="truncate text-xs text-muted-foreground">@{profile.handle}</p>
                ) : null}
              </div>
              <Link
                className="mt-2 flex items-center gap-2 px-3 py-2 text-sm hover:bg-card"
                href="/dashboard"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <UserRound className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-card"
                href="/inbox"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </span>
                {unreadCount ? <span className="portal-pill">{unreadCount}</span> : null}
              </Link>
              <Link
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-card"
                href="/me"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <UserRound className="h-4 w-4" />
                My profile
              </Link>
              <Link
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-card"
                href="/admin"
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-card"
                onClick={logout}
                role="menuitem"
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <Link
          className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:text-foreground"
          href="/login"
        >
          Login
        </Link>
      )}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}

const normalizeNavLink = (link: HeaderNavLink) => {
  if (typeof link?.label === 'string' && link.label.toLowerCase() === 'contact') {
    return {
      ...link,
      label: 'Inquire',
      reference: undefined,
      type: 'custom' as const,
      url: '/inquire/general',
    }
  }

  return link
}
