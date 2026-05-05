import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { contentContributors } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: contentContributors,
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
          label: 'Archived',
          value: 'archived',
        },
        {
          label: 'Exploratory',
          value: 'exploratory',
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
