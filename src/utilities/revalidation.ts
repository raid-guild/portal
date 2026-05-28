import type { PayloadRequest } from 'payload'

export const shouldSkipRevalidation = (req: PayloadRequest): boolean => {
  return req.context.disableRevalidate === true
}
