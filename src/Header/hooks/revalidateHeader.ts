import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { shouldSkipRevalidation } from '@/utilities/revalidation'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req }) => {
  const { payload } = req

  if (shouldSkipRevalidation(req)) {
    return doc
  }

  payload.logger.info(`Revalidating header`)

  revalidateTag('global_header', 'max')

  return doc
}
