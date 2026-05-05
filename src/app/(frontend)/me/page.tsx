import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Profile, ProfileRole, ProfileSkill, User } from '@/payload-types'
import { Button } from '@/components/ui/button'
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

  return (
    <main className="container pb-24 pt-12">
      <section className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            Profile Builder
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">My profile</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            This is the future member-facing profile wizard. The first full version should let
            members manage identity, links, skills, roles, and visibility without entering Payload
            Admin.
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

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="border border-border p-6">
          <h2 className="text-xl font-semibold">Current Profile</h2>
          {profile ? (
            <ProfileSummary profile={profile} />
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-muted-foreground">
                No profile exists for this account yet. The next iteration should turn this shell
                into a guided creation flow.
              </p>
              <Button className="mt-5" disabled>
                Wizard coming next
              </Button>
            </div>
          )}
        </div>
        <div className="border border-border p-6">
          <h2 className="text-xl font-semibold">Wizard Checklist</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Basic identity: handle, display name, bio, location.</li>
            <li>Links: website, GitHub, Farcaster, Discord, portfolio.</li>
            <li>Profile skills: choose the capabilities people should find you by.</li>
            <li>Profile roles: choose up to two RaidGuild roles.</li>
            <li>Visibility: public, authenticated members, or private.</li>
          </ul>
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
  return (
    <div className="mt-4 space-y-4 text-sm leading-6">
      <div>
        <p className="font-semibold">{profile.displayName}</p>
        <p className="text-muted-foreground">@{profile.handle}</p>
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
