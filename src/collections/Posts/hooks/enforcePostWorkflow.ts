import type { CollectionBeforeChangeHook } from 'payload'

import { canEditContent } from '@/access/roles'

export const enforcePostWorkflow: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (!req.user) return data
  if (canEditContent(req.user)) return data

  const nextData = {
    ...data,
  }

  if (operation === 'create') {
    nextData._status = 'draft'
  }

  nextData.authors = [req.user.id]
  nextData.publishedAt = undefined

  if (nextData._status === 'published') {
    throw new Error('Only editors and admins can publish posts.')
  }

  return nextData
}
