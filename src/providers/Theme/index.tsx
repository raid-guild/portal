'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import canUseDOM from '@/utilities/canUseDOM'
import {
  defaultTheme,
  getImplicitPreference,
  normalizeTheme,
  themeAutoPreference,
  themeLocalStorageKey,
} from './shared'

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.setItem(themeLocalStorageKey, themeAutoPreference)
      const implicitPreference = getImplicitPreference() || defaultTheme
      document.documentElement.setAttribute('data-theme', implicitPreference)
      setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    }
  }, [])

  useEffect(() => {
    let themeToSet: Theme = defaultTheme
    const preference = window.localStorage.getItem(themeLocalStorageKey)

    const normalizedPreference = normalizeTheme(preference)
    if (normalizedPreference) {
      themeToSet = normalizedPreference
    } else if (preference === themeAutoPreference) {
      const implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    } else if (preference !== null) {
      window.localStorage.removeItem(themeLocalStorageKey)
    }

    if (normalizedPreference && preference !== normalizedPreference) {
      window.localStorage.setItem(themeLocalStorageKey, normalizedPreference)
    }
    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyImplicitPreference = () => {
      if (window.localStorage.getItem(themeLocalStorageKey) !== themeAutoPreference) return
      const implicitPreference = getImplicitPreference() || defaultTheme
      document.documentElement.setAttribute('data-theme', implicitPreference)
      setThemeState(implicitPreference)
    }

    mediaQuery.addEventListener('change', applyImplicitPreference)
    return () => mediaQuery.removeEventListener('change', applyImplicitPreference)
  }, [])

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
