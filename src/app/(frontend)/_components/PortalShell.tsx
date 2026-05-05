import Link from 'next/link'
import React from 'react'
import {
  ArrowRight,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  PenLine,
  UserRound,
  Users,
} from 'lucide-react'

import type { DailyBrief, Post, Profile, Project, User } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { toSafeURL } from '@/utilities/safeURL'

type PortalHomeProps = {
  posts?: Post[]
  projects?: Project[]
}

type DashboardProps = {
  dailyBrief?: DailyBrief | null
  profile?: Profile | null
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

export const PortalPublicHome: React.FC<PortalHomeProps> = ({ posts = [], projects = [] }) => {
  return (
    <main className="pb-24">
      <section className="container py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
              RaidGuild Portal
            </p>
            <h1 className="mb-6 text-4xl font-semibold leading-tight md:text-6xl">
              Discover the builders, projects, and stories moving through the Guild.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A lightweight home for profiles, public updates, project visibility, and the first
              steps toward joining RaidGuild.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/join">
                  Join the Portal <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/posts">Read updates</Link>
              </Button>
            </div>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
              Portal focus
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Profiles that make member skills and roles visible.</li>
              <li>Project pages that show what is being built and who contributed.</li>
              <li>Publishing surfaces for cohort updates, sessions, and public notes.</li>
            </ul>
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
                href="/projects"
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
    </main>
  )
}

export const PortalDashboard: React.FC<DashboardProps> = ({
  dailyBrief,
  profile,
  recentPosts = [],
  user,
}) => {
  const hasProfile = Boolean(profile)

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
        <DashboardLink href="/posts" icon={<PenLine className="h-5 w-5" />} label="Posts" />
      </section>

      <section className="mt-12 border border-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Daily Brief</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Latest authenticated signal for contributors and members.
            </p>
          </div>
          {dailyBrief?.briefDate ? (
            <p className="text-sm text-muted-foreground">{formatDate(dailyBrief.briefDate)}</p>
          ) : null}
        </div>
        {dailyBrief ? (
          <div className="mt-6">
            <h3 className="text-2xl font-semibold">{dailyBrief.title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {dailyBrief.summary}
            </p>
            {dailyBrief.sections?.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {dailyBrief.sections.map((section) => (
                  <div className="border border-border p-4" key={section.id || section.heading}>
                    <p className="font-medium">{section.heading}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
                    {section.links?.length ? (
                      <div className="mt-3 space-y-2">
                        {section.links.map((link) => {
                          const safeURL = toSafeURL(link.url)

                          if (!safeURL) {
                            return (
                              <span
                                className="block text-sm font-medium text-muted-foreground"
                                key={link.id || link.url}
                              >
                                {link.label}
                              </span>
                            )
                          }

                          return (
                            <Link
                              className="block text-sm font-medium underline"
                              href={safeURL}
                              key={link.id || link.url}
                            >
                              {link.label}
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No daily brief has been published yet.
          </p>
        )}
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
