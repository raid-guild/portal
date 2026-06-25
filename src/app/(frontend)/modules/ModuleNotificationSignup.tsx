'use client'

import Link from 'next/link'
import React, { useState } from 'react'

type Channel = 'email' | 'in_app' | 'muted'

type ModuleNotificationSignupProps = {
  email: string
  initialPreferences?: {
    emailEnabled?: boolean | null
    id?: number | string
    moduleAnnouncements?: Channel | null
  } | null
  userID: number | string
}

export const ModuleNotificationSignup: React.FC<ModuleNotificationSignupProps> = ({
  email,
  initialPreferences,
  userID,
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(Boolean(initialPreferences?.emailEnabled))
  const [preferencesID, setPreferencesID] = useState(initialPreferences?.id)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(
    Boolean(
      initialPreferences?.emailEnabled && initialPreferences?.moduleAnnouncements === 'email',
    ),
  )

  const savePreference = async (nextSubscribed: boolean) => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      const res = await fetch(
        preferencesID
          ? `/api/notificationPreferences/${preferencesID}`
          : '/api/notificationPreferences',
        {
          body: JSON.stringify({
            emailEnabled: nextSubscribed ? true : emailEnabled,
            moduleAnnouncements: nextSubscribed ? 'email' : 'muted',
            user: userID,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: preferencesID ? 'PATCH' : 'POST',
        },
      )

      if (!res.ok) {
        throw new Error('Unable to update module notification preferences.')
      }

      const json = await res.json().catch(() => null)
      setPreferencesID(json?.doc?.id || json?.id || preferencesID)
      setEmailEnabled(nextSubscribed ? true : emailEnabled)
      setSubscribed(nextSubscribed)
      setSaveStatus(
        nextSubscribed
          ? `Module announcement emails will go to ${email}.`
          : 'Module announcement emails are off.',
      )
    } catch (error) {
      setSaveStatus(
        error instanceof Error
          ? error.message
          : 'Unable to update module notification preferences.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="portal-panel">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="portal-kicker">Module alerts</p>
          <h2 className="mt-2 portal-heading-sm">Get notified when new modules go live</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use your verified Portal email for new active and experimental module announcements.
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Email:</span> {email}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className={
              subscribed ? 'portal-admin-link border-primary text-primary' : 'portal-admin-link'
            }
            disabled={isSaving}
            onClick={() => void savePreference(true)}
            type="button"
          >
            {subscribed ? 'Email alerts on' : 'Notify me by email'}
          </button>
          {subscribed ? (
            <button
              className="portal-admin-link"
              disabled={isSaving}
              onClick={() => void savePreference(false)}
              type="button"
            >
              Turn off
            </button>
          ) : null}
          <Link className="portal-admin-link" href="/me#notifications">
            Manage preferences
          </Link>
        </div>
      </div>
      {saveStatus ? <p className="mt-4 text-sm text-muted-foreground">{saveStatus}</p> : null}
    </section>
  )
}
