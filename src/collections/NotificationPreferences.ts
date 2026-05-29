import type { CollectionConfig } from 'payload'

import {
  createOwnNotificationPreferencesOrEditor,
  deleteNotifications,
  readOwnNotificationPreferencesOrEditor,
  updateOwnNotificationPreferencesOrEditor,
} from '@/access/notifications'
import { canEditContent, hideFromNonEditors } from '@/access/roles'

const channelOptions = [
  {
    label: 'In App',
    value: 'in_app',
  },
  {
    label: 'Email',
    value: 'email',
  },
  {
    label: 'Off',
    value: 'muted',
  },
]

export const NotificationPreferences: CollectionConfig = {
  slug: 'notificationPreferences',
  access: {
    create: createOwnNotificationPreferencesOrEditor,
    delete: deleteNotifications,
    read: readOwnNotificationPreferencesOrEditor,
    update: updateOwnNotificationPreferencesOrEditor,
  },
  admin: {
    defaultColumns: ['user', 'sessionAnnouncements', 'sessionReminders', 'weeklyDigest'],
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      name: 'emailEnabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sessionAnnouncements',
      type: 'select',
      defaultValue: 'in_app',
      options: channelOptions,
      required: true,
    },
    {
      name: 'sessionReminders',
      type: 'select',
      defaultValue: 'in_app',
      options: channelOptions,
      required: true,
    },
    {
      name: 'briefs',
      type: 'select',
      defaultValue: 'in_app',
      options: channelOptions,
      required: true,
    },
    {
      name: 'activityDigestFrequency',
      type: 'select',
      defaultValue: 'weekly',
      options: [
        {
          label: 'Off',
          value: 'none',
        },
        {
          label: 'Daily',
          value: 'daily',
        },
        {
          label: 'Weekly',
          value: 'weekly',
        },
      ],
      required: true,
    },
    {
      name: 'weeklyDigest',
      type: 'select',
      defaultValue: 'in_app',
      options: channelOptions,
      required: true,
    },
    {
      name: 'badgeAwards',
      type: 'select',
      defaultValue: 'in_app',
      options: channelOptions,
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, originalDoc, req }) => {
        if (!req.user?.id) return data

        if (!canEditContent(req.user)) {
          return {
            ...data,
            user: req.user.id,
          }
        }

        return {
          ...data,
          user:
            data?.user ||
            (operation === 'update' ? getRelationshipID(originalDoc?.user) : req.user.id),
        }
      },
    ],
  },
  timestamps: true,
}

const getRelationshipID = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id

    return typeof id === 'number' || typeof id === 'string' ? id : undefined
  }

  return undefined
}
