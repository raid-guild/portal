import type { CollectionConfig } from 'payload'

import {
  adminsFieldAccess,
  authRoleOptions,
  canAccessAdmin,
  hideFromNonEditors,
  isAdmin,
  ownUserOrAdmin,
} from '@/access/roles'
import { anyone } from '@/access/anyone'
import { getServerSideURL } from '@/utilities/getURL'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => canAccessAdmin(user),
    create: anyone,
    delete: ({ req: { user } }) => isAdmin(user),
    read: ownUserOrAdmin,
    update: ownUserOrAdmin,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    hidden: hideFromNonEditors,
    useAsTitle: 'name',
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token
        const resetURL = `${getServerSideURL()}/reset-password?token=${encodeURIComponent(token || '')}`

        return `
          <p>A password reset was requested for your RaidGuild Portal account.</p>
          <p><a href="${resetURL}">Reset your password</a></p>
          <p>This link expires soon. If you did not request this, you can ignore this email.</p>
        `
      },
      generateEmailSubject: () => 'Reset your RaidGuild Portal password',
    },
  },
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
