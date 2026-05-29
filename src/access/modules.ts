import type { Access, Where } from 'payload'

import { canEditContent, hasRole, isAdmin } from './roles'

const enabledNonAdmin: Where = {
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
  if (hasRole(user, ['contributor', 'member', 'agent'])) return enabledNonAdmin

  return false
}

export const manageModules: Access = ({ req: { user } }) => canEditContent(user)

export const deleteModules: Access = ({ req: { user } }) => isAdmin(user)
