import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Module } from '../payload-types'
import { publicModuleCard } from './publicModuleCatalog'

const sample = { enabled: true, visibility: 'public', slug: 'test-tool', name: 'Test tool', summary: 'A tool', category: 'tools', authMode: 'none', entryRoute: '/tools/test', launchSecretEnvKey: 'NEVER_EXPOSE', externalCallbackURL: 'https://private.example/callback' } as Module

test('only enabled public modules are projected', () => {
  for (const visibility of ['authenticated', 'member', 'admin'] as const) assert.equal(publicModuleCard({ ...sample, visibility }), null)
  assert.equal(publicModuleCard({ ...sample, enabled: false }), null)
  assert.equal(publicModuleCard({ ...sample, slug: '' }), null)
})
test('public fields are explicitly allowlisted', () => {
  const card = publicModuleCard(sample)!
  assert.deepEqual(Object.keys(card).sort(), ['category', 'description', 'href', 'id', 'image', 'title'])
  assert.equal(card.href, 'https://portal.raidguild.org/tools/test')
  assert.equal(card.image, null)
})
test('signed launch stays behind Portal and unsafe links fall back', () => {
  for (const overrides of [{ authMode: 'signed_launch' as const }, { entryRoute: 'javascript:alert(1)' }, { entryRoute: 'https://user:password@example.com' }]) {
    assert.equal(publicModuleCard({ ...sample, ...overrides })!.href, 'https://portal.raidguild.org/modules/test-tool')
  }
})
