import type { Access, Where } from 'payload'

import { canEditContent, hasRole, isAdmin } from './roles'

const publicOnly: Where = {
  visibility: {
    equals: 'public',
  },
}

const publicOrMember: Where = {
  visibility: {
    in: ['public', 'member'],
  },
}

export const readVisibleBadges: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (hasRole(user, ['member', 'agent'])) return publicOrMember

  return publicOnly
}

export const manageBadges: Access = ({ req: { user } }) => canEditContent(user)

export const awardBadges: Access = ({ req: { user } }) =>
  hasRole(user, ['admin', 'editor', 'agent'])

export const deleteBadges: Access = ({ req: { user } }) => isAdmin(user)
