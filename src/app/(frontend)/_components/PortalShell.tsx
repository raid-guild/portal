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
  UserRound,
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

type PortalHomeProps = {
  posts?: Post[]
  projects?: Project[]
  upcomingEvents?: Event[]
  weeklyBrief?: DailyBrief | null
}

type DashboardProps = {
  dailyBrief?: DailyBrief | null
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

export const PortalPublicHome: React.FC<PortalHomeProps> = ({
  posts = [],
  projects = [],
  upcomingEvents = [],
  weeklyBrief,
}) => {
  const nextEvent = upcomingEvents[0]
  const weeklyBriefMedia =
    weeklyBrief?.mediaFile && typeof weeklyBrief.mediaFile === 'object'
      ? weeklyBrief.mediaFile
      : null

  return (
    <main className="pb-24">
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
              RaidGuild Portal
            </p>
            <h1 className="mb-6 text-4xl font-semibold leading-tight md:text-6xl">
              See what is active in the Guild right now.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Public sessions, active project spikes, and recent updates give you a quick read on
              where to jump in before creating an account.
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
          <div className="border border-border p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <h2 className="font-semibold">Next public session</h2>
            </div>
            {nextEvent ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-normal text-muted-foreground">
                  {formatDateTime(nextEvent.startsAt)}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{nextEvent.title}</h2>
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
              <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
                Weekly Brief
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{weeklyBrief.title}</h2>
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
            <aside className="border border-border p-5">
              <p className="font-semibold">Brief media</p>
              {weeklyBriefMedia?.url ? (
                <div className="mt-4">
                  {weeklyBrief.mediaType === 'audio' ? (
                    <audio className="w-full" controls src={weeklyBriefMedia.url} />
                  ) : (
                    <video
                      className="aspect-video w-full bg-card"
                      controls
                      src={weeklyBriefMedia.url}
                    />
                  )}
                  <p className="mt-3 text-xs uppercase tracking-normal text-muted-foreground">
                    {weeklyBrief.mediaType || 'media'}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  The weekly media export will appear here when it is attached.
                </p>
              )}
            </aside>
          </div>
        </section>
      ) : null}

      <section className="border-y border-border bg-card/40 py-12">
        <div className="container grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="text-2xl font-semibold">Upcoming Sessions</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Live sessions are the easiest way to understand what is moving and where contributors
              are needed.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/events">View sessions</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingEvents.length ? (
              upcomingEvents.slice(0, 3).map((event) => (
                <article className="border border-border bg-background p-5" key={event.id}>
                  <p className="text-xs uppercase tracking-normal text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
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

      <section className="border-y border-border bg-card/40 py-12">
        <div className="container grid gap-8 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 className="text-2xl font-semibold">Public Updates</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Published posts stay public so visitors can see the current signal before creating an
              account.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {posts.length ? (
              posts.map((post) => (
                <Link
                  className="block border border-border bg-background p-5 transition-colors hover:bg-card"
                  href={`/posts/${post.slug}`}
                  key={post.id}
                >
                  <p className="text-xs uppercase tracking-normal text-muted-foreground">
                    {formatDate(post.publishedAt) || 'Published'}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{post.title}</h3>
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
            <h2 className="text-2xl font-semibold">Project Visibility</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Projects are for discovery and attribution, not task management.
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
                className="block border border-border p-5 transition-colors hover:bg-card"
                href={`/projects/${project.slug}`}
                key={project.id}
              >
                <p className="text-xs uppercase tracking-normal text-muted-foreground">
                  {project.projectStatus || 'Project'}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{project.title}</h3>
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

      <section className="border-t border-border bg-card/40 py-12">
        <div className="container grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold">Ready to participate?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create an account to build a profile, follow project work, and get routed toward the
              right sessions and contribution paths.
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
        </div>
      </section>
    </main>
  )
}

export const PortalDashboard: React.FC<DashboardProps> = ({
  dailyBrief,
  upcomingEvents = [],
  pointEvents = [],
  pointsTotal = 0,
  profile,
  recentProjects = [],
  recentPosts = [],
  user,
}) => {
  const hasProfile = Boolean(profile)
  const briefActivityItems = dailyBrief ? relationDocs<ActivityItem>(dailyBrief.activityItems) : []
  const briefThreads = dailyBrief ? relationDocs<Thread>(dailyBrief.threads) : []
  const nextEvent =
    dailyBrief?.nextEvent && typeof dailyBrief.nextEvent === 'object' ? dailyBrief.nextEvent : null

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Member Home
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Portal dashboard shell
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            This will become the authenticated home for profile completion, recent activity, useful
            links, and future collaboration signals.
          </p>
        </div>
        <div className="border-l border-border pl-6 text-sm">
          <p className="font-semibold">{user.email}</p>
          <p className="mt-2 text-muted-foreground">
            {hasProfile ? `Profile: ${profile?.displayName}` : 'No profile connected yet.'}
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardLink href="/me" icon={<UserRound className="h-5 w-5" />} label="My Profile" />
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

      <section className="mt-12 border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Guild Points</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Admin-issued contribution signal for future portal gamification.
            </p>
          </div>
          <p className="text-3xl font-semibold">{pointsTotal}</p>
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
                  <p className="font-semibold">+{event.amount}</p>
                  <p className="text-xs uppercase tracking-normal text-muted-foreground">
                    {event.source}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No point events yet.</p>
          )}
        </div>
      </section>

      <section className="mt-12 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <p className="font-semibold">RaidGuild Cohort</p>
            </div>
            {dailyBrief?.statusLabel ? (
              <span className="border border-border px-2 py-1 text-xs uppercase tracking-normal">
                {dailyBrief.statusLabel}
              </span>
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
                <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
                  What is happening
                </p>
                <h2 className="mt-2 text-3xl font-semibold">{dailyBrief.title}</h2>
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
              {nextEvent ? (
                <div className="border border-border p-4 text-sm">
                  <p className="font-semibold">Next session</p>
                  <p className="mt-2 text-muted-foreground">{nextEvent.title}</p>
                  <p className="mt-1 text-muted-foreground">{formatDateTime(nextEvent.startsAt)}</p>
                  {nextEvent.locationLabel ? (
                    <p className="mt-1 text-muted-foreground">{nextEvent.locationLabel}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <BriefPanel title="Recent Activity">
                {briefActivityItems.length ? (
                  <div className="space-y-3">
                    {briefActivityItems.slice(0, 6).map((item) => (
                      <article className="border border-border p-4" key={item.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-normal text-muted-foreground">
                            {item.activityType}
                          </p>
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
                      <article className="border border-border p-4" key={thread.id}>
                        <p className="text-xs uppercase tracking-normal text-muted-foreground">
                          {thread.threadStatus}
                        </p>
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
                <h2 className="text-xl font-semibold">Ways to Engage</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {dailyBrief.engagementActions.map((action) => (
                    <article className="border border-border p-4" key={action.id || action.label}>
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
            <Link className="text-sm font-medium underline" href="/events">
              View sessions
            </Link>
          }
          title="Next Upcoming Sessions"
        >
          {upcomingEvents.length ? (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <article className="border border-border p-4" key={event.id}>
                  <p className="text-xs uppercase tracking-normal text-muted-foreground">
                    {formatDateTime(event.startsAt)}
                  </p>
                  <h3 className="mt-2 font-semibold">{event.title}</h3>
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
            <Link className="text-sm font-medium underline" href="/projects">
              View projects
            </Link>
          }
          title="Recently Active Projects"
        >
          {recentProjects.length ? (
            <div className="space-y-4">
              {recentProjects.slice(0, 3).map((project) => (
                <Link
                  className="block border border-border p-4 transition-colors hover:bg-card"
                  href={`/projects/${project.slug}`}
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-normal text-muted-foreground">
                      {project.projectStatus || 'Project'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(project.lastActiveAt || project.updatedAt) || 'Recently active'}
                    </p>
                  </div>
                  <h3 className="mt-2 font-semibold">{project.title}</h3>
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
        <div className="border border-border p-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Next Profile Step</h2>
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
        <div className="border border-border p-6">
          <h2 className="text-xl font-semibold">Recent Public Posts</h2>
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
    className="flex min-h-24 items-center justify-between border border-border p-5 transition-colors hover:bg-card"
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
    <h2 className="text-xl font-semibold">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
)

const DashboardPanel: React.FC<{
  action?: React.ReactNode
  children: React.ReactNode
  title: string
}> = ({ action, children, title }) => (
  <section className="border border-border p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
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
      className={`text-sm font-medium underline ${className || ''}`}
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
