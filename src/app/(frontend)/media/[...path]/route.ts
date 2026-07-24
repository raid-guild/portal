import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ path: string[] }>
}

const proxyMedia = async (request: NextRequest, { params }: Args) => {
  const fallbackOrigin = getFallbackOrigin()
  if (!fallbackOrigin) return new Response('Not found', { status: 404 })

  const { path } = await params
  if (!path.length) return new Response('Not found', { status: 404 })

  const mediaPath = path.map((segment) => encodeURIComponent(segment)).join('/')
  let upstream: Response
  try {
    const range = request.headers.get('range')
    upstream = await fetch(`${fallbackOrigin}/media/${mediaPath}`, {
      cache: 'no-store',
      headers: range ? { range } : undefined,
      method: request.method,
      redirect: 'manual',
    })
  } catch {
    return new Response('Bad gateway', { status: 502 })
  }

  if (
    (!upstream.ok && upstream.status !== 416) ||
    (upstream.ok && request.method !== 'HEAD' && !upstream.body)
  ) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 })
  }

  const headers = new Headers()
  for (const name of [
    'accept-ranges',
    'cache-control',
    'content-length',
    'content-range',
    'content-type',
    'etag',
    'last-modified',
  ]) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    headers,
    status: upstream.status,
  })
}

const getFallbackOrigin = () => {
  const value = process.env.MEDIA_FALLBACK_ORIGIN?.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return url.origin
  } catch {
    return null
  }
}

export const GET = proxyMedia
export const HEAD = proxyMedia
