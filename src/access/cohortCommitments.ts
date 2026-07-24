import type { Access } from 'payload'

import { getProfileIDsForUser } from './projectStewards'
import { canEditContent } from './roles'

export const createCohortCommitment: Access = ({ req: { user } }) => Boolean(user?.id)

export const readOwnCohortCommitments: Access = async ({ req }) => {
  if (canEditContent(req.user)) return true

  const profileIDs = await getProfileIDsForUser(req)
  if (!profileIDs.length) return false

  return {
    profile: {
      in: profileIDs,
    },
  }
}

export const updateOwnCohortCommitments = readOwnCohortCommitments
