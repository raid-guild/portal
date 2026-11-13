import { defineConfig } from '@playwright/test'

import {
  agentRegistrationSecret,
  baseURL,
  databaseURL,
  externalModuleLaunchSecret,
  payloadSecret,
  port,
} from './tests/e2e/env'

const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? '0')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 180000,
  expect: {
    timeout: 15000,
  },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      ...(slowMo > 0 ? { slowMo } : {}),
      ...(process.env.PRISM_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PRISM_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] }
        : {}),
    },
  },
  webServer: {
    command: 'node ./tests/e2e/web-server.mjs',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: String(port),
      // Local E2E must not use runtime service credentials to send mail or hooks.
      SENDGRID_API_KEY: '',
      PRISM_AGENT_API_BASE_URL: '',
      PRISM_AGENT_SERVICE_TOKEN: '',
      LISTMONK_URL: '',
      NEXT_PUBLIC_INQUIRY_TURNSTILE_SITE_KEY: 'e2e-widget-key',
      INQUIRY_PROTECTION_MODE: 'enforce',
      INQUIRY_RATE_LIMIT_SECRET: 'e2e-inquiry-secret-at-least-32-characters',
      INQUIRY_TRUSTED_IP_HEADER: 'x-e2e-client-ip',
      TURNSTILE_SECRET_KEY: 'e2e-server-key',
      TURNSTILE_ALLOWED_HOSTNAMES: 'localhost',
      DATABASE_URI: databaseURL,
      DISABLE_SEARCH_SYNC: 'true',
      USE_LOCAL_SEED_MEDIA: 'true',
      PAYLOAD_SECRET: payloadSecret,
      NEXT_PUBLIC_SERVER_URL: baseURL,
      AGENT_REGISTRATION_SECRET: agentRegistrationSecret,
      E2E_EXTERNAL_MODULE_LAUNCH_SECRET: externalModuleLaunchSecret,
    },
    timeout: 180000,
  },
})
