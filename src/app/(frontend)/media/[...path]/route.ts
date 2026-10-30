import type { NextRequest } from 'next/server'
import { fetchFallbackMedia } from '../../../../media/fallback'
import { isS3MediaStorage } from '../../../../media/storage'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ path: string[] }>
}

const proxyMedia = async (request: NextRequest, { params }: Args) => {
  const { path } = await params
  if (!path.length || path.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\\'))) return new Response('Not found', { status: 404 })
  if (isS3MediaStorage()) {
    // Legacy public/media URLs resolve through Payload's access-controlled
    // file endpoint once uploads live in the shared bucket.
    if (path.length !== 1) return new Response('Not found', { status: 404 })
    return new Response(null, {
      status: 307,
      headers: { location: `/api/media/file/${encodeURIComponent(path[0])}` },
    })
  }
  const mediaPath = path.map((segment) => encodeURIComponent(segment)).join('/')
  return fetchFallbackMedia(request, `/media/${mediaPath}`)
}

export const GET = proxyMedia
export const HEAD = proxyMedia
