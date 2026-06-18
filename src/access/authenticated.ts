import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'
import { hasVerifiedAccount } from './roles'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return hasVerifiedAccount(user)
}
