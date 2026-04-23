import assert from 'node:assert/strict'
import test from 'node:test'

import { getDefaultHomePath } from './app-shell.ts'

test('getDefaultHomePath keeps the legacy home route', () => {
  assert.equal(getDefaultHomePath(), '/')
})
