import type { Page } from '@playwright/test'

// Exercise the real UI integration while keeping E2E deterministic/offline.
export async function installInquiryChallenge(page: Page) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.turnstile = {
      render(container, options) {
        const id = crypto.randomUUID();
        window.inquiryChallengeOptions = options;
        setTimeout(() => options.callback('e2e-valid-' + id), 0);
        return id;
      },
      remove() {}
    };`,
    }),
  )
}
