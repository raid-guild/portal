import Link from 'next/link'
import React from 'react'

import { canContributeContent } from '@/access/roles'
import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardPostData } from '@/components/Card'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import type { User } from '@/payload-types'

import PageClient from './page.client'
import {
  getPostVisibilityQuery,
  PostVisibilityFilterNav,
} from './postVisibilityFilters'
import type { PostVisibilityFilter } from '@/utilities/postVisibility'

const POSTS_PER_PAGE = 12

type PostsListProps = {
  posts: {
    docs: CardPostData[]
    page?: number | null
    totalDocs: number
    totalPages: number
  }
  user: User | null
  visibility: PostVisibilityFilter
}

export const PostsList: React.FC<PostsListProps> = ({ posts, user, visibility }) => (
  <main className="container pb-24 pt-12">
    <PageClient />

    <section className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-4 portal-kicker">Posts</p>
        <h1 className="portal-title">Community posts</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Published updates, field notes, and useful context from work happening across the
          RaidGuild community.
        </p>
      </div>
      {canContributeContent(user) ? (
        <Link className="portal-admin-link" href="/admin/collections/posts/create">
          Create post
        </Link>
      ) : null}
    </section>

    <div className="mt-10">
      <PostVisibilityFilterNav activeVisibility={visibility} user={user} />
    </div>

    <PageRange
      className="mt-8 text-sm text-muted-foreground"
      collectionLabels={{ plural: 'Posts', singular: 'Post' }}
      currentPage={posts.page || undefined}
      limit={POSTS_PER_PAGE}
      totalDocs={posts.totalDocs}
    />

    {posts.docs.length ? (
      <div className="mt-6">
        <CollectionArchive contained={false} posts={posts.docs} />
      </div>
    ) : (
      <section className="mt-6 portal-panel">
        <h2 className="portal-heading-sm">No posts match this view.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Try another visibility filter or check back after more posts are published.
        </p>
      </section>
    )}

    {posts.totalPages > 1 && posts.page ? (
      <Pagination
        page={posts.page}
        queryString={getPostVisibilityQuery(visibility)}
        totalPages={posts.totalPages}
      />
    ) : null}
  </main>
)
