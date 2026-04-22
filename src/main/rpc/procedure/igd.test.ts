import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeIgdDashboardResponse, normalizeIgdRegistrationResponse } from './igd'

test('normalizeIgdDashboardResponse extracts result payload', () => {
  const result = normalizeIgdDashboardResponse({
    success: true,
    result: {
      summary: { totalActive: 2 },
      patients: [],
      beds: []
    }
  })

  assert.deepEqual(result, {
    summary: { totalActive: 2 },
    patients: [],
    beds: []
  })
})

test('normalizeIgdRegistrationResponse extracts data payload', () => {
  const result = normalizeIgdRegistrationResponse({
    success: true,
    data: {
      patient: { id: 'patient-1' },
      registration: { queueId: 'queue-1' },
      encounter: { encounterId: 'encounter-1' }
    }
  })

  assert.deepEqual(result, {
    patient: { id: 'patient-1' },
    registration: { queueId: 'queue-1' },
    encounter: { encounterId: 'encounter-1' }
  })
})

test('normalizeIgdRegistrationResponse also accepts result payload', () => {
  const result = normalizeIgdRegistrationResponse({
    success: true,
    result: {
      patient: { id: 'patient-1' },
      registration: { queueId: 'queue-1' },
      encounter: { encounterId: 'encounter-1' }
    }
  })

  assert.deepEqual(result, {
    patient: { id: 'patient-1' },
    registration: { queueId: 'queue-1' },
    encounter: { encounterId: 'encounter-1' }
  })
})

test('normalizeIgdRegistrationResponse throws when payload is missing', () => {
  assert.throws(
    () => normalizeIgdRegistrationResponse({ success: true }),
    /Invalid IGD registration response/
  )
})
