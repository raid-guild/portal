'use client'

import { Save } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import type { Profile, ProfileRole, ProfileSkill } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ProfileWizardFormProps = {
  profile?: Profile | null
  roles: ProfileRole[]
  skills: ProfileSkill[]
}

const selectedIDs = (items?: (number | ProfileRole | ProfileSkill)[] | null) =>
  new Set((items || []).map((item) => String(typeof item === 'object' && item ? item.id : item)))

const selectedRoleIDs = (profile?: Profile | null) => selectedIDs(profile?.profileRoles)

const selectedSkillIDs = (profile?: Profile | null) => selectedIDs(profile?.profileSkills)

export const ProfileWizardForm: React.FC<ProfileWizardFormProps> = ({ profile, roles, skills }) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const initialRoleIDs = useMemo(() => selectedRoleIDs(profile), [profile])
  const initialSkillIDs = useMemo(() => selectedSkillIDs(profile), [profile])

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const avatarFile = formData.get('avatarFile')
    const roleIDs = formData
      .getAll('profileRoles')
      .map((id) => Number(id))
      .filter(Number.isFinite)
    const skillIDs = formData
      .getAll('profileSkills')
      .map((id) => Number(id))
      .filter(Number.isFinite)

    if (!roleIDs.length || !skillIDs.length) {
      setError('Choose at least one role and one skill.')
      setIsLoading(false)
      return
    }

    if (roleIDs.length > 2) {
      setError('Choose up to two profile roles.')
      setIsLoading(false)
      return
    }

    try {
      let avatar =
        typeof profile?.avatar === 'object' && profile.avatar ? profile.avatar.id : profile?.avatar

      if (avatarFile instanceof File && avatarFile.size > 0) {
        const uploadData = new FormData()
        uploadData.append('file', avatarFile)
        uploadData.append(
          '_payload',
          JSON.stringify({ alt: `${formData.get('displayName')} avatar` }),
        )

        const uploadRes = await fetch('/api/media', {
          body: uploadData,
          credentials: 'include',
          method: 'POST',
        })

        if (!uploadRes.ok) {
          throw new Error('Unable to upload avatar.')
        }

        const uploadJSON = await uploadRes.json()
        avatar = uploadJSON.doc?.id || uploadJSON.id
      }

      const links = [
        {
          label: 'Website',
          url: String(formData.get('websiteURL') || '').trim(),
        },
        {
          label: 'GitHub',
          url: String(formData.get('githubURL') || '').trim(),
        },
        {
          label: 'Portfolio',
          url: String(formData.get('portfolioURL') || '').trim(),
        },
      ].filter((link) => link.url)

      const body = {
        avatar,
        bio: String(formData.get('bio') || '').trim(),
        contact: {
          discord: String(formData.get('discord') || '').trim(),
          email: String(formData.get('contactEmail') || '').trim(),
          farcaster: String(formData.get('farcaster') || '').trim(),
          telegram: String(formData.get('telegram') || '').trim(),
        },
        displayName: String(formData.get('displayName') || '').trim(),
        handle: String(formData.get('handle') || '').trim(),
        links,
        location: String(formData.get('location') || '').trim(),
        profileRoles: roleIDs,
        profileSkills: skillIDs,
        status: 'active',
        visibility: String(formData.get('visibility') || 'public'),
      }

      const res = await fetch(profile ? `/api/profiles/${profile.id}` : '/api/profiles', {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: profile ? 'PATCH' : 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.errors?.[0]?.message || json?.message || 'Unable to save profile.')
      }

      setSuccess('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="border border-border p-6" onSubmit={submitProfile}>
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                defaultValue={profile?.displayName || ''}
                id="displayName"
                name="displayName"
                required
              />
            </div>
            <div>
              <Label htmlFor="handle">Handle</Label>
              <Input defaultValue={profile?.handle || ''} id="handle" name="handle" required />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea defaultValue={profile?.bio || ''} id="bio" name="bio" required rows={4} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input defaultValue={profile?.location || ''} id="location" name="location" />
            </div>
            <div>
              <Label htmlFor="avatarFile">Avatar</Label>
              <Input accept="image/*" id="avatarFile" name="avatarFile" type="file" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <LinkInput label="Website" name="websiteURL" profile={profile} />
            <LinkInput label="GitHub" name="githubURL" profile={profile} />
            <LinkInput label="Portfolio" name="portfolioURL" profile={profile} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="discord">Discord</Label>
              <Input defaultValue={profile?.contact?.discord || ''} id="discord" name="discord" />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                defaultValue={profile?.contact?.email || ''}
                id="contactEmail"
                name="contactEmail"
                type="email"
              />
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              className="h-10 w-full rounded border border-input bg-background px-3 text-sm"
              defaultValue={profile?.visibility || 'public'}
              id="visibility"
              name="visibility"
            >
              <option value="public">Public</option>
              <option value="authenticated">Authenticated</option>
              <option value="private">Private</option>
            </select>
          </div>

          <Checklist
            defaultSelected={initialRoleIDs}
            items={roles}
            label="Profile roles"
            name="profileRoles"
          />
          <Checklist
            defaultSelected={initialSkillIDs}
            items={skills}
            label="Profile skills"
            name="profileSkills"
          />
        </aside>
      </div>

      {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="mt-5 text-sm text-muted-foreground">{success}</p> : null}

      <Button className="mt-6" disabled={isLoading} type="submit">
        {isLoading ? 'Saving...' : 'Save profile'}
        {!isLoading ? <Save className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  )
}

const LinkInput: React.FC<{ label: string; name: string; profile?: Profile | null }> = ({
  label,
  name,
  profile,
}) => {
  const existing = profile?.links?.find((link) => link.label?.toLowerCase() === label.toLowerCase())

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input defaultValue={existing?.url || ''} id={name} name={name} type="url" />
    </div>
  )
}

const Checklist: React.FC<{
  defaultSelected: Set<string>
  items: { id: number | string; title: string }[]
  label: string
  name: string
}> = ({ defaultSelected, items, label, name }) => (
  <fieldset>
    <legend className="text-sm font-medium">{label}</legend>
    <div className="mt-3 max-h-56 space-y-2 overflow-auto border border-border p-3">
      {items.map((item) => (
        <label className="flex items-start gap-2 text-sm leading-5" key={item.id}>
          <input
            defaultChecked={defaultSelected.has(String(item.id))}
            name={name}
            type="checkbox"
            value={item.id}
          />
          <span>{item.title}</span>
        </label>
      ))}
    </div>
  </fieldset>
)
