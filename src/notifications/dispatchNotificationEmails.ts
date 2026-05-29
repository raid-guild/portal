import type { PayloadRequest } from 'payload'

import type { Notification, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

type DispatchNotificationEmailsArgs = {
  dryRun?: boolean
  limit?: number
  req: PayloadRequest
}

type DispatchResult = {
  failed: number
  processed: number
  sent: number
  skipped: number
}

export const dispatchNotificationEmails = async ({
  dryRun = false,
  limit = 50,
  req,
}: DispatchNotificationEmailsArgs) => {
  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 100)
  const pending = await req.payload.find({
    collection: 'notifications',
    depth: 1,
    limit: normalizedLimit,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: {
      and: [
        {
          deliveryChannel: {
            equals: 'email',
          },
        },
        {
          emailStatus: {
            equals: 'pending',
          },
        },
      ],
    },
  })

  const result: DispatchResult = {
    failed: 0,
    processed: pending.docs.length,
    sent: 0,
    skipped: 0,
  }

  if (dryRun) {
    return {
      dryRun,
      limit: normalizedLimit,
      result,
    }
  }

  for (const notification of pending.docs) {
    const recipient =
      typeof notification.recipient === 'object' ? notification.recipient : undefined

    if (!canEmailRecipient(recipient)) {
      await markNotificationEmailSkipped({
        error: 'Recipient email is missing or unverified.',
        notification,
        req,
      })
      result.skipped += 1
      continue
    }

    try {
      await req.payload.sendEmail({
        html: renderNotificationEmail(notification),
        subject: notification.title,
        to: recipient.email,
      })

      await req.payload.update({
        id: notification.id,
        collection: 'notifications',
        context: {
          allowNotificationSystemUpdate: true,
        },
        data: {
          emailedAt: new Date().toISOString(),
          emailError: null,
          emailStatus: 'sent',
        },
        overrideAccess: true,
        req,
      })

      result.sent += 1
    } catch (error) {
      await req.payload.update({
        id: notification.id,
        collection: 'notifications',
        context: {
          allowNotificationSystemUpdate: true,
        },
        data: {
          emailError: error instanceof Error ? error.message : 'Unable to send notification email.',
          emailStatus: 'failed',
        },
        overrideAccess: true,
        req,
      })

      result.failed += 1
    }
  }

  return {
    dryRun,
    limit: normalizedLimit,
    result,
  }
}

const canEmailRecipient = (recipient?: User): recipient is User & { email: string } =>
  Boolean(recipient?.email && recipient.emailVerifiedAt)

const markNotificationEmailSkipped = async ({
  error,
  notification,
  req,
}: {
  error: string
  notification: Notification
  req: PayloadRequest
}) => {
  await req.payload.update({
    id: notification.id,
    collection: 'notifications',
    context: {
      allowNotificationSystemUpdate: true,
    },
    data: {
      emailError: error,
      emailStatus: 'skipped',
    },
    overrideAccess: true,
    req,
  })
}

const renderNotificationEmail = (notification: Notification) => {
  const portalURL = getServerSideURL()
  const actionURL = notification.actionURL
    ? notification.actionURL.startsWith('/')
      ? `${portalURL}${notification.actionURL}`
      : notification.actionURL
    : `${portalURL}/inbox`
  const body = notification.body ? `<p>${escapeHTML(notification.body)}</p>` : ''
  const actionLabel = notification.actionLabel || 'Open notification'

  return `
    <p>${escapeHTML(notification.title)}</p>
    ${body}
    <p><a href="${escapeHTML(actionURL)}">${escapeHTML(actionLabel)}</a></p>
    <p>You can manage notification preferences from your RaidGuild Portal profile.</p>
  `
}

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
