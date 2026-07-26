export const themeLocalStorageKey = 'payload-theme'
export const themeAutoPreference = 'auto'

export const themeRegistry = [
  { key: 'raidguild-dark', label: 'RaidGuild Dark', prefersColorScheme: 'dark' },
  { key: 'raidguild-light', label: 'RaidGuild Light', prefersColorScheme: 'light' },
  { key: 'raidguild-classic', label: 'RaidGuild Classic', prefersColorScheme: 'dark' },
] as const

export type Theme = (typeof themeRegistry)[number]['key']
export type LegacyTheme = 'dark' | 'light'

export const defaultTheme: Theme = 'raidguild-dark'

export const legacyThemeAliases: Record<LegacyTheme, Theme> = {
  dark: 'raidguild-dark',
  light: 'raidguild-light',
}

export const normalizeTheme = (value: null | string): Theme | null => {
  if (!value) return null
  if (value === 'dark' || value === 'light') return legacyThemeAliases[value]
  return themeRegistry.some((theme) => theme.key === value) ? (value as Theme) : null
}

export const themeIsValid = (value: null | string): value is Theme =>
  value !== null && normalizeTheme(value) === value

export const themeForColorScheme = (darkMode: boolean): Theme =>
  darkMode ? legacyThemeAliases.dark : legacyThemeAliases.light
