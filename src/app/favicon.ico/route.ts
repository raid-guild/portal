export async function GET(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      Location: '/favicon.svg',
    },
    status: 308,
  })
}
