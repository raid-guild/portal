# Inquiry intake protection

The existing private `inquiries` and `sponsorInquiries` collections own intake.
Typed forms at `/inquire/[type]` and the legacy `/sponsor` form use the same
protection boundary. Anonymous submission remains supported; signup is not a
prerequisite. This feature does not add CRM routing, notifications, reviewer
assignment, automatic project creation, or production seed changes.

## Collection boundary

All untrusted creates, including Payload REST, GraphQL, and local API calls,
must pass strict scalar types, enums, required fields, text/metadata bounds,
bounded link arrays, and absolute HTTP(S) link validation. Submitted URLs are
data: the server must not fetch them or treat submitted text as HTML. Related
projects must exist and be publicly readable. Public callers
cannot choose status, notes, identity, account-link state, or review reasons.
Authenticated submitter identity comes from the server session.

Public text caps are 120 characters for names; 254 for email; 200 for
organization, role/title, and each UTM field; 256 for source route; 4000 for a
typed inquiry message; 3000 for a sponsor opportunity; and 1200 for contributor
needs. Accept at most five links, each with a 120-character label and
2048-character URL; reject URL credentials and unexpected nested fields.
Challenge tokens are capped at 2048 characters and the honeypot at 200.
These transient protection fields are removed before persistence.

New public submissions are stored with `status=reviewing` and the protected
`intakeReviewReason=pending-review`, or `honeypot` when the honeypot is filled.
The honeypot is a conservative review signal after validation and abuse
checks; it neither proves abuse nor silently discards a submission. There is
no keyword or typing-speed rejection. Existing records are not reclassified,
backfilled, deleted, or otherwise rewritten by the additive migration.

Authenticated editors/admins may create administrative records without a
challenge or rate-limit reservation; input bounds still apply. Other review
updates require editor authorization even with local `overrideAccess: true`.
Signup account linking uses a private server-only Symbol context that permits
only linking the inquiry to the exact newly created user ID. There is no
generic trusted-create context bypass. `overrideAccess: true` and JSON context
flags do not exempt anonymous/member creates. Never derive the account-link
capability from a request body, query parameter, or header, and never expose
it through an anonymous proxy endpoint. Automation must use the protected
path or an explicitly authorized editor identity.

## Configuration

All replicas must use the same PostgreSQL database, private HMAC secret,
limits, and Turnstile policy. Public variables must be present when building
the Next.js client bundle.

| Variable | Contract |
| --- | --- |
| `INQUIRY_PROTECTION_MODE` | Defaults to `enforce`. `development` bypass is permitted only outside `NODE_ENV=production`. |
| `NEXT_PUBLIC_INQUIRY_PROTECTION_MODE` | Set `development` only with server development mode for local work. Production never bypasses the widget. |
| `NEXT_PUBLIC_INQUIRY_TURNSTILE_SITE_KEY` | Turnstile public site key, required for protected browser forms. |
| `TURNSTILE_SECRET_KEY` | Private server verification key; never publish it or prefix it with `NEXT_PUBLIC_`. |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Comma-separated exact hostnames returned by Turnstile, without scheme, port, or path. Include only intended intake hosts. |
| `INQUIRY_RATE_LIMIT_SECRET` | Private random secret of at least 32 characters for HMAC identifiers. Keep it independent from other app secrets. |
| `INQUIRY_RATE_LIMIT_WINDOW_SECONDS` | Default `3600`; integer from `60` to `86400`. |
| `INQUIRY_RATE_LIMIT_IP_MAX` | Default `10` per window; integer from `1` to `10000`. Shared across both intake collections. |
| `INQUIRY_RATE_LIMIT_EMAIL_MAX` | Default `3` per window; integer from `1` to `10000`. Normalized email shares a limit across both collections. |
| `INQUIRY_TRUSTED_IP_HEADER` | Optional header containing one validated IP overwritten by a trusted ingress. Empty means no header is trusted. |

For local interactive development, explicitly set both protection mode
variables to `development` and run `corepack pnpm dev`. This bypasses challenge
and limiter checks only; it does not weaken schema validation or public field
protection. Use enforced mode to exercise the security boundary. Do not rely
on development bypass for `corepack pnpm build` / `corepack pnpm start`, which
run in production mode.

Production rejects the provider's well-known dummy secret keys. Use real
provider keys for a deployed environment; test fixtures belong only in the
isolated test harness described below.

## Proxy trust and limits

Configure a trusted header only after the ingress overwrites it with the
actual peer IP and network controls prevent direct requests to the origin.
Do not forward an arbitrary client-supplied value. The app has no generic
trust in `X-Forwarded-For` and does not take the first address from a forwarded
list. Malformed or absent trusted addresses share an `unknown` bucket rather
than escaping the IP limit. With no trusted header configured, all requests
share that bucket. Verify real ingress behavior before enabling intake.

The shared PostgreSQL reservation is atomic across app instances. IP and
email limits apply across typed and legacy sponsor forms; ordinary signed-in
members receive no exemption. Shared networks can exhaust the IP
budget together, so tune it with NAT traffic in mind. Once structural checks
pass, attempts consume the budget even if challenge verification or the final
database insert fails. Changing the HMAC secret
starts new identifier buckets; coordinate rotation across all replicas and
treat it as resetting the active budget.

## Challenge and outage behavior

Server verification requires provider success, an allowed exact hostname,
and action `inquiry`, with a challenge timestamp no more than five minutes
old. Verification has a five-second timeout and rejects missing, invalid,
expired, and reused tokens. A shared token replay record supplements
provider verification. A challenge is consumed on a submission attempt; get
a new token after an error rather than retrying the same one.

Invalid submissions or challenges produce a validation error. Exhausted
limits return HTTP 429 with retry timing. Missing or invalid configuration,
limiter storage failure, or unavailable verification returns a retryable 503;
the server does not accept unprotected writes. GraphQL clients must inspect
the error payload as well as transport status. Forms preserve entered fields,
announce errors, reset used/expired challenges, and let the user retry.
Missing client configuration disables submission with an unavailable message.

Do not switch production to a bypass during an outage. Restore the provider,
database, or configuration and verify recovery. Review admission rates before
changing limits; do not log raw request bodies to diagnose failures.

## Privacy and retention

Limiter storage uses HMAC identifiers rather than raw IP or email addresses;
token replay storage contains only HMAC hashes. The optional provider
`remoteip` field is omitted, so verification does not send the submitted
request's IP address to the provider. These controls do not remove the
contact details intentionally stored in private inquiry records. Never put
raw submissions, addresses, IPs, challenge tokens, secrets, or full provider
responses in logs, public issue comments, or test artifacts. Use reason codes
and aggregate counts for operational diagnosis.

Limit rows expire with their configured window. Replay rows expire after ten
minutes. Each attempt deletes a bounded batch of expired rows so traffic
cannot trigger an unbounded cleanup. Expiration prevents reuse as active
limits but does not itself guarantee physical deletion when traffic stops:
schedule daily expired-row cleanup in the database maintenance process and
apply the same retention policy to database backups. Keep the cleanup job
scoped to protection tables; never purge inquiry records as limiter cleanup.

Run these statements in the scheduled database maintenance job:

```sql
DELETE FROM inquiry_rate_limits WHERE expires_at <= NOW();
DELETE FROM inquiry_challenge_tokens WHERE expires_at <= NOW();
```

`inquiry_rate_limits` stores only the HMAC bucket key, attempt count, and
expiry. `inquiry_challenge_tokens` stores only the HMAC token hash and expiry.

## Rollout and rollback

1. Review the additive migration and apply it to an isolated development
   database. Confirm existing inquiry counts, statuses, identity links, and
   nullable review reasons remain unchanged. Never seed or reset production
   to test intake.
2. Configure actual Turnstile keys and exact hostnames, the shared HMAC secret,
   limits, and trusted ingress policy. Build with the matching public key.
   Verify that direct origin traffic cannot spoof the configured header.
3. Run the checks below, including anonymous typed and legacy sponsor success,
   private review visibility, signup linking, retry, and both provider/store
   failure paths. Release only after the normal human review and release gates.
4. After a separately authorized release, monitor aggregate failures and
   review outcomes. Do not submit synthetic inquiries to production without
   explicit authorization or alter existing suspected spam records.

Migration `20261113_120000_inquiry_protection` adds the protection tables and
nullable review-reason columns. Its down migration intentionally preserves
them. Rollback must preserve inquiry rows and additive review columns. Prefer a
forward correction for configuration or provider failure. If reverting app
code would restore unprotected intake, pause intake at the ingress until a
protected version is restored. Do not run a destructive down migration or
delete protection tables while any active application version uses them.
Retain evidence privately; this change does not authorize cleanup of existing
records. Implementing this feature does not itself deploy or merge it.

## Verification and audit scope

Run `corepack pnpm lint`, `corepack pnpm exec tsc --noEmit`, relevant protection
`corepack pnpm test:inquiries` (set `INQUIRY_TEST_DATABASE_URI` to a disposable local database for the PostgreSQL cases), and the mandatory Docker PostgreSQL browser suite:
`corepack pnpm test:e2e`. Use `corepack pnpm test:e2e:headed` or
`corepack pnpm test:e2e:manual` when interactive inspection helps. Close browser
contexts and temporary servers afterward. Record the exact commands and
results; a documented checklist is not evidence that a check passed.

The production-mode e2e build uses a Node-only test preload for provider
verification and a browser widget fixture. This test harness does not add a
production application bypass. Keep those fixtures local to test processes;
never load them into a deployed server. Production-mode manual checks require
working provider configuration.

Coverage should include concurrent reservations from independent connections;
normalized-email and shared-collection limits; spoofed/missing/malformed IPs;
REST, GraphQL, and local API bypass attempts; protected-field injection;
oversized and wrong-type data; disallowed URLs; challenge replay, expiration,
hostname/action mismatch and provider outage; safe attack-shaped text;
accessible retries; and unchanged seed, onboarding, linking, and comment flows.

Source inspection found ordinary Payload text/email/textarea/select fields
for inquiry review and no custom inquiry HTML renderer, frontend inquiry
detail view, or automatic fetching of submitted links. Future renderers must
escape text and revalidate URL protocols at the rendering boundary, including
for older records. This inspection is not a completed audit of deployed admin
rendering or external consumers. Production records, logs, and the reported
six suspicious submissions were not inspected; no conclusion about attacker
identity, fixture provenance, or compromise follows from this implementation.

The limiter uses a separate `pg` connection pool (maximum three connections per process, five-second acquisition/query deadlines) against `DATABASE_URI`. Budget those connections in addition to Payload’s pool. This avoids request transactions starving the limiter. The direct `pg` version matches the Payload PostgreSQL adapter.

After migrating a disposable local database named `inquiry_tests`, run `NODE_ENV=production corepack pnpm payload run scripts/verifyInquiryLocalAPI.ts` with its `DATABASE_URI` and a local `PAYLOAD_SECRET` to verify local API bypass rejection, session identity, signup linking, quarantine, and preservation of existing rows. The script refuses other database names and non-loopback hosts.

Payload development schema push excludes the two migration-owned protection tables. Apply the inquiry migration before testing intake locally; schema push alone cannot create the protection store and requests fail closed until it exists.
