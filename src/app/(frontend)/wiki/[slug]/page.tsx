import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { hasRole } from '@/access/roles'
import RichText from '@/components/RichText'
import type {
  ActivityItem,
  Event,
  Post,
  Profile,
  Project,
  Thread,
  WikiPage,
} from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { toSafeURL } from '@/utilities/safeURL'
import { SessionDateTime } from '../../_components/SessionDateTime'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export default async function WikiDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const page = await getWikiPageBySlug(slug, user)

  if (!page) notFound()

  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])
  const sourceSessions = relationDocs<Event>(page.sourceSessions)
  const relatedPosts = relationDocs<Post>(page.relatedPosts)
  const relatedProjects = relationDocs<Project>(page.relatedProjects)
  const relatedThreads = relationDocs<Thread>(page.relatedThreads)
  const relatedProfiles = relationDocs<Profile>(page.relatedProfiles)
  const relatedActivityItems = relationDocs<ActivityItem>(page.relatedActivityItems)

  return (
    <main className="container pb-24 pt-12">
      <Link className="portal-link" href="/wiki">
        Back to wiki
      </Link>

      <section className="mt-8 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="portal-kicker">Wiki page</p>
          <h1 className="mt-3 portal-title">{page.title}</h1>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-7 text-muted-foreground">
            {page.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="portal-pill">{reviewStatusLabels[page.reviewStatus]}</span>
            <span className="portal-pill">Confidence: {page.confidence}</span>
            <span className="portal-pill">{page.visibility}</span>
          </div>
        </div>
        <aside className="portal-panel text-sm">
          <p className="portal-heading-sm">Review state</p>
          <p className="mt-3 text-muted-foreground">
            Last reviewed: {formatDate(page.lastReviewedAt) || 'Not reviewed yet'}
          </p>
          <p className="mt-2 text-muted-foreground">
            Last refreshed: {formatDate(page.lastRefreshedAt) || 'Not refreshed yet'}
          </p>
          {canManageWiki ? (
            <Link className="portal-admin-link mt-5 inline-flex" href={`/admin/collections/wikiPages/${page.id}`}>
              Edit wiki page
            </Link>
          ) : null}
        </aside>
      </section>

      {page.body ? <RichText className="mt-10" content={page.body} enableGutter={false} /> : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Key Claims">
            {page.keyClaims?.length ? (
              <div className="grid gap-3">
                {page.keyClaims.map((claim) => (
                  <article className="border border-border bg-card/20 p-4" key={claim.id || claim.claim}>
                    <p className="text-sm leading-6 text-muted-foreground">{claim.claim}</p>
                    {claim.sourceLabel ? (
                      <p className="mt-3 portal-kicker">{claim.sourceLabel}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No key claims have been added yet." />
            )}
          </Panel>

          <Panel title="Source Sessions">
            {sourceSessions.length ? (
              <div className="grid gap-3">
                {sourceSessions.map((event) => (
                  <Link
                    className="block border border-border bg-card/20 p-4 transition-colors hover:bg-card"
                    href={`/events/${event.id}`}
                    key={event.id}
                  >
                    <p className="portal-kicker">{event.sessionType || 'session'}</p>
                    <h3 className="mt-2 font-bold">{event.title}</h3>
                    <SessionDateTime
                      className="mt-2 block text-sm text-muted-foreground"
                      dateStyle="medium"
                      endsAt={event.endsAt}
                      startsAt={event.startsAt}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState text="No source sessions are linked yet." />
            )}
          </Panel>

          <Panel title="Open Questions">
            {page.openQuestions?.length ? (
              <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                {page.openQuestions.map((item) => (
                  <li key={item.id || item.question}>{item.question}</li>
                ))}
              </ul>
            ) : (
              <EmptyState text="No open questions have been added yet." />
            )}
          </Panel>

          <Panel title="Prompts">
            {page.prompts?.length ? (
              <div className="grid gap-3">
                {page.prompts.map((prompt) => (
                  <article className="border border-border bg-card/20 p-4" key={prompt.id || prompt.label}>
                    <p className="portal-kicker">{prompt.label}</p>
                    <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {prompt.prompt}
                    </pre>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No prompts have been added yet." />
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <LinkPanel items={page.furtherReading} title="Further Reading" />
          <LinkPanel items={page.papers} title="Papers" />
          <LinkPanel items={page.tools} title="Tools" />

          <Panel title="Related Topics">
            <TopicList items={page.relatedTopics} />
          </Panel>

          <Panel title="Possible Topics">
            <TopicList emptyText="No possible topic links have been recorded." items={page.possibleTopics} />
          </Panel>

          <Panel title="Source Artifacts">
            {page.sourceArtifacts?.length ? (
              <div className="grid gap-3">
                {page.sourceArtifacts.map((artifact) => (
                  <article className="border border-border bg-card/20 p-4" key={artifact.id || artifact.label}>
                    <p className="portal-kicker">{artifact.sourceType || 'source'}</p>
                    <h3 className="mt-2 font-bold">{artifact.label}</h3>
                    {artifact.artifactID ? (
                      <p className="mt-2 text-xs text-muted-foreground">{artifact.artifactID}</p>
                    ) : null}
                    <SafeTextLink href={artifact.url} label="Open source" />
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState text="No source artifacts have been linked yet." />
            )}
          </Panel>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <RelationPanel
          items={relatedPosts.map((post) => ({
            href: post.slug ? `/posts/${post.slug}` : null,
            kicker: post.contentType || 'post',
            summary: post.meta?.description,
            title: post.title,
          }))}
          title="Related Posts"
        />
        <RelationPanel
          items={relatedProjects.map((project) => ({
            href: project.slug ? `/projects/${project.slug}` : null,
            kicker: project.projectStatus || 'project',
            summary: project.summary,
            title: project.title,
          }))}
          title="Related Projects"
        />
        <RelationPanel
          items={relatedThreads.map((thread) => ({
            href: thread.slug ? `/threads/${thread.slug}` : null,
            kicker: thread.threadStatus || 'thread',
            summary: thread.summary,
            title: thread.title,
          }))}
          title="Related Threads"
        />
        <RelationPanel
          items={relatedProfiles.map((profile) => ({
            href: profile.handle ? `/members/${profile.handle}` : null,
            kicker: 'profile',
            summary: profile.bio,
            title: profile.displayName,
          }))}
          title="Related Profiles"
        />
        <Panel title="Related Activity">
          {relatedActivityItems.length ? (
            <div className="grid gap-3">
              {relatedActivityItems.map((item) => (
                <article className="border border-border bg-card/20 p-4" key={item.id}>
                  <p className="portal-kicker">{item.activityType}</p>
                  <h3 className="mt-2 font-bold">{item.title}</h3>
                  {item.body ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="No related activity has been linked yet." />
          )}
        </Panel>
      </section>
    </main>
  )
}

const getWikiPageBySlug = async (
  slug: string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WikiPage | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'wikiPages',
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
        {
          reviewStatus: {
            not_equals: 'archived',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}

const Panel = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="portal-panel">
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const EmptyState = ({ text }: { text: string }) => (
  <p className="text-sm leading-6 text-muted-foreground">{text}</p>
)

const LinkPanel = ({
  items,
  title,
}: {
  items?: { id?: string | null; label: string; note?: string | null; url?: string | null }[] | null
  title: string
}) => (
  <Panel title={title}>
    {items?.length ? (
      <div className="grid gap-3">
        {items.map((item) => (
          <article className="border border-border bg-card/20 p-4" key={item.id || item.label}>
            <h3 className="font-bold">{item.label}</h3>
            {item.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p> : null}
            <SafeTextLink href={item.url} label="Open link" />
          </article>
        ))}
      </div>
    ) : (
      <EmptyState text={`No ${title.toLowerCase()} have been added yet.`} />
    )}
  </Panel>
)

const RelationPanel = ({
  items,
  title,
}: {
  items: { href: string | null; kicker: string; summary?: string | null; title: string }[]
  title: string
}) => (
  <Panel title={title}>
    {items.length ? (
      <div className="grid gap-3">
        {items.map((item) =>
          item.href ? (
            <Link
              className="block border border-border bg-card/20 p-4 transition-colors hover:bg-card"
              href={item.href}
              key={`${title}-${item.title}`}
            >
              <p className="portal-kicker">{item.kicker}</p>
              <h3 className="mt-2 font-bold">{item.title}</h3>
              {item.summary ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              ) : null}
            </Link>
          ) : (
            <article className="border border-border bg-card/20 p-4" key={`${title}-${item.title}`}>
              <p className="portal-kicker">{item.kicker}</p>
              <h3 className="mt-2 font-bold">{item.title}</h3>
            </article>
          ),
        )}
      </div>
    ) : (
      <EmptyState text={`No ${title.toLowerCase()} have been linked yet.`} />
    )}
  </Panel>
)

const TopicList = ({
  emptyText = 'No related topics have been recorded.',
  items,
}: {
  emptyText?: string
  items?: { id?: string | null; topic: string }[] | null
}) =>
  items?.length ? (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="portal-pill" key={item.id || item.topic}>
          {item.topic}
        </span>
      ))}
    </div>
  ) : (
    <EmptyState text={emptyText} />
  )

const SafeTextLink = ({ href, label }: { href?: string | null; label: string }) => {
  const safeHref = toSafeURL(href)

  if (!safeHref) return null

  return (
    <a
      className="portal-link mt-3 inline-flex text-sm"
      href={safeHref}
      rel="noreferrer"
      target="_blank"
    >
      {label}
    </a>
  )
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

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = '' } = await params
  const page = await getWikiPageBySlug(slug, null)

  if (!page) {
    return {
      title: 'Wiki Page',
    }
  }

  return {
    title: `${page.title} | RaidGuild Wiki`,
    description: page.summary,
    openGraph: mergeOpenGraph({
      title: page.title,
      description: page.summary,
      url: `/wiki/${page.slug}`,
    }),
  }
}
