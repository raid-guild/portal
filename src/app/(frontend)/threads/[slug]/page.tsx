import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  ActivityItem,
  ContributionRequest,
  Event,
  Post,
  Profile,
  Project,
  Spotlight,
  Thread,
} from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { toSafeURL } from '@/utilities/safeURL'

export const dynamic = 'force-dynamic'

type ThreadPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ThreadDetailPage({ params }: ThreadPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const thread = await getThreadBySlug(slug, user)

  if (!thread) notFound()

  const [activeSpotlights, activityItems, contributionRequests, pastEvents, posts, upcomingEvents] =
    await Promise.all([
      getActiveSpotlightsForThread(thread.id, user),
      getActivityItemsForThread(thread.id, user),
      getContributionRequestsForThread(thread.id, user),
      getPastEventsForThread(thread.id, user),
      getPostsForThread(thread.id, user),
      getUpcomingEventsForThread(thread.id, user),
    ])
  const projects = relationDocs<Project>(thread.relatedProjects)
  const participants = relationDocs<Profile>(thread.participants)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="portal-kicker">Thread</p>
          <h1 className="mt-3 portal-title">{thread.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            {thread.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="portal-pill">{thread.threadStatus}</span>
            {thread.lastActiveAt ? (
              <span className="text-sm text-muted-foreground">
                Updated {formatDate(thread.lastActiveAt)}
              </span>
            ) : null}
          </div>
        </div>
        <aside className="portal-panel">
          <p className="portal-heading-sm">Thread links</p>
          {thread.links?.length ? (
            <div className="mt-4 grid gap-3">
              {thread.links.map((link) => (
                <SafeTextLink href={link.url} key={link.id || link.url} label={link.label} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              No external links have been added yet.
            </p>
          )}
        </aside>
      </section>

      {activeSpotlights.length ? (
        <section className="mt-12 border border-primary/60 bg-card/70 p-6 shadow-[0_18px_60px_rgba(178,82,58,0.16)]">
          <p className="portal-kicker text-primary">Spotlight</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {activeSpotlights.map((spotlight) => (
              <article className="border border-primary/30 bg-background/50 p-4" key={spotlight.id}>
                <p className="portal-kicker">{spotlight.kind}</p>
                <h2 className="mt-2 portal-heading-sm">{spotlight.title}</h2>
                {spotlight.summary ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {spotlight.summary}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <ThreadPanel title="Upcoming Sessions">
          {upcomingEvents.length ? (
            <div className="grid gap-4">
              {upcomingEvents.slice(0, 6).map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <EmptyState text="No upcoming sessions are linked to this thread." />
          )}
        </ThreadPanel>

        <ThreadPanel title="Past Sessions">
          {pastEvents.length ? (
            <div className="grid gap-4">
              {pastEvents.slice(0, 6).map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <EmptyState text="No past sessions are linked to this thread yet." />
          )}
        </ThreadPanel>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <ThreadPanel title="Posts">
          {posts.length ? (
            <div className="grid gap-4">
              {posts.slice(0, 8).map((post) => (
                <Link
                  className="block portal-card transition-colors hover:bg-card"
                  href={`/posts/${post.slug}`}
                  key={post.id}
                >
                  <p className="portal-kicker">{post.contentType || 'post'}</p>
                  <h3 className="mt-2 font-bold text-foreground">{post.title}</h3>
                  {post.meta?.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {post.meta.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No published posts are attached to this thread." />
          )}
        </ThreadPanel>

        <ThreadPanel title="Activity">
          {activityItems.length ? (
            <div className="grid gap-4">
              {activityItems.slice(0, 8).map((item) => (
                <article className="portal-card" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="portal-kicker">{item.activityType}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.happenedAt)}
                    </p>
                  </div>
                  <h3 className="mt-2 font-bold text-foreground">{item.title}</h3>
                  {item.body ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="No activity items are attached to this thread." />
          )}
        </ThreadPanel>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <ThreadPanel title="Projects">
          {projects.length ? (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Link
                  className="block portal-card transition-colors hover:bg-card"
                  href={`/projects/${project.slug}`}
                  key={project.id}
                >
                  <p className="portal-kicker">{project.projectStatus || 'project'}</p>
                  <h3 className="mt-2 font-bold text-foreground">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {project.summary}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No projects are linked to this thread." />
          )}
        </ThreadPanel>

        <ThreadPanel title="Contribution Requests">
          {contributionRequests.length ? (
            <div className="grid gap-4">
              {contributionRequests.map((request) => (
                <Link
                  className="block portal-card transition-colors hover:bg-card"
                  href={`/requests/${request.slug}`}
                  key={request.id}
                >
                  <p className="portal-kicker">{request.requestType}</p>
                  <h3 className="mt-2 font-bold text-foreground">{request.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {request.summary}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No open contribution requests are attached to this thread." />
          )}
        </ThreadPanel>
      </section>

      <section className="mt-12">
        <ThreadPanel title="People">
          {participants.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {participants.map((profile) => (
                <Link
                  className="block border border-border bg-card/20 p-4 transition-colors hover:bg-card"
                  href={`/members/${profile.handle}`}
                  key={profile.id}
                >
                  <h3 className="font-bold text-foreground">{profile.displayName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">@{profile.handle}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No participants are attached to this thread." />
          )}
        </ThreadPanel>
      </section>
    </main>
  )
}

export async function generateMetadata({ params }: ThreadPageProps): Promise<Metadata> {
  const { slug } = await params
  const thread = await getThreadBySlug(slug, null)

  if (!thread) {
    return {
      title: 'Thread',
    }
  }

  return {
    description: thread.summary,
    openGraph: mergeOpenGraph({
      description: thread.summary,
      title: thread.title,
      url: `/threads/${thread.slug}`,
    }),
    title: thread.title,
  }
}

const getThreadBySlug = async (
  slug: string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Thread | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'threads',
    depth: 2,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: user || undefined,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}

const getActiveSpotlightsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Spotlight[]> => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'spotlights',
    depth: 1,
    draft: false,
    limit: 5,
    overrideAccess: false,
    pagination: false,
    sort: '-priority',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          targetThread: {
            equals: threadID,
          },
        },
        {
          or: [
            {
              startsAt: {
                exists: false,
              },
            },
            {
              startsAt: {
                less_than_equal: now,
              },
            },
          ],
        },
        {
          or: [
            {
              expiresAt: {
                exists: false,
              },
            },
            {
              expiresAt: {
                greater_than: now,
              },
            },
          ],
        },
      ],
    },
  })

  return result.docs
}

const getUpcomingEventsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Event[]> => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 12,
    overrideAccess: false,
    pagination: false,
    sort: 'startsAt',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          relatedThreads: {
            in: [threadID],
          },
        },
        {
          startsAt: {
            greater_than_equal: now,
          },
        },
      ],
    },
  })

  return result.docs
}

const getPastEventsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Event[]> => {
  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'events',
    depth: 1,
    draft: false,
    limit: 12,
    overrideAccess: false,
    pagination: false,
    sort: '-startsAt',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          relatedThreads: {
            in: [threadID],
          },
        },
        {
          startsAt: {
            less_than: now,
          },
        },
      ],
    },
  })

  return result.docs
}

const getPostsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Post[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    draft: false,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          parentThread: {
            equals: threadID,
          },
        },
      ],
    },
  })

  return result.docs
}

const getActivityItemsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<ActivityItem[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'activityItems',
    depth: 1,
    draft: false,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: '-happenedAt',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          relatedThread: {
            equals: threadID,
          },
        },
      ],
    },
  })

  return result.docs
}

const getContributionRequestsForThread = async (
  threadID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<ContributionRequest[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'contributionRequests',
    depth: 1,
    draft: false,
    limit: 10,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    user: user || undefined,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          requestStatus: {
            in: ['open', 'in_discussion'],
          },
        },
        {
          relatedThreads: {
            in: [threadID],
          },
        },
      ],
    },
  })

  return result.docs
}

const EventCard: React.FC<{ event: Event }> = ({ event }) => (
  <Link className="block portal-card transition-colors hover:bg-card" href={`/events/${event.id}`}>
    <p className="portal-kicker">{event.sessionType}</p>
    <h3 className="mt-2 font-bold text-foreground">{event.title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(event.startsAt)}</p>
    {event.summary ? (
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{event.summary}</p>
    ) : null}
    {event.recordingURL ||
    event.transcriptArtifactURL ||
    event.summaryArtifactURL ||
    event.sourceArtifactURL ||
    event.resources?.length ? (
      <p className="mt-3 portal-kicker text-primary">Resources attached</p>
    ) : null}
  </Link>
)

const ThreadPanel: React.FC<{ children: React.ReactNode; title: string }> = ({
  children,
  title,
}) => (
  <section>
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="border border-border bg-card/20 p-4 text-sm leading-6 text-muted-foreground">
    {text}
  </p>
)

const SafeTextLink: React.FC<{ href?: string | null; label: string }> = ({ href, label }) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) return <span className="text-sm text-muted-foreground">{label}</span>

  const isExternal = safeURL.startsWith('http')

  return (
    <Link
      className="portal-link text-sm"
      href={safeURL}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}
