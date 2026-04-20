import assert from 'node:assert/strict'
import test from 'node:test'

import { DESIGN_SYSTEM_COMPONENTS } from './design-system.registry.ts'

test('design system registry includes all first wave desktop components', () => {
  const ids = DESIGN_SYSTEM_COMPONENTS.map((item) => item.id)

  assert.deepEqual(ids, [
    'desktop-button',
    'desktop-input-field',
    'desktop-card',
    'desktop-menu-shell',
    'desktop-generic-table'
  ])
})

test('each registry item exposes copyable usage snippet and payload metadata', () => {
  for (const item of DESIGN_SYSTEM_COMPONENTS) {
    assert.ok(item.codeSnippet.includes(`<${item.componentName}`))
    assert.ok(item.props.length > 0)
    assert.ok(item.description.length > 0)
  }
})
