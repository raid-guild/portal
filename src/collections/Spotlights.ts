import type { CollectionConfig } from 'payload'

import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentEditors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

const targetFieldAdminCondition = (targetType: string) => (_: unknown, siblingData: unknown) => {
  return (
    siblingData !== null &&
    typeof siblingData === 'object' &&
    'targetType' in siblingData &&
    siblingData.targetType === targetType
  )
}

export const Spotlights: CollectionConfig = {
  slug: 'spotlights',
  access: {
    create: contentEditors,
    delete: contentEditors,
    read: readVisiblePortalContent,
    update: contentEditors,
  },
  admin: {
    defaultColumns: ['title', 'kind', 'visibility', '_status', 'startsAt', 'expiresAt', 'priority'],
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
      name: 'kind',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'featured',
      options: [
        {
          label: 'Featured',
          value: 'featured',
        },
        {
          label: 'Announcement',
          value: 'announcement',
        },
      ],
      required: true,
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
          label: 'Authenticated',
          value: 'authenticated',
        },
        {
          label: 'Members',
          value: 'member',
        },
        {
          label: 'Admin only',
          value: 'admin',
        },
      ],
      required: true,
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
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Announcements should usually expire after the relevant event or deadline.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'priority',
      type: 'number',
      admin: {
        position: 'sidebar',
        step: 1,
      },
      defaultValue: 0,
      index: true,
    },
    {
      name: 'targetType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'thread',
      options: [
        {
          label: 'Thread',
          value: 'thread',
        },
        {
          label: 'Session',
          value: 'event',
        },
        {
          label: 'Project',
          value: 'project',
        },
        {
          label: 'Post',
          value: 'post',
        },
        {
          label: 'Profile',
          value: 'profile',
        },
        {
          label: 'External URL',
          value: 'external',
        },
        {
          label: 'Artifact URL',
          value: 'artifact',
        },
      ],
      required: true,
    },
    {
      name: 'targetThread',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('thread'),
      },
      relationTo: 'threads',
    },
    {
      name: 'targetEvent',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('event'),
      },
      relationTo: 'events',
    },
    {
      name: 'targetProject',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('project'),
      },
      relationTo: 'projects',
    },
    {
      name: 'targetPost',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('post'),
      },
      relationTo: 'posts',
    },
    {
      name: 'targetProfile',
      type: 'relationship',
      admin: {
        condition: targetFieldAdminCondition('profile'),
      },
      relationTo: 'profiles',
    },
    {
      name: 'externalURL',
      type: 'text',
      admin: {
        condition: targetFieldAdminCondition('external'),
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'artifactURL',
      type: 'text',
      admin: {
        condition: targetFieldAdminCondition('artifact'),
      },
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'ctaLabel',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
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
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create' && req.user && !data?.createdBy) {
          return {
            ...data,
            createdBy: req.user.id,
          }
        }

        return data
      },
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
