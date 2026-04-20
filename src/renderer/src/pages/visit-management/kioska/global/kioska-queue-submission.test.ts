import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createKioskaQueuePayload,
  createKioskaRegistrationTicketPayload,
  resolveKioskaQueueSummaryMode,
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

test('new patient going to pendaftaran keeps registration ticket summary mode', () => {
  assert.equal(
    resolveKioskaQueueSummaryMode({
      location: {
        id: 9,
        code: 'RJ',
        name: 'Rawat Jalan'
      },
      paymentMethod: 'CASH',
      hasMrn: false,
      newPatientRoute: 'pendaftaran',
      mrn: '',
      matchedPatient: null,
      poli: null,
      selectedDoctor: null
    }),
    'registration_ticket'
  )
})

test('new patient choosing poli uses queue summary mode instead of registration ticket', () => {
  assert.equal(
    resolveKioskaQueueSummaryMode({
      location: {
        id: 9,
        code: 'RJ',
        name: 'Rawat Jalan'
      },
      paymentMethod: 'CASH',
      hasMrn: false,
      newPatientRoute: 'poli',
      mrn: '',
      matchedPatient: null,
      poli: {
        id: 3,
        name: 'Poli Umum'
      },
      selectedDoctor: {
        doctorId: 12,
        doctorName: 'dr. Ani',
        doctorScheduleId: 30,
        poliId: 3,
        poliName: 'Poli Umum'
      }
    }),
    'queue'
  )
})

test('queue payload for patient without MRN and choosing poli omits patient linkage fields', () => {
  assert.deepEqual(
    createKioskaQueuePayload({
      queueDate: '2026-04-14T07:00:00.000Z',
      paymentMethod: 'CASH',
      rawatJalan: {
        location: {
          id: 9,
          code: 'RJ',
          name: 'Rawat Jalan'
        },
        paymentMethod: 'CASH',
        hasMrn: false,
        newPatientRoute: 'poli',
        mrn: '',
        matchedPatient: null,
        poli: {
          id: 3,
          name: 'Poli Umum'
        },
        selectedDoctor: {
          doctorId: 12,
          doctorName: 'dr. Ani',
          doctorScheduleId: 30,
          poliId: 3,
          poliName: 'Poli Umum'
        }
      }
    }),
    {
      queueDate: '2026-04-14T07:00:00.000Z',
      visitDate: '2026-04-14T07:00:00.000Z',
      practitionerId: 12,
      doctorScheduleId: 30,
      registrationType: 'OFFLINE',
      paymentMethod: 'CASH',
      reason: 'Registrasi Kioska'
    }
  )
})

test('queue payload for patient with MRN keeps patient linkage and notes', () => {
  assert.deepEqual(
    createKioskaQueuePayload({
      queueDate: '2026-04-14T07:00:00.000Z',
      paymentMethod: 'ASURANSI',
      rawatJalan: {
        location: {
          id: 9,
          code: 'RJ',
          name: 'Rawat Jalan'
        },
        paymentMethod: 'ASURANSI',
        hasMrn: true,
        newPatientRoute: null,
        mrn: '123456',
        matchedPatient: {
          id: 'patient-1',
          medicalRecordNumber: '123456',
          name: 'Budi'
        },
        poli: {
          id: 3,
          name: 'Poli Umum'
        },
        selectedDoctor: {
          doctorId: 12,
          doctorName: 'dr. Ani',
          doctorScheduleId: 30,
          poliId: 3,
          poliName: 'Poli Umum'
        }
      }
    }),
    {
      queueDate: '2026-04-14T07:00:00.000Z',
      visitDate: '2026-04-14T07:00:00.000Z',
      practitionerId: 12,
      doctorScheduleId: 30,
      patientId: 'patient-1',
      registrationType: 'OFFLINE',
      paymentMethod: 'ASURANSI',
      reason: 'Registrasi Kioska',
      notes: 'KIOSKA_MRN:123456'
    }
  )
})
