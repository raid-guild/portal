import fs from 'node:fs/promises'
import path from 'node:path'

const hopHeader = 'x-portal-media-fallback-hop'
type MediaRequest = { url?: string; headers: Headers; method?: string }

export function mediaFallbackOrigin(request: MediaRequest): string | null {
  const value = process.env.MEDIA_FALLBACK_ORIGIN?.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null
    // A domain move must never turn the fallback into a request to this same service.
    const currentOrigin = request.url ? new URL(request.url).origin : null
    const configuredOrigin = process.env.NEXT_PUBLIC_SERVER_URL
    if (url.origin === currentOrigin || (configuredOrigin && url.origin === new URL(configuredOrigin).origin)) return null
    return url.origin
  } catch {
    return null
  }
}

export function hasFallbackHop(request: MediaRequest): boolean {
  return request.headers.has(hopHeader)
}

export function localMediaPath(staticDir: string, filename: string): string | null {
  if (!filename || filename !== path.basename(filename) || filename === '.' || filename === '..' || filename.includes('\\') || filename.includes('\0')) return null
  const root = path.resolve(staticDir)
  const file = path.resolve(root, filename)
  return file.startsWith(root + path.sep) ? file : null
}

export async function isLocalMediaFile(staticDir: string, filename: string): Promise<boolean> {
  const file = localMediaPath(staticDir, filename)
  if (!file) return false
  try {
    return (await fs.stat(file)).isFile()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

export async function fetchFallbackMedia(request: MediaRequest, upstreamPath: string, headerTimeoutMs = 60000): Promise<Response> {
  const origin = mediaFallbackOrigin(request)
  if (!origin || hasFallbackHop(request)) return new Response('Not found', { status: 404 })

  const headers = new Headers({ [hopHeader]: '1', 'accept-encoding': 'identity' })
  const range = request.headers.get('range')
  if (range) headers.set('range', range)

  let upstream: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), headerTimeoutMs)
  try {
    upstream = await fetch(`${origin}${upstreamPath}`, {
      cache: 'no-store',
      headers,
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      redirect: 'manual',
      signal: controller.signal,
    })
  } catch {
    return new Response('Bad gateway', { status: 502 })
  } finally {
    // The deadline covers connection and response headers. Once fetch resolves,
    // leave its body stream alone so large files can finish downloading.
    clearTimeout(timeout)
  }

  if (upstream.status === 404) return new Response('Not found', { status: 404 })
  if (![200, 206, 416].includes(upstream.status)) return new Response('Bad gateway', { status: 502 })
  if (upstream.status !== 416 && request.method !== 'HEAD' && !upstream.body) return new Response('Bad gateway', { status: 502 })

  const responseHeaders = new Headers()
  for (const name of ['accept-ranges', 'cache-control', 'content-length', 'content-range', 'content-type', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  if (responseHeaders.get('content-type')?.includes('svg')) responseHeaders.set('content-security-policy', "script-src 'none'")
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    headers: responseHeaders,
    status: upstream.status,
  })
}
