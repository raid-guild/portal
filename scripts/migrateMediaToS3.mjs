#!/usr/bin/env node
/**
 * Copy the old Portal media volume into this app's private namespace in a
 * shared S3 bucket. Dry-run by default; --apply performs only additive writes.
 *
 * Usage: node scripts/migrateMediaToS3.mjs --manifest media.json --media-dir /app/public/media [--apply]
 */
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const prefix = 'portal/media'

function options(argv) {
  const result = { apply: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apply') result.apply = true
    else if (arg === '--manifest' || arg === '--media-dir') result[arg.slice(2)] = argv[++i]
    else if (arg === '--write-interval-ms') result.writeIntervalMs = Number(argv[++i])
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if (!result.manifest || !result['media-dir']) throw new Error('Provide --manifest and --media-dir')
  result.writeIntervalMs ??= Number(process.env.MEDIA_S3_WRITE_INTERVAL_MS ?? 200)
  if (!Number.isInteger(result.writeIntervalMs) || result.writeIntervalMs < 100 || result.writeIntervalMs > 5000) {
    throw new Error('--write-interval-ms must be an integer between 100 and 5000')
  }
  return result
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const isSlowDown = (error) => {
  const status = error?.$metadata?.httpStatusCode
  return status === 429 || status === 503 || error?.$retryable?.throttling === true ||
    [error?.name, error?.Code].some((name) =>
      /^(SlowDown|Throttling|ThrottlingException|TooManyRequests|RequestLimitExceeded|ServiceUnavailable)$/.test(name || ''))
}
const isPreconditionFailed = (error) => error?.$metadata?.httpStatusCode === 412 || error?.name === 'PreconditionFailed'

function requests(client, { wait = pause, random = Math.random, writeIntervalMs = 200, maxAttempts = 8 } = {}) {
  let lastWriteAt = 0
  const retry = async (operation) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try { return await operation() }
      catch (error) {
        if (!isSlowDown(error) || attempt === maxAttempts - 1) throw error
        const backoffMs = Math.min(10000, 500 * 2 ** attempt) + Math.floor(random() * 250)
        await wait(backoffMs)
      }
    }
  }
  const paceWrite = async () => {
    const delayMs = lastWriteAt + writeIntervalMs - Date.now()
    if (delayMs > 0) await wait(delayMs)
    lastWriteAt = Date.now()
  }
  return { retry, paceWrite, send: (command) => client.send(command) }
}

function safeFilename(value) {
  return typeof value === 'string' && value.length > 0 && value === path.basename(value) &&
    value !== '.' && value !== '..' && !value.includes('\\') && !value.includes('\0') &&
    !/[\x00-\x1f]/.test(value)
}

export function manifestFiles(manifest) {
  if (!Array.isArray(manifest?.docs)) throw new Error('Manifest must contain a docs array')
  const files = new Map()
  const add = (filename, mimeType, docId) => {
    if (!filename) return
    if (!safeFilename(filename)) throw new Error(`Unsafe filename in media ${docId}`)
    const previous = files.get(filename)
    if (previous && previous.mimeType !== mimeType) throw new Error(`Conflicting MIME types for ${filename}`)
    files.set(filename, { filename, mimeType: mimeType || 'application/octet-stream' })
  }
  for (const doc of manifest.docs) {
    add(doc.filename, doc.mimeType, doc.id)
    for (const size of Object.values(doc.sizes || {})) add(size?.filename, size?.mimeType, doc.id)
  }
  return files
}

async function inventory(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = new Set()
  for (const entry of entries) {
    // Payload media filenames are basenames. Leave subdirectories and symlinks
    // untouched, and report them as orphans for manual inspection.
    files.add(entry.name + (entry.isDirectory() ? '/' : entry.isSymbolicLink() ? '@' : ''))
  }
  return files
}

async function sha256(input) {
  const hash = createHash('sha256')
  for await (const chunk of input) hash.update(chunk)
  return hash.digest('hex')
}

async function remoteObject(s3, bucket, key) {
  try {
    return await s3.retry(() => s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })))
  } catch (error) {
    if (error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404) return null
    throw error
  }
}

async function sameBytes(s3, bucket, key, localHash) {
  return s3.retry(async () => {
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    if (!object.Body) throw new Error(`Empty S3 response for ${key}`)
    return (await sha256(object.Body)) === localHash
  })
}

export async function migrate({ apply, manifest, mediaDir, client, bucket, writeIntervalMs = 200, wait, random, maxAttempts, onProgress }) {
  const root = await realpath(mediaDir)
  const s3 = requests(client, { writeIntervalMs, wait, random, maxAttempts })
  const expected = manifestFiles(manifest)
  const present = await inventory(root)
  const report = { expected: expected.size, missing: [], orphans: [], existing: [], copy: [], collisions: [] }
  for (const name of present) if (!expected.has(name)) report.orphans.push(name)

  // Inspect all referenced files before any writes. A second invocation skips
  // byte-identical objects and never overwrites a collision.
  for (const { filename, mimeType } of expected.values()) {
    const file = path.join(root, filename)
    let stats
    try {
      stats = await stat(file)
      if (!stats.isFile() || (await realpath(file)) !== file) throw new Error('not a regular file')
    } catch {
      report.missing.push(filename)
      continue
    }
    const key = `${prefix}/${filename}`
    const remote = await remoteObject(s3, bucket, key)
    if (!remote) {
      report.copy.push({ filename, key, mimeType, bytes: stats.size })
      continue
    }
    const localHash = await sha256(createReadStream(file))
    if (remote.ContentLength === stats.size && remote.ContentType === mimeType && await sameBytes(s3, bucket, key, localHash)) report.existing.push(filename)
    else report.collisions.push(filename)
  }

  report.missing.sort()
  report.orphans.sort()
  report.collisions.sort()
  if (apply && (report.missing.length || report.collisions.length)) {
    throw new Error(`Copy refused: ${report.missing.length} missing and ${report.collisions.length} colliding files`)
  }
  if (apply) {
    report.uploaded = []
    report.resumed = []
    for (const item of report.copy) {
      const file = path.join(root, item.filename)
      const verifyExisting = async (remote) => {
        const localHash = await sha256(createReadStream(file))
        if (remote.ContentLength !== item.bytes || remote.ContentType !== item.mimeType ||
          !await sameBytes(s3, bucket, item.key, localHash)) {
          throw new Error(`S3 key collision during copy: ${item.key}`)
        }
      }
      let completed = false
      for (let attempt = 0; attempt < (maxAttempts ?? 8); attempt++) {
        // A previous PUT may have succeeded even if its response was lost.
        // Verify byte-for-byte before resuming; never overwrite another value.
        const remote = await remoteObject(s3, bucket, item.key)
        if (remote) {
          await verifyExisting(remote)
          report.resumed.push(item.filename)
          completed = true
          break
        }
        await s3.paceWrite()
        const stream = createReadStream(file) // A throttled PUT may have consumed the prior stream.
        try {
          await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: item.key,
            Body: stream,
            ContentLength: item.bytes,
            ContentType: item.mimeType,
            IfNoneMatch: '*',
          }))
          report.uploaded.push(item.filename)
          completed = true
          break
        } catch (error) {
          if (!isSlowDown(error) && !isPreconditionFailed(error)) throw error
          if (attempt === (maxAttempts ?? 8) - 1) {
            // Even a final failed response may follow a successful write.
            const existing = await remoteObject(s3, bucket, item.key)
            if (!existing) throw error
            await verifyExisting(existing)
            report.resumed.push(item.filename)
            completed = true
            break
          }
          if (isSlowDown(error)) {
            const backoffMs = Math.min(10000, 500 * 2 ** attempt) + Math.floor((random ?? Math.random)() * 250)
            await (wait ?? pause)(backoffMs)
          }
          // A 412 can mean a concurrent writer or a successful prior PUT.
          // The next iteration's HEAD + hash decides which case it is.
        } finally {
          stream.destroy()
        }
      }
      if (!completed) throw new Error(`Failed to copy ${item.key}`)
      if ((report.uploaded.length + report.resumed.length) % 50 === 0) {
        onProgress?.({ done: report.uploaded.length + report.resumed.length, total: report.copy.length })
      }
    }
  }
  return report
}

async function main() {
  const args = options(process.argv.slice(2))
  const bucket = process.env.MEDIA_S3_BUCKET
  const endpoint = process.env.MEDIA_S3_ENDPOINT
  const region = process.env.MEDIA_S3_REGION
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY
  if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) throw new Error('Set MEDIA_S3_BUCKET, MEDIA_S3_ENDPOINT, MEDIA_S3_REGION, MEDIA_S3_ACCESS_KEY_ID, MEDIA_S3_SECRET_ACCESS_KEY')
  const client = new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true' })
  const manifest = JSON.parse(await readFile(args.manifest, 'utf8'))
  const report = await migrate({
    apply: args.apply,
    manifest,
    mediaDir: args['media-dir'],
    client,
    bucket,
    writeIntervalMs: args.writeIntervalMs,
    onProgress: ({ done, total }) => console.error(`Media copy: ${done}/${total} checked or uploaded`),
  })
  console.log(JSON.stringify({ mode: args.apply ? 'apply' : 'dry-run', ...report }, null, 2))
  if (report.missing.length || report.collisions.length) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
