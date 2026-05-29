import type { CollectionConfig } from 'payload'

import {
  deleteNotifications,
  manageNotifications,
  readOwnNotificationsOrEditor,
  updateOwnNotificationsOrEditor,
} from '@/access/notifications'
import { canEditContent, hideFromNonEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    create: manageNotifications,
    delete: deleteNotifications,
    read: readOwnNotificationsOrEditor,
    update: updateOwnNotificationsOrEditor,
  },
  admin: {
    defaultColumns: [
      'recipient',
      'title',
      'type',
      'status',
      'deliveryChannel',
      'emailStatus',
      'createdAt',
    ],
    group: 'Portal',
    hidden: hideFromNonEditors,
    listSearchableFields: ['title', 'body', 'dedupeKey', 'emailError'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
    },
    {
      name: 'type',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'system',
      options: [
        {
          label: 'Event Published',
          value: 'event_published',
        },
        {
          label: 'Event Reminder',
          value: 'event_reminder',
        },
        {
          label: 'Brief Published',
          value: 'brief_published',
        },
        {
          label: 'Activity Digest',
          value: 'activity_digest',
        },
        {
          label: 'Weekly Digest',
          value: 'weekly_digest',
        },
        {
          label: 'Badge Awarded',
          value: 'badge_awarded',
        },
        {
          label: 'Profile Claim',
          value: 'profile_claim',
        },
        {
          label: 'System',
          value: 'system',
        },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'unread',
      options: [
        {
          label: 'Unread',
          value: 'unread',
        },
        {
          label: 'Read',
          value: 'read',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'normal',
      options: [
        {
          label: 'Normal',
          value: 'normal',
        },
        {
          label: 'High',
          value: 'high',
        },
      ],
      required: true,
    },
    {
      name: 'deliveryChannel',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'in_app',
      options: [
        {
          label: 'In App',
          value: 'in_app',
        },
        {
          label: 'Email',
          value: 'email',
        },
      ],
      required: true,
    },
    {
      name: 'emailStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'none',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Sent',
          value: 'sent',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Skipped',
          value: 'skipped',
        },
      ],
      required: true,
    },
    {
      name: 'emailError',
      type: 'textarea',
    },
    {
      name: 'readAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'archivedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'emailedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'dedupeKey',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'actionLabel',
      type: 'text',
    },
    {
      name: 'actionURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: true, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'relatedBrief',
      type: 'relationship',
      relationTo: 'dailyBriefs',
    },
    {
      name: 'relatedActivityItem',
      type: 'relationship',
      relationTo: 'activityItems',
    },
    {
      name: 'relatedProject',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'relatedThread',
      type: 'relationship',
      relationTo: 'threads',
    },
    {
      name: 'relatedBadgeAward',
      type: 'relationship',
      relationTo: 'profileBadges',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  hooks: {
    beforeChange: [
      ({ context, data, operation, req }) => {
        const nextData = {
          ...data,
        }
        const now = new Date().toISOString()

        if (nextData.status === 'read' && !nextData.readAt) {
          nextData.readAt = now
        }

        if (nextData.status === 'archived') {
          if (!nextData.readAt) nextData.readAt = now
          if (!nextData.archivedAt) nextData.archivedAt = now
        }

        if (
          operation === 'update' &&
          !context.allowNotificationSystemUpdate &&
          !canEditContent(req.user)
        ) {
          const readableUpdate: Record<string, unknown> = {}

          if (nextData.status) readableUpdate.status = nextData.status
          if (nextData.readAt) readableUpdate.readAt = nextData.readAt
          if (nextData.archivedAt) readableUpdate.archivedAt = nextData.archivedAt

          return readableUpdate
        }

        return nextData
      },
    ],
  },
  timestamps: true,
}
