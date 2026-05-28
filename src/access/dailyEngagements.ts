import type { Access, Where } from 'payload'

import { canEditContent, hasRole, isAdmin } from './roles'

export const createOwnDailyEngagement: Access = ({ req: { user } }) => {
  if (!user) return false

  return hasRole(user, ['admin', 'editor', 'contributor', 'member', 'agent'])
}

export const readOwnDailyEngagementsOrEditor: Access = ({ req: { user } }) => {
  if (!user) return false
  if (canEditContent(user)) return true

  const ownEngagements: Where = {
    user: {
      equals: user.id,
    },
  }

  return ownEngagements
}

export const updateDailyEngagements: Access = ({ req: { user } }) => canEditContent(user)

export const deleteDailyEngagements: Access = ({ req: { user } }) => isAdmin(user)
