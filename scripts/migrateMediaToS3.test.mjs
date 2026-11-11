import assert from 'node:assert/strict'
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { migrate } from './migrateMediaToS3.mjs'

function fakeS3(initial = new Map()) {
  const objects = new Map(initial)
  const writes = []
  return {
    objects,
    writes,
    async send(command) {
      const { Key } = command.input
      if (command instanceof HeadObjectCommand) {
        const existing = objects.get(Key)
        if (!existing) return Promise.reject({ name: 'NotFound', $metadata: { httpStatusCode: 404 } })
        return { ContentLength: existing.body.length, ContentType: existing.type }
      }
      if (command instanceof GetObjectCommand) return { Body: Readable.from(objects.get(Key).body) }
      if (command instanceof PutObjectCommand) {
        assert.equal(command.input.IfNoneMatch, '*')
        const chunks = []
        for await (const chunk of command.input.Body) chunks.push(chunk)
        objects.set(Key, { body: Buffer.concat(chunks), type: command.input.ContentType })
        writes.push(Key)
        return {}
      }
      throw new Error('Unexpected S3 command')
    },
  }
}

test('copies only referenced originals and sizes under portal/media, with safe resume', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-media-test-'))
  try {
    await writeFile(path.join(dir, 'main.png'), 'original')
    await writeFile(path.join(dir, 'main-300.png'), 'thumbnail')
    await writeFile(path.join(dir, 'orphan.png'), 'keep')
    const manifest = { docs: [{ id: 1, filename: 'main.png', mimeType: 'image/png', sizes: { thumbnail: { filename: 'main-300.png', mimeType: 'image/png' } } }] }
    const client = fakeS3(new Map([['other-app/private', { body: Buffer.from('secret'), type: 'text/plain' }]]))
    const opts = { apply: false, manifest, mediaDir: dir, client, bucket: 'shared' }
    const dry = await migrate(opts)
    assert.equal(dry.copy.length, 2)
    assert.deepEqual(dry.orphans, ['orphan.png'])
    assert.deepEqual(client.writes, [])
    await migrate({ ...opts, apply: true })
    assert.deepEqual(client.writes.sort(), ['portal/media/main-300.png', 'portal/media/main.png'])
    assert.equal(client.objects.get('other-app/private').body.toString(), 'secret')
    const repeat = await migrate({ ...opts, apply: true })
    assert.equal(repeat.existing.length, 2)
    assert.equal(client.writes.length, 2)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('refuses a different existing object or missing referenced file before writing', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-media-test-'))
  try {
    await writeFile(path.join(dir, 'main.png'), 'original')
    const manifest = { docs: [{ id: 1, filename: 'main.png', mimeType: 'image/png', sizes: { thumbnail: { filename: 'missing.png', mimeType: 'image/png' } } }] }
    const client = fakeS3(new Map([['portal/media/main.png', { body: Buffer.from('collision'), type: 'image/png' }]]))
    const opts = { apply: true, manifest, mediaDir: dir, client, bucket: 'shared' }
    await assert.rejects(migrate(opts), /Copy refused: 1 missing and 1 colliding/)
    assert.equal(client.writes.length, 0)
    await assert.rejects(migrate({ ...opts, manifest: { docs: [{ id: 1, filename: '../outside' }] } }), /Unsafe filename/)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('retries SlowDown with a fresh file stream after the first stream was consumed', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-media-test-'))
  try {
    await writeFile(path.join(dir, 'retry.png'), 'complete-original')
    const manifest = { docs: [{ id: 1, filename: 'retry.png', mimeType: 'image/png' }] }
    const base = fakeS3()
    let attempts = 0
    const waits = []
    const client = {
      async send(command) {
        if (command instanceof PutObjectCommand) {
          attempts++
          if (attempts === 1) {
            for await (const _chunk of command.input.Body) { /* consume the stream */ }
            throw { name: 'SlowDown', $metadata: { httpStatusCode: 503 } }
          }
        }
        return base.send(command)
      },
    }
    const report = await migrate({ apply: true, manifest, mediaDir: dir, client, bucket: 'shared', writeIntervalMs: 0, wait: async (ms) => waits.push(ms), random: () => 0 })
    assert.equal(attempts, 2)
    assert.equal(base.objects.get('portal/media/retry.png').body.toString(), 'complete-original')
    assert.deepEqual(report.uploaded, ['retry.png'])
    assert.deepEqual(waits, [500])
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a lost PUT response is verified byte-for-byte; a different object stops the copy', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-media-test-'))
  try {
    await writeFile(path.join(dir, 'ambiguous.png'), 'expected-bytes')
    const manifest = { docs: [{ id: 1, filename: 'ambiguous.png', mimeType: 'image/png' }] }
    for (const storedBody of ['expected-bytes', 'different-bytes']) {
      const base = fakeS3()
      let attempts = 0
      const client = {
        async send(command) {
          if (command instanceof PutObjectCommand) {
            attempts++
            for await (const _chunk of command.input.Body) { /* consume the stream */ }
            base.objects.set(command.input.Key, { body: Buffer.from(storedBody), type: 'image/png' })
            throw { name: 'SlowDown', $metadata: { httpStatusCode: 503 } }
          }
          return base.send(command)
        },
      }
      const opts = { apply: true, manifest, mediaDir: dir, client, bucket: 'shared', maxAttempts: 1, writeIntervalMs: 0, wait: async () => {}, random: () => 0 }
      if (storedBody === 'expected-bytes') {
        const report = await migrate(opts)
        assert.deepEqual(report.resumed, ['ambiguous.png'])
      } else {
        await assert.rejects(migrate(opts), /S3 key collision during copy/)
      }
      assert.equal(attempts, 1)
      assert.equal(base.objects.get('portal/media/ambiguous.png').body.toString(), storedBody)
    }
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('persistent throttling stops after the configured attempt limit', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'portal-media-test-'))
  try {
    await writeFile(path.join(dir, 'limit.png'), 'bytes')
    const base = fakeS3()
    let attempts = 0
    const waits = []
    const client = {
      async send(command) {
        if (command instanceof PutObjectCommand) {
          attempts++
          for await (const _chunk of command.input.Body) { /* consume the stream */ }
          throw { name: 'SlowDown', $metadata: { httpStatusCode: 503 } }
        }
        return base.send(command)
      },
    }
    await assert.rejects(migrate({
      apply: true,
      manifest: { docs: [{ id: 1, filename: 'limit.png', mimeType: 'image/png' }] },
      mediaDir: dir,
      client,
      bucket: 'shared',
      maxAttempts: 3,
      writeIntervalMs: 0,
      wait: async (ms) => waits.push(ms),
      random: () => 0,
    }), (error) => error.name === 'SlowDown')
    assert.equal(attempts, 3)
    assert.deepEqual(waits, [500, 1000])
    assert.equal(base.objects.size, 0)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
