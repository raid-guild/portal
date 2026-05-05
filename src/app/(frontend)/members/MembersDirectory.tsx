'use client'

import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'

type DirectoryTaxonomy = {
  id: number | string
  title: string
}

export type DirectoryProfile = {
  authRoles: string[]
  bio: string
  displayName: string
  handle: string
  id: number | string
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
  const [query, setQuery] = useState('')

  const profileRoleOptions = useMemo(() => {
    return uniqueByTitle(profiles.flatMap((profile) => profile.profileRoles))
  }, [profiles])

  const profileSkillOptions = useMemo(() => {
    return uniqueByTitle(profiles.flatMap((profile) => profile.profileSkills))
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return profiles.filter((profile) => {
      const matchesAuthRole = authRole === 'all' || profile.authRoles.includes(authRole)
      const matchesProfileRole =
        profileRole === 'all' || profile.profileRoles.some((role) => String(role.id) === profileRole)
      const matchesProfileSkill =
        profileSkill === 'all' ||
        profile.profileSkills.some((skill) => String(skill.id) === profileSkill)

      const searchable = [
        profile.displayName,
        profile.handle,
        profile.bio,
        ...profile.authRoles,
        ...profile.profileRoles.map((role) => role.title),
        ...profile.profileSkills.map((skill) => skill.title),
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery)

      return matchesAuthRole && matchesProfileRole && matchesProfileSkill && matchesQuery
    })
  }, [authRole, profileRole, profileSkill, profiles, query])

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
      <section className="mt-10 grid gap-3 border border-border p-4 lg:grid-cols-[1fr_12rem_12rem_12rem]">
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
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.length ? (
          filteredProfiles.map((profile) => (
            <article className="border border-border p-5" key={profile.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{profile.handle}</p>
                </div>
                <span className="border border-border px-2 py-1 text-xs">
                  {profile.authRoles.includes('member') ? 'Member' : 'Contributor'}
                </span>
              </div>
              <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">
                {profile.bio}
              </p>
              <TaxonomyPills items={profile.profileRoles} />
              <TaxonomyPills items={profile.profileSkills} />
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
      className="h-10 w-full rounded border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
        <span className="border border-border px-2 py-1 text-xs" key={item.id}>
          {item.title}
        </span>
      ))}
    </div>
  )
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
