import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { ownProfileOrAdmin, privateProfileField, publicProfilesOrOwner } from '@/access/profiles'
import { admins, isAdmin } from '@/access/roles'

const handlePattern = /^[a-z0-9_-]+$/i

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    create: authenticated,
    delete: admins,
    read: publicProfilesOrOwner,
    update: ownProfileOrAdmin,
  },
  admin: {
    defaultColumns: ['displayName', 'handle', 'status', 'visibility', 'updatedAt'],
    group: 'Portal',
    useAsTitle: 'displayName',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: false,
      relationTo: 'users',
      required: true,
      unique: true,
    },
    {
      name: 'handle',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      validate: (value: string | null | undefined) => {
        if (!value?.trim()) return 'Handle is required'
        if (!handlePattern.test(value)) {
          return 'Handle can only use letters, numbers, hyphens, and underscores'
        }

        return true
      },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'walletAddress',
      type: 'text',
      access: {
        read: privateProfileField,
      },
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
      name: 'contact',
      type: 'group',
      access: {
        read: privateProfileField,
      },
      fields: [
        {
          name: 'email',
          type: 'email',
        },
        {
          name: 'discord',
          type: 'text',
        },
        {
          name: 'telegram',
          type: 'text',
        },
        {
          name: 'farcaster',
          type: 'text',
        },
      ],
    },
    {
      name: 'profileSkills',
      type: 'relationship',
      hasMany: true,
      relationTo: 'profileSkills',
      required: true,
    },
    {
      name: 'profileRoles',
      type: 'relationship',
      hasMany: true,
      maxRows: 2,
      relationTo: 'profileRoles',
      required: true,
    },
    {
      name: 'status',
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
          label: 'Inactive',
          value: 'inactive',
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
          label: 'Private',
          value: 'private',
        },
      ],
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if ((operation === 'create' || operation === 'update') && req.user && !isAdmin(req.user)) {
          return {
            ...data,
            user: req.user.id,
          }
        }

        if (operation === 'create' && req.user && !data?.user) {
          return {
            ...data,
            user: req.user.id,
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
