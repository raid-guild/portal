'use client'

import { useEffect, useState } from 'react'

export const readThemeTokens = <T extends Record<string, string>>(tokenNames: {
  [K in keyof T]: string
}): T => {
  const styles = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    Object.entries(tokenNames).map(([key, token]) => [key, styles.getPropertyValue(token).trim()]),
  ) as T
}

export const useThemeTokens = <T extends Record<string, string>>(
  tokenNames: { [K in keyof T]: string },
  fallback: T,
): T => {
  const [tokens, setTokens] = useState(fallback)

  useEffect(() => {
    const update = () => setTokens(readThemeTokens(tokenNames))
    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })
    return () => observer.disconnect()
  }, [tokenNames])

  return tokens
}
