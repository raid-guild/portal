import Link from 'next/link'
import React from 'react'

import { Input } from '@/components/ui/input'

type SearchParams = Record<string, string | number | null | undefined>
export type ListSearchParams = {
  page?: string | string[]
  q?: string | string[]
}

export const PortalSearchForm: React.FC<{
  action: string
  label: string
  placeholder: string
  query: string
}> = ({ action, label, placeholder, query }) => (
  <form action={action} className="mt-10 flex flex-col gap-3 portal-card sm:flex-row">
    <label className="flex-1">
      <span className="sr-only">{label}</span>
      <Input defaultValue={query} name="q" placeholder={placeholder} type="search" />
    </label>
    <button className="portal-admin-link justify-center" type="submit">
      Search
    </button>
    {query ? (
      <Link className="portal-admin-link justify-center" href={action}>
        Clear
      </Link>
    ) : null}
  </form>
)

export const PortalPagination: React.FC<{
  basePath: string
  page?: number | null
  query?: string
  totalPages?: number | null
}> = ({ basePath, page = 1, query = '', totalPages = 1 }) => {
  if (!page || !totalPages || totalPages <= 1) return null

  const hasPrevious = page > 1
  const hasNext = page < totalPages
  const pages = getVisiblePages(page, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center gap-2">
      <PaginationLink
        disabled={!hasPrevious}
        href={getListHref(basePath, { page: page - 1, q: query })}
      >
        Previous
      </PaginationLink>
      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span className="px-3 py-2 text-sm text-muted-foreground" key={`ellipsis-${index}`}>
            ...
          </span>
        ) : (
          <PaginationLink
            active={item === page}
            href={getListHref(basePath, { page: item, q: query })}
            key={item}
          >
            {item}
          </PaginationLink>
        ),
      )}
      <PaginationLink
        disabled={!hasNext}
        href={getListHref(basePath, { page: page + 1, q: query })}
      >
        Next
      </PaginationLink>
    </nav>
  )
}

export const getListHref = (basePath: string, params: SearchParams): string => {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || typeof value === 'undefined' || value === '') continue
    if (key === 'page' && Number(value) <= 1) continue
    searchParams.set(key, String(value))
  }

  const queryString = searchParams.toString()

  return queryString ? `${basePath}?${queryString}` : basePath
}

export const getListQueryValue = (value?: string | string[]): string => {
  const normalized = Array.isArray(value) ? value[0] : value

  return (normalized || '').trim().slice(0, 80)
}

export const getListPageValue = (value?: string | string[]): number => {
  const normalized = Number(Array.isArray(value) ? value[0] : value)

  return Number.isInteger(normalized) && normalized > 0 ? normalized : 1
}

const PaginationLink: React.FC<{
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  href: string
}> = ({ active = false, children, disabled = false, href }) => {
  const className = [
    'border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border text-foreground hover:border-primary hover:text-primary',
    disabled ? 'pointer-events-none opacity-40' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Link aria-current={active ? 'page' : undefined} className={className} href={href}>
      {children}
    </Link>
  )
}

const getVisiblePages = (page: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sortedPages = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  return sortedPages.flatMap((value, index) => {
    const previous = sortedPages[index - 1]
    if (!previous || value - previous === 1) return [value]

    return ['ellipsis' as const, value]
  })
}
