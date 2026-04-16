import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialKioskaGlobalFlowState,
  getNextStepAfterAntrianType,
  getNextStepAfterMrnAnswer,
  kioskaGlobalFlowReducer
} from './kioska-global-flow.ts'
import type { KioskaGlobalFlowState } from './kioska-global-types'

test('rawat jalan now enters payment method step before MRN question', () => {
  assert.equal(getNextStepAfterAntrianType('rawat_jalan'), 'payment_method')
  assert.equal(getNextStepAfterAntrianType('checkin'), 'input_kode_antrian')
})

test('users without MRN go straight to queue confirmation instead of poli flow', () => {
  assert.equal(getNextStepAfterMrnAnswer(true), 'scan_mrn')
  assert.equal(getNextStepAfterMrnAnswer(false), 'ambil_antrian')
})

test('rawat jalan lokasi kerja can be stored in flow state and resets with flow', () => {
  const stateWithLocation = kioskaGlobalFlowReducer(createInitialKioskaGlobalFlowState(), {
    type: 'SET_RAWAT_JALAN_LOCATION',
    location: {
      id: 9,
      code: 'RJ',
      name: 'Rawat Jalan'
    }
  })

  assert.deepEqual(stateWithLocation.rawatJalan.location, {
    id: 9,
    code: 'RJ',
    name: 'Rawat Jalan'
  })

  const resetState = kioskaGlobalFlowReducer(stateWithLocation, { type: 'RESET_FLOW' })
  assert.equal(resetState.rawatJalan.location, null)
})

test('payment method can be stored in flow state and resets with flow', () => {
  const stateWithPaymentMethod = kioskaGlobalFlowReducer(createInitialKioskaGlobalFlowState(), {
    type: 'SET_PAYMENT_METHOD',
    paymentMethod: 'ASURANSI'
  })

  assert.equal(stateWithPaymentMethod.rawatJalan.paymentMethod, 'ASURANSI')

  const resetState = kioskaGlobalFlowReducer(stateWithPaymentMethod, { type: 'RESET_FLOW' })
  assert.equal(resetState.rawatJalan.paymentMethod, null)
})

test('goBack restores the previous step without clearing existing step data', () => {
  const startingState: KioskaGlobalFlowState = {
    ...createInitialKioskaGlobalFlowState(),
    antrianType: 'rawat_jalan' as const,
    step: 'dokter' as const,
    history: ['antrian_type', 'payment_method', 'has_mrn', 'scan_mrn', 'poli'],
    rawatJalan: {
      location: null,
      paymentMethod: 'CASH',
      hasMrn: true,
      mrn: '123456',
      matchedPatient: {
        id: 'patient-1',
        name: 'Budi',
        medicalRecordNumber: '123456'
      },
      poli: {
        id: 10,
        name: 'Poli Umum'
      },
      selectedDoctor: {
        doctorId: 22,
        doctorName: 'dr. Andi',
        doctorScheduleId: 99,
        poliId: 10,
        poliName: 'Poli Umum'
      }
    }
  }

  const nextState = kioskaGlobalFlowReducer(startingState, { type: 'GO_BACK' })

  assert.equal(nextState.step, 'poli')
  assert.deepEqual(nextState.history, ['antrian_type', 'payment_method', 'has_mrn', 'scan_mrn'])
  assert.equal(nextState.rawatJalan.mrn, '123456')
  assert.equal(nextState.rawatJalan.paymentMethod, 'CASH')
  assert.equal(nextState.rawatJalan.selectedDoctor?.doctorScheduleId, 99)
})

test('changing MRN clears downstream rawat jalan selections', () => {
  const startingState: KioskaGlobalFlowState = {
    ...createInitialKioskaGlobalFlowState(),
    antrianType: 'rawat_jalan' as const,
    rawatJalan: {
      location: null,
      paymentMethod: 'CASH',
      hasMrn: true,
      mrn: '111111',
      matchedPatient: {
        id: 'patient-1',
        name: 'Siti',
        medicalRecordNumber: '111111'
      },
      poli: {
        id: 20,
        name: 'Poli Anak'
      },
      selectedDoctor: {
        doctorId: 30,
        doctorName: 'dr. Bunga',
        doctorScheduleId: 40,
        poliId: 20,
        poliName: 'Poli Anak'
      }
    }
  }

  const nextState = kioskaGlobalFlowReducer(startingState, {
    type: 'SET_MRN',
    mrn: '222222'
  })

  assert.equal(nextState.rawatJalan.mrn, '222222')
  assert.equal(nextState.rawatJalan.matchedPatient, null)
  assert.equal(nextState.rawatJalan.poli, null)
  assert.equal(nextState.rawatJalan.selectedDoctor, null)
})

test('changing payment method keeps MRN-related selections intact', () => {
  const startingState: KioskaGlobalFlowState = {
    ...createInitialKioskaGlobalFlowState(),
    antrianType: 'rawat_jalan' as const,
    rawatJalan: {
      location: {
        id: 9,
        code: 'RJ',
        name: 'Rawat Jalan'
      },
      paymentMethod: 'CASH',
      hasMrn: true,
      mrn: '111111',
      matchedPatient: {
        id: 'patient-1',
        name: 'Siti',
        medicalRecordNumber: '111111'
      },
      poli: {
        id: 20,
        name: 'Poli Anak'
      },
      selectedDoctor: {
        doctorId: 30,
        doctorName: 'dr. Bunga',
        doctorScheduleId: 40,
        poliId: 20,
        poliName: 'Poli Anak'
      }
    }
  }

  const nextState = kioskaGlobalFlowReducer(startingState, {
    type: 'SET_PAYMENT_METHOD',
    paymentMethod: 'ASURANSI'
  })

  assert.equal(nextState.rawatJalan.paymentMethod, 'ASURANSI')
  assert.equal(nextState.rawatJalan.mrn, '111111')
  assert.equal(nextState.rawatJalan.matchedPatient?.id, 'patient-1')
  assert.equal(nextState.rawatJalan.poli?.id, 20)
  assert.equal(nextState.rawatJalan.selectedDoctor?.doctorScheduleId, 40)
})

test('resetFlow clears the wizard back to its initial state', () => {
  const dirtyState: KioskaGlobalFlowState = {
    ...createInitialKioskaGlobalFlowState(),
    antrianType: 'checkin' as const,
    step: 'input_kode_antrian' as const,
    history: ['antrian_type'],
    checkin: {
      queueNumber: 'A-001'
    }
  }

  const nextState = kioskaGlobalFlowReducer(dirtyState, { type: 'RESET_FLOW' })

  assert.deepEqual(nextState, createInitialKioskaGlobalFlowState())
})
