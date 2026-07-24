import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Cohort, Event, Media, Module, Post, Profile, Project, Thread } from '@/payload-types'
import { getCohortLabel } from '@/cohorts/selectFeaturedCohort'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import { getYouTubeEmbedURL } from '@/utilities/videoEmbed'
import { DashboardWeeklySessionStrip } from '../../_components/DashboardWeeklySessionStrip'
import { SessionDateTime } from '../../_components/SessionDateTime'
import { CohortCommitmentCard } from './CohortCommitmentCard'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

export default async function CohortPage({ params }: Args) {
  const { slug } = await params
  const user = await getCurrentUser()
  const data = await getCohortPageData(slug, user)

  if (!data) notFound()

  const { cohort, commitment, events, profile } = data
  const now = Date.now()
  const upcomingEvents = events.filter((event) => new Date(event.startsAt).getTime() >= now)
  const pastEvents = events.filter((event) => new Date(event.startsAt).getTime() < now).reverse()
  const nextEvent = upcomingEvents[0]
  const eyebrow = cohort.cohortNumber
    ? `RaidGuild Cohort ${cohort.cohortNumber}`
    : 'RaidGuild Cohort'
  const cohortLabel = getCohortLabel(cohort)
  const enrollmentOpen = isEnrollmentOpen(cohort, now)
  const posts = relationDocs<Post>(cohort.featuredPosts)
  const projects = relationDocs<Project>(cohort.featuredProjects)
  const modules = relationDocs<Module>(cohort.featuredModules)
  const thread = relationDoc<Thread>(cohort.highlightedThread)
  const heroMedia = relationDoc<Media>(cohort.heroMedia)
  const explorationVideoURL = getYouTubeEmbedURL(cohort.explorationVideoURL)
  const contextLinks =
    cohort.contextLinks?.flatMap((link) => {
      const url = toSafeURL(link.url, { allowRelative: false })
      return url ? [{ ...link, url }] : []
    }) || []

  return (
    <main className="pb-24">
      <section
        className={`relative overflow-hidden border-b border-primary/30 ${heroMedia?.url ? '' : heroClassName[cohort.visualVariant || 'guild']}`}
      >
        {heroMedia?.url ? (
          <>
            {/* A decorative image: the Cohort title provides the meaningful hero label. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              src={heroMedia.sizes?.xlarge?.url || heroMedia.sizes?.large?.url || heroMedia.url}
            />
            <div
              className={`absolute inset-0 ${heroImageOverlayClassName[cohort.visualVariant || 'guild']}`}
            />
          </>
        ) : null}
        <div className="container relative z-10 py-16 md:py-24">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="portal-kicker">{eyebrow}</p>
              <span className="portal-pill">{formatStatus(cohort.programStatus)}</span>
              {enrollmentOpen ? <span className="portal-pill">Enrollment open</span> : null}
            </div>
            <h1 className="portal-title-lg mt-6">{cohort.title}</h1>
            <p className="mt-5 font-serif text-2xl font-bold text-primary">{cohort.theme}</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {cohort.summary}
            </p>
            <p className="mt-5 font-mono text-sm font-bold uppercase tracking-wide">
              {formatDateRange(cohort.startsAt, cohort.endsAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          {nextEvent ? <NextSession event={nextEvent} /> : null}

          <DashboardWeeklySessionStrip
            emptyLabel="No session"
            events={events}
            heading={`${eyebrow} schedule`}
            scheduleHref="#schedule"
          />

          {cohort.thesis || explorationVideoURL ? (
            <CohortSection heading="What we are exploring">
              {cohort.thesis ? (
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  {cohort.thesis}
                </p>
              ) : null}
              {explorationVideoURL ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="mt-6 aspect-video w-full max-w-3xl border border-border bg-background"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={explorationVideoURL}
                  title={`${cohort.title}: what we are exploring`}
                />
              ) : null}
            </CohortSection>
          ) : null}

          {cohort.starterTopics?.length ? (
            <CohortSection heading="Starter topics">
              <div className="grid gap-4 md:grid-cols-2">
                {cohort.starterTopics.map((topic) => {
                  const url = toSafeURL(topic.url)
                  const content = (
                    <>
                      <h3 className="font-medium">{topic.title}</h3>
                      {topic.summary ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {topic.summary}
                        </p>
                      ) : null}
                    </>
                  )

                  return url ? (
                    <Link
                      className="portal-card hover:border-primary"
                      href={url}
                      key={topic.id || topic.title}
                    >
                      {content}
                    </Link>
                  ) : (
                    <article className="portal-card" key={topic.id || topic.title}>
                      {content}
                    </article>
                  )
                })}
              </div>
            </CohortSection>
          ) : null}

          {cohort.programSections?.length ? (
            <CohortSection heading="Program details">
              <div className="grid gap-5 md:grid-cols-2">
                {cohort.programSections.map((section) => (
                  <article className="portal-panel" key={section.id || section.heading}>
                    <h3 className="portal-heading-sm">{section.heading}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p>
                  </article>
                ))}
              </div>
            </CohortSection>
          ) : null}

          {projects.length || posts.length || modules.length || contextLinks.length || thread ? (
            <CohortSection heading="Cohort context and work">
              <div className="grid gap-4 md:grid-cols-2">
                {thread ? (
                  <RelatedCard
                    href={`/threads/${thread.slug}`}
                    kicker="Highlighted thread"
                    summary={thread.summary}
                    title={thread.title}
                  />
                ) : null}
                {projects.map((project) => (
                  <RelatedCard
                    href={`/projects/${project.slug}`}
                    kicker="Project"
                    key={project.id}
                    summary={project.summary}
                    title={project.title}
                  />
                ))}
                {posts.map((post) => (
                  <RelatedCard
                    href={`/posts/${post.slug}`}
                    kicker="Post"
                    key={post.id}
                    summary={post.meta?.description}
                    title={post.title}
                  />
                ))}
                {modules.map((module) => (
                  <RelatedCard
                    href="/modules"
                    kicker="Module"
                    key={module.id}
                    summary={module.summary}
                    title={module.name}
                  />
                ))}
                {contextLinks.map((link) => (
                  <RelatedCard
                    external
                    href={link.url}
                    kicker="External reference"
                    key={link.id || link.url}
                    summary={link.summary}
                    title={link.title}
                  />
                ))}
              </div>
            </CohortSection>
          ) : null}

          <section id="schedule">
            <h2 className="portal-heading">Full schedule</h2>
            <div className="mt-6 space-y-3">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => <SessionRow event={event} key={event.id} />)
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming cohort sessions are published yet.
                </p>
              )}
            </div>
          </section>

          {pastEvents.length ? (
            <CohortSection heading="Past sessions and artifacts">
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <SessionRow event={event} key={event.id} />
                ))}
              </div>
            </CohortSection>
          ) : null}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <CohortCommitmentCard
            cohortID={cohort.id}
            cohortLabel={cohortLabel}
            cohortSlug={cohort.slug}
            commitmentID={commitment?.id}
            commitmentStatus={commitment?.status}
            enrollmentOpen={enrollmentOpen}
            hasProfile={Boolean(profile)}
            isAuthenticated={Boolean(user)}
            programStatus={cohort.programStatus}
          />
          {cohort.participationExpectation ? (
            <div className="portal-panel">
              <p className="portal-kicker">The commitment</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {cohort.participationExpectation}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const data = await getCohortPageData(slug, null)
  return data ? { description: data.cohort.summary, title: data.cohort.title } : {}
}

const getCohortPageData = cache(
  async (slug: string, user: Awaited<ReturnType<typeof getCurrentUser>>) => {
    const payload = await getPayload({ config: configPromise })
    const cohortResult = await payload.find({
      collection: 'cohorts',
      depth: 2,
      draft: false,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user: user || undefined,
      where: { slug: { equals: slug } },
    })
    const cohort = cohortResult.docs[0]
    if (!cohort) return null

    const [eventResult, profileResult] = await Promise.all([
      payload.find({
        collection: 'events',
        depth: 1,
        draft: false,
        limit: 100,
        overrideAccess: false,
        pagination: false,
        sort: 'startsAt',
        user: user || undefined,
        where: {
          and: [{ _status: { equals: 'published' } }, { relatedCohorts: { equals: cohort.id } }],
        },
      }),
      user
        ? payload.find({
            collection: 'profiles',
            depth: 0,
            limit: 1,
            overrideAccess: true,
            pagination: false,
            where: { user: { equals: user.id } },
          })
        : Promise.resolve({ docs: [] as Profile[] }),
    ])
    const profile = profileResult.docs[0] || null
    const commitmentResult = profile
      ? await payload.find({
          collection: 'cohortCommitments',
          depth: 0,
          limit: 1,
          overrideAccess: false,
          pagination: false,
          user: user || undefined,
          where: { and: [{ cohort: { equals: cohort.id } }, { profile: { equals: profile.id } }] },
        })
      : null

    return {
      cohort,
      commitment: commitmentResult?.docs[0] || null,
      events: eventResult.docs,
      profile,
    }
  },
)

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => typeof item === 'object' && item !== null) || []
const relationDoc = <T extends { id: number }>(item?: number | T | null): T | null =>
  typeof item === 'object' && item !== null ? item : null

const heroClassName: Record<NonNullable<Cohort['visualVariant']>, string> = {
  guild:
    'border-b border-primary/30 bg-gradient-to-br from-primary/15 via-background to-guild-olive/10',
  moloch:
    'border-b border-moloch-500/30 bg-gradient-to-br from-moloch-500/15 via-background to-card',
  scroll:
    'border-b border-scroll-200/30 bg-gradient-to-br from-scroll-200/15 via-background to-card',
}
const heroImageOverlayClassName: Record<NonNullable<Cohort['visualVariant']>, string> = {
  guild: 'bg-gradient-to-br from-background/95 via-background/80 to-guild-olive/45',
  moloch: 'bg-gradient-to-br from-background/95 via-background/75 to-moloch-500/45',
  scroll: 'bg-gradient-to-br from-background/95 via-background/75 to-scroll-200/45',
}

const formatStatus = (status: Cohort['programStatus']) =>
  status
    ? status
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : 'Upcoming'
const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start) return 'Dates to be announced'
  const formatter = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return end
    ? `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`
    : formatter.format(new Date(start))
}
const isEnrollmentOpen = (cohort: Cohort, now: number) =>
  cohort.enrollmentStatus === 'open' &&
  (!cohort.enrollmentOpensAt || new Date(cohort.enrollmentOpensAt).getTime() <= now) &&
  (!cohort.enrollmentClosesAt || new Date(cohort.enrollmentClosesAt).getTime() >= now)

const CohortSection: React.FC<{ children: React.ReactNode; heading: string }> = ({
  children,
  heading,
}) => (
  <section>
    <h2 className="portal-heading">{heading}</h2>
    <div className="mt-6">{children}</div>
  </section>
)
const RelatedCard = ({
  external = false,
  href,
  kicker,
  summary,
  title,
}: {
  external?: boolean
  href: string
  kicker: string
  summary?: string | null
  title: string
}) => (
  <Link
    className="portal-card block hover:border-primary"
    href={href}
    rel={external ? 'noopener noreferrer' : undefined}
    target={external ? '_blank' : undefined}
  >
    <p className="portal-kicker">{kicker}</p>
    <h3 className="mt-3 font-medium">{title}</h3>
    {summary ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p> : null}
  </Link>
)
const NextSession = ({ event }: { event: Event }) => (
  <section className="portal-panel border-primary/40">
    <p className="portal-kicker">Next cohort session</p>
    <div className="mt-3 flex flex-wrap items-start justify-between gap-5">
      <div>
        <h2 className="portal-heading-sm">{event.title}</h2>
        <SessionDateTime
          className="mt-2 block text-sm text-muted-foreground"
          endsAt={event.endsAt}
          startsAt={event.startsAt}
        />
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/events/${event.id}`}>Session details</Link>
        </Button>
        {toSafeURL(event.joinURL, { allowRelative: false }) ? (
          <Button asChild variant="outline">
            <a href={event.joinURL!} rel="noopener noreferrer" target="_blank">
              Join session
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  </section>
)
const SessionRow = ({ event }: { event: Event }) => (
  <Link
    className="portal-card flex flex-wrap items-center justify-between gap-4 hover:border-primary"
    href={`/events/${event.id}`}
  >
    <div>
      <p className="portal-kicker">{event.sessionType}</p>
      <h3 className="mt-2 font-medium">{event.title}</h3>
    </div>
    <SessionDateTime
      className="text-sm text-muted-foreground"
      endsAt={event.endsAt}
      startsAt={event.startsAt}
    />
  </Link>
)
