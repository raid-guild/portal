import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getPostVisibilityWhere, normalizePostVisibilityFilter } from '../../postVisibilityFilters'
import { PostsList } from '../../PostsList'
import { generatePostsMetadata } from '@/utilities/postsMetadata'

export const dynamic = 'force-dynamic'
const POSTS_PER_PAGE = 12

type Args = {
  params: Promise<{
    pageNumber: string
  }>
  searchParams?: Promise<{
    visibility?: string | string[]
  }>
}

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { pageNumber } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  const user = await getCurrentUser()
  const searchParams = await searchParamsPromise
  const visibility = normalizePostVisibilityFilter(searchParams, user)

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber) || sanitizedPageNumber < 1) notFound()

  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    depth: 1,
    limit: POSTS_PER_PAGE,
    overrideAccess: false,
    page: sanitizedPageNumber,
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

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return generatePostsMetadata(pageNumber)
}
