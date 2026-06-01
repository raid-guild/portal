import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Media, Profile, ProfileRole, ProfileSkill } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'

import { PortalGraph, type ExplorerGraphData } from './PortalGraph'

export const dynamic = 'force-dynamic'

export default async function PortalGraphPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <main className="container pb-24 pt-12">
        <section className="max-w-3xl">
          <p className="mb-4 portal-kicker">Experimental Module</p>
          <h1 className="portal-title">Portal Graph</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Explore how member roles, skills, profiles, and future Portal records connect.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="portal-admin-link" href="/join">
              Join to explore
            </Link>
            <Link className="portal-admin-link" href="/login?next=%2Fportal-graph">
              Log in
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const graphData = await getExplorerGraphData()

  return (
    <main className="mx-auto w-full max-w-[90rem] px-5 pb-24 pt-12 sm:px-8">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Experimental Module</p>
          <h1 className="portal-title">Portal Graph</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            A live relationship graph for exploring member roles, skills, and profiles. This first
            view will expand toward projects, sessions, posts, and other Portal records.
          </p>
        </div>
        <Link className="portal-admin-link" href="/modules">
          Back to modules
        </Link>
      </section>

      <PortalGraph data={graphData} />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Portal Graph',
}

const getExplorerGraphData = async (): Promise<ExplorerGraphData> => {
  const payload = await getPayload({ config: configPromise })
  const profiles: Profile[] = []
  const limit = 100
  let page = 1
  let totalPages = 1

  do {
    const result = await payload.find({
      collection: 'profiles',
      depth: 2,
      limit,
      overrideAccess: true,
      page,
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

    profiles.push(...result.docs)
    totalPages = result.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return normalizeGraphData(profiles)
}

const normalizeGraphData = (profiles: Profile[]): ExplorerGraphData => {
  const roleNodes = new Map<string, ExplorerGraphData['nodes'][number]>()
  const skillNodes = new Map<string, ExplorerGraphData['nodes'][number]>()
  const links = new Map<string, ExplorerGraphData['links'][number]>()
  const nodes: ExplorerGraphData['nodes'] = []

  for (const profile of profiles) {
    const roles = relationDocs<ProfileRole>(profile.profileRoles)
    const skills = relationDocs<ProfileSkill>(profile.profileSkills)
    const avatarURL = mediaURL(profile.avatar)

    nodes.push({
      avatarURL,
      bio: profile.bio,
      handle: profile.handle,
      id: `profile:${profile.id}`,
      label: profile.displayName,
      profileHref: `/members/${profile.handle}`,
      roles: roles.map((role) => role.title),
      skills: skills.map((skill) => skill.title),
      type: 'profile',
    })

    for (const role of roles) {
      const id = `role:${role.id}` as const
      const existing = roleNodes.get(id)

      if (existing?.type === 'role') {
        existing.profileCount += 1
      } else {
        roleNodes.set(id, {
          description: role.description || undefined,
          id,
          label: role.title,
          matchingProfiles: [],
          profileCount: 1,
          type: 'role',
        })
      }

      const node = roleNodes.get(id)
      if (node && 'matchingProfiles' in node) {
        node.matchingProfiles.push({
          handle: profile.handle,
          id: profile.id,
          label: profile.displayName,
          profileHref: `/members/${profile.handle}`,
        })
      }

      links.set(`profile:${profile.id}->${id}`, {
        source: `profile:${profile.id}`,
        target: id,
        type: 'hasRole',
      })
    }

    for (const skill of skills) {
      const id = `skill:${skill.id}` as const
      const existing = skillNodes.get(id)

      if (existing?.type === 'skill') {
        existing.profileCount += 1
      } else {
        skillNodes.set(id, {
          description: skill.description || undefined,
          id,
          label: skill.title,
          matchingProfiles: [],
          profileCount: 1,
          type: 'skill',
        })
      }

      const node = skillNodes.get(id)
      if (node && 'matchingProfiles' in node) {
        node.matchingProfiles.push({
          handle: profile.handle,
          id: profile.id,
          label: profile.displayName,
          profileHref: `/members/${profile.handle}`,
        })
      }

      links.set(`profile:${profile.id}->${id}`, {
        source: `profile:${profile.id}`,
        target: id,
        type: 'hasSkill',
      })
    }
  }

  return {
    links: Array.from(links.values()),
    nodes: [...Array.from(roleNodes.values()), ...Array.from(skillNodes.values()), ...nodes],
  }
}

const relationDocs = <T extends { id: number | string; title: string }>(
  items?: (number | T)[] | null,
): T[] => items?.filter((item): item is T => item !== null && typeof item === 'object') || []

const mediaURL = (media?: Media | number | null) =>
  typeof media === 'object' && media
    ? media.sizes?.square?.url || media.url || undefined
    : undefined
