import type { CollectionConfig } from 'payload'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentContributors } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const Threads: CollectionConfig = {
  slug: 'threads',
  access: {
    create: contentContributors,
    delete: contentContributors,
    read: readVisiblePortalContent,
    update: contentContributors,
  },
  admin: {
    defaultColumns: ['title', 'threadStatus', 'lastActiveAt', '_status', 'updatedAt'],
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
      required: true,
    },
    {
      name: 'threadStatus',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Paused',
          value: 'paused',
        },
        {
          label: 'Resolved',
          value: 'resolved',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'participants',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (value) => validateSafeURL(value),
        },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'authenticated',
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
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
