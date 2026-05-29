import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { InboxActions } from './InboxActions'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

type NotificationRecord = {
  actionLabel?: string | null
  actionURL?: string | null
  body?: string | null
  createdAt?: string | null
  id: number | string
  priority?: string | null
  status?: string | null
  title: string
  type?: string | null
}

export default async function InboxPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/login?next=%2Finbox')

  const notifications = await getNotifications(user)
  const unreadCount = notifications.filter(
    (notification) => notification.status === 'unread',
  ).length

  return (
    <main className="container pb-24 pt-12">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 portal-kicker">Account</p>
          <h1 className="portal-title">Inbox</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Portal notifications, reminders, and digest updates tied to your account.
          </p>
        </div>
        <Link className="portal-admin-link" href="/me#notifications">
          Notification preferences
        </Link>
      </section>

      <section className="mt-10 grid gap-4">
        {notifications.length ? (
          notifications.map((notification) => (
            <article className="portal-panel" key={notification.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="portal-kicker">{formatType(notification.type)}</p>
                  <h2 className="mt-2 portal-heading-sm">{notification.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {notification.status === 'unread' ? (
                    <span className="portal-pill">Unread</span>
                  ) : null}
                  {notification.priority === 'high' ? (
                    <span className="portal-pill">High</span>
                  ) : null}
                </div>
              </div>
              {notification.body ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{notification.body}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  {notification.actionURL ? (
                    <Link className="portal-admin-link" href={notification.actionURL}>
                      {notification.actionLabel || 'Open'}
                    </Link>
                  ) : null}
                  <InboxActions
                    archived={notification.status === 'archived'}
                    notificationID={notification.id}
                    unread={notification.status === 'unread'}
                  />
                </div>
                {notification.createdAt ? (
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="portal-panel">
            <h2 className="portal-heading-sm">Nothing new</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your portal notifications will appear here when there is something to review.
            </p>
          </div>
        )}
      </section>

      {notifications.length ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {unreadCount
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : 'All caught up'}
        </p>
      ) : null}
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Inbox',
}

const getNotifications = async (
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
): Promise<NotificationRecord[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'notifications',
    depth: 0,
    limit: 50,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    user,
    where: {
      status: {
        not_equals: 'archived',
      },
    },
  })

  return result.docs as NotificationRecord[]
}

const formatType = (type?: string | null) => (type ? type.replace(/_/g, ' ') : 'notification')
