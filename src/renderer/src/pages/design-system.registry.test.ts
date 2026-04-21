import assert from 'node:assert/strict'
import test from 'node:test'

import { DESIGN_SYSTEM_COMPONENTS } from './design-system.registry.ts'

test('design system registry includes the expanded desktop component catalog', () => {
  const ids = DESIGN_SYSTEM_COMPONENTS.map((item) => item.id)

  assert.deepEqual(ids, [
    'desktop-button',
    'desktop-badge',
    'desktop-tag',
    'desktop-avatar',
    'desktop-status-dot',
    'desktop-progress-bar',
    'desktop-icon',
    'desktop-keyboard-shortcut',
    'desktop-input',
    'desktop-input-field',
    'desktop-segmented-control',
    'desktop-form-field',
    'desktop-card',
    'desktop-stat-card',
    'desktop-content-tabs',
    'desktop-doc-tabs',
    'desktop-table',
    'desktop-menu-shell',
    'desktop-page-header',
    'desktop-module-bar',
    'desktop-page-list',
    'desktop-status-bar',
    'desktop-notification-item',
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

test('design system registry groups all components into showcase categories', () => {
  const categories = new Set(DESIGN_SYSTEM_COMPONENTS.map((item) => item.category))

  assert.deepEqual([...categories], [
    'Actions',
    'Identity & Status',
    'Inputs & Forms',
    'Navigation & Shell',
    'Data Display'
  ])
})
