import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createKioskaRegistrationTicketPayload,
  resolveInitialKioskaRegistrationPaymentMethodFromPath,
  resolveKioskaRegistrationServiceTypeFromPaymentMethod
} from './kioska-queue-submission.ts'

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

test('insurance registration ticket payload uses insurance registration service type', () => {
  assert.deepEqual(
    createKioskaRegistrationTicketPayload(9, '2026-04-14', 'REGISTRASI_ASURANSI'),
    {
      lokasiKerjaId: 9,
      serviceTypeCode: 'REGISTRASI_ASURANSI',
      queueDate: '2026-04-14',
      sourceChannel: 'KIOSK'
    }
  )
})

test('payment method maps to registration service type for non-medic ticket creation', () => {
  assert.equal(resolveKioskaRegistrationServiceTypeFromPaymentMethod('CASH'), 'REGISTRASI')
  assert.equal(
    resolveKioskaRegistrationServiceTypeFromPaymentMethod('ASURANSI'),
    'REGISTRASI_ASURANSI'
  )
})

test('insurance route prefills ASURANSI payment method but general route stays CASH', () => {
  assert.equal(resolveInitialKioskaRegistrationPaymentMethodFromPath('/kioska/global'), 'CASH')
  assert.equal(
    resolveInitialKioskaRegistrationPaymentMethodFromPath('/kioska/global/registration-insurance'),
    'ASURANSI'
  )
})
