import assert from 'node:assert/strict'
import test from 'node:test'

import { getIgdTriageLevelMeta, IGD_TRIAGE_LEVELS } from './igd.triage-level'

test('IGD triage levels use strict L0-L4 color mapping', () => {
  assert.deepEqual(IGD_TRIAGE_LEVELS, [0, 1, 2, 3, 4])

  assert.equal(getIgdTriageLevelMeta(0).label, 'L0')
  assert.equal(getIgdTriageLevelMeta(0).colorName, 'HITAM')
  assert.equal(getIgdTriageLevelMeta(0).badgeStyle.backgroundColor, '#111827')

  assert.equal(getIgdTriageLevelMeta(1).label, 'L1')
  assert.equal(getIgdTriageLevelMeta(1).colorName, 'MERAH')
  assert.equal(getIgdTriageLevelMeta(1).badgeStyle.backgroundColor, '#dc2626')

  assert.equal(getIgdTriageLevelMeta(2).label, 'L2')
  assert.equal(getIgdTriageLevelMeta(2).colorName, 'KUNING')
  assert.equal(getIgdTriageLevelMeta(2).badgeStyle.backgroundColor, '#facc15')

  assert.equal(getIgdTriageLevelMeta(3).label, 'L3')
  assert.equal(getIgdTriageLevelMeta(3).colorName, 'HIJAU')
  assert.equal(getIgdTriageLevelMeta(3).badgeStyle.backgroundColor, '#16a34a')

  assert.equal(getIgdTriageLevelMeta(4).label, 'L4')
  assert.equal(getIgdTriageLevelMeta(4).colorName, 'PUTIH')
  assert.equal(getIgdTriageLevelMeta(4).badgeStyle.backgroundColor, '#ffffff')
})

test('IGD triage level falls back to L4 when level is missing', () => {
  assert.equal(getIgdTriageLevelMeta(undefined).label, 'L4')
  assert.equal(getIgdTriageLevelMeta(null).label, 'L4')
  assert.equal(getIgdTriageLevelMeta(99).label, 'L4')
})
