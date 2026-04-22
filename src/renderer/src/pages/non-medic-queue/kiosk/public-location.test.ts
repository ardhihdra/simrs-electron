import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createPublicKioskLocationResolverInput,
  createServiceKioskTicketPayload,
  normalizeServiceKioskPayloadLokasiKerjaCode
} from './public-location.ts'

test('payload lokasi kerja code is normalized before resolver lookup', () => {
  assert.equal(normalizeServiceKioskPayloadLokasiKerjaCode({ LokasiKerjaCode: ' rj ' }), 'RJ')
  assert.equal(normalizeServiceKioskPayloadLokasiKerjaCode({ LokasiKerjaCode: '   ' }), undefined)
  assert.equal(normalizeServiceKioskPayloadLokasiKerjaCode(undefined), undefined)
})

test('public kiosk location resolver input prefers payload lokasi kerja code', () => {
  assert.deepEqual(
    createPublicKioskLocationResolverInput('PHARMACY', { LokasiKerjaCode: ' farm ' }),
    {
      serviceTypeCode: 'PHARMACY',
      lokasiKerjaCode: 'FARM'
    }
  )
})

test('public kiosk location resolver input omits lokasi kerja code when payload is absent', () => {
  assert.deepEqual(createPublicKioskLocationResolverInput('CASHIER'), {
    serviceTypeCode: 'CASHIER'
  })
})

test('ticket payload always uses resolved lokasi kerja id instead of session data', () => {
  assert.deepEqual(createServiceKioskTicketPayload(31, 'REGISTRASI', '2026-04-20'), {
    lokasiKerjaId: 31,
    serviceTypeCode: 'REGISTRASI',
    queueDate: '2026-04-20',
    sourceChannel: 'KIOSK'
  })
})
