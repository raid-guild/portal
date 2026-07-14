'use client'

import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { Profile, ProfileRole, ProfileSkill } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { consumeSignupAnalyticsContext, trackPortalEvent } from '@/utilities/analytics'

type ProfileWizardFormProps = {
  accountEmail?: string | null
  accountUserID: number | string
  claimableProfiles?: Profile[]
  profile?: Profile | null
  roles: ProfileRole[]
  skills: ProfileSkill[]
}

const selectedIDs = (items?: (number | ProfileRole | ProfileSkill)[] | null) =>
  new Set((items || []).map((item) => String(typeof item === 'object' && item ? item.id : item)))

const selectedRoleIDs = (profile?: Profile | null) => selectedIDs(profile?.profileRoles)

const selectedSkillIDs = (profile?: Profile | null) => selectedIDs(profile?.profileSkills)

const relationID = (value: unknown) =>
  String(typeof value === 'object' && value && 'id' in value ? value.id : value)

const handleBelongsToAccount = async (handle: string, accountUserID: number | string) => {
  const params = new URLSearchParams({
    depth: '0',
    limit: '1',
  })
  params.set('where[handle][equals]', handle)

  const res = await fetch(`/api/profiles?${params.toString()}`, {
    credentials: 'include',
  })

  if (!res.ok) return false

  const json = await res.json().catch(() => null)
  const duplicate = json?.docs?.[0]

  return duplicate ? relationID(duplicate.user) === String(accountUserID) : false
}

const validationErrorFrom = (json: any) =>
  json?.data?.errors?.[0] || json?.errors?.[0]?.data?.errors?.[0] || json?.errors?.[0] || null

export const ProfileWizardForm: React.FC<ProfileWizardFormProps> = ({
  accountEmail,
  accountUserID,
  claimableProfiles = [],
  profile,
  roles,
  skills,
}) => {
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimingProfileID, setClaimingProfileID] = useState<number | string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [success, setSuccess] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)
  const hasTrackedProfileCompletion = useRef(Boolean(profile))
  const initialRoleIDs = useMemo(() => selectedRoleIDs(profile), [profile])
  const initialSkillIDs = useMemo(() => selectedSkillIDs(profile), [profile])

  const trackProfileCompletion = () => {
    if (hasTrackedProfileCompletion.current) return

    hasTrackedProfileCompletion.current = true
    const signupAnalyticsContext = consumeSignupAnalyticsContext()
    trackPortalEvent('Profile Completed', {
      inquiry_type: signupAnalyticsContext?.inquiryType || 'not_applicable',
      signup_context: signupAnalyticsContext?.signupContext || 'unknown',
    })
  }

  const claimProfile = async (profileID: number | string, token?: string | null) => {
    setClaimError(null)
    setClaimSuccess(null)
    setClaimingProfileID(profileID)

    try {
      const res = await fetch('/api/profiles/claim', {
        body: JSON.stringify(token ? { profileID, token } : { intent: 'request', profileID }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Unable to verify profile claim.')
      }

      if (token) {
        window.location.href = '/me'
        return
      }

      setClaimSuccess('Verification email sent. Open the link in that email to claim this profile.')
      setClaimingProfileID(null)
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Unable to verify profile claim.')
      setClaimingProfileID(null)
    }
  }

  useEffect(() => {
    if (profile || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const claimProfileID = params.get('claimProfile')
    const claimToken = params.get('claimToken')

    if (!claimProfileID || !claimToken) return

    void claimProfile(claimProfileID, claimToken)
    // The claim URL should be consumed once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (step !== profileSteps.length - 1) return

    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
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
    const displayName = String(formData.get('displayName') || '').trim()
    const handle = String(formData.get('handle') || '').trim()
    const bio = String(formData.get('bio') || '').trim()

    if (!displayName || !handle || !bio) {
      setError('Add a display name, handle, and bio.')
      setStep(0)
      isSubmittingRef.current = false
      setIsLoading(false)
      return
    }

    if (!roleIDs.length || !skillIDs.length) {
      setError('Choose at least one role and one skill.')
      setStep(roleIDs.length ? 2 : 1)
      isSubmittingRef.current = false
      setIsLoading(false)
      return
    }

    if (roleIDs.length > 2) {
      setError('Choose up to two profile roles.')
      setStep(1)
      isSubmittingRef.current = false
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
        bio,
        contact: {
          discord: String(formData.get('discord') || '').trim(),
          email: String(formData.get('contactEmail') || '').trim(),
          farcaster: String(formData.get('farcaster') || '').trim(),
          telegram: String(formData.get('telegram') || '').trim(),
          x: String(formData.get('x') || '')
            .trim()
            .replace(/^@/, ''),
        },
        displayName,
        handle,
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
        const validationError = validationErrorFrom(json)
        const message = validationError?.message || json?.message || 'Unable to save profile.'
        const path = validationError?.path
        const isHandleError =
          path === 'handle' ||
          String(message).toLowerCase().includes('handle') ||
          String(json?.message || '')
            .toLowerCase()
            .includes('handle')

        if (!profile && isHandleError && (await handleBelongsToAccount(handle, accountUserID))) {
          trackProfileCompletion()
          setSuccess('Profile saved.')
          return
        }

        throw new Error(message)
      }

      trackProfileCompletion()
      setSuccess('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      isSubmittingRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!profile && claimableProfiles.length ? (
        <section className="portal-panel">
          <h3 className="portal-heading-sm">Claim an existing profile</h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We found legacy member profiles that match {accountEmail || 'this account'}. Send a
            verification link to that email before connecting one to your account.
          </p>
          <div className="mt-4 space-y-3">
            {claimableProfiles.map((claimableProfile) => (
              <article
                className="flex flex-wrap items-center justify-between gap-4 portal-card"
                key={claimableProfile.id}
              >
                <div>
                  <p className="font-medium">{claimableProfile.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{claimableProfile.handle}</p>
                </div>
                <Button
                  disabled={claimingProfileID === claimableProfile.id}
                  onClick={() => claimProfile(claimableProfile.id)}
                  type="button"
                >
                  {claimingProfileID === claimableProfile.id ? 'Sending...' : 'Email claim link'}
                </Button>
              </article>
            ))}
          </div>
          {claimSuccess ? (
            <p className="mt-4 text-sm text-muted-foreground">{claimSuccess}</p>
          ) : null}
          {claimError ? <p className="mt-4 text-sm text-destructive">{claimError}</p> : null}
        </section>
      ) : null}

      <form className="portal-panel" noValidate onSubmit={submitProfile}>
        <Stepper currentStep={step} />

        <div className="mt-8">
          <section className={step === 0 ? 'space-y-5' : 'hidden'}>
            <div>
              <p className="portal-kicker">Step 1</p>
              <h3 className="portal-heading-sm">Public identity</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.displayName || ''}
                  id="displayName"
                  name="displayName"
                />
              </div>
              <div>
                <Label htmlFor="handle">Handle</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.handle || ''}
                  id="handle"
                  name="handle"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                className={fieldClassName}
                defaultValue={profile?.bio || ''}
                id="bio"
                name="bio"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.location || ''}
                  id="location"
                  name="location"
                />
              </div>
              <div>
                <Label htmlFor="avatarFile">Avatar</Label>
                <Input
                  accept="image/*"
                  className={fieldClassName}
                  id="avatarFile"
                  name="avatarFile"
                  type="file"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <select
                className={selectClassName}
                defaultValue={profile?.visibility || 'public'}
                id="visibility"
                name="visibility"
              >
                <option value="public">Public</option>
                <option value="authenticated">Authenticated</option>
                <option value="private">Private</option>
              </select>
            </div>
          </section>

          <section className={step === 1 ? 'space-y-5' : 'hidden'}>
            <div>
              <p className="portal-kicker">Step 2</p>
              <h3 className="portal-heading-sm">Choose profile roles</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pick up to two roles that describe how people should understand your work in the
                guild.
              </p>
            </div>
            <TaxonomyPicker
              defaultSelected={initialRoleIDs}
              items={roles}
              name="profileRoles"
              maxSelected={2}
            />
          </section>

          <section className={step === 2 ? 'space-y-5' : 'hidden'}>
            <div>
              <p className="portal-kicker">Step 3</p>
              <h3 className="portal-heading-sm">Choose skills</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select the capabilities you want to be found for in the member directory.
              </p>
            </div>
            <TaxonomyPicker defaultSelected={initialSkillIDs} items={skills} name="profileSkills" />
          </section>

          <section className={step === 3 ? 'space-y-5' : 'hidden'}>
            <div>
              <p className="portal-kicker">Step 4</p>
              <h3 className="portal-heading-sm">Links and contact</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <LinkInput label="Website" name="websiteURL" profile={profile} />
              <LinkInput label="GitHub" name="githubURL" profile={profile} />
              <LinkInput label="Portfolio" name="portfolioURL" profile={profile} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="discord">Discord</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.contact?.discord || ''}
                  id="discord"
                  name="discord"
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact email</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.contact?.email || ''}
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                />
              </div>
              <div>
                <Label htmlFor="x">X</Label>
                <Input
                  className={fieldClassName}
                  defaultValue={profile?.contact?.x || ''}
                  id="x"
                  name="x"
                  placeholder="raidguild"
                />
              </div>
            </div>
          </section>
        </div>

        {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
        {success ? <p className="mt-5 text-sm text-muted-foreground">{success}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            disabled={step === 0 || isLoading}
            onClick={(event) => {
              event.preventDefault()
              setStep(step - 1)
            }}
            type="button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < profileSteps.length - 1 ? (
            <Button
              disabled={isLoading}
              onClick={(event) => {
                event.preventDefault()
                setStep(step + 1)
              }}
              type="button"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={isLoading} type="submit">
              {isLoading ? 'Saving...' : 'Save profile'}
              {!isLoading ? <Save className="ml-2 h-4 w-4" /> : null}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

const profileSteps = ['Identity', 'Roles', 'Skills', 'Links'] as const

const Stepper: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <ol className="grid gap-2 sm:grid-cols-4">
    {profileSteps.map((label, index) => {
      const isActive = index === currentStep
      const isComplete = index < currentStep

      return (
        <li
          aria-current={isActive ? 'step' : undefined}
          className={[
            'border border-border px-3 py-3',
            isActive ? 'bg-primary text-primary-foreground' : 'bg-card/25 text-muted-foreground',
            isComplete ? 'border-primary text-foreground' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          key={label}
        >
          <p className="font-mono text-xs uppercase">Step {index + 1}</p>
          <p className="mt-1 text-sm font-bold">{label}</p>
        </li>
      )
    })}
  </ol>
)

const LinkInput: React.FC<{ label: string; name: string; profile?: Profile | null }> = ({
  label,
  name,
  profile,
}) => {
  const existing = profile?.links?.find((link) => link.label?.toLowerCase() === label.toLowerCase())

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        className={fieldClassName}
        defaultValue={existing?.url || ''}
        id={name}
        name={name}
        type="url"
      />
    </div>
  )
}

const TaxonomyPicker: React.FC<{
  defaultSelected: Set<string>
  items: (ProfileRole | ProfileSkill)[]
  maxSelected?: number
  name: string
}> = ({ defaultSelected, items, maxSelected, name }) => (
  <fieldset>
    <legend className="sr-only">{name}</legend>
    {maxSelected ? (
      <p className="mb-3 text-sm text-muted-foreground">Choose up to {maxSelected}.</p>
    ) : null}
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <label className="portal-card flex cursor-pointer items-start gap-3" key={item.id}>
          <input
            aria-label={item.title}
            className="mt-1 accent-primary"
            defaultChecked={defaultSelected.has(String(item.id))}
            name={name}
            type="checkbox"
            value={item.id}
          />
          <span>
            {'iconPath' in item && item.iconPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="mb-3 h-8 w-8" src={item.iconPath} />
            ) : null}
            <span className="block font-bold">{item.title}</span>
            {item.description ? (
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
)

const fieldClassName =
  'border-muted-foreground/30 bg-background/80 text-foreground shadow-sm focus-visible:ring-primary'

const selectClassName = `${fieldClassName} h-10 w-full rounded px-3 text-sm`
