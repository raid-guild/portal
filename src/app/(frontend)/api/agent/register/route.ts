import configPromise from '@payload-config'
import { getPayload } from 'payload'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const configuredSecret = process.env.AGENT_REGISTRATION_SECRET

  if (!configuredSecret) {
    return Response.json({ message: 'Agent registration is not enabled.' }, { status: 404 })
  }

  const authHeader = request.headers.get('authorization') || ''
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const body = await request.json().catch(() => null)
  const providedSecret = bearerToken || body?.registrationSecret

  if (providedSecret !== configuredSecret) {
    return Response.json({ message: 'Invalid agent registration secret.' }, { status: 401 })
  }

  const email = String(body?.email || '')
    .trim()
    .toLowerCase()
  const password = String(body?.password || '')
  const name = String(body?.name || '').trim()

  if (!emailPattern.test(email)) {
    return Response.json({ message: 'Enter a valid email address.' }, { status: 400 })
  }

  if (!name) {
    return Response.json({ message: 'Agent name is required.' }, { status: 400 })
  }

  if (password.length < 12) {
    return Response.json(
      { message: 'Agent password must be at least 12 characters.' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config: configPromise })

  const existing = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (existing.docs.length) {
    return Response.json({ message: 'An account already exists for this email.' }, { status: 409 })
  }

  const createdUser = await payload.create({
    collection: 'users',
    context: {
      skipWelcomeEmail: true,
    },
    data: {
      email,
      name,
      password,
    },
    overrideAccess: true,
  })

  const user = await payload.update({
    id: createdUser.id,
    collection: 'users',
    data: {
      roles: ['agent'],
    },
    overrideAccess: true,
  })

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    },
    { status: 201 },
  )
}
