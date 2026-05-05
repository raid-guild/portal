import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { adminsFieldAccess, authRoleOptions, isAdmin, ownUserOrAdmin } from '@/access/roles'
import { anyone } from '@/access/anyone'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: anyone,
    delete: authenticated,
    read: ownUserOrAdmin,
    update: ownUserOrAdmin,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
      defaultValue: ['contributor'],
      hasMany: true,
      options: authRoleOptions,
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data

        const existingUsers = await req.payload.count({
          collection: 'users',
        })

        if (existingUsers.totalDocs === 0) {
          return {
            ...data,
            roles: ['admin'],
          }
        }

        if (!isAdmin(req.user)) {
          return {
            ...data,
            roles: ['contributor'],
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
