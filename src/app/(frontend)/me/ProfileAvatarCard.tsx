'use client'

import React, { useState } from 'react'

import type { Media, Profile } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProfileAvatarCardProps = {
  profile?: Profile | null
}

const getMediaURL = (media?: Media | number | null) =>
  typeof media === 'object' && media ? media.url || media.sizes?.square?.url || null : null

export const ProfileAvatarCard: React.FC<ProfileAvatarCardProps> = ({ profile }) => {
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewURL, setPreviewURL] = useState<string | null>(getMediaURL(profile?.avatar))
  const [success, setSuccess] = useState<string | null>(null)

  const saveAvatar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profile) return

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const avatarFile = formData.get('avatarFile')

    try {
      if (!(avatarFile instanceof File) || avatarFile.size === 0) {
        throw new Error('Choose an image before saving.')
      }

      const uploadData = new FormData()
      uploadData.append('file', avatarFile)
      uploadData.append('_payload', JSON.stringify({ alt: `${profile.displayName} avatar` }))

      const uploadRes = await fetch('/api/media', {
        body: uploadData,
        credentials: 'include',
        method: 'POST',
      })

      if (!uploadRes.ok) throw new Error('Unable to upload avatar.')

      const uploadJSON = await uploadRes.json()
      const avatarID = uploadJSON.doc?.id || uploadJSON.id

      const updateRes = await fetch(`/api/profiles/${profile.id}`, {
        body: JSON.stringify({ avatar: avatarID }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (!updateRes.ok) throw new Error('Unable to save avatar.')

      const uploadedURL = uploadJSON.doc?.sizes?.square?.url || uploadJSON.doc?.url || null
      if (uploadedURL) setPreviewURL(uploadedURL)
      setSuccess('Avatar saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save avatar.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="mt-8 max-w-2xl portal-panel" onSubmit={saveAvatar}>
      <div className="flex flex-wrap items-center gap-5">
        <AvatarPreview displayName={profile?.displayName} url={previewURL} />
        <div className="min-w-0 flex-1">
          <p className="portal-kicker">Profile image</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {profile
              ? 'Upload a square image for your public profile and member listings.'
              : 'Create or claim a profile before adding a profile image.'}
          </p>
        </div>
      </div>
      {profile ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="avatarFile">Image</Label>
            <Input
              accept="image/*"
              className="border-muted-foreground/30 bg-background/80 text-foreground shadow-sm focus-visible:ring-primary"
              disabled={isSaving}
              id="avatarFile"
              name="avatarFile"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (file) setPreviewURL(URL.createObjectURL(file))
              }}
              type="file"
            />
          </div>
          <Button disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : 'Save image'}
          </Button>
        </div>
      ) : null}
      {success ? <p className="mt-4 text-sm text-muted-foreground">{success}</p> : null}
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </form>
  )
}

const AvatarPreview: React.FC<{ displayName?: string | null; url?: string | null }> = ({
  displayName,
  url,
}) => (
  <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-border bg-card/60">
    {url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className="h-full w-full object-cover" src={url} />
    ) : (
      <span className="font-mono text-2xl font-bold text-muted-foreground">
        {initials(displayName)}
      </span>
    )}
  </div>
)

const initials = (name?: string | null) => {
  if (!name?.trim()) return 'RG'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
