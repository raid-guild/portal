import Link from 'next/link'
import React from 'react'
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  Puzzle,
} from 'lucide-react'

import type {
  Cohort,
  CohortCommitment,
  DailyBrief,
  Event,
  Module,
  PointEvent,
  Post,
  Profile,
  Project,
  Spotlight,
  User,
  WikiPage,
} from '@/payload-types'
import { Button } from '@/components/ui/button'
import {
  getCohortInquiryHref,
  getCohortLabel,
  isCohortEnrollmentOpen,
} from '@/cohorts/selectFeaturedCohort'
import type { ProductPageCopy } from '@/utilities/pageCopy'
import { toSafeURL } from '@/utilities/safeURL'
import type { RecentContributor, RecentContributorMode } from '../dashboard/dashboardTypes'
import { DailyVibeNotes } from './DailyVibeNotes'
import { DashboardWeeklySessionStrip } from './DashboardWeeklySessionStrip'
import { SessionDateTime } from './SessionDateTime'
import { VibeCheckButton } from './VibeCheckButton'
import { TrackedInquiryLink } from './TrackedInquiryLink'
import { TrackedCohortLink } from './TrackedCohortLink'

type PortalHomeProps = {
  cohortSessionThemes?: Event[]
  copy: ProductPageCopy
  featuredCohort?: Cohort | null
  posts?: Post[]
  spotlights?: Spotlight[]
  upcomingEvents?: Event[]
  weeklyBrief?: DailyBrief | null
}

type DashboardProps = {
  cohortCommitment?: CohortCommitment | null
  dailyBrief?: DailyBrief | null
  dailyEngagementSummary?: {
    currentStreak: number
    hasCheckedInToday: boolean
    todayVibe?: string | null
  }
  dashboardStats?: {
    modules: number
    posts: number
    sessions: number
    wikiPages: number
  }
  featuredModules?: Module[]
  featuredCohort?: Cohort | null
  upcomingEvents?: Event[]
  weekEvents?: Event[]
  pointEvents?: PointEvent[]
  pointsTotal?: number
  profile?: Profile | null
  recentPosts?: Post[]
  recentContributorMode?: RecentContributorMode
  recentContributors?: RecentContributor[]
  recentWikiPages?: WikiPage[]
  spotlights?: Spotlight[]
  user: User
}

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const BriefMedia: React.FC<{ brief: DailyBrief; emptyText: string }> = ({ brief, emptyText }) => {
  const mediaFile = brief.mediaFile && typeof brief.mediaFile === 'object' ? brief.mediaFile : null
  const mediaURL = mediaFile?.url || toSafeURL(brief.externalMediaURL, { allowRelative: false })

  return (
    <aside className="portal-panel">
      <p className="portal-heading-sm">Brief media</p>
      {mediaURL ? (
        <div className="mt-4">
          {brief.mediaType === 'audio' ? (
            <audio className="w-full" controls src={mediaURL} />
          ) : (
            <video className="aspect-video w-full bg-card" controls src={mediaURL} />
          )}
          <p className="mt-3 portal-kicker">{brief.mediaType || 'media'}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{emptyText}</p>
      )}
    </aside>
  )
}

type DashboardQuote = {
  href: string
  label: string
  text: string
}

const quoteLinkPattern = /(artifact|recording|summary|notes)/i

const cleanQuoteText = (value?: string | null) => {
  const text = value?.replace(/\s+/g, ' ').trim()
  if (!text) return null

  const sentence = text.match(/^.+?[.!?](?:\s|$)/)?.[0]?.trim() || text
  if (sentence.length <= 160) return sentence

  return `${sentence.slice(0, 157).trim()}...`
}

const truncateProfileBio = (bio?: string | null) => {
  const text = bio?.replace(/\s+/g, ' ').trim()
  if (!text || text.length <= 130) return text

  return `${text.slice(0, 127).trim()}...`
}

const getDashboardQuote = (brief?: DailyBrief | null): DashboardQuote | null => {
  if (!brief?.sections?.length) return null

  for (const section of brief.sections) {
    const artifactLink = section.links?.find((link) => {
      const safeURL = toSafeURL(link.url)
      return safeURL && quoteLinkPattern.test(`${link.label} ${safeURL}`)
    })
    const href = artifactLink ? toSafeURL(artifactLink.url) : null
    const text = cleanQuoteText(section.body)

    if (href && text) {
      return {
        href,
        label: artifactLink?.label || 'View meeting artifact',
        text,
      }
    }
  }

  return null
}

export const PortalPublicHome: React.FC<PortalHomeProps> = ({
  cohortSessionThemes = [],
  copy,
  featuredCohort,
  posts = [],
  spotlights = [],
  upcomingEvents = [],
  weeklyBrief,
}) => {
  const nextEvent = upcomingEvents[0]

  return (
    <main className="pb-24">
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 portal-kicker">{copy.eyebrow}</p>
            <h1 className="mb-6 portal-title-lg">{copy.headline}</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/join">
                  {copy.createAccountLabel || 'Join RaidGuild'}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/events">{copy.submitAnotherLabel || 'View sessions'}</Link>
              </Button>
            </div>
          </div>
          <div className="portal-panel">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <h2 className="portal-heading-sm">{copy.contextHeading || 'Next public session'}</h2>
            </div>
            {nextEvent ? (
              <div className="mt-4">
                <SessionDateTime
                  className="portal-kicker"
                  dateStyle="medium"
                  endsAt={nextEvent.endsAt}
                  startsAt={nextEvent.startsAt}
                />
                <h2 className="mt-2 portal-heading-sm">{nextEvent.title}</h2>
                {nextEvent.locationLabel ? (
                  <p className="mt-2 text-sm text-muted-foreground">{nextEvent.locationLabel}</p>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-3">
                  <SafeTextLink href={nextEvent.joinURL} label="Join" />
                  <SafeTextLink href={nextEvent.calendarURL} label="Add to calendar" />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {copy.contextBody ||
                  'No public sessions are scheduled yet. Join to get access to member coordination.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <SpotlightSection spotlights={spotlights} />

      {weeklyBrief ? (
        <section className="container py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div>
              <p className="portal-kicker">This week in RaidGuild</p>
              <h2 className="mt-2 portal-heading">{weeklyBrief.title}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                {weeklyBrief.summary}
              </p>
              {weeklyBrief.sections?.length ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                  {weeklyBrief.sections.slice(0, 3).map((section) => (
                    <li key={section.id || section.heading}>
                      <span className="font-medium text-foreground">{section.heading}:</span>{' '}
                      {section.body}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button asChild className="mt-6">
                <Link href="/join">Join for daily briefs</Link>
              </Button>
            </div>
            <BriefMedia
              brief={weeklyBrief}
              emptyText="The weekly media export will appear here when it is attached."
            />
          </div>
        </section>
      ) : null}

      <section className="portal-band">
        <div className="container grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="portal-heading">Upcoming Sessions</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Live sessions are where builders compare notes, learn from one another, and find the
              next place to contribute.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/events">View sessions</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.length ? (
              upcomingEvents.slice(0, 3).map((event) => (
                <article className="portal-card" key={event.id}>
                  <SessionDateTime
                    className="portal-kicker"
                    dateStyle="medium"
                    endsAt={event.endsAt}
                    startsAt={event.startsAt}
                  />
                  <h3 className="mt-2 portal-heading-sm">{event.title}</h3>
                  {event.summary ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {event.summary}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SafeTextLink href={event.joinURL} label="Join" />
                    <SafeTextLink href={event.calendarURL} label="Add to calendar" />
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No public sessions are scheduled yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="portal-band">
        <div className="container grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="portal-heading">What&apos;s Shipping</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Recent signals from the community so visitors can see what teams are learning,
              building, and releasing.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {posts.length ? (
              posts.map((post) => (
                <Link
                  className="block portal-card transition-colors hover:bg-card"
                  href={`/posts/${post.slug}`}
                  key={post.id}
                >
                  <p className="portal-kicker">{formatDate(post.publishedAt) || 'Published'}</p>
                  <h3 className="mt-2 portal-heading-sm">{post.title}</h3>
                  {post.meta?.description ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {post.meta.description}
                    </p>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No public posts yet.</p>
            )}
          </div>
        </div>
      </section>

      <PublicCohortSection cohort={featuredCohort} sessionThemes={cohortSessionThemes} />

      <section className="portal-band">
        <div className="container grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="portal-heading">Ready to participate?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create an account to join sessions, build a profile, find teams, and get routed toward
              skill-building contribution paths.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/join">Join the portal</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">Explore projects</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground lg:text-right">
            Bringing a project or bounty?{' '}
            <TrackedInquiryLink
              className="font-bold text-foreground underline decoration-primary/50"
              formVariant="legacy_sponsor"
              href="/sponsor"
              inquiryType="sponsor"
              placement="portal_home"
            >
              Sponsor an opportunity
            </TrackedInquiryLink>
            .
          </p>
        </div>
      </section>
    </main>
  )
}

const PublicCohortSection: React.FC<{
  cohort?: Cohort | null
  sessionThemes: Event[]
}> = ({ cohort, sessionThemes }) => {
  const isGatheringInterest = cohort?.programStatus === 'gathering-interest'
  const enrollmentOpen = cohort ? isCohortEnrollmentOpen(cohort) : false
  const cohortLabel = cohort ? getCohortLabel(cohort) : 'the next RaidGuild cohort'
  const interestHref = cohort
    ? getCohortInquiryHref(cohort, 'interested')
    : '/inquire/general?context=cohort-interest&intent=interested'
  const topicHref = cohort
    ? getCohortInquiryHref(cohort, 'suggest-topic')
    : '/inquire/general?context=cohort-interest&intent=suggest-topic'

  return (
    <section className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <div>
          <p className="portal-kicker">Learn and build together</p>
          <h2 className="mt-2 portal-heading">RaidGuild Cohorts</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Focused programs for exploring a shared theme through sessions, projects, and visible
            community work.
          </p>
        </div>

        {cohort ? (
          <article className="portal-panel border-primary/40 bg-primary/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="portal-kicker">
                {isGatheringInterest ? 'Potential future cohort' : 'Current or next cohort'}
              </p>
              <span className="portal-pill">{cohort.programStatus.replaceAll('-', ' ')}</span>
            </div>
            <h3 className="mt-3 portal-heading-sm">{cohortLabel}</h3>
            <p className="mt-2 font-serif text-xl font-bold text-primary">{cohort.theme}</p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              {cohort.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {isGatheringInterest ? (
                <TrackedInquiryLink
                  className="portal-admin-link"
                  cohortInterestIntent="interested"
                  cohortSlug={cohort.slug}
                  href={interestHref}
                  inquiryType="general"
                  placement="portal_home_cohort"
                >
                  Signal interest
                </TrackedInquiryLink>
              ) : (
                <TrackedCohortLink
                  className="portal-admin-link"
                  cohortSlug={cohort.slug}
                  href={`/cohorts/${cohort.slug}`}
                  placement="portal_home"
                >
                  {enrollmentOpen ? `Join ${cohortLabel}` : 'Explore the cohort'}
                </TrackedCohortLink>
              )}
              <TrackedInquiryLink
                className="portal-admin-link"
                cohortInterestIntent="suggest-topic"
                cohortSlug={cohort.slug}
                href={topicHref}
                inquiryType="general"
                placement="portal_home_cohort_topic"
              >
                Suggest a future topic
              </TrackedInquiryLink>
            </div>
          </article>
        ) : (
          <article className="portal-panel border-primary/40 bg-primary/10">
            <p className="portal-kicker">What should we explore next?</p>
            <h3 className="mt-3 portal-heading-sm">Help shape the next cohort</h3>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              No cohort is scheduled yet. Signal that you would participate or suggest a theme the
              guild should explore together.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <TrackedInquiryLink
                className="portal-admin-link"
                cohortInterestIntent="interested"
                cohortSlug="unscheduled"
                href={interestHref}
                inquiryType="general"
                placement="portal_home_cohort"
              >
                Signal interest
              </TrackedInquiryLink>
              <TrackedInquiryLink
                className="portal-admin-link"
                cohortInterestIntent="suggest-topic"
                cohortSlug="unscheduled"
                href={topicHref}
                inquiryType="general"
                placement="portal_home_cohort_topic"
              >
                Suggest a future topic
              </TrackedInquiryLink>
            </div>
          </article>
        )}
      </div>

      {sessionThemes.length ? (
        <div className="mt-8 lg:ml-[20rem]">
          <p className="portal-kicker">Themes from previous cohort sessions</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {sessionThemes.slice(0, 3).map((event) => (
              <Link className="block portal-card" href={`/events/${event.id}`} key={event.id}>
                <p className="portal-kicker">
                  {event.sessionType?.replaceAll('-', ' ') || 'Session'}
                </p>
                <h3 className="mt-2 portal-heading-sm">{event.title}</h3>
                {event.summary ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {event.summary}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export const PortalDashboard: React.FC<DashboardProps> = ({
  cohortCommitment,
  dailyBrief,
  dailyEngagementSummary,
  dashboardStats,
  featuredModules = [],
  featuredCohort,
  upcomingEvents = [],
  weekEvents = [],
  pointEvents = [],
  pointsTotal = 0,
  profile,
  recentPosts = [],
  recentContributorMode = 'recent-contributors',
  recentContributors = [],
  recentWikiPages = [],
  spotlights = [],
  user,
}) => {
  const hasProfile = Boolean(profile)
  const displayName = profile?.displayName || user.name || user.email?.split('@')[0] || 'there'
  const vibeSummary = dailyEngagementSummary || {
    currentStreak: 0,
    hasCheckedInToday: false,
    todayVibe: null,
  }
  const nextEvent =
    dailyBrief?.nextEvent && typeof dailyBrief.nextEvent === 'object' ? dailyBrief.nextEvent : null
  const primaryEvent = nextEvent || upcomingEvents[0]
  const latestPointEvent = pointEvents[0]
  const stats = dashboardStats || {
    modules: featuredModules.length,
    posts: recentPosts.length,
    sessions: upcomingEvents.length,
    wikiPages: recentWikiPages.length,
  }
  const highlightedThread =
    spotlights.find(
      (spotlight) => spotlight.targetType === 'thread' && spotlight.kind === 'featured',
    ) || spotlights.find((spotlight) => spotlight.targetType === 'thread')
  const dashboardQuote = getDashboardQuote(dailyBrief)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="mb-4 portal-kicker">Member Home</p>
          <div className="flex items-start gap-4 sm:gap-6">
            <img
              alt="Tavern keeper"
              className="h-28 w-auto shrink-0 [image-rendering:pixelated] sm:h-36 md:h-40"
              height="268"
              src="/assets/map/characters/tavern-keeper.svg"
              width="176"
            />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">
                {hasProfile ? `Welcome, ${displayName}` : 'Welcome - create your profile'}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                {hasProfile
                  ? "I'm the tavern keeper around here. Let me pour you an ale while you catch the weekly brief, see what is live, and jump into the Portal surfaces moving right now."
                  : "I'm the tavern keeper around here. Let me pour you an ale while you create your public profile so members can find your skills, roles, links, and contributions. Then use this page to follow sessions, posts, wiki pages, and useful Portal tools."}
              </p>
              {dashboardQuote ? (
                <figure className="mt-5 max-w-2xl border-l border-border pl-4">
                  <blockquote className="text-sm italic leading-6 text-muted-foreground">
                    &ldquo;{dashboardQuote.text}&rdquo;
                  </blockquote>
                  <figcaption className="mt-2">
                    <SafeTextLink href={dashboardQuote.href} label={dashboardQuote.label} />
                  </figcaption>
                </figure>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-l border-border pl-6 text-sm">
          <p className="font-mono text-sm font-bold">{user.email}</p>
        </div>
      </section>

      <DashboardNavigation className="mt-10" stats={stats} />

      <DashboardWeeklySessionStrip
        className="mt-10"
        events={weekEvents.length ? weekEvents : upcomingEvents}
      />

      <section className="mt-10 border border-border bg-card/25">
        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto_16rem] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <h2 className="portal-heading-sm">RaidGuild Status</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Check in for points and see today&apos;s status updates.
            </p>
          </div>

          <div className="lg:justify-self-center">
            <VibeCheckButton
              currentStreak={vibeSummary.currentStreak}
              hasCheckedInToday={vibeSummary.hasCheckedInToday}
              todayVibe={vibeSummary.todayVibe}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-1 lg:text-right">
            <div>
              <p className="portal-kicker">Guild Points</p>
              <p className="mt-1 font-serif text-3xl font-bold leading-none text-foreground">
                {pointsTotal}
              </p>
            </div>
            {latestPointEvent ? (
              <div>
                <p className="portal-kicker">Latest Ledger</p>
                <p className="mt-1 font-medium text-foreground">{latestPointEvent.reason}</p>
                <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
                  +{latestPointEvent.amount} / {latestPointEvent.source}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="px-5 pb-5">
          <DailyVibeNotes hasCheckedInToday={vibeSummary.hasCheckedInToday} />
        </div>
      </section>

      <div className="mt-10">
        <BriefPanel title="Highlighted Thread">
          {highlightedThread ? (
            <SpotlightCard spotlight={highlightedThread} />
          ) : (
            <p className="text-sm text-muted-foreground">No highlighted thread is set.</p>
          )}
        </BriefPanel>
      </div>

      <section className="mt-12 border border-border bg-background/70">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <p className="portal-heading-sm">This Week In The Guild</p>
            </div>
            {dailyBrief?.statusLabel ? (
              <span className="portal-pill">{dailyBrief.statusLabel}</span>
            ) : null}
            {dailyBrief?.focusLabel ? (
              <span className="text-sm text-muted-foreground">{dailyBrief.focusLabel}</span>
            ) : null}
            {dailyBrief?.updatedAt ? (
              <span className="text-sm text-muted-foreground">
                Updated {formatDate(dailyBrief.updatedAt)}
              </span>
            ) : null}
          </div>
          {primaryEvent ? (
            <div className="flex flex-wrap gap-3">
              <SafeAction href={primaryEvent.joinURL} label="Join next session" />
              <SafeAction
                href={primaryEvent.calendarURL}
                label="Add to calendar"
                variant="outline"
              />
            </div>
          ) : null}
        </div>
        {dailyBrief ? (
          <div className="p-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
              <div>
                <p className="portal-kicker">What is happening</p>
                <h2 className="mt-2 portal-heading">{dailyBrief.title}</h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {dailyBrief.summary}
                </p>
                {dailyBrief.sections?.length ? (
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                    {dailyBrief.sections.slice(0, 4).map((section) => (
                      <li key={section.id || section.heading}>
                        <span className="font-medium text-foreground">{section.heading}:</span>{' '}
                        {section.body}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="space-y-4">
                <BriefMedia
                  brief={dailyBrief}
                  emptyText="The weekly media export will appear here when it is attached."
                />
                {primaryEvent ? (
                  <div className="portal-card text-sm">
                    <p className="font-bold text-foreground">Next session</p>
                    <p className="mt-2 text-muted-foreground">{primaryEvent.title}</p>
                    <SessionDateTime
                      className="mt-1 block text-muted-foreground"
                      dateStyle="medium"
                      endsAt={primaryEvent.endsAt}
                      startsAt={primaryEvent.startsAt}
                    />
                    {primaryEvent.locationLabel ? (
                      <p className="mt-1 text-muted-foreground">{primaryEvent.locationLabel}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {dailyBrief.engagementActions?.length ? (
              <div className="mt-8">
                <h2 className="portal-heading-sm">Ways to Engage</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {dailyBrief.engagementActions.map((action) => (
                    <article className="portal-card" key={action.id || action.label}>
                      <h3 className="font-medium">{action.label}</h3>
                      {action.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {action.description}
                        </p>
                      ) : null}
                      <SafeTextLink className="mt-3 inline-block" href={action.url} label="Open" />
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            No weekly guild brief has been published yet.
          </p>
        )}
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <BriefPanel
          className="portal-panel"
          title={
            recentContributorMode === 'member-discovery' ? 'Meet Members' : 'Recent Contributors'
          }
        >
          {recentContributors.length ? (
            <RecentContributorsList contributors={recentContributors} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {recentContributorMode === 'member-discovery'
                ? 'No visible active member profiles are available yet.'
                : 'No source-grounded member activity has been published in the last 90 days.'}
            </p>
          )}
        </BriefPanel>

        <section className="portal-panel">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              <h2 className="portal-heading-sm">Next Profile Step</h2>
            </div>
            {hasProfile ? (
              <Link
                aria-label="Open member map"
                className="map-location-pin -m-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href="/dashboard/map"
                title="Member map"
              >
                <Map aria-hidden="true" className="h-8 w-8" />
              </Link>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {hasProfile
              ? 'Review your profile details, roles, skills, and visibility settings.'
              : 'Create a profile so members can discover who you are and what you build.'}
          </p>
          <Button asChild className="mt-5">
            <Link href="/me">{hasProfile ? 'Review profile' : 'Start profile'}</Link>
          </Button>
        </section>

        <DashboardCohortCard
          cohort={featuredCohort}
          commitment={cohortCommitment}
          hasProfile={hasProfile}
        />
      </div>
    </main>
  )
}

const DashboardCohortCard: React.FC<{
  cohort?: Cohort | null
  commitment?: CohortCommitment | null
  hasProfile: boolean
}> = ({ cohort, commitment, hasProfile }) => {
  if (!cohort) {
    return (
      <section className="portal-panel border-primary/40 bg-primary/10">
        <p className="portal-kicker">Next RaidGuild cohort</p>
        <h2 className="portal-heading-sm mt-3">Interested in the next cohort?</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          No cohort is scheduled yet. Tell the guild what you would like to explore when the next
          program takes shape.
        </p>
        <TrackedInquiryLink
          className="portal-admin-link mt-5 inline-flex"
          cohortInterestIntent="interested"
          cohortSlug="unscheduled"
          href="/inquire/general?context=cohort-interest&intent=interested"
          inquiryType="general"
          placement="dashboard_cohort"
        >
          Signal interest
        </TrackedInquiryLink>
      </section>
    )
  }

  const cohortHref = `/cohorts/${cohort.slug}`
  const isGatheringInterest = cohort.programStatus === 'gathering-interest'
  const isCommitted = commitment?.status === 'committed' || commitment?.status === 'waitlisted'
  const enrollmentOpen = isCohortEnrollmentOpen(cohort)
  const heading = isGatheringInterest
    ? `${getCohortLabel(cohort)} is gathering interest`
    : enrollmentOpen
      ? `Join ${cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : 'the cohort'}`
      : cohort.programStatus === 'active'
        ? `${cohort.cohortNumber ? `Cohort ${cohort.cohortNumber}` : 'The cohort'} is underway`
        : `Next cohort${cohort.cohortNumber ? `: Cohort ${cohort.cohortNumber}` : ''}`
  const cta = isGatheringInterest
    ? 'Signal interest'
    : isCommitted
      ? 'Open your cohort'
      : !hasProfile && enrollmentOpen
        ? 'Complete profile to join'
        : enrollmentOpen
          ? 'Join the cohort'
          : 'Explore the cohort'

  return (
    <section className="portal-panel border-primary/40 bg-primary/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="portal-kicker">Current program</p>
        <span className="portal-pill">
          {isCommitted ? 'Committed' : cohort.enrollmentStatus.replace('-', ' ')}
        </span>
      </div>
      <h2 className="portal-heading-sm mt-3">{heading}</h2>
      <p className="mt-2 font-serif text-xl font-bold text-primary">{cohort.theme}</p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{cohort.summary}</p>
      {isGatheringInterest ? (
        <TrackedInquiryLink
          className="portal-admin-link mt-5 inline-flex"
          cohortInterestIntent="interested"
          cohortSlug={cohort.slug}
          href={getCohortInquiryHref(cohort, 'interested')}
          inquiryType="general"
          placement="dashboard_cohort"
        >
          {cta}
        </TrackedInquiryLink>
      ) : (
        <TrackedCohortLink
          className="portal-admin-link mt-5 inline-flex"
          cohortSlug={cohort.slug}
          href={cohortHref}
          placement="dashboard_brief"
        >
          {cta}
        </TrackedCohortLink>
      )}
    </section>
  )
}

const DashboardNavItem: React.FC<{
  href: string
  icon: React.ReactNode
  label: string
  summary: string
}> = ({ href, icon, label, summary }) => (
  <li>
    <Link
      className="group flex min-h-24 items-center gap-4 px-4 py-4 transition-colors hover:bg-card/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:px-5"
      href={href}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-foreground">{label}</span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">{summary}</span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
      />
    </Link>
  </li>
)

const DashboardNavigation: React.FC<{
  className?: string
  stats: NonNullable<DashboardProps['dashboardStats']>
}> = ({ className, stats }) => (
  <nav
    aria-label="Portal sections"
    className={`${className || ''} border-y border-border bg-card/20`}
  >
    <ul className="grid md:grid-cols-2 xl:grid-cols-4 [&>li]:border-b [&>li]:border-border [&>li:last-child]:border-b-0 md:[&>li:nth-child(odd)]:border-r md:[&>li:nth-last-child(-n+2)]:border-b-0 xl:[&>li]:border-b-0 xl:[&>li]:border-r xl:[&>li:last-child]:border-r-0">
      <DashboardNavItem
        href="/events"
        icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
        label="Sessions"
        summary={`${stats.sessions} Total Sessions`}
      />
      <DashboardNavItem
        href="/modules"
        icon={<Puzzle aria-hidden="true" className="h-5 w-5" />}
        label="Modules"
        summary={`${stats.modules} Total Modules`}
      />
      <DashboardNavItem
        href="/posts"
        icon={<FileText aria-hidden="true" className="h-5 w-5" />}
        label="Posts"
        summary={`${stats.posts} Total Posts`}
      />
      <DashboardNavItem
        href="/wiki"
        icon={<BookOpen aria-hidden="true" className="h-5 w-5" />}
        label="Wiki Pages"
        summary={`${stats.wikiPages} Total Wiki Pages`}
      />
    </ul>
  </nav>
)

const SpotlightSection: React.FC<{ className?: string; spotlights: Spotlight[] }> = ({
  className,
  spotlights,
}) => {
  if (!spotlights.length) return null

  const featured = spotlights.find((spotlight) => spotlight.kind === 'featured') || spotlights[0]
  const announcements = spotlights
    .filter((spotlight) => spotlight.id !== featured.id && spotlight.kind === 'announcement')
    .slice(0, 2)

  return (
    <section className={className ? className : 'container py-8'}>
      <div className={announcements.length ? 'grid gap-4 lg:grid-cols-[1fr_22rem]' : 'grid gap-4'}>
        <SpotlightCard spotlight={featured} />
        {announcements.length ? (
          <div className="grid gap-4">
            {announcements.map((spotlight) => (
              <SpotlightCard compact key={spotlight.id} spotlight={spotlight} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

const SpotlightCard: React.FC<{ compact?: boolean; spotlight: Spotlight }> = ({
  compact = false,
  spotlight,
}) => {
  const target = getSpotlightTarget(spotlight)
  const image = spotlight.image && typeof spotlight.image === 'object' ? spotlight.image : null
  const imageURL = image?.url

  const content = (
    <article
      className={`h-full border bg-card/70 p-5 transition-colors ${
        target.href ? 'hover:border-primary hover:bg-card' : ''
      } ${
        compact ? 'border-primary/35' : 'border-primary/60 shadow-[var(--shadow-emphasis)] md:p-7'
      }`}
    >
      <div className="mb-4 h-1 w-20 bg-primary" />
      {imageURL && !compact ? (
        <img
          alt=""
          className="mb-5 aspect-[16/7] w-full object-cover"
          loading="lazy"
          src={imageURL}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <p className="portal-kicker text-primary">{spotlight.kind}</p>
        {spotlight.expiresAt ? (
          <span className="text-xs text-muted-foreground">
            Until {formatDate(spotlight.expiresAt)}
          </span>
        ) : null}
      </div>
      <h2 className={compact ? 'mt-2 font-bold text-foreground' : 'mt-3 portal-heading'}>
        {spotlight.title}
      </h2>
      {spotlight.summary ? (
        <p
          className={`mt-3 text-sm leading-6 text-muted-foreground ${
            compact ? 'line-clamp-3' : 'max-w-3xl'
          }`}
        >
          {spotlight.summary}
        </p>
      ) : null}
      {target.label ? (
        <p className="mt-5 inline-flex border border-primary/70 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary">
          {target.label}
        </p>
      ) : null}
    </article>
  )

  if (!target.href) return content

  const isExternal = target.href.startsWith('http')

  return (
    <Link
      className="block"
      href={target.href}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {content}
    </Link>
  )
}

const getSpotlightTarget = (spotlight: Spotlight): { href: string | null; label: string } => {
  const label = spotlight.ctaLabel || defaultSpotlightCTALabels[spotlight.targetType]

  if (spotlight.targetType === 'thread') {
    const thread = spotlight.targetThread

    return {
      href: thread && typeof thread === 'object' ? `/threads/${thread.slug}` : null,
      label,
    }
  }

  if (spotlight.targetType === 'event') {
    const event = spotlight.targetEvent

    return {
      href: event && typeof event === 'object' ? `/events/${event.id}` : null,
      label,
    }
  }

  if (spotlight.targetType === 'project') {
    const project = spotlight.targetProject

    return {
      href: project && typeof project === 'object' ? `/projects/${project.slug}` : null,
      label,
    }
  }

  if (spotlight.targetType === 'post') {
    const post = spotlight.targetPost

    return {
      href: post && typeof post === 'object' ? `/posts/${post.slug}` : null,
      label,
    }
  }

  if (spotlight.targetType === 'profile') {
    const profile = spotlight.targetProfile

    return {
      href: profile && typeof profile === 'object' ? `/members/${profile.handle}` : null,
      label,
    }
  }

  if (spotlight.targetType === 'external') {
    return {
      href: toSafeURL(spotlight.externalURL, { allowRelative: false }),
      label,
    }
  }

  if (spotlight.targetType === 'artifact') {
    return {
      href: toSafeURL(spotlight.artifactURL, { allowRelative: false }),
      label,
    }
  }

  return {
    href: null,
    label,
  }
}

const defaultSpotlightCTALabels: Record<NonNullable<Spotlight['targetType']>, string> = {
  artifact: 'Open artifact',
  event: 'View session',
  external: 'Open link',
  post: 'Read post',
  profile: 'View profile',
  project: 'View project',
  thread: 'View thread',
}

const BriefPanel: React.FC<{ children: React.ReactNode; className?: string; title: string }> = ({
  children,
  className,
  title,
}) => (
  <section className={className}>
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const activityTypeLabels: Record<
  NonNullable<RecentContributor['activity']>['activityType'],
  string
> = {
  blocker: 'Blocker',
  contribution: 'Contribution',
  decision: 'Decision',
  discussion: 'Discussion',
  event: 'Session',
  insight: 'Insight',
  project: 'Project',
}

const RecentContributorsList: React.FC<{ contributors: RecentContributor[] }> = ({
  contributors,
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {contributors.slice(0, 8).map(({ activity, profile }) => {
      const avatar = profile.avatar && typeof profile.avatar === 'object' ? profile.avatar : null
      const avatarURL = avatar?.url
      const label = profile.displayName || profile.handle || 'Member'
      const href = profile.handle ? `/members/${profile.handle}` : '/members'

      return (
        <Link
          className="flex items-center gap-3 border border-border bg-card/20 p-3 transition-colors hover:border-primary hover:bg-card/40"
          href={href}
          key={profile.id}
        >
          {avatarURL ? (
            <img
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
              loading="lazy"
              src={avatarURL}
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-primary/15 font-mono text-xs font-bold uppercase text-primary">
              {getInitials(label)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-bold text-foreground">{label}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {profile.handle ? `@${profile.handle}` : 'Member profile'}
            </span>
            <span className="mt-2 block line-clamp-2 text-xs leading-5 text-muted-foreground">
              {activity?.title || truncateProfileBio(profile.bio)}
            </span>
            <span className="mt-1 block portal-kicker">
              {activity
                ? `${activityTypeLabels[activity.activityType]} · ${formatDate(activity.happenedAt)}`
                : ''}
            </span>
          </span>
        </Link>
      )
    })}
  </div>
)

const SafeTextLink: React.FC<{ className?: string; href?: string | null; label: string }> = ({
  className,
  href,
  label,
}) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) return <span className={className}>{label}</span>

  const isExternal = safeURL.startsWith('http')

  return (
    <Link
      className={`portal-link ${className || ''}`}
      href={safeURL}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const SafeAction: React.FC<{
  href?: string | null
  label: string
  variant?: 'default' | 'outline'
}> = ({ href, label, variant = 'default' }) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) return null

  const isExternal = safeURL.startsWith('http')

  return (
    <Button asChild size="sm" variant={variant}>
      <Link
        href={safeURL}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
      >
        {label}
      </Link>
    </Button>
  )
}
