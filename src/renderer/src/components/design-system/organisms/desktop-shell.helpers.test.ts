import assert from 'node:assert/strict'
import test from 'node:test'

import {
  closeDesktopDocTab,
  getActiveDesktopKey,
  normalizeDesktopPageListGroups
} from './desktop-shell.helpers.ts'

test('getActiveDesktopKey prefers the requested key when present', () => {
  assert.equal(
    getActiveDesktopKey(
      [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'registration', label: 'Pendaftaran' }
      ],
      'registration'
    ),
    'registration'
  )
})

test('getActiveDesktopKey falls back to the first item when preferred key is missing', () => {
  assert.equal(
    getActiveDesktopKey(
      [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'registration', label: 'Pendaftaran' }
      ],
      'missing'
    ),
    'dashboard'
  )
})

test('closeDesktopDocTab removes the requested tab and activates the previous sibling when needed', () => {
  assert.deepEqual(
    closeDesktopDocTab(
      [
        { key: 'one', label: 'One' },
        { key: 'two', label: 'Two' },
        { key: 'three', label: 'Three' }
      ],
      'two',
      'two'
    ),
    {
      activeKey: 'one',
      tabs: [
        { key: 'one', label: 'One' },
        { key: 'three', label: 'Three' }
      ]
    }
  )
})

test('closeDesktopDocTab keeps the current active key when closing an inactive tab', () => {
  assert.deepEqual(
    closeDesktopDocTab(
      [
        { key: 'one', label: 'One' },
        { key: 'two', label: 'Two' },
        { key: 'three', label: 'Three' }
      ],
      'one',
      'three'
    ),
    {
      activeKey: 'one',
      tabs: [
        { key: 'one', label: 'One' },
        { key: 'two', label: 'Two' }
      ]
    }
  )
})

test('normalizeDesktopPageListGroups removes empty groups and preserves item order', () => {
  assert.deepEqual(
    normalizeDesktopPageListGroups([
      { key: 'ops', label: 'Operasional', items: [] },
      {
        key: 'services',
        label: 'Pelayanan',
        items: [
          { key: 'queue', label: 'Antrian Aktif' },
          { key: 'history', label: 'Riwayat' }
        ]
      }
    ]),
    [
      {
        key: 'services',
        label: 'Pelayanan',
        items: [
          { key: 'queue', label: 'Antrian Aktif' },
          { key: 'history', label: 'Riwayat' }
        ]
      }
    ]
  )
})
