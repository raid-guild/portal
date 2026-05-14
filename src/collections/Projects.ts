import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { authenticated } from '@/access/authenticated'
import { contentContributors } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: authenticated,
    delete: contentContributors,
    read: authenticatedOrPublished,
    update: contentContributors,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'projectStatus', '_status', 'updatedAt'],
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
      name: 'description',
      type: 'richText',
    },
    {
      name: 'projectStatus',
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
          label: 'Building',
          value: 'building',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
        {
          label: 'Exploratory',
          value: 'exploratory',
        },
        {
          label: 'Exploring',
          value: 'exploring',
        },
        {
          label: 'Shipping',
          value: 'shipping',
        },
      ],
    },
    {
      name: 'currentState',
      type: 'array',
      fields: [
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
      ],
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
      name: 'primaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'url',
          type: 'text',
          validate: (value) => validateSafeURL(value),
        },
      ],
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
          validate: (value) =>
            validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contributors',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'profileSkills',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profileSkills',
    },
    {
      name: 'activityItems',
      type: 'relationship',
      hasMany: true,
      relationTo: 'activityItems',
    },
    {
      name: 'threads',
      type: 'relationship',
      hasMany: true,
      relationTo: 'threads',
    },
    {
      name: 'events',
      type: 'relationship',
      hasMany: true,
      relationTo: 'events',
    },
    {
      name: 'resources',
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
          validate: (value) =>
            validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
        },
        {
          name: 'resourceType',
          type: 'select',
          defaultValue: 'link',
          options: [
            {
              label: 'Link',
              value: 'link',
            },
            {
              label: 'Repository',
              value: 'repo',
            },
            {
              label: 'Design',
              value: 'design',
            },
            {
              label: 'Document',
              value: 'doc',
            },
            {
              label: 'Calendar',
              value: 'calendar',
            },
            {
              label: 'Discord',
              value: 'discord',
            },
          ],
        },
      ],
    },
    {
      name: 'contributionActions',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
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
