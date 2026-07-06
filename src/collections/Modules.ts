import type { CollectionConfig } from 'payload'

import { deleteModules, manageModules, readVisibleModules } from '@/access/modules'
import { authRoleOptions } from '@/access/roles'
import { createModulePublishedNotifications } from './Modules/hooks/createModulePublishedNotifications'
import { slugField } from '@/fields/slug'
import { validateSafeURL } from '@/utilities/safeURL'

const envKeyPattern = /^[A-Z][A-Z0-9_]*$/

const isSignedExternalLaunch = (siblingData: unknown): boolean =>
  typeof siblingData === 'object' &&
  siblingData !== null &&
  'moduleKind' in siblingData &&
  'authMode' in siblingData &&
  siblingData.moduleKind === 'external' &&
  siblingData.authMode === 'signed_launch'

const validateExternalCallbackURL = (
  value: unknown,
  { siblingData }: { siblingData?: unknown } = {},
): true | string => {
  if (isSignedExternalLaunch(siblingData) && !value) {
    return 'External signed-launch modules require an HTTPS callback URL.'
  }

  return validateSafeURL(value, { allowRelative: false, protocols: ['https:'] })
}

const validateEnvKey = (
  value: unknown,
  { siblingData }: { siblingData?: unknown } = {},
): true | string => {
  if (isSignedExternalLaunch(siblingData) && !value) {
    return 'External signed-launch modules require a launch secret environment key.'
  }

  if (!value) return true

  return typeof value === 'string' && envKeyPattern.test(value)
    ? true
    : 'Use an uppercase environment variable key such as CRM_MODULE_LAUNCH_SECRET.'
}

const validateTTL = (value: unknown): true | string => {
  if (value == null) return true

  return typeof value === 'number' && Number.isFinite(value) && value >= 30 && value <= 600
    ? true
    : 'Launch token TTL must be between 30 and 600 seconds.'
}

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
      'category',
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
      name: 'category',
      type: 'select',
      admin: {
        description: 'High-level product category used to group modules on member surfaces.',
        position: 'sidebar',
      },
      defaultValue: 'tools',
      index: true,
      options: [
        {
          label: 'Ops',
          value: 'ops',
        },
        {
          label: 'Tools',
          value: 'tools',
        },
        {
          label: 'Analytics',
          value: 'analytics',
        },
        {
          label: 'Games',
          value: 'games',
        },
        {
          label: 'Knowledge',
          value: 'knowledge',
        },
        {
          label: 'Community',
          value: 'community',
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
      name: 'moduleKind',
      type: 'select',
      admin: {
        description: 'Internal modules open Portal routes. External modules launch another app.',
        position: 'sidebar',
      },
      defaultValue: 'internal',
      index: true,
      options: [
        {
          label: 'Internal',
          value: 'internal',
        },
        {
          label: 'External',
          value: 'external',
        },
      ],
      required: true,
    },
    {
      name: 'authMode',
      type: 'select',
      admin: {
        description: 'Signed launch redirects through Portal and hands off a short-lived token.',
        position: 'sidebar',
      },
      defaultValue: 'none',
      index: true,
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'Signed launch',
          value: 'signed_launch',
        },
      ],
      required: true,
    },
    {
      name: 'externalCallbackURL',
      type: 'text',
      admin: {
        description: 'HTTPS callback URL that receives the launch token.',
      },
      validate: validateExternalCallbackURL,
    },
    {
      name: 'launchSecretEnvKey',
      type: 'text',
      admin: {
        description: 'Environment variable key containing this module launch signing secret.',
      },
      validate: validateEnvKey,
    },
    {
      name: 'launchAudience',
      type: 'text',
      admin: {
        description: 'Audience claim expected by the external app. Defaults to the module slug.',
      },
    },
    {
      name: 'launchTokenTTLSeconds',
      type: 'number',
      admin: {
        description: 'Short-lived launch token TTL. Keep this low.',
      },
      defaultValue: 120,
      validate: validateTTL,
    },
    {
      name: 'launchRequiredRoles',
      type: 'select',
      admin: {
        description: 'Optional additional user roles required to launch this external module.',
      },
      hasMany: true,
      options: authRoleOptions,
    },
    {
      name: 'includeEmailInLaunch',
      type: 'checkbox',
      admin: {
        description: 'Include the user email claim in signed launch tokens.',
      },
      defaultValue: true,
    },
    {
      name: 'includeRolesInLaunch',
      type: 'checkbox',
      admin: {
        description: 'Include Portal auth roles in signed launch tokens.',
      },
      defaultValue: true,
    },
    {
      name: 'includeProfileInLaunch',
      type: 'checkbox',
      admin: {
        description: 'Include the linked Portal profile ID/name when one exists.',
      },
      defaultValue: true,
    },
    {
      name: 'includeHandleInLaunch',
      type: 'checkbox',
      admin: {
        description: 'Include the linked public profile handle when one exists.',
      },
      defaultValue: true,
    },
    {
      name: 'includeAvatarInLaunch',
      type: 'checkbox',
      admin: {
        description: 'Include a public avatar URL when the linked profile has one.',
      },
      defaultValue: false,
    },
    {
      name: 'integrationNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for the external app integration.',
      },
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
  hooks: {
    afterChange: [createModulePublishedNotifications],
  },
  timestamps: true,
}
