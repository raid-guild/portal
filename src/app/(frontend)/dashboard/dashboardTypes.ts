import type { ActivityItem, Profile } from '@/payload-types'

export type RecentContributor = {
  activity?: Pick<ActivityItem, 'activityType' | 'happenedAt' | 'title'>
  profile: Profile
}

export type RecentContributorMode = 'member-discovery' | 'recent-contributors'
