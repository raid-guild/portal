import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getBadgeSummariesByProfile } from './badgeData'
import { MembersDirectory, type DirectoryProfile } from './MembersDirectory'

export const dynamic = 'force-dynamic'

export default async function MembersPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  const profiles = await getMemberProfiles(user)

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Members</p>
          <h1 className="portal-title">Member directory</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            A discovery surface for contributors and manually approved members, with filters for
            access role, profile role, skill, and earned badges.
          </p>
        </div>
        <Link className="portal-admin-link" href="/badges">
          Browse badges
        </Link>
      </section>

      <MembersDirectory profiles={profiles} />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Members',
}

const getMemberProfiles = async (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<DirectoryProfile[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'profiles',
    depth: 2,
    limit: 60,
    overrideAccess: true,
    sort: 'displayName',
    where: {
      and: [
        {
          status: {
            equals: 'active',
          },
        },
        {
          visibility: {
            not_equals: 'private',
          },
        },
      ],
    },
  })

  const profileIDs = result.docs.map((profile) => profile.id)
  const badgesByProfile = await getBadgeSummariesByProfile({
    payload,
    profileIDs,
    user,
  })

  return result.docs.map((profile) => {
    const user = typeof profile.user === 'object' ? profile.user : null
    const authRoles = Array.isArray(user?.roles) ? user.roles : []

    return {
      authRoles,
      avatarURL:
        typeof profile.avatar === 'object' && profile.avatar ? profile.avatar.url || null : null,
      badges: badgesByProfile.get(String(profile.id)) || [],
      bio: profile.bio,
      displayName: profile.displayName,
      handle: profile.handle,
      id: profile.id,
      links:
        profile.links?.map((link) => ({
          label: link.label,
          url: link.url,
        })) || [],
      profileRoles: toTaxonomy(profile.profileRoles),
      profileSkills: toTaxonomy(profile.profileSkills),
    }
  })
}

const toTaxonomy = (items?: unknown[] | null) => {
  return (items || [])
    .filter((item): item is { id: number | string; title: string } => {
      return Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item)
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
    }))
}
