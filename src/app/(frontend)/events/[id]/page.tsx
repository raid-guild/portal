import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Event, Post, Profile, Project, Thread } from '@/payload-types'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    id?: string
  }>
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date))
}

const sessionTypeLabels: Record<NonNullable<Event['sessionType']>, string> = {
  'all-hands': 'All hands',
  brownbag: 'Brownbag',
  demo: 'Demo',
  fireside: 'Fireside',
  pitch: 'Pitch',
  workshop: 'Workshop',
}

const sourceStatusLabels: Record<NonNullable<Event['sourceStatus']>, string> = {
  archived: 'Archived',
  processed: 'Processed',
  recorded: 'Recorded',
  scheduled: 'Scheduled',
  summarized: 'Summarized',
}

const contentTypeLabels: Record<string, string> = {
  announcement: 'Announcements',
  article: 'Articles',
  clip: 'Clips',
  lesson: 'Lessons',
  newsletter: 'Newsletter',
  quote: 'Quotes',
  recap: 'Recaps',
}

const contentTypeOrder = [
  'recap',
  'lesson',
  'quote',
  'clip',
  'newsletter',
  'announcement',
  'article',
]

export default async function SessionDetailPage({ params: paramsPromise }: Args) {
  const { id = '' } = await paramsPromise
  const user = await getCurrentUser()
  const event = await getEvent(id, user)

  if (!event) notFound()

  const canViewFullDetails = Boolean(user)
  const posts = canViewFullDetails ? await getDerivedPosts(event.id, user) : []
  const startsAt = new Date(event.startsAt)
  const isPast = startsAt.getTime() < Date.now()
  const projects = relationDocs<Project>(event.relatedProjects)
  const threads = relationDocs<Thread>(event.relatedThreads)
  const hostProfiles = relationDocs<Profile>(event.hostProfiles)
  const speakerProfiles = relationDocs<Profile>(event.speakerProfiles)
  const relatedProfiles = relationDocs<Profile>(event.relatedProfiles)
  const fallbackSpeaker = typeof event.speaker === 'object' ? event.speaker : null
  const displayProfiles = uniqueProfiles([
    ...hostProfiles,
    ...speakerProfiles,
    ...relatedProfiles,
    ...(fallbackSpeaker ? [fallbackSpeaker] : []),
  ])
  const sourceLinks = [
    { href: event.recordingURL, label: 'Recording' },
    { href: event.summaryArtifactURL, label: 'Summary artifact' },
    { href: event.transcriptArtifactURL, label: 'Transcript artifact' },
    { href: event.sourceArtifactURL, label: 'Source artifact' },
  ]
  const socialLinks = event.linkedSocialPosts || []
  const wikiTopics = event.wikiCandidateTopics?.map((item) => item.topic).filter(Boolean) || []

  return (
    <main className="container pb-24 pt-12">
      <Link className="portal-link" href="/events">
        Back to sessions
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="portal-pill">
              {sessionTypeLabels[event.sessionType || 'brownbag']}
            </span>
            {event.sourceStatus ? (
              <span className="portal-pill">{sourceStatusLabels[event.sourceStatus]}</span>
            ) : null}
            <span className="text-sm text-muted-foreground">{event.visibility}</span>
          </div>
          <h1 className="portal-title mt-5">{event.title}</h1>
          {event.summary ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              {event.summary}
            </p>
          ) : null}
        </div>

        <aside className="border border-border bg-card/30 p-5">
          <p className="portal-kicker">Session</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {formatDateTime(event.startsAt)}
          </p>
          {event.locationLabel ? (
            <p className="mt-3 text-sm text-muted-foreground">{event.locationLabel}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {!isPast ? <SafeLink href={event.joinURL} label="Join" /> : null}
            <SafeLink href={event.calendarURL || getCalendarFallbackURL(event)} label="Calendar" />
            <SafeLink href={event.discordEventURL} label="Discord" />
          </div>
        </aside>
      </section>

      {displayProfiles.length ? (
        <Section title={event.sessionType === 'fireside' ? 'Guests And Hosts' : 'People'}>
          <div className="flex flex-wrap gap-2">
            {displayProfiles.map((profile) => (
              <ProfileLink key={profile.id} profile={profile} />
            ))}
          </div>
        </Section>
      ) : null}

      {!user ? <PortalSessionCTA eventID={event.id} /> : null}

      {canViewFullDetails && isPast && sourceLinks.some((link) => link.href) ? (
        <Section title="Source Material">
          <div className="flex flex-wrap gap-3">
            {sourceLinks.map((link) => (
              <SafeLink href={link.href} key={link.label} label={link.label} />
            ))}
          </div>
          {event.sourceArtifactID ? (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Prism artifact: {event.sourceArtifactID}
            </p>
          ) : null}
        </Section>
      ) : null}

      {canViewFullDetails && posts.length ? (
        <Section title="Derived Posts">
          <div className="grid gap-4 md:grid-cols-2">
            {groupPosts(posts).map(([contentType, group]) => (
              <div className="border border-border bg-card/20 p-5" key={contentType}>
                <p className="portal-kicker">{contentTypeLabels[contentType] || contentType}</p>
                <div className="mt-4 grid gap-3">
                  {group.map((post) => (
                    <Link
                      className="portal-link text-base"
                      href={`/posts/${post.slug}`}
                      key={post.id}
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {canViewFullDetails && (wikiTopics.length || event.wikiCandidate) ? (
        <Section title="Wiki Candidates">
          {wikiTopics.length ? (
            <div className="flex flex-wrap gap-2">
              {wikiTopics.map((topic) => (
                <span className="portal-pill" key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This session has been marked as a wiki candidate.
            </p>
          )}
        </Section>
      ) : null}

      {canViewFullDetails && (projects.length || threads.length) ? (
        <Section title="Related Context">
          <div className="grid gap-4 md:grid-cols-2">
            {projects.length ? (
              <RelationList
                items={projects.map((project) => ({
                  href: project.slug ? `/projects/${project.slug}` : null,
                  label: project.title,
                }))}
                title="Projects"
              />
            ) : null}
            {threads.length ? (
              <RelationList
                items={threads.map((thread) => ({
                  href: null,
                  label: thread.title,
                }))}
                title="Threads"
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      {canViewFullDetails && socialLinks.length ? (
        <Section title="Published Social Links">
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <SafeLink
                href={link.url}
                key={`${link.platform}-${link.url}`}
                label={link.label || link.platform}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id = '' } = await paramsPromise
  const user = await getCurrentUser()
  const event = await getEvent(id, user)

  return {
    description: event?.summary || 'RaidGuild session details and source links.',
    title: event?.title || 'Session',
  }
}

const Section: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <section className="mt-12">
    <h2 className="portal-heading">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
)

const PortalSessionCTA: React.FC<{ eventID: number }> = ({ eventID }) => (
  <section className="mt-12 border border-primary/30 bg-primary/10 p-5">
    <p className="portal-kicker">Continue In The Portal</p>
    <h2 className="portal-heading-sm mt-3">Log in for the full session graph</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
      See source materials, related projects, profiles, derived posts, and wiki candidates from this
      session.
    </p>
    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        className="portal-admin-link"
        href={`/login?next=${encodeURIComponent(`/events/${eventID}`)}`}
      >
        Log in
      </Link>
      <Link className="portal-link" href="/join">
        Join
      </Link>
    </div>
  </section>
)

const SafeLink: React.FC<{ href?: string | null; label: string }> = ({ href, label }) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) return null

  const isExternal = safeURL.startsWith('http')

  return (
    <Link
      className="portal-link"
      href={safeURL}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}

const ProfileLink: React.FC<{ profile: Profile }> = ({ profile }) => {
  const href = profile.handle ? `/members/${profile.handle}` : null

  if (!href) return <span className="portal-pill">{profile.displayName}</span>

  return (
    <Link className="portal-pill transition-colors hover:text-primary" href={href}>
      {profile.displayName}
    </Link>
  )
}

const RelationList: React.FC<{
  items: { href: string | null; label: string }[]
  title: string
}> = ({ items, title }) => (
  <div className="border border-border bg-card/20 p-5">
    <p className="portal-kicker">{title}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) =>
        item.href ? (
          <Link
            className="portal-pill transition-colors hover:text-primary"
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ) : (
          <span className="portal-pill" key={item.label}>
            {item.label}
          </span>
        ),
      )}
    </div>
  </div>
)

const getCalendarFallbackURL = (event: Event): string | null => {
  if (!event.startsAt) return null

  const endsAt =
    event.endsAt || new Date(new Date(event.startsAt).getTime() + 30 * 60 * 1000).toISOString()

  return createGoogleCalendarURL({
    description: event.summary,
    endsAt,
    location: event.joinURL || event.discordEventURL || event.locationLabel,
    startsAt: event.startsAt,
    title: event.title,
  })
}

const getEvent = async (
  id: string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Event | null> => {
  if (!id) return null

  const payload = await getPayload({ config: configPromise })

  try {
    return await payload.findByID({
      id,
      collection: 'events',
      depth: 2,
      overrideAccess: false,
      user: user || undefined,
    })
  } catch {
    return null
  }
}

const getDerivedPosts = async (
  eventID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<Post[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 25,
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
          sourceSession: {
            equals: eventID,
          },
        },
      ],
    },
  })

  return result.docs
}

const groupPosts = (posts: Post[]): [string, Post[]][] => {
  const grouped = new Map<string, Post[]>()

  for (const post of posts) {
    const contentType = post.contentType || 'article'
    const group = grouped.get(contentType) || []
    group.push(post)
    grouped.set(contentType, group)
  }

  return [...grouped.entries()].sort(([a], [b]) => {
    const aIndex = contentTypeOrder.indexOf(a)
    const bIndex = contentTypeOrder.indexOf(b)

    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
  })
}

const uniqueProfiles = (profiles: Profile[]): Profile[] => {
  const seen = new Set<number>()

  return profiles.filter((profile) => {
    if (seen.has(profile.id)) return false
    seen.add(profile.id)
    return true
  })
}
