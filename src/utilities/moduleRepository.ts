/** A code module always points directly to an HTTPS repository without credentials. */
export const codeRepositoryURL = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

export const repositoryLabel = (value: unknown): string | null => {
  const href = codeRepositoryURL(value)
  if (!href) return null
  const url = new URL(href)
  return `${url.hostname}${url.pathname.replace(/\/$/, '')}`
}
