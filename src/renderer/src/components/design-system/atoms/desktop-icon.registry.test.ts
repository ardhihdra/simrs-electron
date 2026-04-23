import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DESKTOP_ICON_NAMES,
  getDesktopIconPath,
  hasDesktopIcon
} from './desktop-icon.registry.ts'

test('desktop icon registry exposes the shell and operational icon set', () => {
  assert.ok(DESKTOP_ICON_NAMES.length >= 20)
  assert.ok(hasDesktopIcon('dashboard'))
  assert.ok(hasDesktopIcon('users'))
  assert.ok(hasDesktopIcon('bed'))
  assert.ok(hasDesktopIcon('shield'))
  assert.ok(hasDesktopIcon('bell'))
  assert.ok(hasDesktopIcon('plus'))
  assert.ok(hasDesktopIcon('x'))
})

test('desktop icon registry falls back to the circle-help icon for unknown names', () => {
  const fallback = getDesktopIconPath('unknown-icon')

  assert.equal(fallback.name, 'circle-help')
  assert.ok(fallback.paths.length > 0)
})
