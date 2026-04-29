import assert from 'node:assert/strict'
import test from 'node:test'

import { IGD_QUICK_TRIAGE_OPTIONS } from './igd.quick-triage'

test('quick triage condition select shows only level and color labels', () => {
  assert.deepEqual(
    IGD_QUICK_TRIAGE_OPTIONS.map((option) => option.label),
    ['L0 - Hitam', 'L1 - Merah', 'L2 - Kuning', 'L3 - Hijau', 'L4 - Putih']
  )
})
