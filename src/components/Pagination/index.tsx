import Link from 'next/link'
import React from 'react'

export const Pagination: React.FC<{
  className?: string
  page: number
  queryString?: string
  totalPages: number
}> = (props) => {
  const { className, page, queryString = '', totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1
  const getPagePath = (pageNumber: number) =>
    `${pageNumber <= 1 ? '/posts' : `/posts/page/${pageNumber}`}${queryString}`
  const pages = getVisiblePages(page, totalPages)

  return (
    <nav
      aria-label="Pagination"
      className={['mt-10 flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')}
    >
      <PageLink disabled={!hasPrevPage} href={getPagePath(page - 1)}>
        Previous
      </PageLink>
      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span className="px-3 py-2 text-sm text-muted-foreground" key={`ellipsis-${index}`}>
            ...
          </span>
        ) : (
          <PageLink active={item === page} href={getPagePath(item)} key={item}>
            {item}
          </PageLink>
        ),
      )}
      <PageLink disabled={!hasNextPage} href={getPagePath(page + 1)}>
        Next
      </PageLink>
    </nav>
  )
}

const PageLink: React.FC<{
  active?: boolean
  children: React.ReactNode
  disabled?: boolean
  href: string
}> = ({ active = false, children, disabled = false, href }) => (
  <Link
    aria-current={active ? 'page' : undefined}
    aria-disabled={disabled || undefined}
    className={[
      'border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border text-foreground hover:border-primary hover:text-primary',
      disabled ? 'pointer-events-none opacity-40' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    href={href}
  >
    {children}
  </Link>
)

const getVisiblePages = (page: number, totalPages: number): (number | 'ellipsis')[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sortedPages = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b)

  return sortedPages.flatMap((value, index) => {
    const previous = sortedPages[index - 1]
    return !previous || value - previous === 1 ? [value] : ['ellipsis' as const, value]
  })
}
