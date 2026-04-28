import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeInpatientPatientListResponse } from './encounter.schemas'

test('normalizeInpatientPatientListResponse extracts result payload', () => {
  const result = normalizeInpatientPatientListResponse({
    success: true,
    result: {
      generatedAt: '2026-04-25T09:00:00.000Z',
      items: [],
    },
  })
  assert.deepEqual(result, {
    generatedAt: '2026-04-25T09:00:00.000Z',
    items: [],
  })
})

test('normalizeInpatientPatientListResponse throws when result is missing', () => {
  assert.throws(
    () => normalizeInpatientPatientListResponse({ success: true }),
    /Invalid inpatient patient list response/,
  )
})
