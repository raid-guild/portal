import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codeRepositoryURL, repositoryLabel } from './moduleRepository'

test('repository links require absolute HTTPS and no embedded credentials', () => {
  assert.equal(codeRepositoryURL(' https://git.example.org/team/tool '), 'https://git.example.org/team/tool')
  assert.equal(repositoryLabel('https://git.example.org/team/tool/'), 'git.example.org/team/tool')
  for (const value of ['', '/team/tool', 'http://git.example.org/team/tool', 'https://user:secret@git.example.org/team/tool', 'javascript:alert(1)']) {
    assert.equal(codeRepositoryURL(value), null)
  }
})
