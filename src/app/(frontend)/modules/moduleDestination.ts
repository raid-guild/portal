import type { Module } from '@/payload-types'

export type ModuleDestination = 'tools' | 'artifacts' | 'arcade'

// The artifact service is the current registry boundary. Use parsed URLs so a
// matching word in a description or unrelated domain cannot reclassify an app.
export function getModuleDestination(module: Module): ModuleDestination {
  if (module.category === 'games') return 'arcade'
  try {
    const entry = new URL(module.entryRoute || '')
    if (entry.hostname === 'portal-artifacts-production.up.railway.app') return 'artifacts'
  } catch {
    /* Internal routes do not have an external hostname. */
  }
  try {
    const repo = new URL(module.repositoryURL || '')
    if (
      repo.hostname === 'github.com' &&
      repo.pathname.replace(/\/$/, '') === '/raid-guild/portal-artifacts'
    )
      return 'artifacts'
  } catch {
    /* A repository is optional. */
  }
  return 'tools'
}
