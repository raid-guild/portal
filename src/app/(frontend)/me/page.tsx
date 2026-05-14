import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  Event,
  Post,
  Profile,
  ProfileRole,
  ProfileSkill,
  Project,
  User,
} from '@/payload-types'
import { ProfileWizardForm } from '../_components/ProfileWizardForm'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export default async function MePage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  const [profile, pointsTotal, skills, roles] = await Promise.all([
    getProfileForUser(user.id),
    getPointsTotal(user),
    getProfileSkills(),
    getProfileRoles(),
  ])

  const createdRecords = await getCreatedRecords(user, profile)

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Profile Builder
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">My profile</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Manage your public identity, avatar, links, skills, roles, and visibility without
            entering Payload Admin.
          </p>
        </div>
        <div className="border-l border-border pl-6 text-sm">
          <p className="font-semibold">{user.email}</p>
          <p className="mt-2 text-muted-foreground">
            {profile ? 'Profile connected' : 'Profile not started'}
          </p>
          <p className="mt-3 text-2xl font-semibold">{pointsTotal} points</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Profile wizard</h2>
        <ProfileWizardForm profile={profile} roles={roles} skills={skills} />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border p-6">
          <h2 className="text-xl font-semibold">Current Profile</h2>
          {profile ? (
            <ProfileSummary profile={profile} />
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-muted-foreground">
                No profile exists for this account yet. Use the profile wizard above to create one.
              </p>
            </div>
          )}
        </div>
        <div className="border border-border p-6">
          <h2 className="text-xl font-semibold">Profile Checklist</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Basic identity: handle, display name, bio, location.</li>
            <li>Links: website, GitHub, Farcaster, Discord, portfolio.</li>
            <li>Profile skills: choose the capabilities people should find you by.</li>
            <li>Profile roles: choose up to two RaidGuild roles.</li>
            <li>Visibility: public, authenticated members, or private.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Created by you</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Drafts and published records connected to your user or profile.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <CreatedList items={createdRecords.projects} title="Projects" />
          <CreatedList items={createdRecords.events} title="Sessions" />
          <CreatedList items={createdRecords.posts} title="Posts" />
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <TaxonomyList
          description="Skills are broad capabilities used for discovery and project matching."
          items={skills}
          title="Available Skills"
        />
        <TaxonomyList
          description="Roles are RaidGuild identity markers. The profile flow should limit members to two."
          items={roles}
          title="Available Roles"
        />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'My Profile',
}

const ProfileSummary: React.FC<{ profile: Profile }> = ({ profile }) => {
  const avatar = typeof profile.avatar === 'object' && profile.avatar ? profile.avatar : null

  return (
    <div className="mt-4 space-y-4 text-sm leading-6">
      <div className="flex items-center gap-4">
        {avatar?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-14 w-14 rounded-full object-cover" src={avatar.url} />
        ) : null}
        <div>
          <p className="font-semibold">{profile.displayName}</p>
          <p className="text-muted-foreground">@{profile.handle}</p>
        </div>
      </div>
      <p className="text-muted-foreground">{profile.bio}</p>
      <div className="flex flex-wrap gap-2">
        <span className="border border-border px-2 py-1 text-xs">Status: {profile.status}</span>
        <span className="border border-border px-2 py-1 text-xs">
          Visibility: {profile.visibility}
        </span>
      </div>
    </div>
  )
}

const CreatedList: React.FC<{
  items: (Event | Post | Project)[]
  title: string
}> = ({ items, title }) => (
  <div className="border border-border p-5">
    <h3 className="font-semibold">{title}</h3>
    <div className="mt-4 space-y-3">
      {items.length ? (
        items.map((item) => (
          <article className="text-sm" key={item.id}>
            <p className="font-medium">{item.title}</p>
            {'_status' in item ? (
              <p className="text-xs uppercase tracking-normal text-muted-foreground">
                {item._status || 'draft'}
              </p>
            ) : null}
          </article>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Nothing created yet.</p>
      )}
    </div>
  </div>
)

const TaxonomyList: React.FC<{
  description: string
  items: ProfileRole[] | ProfileSkill[]
  title: string
}> = ({ description, items, title }) => (
  <div>
    <h2 className="text-2xl font-semibold">{title}</h2>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div className="border border-border p-4" key={item.id}>
          {'iconPath' in item && item.iconPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="mb-3 h-8 w-8" src={item.iconPath} />
          ) : null}
          <p className="font-medium">{item.title}</p>
          {item.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  </div>
)

const getProfileForUser = async (userID: string | number) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return result.docs[0] || null
}

const getProfileSkills = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profileSkills',
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  return result.docs
}

const getProfileRoles = async () => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profileRoles',
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'title',
  })

  return result.docs
}

const getPointsTotal = async (user: User) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pointEvents',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          recipient: {
            equals: user.id,
          },
        },
        {
          status: {
            equals: 'valid',
          },
        },
      ],
    },
  })

  return result.docs.reduce((sum, event) => sum + (event.amount || 0), 0)
}

const getCreatedRecords = async (user: User, profile?: Profile | null) => {
  const payload = await getPayload({ config: configPromise })
  const profileID = profile?.id

  const [projects, events, posts] = await Promise.all([
    profileID
      ? payload.find({
          collection: 'projects',
          depth: 0,
          limit: 10,
          overrideAccess: true,
          pagination: false,
          sort: '-updatedAt',
          where: {
            contributors: {
              in: [profileID],
            },
          },
        })
      : Promise.resolve({ docs: [] as Project[] }),
    profileID
      ? payload.find({
          collection: 'events',
          depth: 0,
          limit: 10,
          overrideAccess: true,
          pagination: false,
          sort: '-updatedAt',
          where: {
            relatedProfiles: {
              in: [profileID],
            },
          },
        })
      : Promise.resolve({ docs: [] as Event[] }),
    payload.find({
      collection: 'posts',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: '-updatedAt',
      where: {
        authors: {
          in: [user.id],
        },
      },
    }),
  ])

  return {
    events: events.docs,
    posts: posts.docs,
    projects: projects.docs,
  }
}
