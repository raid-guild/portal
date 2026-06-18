import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { cleanupSpamSignups } from '@/utilities/spamCleanup'

type Args = {
  apply: boolean
  deleteUsers: boolean
  help: boolean
  pageURL?: string
  since?: string
}

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  console.log(`Inspect or clean spam signups and feedback submissions.

Dry-run by default:
  corepack pnpm payload run scripts/cleanupSpamSignups.ts

Apply feedback spam marking:
  corepack pnpm payload run scripts/cleanupSpamSignups.ts -- --apply

Also delete matching unverified users:
  corepack pnpm payload run scripts/cleanupSpamSignups.ts -- --apply --delete-users

Options:
  --since 2026-06-15T00:00:00.000Z
  --page-url /join`)
  process.exit(0)
}

if (args.since && Number.isNaN(Date.parse(args.since))) {
  console.error('--since must be an ISO date.')
  process.exit(1)
}

const payload = await getPayload({ config: configPromise })
const result = await cleanupSpamSignups(payload, {
  deleteUsers: args.deleteUsers,
  dryRun: !args.apply,
  pageURL: args.pageURL,
  since: args.since,
})

console.log(JSON.stringify(result, null, 2))

function parseArgs(argv: string[]): Args {
  const args: Args = {
    apply: process.env.SPAM_CLEANUP_APPLY === 'true',
    deleteUsers: process.env.SPAM_CLEANUP_DELETE_USERS === 'true',
    help: false,
    pageURL: process.env.SPAM_CLEANUP_PAGE_URL,
    since: process.env.SPAM_CLEANUP_SINCE,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--apply') {
      args.apply = true
      continue
    }

    if (arg === '--delete-users') {
      args.deleteUsers = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      args.help = true
      continue
    }

    if (arg === '--page-url') {
      args.pageURL = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--since') {
      args.since = argv[index + 1]
      index += 1
    }
  }

  return args
}
