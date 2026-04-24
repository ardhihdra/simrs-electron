import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assignBedToPatient,
  createIgdInitialState,
  registerIgdPatient,
  savePatientTriage
} from './igd.state.ts'

test('registerIgdPatient prepends a new patient and marks it as temporary when MRN is absent', () => {
  const initialState = createIgdInitialState()

  const nextState = registerIgdPatient(initialState, {
    name: 'Pasien Uji IGD',
    ageLabel: '31 L',
    paymentLabel: 'Umum',
    complaint: 'Nyeri perut akut',
    arrivalSource: 'Datang sendiri',
    hasMedicalRecord: false
  })

  assert.equal(nextState.patients[0]?.name, 'Pasien Uji IGD')
  assert.equal(nextState.patients[0]?.isTemporaryPatient, true)
  assert.equal(nextState.selectedPatientId, nextState.patients[0]?.id)
})

test('assignBedToPatient moves patient to the selected bed and frees the previous bed', () => {
  const initialState = createIgdInitialState()
  const patientId = initialState.patients[3]?.id

  const nextState = assignBedToPatient(initialState, {
    patientId,
    bedCode: 'O-03'
  })

  assert.equal(nextState.patients.find((patient) => patient.id === patientId)?.bedCode, 'O-03')
  assert.equal(nextState.beds.find((bed) => bed.code === 'O-03')?.patientId, patientId)
  assert.equal(nextState.beds.find((bed) => bed.code === 'O-01')?.patientId, null)
})

test('savePatientTriage stores the active section values for the selected patient', () => {
  const initialState = createIgdInitialState()
  const patientId = initialState.selectedPatientId

  const nextState = savePatientTriage(initialState, {
    patientId,
    section: 'primer',
    values: {
      airway: 'Bebas',
      breathing: 'Takipnea ringan',
      circulation: 'Akral hangat'
    }
  })

  assert.deepEqual(nextState.triageForms[patientId]?.primer, {
    airway: 'Bebas',
    breathing: 'Takipnea ringan',
    circulation: 'Akral hangat'
  })
})

