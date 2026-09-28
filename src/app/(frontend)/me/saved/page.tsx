import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { hasVerifiedAccount } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import {
  getUserReactions,
  type ReactableCollectionSlug,
  type UserReactionRow,
} from '@/utilities/contentReactions'
import { VerifyAccountNotice } from '../../_components/VerifyAccountNotice'
import { getListPageValue, PortalPagination } from '../../_components/PortalListControls'
import {
  normalizeSavedKindFilter,
  normalizeSavedTypeFilter,
  SavedFilterNav,
  savedKindLabels,
  savedTypeLabels,
  type SavedKindFilter,
  type SavedTypeFilter,
} from './savedFilters'

export const dynamic = 'force-dynamic'

type SearchParams = {
  kind?: string | string[]
  page?: string | string[]
  type?: string | string[]
}

type Args = {
  searchParams: Promise<SearchParams>
}

export default async function SavedPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])

  if (!user) redirect('/login?next=%2Fme%2Fsaved')
  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to view your saved likes and bookmarks." />
    )
  }

  const kind = normalizeSavedKindFilter(searchParams.kind)
  const type = normalizeSavedTypeFilter(searchParams.type)
  const page = getListPageValue(searchParams.page)

  const payload = await getPayload({ config: configPromise })
  const result = await getUserReactions({
    collection: type === 'all' ? undefined : type,
    kind: kind === 'all' ? undefined : kind,
    page,
    payload,
    user,
  })

  const titlesByKey = await getTitlesForRows(payload, user, result.docs)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Account</p>
          <h1 className="portal-title">Saved</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Everything you have liked or bookmarked across the Portal, in one place.
          </p>
        </div>
        <Link className="portal-admin-link" href="/me">
          Back to profile
        </Link>
      </section>

      <div className="mt-8">
        <SavedFilterNav activeKind={kind} activeType={type} />
      </div>

      <section className="mt-8 grid gap-4">
        {result.docs.length ? (
          result.docs.map((row) => (
            <SavedRow
              key={`${row.kind}-${row.targetCollection}-${row.id}`}
              row={row}
              title={titlesByKey.get(reactionRowKey(row)) || row.label}
            />
          ))
        ) : (
          <div className="portal-panel">
            <h2 className="portal-heading-sm">Nothing saved yet</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getEmptyStateCopy(kind, type)}
            </p>
          </div>
        )}
      </section>

      <PortalPagination
        basePath="/me/saved"
        extraParams={{
          kind: kind === 'all' ? undefined : kind,
          type: type === 'all' ? undefined : type,
        }}
        page={page}
        totalPages={result.totalPages}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Saved',
}

const reactionRowKey = (row: Pick<UserReactionRow, 'targetCollection' | 'targetId'>): string =>
  `${row.targetCollection}:${row.targetId}`

/**
 * `getUserReactions` resolves each row's `href`/`label` but intentionally does not
 * carry the target document's title (it only keeps `id`/`slug` internally). Batch
 * -resolve titles here, per collection, with `overrideAccess: false` so the same
 * "drop targets the member can no longer read" rule applies to the title lookup too.
 */
const getTitlesForRows = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  rows: UserReactionRow[],
): Promise<Map<string, string>> => {
  const idsByCollection = new Map<ReactableCollectionSlug, Set<number>>()

  for (const row of rows) {
    if (!idsByCollection.has(row.targetCollection)) {
      idsByCollection.set(row.targetCollection, new Set())
    }
    idsByCollection.get(row.targetCollection)?.add(row.targetId)
  }

  const titlesByKey = new Map<string, string>()

  await Promise.all(
    Array.from(idsByCollection.entries()).map(async ([collection, ids]) => {
      const found = await payload.find({
        collection,
        depth: 0,
        limit: ids.size,
        overrideAccess: false,
        pagination: false,
        select: { title: true },
        user,
        where: {
          id: {
            in: Array.from(ids),
          },
        },
      })

      for (const doc of found.docs) {
        const title = 'title' in doc && typeof doc.title === 'string' ? doc.title : null
        if (title) titlesByKey.set(`${collection}:${doc.id}`, title)
      }
    }),
  )

  return titlesByKey
}

const SavedRow: React.FC<{ row: UserReactionRow; title: string }> = ({ row, title }) => (
  <article className="portal-panel">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="portal-pill">{row.label}</span>
          <span className="portal-pill">{row.kind === 'like' ? 'Liked' : 'Bookmarked'}</span>
        </div>
        <Link className="mt-2 block portal-heading-sm hover:text-primary" href={row.href}>
          {title}
        </Link>
      </div>
      {row.createdAt ? (
        <p className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      ) : null}
    </div>
  </article>
)

const getEmptyStateCopy = (kind: SavedKindFilter, type: SavedTypeFilter): string => {
  if (kind !== 'all' && type !== 'all') {
    return `No ${savedKindLabels[kind].toLowerCase()} in ${savedTypeLabels[type].toLowerCase()} yet.`
  }
  if (kind !== 'all') return `No ${savedKindLabels[kind].toLowerCase()} yet.`
  if (type !== 'all') return `Nothing saved in ${savedTypeLabels[type].toLowerCase()} yet.`

  return 'Like or bookmark posts, sessions, projects, threads, and wiki pages to see them here.'
}
