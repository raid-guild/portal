import type { Metadata } from 'next/types'
import Link from 'next/link'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { canContributeContent } from '@/access/roles'
import {
  getPostVisibilityQuery,
  getPostVisibilityWhere,
  normalizePostVisibilityFilter,
  PostVisibilityFilterNav,
} from './postVisibilityFilters'

export const dynamic = 'force-dynamic'

type Args = {
  searchParams?: Promise<{
    visibility?: string | string[]
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const user = await getCurrentUser()
  const searchParams = await searchParamsPromise
  const visibility = normalizePostVisibilityFilter(searchParams, user)

  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      visibility: true,
    },
    sort: '-publishedAt',
    user: user || undefined,
    where: getPostVisibilityWhere(visibility),
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Posts</h1>
          </div>
          {canContributeContent(user) ? (
            <Link className="portal-admin-link" href="/admin/collections/posts/create">
              Create post
            </Link>
          ) : null}
        </div>
      </div>

      <div className="container mb-8">
        <PostVisibilityFilterNav activeVisibility={visibility} user={user} />
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination
            page={posts.page}
            queryString={getPostVisibilityQuery(visibility)}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `RaidGuild Portal Posts`,
  }
}
