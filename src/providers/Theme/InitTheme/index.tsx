import React from 'react'

import {
  defaultTheme,
  legacyThemeAliases,
  themeAutoPreference,
  themeLocalStorageKey,
  themeRegistry,
} from '../themeRegistry'

const supportedThemes = JSON.stringify(themeRegistry.map(({ key }) => key))
const aliases = JSON.stringify(legacyThemeAliases)

const themeScript = `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? aliases.dark : aliases.light
      }

      return null
    }

    function normalizeTheme(theme) {
      if (Object.prototype.hasOwnProperty.call(aliases, theme)) return aliases[theme]
      return supportedThemes.indexOf(theme) !== -1 ? theme : null
    }

    var aliases = ${JSON.stringify(legacyThemeAliases)}
    var supportedThemes = ${supportedThemes}
    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')
    var normalizedPreference = normalizeTheme(preference)

    if (normalizedPreference) {
      themeToSet = normalizedPreference
      if (preference !== normalizedPreference) {
        window.localStorage.setItem('${themeLocalStorageKey}', normalizedPreference)
      }
    } else if (preference === '${themeAutoPreference}') {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    } else if (preference !== null) {
      window.localStorage.removeItem('${themeLocalStorageKey}')
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
`

export const InitTheme: React.FC = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeScript,
      }}
      id="theme-script"
    />
  )
}
