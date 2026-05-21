import type { Access, AccessArgs, FieldAccess } from 'payload'

const AUTH_ROLES = ['admin', 'editor', 'contributor', 'member', 'agent', 'unverified'] as const

export type AuthRole = (typeof AUTH_ROLES)[number]

type UserWithRoles = {
  id?: number | string
  roles?: AuthRole[] | null
}

export const authRoleOptions = AUTH_ROLES.map((role) => ({
  label: role.charAt(0).toUpperCase() + role.slice(1),
  value: role,
}))

export const getUserRoles = (user: UserWithRoles | null | undefined): AuthRole[] => {
  if (!user) return []

  if (Array.isArray(user.roles)) {
    return user.roles
  }

  // Existing installations can have users created before auth roles existed.
  // Treat only truly legacy users as admins until their roles are explicitly saved.
  if (user.roles == null) return ['admin']

  return []
}

export const hasRole = (
  user: UserWithRoles | null | undefined,
  roles: AuthRole | AuthRole[],
): boolean => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  const userRoles = getUserRoles(user)

  return allowedRoles.some((role) => userRoles.includes(role))
}

export const isAdmin = (user: UserWithRoles | null | undefined): boolean => hasRole(user, 'admin')

export const canAccessAdmin = (user: UserWithRoles | null | undefined): boolean =>
  hasRole(user, ['admin', 'editor', 'contributor', 'member', 'agent'])

export const canEditContent = (user: UserWithRoles | null | undefined): boolean =>
  hasRole(user, ['admin', 'editor'])

export const hideFromNonEditors = ({ user }: { user: UserWithRoles | null | undefined }) =>
  !canEditContent(user)

export const canContributeContent = (user: UserWithRoles | null | undefined): boolean =>
  hasRole(user, ['admin', 'editor', 'contributor', 'agent'])

export const admins: Access = ({ req: { user } }) => isAdmin(user)

export const contentContributors: Access = ({ req: { user } }) => canContributeContent(user)

export const contentEditors: Access = ({ req: { user } }) => canEditContent(user)

export const adminsFieldAccess: FieldAccess = ({ req: { user } }) => isAdmin(user)

export const ownUserOrAdmin: Access = ({ req: { user } }: AccessArgs) => {
  if (!user) return false
  if (isAdmin(user)) return true
  if (!user.id) return false

  return {
    id: {
      equals: user.id,
    },
  }
}
