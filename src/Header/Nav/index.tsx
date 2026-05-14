'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'

const hiddenNavLabels = new Set(['posts'])
const hiddenNavUrls = new Set(['/posts'])

export const HeaderNav: React.FC<{ header: HeaderType }> = ({ header }) => {
  const navItems = (header?.navItems || []).filter(({ link }) => {
    const label = typeof link?.label === 'string' ? link.label.toLowerCase() : ''
    const url = typeof link?.url === 'string' ? link.url.toLowerCase() : ''

    return !hiddenNavLabels.has(label) && !hiddenNavUrls.has(url)
  })

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}
