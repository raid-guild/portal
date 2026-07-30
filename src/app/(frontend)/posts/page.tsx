import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getPostVisibilityWhere, normalizePostVisibilityFilter } from './postVisibilityFilters'
import { PostsList } from './PostsList'

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
      contentType: true,
      createdAt: true,
      title: true,
      slug: true,
      categories: true,
      meta: true,
      populatedAuthors: true,
      publishedAt: true,
      visibility: true,
    },
    sort: '-publishedAt',
    user: user || undefined,
    where: getPostVisibilityWhere(visibility),
  })

  return <PostsList posts={posts} user={user} visibility={visibility} />
}

export function generateMetadata(): Metadata {
  return {
    title: `RaidGuild Portal Posts`,
  }
}
