import type { CollectionConfig } from 'payload'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentContributors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: contentContributors,
    delete: contentContributors,
    read: readVisiblePortalContent,
    update: contentContributors,
  },
  admin: {
    defaultColumns: ['title', 'startsAt', 'visibility', '_status', 'updatedAt'],
    group: 'Portal',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'sessionType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'brownbag',
      options: [
        {
          label: 'Brownbag',
          value: 'brownbag',
        },
        {
          label: 'Workshop',
          value: 'workshop',
        },
        {
          label: 'All hands',
          value: 'all-hands',
        },
        {
          label: 'Demo',
          value: 'demo',
        },
        {
          label: 'Pitch',
          value: 'pitch',
        },
      ],
      required: true,
    },
    {
      name: 'speaker',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'profiles',
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      index: true,
      required: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'locationLabel',
      type: 'text',
    },
    {
      name: 'joinURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'calendarURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'discordEventURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'discordScheduledEventID',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'discordSyncStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 'not_configured',
      options: [
        {
          label: 'Not configured',
          value: 'not_configured',
        },
        {
          label: 'Synced',
          value: 'synced',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
      ],
    },
    {
      name: 'discordSyncError',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'relatedThreads',
      type: 'relationship',
      hasMany: true,
      relationTo: 'threads',
    },
    {
      name: 'relatedProfiles',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'public',
      options: [
        {
          label: 'Authenticated',
          value: 'authenticated',
        },
        {
          label: 'Public',
          value: 'public',
        },
        {
          label: 'Admin only',
          value: 'admin',
        },
      ],
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
