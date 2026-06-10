import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canContributeContent, canEditContent, hasRole } from '@/access/roles'
import { Comments } from '@/components/Comments'
import { ContributionRequestCard } from '../../_components/ContributionRequestCard'
import type {
  ContributionRequest,
  Event,
  Post,
  Profile,
  Project,
  Thread,
  User,
} from '@/payload-types'
import { createGoogleCalendarURL } from '@/utilities/calendarLinks'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import { SessionDateTime } from '../../_components/SessionDateTime'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    id?: string
  }>
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
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

const recurrenceCadenceLabels: Record<NonNullable<Event['recurrenceCadence']>, string> = {
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  weekly: 'Weekly',
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
  const canManageSessions = canContributeContent(user)
  const canViewDiscordSyncErrors = canEditContent(user)
  const canCreateRequests = canManageSessions || hasRole(user, 'member')
  const contributionRequests = await getOpenContributionRequestsForEvent(event.id, user)
  const posts = canViewFullDetails ? await getDerivedPosts(event.id, user) : []
  const startsAt = new Date(event.startsAt)
  const isPast = startsAt.getTime() < Date.now()
  const projects = relationDocs<Project>(event.relatedProjects)
  const threads = relationDocs<Thread>(event.relatedThreads)
  const hostProfiles = relationDocs<Profile>(event.hostProfiles)
  const canHideSessionComments = canEditContent(user) || isEventHost(hostProfiles, user)
  const canEditSession = canContributeContent(user) || isEventHost(hostProfiles, user)
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
  ].flatMap((link) => {
    const safeURL = toSafeURL(link.href)

    return safeURL ? [{ href: safeURL, label: link.label }] : []
  })
  const hasSourceLinks = sourceLinks.length > 0
  const resources = (event.resources || []).flatMap((resource) => {
    const safeURL = toSafeURL(resource.url)

    return safeURL
      ? [
          {
            embedURL: getYouTubeEmbedURL(safeURL),
            href: safeURL,
            label: resource.label,
            resourceType: resource.resourceType || 'link',
          },
        ]
      : []
  })
  const hasRelatedContext = Boolean(projects.length || threads.length)
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
            {event.seriesKey ? (
              <span className="portal-pill">{event.seriesTitle || event.seriesKey}</span>
            ) : null}
            <span className="text-sm text-muted-foreground">{event.visibility}</span>
          </div>
          <h1 className="portal-title mt-5">{event.title}</h1>
          {!isPast && event.summary ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              {event.summary}
            </p>
          ) : null}
        </div>

        <aside className="border border-border bg-card/30 p-5">
          <p className="portal-kicker">Session</p>
          <SessionDateTime
            className="mt-3 block text-sm leading-6 text-muted-foreground"
            dateStyle="full"
            endsAt={event.endsAt}
            startsAt={event.startsAt}
          />
          {event.locationLabel ? (
            <p className="mt-3 text-sm text-muted-foreground">{event.locationLabel}</p>
          ) : null}
          {event.recurrenceCadence ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {recurrenceCadenceLabels[event.recurrenceCadence]}
              {event.recurrenceUntil ? ` until ${formatDate(event.recurrenceUntil)}` : ''}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {!isPast ? <SafeLink href={event.joinURL} label="Join" /> : null}
            <SafeLink href={event.calendarURL || getCalendarFallbackURL(event)} label="Calendar" />
            <SafeLink href={event.discordEventURL} label="Discord" />
            {canEditSession ? (
              <Link className="portal-admin-link" href={`/admin/collections/events/${event.id}`}>
                Edit session
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      {canViewDiscordSyncErrors && event.discordSyncStatus === 'failed' ? (
        <DiscordSyncNotice error={event.discordSyncError} />
      ) : null}

      {!user ? <PortalSessionCTA eventID={event.id} /> : null}

      {isPast && event.summary ? (
        <Section title="Session Notes">
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">{event.summary}</p>
        </Section>
      ) : null}

      {canViewFullDetails || contributionRequests.length ? (
        <Section title="Contribution Requests">
          {canCreateRequests ? (
            <Link
              className="portal-admin-link mb-4 inline-flex"
              href={`/requests/new?event=${event.id}`}
            >
              Create follow-up request
            </Link>
          ) : null}
          {contributionRequests.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {contributionRequests.map((request) => (
                <ContributionRequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <EmptyState text="No open follow-up requests have been linked to this session yet." />
          )}
        </Section>
      ) : null}

      {canViewFullDetails && isPast ? (
        <Section title="Source Material">
          {hasSourceLinks ? (
            <>
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
            </>
          ) : (
            <EmptyState text="No recording, transcript, summary, or source artifact has been attached yet." />
          )}
        </Section>
      ) : null}

      {canViewFullDetails && resources.length ? (
        <Section title="Resources">
          <div className="grid gap-3 md:grid-cols-2">
            {resources.map((resource) => (
              <ResourceCard key={`${resource.resourceType}-${resource.href}`} resource={resource} />
            ))}
          </div>
        </Section>
      ) : null}

      {canViewFullDetails && (isPast || posts.length) ? (
        <Section title="Derived Posts">
          {posts.length ? (
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
          ) : (
            <EmptyState text="No published posts have been derived from this session yet." />
          )}
        </Section>
      ) : null}

      {canViewFullDetails && (isPast || hasRelatedContext) ? (
        <Section title="Related Context">
          {hasRelatedContext ? (
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
          ) : (
            <EmptyState text="No related projects or threads have been linked yet." />
          )}
        </Section>
      ) : null}

      {displayProfiles.length ? (
        <Section title={event.sessionType === 'fireside' ? 'Guests And Hosts' : 'People'}>
          <div className="flex flex-wrap gap-2">
            {displayProfiles.map((profile) => (
              <ProfileLink key={profile.id} profile={profile} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Comments">
        <Comments
          canComment={Boolean(user)}
          canHide={canHideSessionComments}
          className="py-0"
          commenterLabel={user?.name || user?.email}
          loginHref={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}
          parent={{ relationTo: 'events', value: event.id }}
          title={null}
          user={user}
        />
      </Section>

      {canViewFullDetails && (event.previousOccurrence || event.nextOccurrence) ? (
        <Section title="Series Navigation">
          <div className="flex flex-wrap gap-3">
            <OccurrenceLink event={event.previousOccurrence} label="Previous session" />
            <OccurrenceLink event={event.nextOccurrence} label="Next session" />
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

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="border border-dashed border-border bg-card/20 p-4 text-sm leading-6 text-muted-foreground">
    {text}
  </p>
)

const DiscordSyncNotice: React.FC<{ error?: string | null }> = ({ error }) => (
  <section className="mt-8 border border-destructive/40 bg-destructive/10 p-4">
    <p className="portal-kicker text-destructive">Discord Sync Failed</p>
    <p className="mt-3 text-sm leading-6 text-destructive">{formatDiscordSyncError(error)}</p>
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

type SessionResource = {
  embedURL: string | null
  href: string
  label: string
  resourceType: string
}

const ResourceCard: React.FC<{ resource: SessionResource }> = ({ resource }) => {
  if (resource.embedURL) {
    return (
      <article className="border border-border bg-card/20 p-4 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="portal-kicker">{resource.resourceType}</p>
            <h3 className="mt-2 font-medium">{resource.label}</h3>
          </div>
          <a className="portal-link text-sm" href={resource.href} rel="noreferrer" target="_blank">
            Open video
          </a>
        </div>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="mt-4 aspect-video w-full border border-border bg-background"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={resource.embedURL}
          title={resource.label}
        />
      </article>
    )
  }

  return (
    <a
      className="border border-border bg-card/20 p-4 transition-colors hover:border-primary"
      href={resource.href}
      rel="noreferrer"
      target="_blank"
    >
      <p className="portal-kicker">{resource.resourceType}</p>
      <p className="mt-2 font-medium">{resource.label}</p>
    </a>
  )
}

const getYouTubeEmbedURL = (href: string): string | null => {
  try {
    const url = new URL(href)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    let videoID = ''

    if (host === 'youtu.be') {
      videoID = url.pathname.split('/').filter(Boolean)[0] || ''
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') {
        videoID = url.searchParams.get('v') || ''
      } else {
        const [, route, id] = url.pathname.split('/')

        if (route === 'embed' || route === 'shorts' || route === 'live') {
          videoID = id || ''
        }
      }
    }

    if (!/^[A-Za-z0-9_-]{11}$/.test(videoID)) return null

    return `https://www.youtube-nocookie.com/embed/${videoID}`
  } catch {
    return null
  }
}

const formatDiscordSyncError = (value?: string | null): string => {
  if (!value) return 'No error details were returned.'

  try {
    const parsed = JSON.parse(value) as { code?: number | string; message?: string }
    const message = parsed.message || value

    return parsed.code ? `${message} (${parsed.code})` : message
  } catch {
    return value
  }
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

const OccurrenceLink: React.FC<{ event?: number | Event | null; label: string }> = ({
  event,
  label,
}) => {
  if (!event || typeof event !== 'object') return null

  return (
    <Link className="portal-link" href={`/events/${event.id}`}>
      {label}: {event.title}
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

const getOpenContributionRequestsForEvent = async (
  eventID: number,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<ContributionRequest[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'contributionRequests',
    depth: 2,
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
            equals: 'open',
          },
        },
        {
          relatedEvents: {
            in: [eventID],
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

const isEventHost = (hostProfiles: Profile[], user: User | null): boolean => {
  if (!user) return false

  return hostProfiles.some((profile) => relationshipID(profile.user) === user.id)
}

const relationshipID = (value: number | string | { id?: number | string } | null | undefined) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (value && typeof value.id !== 'undefined') return relationshipID(value.id)

  return 0
}
