import type { Access } from 'payload'

import { canEditContent, hasRole, isAdmin } from './roles'

export const createFeedbackSubmissions: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return !hasRole(user, 'unverified')
}

export const readFeedbackSubmissions: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    submittedBy: {
      equals: user.id,
    },
  }
}

export const updateFeedbackSubmissions: Access = ({ req: { user } }) => canEditContent(user)

export const deleteFeedbackSubmissions: Access = ({ req: { user } }) => isAdmin(user)
