import assert from 'node:assert/strict'
import test from 'node:test'

import { getScanMrnSubmitDecision, hasMatchedPatientForMrn } from './step-scan-mrn-logic.ts'

test('returns empty error when MRN has not been filled', () => {
  const decision = getScanMrnSubmitDecision({
    mrn: '   ',
    matchedPatient: null,
    isResolvingPatient: false
  })

  assert.equal(decision, 'error_empty')
})

test('waits while patient lookup is still resolving', () => {
  const decision = getScanMrnSubmitDecision({
    mrn: '123456',
    matchedPatient: null,
    isResolvingPatient: true
  })

  assert.equal(decision, 'wait')
})

test('advances when a patient match already exists for the current MRN', () => {
  const decision = getScanMrnSubmitDecision({
    mrn: '123456',
    matchedPatient: {
      medicalRecordNumber: '123456'
    },
    isResolvingPatient: false
  })

  assert.equal(decision, 'advance')
})

test('returns not found when lookup is settled without a patient match', () => {
  const decision = getScanMrnSubmitDecision({
    mrn: '999999',
    matchedPatient: null,
    isResolvingPatient: false
  })

  assert.equal(decision, 'error_not_found')
})

test('only treats a matched patient as valid for the same normalized MRN', () => {
  assert.equal(
    hasMatchedPatientForMrn(' 123456 ', {
      medicalRecordNumber: '123456'
    }),
    true
  )

  assert.equal(
    hasMatchedPatientForMrn('123456', {
      medicalRecordNumber: '654321'
    }),
    false
  )
})
