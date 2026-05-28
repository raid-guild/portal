import type { CollectionConfig } from 'payload'

import { adminsOnly, adminsOrApprovedAgents, ownPointEventsOrAdmin } from '@/access/pointEvents'
import { hideFromNonEditors } from '@/access/roles'

export const PointEvents: CollectionConfig = {
  slug: 'pointEvents',
  access: {
    create: adminsOrApprovedAgents,
    delete: adminsOnly,
    read: ownPointEventsOrAdmin,
    update: adminsOnly,
  },
  admin: {
    defaultColumns: ['recipient', 'amount', 'reason', 'source', 'status', 'issuedAt'],
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'reason',
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
      validate: (value) => (value ? true : 'Recipient is required'),
    },
    {
      name: 'amount',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'reason',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'source',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'admin',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'System',
          value: 'system',
        },
        {
          label: 'Quest',
          value: 'quest',
        },
        {
          label: 'Bounty',
          value: 'bounty',
        },
        {
          label: 'Import',
          value: 'import',
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
      defaultValue: 'valid',
      options: [
        {
          label: 'Valid',
          value: 'valid',
        },
        {
          label: 'Reversed',
          value: 'reversed',
        },
      ],
      required: true,
    },
    {
      name: 'issuedBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: 'users',
    },
    {
      name: 'issuedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      defaultValue: () => new Date(),
      required: true,
    },
    {
      name: 'relatedProject',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: 'posts',
    },
    {
      name: 'relatedDailyBrief',
      type: 'relationship',
      relationTo: 'dailyBriefs',
    },
    {
      name: 'relatedDailyEngagement',
      type: 'relationship',
      relationTo: 'dailyEngagements',
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (!data.issuedBy && req.user?.id) {
          return {
            ...data,
            issuedBy: req.user.id,
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
