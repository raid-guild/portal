import Link from 'next/link'
import React from 'react'

import type { ReactableCollectionSlug } from '@/utilities/contentReactions'
import { getListHref } from '../../_components/PortalListControls'

export type SavedKindFilter = 'all' | 'bookmark' | 'like'
export type SavedTypeFilter = 'all' | ReactableCollectionSlug

export const savedKindValues: SavedKindFilter[] = ['all', 'like', 'bookmark']

export const savedKindLabels: Record<SavedKindFilter, string> = {
  all: 'All',
  bookmark: 'Bookmarks',
  like: 'Likes',
}

export const savedTypeValues: SavedTypeFilter[] = [
  'all',
  'posts',
  'events',
  'projects',
  'threads',
  'wikiPages',
]

export const savedTypeLabels: Record<SavedTypeFilter, string> = {
  all: 'All types',
  events: 'Sessions',
  posts: 'Posts',
  projects: 'Projects',
  threads: 'Threads',
  wikiPages: 'Wiki',
}

export const normalizeSavedKindFilter = (value?: string | string[]): SavedKindFilter => {
  const raw = Array.isArray(value) ? value[0] : value

  return savedKindValues.includes(raw as SavedKindFilter) ? (raw as SavedKindFilter) : 'all'
}

export const normalizeSavedTypeFilter = (value?: string | string[]): SavedTypeFilter => {
  const raw = Array.isArray(value) ? value[0] : value

  return savedTypeValues.includes(raw as SavedTypeFilter) ? (raw as SavedTypeFilter) : 'all'
}

/**
 * Every filter pill shares one base class so the type face, weight, casing and box
 * stay identical across the row; only colour marks the active filter. (Mixing
 * `portal-admin-link` for the active pill would also make it bold, uppercase and
 * letter-spaced, so the row appeared to change font as you clicked through it.)
 */
const savedFilterPillClass = (isActive: boolean): string =>
  `portal-pill transition-colors ${
    isActive
      ? // Filled with the brand colour and its paired foreground token. Tinting the
        // text primary instead would make the active pill *dimmer* than the inactive
        // ones on the dark theme (~2.4:1 contrast), which reads as disabled.
        'border-primary bg-primary text-primary-foreground'
      : 'hover:border-primary hover:text-primary'
  }`

export const SavedFilterNav: React.FC<{
  activeKind: SavedKindFilter
  activeType: SavedTypeFilter
}> = ({ activeKind, activeType }) => (
  <div className="flex flex-col gap-3">
    <nav aria-label="Saved kind filter" className="flex flex-wrap gap-2">
      {savedKindValues.map((kind) => {
        const isActive = kind === activeKind
        const href = getListHref('/me/saved', {
          kind: kind === 'all' ? undefined : kind,
          type: activeType === 'all' ? undefined : activeType,
        })

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={savedFilterPillClass(isActive)}
            href={href}
            key={kind}
          >
            {savedKindLabels[kind]}
          </Link>
        )
      })}
    </nav>
    <nav aria-label="Saved type filter" className="flex flex-wrap gap-2">
      {savedTypeValues.map((type) => {
        const isActive = type === activeType
        const href = getListHref('/me/saved', {
          kind: activeKind === 'all' ? undefined : activeKind,
          type: type === 'all' ? undefined : type,
        })

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={savedFilterPillClass(isActive)}
            href={href}
            key={type}
          >
            {savedTypeLabels[type]}
          </Link>
        )
      })}
    </nav>
  </div>
)
