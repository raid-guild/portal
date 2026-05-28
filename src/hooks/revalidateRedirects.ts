import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { shouldSkipRevalidation } from '@/utilities/revalidation'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req }) => {
  const { payload } = req

  if (shouldSkipRevalidation(req)) {
    return doc
  }

  payload.logger.info(`Revalidating redirects`)

  revalidateTag('redirects', 'max')

  return doc
}
