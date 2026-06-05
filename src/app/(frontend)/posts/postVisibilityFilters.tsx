import Link from 'next/link'
import type { Where } from 'payload'
import React from 'react'

import { hasRole } from '@/access/roles'
import type { User } from '@/payload-types'
import {
  postVisibilityLabels,
  postVisibilityValues,
  type PostVisibility,
  type PostVisibilityFilter,
} from '@/utilities/postVisibility'

type SearchParams = {
  visibility?: string | string[]
}

export const canFilterPostVisibility = (user: User | null): boolean =>
  hasRole(user, ['admin', 'agent', 'member'])

export const normalizePostVisibilityFilter = (
  searchParams: SearchParams | undefined,
  user: User | null,
): PostVisibilityFilter => {
  if (!canFilterPostVisibility(user)) return 'all'

  const rawValue = Array.isArray(searchParams?.visibility)
    ? searchParams?.visibility[0]
    : searchParams?.visibility

  if (!postVisibilityValues.includes(rawValue as PostVisibility)) return 'all'
  if (rawValue === 'admin' && !hasRole(user, 'admin')) return 'all'

  return rawValue as PostVisibility
}

export const getPostVisibilityWhere = (visibility: PostVisibilityFilter): Where => {
  const publishedOnly: Where = {
    _status: {
      equals: 'published',
    },
  }

  if (visibility === 'all') return publishedOnly

  return {
    and: [
      publishedOnly,
      {
        visibility: {
          equals: visibility,
        },
      },
    ],
  }
}

export const getPostVisibilityQuery = (visibility: PostVisibilityFilter): string =>
  visibility === 'all' ? '' : `?visibility=${visibility}`

export const PostVisibilityFilterNav: React.FC<{
  activeVisibility: PostVisibilityFilter
  user: User | null
}> = ({ activeVisibility, user }) => {
  if (!canFilterPostVisibility(user)) return null

  const options: PostVisibilityFilter[] = hasRole(user, 'admin')
    ? ['all', 'public', 'authenticated', 'member', 'admin']
    : ['all', 'public', 'authenticated', 'member']

  return (
    <nav aria-label="Post visibility" className="flex flex-wrap gap-2">
      {options.map((visibility) => {
        const isActive = visibility === activeVisibility
        const href = `/posts${getPostVisibilityQuery(visibility)}`

        return (
          <Link
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive ? 'portal-admin-link' : 'portal-pill transition-colors hover:text-primary'
            }
            href={href}
            key={visibility}
          >
            {postVisibilityLabels[visibility]}
          </Link>
        )
      })}
    </nav>
  )
}
