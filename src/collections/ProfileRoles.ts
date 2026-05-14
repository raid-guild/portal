import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { admins, hideFromNonEditors } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const ProfileRoles: CollectionConfig = {
  slug: 'profileRoles',
  access: {
    create: admins,
    delete: admins,
    read: anyone,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'type', 'group', 'slug'],
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'type',
      type: 'text',
    },
    {
      name: 'group',
      type: 'select',
      options: [
        {
          label: 'Builder',
          value: 'builder',
        },
        {
          label: 'Support',
          value: 'support',
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'iconPath',
      type: 'text',
      admin: {
        description: 'Static public asset path used by member-facing profile flows.',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
    },
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  timestamps: true,
}
