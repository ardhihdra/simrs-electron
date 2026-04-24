import assert from 'node:assert/strict'
import test from 'node:test'

import { getIgdActionErrorMessage } from './igd.feedback'

test('getIgdActionErrorMessage prioritizes Error.message', () => {
  assert.equal(
    getIgdActionErrorMessage(new Error('Pembayaran belum lunas'), 'fallback'),
    'Pembayaran belum lunas'
  )
})

test('getIgdActionErrorMessage supports string-like thrown values', () => {
  assert.equal(getIgdActionErrorMessage('raw failure', 'fallback'), 'raw failure')
})

test('getIgdActionErrorMessage falls back when message is unavailable', () => {
  assert.equal(getIgdActionErrorMessage({ detail: 'x' }, 'fallback'), 'fallback')
})
