import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'
import { adminEmail, adminPassword, baseURL } from './env'

const isLoopbackURL = (value: string | undefined) => {
  if (!value) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

// Both ends must be local. A local Portal with a real bucket would otherwise
// write root and foreign-prefix test objects to that bucket.
const isolated = process.env.MEDIA_S3_TEST === 'true' &&
  isLoopbackURL(baseURL) && isLoopbackURL(process.env.MEDIA_S3_ENDPOINT)

test('S3 storage pause denies authenticated writes while media remains readable', async ({ request }) => {
  test.skip(!isolated || process.env.MEDIA_UPLOADS_PAUSED !== 'true', 'Requires a paused isolated S3 server')
  expect((await request.get('/api/media?limit=1')).status()).toBe(200)
  const login = await request.post('/api/users/login', { data: { email: adminEmail, password: adminPassword } })
  expect(login.status()).toBe(200)
  const upload = await request.post('/api/media', {
    multipart: { file: { name: 'blocked.png', mimeType: 'image/png', buffer: Buffer.from('blocked') } },
  })
  expect(upload.status()).toBe(403)
})

test('S3 storage isolates Portal media, serves sizes and ranges, and permits authorized lifecycle', async ({ request }) => {
  test.skip(!isolated || process.env.MEDIA_UPLOADS_PAUSED === 'true', 'Requires an unpaused isolated S3 server and fixture')
  const bucket = process.env.MEDIA_S3_BUCKET
  const endpoint = process.env.MEDIA_S3_ENDPOINT
  const region = process.env.MEDIA_S3_REGION
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY
  if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) throw new Error('Missing test S3 configuration')

  const s3 = new S3Client({
    endpoint,
    region,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true',
    credentials: { accessKeyId, secretAccessKey },
  })
  const login = await request.post('/api/users/login', { data: { email: adminEmail, password: adminPassword } })
  expect(login.status()).toBe(200)

  const suffix = Date.now().toString(36)
  const filename = `portal-s3-test-${suffix}.png`
  const image = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: '#8844cc' } }).png().toBuffer()
  const sentinelKeys: string[] = []
  let uploadedID: number | undefined
  try {
    const upload = await request.post('/api/media', {
      multipart: {
        file: { name: filename, mimeType: 'image/png', buffer: image },
        alt: 'S3 integration test',
        prefix: 'other-app', // A submitted prefix must never leave Portal's namespace.
      },
    })
    expect(upload.status()).toBe(201)
    const { doc } = await upload.json()
    uploadedID = doc.id
    expect(doc.prefix).toBe('portal/media')
    const originalURL = doc.url as string
    const thumbnailURL = doc.sizes.thumbnail.url as string
    expect(originalURL).toContain('prefix=portal%2Fmedia')
    expect(thumbnailURL).toContain('prefix=portal%2Fmedia')

    const original = await request.get(originalURL)
    expect(original.status()).toBe(200)
    expect(await original.body()).toEqual(image)
    const thumbnail = await request.get(thumbnailURL)
    expect(thumbnail.status()).toBe(200)
    expect(thumbnail.headers()['content-type']).toBe('image/png')
    const range = await request.get(originalURL, { headers: { range: 'bytes=0-15' } })
    expect(range.status()).toBe(206)
    expect(range.headers()['content-range']).toBe(`bytes 0-15/${image.length}`)
    expect(await range.body()).toEqual(image.subarray(0, 16))

    const key = `portal/media/${filename}`
    expect((await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ContentLength).toBe(image.length)
    const sentinels = [
      { key: filename, body: 'root leak' },
      { key: `other-app/${filename}`, body: 'foreign leak' },
    ]
    for (const sentinel of sentinels) {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: sentinel.key,
        Body: sentinel.body,
        ContentType: 'image/png',
        IfNoneMatch: '*',
      }))
      sentinelKeys.push(sentinel.key)
    }
    expect((await request.get(`/api/media/file/${filename}?prefix=other-app`)).status()).toBe(403)
    expect((await request.get(`/api/media/file/${filename}?prefix=`)).status()).toBe(403)
    expect(await (await request.get(`/api/media/file/${filename}`)).body()).toEqual(image)
    expect((await request.get(`/api/media/file/unknown-${suffix}.png`)).status()).toBe(403)

    const legacy = await request.get(`/media/${filename}`, { maxRedirects: 0 })
    expect(legacy.status()).toBe(307)
    expect(legacy.headers().location).toBe(`/api/media/file/${filename}`)

    const deleted = await request.delete(`/api/media/${doc.id}`)
    expect(deleted.status()).toBe(200)
    uploadedID = undefined
    expect((await request.get(originalURL)).status()).toBe(403)
    await expect.poll(async () => {
      try { await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key })); return 'exists' }
      catch { return 'missing' }
    }).toBe('missing')
    for (const sentinel of sentinels) {
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: sentinel.key }))
      expect(Buffer.from(await object.Body!.transformToByteArray()).toString()).toBe(sentinel.body)
    }
  } finally {
    if (uploadedID) await request.delete(`/api/media/${uploadedID}`)
    for (const key of sentinelKeys) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  }
})
