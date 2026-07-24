import type { CollectionConfig } from 'payload'

import { createProjectActivityItems, manageProjectActivityItems } from '@/access/projectStewards'
import { readVisiblePortalContent } from '@/access/portalVisibility'
import { contentContributors } from '@/access/roles'
import { validateSafeURL } from '@/utilities/safeURL'

export const ActivityItems: CollectionConfig = {
  slug: 'activityItems',
  access: {
    create: createProjectActivityItems,
    delete: manageProjectActivityItems,
    read: readVisiblePortalContent,
    update: manageProjectActivityItems,
  },
  admin: {
    defaultColumns: ['title', 'activityType', 'happenedAt', '_status', 'updatedAt'],
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
      name: 'body',
      type: 'textarea',
    },
    {
      name: 'activityType',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'discussion',
      options: [
        {
          label: 'Discussion',
          value: 'discussion',
        },
        {
          label: 'Decision',
          value: 'decision',
        },
        {
          label: 'Project',
          value: 'project',
        },
        {
          label: 'Insight',
          value: 'insight',
        },
        {
          label: 'Blocker',
          value: 'blocker',
        },
        {
          label: 'Event',
          value: 'event',
        },
        {
          label: 'Contribution',
          value: 'contribution',
        },
      ],
      required: true,
    },
    {
      name: 'happenedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      defaultValue: () => new Date(),
      index: true,
      required: true,
    },
    {
      name: 'sourceLabel',
      type: 'text',
    },
    {
      name: 'sourceKey',
      type: 'text',
      admin: {
        description: 'Stable key used by portal action hooks to avoid duplicate activity items.',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      unique: true,
    },
    {
      name: 'sourceURL',
      type: 'text',
      validate: (value) =>
        validateSafeURL(value, { allowRelative: false, protocols: ['http:', 'https:'] }),
    },
    {
      name: 'relatedProject',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'relatedThread',
      type: 'relationship',
      relationTo: 'threads',
    },
    {
      name: 'relatedEvent',
      type: 'relationship',
      relationTo: 'events',
    },
    {
      name: 'relatedProfiles',
      type: 'relationship',
      admin: {
        description: 'People referenced by or otherwise related to this activity.',
      },
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'creditedProfiles',
      type: 'relationship',
      admin: {
        description:
          'Profiles whose concrete participation this activity documents. Recent credited activity can surface them on the member dashboard.',
      },
      hasMany: true,
      relationTo: 'profiles',
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
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
}
