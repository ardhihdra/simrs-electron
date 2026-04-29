import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeInpatientPatientListResponse } from './encounter.schemas'

test('normalizeInpatientPatientListResponse extracts result payload', () => {
  const result = normalizeInpatientPatientListResponse({
    success: true,
    result: {
      generatedAt: '2026-04-25T09:00:00.000Z',
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      statusCounts: { PLANNED: 0, IN_PROGRESS: 0, FINISHED: 0 },
    },
  })
  assert.deepEqual(result, {
    generatedAt: '2026-04-25T09:00:00.000Z',
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    statusCounts: { PLANNED: 0, IN_PROGRESS: 0, FINISHED: 0 },
  })
})

test('normalizeInpatientPatientListResponse throws when result is missing', () => {
  assert.throws(
    () => normalizeInpatientPatientListResponse({ success: true }),
    /Invalid inpatient patient list response/,
  )
})
