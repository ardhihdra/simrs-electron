import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createPatientLookupQueryInput,
  INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS
} from './patient-lookup-search'

test('patient lookup query input includes birthDate and age when provided', () => {
  assert.deepEqual(
    createPatientLookupQueryInput({
      ...INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS,
      name: ' Budi ',
      birthDate: '2026-04-20',
      age: 30
    }),
    {
      name: 'Budi',
      medicalRecordNumber: undefined,
      address: undefined,
      nik: undefined,
      birthDate: '2026-04-20',
      age: 30
    }
  )
})

test('patient lookup query input omits empty birthDate and invalid age', () => {
  assert.deepEqual(
    createPatientLookupQueryInput({
      ...INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS,
      birthDate: '   ',
      age: -1
    }),
    {
      name: undefined,
      medicalRecordNumber: undefined,
      address: undefined,
      nik: undefined,
      birthDate: undefined,
      age: undefined
    }
  )
})
