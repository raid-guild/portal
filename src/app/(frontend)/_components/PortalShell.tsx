import Link from 'next/link'
import React from 'react'
import {
  ArrowRight,
  Award,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  PenLine,
  Users,
} from 'lucide-react'

import type {
  ActivityItem,
  DailyBrief,
  Event,
  PointEvent,
  Post,
  Profile,
  Project,
  Thread,
  User,
} from '@/payload-types'
import { Button } from '@/components/ui/button'
import { toSafeURL } from '@/utilities/safeURL'
import { VibeCheckButton } from './VibeCheckButton'

type PortalHomeProps = {
  posts?: Post[]
  projects?: Project[]
  upcomingEvents?: Event[]
  weeklyBrief?: DailyBrief | null
}

type DashboardProps = {
  dailyBrief?: DailyBrief | null
  dailyEngagementSummary?: {
    currentStreak: number
    hasCheckedInToday: boolean
    todayVibe?: string | null
  }
  upcomingEvents?: Event[]
  pointEvents?: PointEvent[]
  pointsTotal?: number
  profile?: Profile | null
  recentProjects?: Project[]
  recentPosts?: Post[]
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

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

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

export const PortalPublicHome: React.FC<PortalHomeProps> = ({
  posts = [],
  projects = [],
  upcomingEvents = [],
  weeklyBrief,
}) => {
  const nextEvent = upcomingEvents[0]

  return (
    <main className="pb-24">
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 portal-kicker">RaidGuild Portal</p>
            <h1 className="mb-6 portal-title-lg">A digital coworking space for builders</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Join sessions, find a team, build your skills, and help turn ideas into shipped work
              with the RaidGuild community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/join">
                  Join RaidGuild <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/events">View sessions</Link>
              </Button>
            </div>
          </div>
          <div className="portal-panel">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <h2 className="portal-heading-sm">Next public session</h2>
            </div>
            {nextEvent ? (
              <div className="mt-4">
                <p className="portal-kicker">{formatDateTime(nextEvent.startsAt)}</p>
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
                No public sessions are scheduled yet. Join to get access to member coordination.
              </p>
            )}
          </div>
        </div>
      </section>

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
                  <p className="portal-kicker">{formatDateTime(event.startsAt)}</p>
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

      <section className="container py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="portal-heading">Find a Team</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Active projects help builders discover collaboration surfaces, people, context, and
              useful next steps.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/projects">View projects</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {projects.length ? (
            projects.map((project) => (
              <Link
                className="block portal-card"
                href={`/projects/${project.slug}`}
                key={project.id}
              >
                <p className="portal-kicker">{project.projectStatus || 'Project'}</p>
                <h3 className="mt-2 portal-heading-sm">{project.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {project.summary}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Seeded project examples are coming next.
            </p>
          )}
        </div>
      </section>

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
            <Link
              className="font-bold text-foreground underline decoration-primary/50"
              href="/sponsor"
            >
              Sponsor an opportunity
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}

export const PortalDashboard: React.FC<DashboardProps> = ({
  dailyBrief,
  dailyEngagementSummary,
  upcomingEvents = [],
  pointEvents = [],
  pointsTotal = 0,
  profile,
  recentProjects = [],
  recentPosts = [],
  user,
}) => {
  const hasProfile = Boolean(profile)
  const vibeSummary = dailyEngagementSummary || {
    currentStreak: 0,
    hasCheckedInToday: false,
    todayVibe: null,
  }
  const briefActivityItems = dailyBrief ? relationDocs<ActivityItem>(dailyBrief.activityItems) : []
  const briefThreads = dailyBrief ? relationDocs<Thread>(dailyBrief.threads) : []
  const nextEvent =
    dailyBrief?.nextEvent && typeof dailyBrief.nextEvent === 'object' ? dailyBrief.nextEvent : null

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="mb-4 portal-kicker">Member Home</p>
          <h1 className="portal-title">Portal dashboard shell</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            This will become the authenticated home for profile completion, recent activity, useful
            links, and future collaboration signals.
          </p>
        </div>
        <div className="border-l border-border pl-6 text-sm">
          <p className="font-mono text-sm font-bold">{user.email}</p>
          <p className="mt-2 text-muted-foreground">
            {hasProfile ? `Profile: ${profile?.displayName}` : 'No profile connected yet.'}
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardLink href="/members" icon={<Users className="h-5 w-5" />} label="Members" />
        <DashboardLink
          href="/projects"
          icon={<FolderKanban className="h-5 w-5" />}
          label="Projects"
        />
        <DashboardLink
          href="/events"
          icon={<CalendarDays className="h-5 w-5" />}
          label="Sessions"
        />
        <DashboardLink href="/posts" icon={<PenLine className="h-5 w-5" />} label="Posts" />
      </section>

      <section className="mt-12 portal-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <h2 className="portal-heading-sm">Guild Points</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Contribution signal for portal participation, publishing, sessions, and admin awards.
            </p>
          </div>
          <p className="portal-heading">{pointsTotal}</p>
        </div>
        <div className="mt-5 border-y border-border py-4">
          <VibeCheckButton
            currentStreak={vibeSummary.currentStreak}
            hasCheckedInToday={vibeSummary.hasCheckedInToday}
            todayVibe={vibeSummary.todayVibe}
          />
        </div>
        <div className="mt-5 space-y-3">
          {pointEvents.length ? (
            pointEvents.map((event) => (
              <div className="flex items-start justify-between gap-4 text-sm" key={event.id}>
                <div>
                  <p className="font-medium">{event.reason}</p>
                  {event.description ? (
                    <p className="mt-1 text-muted-foreground">{event.description}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">+{event.amount}</p>
                  <p className="portal-kicker">{event.source}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No point events yet.</p>
          )}
        </div>
      </section>

      <section className="mt-12 border border-border bg-background/70">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <p className="portal-heading-sm">RaidGuild Cohort</p>
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
          {nextEvent ? (
            <div className="flex flex-wrap gap-3">
              <SafeAction href={nextEvent.joinURL} label="Join next session" />
              <SafeAction href={nextEvent.calendarURL} label="Add to calendar" variant="outline" />
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
                  emptyText="The daily media export will appear here when it is attached."
                />
                {nextEvent ? (
                  <div className="portal-card text-sm">
                    <p className="font-bold text-foreground">Next session</p>
                    <p className="mt-2 text-muted-foreground">{nextEvent.title}</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatDateTime(nextEvent.startsAt)}
                    </p>
                    {nextEvent.locationLabel ? (
                      <p className="mt-1 text-muted-foreground">{nextEvent.locationLabel}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <BriefPanel title="Recent Activity">
                {briefActivityItems.length ? (
                  <div className="space-y-3">
                    {briefActivityItems.slice(0, 6).map((item) => (
                      <article className="portal-card" key={item.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="portal-kicker">{item.activityType}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(item.happenedAt)}
                          </p>
                        </div>
                        <h3 className="mt-2 font-medium">{item.title}</h3>
                        {item.body ? (
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {item.body}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recent activity has been linked.
                  </p>
                )}
              </BriefPanel>

              <BriefPanel title="Active Threads">
                {briefThreads.length ? (
                  <div className="space-y-3">
                    {briefThreads.slice(0, 6).map((thread) => (
                      <article className="portal-card" key={thread.id}>
                        <p className="portal-kicker">{thread.threadStatus}</p>
                        <h3 className="mt-2 font-medium">{thread.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {thread.summary}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active threads have been linked.
                  </p>
                )}
              </BriefPanel>
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
            No daily brief has been published yet.
          </p>
        )}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <DashboardPanel
          action={
            <Link className="portal-link" href="/events">
              View sessions
            </Link>
          }
          title="Next Upcoming Sessions"
        >
          {upcomingEvents.length ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <article className="portal-card" key={event.id}>
                  <p className="portal-kicker">{formatDateTime(event.startsAt)}</p>
                  <h3 className="mt-2 font-bold text-foreground">{event.title}</h3>
                  {event.locationLabel ? (
                    <p className="mt-2 text-sm text-muted-foreground">{event.locationLabel}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <SafeTextLink href={event.joinURL} label="Join" />
                    <SafeTextLink href={event.calendarURL} label="Add to calendar" />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming sessions are published yet.</p>
          )}
        </DashboardPanel>

        <DashboardPanel
          action={
            <Link className="portal-link" href="/projects">
              View projects
            </Link>
          }
          title="Recently Active Projects"
        >
          {recentProjects.length ? (
            <div className="space-y-4">
              {recentProjects.slice(0, 3).map((project) => (
                <Link
                  className="block portal-card transition-colors hover:bg-card"
                  href={`/projects/${project.slug}`}
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="portal-kicker">{project.projectStatus || 'Project'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(project.lastActiveAt || project.updatedAt) || 'Recently active'}
                    </p>
                  </div>
                  <h3 className="mt-2 font-bold text-foreground">{project.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {project.summary}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active projects are published yet.</p>
          )}
        </DashboardPanel>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="portal-panel">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <h2 className="portal-heading-sm">Next Profile Step</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {hasProfile
              ? 'Review your profile details, roles, skills, and visibility settings.'
              : 'Create a profile so members can discover who you are and what you build.'}
          </p>
          <Button asChild className="mt-5">
            <Link href="/me">{hasProfile ? 'Review profile' : 'Start profile'}</Link>
          </Button>
        </div>
        <div className="portal-panel">
          <h2 className="portal-heading-sm">Recent Public Posts</h2>
          <div className="mt-4 space-y-4">
            {recentPosts.length ? (
              recentPosts.map((post) => (
                <Link
                  className="block text-sm hover:underline"
                  href={`/posts/${post.slug}`}
                  key={post.id}
                >
                  {post.title}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

const DashboardLink: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({
  href,
  icon,
  label,
}) => (
  <Link
    className="flex min-h-24 items-center justify-between portal-panel transition-colors hover:bg-card"
    href={href}
  >
    <span className="flex items-center gap-3 font-medium">
      {icon}
      {label}
    </span>
    <ArrowRight className="h-4 w-4" />
  </Link>
)

const BriefPanel: React.FC<{ children: React.ReactNode; title: string }> = ({
  children,
  title,
}) => (
  <section>
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const DashboardPanel: React.FC<{
  action?: React.ReactNode
  children: React.ReactNode
  title: string
}> = ({ action, children, title }) => (
  <section className="portal-panel">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="portal-heading-sm">{title}</h2>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
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
