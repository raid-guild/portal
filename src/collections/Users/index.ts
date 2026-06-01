import type { CollectionConfig, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

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
      defaultValue: ['unverified'],
      hasMany: true,
      options: authRoleOptions,
      saveToJWT: true,
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      access: {
        create: adminsFieldAccess,
        update: adminsFieldAccess,
      },
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Set after the user verifies their account email from the portal.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ context, doc, operation, req }) => {
        if (operation !== 'create') return
        await linkMatchingInquiries({ req, user: doc as User })
        if (context.skipWelcomeEmail) return

        await sendWelcomeEmail({ req, user: doc as User })
      },
    ],
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
            roles: ['unverified'],
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}

const linkMatchingInquiries = async ({ req, user }: { req: PayloadRequest; user: User }) => {
  if (!user.email) return

  try {
    const matchingEmail = user.email.trim().toLowerCase()

    while (true) {
      const result = await req.payload.find({
        collection: 'inquiries',
        limit: 100,
        overrideAccess: true,
        req,
        sort: '-createdAt',
        where: {
          and: [
            {
              email: {
                equals: matchingEmail,
              },
            },
            {
              accountLinkStatus: {
                equals: 'unlinked',
              },
            },
          ],
        },
      })

      if (result.docs.length === 0) break

      await Promise.all(
        result.docs.map((inquiry) =>
          req.payload.update({
            collection: 'inquiries',
            id: inquiry.id,
            data: {
              accountLinkStatus: 'linked',
              submitterUser: user.id,
            },
            overrideAccess: true,
            req,
          }),
        ),
      )
    }
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: 'Failed to link matching inquiries after signup.',
      userID: user.id,
    })
  }
}

const sendWelcomeEmail = async ({ req, user }: { req: PayloadRequest; user: User }) => {
  if (!user.email || user.roles?.includes('agent')) return

  const portalURL = getServerSideURL()
  const displayName = user.name || 'there'

  try {
    await req.payload.sendEmail({
      html: `
        <p>Welcome to the RaidGuild Portal, ${escapeHTML(displayName)}.</p>
        <p>Your account is ready. Start with the current brief, then complete your contributor profile so other members can find your skills and work.</p>
        <p><a href="${portalURL}/dashboard">Open your dashboard</a></p>
        <p><a href="${portalURL}/me">Complete your profile</a></p>
      `,
      subject: 'Welcome to the RaidGuild Portal',
      to: user.email,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: 'Failed to send welcome email.',
      userID: user.id,
    })
  }
}

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
