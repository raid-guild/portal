import type { Access } from 'payload'

import { canEditContent, isAdmin } from './roles'

export const createInquiries: Access = () => true

export const readInquiries: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    submitterUser: {
      equals: user.id,
    },
  }
}

export const updateInquiries: Access = ({ req: { user } }) => canEditContent(user)

export const deleteInquiries: Access = ({ req: { user } }) => isAdmin(user)
