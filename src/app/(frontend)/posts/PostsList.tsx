import Link from 'next/link'
import React from 'react'

import { canContributeContent } from '@/access/roles'
import { Media } from '@/components/Media'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostVisibilityBadge } from '@/components/PostVisibilityBadge'
import type { Category, Post, User } from '@/payload-types'

import PageClient from './page.client'
import { getPostVisibilityQuery, PostVisibilityFilterNav } from './postVisibilityFilters'
import type { PostVisibilityFilter } from '@/utilities/postVisibility'

const POSTS_PER_PAGE = 12

type PostListItem = Pick<
  Post,
  | 'categories'
  | 'contentType'
  | 'createdAt'
  | 'id'
  | 'meta'
  | 'populatedAuthors'
  | 'publishedAt'
  | 'slug'
  | 'title'
  | 'visibility'
>

type PostContentType = NonNullable<Post['contentType']>

const contentTypeLabels: Record<PostContentType, string> = {
  announcement: 'Announcement',
  article: 'Article',
  clip: 'Clip',
  lesson: 'Lesson',
  newsletter: 'Newsletter',
  quote: 'Quote',
  recap: 'Recap',
}

const contentTypeStyles: Record<PostContentType, string> = {
  announcement: 'border-warning/25 bg-warning/10',
  article: 'border-primary/25 bg-primary/10',
  clip: 'border-accent/25 bg-accent/10',
  lesson: 'border-success/25 bg-success/10',
  newsletter: 'border-secondary/30 bg-secondary/20',
  quote: 'border-muted-foreground/25 bg-muted/60',
  recap: 'border-accent/25 bg-accent/10',
}

const contentTypeVisualTones: Record<PostContentType, string> = {
  announcement: 'bg-warning',
  article: 'bg-primary',
  clip: 'bg-accent',
  lesson: 'bg-success',
  newsletter: 'bg-secondary',
  quote: 'bg-muted-foreground',
  recap: 'bg-accent',
}

type PostsListProps = {
  posts: {
    docs: PostListItem[]
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
      <div className="mt-6 grid gap-0">
        {posts.docs.map((post) => (
          <PostRow key={post.id} post={post} />
        ))}
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

const PostRow: React.FC<{ post: PostListItem }> = ({ post }) => {
  const href = `/posts/${post.slug}`
  const contentType = post.contentType || 'article'
  const publishedAt = post.publishedAt || post.createdAt
  const categories = relationDocs<Category>(post.categories)
  const authorNames = post.populatedAuthors?.map((author) => author.name).filter(Boolean) || []
  const description = post.meta?.description?.replace(/\s/g, ' ')

  return (
    <article
      aria-label={post.title}
      className="grid gap-4 border-b border-border/70 py-5 lg:grid-cols-[4rem_14rem_minmax(0,1fr)]"
    >
      <PostDateBadge publishedAt={publishedAt} />
      <PostVisual contentType={contentType} post={post} />
      <div className={`border px-5 py-4 ${contentTypeStyles[contentType]}`}>
        <div className="grid gap-5 xl:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PostVisibilityBadge visibility={post.visibility} />
              <span className="portal-pill">{contentTypeLabels[contentType]}</span>
              <time className="font-mono text-xs text-muted-foreground" dateTime={publishedAt}>
                {formatPostDate(publishedAt)}
              </time>
            </div>
            <h2 className="mt-3 portal-heading-sm">
              <Link className="transition-colors hover:text-primary" href={href}>
                {post.title}
              </Link>
            </h2>
            {authorNames.length ? (
              <p className="mt-2 text-sm text-muted-foreground">By {authorNames.join(', ')}</p>
            ) : null}
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
            {categories.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <span className="portal-pill" key={category.id}>
                    {category.title}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap content-start gap-3 xl:justify-end">
            <Link className="portal-link" href={href}>
              Read post
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

const PostVisual: React.FC<{
  contentType: PostContentType
  post: PostListItem
}> = ({ contentType, post }) => {
  const image = post.meta?.image
  const hasImage = image && typeof image === 'object'

  return (
    <div
      className={`group relative flex aspect-[4/3] min-h-32 items-center justify-center overflow-hidden border border-border/60 ${contentTypeVisualTones[contentType]}`}
    >
      {hasImage ? (
        <Media
          className="absolute inset-0 h-full w-full"
          imgClassName="block h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          resource={image}
          size="224px"
          videoClassName="h-full w-full object-cover"
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-full bg-background/35 ring-1 ring-foreground/20 transition-transform group-hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-9 w-9 object-contain opacity-90"
            src="/assets/symbol-white.svg"
          />
        </span>
      )}
    </div>
  )
}

const PostDateBadge: React.FC<{ publishedAt: string }> = ({ publishedAt }) => {
  const date = new Date(publishedAt)

  return (
    <time className="flex items-baseline gap-2 lg:block" dateTime={publishedAt}>
      <span className="block font-mono text-[10px] uppercase text-muted-foreground">
        {new Intl.DateTimeFormat('en', { timeZone: 'UTC', weekday: 'short' }).format(date)}
      </span>
      <span className="block font-display text-2xl font-bold leading-none text-foreground">
        {new Intl.DateTimeFormat('en', { day: '2-digit', timeZone: 'UTC' }).format(date)}
      </span>
      <span className="font-mono text-[10px] uppercase text-muted-foreground">
        {new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date)}
      </span>
    </time>
  )
}

const formatPostDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value))

const relationDocs = <T extends { id: number | string }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []
