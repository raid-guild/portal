'use client'

import React, { useState } from 'react'

type Channel = 'email' | 'in_app' | 'muted'
type DigestFrequency = 'daily' | 'none' | 'weekly'

type NotificationPreferencesFormProps = {
  emailVerified: boolean
  initialPreferences?: {
    activityDigestFrequency?: DigestFrequency | null
    badgeAwards?: Channel | null
    briefs?: Channel | null
    emailEnabled?: boolean | null
    id?: number | string
    sessionAnnouncements?: Channel | null
    sessionReminders?: Channel | null
    weeklyDigest?: Channel | null
  } | null
  userID: number | string
}

const channelFields: {
  description: string
  key: 'badgeAwards' | 'briefs' | 'sessionAnnouncements' | 'sessionReminders' | 'weeklyDigest'
  label: string
}[] = [
  {
    description: 'New visible sessions and schedule additions.',
    key: 'sessionAnnouncements',
    label: 'Session announcements',
  },
  {
    description: 'Reminders for sessions you should not miss.',
    key: 'sessionReminders',
    label: 'Session reminders',
  },
  {
    description: 'Daily and weekly brief publication notices.',
    key: 'briefs',
    label: 'Briefs',
  },
  {
    description: 'A coalesced weekly portal summary.',
    key: 'weeklyDigest',
    label: 'Weekly digest',
  },
  {
    description: 'Recognition issued to your profile.',
    key: 'badgeAwards',
    label: 'Badge awards',
  },
]

export const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  emailVerified,
  initialPreferences,
  userID,
}) => {
  const [activityDigestFrequency, setActivityDigestFrequency] = useState<DigestFrequency>(
    initialPreferences?.activityDigestFrequency || 'weekly',
  )
  const [emailEnabled, setEmailEnabled] = useState(Boolean(initialPreferences?.emailEnabled))
  const [isSaving, setIsSaving] = useState(false)
  const [preferencesID, setPreferencesID] = useState(initialPreferences?.id)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [values, setValues] = useState<Record<(typeof channelFields)[number]['key'], Channel>>({
    badgeAwards: initialPreferences?.badgeAwards || 'in_app',
    briefs: initialPreferences?.briefs || 'in_app',
    sessionAnnouncements: initialPreferences?.sessionAnnouncements || 'in_app',
    sessionReminders: initialPreferences?.sessionReminders || 'in_app',
    weeklyDigest: initialPreferences?.weeklyDigest || 'in_app',
  })

  const savePreferences = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    const sanitizedValues = emailVerified
      ? values
      : Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, value === 'email' ? 'in_app' : value]),
        )

    const body = {
      ...sanitizedValues,
      activityDigestFrequency,
      emailEnabled: emailVerified ? emailEnabled : false,
      user: userID,
    }

    try {
      const res = await fetch(
        preferencesID
          ? `/api/notificationPreferences/${preferencesID}`
          : '/api/notificationPreferences',
        {
          body: JSON.stringify(body),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: preferencesID ? 'PATCH' : 'POST',
        },
      )

      if (!res.ok) {
        throw new Error('Unable to save notification preferences.')
      }

      const json = await res.json().catch(() => null)
      setPreferencesID(json?.doc?.id || json?.id || preferencesID)
      setSaveStatus('Preferences saved.')
    } catch (error) {
      setSaveStatus(
        error instanceof Error ? error.message : 'Unable to save notification preferences.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="portal-panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="portal-heading-sm">Notification preferences</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Choose where portal reminders and digest updates should appear.
          </p>
        </div>
        <button
          className="portal-admin-link"
          disabled={isSaving}
          onClick={() => void savePreferences()}
          type="button"
        >
          {isSaving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {!emailVerified ? (
        <p className="mt-5 border-l border-border pl-4 text-sm leading-6 text-muted-foreground">
          Verify your account email to enable email notifications. In-app inbox notifications are
          still available.
        </p>
      ) : null}

      <label className="mt-6 flex items-center gap-3 text-sm">
        <input
          checked={emailVerified && emailEnabled}
          disabled={!emailVerified}
          onChange={(event) => setEmailEnabled(event.target.checked)}
          type="checkbox"
        />
        Enable email delivery for notification types set to Email
      </label>

      <div className="mt-6 divide-y divide-border border-y border-border">
        {channelFields.map((field) => (
          <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]" key={field.key}>
            <div>
              <p className="text-sm font-bold">{field.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{field.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['in_app', 'email', 'muted'] as Channel[]).map((option) => (
                <button
                  className={
                    values[field.key] === option
                      ? 'portal-admin-link border-primary text-primary'
                      : 'portal-admin-link'
                  }
                  disabled={option === 'email' && !emailVerified}
                  key={option}
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: option,
                    }))
                  }
                  type="button"
                >
                  {option === 'in_app' ? 'In-app' : option === 'muted' ? 'Off' : 'Email'}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-4 py-4 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-bold">Activity digest</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Coalesce low-priority portal activity into a digest.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['none', 'daily', 'weekly'] as DigestFrequency[]).map((option) => (
              <button
                className={
                  activityDigestFrequency === option
                    ? 'portal-admin-link border-primary text-primary'
                    : 'portal-admin-link'
                }
                key={option}
                onClick={() => setActivityDigestFrequency(option)}
                type="button"
              >
                {option === 'none' ? 'Off' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {saveStatus ? <p className="mt-4 text-sm text-muted-foreground">{saveStatus}</p> : null}
    </div>
  )
}
