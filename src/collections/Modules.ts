import type { CollectionConfig } from 'payload'

import { deleteModules, manageModules, readVisibleModules } from '@/access/modules'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

export const Modules: CollectionConfig = {
  slug: 'modules',
  access: {
    create: manageModules,
    delete: deleteModules,
    read: readVisibleModules,
    update: manageModules,
  },
  admin: {
    defaultColumns: [
      'name',
      'status',
      'enabled',
      'featured',
      'visibility',
      'sourceProject',
      'updatedAt',
    ],
    group: 'Portal',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 'idea',
      index: true,
      options: [
        {
          label: 'Idea',
          value: 'idea',
        },
        {
          label: 'Prototype',
          value: 'prototype',
        },
        {
          label: 'Experimental',
          value: 'experimental',
        },
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Graduated',
          value: 'graduated',
        },
        {
          label: 'Archived',
          value: 'archived',
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
      defaultValue: 'authenticated',
      index: true,
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
          label: 'Admin',
          value: 'admin',
        },
      ],
      required: true,
    },
    {
      name: 'enabled',
      type: 'checkbox',
      admin: {
        description: 'Enabled modules are listed on member-facing module surfaces.',
        position: 'sidebar',
      },
      defaultValue: true,
      index: true,
    },
    {
      name: 'featured',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
      },
      defaultValue: false,
      index: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 0,
    },
    {
      name: 'entryRoute',
      type: 'text',
      admin: {
        description: 'Member-facing route when the module has a usable surface.',
      },
      validate: (value) => validateSafeURL(value, { allowRelative: true }),
    },
    {
      name: 'adminRoute',
      type: 'text',
      admin: {
        description: 'Optional admin route for managing module-owned records.',
      },
      validate: (value) => validateSafeURL(value, { allowRelative: true }),
    },
    {
      name: 'specURL',
      type: 'text',
      admin: {
        description: 'Spec, docs, or planning link for this module.',
      },
      validate: (value) => validateSafeURL(value, { allowRelative: true }),
    },
    {
      name: 'repositoryURL',
      type: 'text',
      admin: {
        description: 'Optional implementation repository or PR link.',
      },
      validate: (value) => validateSafeURL(value, { allowRelative: true }),
    },
    {
      name: 'owners',
      type: 'relationship',
      admin: {
        description: 'Profiles stewarding or championing this module.',
      },
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'sourceProject',
      type: 'relationship',
      admin: {
        description: 'Primary project that produced or maintains this module.',
      },
      relationTo: 'projects',
    },
    {
      name: 'relatedProjects',
      type: 'relationship',
      hasMany: true,
      relationTo: 'projects',
    },
    {
      name: 'relatedThreads',
      type: 'relationship',
      hasMany: true,
      relationTo: 'threads',
    },
    {
      name: 'relatedProfiles',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profiles',
    },
    {
      name: 'ownedCollections',
      type: 'array',
      admin: {
        description: 'Payload collection slugs owned by this module.',
      },
      fields: [
        {
          name: 'collectionSlug',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'corePrimitiveRelationships',
      type: 'array',
      fields: [
        {
          name: 'primitive',
          type: 'select',
          options: [
            {
              label: 'Brief',
              value: 'brief',
            },
            {
              label: 'Project',
              value: 'project',
            },
            {
              label: 'Thread',
              value: 'thread',
            },
            {
              label: 'Activity Item',
              value: 'activityItem',
            },
            {
              label: 'Event',
              value: 'event',
            },
            {
              label: 'Profile',
              value: 'profile',
            },
            {
              label: 'Post',
              value: 'post',
            },
          ],
          required: true,
        },
      ],
    },
    {
      name: 'graduationCriteria',
      type: 'textarea',
    },
    {
      name: 'riskNotes',
      type: 'textarea',
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        position: 'sidebar',
      },
    },
    ...slugField('name', {
      slugOverrides: {
        unique: true,
      },
    }),
  ],
  timestamps: true,
}
