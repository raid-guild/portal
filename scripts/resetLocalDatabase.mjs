#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
const args = new Set(process.argv.slice(2))

if (args.has('--help') || args.has('-h')) {
  console.log(`Reset the local PostgreSQL database from DATABASE_URI.

Usage:
  corepack pnpm db:reset:local
  corepack pnpm db:reset:local -- --yes

The script refuses non-local database hosts. Run migrations afterward with:
  corepack pnpm payload migrate`)
  process.exit(0)
}

const env = {
  ...parseEnvFile('.env'),
  ...process.env,
}

const databaseURI = env.DATABASE_URI

if (!databaseURI) {
  exitWithError('DATABASE_URI is not set. Add it to .env or export it before running this script.')
}

let targetURL

try {
  targetURL = new URL(databaseURI)
} catch {
  exitWithError('DATABASE_URI is not a valid URL.')
}

if (!['postgres:', 'postgresql:'].includes(targetURL.protocol)) {
  exitWithError('DATABASE_URI must use a postgres:// or postgresql:// URL.')
}

if (!localHosts.has(targetURL.hostname)) {
  exitWithError(`Refusing to reset non-local database host: ${targetURL.hostname}`)
}

const databaseName = decodeURIComponent(targetURL.pathname.replace(/^\//, ''))

if (!databaseName) {
  exitWithError('DATABASE_URI must include a database name.')
}

if (['postgres', 'template0', 'template1'].includes(databaseName)) {
  exitWithError(`Refusing to reset protected PostgreSQL database: ${databaseName}`)
}

if (!args.has('--yes')) {
  await confirmReset(targetURL, databaseName)
}

const maintenanceURL = new URL(targetURL)
maintenanceURL.pathname = targetURL.pathname === '/postgres' ? '/template1' : '/postgres'
maintenanceURL.search = ''

const sql = `
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = ${quoteLiteral(databaseName)}
  AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)};
CREATE DATABASE ${quoteIdentifier(databaseName)};
`

const result = spawnSync(
  'psql',
  ['--set', 'ON_ERROR_STOP=1', '--dbname', maintenanceURL.toString()],
  {
    env,
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  },
)

if (result.error) {
  if (result.error.code === 'ENOENT') {
    exitWithError('psql was not found. Install PostgreSQL client tools and try again.')
  }

  exitWithError(result.error.message)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log(`Reset local database: ${databaseName}`)

function parseEnvFile(path) {
  if (!existsSync(path)) return {}

  const parsed = {}
  const contents = readFileSync(path, 'utf8')

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    parsed[key] = value
  }

  return parsed
}

async function confirmReset(url, database) {
  if (!input.isTTY) {
    exitWithError('Refusing to reset without an interactive prompt. Pass --yes to confirm.')
  }

  const rl = readline.createInterface({ input, output })
  const host = `${url.hostname}:${url.port || '5432'}`
  const answer = await rl.question(
    `This will permanently drop and recreate ${database} on ${host}. Type reset to continue: `,
  )
  rl.close()

  if (answer.trim() !== 'reset') {
    exitWithError('Database reset cancelled.')
  }
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`
}

function quoteLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function exitWithError(message) {
  console.error(message)
  process.exit(1)
}
