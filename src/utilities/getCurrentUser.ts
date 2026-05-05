import { cookies } from 'next/headers'

import type { User } from '@/payload-types'
import { getServerSideURL } from './getURL'

export const getCurrentUser = async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) return null

  try {
    const meUserReq = await fetch(`${getServerSideURL()}/api/users/me`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
      cache: 'no-store',
    })

    if (!meUserReq.ok) return null

    const { user }: { user?: User | null } = await meUserReq.json()

    return user || null
  } catch {
    return null
  }
}
