<p align="center">
  <a href="https://funkyton.com/payload-cms/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://res.cloudinary.com/hczpmiapo/image/upload/v1732576652/Static%20assets/Logos/payload_V3_mhv6wc.png">
      <source media="(prefers-color-scheme: light)" srcset="https://res.cloudinary.com/hczpmiapo/image/upload/v1732576652/Static%20assets/Logos/payload_V3_mhv6wc.png">
      <img alt="Payload CMS logo" src="https://res.cloudinary.com/hczpmiapo/image/upload/v1732576652/Static%20assets/Logos/payload_V3_mhv6wc.png" width=100>
    </picture>
  </a>
  <a href="https://railway.app/template/L8TUlT?referralCode=-Yg50p">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://railway.app/brand/logo-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://railway.app/brand/logo-dark.svg">
      <img alt="Railway logo" src="https://railway.app/brand/logo-light.svg" width=100>
    </picture>
  </a>
</p>

<h2 align="center">
  Payload CMS V3 Website Template<br>
  <a href="https://railway.app/deploy/L8TUlT?referralCode=-Yg50p">One-click deploy on Railway!</a>
</h2>

<h1 align="center">
  Need help?<br>
  <a href="https://funkyton.com/payload-cms/">Step by step guide and instructions</a>
</h1>

<p align="center">
  A powerful, flexible, and production-ready Payload CMS V3 website builder with PostgreSQL database.
</p>

<p align="center">
  <a href="https://github.com/payloadcms/payload/blob/main/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
  <a href="https://discord.gg/payload">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
</p>

# RaidGuild Portal

This repo powers the RaidGuild Portal: a CMS-backed surface for briefs,
projects, threads, activity, sessions, profiles, recognition, notifications, and
contributor workflows.

Start with:

- [Product overview](./docs/portal-product-overview.md)
- [Portal documentation](./docs/README.md)
- [Implementation checklist](./docs/portal-implementation-checklist.md)

The Portal should make real community activity visible and help people find a
useful next step. It should not become a project management system, Discord
replacement, course platform, handbook dump, or generic AI content feed.

## About this boilerplate

This project started from a Payload CMS website boilerplate and still uses
Payload, Next.js, and PostgreSQL as its foundation. Some lower sections of this
README retain setup notes from the original template, but product direction now
lives in `docs/`.

## Version Info

- **Payload CMS**: `3.82.1`
- **Next.js**: `16.2.5`
- **Node.js**: `^18.20.2 || >=20.9.0`

## Preconfigured Features & Integrations

- **Authentication**: Robust user authentication system
- **Access Control**: Role-based access control for admins and users
- **Premium Content**: Gated content for authenticated users
- **Comments**: User commenting system with admin approval
- **Layout Builder**: Flexible content creation with pre-configured blocks
- **Draft Preview**: Preview unpublished content before going live
- **SEO**: Built-in SEO optimization tools
- **Redirects**: Easy management of URL redirects
- **PostgreSQL Support**: Configured for both local and production use

### Railway Setup

Use one-click deploy template:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/L8TUlT?referralCode=-Yg50p)

### Local Setup

1. Clone proejct: (recommeded) Laucnh on Railway and ejct [watch how](https://www.youtube.com/watch?v=LJFek8JP8TE). Alternatively clone this repo or fork it.
2. Copy `.env.example` to `.env` (fill in your own values..)
3. Start PostgreSQL: `docker compose up -d postgres`
4. Install dependencies: `pnpm install` or `npm install`
5. Run development mode: `pnpm dev` or `npm run dev`
   or
6. Build the project: `pnpm build` or `npm run build`
7. Start the server: `pnpm start` or `npm run start`

To reset a non-Docker local PostgreSQL database, set `DATABASE_URI` to a local
host database in `.env`, then run:

```bash
corepack pnpm db:reset:local
corepack pnpm payload migrate
```

The reset script refuses non-local database hosts and prompts for confirmation
before dropping the database. Use `corepack pnpm db:reset:local:migrate` to
reset and immediately run migrations.

To seed local starter content for browser testing, run:

```bash
corepack pnpm db:seed:local
```

This upserts the portal starter content and ensures a local admin account exists:

- email: `local-admin@example.com`
- password: `password`

It also creates a `local-admin` profile and two sessions hosted by that profile:

- `Local Artifact Upload Test - Past Session`
- `Local Host Planning Session - Future Session`

Use `corepack pnpm db:reset:local:seed` for a fresh local reset, migration, and
seed in one command. The seed script also refuses non-local database hosts.
Pass `-- --skip-admin` to avoid creating the local admin account, or `-- --full`
to run the older destructive full demo seed.

### Email, Password Resets, And Profile Claims

Payload email delivery is optional in local development. Without `SENDGRID_API_KEY`, Payload writes email output to the server console.

Set these variables to enable SendGrid SMTP delivery for password resets, welcome emails, account email verification, and legacy profile claim verification:

- `SENDGRID_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

The public reset flow is available at `/forgot-password` and `/reset-password?token=...`.
Logged-in users can verify their account email from `/me`; self-serve signups start as `unverified` and become `contributor` after verification.
Legacy profile claims are requested from `/me`; matching unclaimed profiles send a verification link to the legacy `claimEmail` before the profile is attached to the logged-in user and the account is promoted to `member`.

### End-to-End Testing

The Playwright suite boots a fresh PostgreSQL container, builds the app from scratch, creates the first admin user through the onboarding UI, upserts the portal starter content, submits a public comment, approves it in the admin UI, and verifies it appears on the public post page.

Before the first run, make sure Docker Desktop is running. The suite starts a fresh PostgreSQL container automatically.

### Local Portal Starter Content

The admin dashboard seed action is for local/dev setup. It is hidden and blocked on hosted Railway/Vercel environments unless `ENABLE_ADMIN_SEED_ACTION=true` is explicitly set. Locally, it is non-destructive: it upserts the portal starter records by stable slugs or titles and does not clear existing CMS content. It may update existing starter records with the same identifiers.

The older full reset seed remains in code for local reset workflows only; do not wire it to hosted production without an explicit database reset intent.

1. Install everything required for e2e: `corepack pnpm e2e:install`
2. Run the suite headlessly: `corepack pnpm test:e2e`
3. Run the suite with a visible browser: `corepack pnpm test:e2e:headed`
4. Run the suite slowly and keep the browser open for manual review: `corepack pnpm test:e2e:manual`

What `e2e:install` does:

- Installs project dependencies
- Rebuilds native dependencies used by the app on Windows, including `sharp` and `esbuild`
- Downloads the Chromium browser used by Playwright

If you prefer `npm`, you can run:

1. `npm run e2e:install`
2. `npm run test:e2e`
3. `npm run test:e2e:headed`
4. `npm run test:e2e:manual`

`test:e2e:manual` runs the suite in headed mode with a visible slowdown between actions and pauses only at the end of the happy path. While paused, the browser stays open so you can click around and manually inspect seeded content, the admin area, and public pages. When you are done, resume or stop the Playwright session from the inspector/terminal.

### Requirements

- **Database**: PostgreSQL
- **Node.js**: Compatible version as specified in `package.json`

## Useful Resources

- **Blog post about this template**: [Read here](https://funkyton.com/payload-cms/)
- **Official Payload Documentation**: [Read here](https://payloadcms.com/docs)

<p align="center">
  <a href="https://funkyton.com/">
    A template by,
    <br><br>
    <picture>
      <img alt="FUNKYTON logo" src="https://res-5.cloudinary.com/hczpmiapo/image/upload/q_auto/v1/ghost-blog-images/funkyton-logo.png" width=200>
    </picture>
  </a>
</p>
