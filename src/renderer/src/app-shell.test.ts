import assert from 'node:assert/strict'
import test from 'node:test'

import { getAppShellKind, getDefaultHomePath } from './app-shell.ts'

test('getDefaultHomePath keeps the legacy home route', () => {
  assert.equal(getDefaultHomePath(), '/')
})

test('getAppShellKind routes design system path to isolated shell', () => {
  assert.equal(getAppShellKind('/design-system'), 'design-system')
  assert.equal(getAppShellKind('/design-system/tokens'), 'design-system')
})

test('getAppShellKind keeps dashboard and other paths on the legacy shell', () => {
  assert.equal(getAppShellKind('/'), 'dashboard')
  assert.equal(getAppShellKind('/dashboard/patient'), 'dashboard')
  assert.equal(getAppShellKind('/iframe-view'), 'dashboard')
})
