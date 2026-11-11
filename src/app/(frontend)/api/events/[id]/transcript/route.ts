import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return new Response(null, { status: 404 })

  const payload = await getPayload({ config: configPromise })
  const user = await getCurrentUser()
  try {
    const event = await payload.findByID({
      collection: 'events',
      id,
      depth: 0,
      overrideAccess: false,
      user: user || undefined,
    })
    const markdown = event.transcript?.markdown
    if (!markdown) return new Response(null, { status: 404 })

    return new Response(markdown, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="session-${event.id}-transcript.md"`,
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
