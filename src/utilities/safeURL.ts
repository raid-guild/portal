const DEFAULT_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

type SafeURLOptions = {
  allowRelative?: boolean
  protocols?: string[]
}

export const toSafeURL = (
  value: string | null | undefined,
  { allowRelative = true, protocols = DEFAULT_PROTOCOLS }: SafeURLOptions = {},
): string | null => {
  const trimmed = value?.trim()

  if (!trimmed) return null

  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('#'))) {
    return trimmed.startsWith('//') ? null : trimmed
  }

  try {
    const url = new URL(trimmed)

    return protocols.includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export const validateSafeURL = (value: unknown, options?: SafeURLOptions): true | string => {
  if (!value) return true

  return toSafeURL(String(value), options) ? true : 'Enter a valid URL with an allowed protocol.'
}
