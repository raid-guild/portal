'use client'

import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'

import { Input } from '@/components/ui/input'
import { toSafeURL } from '@/utilities/safeURL'
import type { BadgeSummary } from './badgeData'

type DirectoryTaxonomy = {
  id: number | string
  title: string
}

export type DirectoryProfile = {
  authRoles: string[]
  avatarURL?: string | null
  badges: BadgeSummary[]
  bio: string
  displayName: string
  handle: string
  id: number | string
  links: {
    label: string
    url: string
  }[]
  profileRoles: DirectoryTaxonomy[]
  profileSkills: DirectoryTaxonomy[]
}

type MembersDirectoryProps = {
  profiles: DirectoryProfile[]
}

export const MembersDirectory: React.FC<MembersDirectoryProps> = ({ profiles }) => {
  const [authRole, setAuthRole] = useState('all')
  const [profileRole, setProfileRole] = useState('all')
  const [profileSkill, setProfileSkill] = useState('all')
  const [badge, setBadge] = useState('all')
  const [query, setQuery] = useState('')

  const profileRoleOptions = useMemo(() => {
    return uniqueByTitle(profiles.flatMap((profile) => profile.profileRoles))
  }, [profiles])

  const profileSkillOptions = useMemo(() => {
    return uniqueByTitle(profiles.flatMap((profile) => profile.profileSkills))
  }, [profiles])

  const badgeOptions = useMemo(() => {
    return uniqueByTitle(profiles.flatMap((profile) => profile.badges))
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return profiles.filter((profile) => {
      const matchesAuthRole = authRole === 'all' || profile.authRoles.includes(authRole)
      const matchesProfileRole =
        profileRole === 'all' ||
        profile.profileRoles.some((role) => String(role.id) === profileRole)
      const matchesProfileSkill =
        profileSkill === 'all' ||
        profile.profileSkills.some((skill) => String(skill.id) === profileSkill)
      const matchesBadge =
        badge === 'all' || profile.badges.some((profileBadge) => String(profileBadge.id) === badge)

      const searchable = [
        profile.displayName,
        profile.handle,
        profile.bio,
        ...profile.authRoles,
        ...profile.badges.map((profileBadge) => profileBadge.title),
        ...profile.profileRoles.map((role) => role.title),
        ...profile.profileSkills.map((skill) => skill.title),
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)

      return (
        matchesAuthRole && matchesProfileRole && matchesProfileSkill && matchesBadge && matchesQuery
      )
    })
  }, [authRole, badge, profileRole, profileSkill, profiles, query])

  if (!profiles.length) {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        No contributor or member profiles are visible yet. Create profiles through the profile flow
        as the next iteration.
      </p>
    )
  }

  return (
    <>
      <section className="mt-10 grid gap-3 portal-card lg:grid-cols-[1fr_12rem_12rem_12rem_12rem]">
        <label className="relative block">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            value={query}
          />
        </label>
        <DirectorySelect
          label="Auth role"
          onChange={setAuthRole}
          options={[
            { label: 'All access roles', value: 'all' },
            { label: 'Contributors', value: 'contributor' },
            { label: 'Members', value: 'member' },
          ]}
          value={authRole}
        />
        <DirectorySelect
          label="Profile role"
          onChange={setProfileRole}
          options={[
            { label: 'All profile roles', value: 'all' },
            ...profileRoleOptions.map((role) => ({
              label: role.title,
              value: String(role.id),
            })),
          ]}
          value={profileRole}
        />
        <DirectorySelect
          label="Skill"
          onChange={setProfileSkill}
          options={[
            { label: 'All skills', value: 'all' },
            ...profileSkillOptions.map((skill) => ({
              label: skill.title,
              value: String(skill.id),
            })),
          ]}
          value={profileSkill}
        />
        <DirectorySelect
          label="Badge"
          onChange={setBadge}
          options={[
            { label: 'All badges', value: 'all' },
            ...badgeOptions.map((profileBadge) => ({
              label: profileBadge.title,
              value: String(profileBadge.id),
            })),
          ]}
          value={badge}
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.length ? (
          filteredProfiles.map((profile) => (
            <article className="portal-panel" key={profile.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {profile.avatarURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                      src={profile.avatarURL}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border font-mono text-sm font-bold">
                      {profile.displayName.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <Link
                      className="portal-heading-sm hover:underline"
                      href={`/members/${profile.handle}`}
                    >
                      {profile.displayName}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{profile.handle}</p>
                  </div>
                </div>
                <span className="portal-pill">
                  {profile.authRoles.includes('member') ? 'Member' : 'Contributor'}
                </span>
              </div>
              <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">
                {profile.bio}
              </p>
              <BadgePills badges={profile.badges} />
              <TaxonomyPills items={profile.profileRoles} />
              <TaxonomyPills items={profile.profileSkills} />
              {profile.links.length ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.links.slice(0, 3).map((link) => {
                    const safeURL = toProfileLinkURL(link.url)

                    if (!safeURL) return null

                    return (
                      <Link
                        className="portal-link"
                        href={safeURL}
                        key={`${profile.id}-${link.label}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No profiles match those filters.</p>
        )}
      </section>
    </>
  )
}

const DirectorySelect: React.FC<{
  label: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  value: string
}> = ({ label, onChange, options, value }) => (
  <label className="block">
    <span className="sr-only">{label}</span>
    <select
      className="h-10 w-full rounded-sm border border-border bg-background/70 px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

const TaxonomyPills: React.FC<{ items: DirectoryTaxonomy[] }> = ({ items }) => {
  if (!items.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span className="portal-pill" key={item.id}>
          {item.title}
        </span>
      ))}
    </div>
  )
}

const BadgePills: React.FC<{ badges: BadgeSummary[] }> = ({ badges }) => {
  if (!badges.length) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {badges.slice(0, 4).map((badge) => (
        <span
          className="portal-pill border-primary/40 bg-primary/10 text-foreground"
          key={badge.id}
        >
          {badge.title}
        </span>
      ))}
    </div>
  )
}

const toProfileLinkURL = (value: string): string | null => {
  const trimmed = value.trim()
  const normalized = trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed

  return toSafeURL(normalized, { allowRelative: false, protocols: ['http:', 'https:'] })
}

const uniqueByTitle = (items: DirectoryTaxonomy[]) => {
  const seen = new Set<string>()

  return items
    .filter((item) => {
      const key = item.title.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}
