import type { CollectionConfig } from 'payload'

import { awardBadges, deleteBadges, manageBadges, readVisibleBadges } from '@/access/badges'
import { canEditContent, hideFromNonEditors, hasRole } from '@/access/roles'
import { createBadgeAwardedNotifications } from './ProfileBadges/hooks/createBadgeAwardedNotifications'

export const ProfileBadges: CollectionConfig = {
  slug: 'profileBadges',
  access: {
    create: awardBadges,
    delete: deleteBadges,
    read: readVisibleBadges,
    update: manageBadges,
  },
  admin: {
    defaultColumns: ['badge', 'profiles', 'source', 'visibility', 'featured', 'awardedAt'],
    group: 'Portal',
    hidden: hideFromNonEditors,
    useAsTitle: 'note',
  },
  fields: [
    {
      name: 'profiles',
      type: 'relationship',
      admin: {
        description: 'Award this badge to one or more profiles.',
      },
      hasMany: true,
      relationTo: 'profiles',
      required: true,
    },
    {
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges',
      required: true,
    },
    {
      name: 'awardedAt',
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
      name: 'awardedByUser',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'source',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Agent',
          value: 'agent',
        },
        {
          label: 'Cohort',
          value: 'cohort',
        },
        {
          label: 'Import',
          value: 'import',
        },
        {
          label: 'System',
          value: 'system',
        },
      ],
      required: true,
    },
    {
      name: 'relatedProject',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'relatedPost',
      type: 'relationship',
      relationTo: 'posts',
    },
    {
      name: 'note',
      type: 'textarea',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
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
        {
          label: 'Private',
          value: 'private',
        },
      ],
      required: true,
    },
  ],
  hooks: {
    afterChange: [createBadgeAwardedNotifications],
    beforeValidate: [
      ({ data, req }) => {
        const nextData = {
          ...data,
        }

        if (hasRole(req.user, 'agent') && !canEditContent(req.user)) {
          nextData.awardedByUser = req.user?.id
          nextData.source = 'agent'

          return nextData
        }

        if (!nextData.awardedByUser && req.user?.id) {
          nextData.awardedByUser = req.user.id
        }

        if (!nextData.source) {
          nextData.source = hasRole(req.user, 'agent') ? 'agent' : 'admin'
        }

        return nextData
      },
    ],
  },
  timestamps: true,
}
