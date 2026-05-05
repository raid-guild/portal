import type { Access, FieldAccess, Where } from 'payload'

import { isAdmin } from './roles'

export const publicProfilesOrOwner: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true

  const publicProfileFilter: Where = {
    and: [
      {
        status: {
          equals: 'active',
        },
      },
      {
        visibility: {
          equals: 'public',
        },
      },
    ],
  }

  if (!user) return publicProfileFilter

  const ownOrPublicProfileFilter: Where = {
    or: [
      publicProfileFilter,
      {
        user: {
          equals: user.id,
        },
      },
    ],
  }

  return ownOrPublicProfileFilter
}

export const ownProfileOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true

  return {
    user: {
      equals: user.id,
    },
  }
}

export const privateProfileField: FieldAccess = ({ req: { user }, siblingData }) => {
  if (!user) return false
  if (isAdmin(user)) return true

  const profileUser = siblingData?.user
  const profileUserID = typeof profileUser === 'object' ? profileUser?.id : profileUser

  return String(profileUserID) === String(user.id)
}
