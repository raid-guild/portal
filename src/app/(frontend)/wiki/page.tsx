import type { Metadata } from 'next'
import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import type { WikiPage } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export default async function WikiIndexPage() {
  const user = await getCurrentUser()
  const pages = await getPublishedWikiPages(user)
  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="portal-kicker">Infinite Wiki</p>
          <h1 className="mt-3 portal-title">Wiki</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            Source-backed topic pages distilled from sessions, posts, projects, and community
            memory.
          </p>
        </div>
        <aside className="portal-panel">
          <p className="portal-heading-sm">Knowledge module</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Published pages are reviewed topic references. Generated drafts and possible pages stay
            out of the public index until reviewed.
          </p>
          {canManageWiki ? (
            <Link className="portal-admin-link mt-5 inline-flex" href="/admin/collections/wikiPages/create">
              Create wiki page
            </Link>
          ) : null}
        </aside>
      </section>

      <section className="mt-10">
        {pages.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <Link
                className="block portal-card transition-colors hover:bg-card"
                href={`/wiki/${page.slug}`}
                key={page.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="portal-pill">{reviewStatusLabels[page.reviewStatus]}</span>
                  <span className="portal-pill">{page.visibility}</span>
                </div>
                <h2 className="mt-4 portal-heading-sm">{page.title}</h2>
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                  {page.summary}
                </p>
                {page.lastReviewedAt || page.lastRefreshedAt ? (
                  <p className="mt-5 text-xs text-muted-foreground">
                    {page.lastReviewedAt
                      ? `Reviewed ${formatDate(page.lastReviewedAt)}`
                      : `Refreshed ${formatDate(page.lastRefreshedAt)}`}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="portal-panel">
            <p className="text-sm leading-6 text-muted-foreground">
              No reviewed wiki pages have been published yet.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}

const getPublishedWikiPages = async (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WikiPage[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'wikiPages',
    depth: 1,
    draft: false,
    limit: 48,
    overrideAccess: false,
    pagination: false,
    sort: '-lastReviewedAt',
    user: user || undefined,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs
}

const reviewStatusLabels: Record<NonNullable<WikiPage['reviewStatus']>, string> = {
  archived: 'Archived',
  generated_draft: 'Generated draft',
  needs_refresh: 'Needs refresh',
  needs_review: 'Needs review',
  reviewed: 'Reviewed',
}

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

export function generateMetadata(): Metadata {
  return {
    title: 'RaidGuild Portal Wiki',
  }
}
