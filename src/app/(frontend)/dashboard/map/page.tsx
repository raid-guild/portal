import type { Metadata } from 'next'
import { Press_Start_2P } from 'next/font/google'
import { redirect } from 'next/navigation'
import React from 'react'

import { VerifyAccountNotice } from '../../_components/VerifyAccountNotice'
import { hasVerifiedAccount } from '@/access/roles'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { getMapDashboardData } from './mapData'
import { MapDashboardClient } from './MapDashboardClient'

export const dynamic = 'force-dynamic'

const mapPixelFont = Press_Start_2P({
  subsets: ['latin'],
  variable: '--font-map-pixel',
  weight: '400',
})

export default async function DashboardMapPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to unlock the map dashboard, weekly brief, points, modules, and member activity." />
    )
  }

  const mapData = await getMapDashboardData(user)

  return <MapDashboardClient data={mapData} fontClassName={mapPixelFont.variable} user={user} />
}

export const metadata: Metadata = {
  title: 'Map Dashboard',
}
