import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Comments } from '@/components/Comments'
import type {
  ContributionRequest,
  Event,
  Post,
  Profile,
  ProfileSkill,
  Project,
  Thread,
  User,
} from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import { canManageContributionRequest } from '../formData'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

const requestTypeLabels: Record<NonNullable<ContributionRequest['requestType']>, string> = {
  collaborator: 'Collaborator',
  feedback: 'Feedback',
  good_first_contribution: 'Good first contribution',
  help_wanted: 'Help wanted',
  resource: 'Resource',
  review: 'Review',
}

const requestStatusLabels: Record<NonNullable<ContributionRequest['requestStatus']>, string> = {
  archived: 'Archived',
  filled: 'Filled',
  in_discussion: 'In discussion',
  open: 'Open',
  paused: 'Paused',
}

const relationDocs = <T extends { id: number }>(items?: (number | T)[] | null): T[] =>
  items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export default async function ContributionRequestPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const request = await queryContributionRequestBySlug({ slug, user })

  if (!request) notFound()

  const owner = typeof request.owner === 'object' ? request.owner : null
  const project = typeof request.project === 'object' ? request.project : null
  const events = relationDocs<Event>(request.relatedEvents)
  const threads = relationDocs<Thread>(request.relatedThreads)
  const posts = relationDocs<Post>(request.relatedPosts)
  const profiles = relationDocs<Profile>(request.relatedProfiles)
  const skills = relationDocs<ProfileSkill>(request.profileSkills)
  const responseURL = toSafeURL(request.responseURL)
  const canEditRequest = await canManageContributionRequest(user, request)

  return (
    <main className="container pb-24 pt-12">
      <Link
        className="portal-link"
        href={project?.slug ? `/projects/${project.slug}` : '/projects'}
      >
        Back to projects
      </Link>

      <section className="mt-8 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="portal-pill">
              {requestTypeLabels[request.requestType || 'help_wanted']}
            </span>
            <span className="portal-pill">
              {requestStatusLabels[request.requestStatus || 'open']}
            </span>
            <span className="text-sm text-muted-foreground">{request.visibility}</span>
          </div>
          <h1 className="portal-title mt-5">{request.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            {request.summary}
          </p>
        </div>

        <aside className="portal-panel text-sm">
          <p className="font-bold">Request</p>
          {owner ? (
            <p className="mt-3 text-muted-foreground">
              Asked by <ProfileLink profile={owner} />
            </p>
          ) : null}
          {project ? (
            <p className="mt-3 text-muted-foreground">
              Project:{' '}
              {project.slug ? (
                <Link className="portal-link" href={`/projects/${project.slug}`}>
                  {project.title}
                </Link>
              ) : (
                project.title
              )}
            </p>
          ) : null}
          {responseURL ? (
            <Link
              className="portal-admin-link mt-5 inline-block"
              href={responseURL}
              rel={responseURL.startsWith('http') ? 'noopener noreferrer' : undefined}
              target={responseURL.startsWith('http') ? '_blank' : undefined}
            >
              Respond
            </Link>
          ) : null}
          {canEditRequest && request.slug ? (
            <Link className="portal-link mt-4 inline-block" href={`/requests/${request.slug}/edit`}>
              Edit request
            </Link>
          ) : null}
        </aside>
      </section>

      {request.body ? (
        <Section title="Context">
          <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {request.body}
          </p>
        </Section>
      ) : null}

      {skills.length ? (
        <Section title="Useful Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span className="portal-pill" key={skill.id}>
                {skill.title}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {events.length || threads.length || posts.length || profiles.length ? (
        <Section title="Related Context">
          <div className="grid gap-4 md:grid-cols-2">
            {events.length ? (
              <RelationList
                items={events.map((event) => ({
                  href: `/events/${event.id}`,
                  label: event.title,
                }))}
                title="Sessions"
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
            {posts.length ? (
              <RelationList
                items={posts.map((post) => ({
                  href: post.slug ? `/posts/${post.slug}` : null,
                  label: post.title,
                }))}
                title="Posts"
              />
            ) : null}
            {profiles.length ? (
              <RelationList
                items={profiles.map((profile) => ({
                  href: profile.handle ? `/members/${profile.handle}` : null,
                  label: profile.displayName,
                }))}
                title="People"
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      <Comments parent={{ relationTo: 'contributionRequests', value: request.id }} />
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const user = await getCurrentUser()
  const request = await queryContributionRequestBySlug({ slug, user })

  return {
    description: request?.summary || 'RaidGuild contribution request.',
    title: request?.title || 'Contribution request',
  }
}

const Section: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <section className="mt-12">
    <h2 className="portal-heading">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>
)

const ProfileLink: React.FC<{ profile: Profile }> = ({ profile }) => {
  if (!profile.handle) return <span>{profile.displayName}</span>

  return (
    <Link className="portal-link" href={`/members/${profile.handle}`}>
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

const queryContributionRequestBySlug = cache(
  async ({ slug, user }: { slug: string; user: User | null }) => {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'contributionRequests',
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
  },
)
