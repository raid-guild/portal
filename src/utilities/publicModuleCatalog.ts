import type { Module } from '../payload-types'

const origin = 'https://portal.raidguild.org'

// Do not use collection serialization here: launch configuration, relationships,
// role requirements, and author/user records must never enter this public DTO.
export function publicModuleCard(module: Module) {
  if (!module.enabled || module.visibility !== 'public' || !module.slug) return null
  const absolute = (value?: string | null) => {
    if (!value) return null
    try {
      const url = new URL(value, origin)
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
    } catch { return null }
  }
  const thumbnail = module.thumbnail && typeof module.thumbnail === 'object' ? module.thumbnail : null
  const detailURL = `${origin}/modules/${encodeURIComponent(module.slug)}`
  return {
    id: module.slug,
    title: module.name,
    description: module.summary,
    category: module.category,
    image: absolute(thumbnail?.sizes?.medium?.url || thumbnail?.url),
    // Signed-launch apps retain Portal's authentication and role checks.
    href: module.authMode === 'signed_launch' ? detailURL : absolute(module.entryRoute) || detailURL,
  }
}
