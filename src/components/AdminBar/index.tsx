'use client'

import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import './index.scss'

const baseClass = 'admin-bar'

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
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    fetch('/api/users/me', {
      credentials: 'include',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (isMounted) setShow(Boolean(data?.user?.id))
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

    setShow(false)
    router.push('/')
    router.refresh()
  }

  const exitPreview = async () => {
    await fetch('/next/exit-preview')
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className={cn(baseClass, 'py-2 bg-black text-white', {
        block: show,
        hidden: !show,
      })}
    >
      <div className="container">
        <div className="flex items-center justify-between py-2 text-sm font-medium text-white">
          <Link aria-label="RaidGuild Portal dashboard" href="/dashboard">
            <Title />
          </Link>
          <div className="flex items-center gap-4">
            {adminBarProps?.preview ? (
              <button className="text-white hover:text-primary" onClick={exitPreview} type="button">
                Exit preview
              </button>
            ) : null}
            <button className="text-white hover:text-primary" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
