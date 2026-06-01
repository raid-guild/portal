import type { Access } from 'payload'

import { canEditContent } from './roles'

export const readPageCopy: Access = ({ req: { user } }) => {
  if (canEditContent(user)) return true

  return {
    status: {
      equals: 'published',
    },
  }
}
