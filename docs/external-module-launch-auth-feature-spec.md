# External Module Launch Auth Feature Spec

## Status

Planned / future. This spec describes the recommended first slice for launching
external apps from the Portal module registry while keeping Portal as the source
of truth for user identity, profile, roles, and module visibility.

Do not implement full OAuth/OIDC before the signed-launch pattern has been
tested with one external app.

## Product Intent

Portal modules should be able to represent both internal Portal routes and
external apps. Members should be able to discover an external module in
`/modules`, click through, and arrive in the external app with enough trusted
Portal context to avoid creating a second profile or duplicating role
management.

The Portal should remain the front door:

- one user account
- one profile
- one role/permission source
- one member-facing module registry
- optional external apps that trust Portal for launch context

## Problem

Some useful capabilities may live outside the Portal app:

- CRM or BD tooling
- specialized graph or analytics tools
- media/content workflow tools
- agent consoles
- project-specific dashboards

If every external app manages users and profiles independently, members will
have duplicate accounts, stale permissions, and inconsistent identity. If Portal
tries to absorb every app, it becomes too broad and hard to maintain.

## Recommended First Pattern

Start with a signed launch token flow.

```txt
Portal /modules
  -> /api/modules/:slug/launch
  -> short-lived signed launch token
  -> external app callback URL
  -> external app verifies token and creates local session
```

This is not full OAuth. It is a narrowly scoped launch handoff for trusted
external modules.

## Non-Goals

- No arbitrary third-party app marketplace.
- No runtime plugin installation.
- No external app getting broad database access.
- No long-lived user tokens in URLs.
- No external app becoming the source of truth for Portal roles or profiles.
- No full OAuth/OIDC provider in the first slice.
- No shared admin panel across apps in the first slice.
- No single logout guarantees in the first slice.

## First Slice

### CMS Model Additions

Extend `modules` with external app configuration:

```txt
moduleKind: internal / external
externalLaunchURL: text
externalCallbackURL: text
allowedRedirectURLs: array text
authMode: none / signed_launch
launchAudience: text
launchTokenTTLSeconds: number, default 120
profileClaims: array select
roleClaims: checkbox
requiredRoles: array select
integrationNotes: textarea
```

Keep internal modules working exactly as they do today. For `moduleKind =
internal`, `entryRoute` remains the primary route. For `moduleKind = external`,
the module card should link to Portal's launch endpoint instead of directly to
the external app.

### Secret Storage

Do not store launch secrets as plaintext editable CMS fields.

Recommended first slice:

- Store module launch secrets in environment variables.
- Reference them from the module record by stable key.

Example:

```txt
module.launchSecretEnvKey = "CRM_MODULE_LAUNCH_SECRET"
CRM_MODULE_LAUNCH_SECRET=...
```

Future versions can move secrets into a managed secret store.

### Launch Endpoint

Add a Portal endpoint:

```txt
GET /api/modules/:slug/launch
```

Responsibilities:

1. Require a logged-in Portal user.
2. Load the enabled module by slug.
3. Enforce module visibility and required roles.
4. Confirm the module is configured for `signed_launch`.
5. Resolve the module launch secret.
6. Build a short-lived signed token.
7. Redirect to the module's `externalCallbackURL` with the token.

Example redirect:

```txt
https://crm.example.com/portal/callback?token=<jwt>
```

The endpoint should not expose the module secret or raw Payload token.

## Token Shape

Use a short-lived signed JWT or equivalent signed envelope.

Recommended payload:

```json
{
  "iss": "https://portal.raidguild.org",
  "aud": "crm-module",
  "typ": "portal_module_launch",
  "jti": "random-launch-id",
  "sub": "user:13",
  "userID": 13,
  "profileID": 36,
  "email": "member@example.com",
  "name": "Member Name",
  "handle": "member-handle",
  "roles": ["member"],
  "wallets": [
    {
      "address": "0x1234...",
      "chainId": 100,
      "verifiedAt": "2026-08-14T18:00:00.000Z"
    }
  ],
  "credentials": ["cohort_grad", "member"],
  "moduleSlug": "crm",
  "scopes": ["profile:read"],
  "iat": 1780000000,
  "exp": 1780000120
}
```

Token rules:

- TTL should be short, normally 60-120 seconds.
- Include `aud` and verify it in the external app.
- Include `iss` and verify it in the external app.
- Include `jti` so replay protection can be added later.
- Include only the profile fields the module needs.
- Include wallet claims only when `includeWalletsInLaunch` is enabled and after
  Portal signature verification; a stored or imported address is not enough.
- Include credentials only when `includeCredentialsInLaunch` is enabled and
  keep them to the documented allowlist. Do not turn arbitrary badge slugs into
  authorization claims.
- Do not include sensitive profile fields by default.
- Do not include a reusable Portal auth token.

## Profile Claims

The module record should define which profile fields can be included.

Initial claim options:

```txt
userID
profileID
email
name
handle
avatarURL
roles
memberStatus
wallets
credentials
```

`wallets` currently identifies a verified RaidGuild DAO address on Gnosis Chain
(`chainId: 100`). `credentials` may contain `member` when the current Portal
auth role supports it and `cohort_grad` when the linked profile has the canonical
`cohort-grad` badge. These are launch-time snapshots, not permanent app-local
permissions. Their module-level inclusion settings default to off.

Default to minimal claims:

```txt
userID
profileID
email
name
roles
```

Use profile fields for convenience, not as a long-term data sync contract.
External apps should expect claims to be a launch snapshot.

## External App Responsibilities

An external app that receives a launch token should:

1. Verify the signature with the configured shared secret or public key.
2. Verify `iss`, `aud`, `typ`, `iat`, and `exp`.
3. Reject expired tokens.
4. Create or update a local user link keyed by Portal `userID` or `profileID`.
5. Create an app-local session.
6. Avoid storing unnecessary profile data.
7. Treat Portal roles as launch-time authorization context, not as permanent
   local truth.

If the app needs fresh permissions, it should ask the user to launch again from
Portal or use a later server-to-server profile refresh endpoint.

## Server-To-Server Refresh

Defer this until launch handoff is working.

Future endpoint shape:

```txt
GET /api/modules/:slug/profile/:profileID
Authorization: Bearer <module-server-token>
```

Use cases:

- external app refreshes display name/avatar
- external app checks whether a user is still a member
- external app resolves role changes without asking for a new launch

This requires stronger module credential management than the first slice.

## Portal UI Behavior

Module cards should distinguish internal and external modules without making the
user think they are leaving the Portal unexpectedly.

Recommended labels:

- internal module CTA: `Open module`
- external module CTA: `Launch app`

For external modules, show a small secondary cue:

```txt
External app
Uses Portal sign-in
```

Do not show raw auth details on the member-facing card.

## Access Rules

The launch endpoint must enforce the same visibility model as module listing:

```txt
public
authenticated
member
admin
```

For the first slice, external modules should usually be `authenticated` or
`member`. Public external modules can just use a normal external link unless
they need identity handoff.

Agents should not launch human-facing external modules unless the module
explicitly supports agent use.

## Security Notes

- Never put a long-lived secret or Payload JWT in the redirect URL.
- Never trust a module slug from the client without loading the CMS record.
- Use a strict allowlist for callback/redirect URLs.
- Use HTTPS-only external URLs.
- Keep TTL short.
- Include `aud` and verify it.
- Rotate module secrets when an external app is compromised.
- Prefer per-module secrets over one global shared secret.
- Log launch attempts with module slug, user ID, success/failure, and reason,
  but do not log the token.
- Consider replay protection with `jti` if an app handles sensitive data.

## Why Not Full OAuth First?

OAuth/OIDC may become the right long-term answer if Portal needs to support many
external apps with consent screens, refresh tokens, revocation, single logout,
and standardized client registration.

The first need is simpler:

- member clicks a trusted module
- Portal confirms access
- external app receives signed identity context
- external app starts a session

Signed launch is smaller, easier to audit, and enough to validate whether
external modules are useful.

## Migration Path To OIDC

Design the first slice so it can evolve:

- Keep `aud`, `iss`, `sub`, `iat`, `exp`, and `scope` semantics close to JWT/OIDC
  conventions.
- Use per-module/client records.
- Keep claims explicit and scoped.
- Keep external apps validating issuer and audience.

Future OIDC fields could include:

```txt
clientID
redirectURIs
grantTypes
responseTypes
allowedScopes
clientSecretHash
tokenEndpointAuthMethod
```

## Open Questions

- Should external modules be allowed for `agent` users?
- Should the launch token include roles by default or only boolean
  capabilities?
- Do we need a launch audit collection, or are app logs enough initially?
- Should external module claims include profile visibility rules?
- Should external apps be able to write activity back to Portal in the first
  version?
- Is a single signed launch flow enough for CRM-like tools, or will CRM require
  server-to-server profile refresh early?

## Implementation Checklist

- [ ] Extend `modules` with external module configuration fields.
- [ ] Add migration for new module fields.
- [ ] Add validation for HTTPS callback URLs.
- [ ] Add `GET /api/modules/:slug/launch`.
- [ ] Sign short-lived launch tokens with a per-module secret.
- [ ] Add module card CTA behavior for `internal` vs `external`.
- [ ] Add e2e coverage for unauthenticated launch rejection.
- [ ] Add e2e coverage for visibility/role launch enforcement.
- [ ] Add e2e coverage for redirect token shape without logging token.
- [ ] Document external app verification requirements.
