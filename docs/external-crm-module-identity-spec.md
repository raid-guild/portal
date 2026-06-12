# External CRM Module And Portal Identity Spec

## Status

Planned / future. This document captures product direction and integration
boundaries for using Portal as the front door and identity/profile authority
while connecting to a separate CRM application.

No CRM implementation is included in the current MVP.

## Product Intent

Portal should remain the first place members go to understand the community,
manage their profile, discover modules, and access internal systems.

As RaidGuild adds a CRM, the goal is not to make members manage another account,
profile, or role set. Portal should be the authority for community identity and
module access. The CRM should own CRM-specific records and workflows.

The desired experience:

```txt
Member logs into Portal
Member opens Modules
Member sees CRM if their Portal role allows it
Member launches CRM without creating another profile
CRM knows who they are through Portal identity
Prism can operate against CRM and Portal through explicit APIs/tools
```

## Why This Belongs In Modules

CRM is an internal product surface, not a core Portal primitive.

Portal primitives should stay focused:

- `Profile`: member/contributor identity
- `Project`: public or member-facing collaboration surface
- `Thread`: persistent line of thought or work
- `Event`: scheduled session or calendar anchor
- `Activity Item`: factual signal that something happened
- `Brief`: current snapshot of what is happening

CRM should be exposed as an external module because it has its own lifecycle,
permissions, data model, private records, and product workflows.

## Core Boundary

### Portal Owns

- user account
- profile
- member/contributor/admin/agent roles
- verification status
- blocked/disabled status
- module visibility and access
- public/member identity
- inbound inquiry capture
- links between inquiries, projects, profiles, and sessions

### CRM Owns

- accounts/companies
- contacts/leads
- opportunities/deals
- pipeline stages
- private BD notes
- follow-up tasks
- outreach history
- invoices/contracts if the CRM supports them
- CRM-specific activities and audit history

### Prism Owns

- agent workflows
- enrichment/summarization
- proposal drafting
- cross-system update orchestration
- review-first automation

Prism should not become the source of truth for Portal identity or CRM records.

## Intake And Inquiry Flow

The current Portal inquiry flow is still the right front door.

Recommended flow:

1. Visitor submits an inquiry through Portal.
2. Portal saves the raw submission as the source intake record.
3. A hook, job, or Prism workflow proposes or creates the CRM contact and
   opportunity.
4. CRM becomes the workspace for BD follow-up.
5. Portal stores lightweight CRM sync/reference fields when useful.

This keeps public intake and account continuation in Portal while avoiding CRM
pipeline features inside Portal.

Future bridge fields on `inquiries` may include:

```txt
crmExternalID
crmSource
crmSyncStatus: pending / synced / failed / ignored
crmSyncedAt
crmURL
crmOwnerSnapshot
crmStageSnapshot
```

These fields should be snapshots or references, not a duplicated CRM pipeline.

## External Module Model

The existing `modules` collection should be able to represent external apps.

Future module fields may include:

```txt
kind: internal / external / embedded
externalURL
authMode: none / separate / portalLaunchToken / sso
requiredRoles
requiredCapabilities
accessNotes
supportURL
ownerProfiles
lastAccessReviewedAt
```

Example CRM module record:

```txt
name: CRM
slug: crm
summary: Private relationship and opportunity workspace for BD and guild ops.
status: prototype
visibility: member
kind: external
externalURL: https://crm.raidguild.org
authMode: portalLaunchToken
requiredRoles: member
enabled: true
featured: false
```

The `/modules` page remains the member-facing discovery surface. CRM should not
be added to primary navigation until it is stable and broadly useful.

## Portal Launch Token Flow

The preferred first SSO-like implementation is a scoped launch-token flow, not a
full OIDC provider.

Flow:

```txt
1. User clicks CRM module in Portal.
2. Portal checks module visibility, user verification, blocked status, and
   required roles.
3. Portal creates a short-lived signed JWT scoped to the CRM module.
4. Browser is redirected to the CRM launch callback with the token.
5. CRM verifies the token.
6. CRM upserts a local shadow user keyed by Portal user/profile ID.
7. CRM starts its own session.
8. User lands in CRM already identified.
```

Launch token claims:

```json
{
  "iss": "portal",
  "aud": "crm",
  "sub": "portal-user-id",
  "profileId": "portal-profile-id",
  "email": "member@example.com",
  "displayName": "Member Name",
  "roles": ["member", "contributor"],
  "module": "crm",
  "iat": 1780000000,
  "exp": 1780000300
}
```

Security expectations:

- Tokens must be short-lived.
- Tokens must be scoped to one module.
- Tokens must be signed with a strong secret or asymmetric key.
- CRM must reject expired tokens.
- CRM must reject tokens with the wrong audience/module.
- Portal must deny launch for blocked, disabled, or insufficient-role users.
- CRM should re-check Portal identity periodically or on session refresh.
- Token contents should avoid sensitive profile data.

This is not a replacement for a full identity provider. It is a pragmatic first
step for trusted internal apps.

## Shadow Users In CRM

External apps may need a local user table for ownership, audit logs, and
foreign-key relationships. That is acceptable if Portal remains the authority.

CRM local user fields should be minimal:

```txt
portalUserID
portalProfileID
email
displayName
rolesSnapshot
lastSyncedAt
disabledAt
```

Rules:

- CRM should not ask Portal members to maintain a second public profile.
- CRM should not become the authority for member roles.
- CRM can have CRM-specific permissions, but base access comes from Portal.
- If a Portal user is blocked or loses access, CRM access should be revoked.

## NextCRM Exploration

NextCRM appears closer to the desired path than a heavier CRM platform because
it is a Next.js app with PostgreSQL/Prisma, Better Auth, AI features, and MCP
server support for agent access.

Potential fit:

- separate app that can remain private/internal
- closer web stack to Portal
- easier to fork or adapt than a large CRM platform
- existing AI/MCP affordances may be useful for Prism
- CRM records can stay out of Payload

Likely required changes:

- add Portal launch callback route
- verify Portal launch tokens
- upsert shadow users from Portal identity
- map Portal roles to CRM roles
- add Portal link-back fields to CRM records
- expose CRM tools to Prism through MCP/API with service-token auth

Risks:

- integration becomes a maintained fork
- NextCRM's auth model may need careful changes to avoid duplicate accounts
- CRM role semantics may drift from Portal role semantics
- agent access must not bypass Portal/CRM permission rules

## Twenty Exploration

Twenty may be a better fit if RaidGuild needs a more complete CRM platform with
stronger built-in object modeling, workflows, and long-term product maturity.

Potential fit:

- more mature CRM product surface
- richer object/workflow model
- better if the organization wants a full CRM platform rather than a tailored
  internal app

Risks:

- heavier operational footprint
- more opinionated architecture
- likely harder to bend around Portal-owned identity
- more conceptual overhead for a simple first CRM bridge

Recommendation: explore NextCRM first for a small internal CRM module. Revisit
Twenty only if the CRM needs clearly exceed what a lighter/forkable app can
support.

## Prism Integration

Prism should interact with both systems through explicit contracts.

Portal-facing examples:

- read new inquiries
- propose CRM sync actions
- attach CRM status snapshots to Portal inquiry records
- publish activity items only when a human or policy approves

CRM-facing examples:

- create/update contact
- create/update opportunity
- add activity note from a session or Discord summary
- summarize next follow-up
- enrich organization/contact records
- search CRM records through MCP

Avoid:

- agents silently publishing invented CRM or Portal content
- agents creating private CRM records from weak public signals
- Portal mirroring the full CRM pipeline
- CRM writing directly into Portal profile roles

## Access And Permission Questions

Open questions before implementation:

- Which Portal roles can access CRM at first?
- Should `contributor` be enough, or only `member` and `admin`?
- Should agents have direct CRM access, or only Prism service workflows?
- Should unverified users be denied all CRM access?
- How quickly must CRM sessions revoke after Portal role changes?
- Is email verification required before CRM launch?
- Should CRM access be logged as Portal activity?

Initial recommendation:

```txt
CRM access: member, admin
CRM admin: admin only
Agent access: service-token workflow only, not general UI launch
Unverified users: denied
Blocked users: denied
```

## Implementation Sequence

### Phase 1: Discovery

- Add CRM as an external module record with `authMode: separate`.
- Link to a test CRM deployment.
- Keep CRM login separate during evaluation.
- Validate whether NextCRM data model and MCP tools are useful.

### Phase 2: Portal Launch Token Prototype

- Add Portal module launch endpoint.
- Add signed launch token utility.
- Add CRM callback route.
- Upsert CRM shadow user from Portal claims.
- Add basic audit logs on launch.

### Phase 3: Inquiry Bridge

- Add CRM reference/sync fields to `inquiries`.
- Add review-first Prism workflow for inquiry-to-CRM sync.
- Store CRM URL/status snapshot back on Portal inquiry.
- Keep raw inquiry in Portal.

### Phase 4: Deeper CRM Operations

- Add Prism workflows for follow-up summaries and CRM activity notes.
- Add CRM links on relevant Portal inquiry/project admin views.
- Consider one-way status snapshots from CRM to Portal.
- Add revocation/session-refresh checks.

### Phase 5: Reassess Identity Strategy

If multiple external internal apps need the same treatment, decide whether to:

- keep Portal launch tokens
- formalize Portal as an OIDC provider
- adopt a dedicated identity provider and sync Portal profile/roles into it

## Non-Goals

- Do not rebuild a CRM inside Portal.
- Do not duplicate public profiles inside CRM.
- Do not make CRM records public by default.
- Do not sync the full CRM database into Payload.
- Do not make Portal a general-purpose identity provider in the first version.
- Do not let CRM access bypass Portal verification/blocking rules.

## Related Specs

- [Portal modules](./modules-feature-spec.md)
- [Onboarding and inquiry funnel](./onboarding-funnel-feature-spec.md)
- [Roles and capabilities](./roles-and-capabilities.md)
- [Prism / Portal memory handoff](./prism-portal-memory-handoff.md)
