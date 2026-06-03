import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canContributeContent, hasRole } from '@/access/roles'
import { Comments } from '@/components/Comments'
import { ContributionRequestCard } from '../../_components/ContributionRequestCard'
import type {
  ActivityItem,
  ContributionRequest,
  Event,
  Media,
  Profile,
  Project,
  ProfileSkill,
  Thread,
  User,
} from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import { getProfileIDForUser, isProjectStewardProfile } from '../formData'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const formatDateTime = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const formatDate = (date?: string | null) => {
  if (!date) return null

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export default async function ProjectPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const [project, currentProfileID] = await Promise.all([
    queryProjectBySlug({ slug, user }),
    user ? getProfileIDForUser(user.id, user) : Promise.resolve(null),
  ])

  if (!project) notFound()

  const activityItems = mergeByID(
    relationDocs<ActivityItem>(project.activityItems),
    await getActivityItemsForProject(project.id, user),
  ).sort((a, b) => new Date(b.happenedAt || 0).getTime() - new Date(a.happenedAt || 0).getTime())
  const contributionRequests = await getOpenContributionRequestsForProject(project.id, user)
  const threads = relationDocs<Thread>(project.threads)
  const events = relationDocs<Event>(project.events)
  const stewards = relationDocs<Profile>(project.stewards)
  const contributors = relationDocs<Profile>(project.contributors)
  const skills = relationDocs<ProfileSkill>(project.profileSkills)
  const canCreateRequests = canContributeContent(user) || hasRole(user, 'member')
  const canManageProject =
    canContributeContent(user) ||
    (user ? isProjectStewardProfile(project, currentProfileID) : false)

  return (
    <main className="container pb-24 pt-12">
      <ProjectCoverImage coverImage={project.coverImage} title={project.title} />

      <section className="grid gap-8 border-b border-border pb-10 pt-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <Link
            className="text-sm font-medium text-muted-foreground hover:underline"
            href="/projects"
          >
            Projects
          </Link>
          <p className="mt-6 portal-kicker">{project.projectStatus || 'Project spike'}</p>
          <h1 className="mt-3 portal-title">{project.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            {project.summary}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span className="portal-pill" key={skill.id}>
                {skill.title}
              </span>
            ))}
          </div>
          {canManageProject ? (
            <Link
              className="portal-admin-link mt-6 inline-flex"
              href={`/projects/${project.slug}/edit`}
            >
              Manage project
            </Link>
          ) : null}
        </div>
        <aside className="portal-panel text-sm">
          <p className="font-bold">Project state</p>
          <p className="mt-2 text-muted-foreground">
            Last active: {formatDate(project.lastActiveAt || project.updatedAt) || 'Recently'}
          </p>
          {contributors.length ? (
            <div className="mt-5">
              <p className="font-medium">People</p>
              <p className="mt-2 text-muted-foreground">
                {contributors.map((profile) => profile.displayName).join(', ')}
              </p>
            </div>
          ) : null}
          {stewards.length ? (
            <div className="mt-5">
              <p className="font-medium">Stewards</p>
              <p className="mt-2 text-muted-foreground">
                {stewards.map((profile) => profile.displayName).join(', ')}
              </p>
            </div>
          ) : null}
          {!stewards.length && user ? (
            <p className="mt-5 text-xs text-muted-foreground">No steward is assigned yet.</p>
          ) : null}
          <ActionLink action={project.primaryCTA} className="mt-5 block" />
        </aside>
      </section>

      {project.currentState?.length ? (
        <section className="mt-10 portal-panel">
          <h2 className="portal-heading">What is happening</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            {project.currentState.map((item) => (
              <li key={item.id || item.body}>{item.body}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Section title="Activity">
            {activityItems.length ? (
              <div className="space-y-3">
                {activityItems.map((item) => (
                  <article className="portal-card" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="portal-kicker">{item.activityType}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.happenedAt)}
                      </p>
                    </div>
                    <h3 className="mt-2 font-bold">{item.title}</h3>
                    {item.body ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    ) : null}
                    {item.sourceLabel ? (
                      <p className="mt-3 text-xs text-muted-foreground">{item.sourceLabel}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity has been linked yet.</p>
            )}
          </Section>

          <Section title="Threads">
            {threads.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {threads.map((thread) => (
                  <article className="portal-card" key={thread.id}>
                    <p className="portal-kicker">{thread.threadStatus}</p>
                    <h3 className="mt-2 font-bold">{thread.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{thread.summary}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active threads have been linked yet.
              </p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Contribution Requests">
            {canCreateRequests ? (
              <Link
                className="portal-admin-link mb-4 inline-flex"
                href={`/requests/new?project=${project.id}`}
              >
                Create request
              </Link>
            ) : null}
            {contributionRequests.length ? (
              <div className="space-y-3">
                {contributionRequests.map((request) => (
                  <ContributionRequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No open contribution requests are linked yet.
              </p>
            )}
          </Section>

          <Section title="Next Sessions">
            {events.length ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <article className="portal-card" key={event.id}>
                    <h3 className="font-bold">{event.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDateTime(event.startsAt)}
                    </p>
                    {event.locationLabel ? (
                      <p className="mt-1 text-sm text-muted-foreground">{event.locationLabel}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <SafeLink href={event.joinURL} label="Join" />
                      <SafeLink href={event.calendarURL} label="Add to Calendar" />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No project sessions have been linked yet.
              </p>
            )}
          </Section>

          <Section title="Ways to Contribute">
            {project.contributionActions?.length ? (
              <div className="space-y-3">
                {project.contributionActions.map((action) => (
                  <article className="portal-card" key={action.id || action.title}>
                    <h3 className="font-bold">{action.title}</h3>
                    {action.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {action.description}
                      </p>
                    ) : null}
                    <SafeLink className="mt-3 inline-block" href={action.url} label="Open" />
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contribution paths are listed yet.</p>
            )}
          </Section>

          <Section title="Resources">
            {project.resources?.length || project.links?.length ? (
              <div className="space-y-2 text-sm">
                {project.resources?.map((resource) => (
                  <SafeLink
                    className="block"
                    href={resource.url}
                    key={resource.id || resource.url}
                    label={resource.label}
                  />
                ))}
                {project.links?.map((link) => (
                  <SafeLink
                    className="block"
                    href={link.url}
                    key={link.id || link.url}
                    label={link.label}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No resources have been linked yet.</p>
            )}
          </Section>
        </div>
      </section>

      {user ? (
        <Section title="Comments">
          <Comments
            canComment
            className="py-0"
            commenterLabel={user.name || user.email}
            parent={{ relationTo: 'projects', value: project.id }}
            title={null}
            user={user}
          />
        </Section>
      ) : null}
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const project = await queryProjectBySlug({ slug, user })

  return {
    description: project?.summary,
    title: project?.title || 'Project',
  }
}

const Section: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <section className="portal-panel">
    <h2 className="portal-heading-sm">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
)

const ProjectCoverImage: React.FC<{
  coverImage?: number | Media | null
  title: string
}> = ({ coverImage, title }) => {
  if (!coverImage || typeof coverImage !== 'object' || !coverImage.url) return null

  return (
    <div className="mb-8 aspect-[1200/630] overflow-hidden bg-muted border border-border">
      <img
        alt={coverImage.alt || `${title} cover image`}
        className="h-full w-full object-cover"
        src={coverImage.url}
      />
    </div>
  )
}

const SafeLink: React.FC<{ className?: string; href?: string | null; label: string }> = ({
  className,
  href,
  label,
}) => {
  const safeURL = toSafeURL(href)

  if (!safeURL) {
    return <span className={className}>{label}</span>
  }

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

const ActionLink: React.FC<{
  action?: Project['primaryCTA']
  className?: string
}> = ({ action, className }) => {
  if (!action?.label || !action.url) return null

  return <SafeLink className={className} href={action.url} label={action.label} />
}

const queryProjectBySlug = cache(async ({ slug, user }: { slug: string; user: User | null }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'projects',
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
})

const getOpenContributionRequestsForProject = async (
  projectID: number,
  user: User | null,
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
          project: {
            equals: projectID,
          },
        },
      ],
    },
  })

  return result.docs
}

const getActivityItemsForProject = async (
  projectID: number,
  user: User | null,
): Promise<ActivityItem[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'activityItems',
    depth: 0,
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
          relatedProject: {
            equals: projectID,
          },
        },
      ],
    },
  })

  return result.docs
}

const mergeByID = <T extends { id: number }>(primary: T[], secondary: T[]): T[] => {
  const seen = new Set<number>()
  const merged: T[] = []

  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    merged.push(item)
  }

  return merged
}
