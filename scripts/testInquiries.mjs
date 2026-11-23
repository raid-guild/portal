import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
const require = createRequire(import.meta.url)
// Payload already owns the TypeScript runner used by its CLI.
const loader = require.resolve('tsx', { paths: [require.resolve('payload')] })
const result = spawnSync(
  process.execPath,
  ['--import', loader, '--test', 'tests/inquiryAbuse.test.ts', 'tests/inquiryIntake.test.ts'],
  { stdio: 'inherit', env: process.env },
)
process.exit(result.status ?? 1)
