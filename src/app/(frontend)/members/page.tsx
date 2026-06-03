import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'
import { PageRange } from '@/components/PageRange'
import {
  getListPageValue,
  getListQueryValue,
  PortalPagination,
  PortalSearchForm,
  type ListSearchParams,
} from '../_components/PortalListControls'
import { getBadgeSummariesByProfile } from './badgeData'
import { MembersDirectory, type DirectoryProfile } from './MembersDirectory'

export const dynamic = 'force-dynamic'
const MEMBERS_PER_PAGE = 60

type Args = {
  searchParams?: Promise<ListSearchParams>
}

export default async function MembersPage({ searchParams: searchParamsPromise }: Args) {
  const [user, searchParams] = await Promise.all([getCurrentUser(), searchParamsPromise])

  if (!user) redirect('/join')

  const query = getListQueryValue(searchParams?.q)
  const page = getListPageValue(searchParams?.page)
  const profiles = await getMemberProfiles(user, { page, query })

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

      <PortalSearchForm
        action="/members"
        label="Search members"
        placeholder="Search by name, handle, bio, role, or skill"
        query={query}
      />

      <div className="mt-8">
        <PageRange
          collectionLabels={{ plural: 'Members', singular: 'Member' }}
          currentPage={profiles.page}
          limit={MEMBERS_PER_PAGE}
          totalDocs={profiles.totalDocs}
        />
      </div>

      <MembersDirectory profiles={profiles.docs} />

      <PortalPagination
        basePath="/members"
        page={profiles.page}
        query={query}
        totalPages={profiles.totalPages}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Members',
}

const getMemberProfiles = async (
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  {
    page,
    query,
  }: {
    page: number
    query: string
  },
): Promise<{
  docs: DirectoryProfile[]
  page?: number
  totalDocs: number
  totalPages: number
}> => {
  const payload = await getPayload({ config: configPromise })
  const [matchingRoleIDs, matchingSkillIDs] = query
    ? await Promise.all([
        getMatchingProfileTaxonomyIDs(payload, 'profileRoles', query),
        getMatchingProfileTaxonomyIDs(payload, 'profileSkills', query),
      ])
    : [[], []]
  const where: Where = {
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
  }

  if (query) {
    const searchWhere: NonNullable<Where['or']> = [
      {
        displayName: {
          like: query,
        },
      },
      {
        handle: {
          like: query,
        },
      },
      {
        bio: {
          like: query,
        },
      },
    ]

    if (matchingRoleIDs.length) {
      searchWhere.push({
        profileRoles: {
          in: matchingRoleIDs,
        },
      })
    }

    if (matchingSkillIDs.length) {
      searchWhere.push({
        profileSkills: {
          in: matchingSkillIDs,
        },
      })
    }

    where.and?.push({
      or: searchWhere,
    })
  }

  const result = await payload.find({
    collection: 'profiles',
    depth: 2,
    limit: MEMBERS_PER_PAGE,
    overrideAccess: true,
    page,
    sort: 'displayName',
    where,
  })

  const profileIDs = result.docs.map((profile) => profile.id)
  const badgesByProfile = await getBadgeSummariesByProfile({
    payload,
    profileIDs,
    user,
  })

  return {
    docs: result.docs.map((profile) => {
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
    }),
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  }
}

const getMatchingProfileTaxonomyIDs = async (
  payload: Payload,
  collection: 'profileRoles' | 'profileSkills',
  query: string,
): Promise<(number | string)[]> => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      title: {
        like: query,
      },
    },
  })

  return result.docs.map((doc) => doc.id)
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
