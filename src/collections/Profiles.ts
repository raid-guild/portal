import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { ownProfileOrAdmin, privateProfileField, publicProfilesOrOwner } from '@/access/profiles'
import { admins, adminsFieldAccess, isAdmin } from '@/access/roles'

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
    defaultColumns: ['displayName', 'handle', 'claimStatus', 'status', 'visibility', 'updatedAt'],
    group: 'Portal',
    useAsTitle: 'displayName',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      admin: {
        description: 'Blank users mark imported or legacy profiles as unclaimed.',
        position: 'sidebar',
      },
      hasMany: false,
      relationTo: 'users',
    },
    {
      name: 'claimStatus',
      type: 'select',
      access: {
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        description: 'Imported profiles can stay unclaimed until a matching account claims them.',
        position: 'sidebar',
      },
      defaultValue: 'claimed',
      index: true,
      options: [
        {
          label: 'Unclaimed',
          value: 'unclaimed',
        },
        {
          label: 'Claimed',
          value: 'claimed',
        },
      ],
      required: true,
    },
    {
      name: 'claimEmail',
      type: 'email',
      access: {
        create: adminsFieldAccess,
        read: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        description:
          'Email from the legacy CRM used to match a new signup to this unclaimed profile.',
        position: 'sidebar',
      },
      index: true,
    },
    {
      name: 'claimedAt',
      type: 'date',
      access: {
        create: adminsFieldAccess,
        read: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'sourceCRMID',
      type: 'text',
      access: {
        create: adminsFieldAccess,
        read: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        description: 'Optional legacy CRM identifier for import reconciliation.',
        position: 'sidebar',
      },
      index: true,
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
        {
          name: 'x',
          label: 'X',
          type: 'text',
          admin: {
            description: 'X handle without the @ symbol.',
          },
          maxLength: 15,
          validate: (value: null | string | undefined) => {
            if (!value) return true

            if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) {
              return 'X handle must be 1-15 characters and contain only letters, numbers, and underscores'
            }

            return true
          },
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
        const normalizedData = data?.claimEmail
          ? {
              ...data,
              claimEmail: String(data.claimEmail).trim().toLowerCase(),
            }
          : data

        if ((operation === 'create' || operation === 'update') && req.user && !isAdmin(req.user)) {
          return {
            ...normalizedData,
            claimStatus: 'claimed',
            ...(operation === 'create' ? { claimedAt: new Date().toISOString() } : {}),
            user: req.user.id,
          }
        }

        if (
          operation === 'create' &&
          req.user &&
          !normalizedData?.user &&
          normalizedData?.claimStatus !== 'unclaimed'
        ) {
          return {
            ...normalizedData,
            claimStatus: 'claimed',
            claimedAt: new Date().toISOString(),
            user: req.user.id,
          }
        }

        return normalizedData
      },
    ],
  },
  timestamps: true,
}
