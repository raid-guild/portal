import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Event, Post, Profile, Project } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { toSafeURL } from '@/utilities/safeURL'
import { getBadgeSummariesByProfile, type BadgeSummary } from '../badgeData'
import { MemberProfileClaimCard } from './MemberProfileClaimCard'

export const dynamic = 'force-dynamic'

type MemberProfilePageProps = {
  params: Promise<{
    handle: string
  }>
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const user = await getCurrentUser()
  const { handle } = await params
  const profile = await getProfile(handle, user)

  if (!profile) notFound()

  const createdRecords = await getCreatedRecords(profile, user)
  const badges = await getProfileBadges(profile.id, user)
  const avatar = typeof profile.avatar === 'object' && profile.avatar ? profile.avatar : null
  const profileUserID = typeof profile.user === 'object' ? profile.user?.id : profile.user
  const canRequestClaim = Boolean(user && profile.claimStatus === 'unclaimed' && !profileUserID)
  const roles = taxonomy(profile.profileRoles)
  const skills = taxonomy(profile.profileSkills)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="mb-4 portal-kicker">Member Profile</p>
          <div className="flex items-center gap-5">
            {avatar?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-20 w-20 rounded-full object-cover" src={avatar.url} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border portal-heading">
                {profile.displayName.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="portal-title">{profile.displayName}</h1>
              <p className="mt-2 text-muted-foreground">@{profile.handle}</p>
            </div>
          </div>
          <p className="mt-8 max-w-3xl text-base leading-7 text-muted-foreground">{profile.bio}</p>
        </div>
        <aside className="portal-panel">
          <p className="font-bold">Links</p>
          <div className="mt-4 space-y-3">
            {profile.links?.length ? (
              profile.links.map((link) => {
                const safeURL = toSafeURL(link.url, { allowRelative: false })
                if (!safeURL) return null

                return (
                  <Link
                    className="block portal-link"
                    href={safeURL}
                    key={link.id || link.label}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </Link>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No public links yet.</p>
            )}
          </div>
        </aside>
      </section>

      {canRequestClaim ? <MemberProfileClaimCard profileID={profile.id} /> : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <BadgeShelf badges={badges} />
        <Taxonomy title="Roles" values={roles} />
        <Taxonomy title="Skills" values={skills} />
      </section>

      <section className="mt-12">
        <h2 className="portal-heading">Created records</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <CreatedList items={createdRecords.projects} title="Projects" />
          <CreatedList items={createdRecords.events} title="Sessions" />
          <CreatedList items={createdRecords.posts} title="Posts" />
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Member Profile',
}

const Taxonomy: React.FC<{ title: string; values: string[] }> = ({ title, values }) => (
  <div className="portal-panel">
    <h2 className="font-bold">{title}</h2>
    <div className="mt-4 flex flex-wrap gap-2">
      {values.length ? (
        values.map((value) => (
          <span className="portal-pill" key={value}>
            {value}
          </span>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">None listed.</p>
      )}
    </div>
  </div>
)

const BadgeShelf: React.FC<{ badges: BadgeSummary[] }> = ({ badges }) => (
  <div className="portal-panel lg:col-span-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold">Badges</h2>
      <Link className="portal-link text-sm" href="/badges">
        Browse badges
      </Link>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {badges.length ? (
        badges.map((badge) => (
          <span
            className="portal-pill border-primary/40 bg-primary/10 text-foreground"
            key={badge.id}
          >
            {badge.title}
          </span>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No badges awarded yet.</p>
      )}
    </div>
  </div>
)

const CreatedList: React.FC<{ items: (Event | Post | Project)[]; title: string }> = ({
  items,
  title,
}) => (
  <div className="portal-panel">
    <h3 className="font-bold">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.length ? (
        items.map((item) => <RecordLink item={item} key={item.id} />)
      ) : (
        <p className="text-sm text-muted-foreground">Nothing listed yet.</p>
      )}
    </div>
  </div>
)

const RecordLink: React.FC<{ item: Event | Post | Project }> = ({ item }) => {
  const href =
    'slug' in item && item.slug
      ? 'projectStatus' in item
        ? `/projects/${item.slug}`
        : `/posts/${item.slug}`
      : 'startsAt' in item
        ? `/events/${item.id}`
        : null

  if (!href) return <p className="text-sm font-medium">{item.title}</p>

  return (
    <Link className="block text-sm font-medium hover:text-primary" href={href}>
      {item.title}
    </Link>
  )
}

const getProfile = async (handle: string, user: Awaited<ReturnType<typeof getCurrentUser>>) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: user || undefined,
    where: {
      handle: {
        equals: handle,
      },
    },
  })

  return result.docs[0] || null
}

const getCreatedRecords = async (
  profile: Profile,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
) => {
  const payload = await getPayload({ config: configPromise })
  const profileUser = typeof profile.user === 'object' ? profile.user : null
  const userID = profileUser?.id || profile.user
  const hasUserID = typeof userID === 'number' || Boolean(userID && !Number.isNaN(Number(userID)))

  const [projects, events, posts] = await Promise.all([
    payload.find({
      collection: 'projects',
      depth: 0,
      limit: 6,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user: user || undefined,
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            contributors: {
              in: [profile.id],
            },
          },
        ],
      },
    }),
    payload.find({
      collection: 'events',
      depth: 0,
      limit: 6,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user: user || undefined,
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            relatedProfiles: {
              in: [profile.id],
            },
          },
        ],
      },
    }),
    hasUserID
      ? payload.find({
          collection: 'posts',
          depth: 0,
          limit: 6,
          overrideAccess: false,
          pagination: false,
          sort: '-updatedAt',
          user: user || undefined,
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              {
                authors: {
                  in: [userID],
                },
              },
            ],
          },
        })
      : Promise.resolve({
          docs: [],
        }),
  ])

  return {
    events: events.docs,
    posts: posts.docs,
    projects: projects.docs,
  }
}

const getProfileBadges = async (
  profileID: number | string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
) => {
  const payload = await getPayload({ config: configPromise })
  const badgesByProfile = await getBadgeSummariesByProfile({
    payload,
    profileIDs: [profileID],
    user,
  })

  return badgesByProfile.get(String(profileID)) || []
}

const taxonomy = (items?: unknown[] | null) =>
  (items || [])
    .filter((item): item is { title: string } =>
      Boolean(item && typeof item === 'object' && 'title' in item),
    )
    .map((item) => item.title)
