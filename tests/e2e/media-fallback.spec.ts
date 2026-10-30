import { expect, test } from '@playwright/test'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  fetchFallbackMedia,
  isLocalMediaFile,
  localMediaPath,
  mediaFallbackOrigin,
} from '../../src/media/fallback'

test('falls back only for absent local files and rejects escaped filenames', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'portal-media-'))
  try {
    await fs.writeFile(path.join(dir, 'local.jpg'), 'local')
    expect(await isLocalMediaFile(dir, 'local.jpg')).toBe(true)
    expect(await isLocalMediaFile(dir, 'missing.jpg')).toBe(false)
    expect(localMediaPath(dir, '../secret')).toBeNull()
    expect(localMediaPath(dir, 'nested/file.jpg')).toBeNull()
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

test('streams allowed media responses with ranges, and avoids proxy loops or redirects', async () => {
  const previousOrigin = process.env.MEDIA_FALLBACK_ORIGIN
  const previousServer = process.env.NEXT_PUBLIC_SERVER_URL
  const previousFetch = globalThis.fetch
  process.env.MEDIA_FALLBACK_ORIGIN = 'https://old-portal.example'
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://new-portal.example'

  try {
    const request = new Request('https://new-portal.example/api/media/file/image.jpg', {
      headers: { range: 'bytes=0-2', cookie: 'secret=private', authorization: 'Bearer private' },
    })
    globalThis.fetch = async (input, init) => {
      expect(input).toBe('https://old-portal.example/api/media/file/image.jpg')
      const headers = new Headers(init?.headers)
      expect(headers.get('range')).toBe('bytes=0-2')
      expect(headers.get('x-portal-media-fallback-hop')).toBe('1')
      expect(headers.get('cookie')).toBeNull()
      expect(headers.get('authorization')).toBeNull()
      expect(init?.redirect).toBe('manual')
      return new Response('abc', {
        status: 206,
        headers: { 'content-range': 'bytes 0-2/10', 'content-type': 'image/jpeg' },
      })
    }
    const partial = await fetchFallbackMedia(request, '/api/media/file/image.jpg')
    expect(partial.status).toBe(206)
    expect(partial.headers.get('content-range')).toBe('bytes 0-2/10')
    expect(await partial.text()).toBe('abc')

    const loop = await fetchFallbackMedia(new Request(request, {
      headers: { 'x-portal-media-fallback-hop': '1' },
    }), '/api/media/file/image.jpg')
    expect(loop.status).toBe(404)

    process.env.MEDIA_FALLBACK_ORIGIN = 'https://new-portal.example'
    expect(mediaFallbackOrigin(request)).toBeNull()
    process.env.MEDIA_FALLBACK_ORIGIN = 'https://old-portal.example'
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: 'https://elsewhere.example/' } })
    expect((await fetchFallbackMedia(request, '/api/media/file/image.jpg')).status).toBe(502)
    globalThis.fetch = async () => new Response(null, { status: 416, headers: { 'content-range': 'bytes */10' } })
    const unsatisfiable = await fetchFallbackMedia(request, '/api/media/file/image.jpg')
    expect(unsatisfiable.status).toBe(416)
    expect(unsatisfiable.headers.get('content-range')).toBe('bytes */10')
  } finally {
    globalThis.fetch = previousFetch
    if (previousOrigin === undefined) delete process.env.MEDIA_FALLBACK_ORIGIN
    else process.env.MEDIA_FALLBACK_ORIGIN = previousOrigin
    if (previousServer === undefined) Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SERVER_URL')
    else process.env.NEXT_PUBLIC_SERVER_URL = previousServer
  }
})

test('header deadline does not abort a slow response body', async () => {
  const previousOrigin = process.env.MEDIA_FALLBACK_ORIGIN
  const previousServer = process.env.NEXT_PUBLIC_SERVER_URL
  const previousFetch = globalThis.fetch
  process.env.MEDIA_FALLBACK_ORIGIN = 'https://old-portal.example'
  process.env.NEXT_PUBLIC_SERVER_URL = 'https://new-portal.example'

  try {
    let upstreamSignal: AbortSignal | undefined
    globalThis.fetch = async (_input, init) => {
      upstreamSignal = init?.signal ?? undefined
      const signal = upstreamSignal
      const body = new ReadableStream({
        start(controller) {
          setTimeout(() => {
            if (signal?.aborted) controller.error(new Error('stream aborted'))
            else {
              controller.enqueue(new TextEncoder().encode('complete'))
              controller.close()
            }
          }, 35)
        },
      })
      return new Response(body, { status: 200 })
    }

    const response = await fetchFallbackMedia(
      new Request('https://new-portal.example/api/media/file/video.mp4'),
      '/api/media/file/video.mp4',
      10,
    )
    expect(await response.text()).toBe('complete')
    expect(upstreamSignal?.aborted).toBe(false)
  } finally {
    globalThis.fetch = previousFetch
    if (previousOrigin === undefined) delete process.env.MEDIA_FALLBACK_ORIGIN
    else process.env.MEDIA_FALLBACK_ORIGIN = previousOrigin
    if (previousServer === undefined) Reflect.deleteProperty(process.env, 'NEXT_PUBLIC_SERVER_URL')
    else process.env.NEXT_PUBLIC_SERVER_URL = previousServer
  }
})
