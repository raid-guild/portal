import type { Where } from 'payload'
import { NextResponse } from 'next/server'

export const response = (markdown: string, status = 200) =>
  new NextResponse(`${markdown.trim()}\n`, {
    status,
    headers: {
      'Cache-Control': status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store',
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
    },
  })

export const publicWhere = (field?: string, value?: string): Where => ({
  and: [
    { _status: { equals: 'published' } },
    { visibility: { equals: 'public' } },
    ...(field && value ? [{ [field]: { equals: value } }] : []),
  ],
})
