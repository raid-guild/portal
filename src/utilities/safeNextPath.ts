export const getSafeNextPath = (value?: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return undefined
  }

  return value
}
