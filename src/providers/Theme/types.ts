import type { Theme } from './themeRegistry'

export type { Theme } from './themeRegistry'

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void // eslint-disable-line no-unused-vars
  theme?: Theme | null
}
