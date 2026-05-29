import type { Access } from 'payload'

import { canEditContent, isAdmin } from './roles'

export const manageNotifications: Access = ({ req: { user } }) => canEditContent(user)

export const readOwnNotificationsOrEditor: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    recipient: {
      equals: user.id,
    },
  }
}

export const updateOwnNotificationsOrEditor: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    recipient: {
      equals: user.id,
    },
  }
}

export const deleteNotifications: Access = ({ req: { user } }) => isAdmin(user)

export const readOwnNotificationPreferencesOrEditor: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    user: {
      equals: user.id,
    },
  }
}

export const createOwnNotificationPreferencesOrEditor: Access = ({ req: { user } }) =>
  Boolean(user?.id)

export const updateOwnNotificationPreferencesOrEditor: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true
  if (!user?.id) return false

  return {
    user: {
      equals: user.id,
    },
  }
}
