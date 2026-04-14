import assert from 'node:assert/strict'
import test from 'node:test'

import { createKioskaRegistrationTicketPayload } from './kioska-queue-submission.ts'

test('registration ticket payload follows non-medic kiosk contract', () => {
  assert.deepEqual(createKioskaRegistrationTicketPayload(30, '2026-04-14'), {
    lokasiKerjaId: 30,
    serviceTypeCode: 'REGISTRASI',
    queueDate: '2026-04-14',
    sourceChannel: 'KIOSK'
  })
})

test('registration ticket payload uses stored rawat jalan location when available', () => {
  assert.deepEqual(createKioskaRegistrationTicketPayload(9, '2026-04-14'), {
    lokasiKerjaId: 9,
    serviceTypeCode: 'REGISTRASI',
    queueDate: '2026-04-14',
    sourceChannel: 'KIOSK'
  })
})
