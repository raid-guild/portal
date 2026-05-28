import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { shouldSkipRevalidation } from '@/utilities/revalidation'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req }) => {
  const { payload } = req

  if (shouldSkipRevalidation(req)) {
    return doc
  }

  payload.logger.info(`Revalidating footer`)

  revalidateTag('global_footer', 'max')

  return doc
}
