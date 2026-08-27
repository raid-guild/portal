import { NextRequest, NextResponse } from 'next/server'

const publicMarkdownRoute =
  /^(?:\/$|\/(?:posts|projects|cohorts|wiki|threads|events)(?:\/[^/]+)?\/?$)/

const acceptsMarkdown = (request: NextRequest): boolean =>
  request.headers
    .get('accept')
    ?.split(',')
    .some((value) => value.trim().split(';', 1)[0].toLowerCase() === 'text/markdown') ?? false

export function proxy(request: NextRequest) {
  if (!acceptsMarkdown(request) || !publicMarkdownRoute.test(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  const headers = new Headers(request.headers)
  headers.set('x-portal-markdown-path', request.nextUrl.pathname)

  return NextResponse.rewrite(new URL('/_markdown', request.url), {
    request: { headers },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
