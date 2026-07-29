import { defineConfig, globalIgnores } from 'eslint/config'
import next from 'eslint-config-next'

// Matches the scope of the previous `.eslintrc.cjs` (`extends: 'next'`).
// `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
// pull in rules this repo has never enforced; adopting them is a separate,
// deliberate decision, not a side effect of fixing the broken lint runner.
const eslintConfig = defineConfig([
  ...next,
  globalIgnores([
    '.next/**',
    '.tmp/**',
    'build/**',
    'dist/**',
    'out/**',
    'next-env.d.ts',
    'playwright-report/**',
    'test-results/**',
    'playwright.config.ts',
  ]),
])

export default eslintConfig
