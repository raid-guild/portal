import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { PortalDashboard } from '../_components/PortalShell'
import { VerifyAccountNotice } from '../_components/VerifyAccountNotice'
import { hasVerifiedAccount } from '@/access/roles'
import { getAuthenticatedDashboardData } from './dashboardData'
import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/join')

  if (!hasVerifiedAccount(user)) {
    return (
      <VerifyAccountNotice description="Verify your email to unlock the authenticated dashboard, weekly brief, points, modules, and member activity." />
    )
  }

  const dashboardData = await getAuthenticatedDashboardData(user)

  return (
    <PortalDashboard
      activeProfiles={dashboardData.activeProfiles}
      dashboardStats={dashboardData.dashboardStats}
      dailyBrief={dashboardData.dailyBrief}
      dailyEngagementSummary={dashboardData.dailyEngagementSummary}
      featuredModules={dashboardData.featuredModules}
      pointEvents={dashboardData.pointSummary.events}
      pointsTotal={dashboardData.pointSummary.total}
      profile={dashboardData.profile}
      recentPosts={dashboardData.recentPosts}
      recentWikiPages={dashboardData.recentWikiPages}
      spotlights={dashboardData.spotlights}
      upcomingEvents={dashboardData.upcomingEvents}
      weekEvents={dashboardData.weekEvents}
      user={user}
    />
  )
}

export const metadata: Metadata = {
  title: 'Dashboard',
}
