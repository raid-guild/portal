# External Module Integration Guide

This guide is for teams building an external app that launches from the Portal
module registry.

The first supported pattern is signed launch. Portal remains the source of truth
for user accounts, profiles, roles, and module visibility. The external app
receives a short-lived launch token and creates its own local session.

See also:

- [External module launch auth spec](./external-module-launch-auth-feature-spec.md)
- [Portal modules spec](./modules-feature-spec.md)

## Portal Configuration

Create or update a `modules` record in Payload:

```txt
moduleKind: external
authMode: signed_launch
externalCallbackURL: https://your-app.example.com/portal/callback
launchSecretEnvKey: YOUR_MODULE_LAUNCH_SECRET
launchAudience: your-module-slug
launchTokenTTLSeconds: 120
visibility: authenticated or member
enabled: true
```

The secret itself must live in the Portal environment, not in Payload CMS data:

```txt
YOUR_MODULE_LAUNCH_SECRET=long-random-shared-secret
```

The external app must have the same secret available in its own environment.

## Launch Flow

Members launch the app from `/modules`.

Portal opens:

```txt
GET /api/modules/:slug/launch
```

Portal then:

1. Requires a logged-in Portal user.
2. Loads the enabled module by slug.
3. Enforces module visibility and any configured launch roles.
4. Signs a short-lived JWT with the module secret.
5. Redirects to the external callback URL.

External app receives:

```txt
https://your-app.example.com/portal/callback?token=<jwt>
```

## Token Claims

Current token shape:

```json
{
  "typ": "portal_module_launch",
  "iss": "https://portal.raidguild.org",
  "aud": "your-module-slug",
  "sub": "user:13",
  "jti": "random-launch-id",
  "userID": 13,
  "profileID": 36,
  "email": "member@example.com",
  "name": "Member Name",
  "handle": "member-handle",
  "picture": "https://portal.raidguild.org/media/avatar.jpg",
  "roles": ["member"],
  "moduleSlug": "your-module-slug",
  "scopes": ["profile:read"],
  "iat": 1780000000,
  "exp": 1780000120
}
```

Only configured optional claims are included. Do not assume `email`, `roles`,
`profileID`, `handle`, or `picture` are always present.

## Verification Requirements

The external app must verify:

- signature
- `typ === "portal_module_launch"`
- expected `iss`
- expected `aud`
- token is not expired
- token `moduleSlug` matches the expected module

Reject tokens that fail any check.

Do not treat the launch token as a long-lived API token. It is only for starting
an app-local session.

## Node Verification Example

```ts
import jwt from 'jsonwebtoken'

type PortalLaunchClaims = {
  aud: string
  email?: string
  exp: number
  handle?: string
  iss: string
  moduleSlug: string
  name?: string
  profileID?: number | string
  roles?: string[]
  sub: string
  typ: 'portal_module_launch'
  userID: number | string
}

export function verifyPortalLaunchToken(token: string): PortalLaunchClaims {
  const decoded = jwt.verify(token, process.env.PORTAL_MODULE_LAUNCH_SECRET!, {
    algorithms: ['HS256'],
    audience: 'your-module-slug',
    issuer: 'https://portal.raidguild.org',
  }) as PortalLaunchClaims

  if (decoded.typ !== 'portal_module_launch') {
    throw new Error('Invalid Portal launch token type.')
  }

  if (decoded.moduleSlug !== 'your-module-slug') {
    throw new Error('Invalid Portal module slug.')
  }

  return decoded
}
```

## Session Linking

After verification, the external app should create or update a local user record
keyed by Portal identity:

```txt
portalUserID = claims.userID
portalProfileID = claims.profileID
```

Recommended behavior:

- Use Portal `userID` as the durable account link.
- Use Portal `profileID` for display/profile links when present.
- Store only the fields needed by the external app.
- Treat roles as launch-time authorization context.
- Ask the user to launch from Portal again if permissions need to be refreshed.

## Failure Handling

External app should show a clear error and link back to Portal when:

- token is missing
- token is expired
- signature verification fails
- audience/issuer/module checks fail
- local account linking fails

Recommended fallback link:

```txt
https://portal.raidguild.org/modules
```

## Security Rules

- Never log the raw token.
- Never store the raw token as a session credential.
- Never use the launch token to call Portal APIs.
- Keep the shared secret out of source control.
- Rotate the secret if it is exposed.
- Prefer short sessions or explicit re-launch for sensitive external apps.

## Local Development

The production Portal launch endpoint requires an HTTPS callback URL. For local
external app development, use an HTTPS tunnel or a deployed preview URL.

Examples:

```txt
https://your-preview.example.com/portal/callback
https://your-tunnel.example.com/portal/callback
```

## Future Integration Points

Not in the first slice:

- server-to-server profile refresh
- external app writeback to Portal activity
- full OAuth/OIDC provider
- refresh tokens
- single logout
- consent screens
