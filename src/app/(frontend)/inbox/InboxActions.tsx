'use client'

import { Archive, Check } from 'lucide-react'
import React, { useState } from 'react'

type InboxActionsProps = {
  archived?: boolean
  notificationID: number | string
  unread?: boolean
}

export const InboxActions: React.FC<InboxActionsProps> = ({ archived, notificationID, unread }) => {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(archived ? 'archived' : unread ? 'unread' : 'read')

  const updateStatus = async (nextStatus: 'archived' | 'read') => {
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch(`/api/notifications/${notificationID}`, {
        body: JSON.stringify({ status: nextStatus }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      if (res.ok) {
        setStatus(nextStatus)
      } else {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        setError(data?.message || `Unable to update notification ${notificationID}.`)
      }
    } catch {
      setError(`Unable to update notification ${notificationID}.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'archived') {
    return <span className="portal-pill">Archived</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === 'unread' ? (
        <button
          className="portal-admin-link inline-flex items-center gap-2"
          disabled={isLoading}
          onClick={() => void updateStatus('read')}
          type="button"
        >
          <Check className="h-4 w-4" />
          Mark read
        </button>
      ) : null}
      <button
        className="portal-admin-link inline-flex items-center gap-2"
        disabled={isLoading}
        onClick={() => void updateStatus('archived')}
        type="button"
      >
        <Archive className="h-4 w-4" />
        Archive
      </button>
      {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
