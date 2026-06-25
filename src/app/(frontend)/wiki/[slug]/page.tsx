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
  WikiTopic,
} from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { toSafeURL } from '@/utilities/safeURL'
import { SessionDateTime } from '../../_components/SessionDateTime'
import { WikiArticleGenerateControl } from '../_components/WikiArticleGenerateControl'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

type TopicContextTopic = {
  articleHref: string | null
  id: number
  kind: WikiTopic['kind']
  reviewStatus: WikiTopic['reviewStatus']
  slug?: string | null
  summary?: string | null
  title: string
}

type WikiTopicContext = {
  children: TopicContextTopic[]
  current: TopicContextTopic
  parentPath: TopicContextTopic[]
  possible: TopicContextTopic[]
  related: TopicContextTopic[]
  siblings: TopicContextTopic[]
}

export default async function WikiDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const page = await getWikiPageBySlug(slug, user)

  if (!page) notFound()

  const canManageWiki = hasRole(user, ['admin', 'editor', 'agent'])
  const topicContext = await getWikiTopicContextForPage(page, user)
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
          {topicContext ? <TopicContextPanel context={topicContext} /> : null}

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
            equals: 'reviewed',
          },
        },
      ],
    },
  })

  return result.docs[0] || null
}

const getWikiTopicContextForPage = async (
  page: WikiPage,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<WikiTopicContext | null> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'wikiTopics',
    depth: 2,
    limit: 300,
    overrideAccess: false,
    pagination: false,
    sort: 'sortOrder,title',
    user: user || undefined,
    where: {
      reviewStatus: {
        not_equals: 'archived',
      },
    },
  })
  const topics = result.docs
  const current =
    topics.find((topic) => relationID(topic.canonicalPage) === page.id) ||
    topics.find((topic) => relationIDs(topic.relatedPages).includes(page.id))

  if (!current) return null

  const currentParentID = relationID(current.parentTopic)
  const currentID = current.id
  const parentPath = getTopicParentPath(current, topics)
  const children = topics.filter((topic) => relationID(topic.parentTopic) === currentID)
  const siblings = currentParentID
    ? topics.filter(
        (topic) => topic.id !== currentID && relationID(topic.parentTopic) === currentParentID,
      )
    : []
  const relatedIDs = new Set(relationIDs(current.relatedTopics))
  const related = topics.filter((topic) => relatedIDs.has(topic.id))
  const possible = [...children, ...related, ...siblings].filter(
    (topic) => topic.kind === 'possible',
  )

  return {
    children: uniqueTopics(children).map(topicContextSummary),
    current: topicContextSummary(current),
    parentPath: parentPath.map(topicContextSummary),
    possible: uniqueTopics(possible).map(topicContextSummary),
    related: uniqueTopics(related).map(topicContextSummary),
    siblings: uniqueTopics(siblings).map(topicContextSummary),
  }
}

const getTopicParentPath = (topic: WikiTopic, topics: WikiTopic[]): WikiTopic[] => {
  const byID = new Map(topics.map((item) => [item.id, item]))
  const path: WikiTopic[] = []
  let parentID = relationID(topic.parentTopic)
  const seen = new Set<number>()

  while (parentID && !seen.has(parentID)) {
    seen.add(parentID)
    const parent = byID.get(parentID)
    if (!parent) break
    path.unshift(parent)
    parentID = relationID(parent.parentTopic)
  }

  return path
}

const topicContextSummary = (topic: WikiTopic): TopicContextTopic => {
  const canonicalPage = relationDoc<WikiPage>(topic.canonicalPage)
  const relatedPage = relationDocs<WikiPage>(topic.relatedPages).find((page) => page.slug)
  const page = canonicalPage || relatedPage

  return {
    articleHref: page?.slug ? `/wiki/${page.slug}` : null,
    id: topic.id,
    kind: topic.kind,
    reviewStatus: topic.reviewStatus,
    slug: topic.slug,
    summary: topic.summary,
    title: topic.title,
  }
}

const uniqueTopics = (topics: WikiTopic[]): WikiTopic[] => {
  const seen = new Set<number>()

  return topics.filter((topic) => {
    if (seen.has(topic.id)) return false
    seen.add(topic.id)
    return true
  })
}

const relationDoc = <T extends { id: number }>(item?: number | T | null): T | null =>
  item && typeof item === 'object' ? item : null

const relationID = (item?: number | { id: number } | null): number | null =>
  typeof item === 'number' ? item : item?.id || null

const relationIDs = (items?: (number | { id: number })[] | null): number[] =>
  (items || [])
    .map(relationID)
    .filter((id): id is number => Number.isSafeInteger(id))

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

const TopicContextPanel = ({ context }: { context: WikiTopicContext }) => (
  <Panel title="Topic Context">
    <div className="space-y-5">
      {context.parentPath.length ? (
        <div>
          <p className="portal-kicker">Path</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {context.parentPath.map((topic) => (
              <TopicChip key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      ) : null}

      <article className="border border-border bg-card/20 p-4">
        <p className="portal-kicker">{context.current.kind}</p>
        <h3 className="mt-2 font-bold">{context.current.title}</h3>
        {context.current.summary ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {context.current.summary}
          </p>
        ) : null}
        <Link
          className="portal-admin-link mt-4 inline-flex"
          href={`/wiki/explore?topic=${context.current.id}`}
        >
          Open in graph
        </Link>
      </article>

      <TopicContextList title="Deeper Topics" topics={context.children} />
      <TopicContextList title="Nearby Topics" topics={context.related} />
      <TopicContextList title="Sibling Topics" topics={context.siblings} />
      <TopicContextList title="Possible Articles" topics={context.possible} emphasizeGenerate />
    </div>
  </Panel>
)

const TopicContextList = ({
  emphasizeGenerate = false,
  title,
  topics,
}: {
  emphasizeGenerate?: boolean
  title: string
  topics: TopicContextTopic[]
}) => (
  <div>
    <p className="portal-kicker">{title}</p>
    {topics.length ? (
      <div className="mt-3 grid gap-3">
        {topics.map((topic) => (
          <TopicContextRow
            emphasizeGenerate={emphasizeGenerate}
            key={`${title}-${topic.id}`}
            topic={topic}
          />
        ))}
      </div>
    ) : (
      <p className="mt-2 text-sm leading-6 text-muted-foreground">No topics linked yet.</p>
    )}
  </div>
)

const TopicContextRow = ({
  emphasizeGenerate,
  topic,
}: {
  emphasizeGenerate: boolean
  topic: TopicContextTopic
}) => (
  <article className="border border-border bg-card/20 p-4">
    <div className="flex flex-wrap items-center gap-2">
      <span className="portal-pill">{topic.kind}</span>
      <span className="portal-pill">{topic.reviewStatus}</span>
    </div>
    <h3 className="mt-3 font-bold">{topic.title}</h3>
    {topic.summary ? (
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{topic.summary}</p>
    ) : null}
    <div className="mt-4 flex flex-wrap gap-2">
      {topic.articleHref ? (
        <Link className="portal-admin-link inline-flex" href={topic.articleHref}>
          Read article
        </Link>
      ) : topic.kind === 'category' ? (
        <Link className="portal-admin-link inline-flex" href={`/wiki/explore?topic=${topic.id}`}>
          Open in graph
        </Link>
      ) : (
        <WikiArticleGenerateControl
          className={emphasizeGenerate ? '' : 'opacity-95'}
          compact
          topicID={topic.id}
        />
      )}
    </div>
  </article>
)

const TopicChip = ({ topic }: { topic: TopicContextTopic }) =>
  topic.articleHref ? (
    <Link className="portal-pill transition-colors hover:bg-card" href={topic.articleHref}>
      {topic.title}
    </Link>
  ) : (
    <Link className="portal-pill transition-colors hover:bg-card" href={`/wiki/explore?topic=${topic.id}`}>
      {topic.title}
    </Link>
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
