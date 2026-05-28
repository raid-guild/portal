import type { Metadata } from 'next'
import Link from 'next/link'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { Comments } from '@/components/Comments'

import type { Event, Post, Thread } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import PageClient from './page.client'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const url = '/posts/' + slug
  const user = await getCurrentUser()
  const post = await queryPostBySlug({ slug, user })

  if (!post) return <PayloadRedirects url={url} />

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      <PostHero post={post} />

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <PostSourceContext post={post} />
          <RichText className="max-w-[48rem] mx-auto" content={post.content} enableGutter={false} />
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}

          {/* Add Comments section */}
          <div className="max-w-[48rem] mx-auto mt-16">
            <Comments postId={typeof post.id === 'string' ? parseInt(post.id, 10) : post.id} />
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const post = await queryPostBySlug({ slug, user })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(
  async ({
    slug,
    user,
  }: {
    slug: string
    user: Awaited<ReturnType<typeof getCurrentUser>>
  }) => {
    const { isEnabled: draft } = await draftMode()

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'posts',
      draft,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      user: user || undefined,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  },
)

const PostSourceContext: React.FC<{ post: Post }> = ({ post }) => {
  const sourceSession = typeof post.sourceSession === 'object' ? post.sourceSession : null
  const parentThread = typeof post.parentThread === 'object' ? post.parentThread : null
  const wikiTopics = post.wikiCandidateTopics?.map((item) => item.topic).filter(Boolean) || []

  if (!sourceSession && !parentThread && !wikiTopics.length && !post.wikiCandidate) return null

  return (
    <aside className="mx-auto mb-8 max-w-[48rem] border border-border bg-card/25 p-5">
      <p className="portal-kicker">Source Context</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {sourceSession ? <SourceSessionLink event={sourceSession} /> : null}
        {parentThread ? <ThreadPill thread={parentThread} /> : null}
        {wikiTopics.map((topic) => (
          <span className="portal-pill" key={topic}>
            Wiki candidate: {topic}
          </span>
        ))}
        {!wikiTopics.length && post.wikiCandidate ? (
          <span className="portal-pill">Wiki candidate</span>
        ) : null}
      </div>
    </aside>
  )
}

const SourceSessionLink: React.FC<{ event: Event }> = ({ event }) => (
  <Link className="portal-link" href={`/events/${event.id}`}>
    Source session: {event.title}
  </Link>
)

const ThreadPill: React.FC<{ thread: Thread }> = ({ thread }) => (
  <span className="portal-pill">Thread: {thread.title}</span>
)
