import type { Media, Module } from '@/payload-types'
import { toSafeURL } from '@/utilities/safeURL'

export const statusLabels: Record<NonNullable<Module['status']>, string> = {
  active: 'Active',
  archived: 'Archived',
  experimental: 'Experimental',
  graduated: 'Graduated',
  idea: 'Idea',
  prototype: 'Prototype',
}

export const categoryLabels: Record<NonNullable<Module['category']>, string> = {
  analytics: 'Analytics',
  community: 'Community',
  games: 'Games',
  knowledge: 'Knowledge',
  ops: 'Ops',
  tools: 'Tools',
}

export const primitiveLabels: Record<string, string> = {
  activityItem: 'Activity',
  brief: 'Briefs',
  event: 'Sessions',
  post: 'Posts',
  profile: 'Profiles',
  project: 'Projects',
  thread: 'Threads',
}

export const getModuleAction = (module: Module) => {
  const signedLaunch =
    module.moduleKind === 'external' && module.authMode === 'signed_launch' && module.slug
      ? `/api/modules/${encodeURIComponent(module.slug)}/launch`
      : null
  const entryRoute = toSafeURL(module.entryRoute, { allowRelative: true })
  const href = signedLaunch || entryRoute

  return {
    href,
    label: signedLaunch
      ? 'Launch app'
      : module.moduleKind === 'external'
        ? 'Open app'
        : 'Open module',
    opensNewWindow: Boolean(signedLaunch),
    signedLaunch: Boolean(signedLaunch),
  }
}

export const getModuleImageURL = (thumbnail: Media | null) =>
  thumbnail?.sizes?.medium?.url || thumbnail?.sizes?.square?.url || thumbnail?.url || null

export const relationDocs = <T extends { id: number | string }>(
  items?: (number | T)[] | null,
): T[] => items?.filter((item): item is T => item !== null && typeof item === 'object') || []

export const relationDoc = <T extends { id: number | string }>(
  item?: number | T | null,
): T | null => (item && typeof item === 'object' ? item : null)
