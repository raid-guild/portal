import type { CollectionConfig } from 'payload'

import { deleteBadges, manageBadges, readVisibleBadges } from '@/access/badges'
import { hideFromNonEditors } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const Badges: CollectionConfig = {
  slug: 'badges',
  access: {
    create: manageBadges,
    delete: deleteBadges,
    read: readVisibleBadges,
    update: manageBadges,
  },
  admin: {
    defaultColumns: ['title', 'category', 'visibility', 'isRetired', 'sortOrder'],
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
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'achievement',
      options: [
        {
          label: 'Cohort',
          value: 'cohort',
        },
        {
          label: 'Contribution',
          value: 'contribution',
        },
        {
          label: 'Craft',
          value: 'craft',
        },
        {
          label: 'Community',
          value: 'community',
        },
        {
          label: 'Achievement',
          value: 'achievement',
        },
      ],
      required: true,
    },
    {
      name: 'artwork',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'fallbackIcon',
      type: 'select',
      defaultValue: 'spark',
      options: [
        {
          label: 'Award',
          value: 'award',
        },
        {
          label: 'Spark',
          value: 'spark',
        },
        {
          label: 'Shield',
          value: 'shield',
        },
        {
          label: 'Star',
          value: 'star',
        },
        {
          label: 'Users',
          value: 'users',
        },
      ],
    },
    {
      name: 'accentColor',
      type: 'text',
      admin: {
        description: 'Optional CSS color used for member-facing display accents.',
      },
    },
    {
      name: 'backgroundColor',
      type: 'text',
      admin: {
        description: 'Optional CSS color used for member-facing display backgrounds.',
      },
    },
    {
      name: 'displayStyle',
      type: 'select',
      defaultValue: 'standard',
      options: [
        {
          label: 'Standard',
          value: 'standard',
        },
        {
          label: 'Compact',
          value: 'compact',
        },
        {
          label: 'Featured',
          value: 'featured',
        },
      ],
      required: true,
    },
    {
      name: 'isRetired',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
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
          label: 'Public',
          value: 'public',
        },
        {
          label: 'Members',
          value: 'member',
        },
      ],
      required: true,
    },
    ...slugField('title', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  timestamps: true,
}
