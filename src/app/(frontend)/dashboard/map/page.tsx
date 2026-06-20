import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { VerifyAccountNotice } from '../../_components/VerifyAccountNotice'
import { hasVerifiedAccount } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getMapDashboardData } from './mapData'
import { MapDashboardClient } from './MapDashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardMapPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to unlock the map dashboard, weekly brief, points, modules, and member activity." />
    )
  }

  const mapData = await getMapDashboardData(user)

  return <MapDashboardClient data={mapData} user={user} />
}

export const metadata: Metadata = {
  title: 'Map Dashboard',
}

