import { test, expect } from '@playwright/test'

test('anonymous catalog is an allowlisted projection, not collection access', async ({ request }) => {
  const response = await request.get('/api/public/modules')
  expect(response.status()).toBe(200)
  const result = await response.json()
  expect(Array.isArray(result.docs)).toBe(true)
  expect(typeof result.totalDocs).toBe('number')
  for (const card of result.docs) {
    expect(Object.keys(card).sort()).toEqual(['category', 'description', 'href', 'id', 'image', 'title'])
    expect(card.href).toMatch(/^https:\/\//)
  }
  expect((await request.get('/api/public/modules?page=-1')).status()).toBe(400)
  expect((await request.get('/api/modules')).status()).toBe(403)
})
