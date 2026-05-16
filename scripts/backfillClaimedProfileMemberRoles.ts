import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'

type UserRole = Exclude<NonNullable<User['roles']>[number], undefined>

const withMemberRole = (roles: User['roles']): UserRole[] => {
  const existingRoles: UserRole[] = Array.isArray(roles) ? roles.filter(Boolean) : ['contributor']

  return Array.from(new Set([...existingRoles, 'member']))
}

const main = async () => {
  const payload = await getPayload({ config: configPromise })
  let page = 1
  let matched = 0
  let updated = 0

  while (true) {
    const profiles = await payload.find({
      collection: 'profiles',
      depth: 1,
      limit: 100,
      overrideAccess: true,
      page,
      where: {
        and: [
          {
            claimStatus: {
              equals: 'claimed',
            },
          },
          {
            user: {
              exists: true,
            },
          },
        ],
      },
    })

    for (const profile of profiles.docs) {
      const user = typeof profile.user === 'object' ? profile.user : null
      if (!user?.id) continue

      matched += 1
      const roles = withMemberRole(user.roles)
      if (Array.isArray(user.roles) && user.roles.includes('member')) continue

      await payload.update({
        id: user.id,
        collection: 'users',
        data: {
          roles,
        },
        overrideAccess: true,
      })
      updated += 1
    }

    if (!profiles.hasNextPage) break
    page += 1
  }

  console.log(JSON.stringify({ matched, updated }, null, 2))
}

await main().catch((error) => {
  console.error(error)
  process.exit(1)
})
