'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { useTheme } from '@/providers/Theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  header: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ header }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { theme: globalTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    setTheme(headerTheme ?? globalTheme ?? null)
  }, [globalTheme, headerTheme])

  return (
    <header
      className="sticky top-0 z-40 border-t-[6px] border-primary bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85"
      data-portal-header
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container flex min-h-[4.5rem] items-center justify-between gap-4 border-b border-border py-3 lg:min-h-24">
        <Link className="shrink-0" href="/">
          <Logo loading="eager" priority="high" />
        </Link>
        <HeaderNav header={header} />
      </div>
    </header>
  )
}
