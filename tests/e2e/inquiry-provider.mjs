// Test process preload only. Never imported by the application or enabled via
// application configuration; production verification always uses Cloudflare.
const database = new URL(process.env.DATABASE_URI || 'postgres://invalid/invalid')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  database.pathname !== '/' + encodeURIComponent(process.env.E2E_POSTGRES_DB || 'payload_e2e')
) {
  throw new Error('The inquiry provider fixture requires the disposable local payload_e2e database')
}
const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  if (url !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
    return realFetch(input, init)
  const { response: token } = await new Request(input, init).json()
  if (token.startsWith('e2e-outage-')) return new Response('', { status: 503 })
  return Response.json({
    success: token.startsWith('e2e-') && !token.startsWith('e2e-invalid-'),
    hostname: token.startsWith('e2e-host-') ? 'wrong.example' : 'localhost',
    action: token.startsWith('e2e-action-') ? 'wrong' : 'inquiry',
    challenge_ts: new Date(
      Date.now() - (token.startsWith('e2e-expired-') ? 600000 : 1000),
    ).toISOString(),
  })
}
