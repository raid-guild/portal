import { readFile } from 'node:fs/promises'
import path from 'node:path'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importLegacyMemberProfiles } from '@/utilities/importLegacyMemberProfiles'

const defaultCSVPath =
  '/home/dekanjbrown/Projects/raidguild/memory-archive/external/member-profiles.csv'

const getArgValue = (name: string) => {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined

  return process.argv[index + 1]
}

const main = async () => {
  const positionalArgs = process.argv.slice(2)
  const csvArg = positionalArgs.find((arg) => arg.startsWith('csv='))
  const csvPath =
    getArgValue('--csv') ||
    csvArg?.replace(/^csv=/, '') ||
    positionalArgs.find((arg) => arg.endsWith('.csv')) ||
    defaultCSVPath
  const dryRun = process.argv.includes('--dry-run') || positionalArgs.includes('dry-run')
  const payload = await getPayload({ config: configPromise })
  const csv = await readFile(path.resolve(csvPath), 'utf8')
  const result = await importLegacyMemberProfiles({ csv, dryRun, payload })

  console.log(JSON.stringify(result, null, 2))
}

await main().catch((error) => {
  console.error(error)
  process.exit(1)
})
