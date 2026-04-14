import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildRegistrationServeSummary,
  isRegistrationQueueServiceType
} from './registration-workflow'

test('marks only REGISTRASI as registration-specific non-medic flow', () => {
  assert.equal(isRegistrationQueueServiceType('REGISTRASI'), true)
  assert.equal(isRegistrationQueueServiceType('BILLING'), false)
  assert.equal(isRegistrationQueueServiceType('PHARMACY'), false)
})

test('builds registration serve summary for modal header', () => {
  const summary = buildRegistrationServeSummary({
    ticketId: 'ticket-123',
    ticketNo: 'R001',
    servicePointId: 7,
    servicePointName: 'Pendaftaran 1'
  })

  assert.deepEqual(summary, {
    title: 'Buat Antrian Poli',
    ticketLabel: 'Tiket R001',
    servicePointLabel: 'Pendaftaran 1'
  })
})

test('falls back gracefully when service point name is not available', () => {
  const summary = buildRegistrationServeSummary({
    ticketId: 'ticket-123',
    ticketNo: 'R001'
  })

  assert.deepEqual(summary, {
    title: 'Buat Antrian Poli',
    ticketLabel: 'Tiket R001',
    servicePointLabel: undefined
  })
})
