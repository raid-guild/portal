const DEFAULT_INTERACTIVE_ARTIFACT_ORIGINS = [
  'https://artifacts.raidguild.org',
  'https://portal-artifacts-production.up.railway.app',
]

export const getInteractiveArtifactOrigins = (): string[] => {
  const configured = process.env.INTERACTIVE_ARTIFACT_ORIGINS?.split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin))

  return configured?.length ? configured : DEFAULT_INTERACTIVE_ARTIFACT_ORIGINS
}

export const toInteractiveArtifactURL = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value.trim())

    if (url.protocol !== 'https:' || url.username || url.password) return null
    if (!getInteractiveArtifactOrigins().includes(url.origin)) return null

    return url.toString()
  } catch {
    return null
  }
}

export const validateInteractiveArtifactURL = (value: unknown): true | string =>
  toInteractiveArtifactURL(value)
    ? true
    : `Enter an HTTPS artifact URL from: ${getInteractiveArtifactOrigins().join(', ')}`

const normalizeOrigin = (value: string): string | null => {
  try {
    const url = new URL(value.trim())

    return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash
      ? url.origin
      : null
  } catch {
    return null
  }
}
