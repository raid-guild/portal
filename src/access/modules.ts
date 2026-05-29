import type { Access, Where } from 'payload'

import { canEditContent, hasRole, isAdmin } from './roles'

const enabledAuthenticated: Where = {
  and: [
    {
      enabled: {
        equals: true,
      },
    },
    {
      visibility: {
        in: ['public', 'authenticated'],
      },
    },
  ],
}

const enabledMember: Where = {
  and: [
    {
      enabled: {
        equals: true,
      },
    },
    {
      visibility: {
        not_equals: 'admin',
      },
    },
  ],
}

export const readVisibleModules: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (hasRole(user, ['member', 'agent'])) return enabledMember
  if (user) return enabledAuthenticated

  return false
}

export const manageModules: Access = ({ req: { user } }) => canEditContent(user)

export const deleteModules: Access = ({ req: { user } }) => isAdmin(user)
