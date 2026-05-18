'use client'

import { cn } from '@/utilities/cn'
import { ChevronDown, LogOut, Shield, UserRound } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import './index.scss'

const baseClass = 'admin-bar'

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

const Title: React.FC = () => (
  /* eslint-disable @next/next/no-img-element */
  <img
    alt="RaidGuild Cohort"
    className="h-8 w-8"
    height={112}
    loading="lazy"
    src="/assets/symbol-white.svg"
    width={112}
  />
)

export const AdminBar: React.FC<{
  adminBarProps?: {
    preview?: boolean
  }
}> = ({ adminBarProps }) => {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [show, setShow] = useState(false)
  const [user, setUser] = useState<AccountUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    fetch('/api/users/me', {
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!isMounted) return

        const currentUser = data?.user

        setUser(currentUser || null)
        setShow(Boolean(currentUser?.id))

        if (currentUser?.id) {
          fetch(`/api/profiles?depth=1&limit=1&where[user][equals]=${currentUser.id}`, {
            credentials: 'include',
          })
            .then((response) => (response.ok ? response.json() : null))
            .then((profileData) => {
              if (isMounted) setProfile(profileData?.docs?.[0] || null)
            })
            .catch(() => {
              if (isMounted) setProfile(null)
            })
        }
      })
      .catch(() => {
        if (isMounted) setShow(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const logout = async () => {
    await fetch('/api/users/logout', {
      credentials: 'include',
      method: 'POST',
    })

    setOpen(false)
    setProfile(null)
    setShow(false)
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const exitPreview = async () => {
    await fetch('/next/exit-preview')
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
    <div
      className={cn(baseClass, 'py-2 bg-moloch-900 text-scroll-100', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <div className="flex items-center justify-between py-2 text-sm font-medium text-scroll-100">
          <Link aria-label="RaidGuild Portal dashboard" href="/dashboard">
            <Title />
          </Link>
          <div className="flex items-center gap-4">
            {adminBarProps?.preview ? (
              <button
                className="text-scroll-100 hover:text-primary"
                onClick={exitPreview}
                type="button"
              >
                Exit preview
              </button>
            ) : null}
            <div className="relative">
              <button
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="flex h-10 items-center gap-2 rounded-sm border border-scroll-100/20 bg-scroll-100/5 px-2 text-scroll-100 transition hover:border-primary hover:text-primary"
                onClick={() => setOpen((current) => !current)}
                type="button"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-scroll-100/25 bg-scroll-100/10 text-xs font-bold">
                  {avatarURL ? (
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
                  className="absolute right-0 top-12 z-50 w-56 border border-border bg-background p-2 text-foreground shadow-lg"
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
          </div>
        </div>
      </div>
    </div>
  )
}
