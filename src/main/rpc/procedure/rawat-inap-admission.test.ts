import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRawatInapAdmissionResponse } from './rawat-inap-admission'

test('normalizeRawatInapAdmissionResponse extracts data payload', () => {
  const result = normalizeRawatInapAdmissionResponse({
    success: true,
    data: {
      encounterId: 'encounter-1',
      sepId: 'sep-1',
      conditionId: 'condition-1',
      accommodationAssignmentId: 'assignment-1',
      status: 'IN_PROGRESS'
    }
  })

  assert.deepEqual(result, {
    encounterId: 'encounter-1',
    sepId: 'sep-1',
    conditionId: 'condition-1',
    accommodationAssignmentId: 'assignment-1',
    status: 'IN_PROGRESS'
  })
})

test('normalizeRawatInapAdmissionResponse throws backend error message', () => {
  assert.throws(
    () =>
      normalizeRawatInapAdmissionResponse({
        success: false,
        message: 'Bed is not available'
      }),
    /Bed is not available/
  )
})
