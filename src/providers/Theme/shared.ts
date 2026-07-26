import type { Theme } from './themeRegistry'
import { themeForColorScheme } from './themeRegistry'

export {
  defaultTheme,
  normalizeTheme,
  themeAutoPreference,
  themeLocalStorageKey,
} from './themeRegistry'

export const getImplicitPreference = (): Theme | null => {
  const mediaQuery = '(prefers-color-scheme: dark)'
  const mql = window.matchMedia(mediaQuery)
  const hasImplicitPreference = typeof mql.matches === 'boolean'

  if (hasImplicitPreference) {
    return themeForColorScheme(mql.matches)
  }

  return null
}
