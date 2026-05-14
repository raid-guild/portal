import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { admins, hideFromNonEditors } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const ProfileSkills: CollectionConfig = {
  slug: 'profileSkills',
  access: {
    create: admins,
    delete: admins,
    read: anyone,
    update: admins,
  },
  admin: {
    defaultColumns: ['title', 'category', 'slug'],
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
      name: 'category',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  timestamps: true,
}
