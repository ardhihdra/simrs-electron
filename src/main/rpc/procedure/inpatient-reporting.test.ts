import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeBorLosToiReportResponse } from './inpatient-reporting'

test('normalizeBorLosToiReportResponse extracts result payload', () => {
  const result = normalizeBorLosToiReportResponse({
    success: true,
    result: {
      generatedAt: '2026-04-10T12:00:00.000Z',
      period: { fromDate: '2026-04-01', toDate: '2026-04-10', dayCount: 10 },
      summary: {
        bor: 84.2,
        alos: 4.3,
        toi: null,
        bto: 5.4,
        totalAdmissions: 127,
        discharges: 0,
        totalBeds: 150,
        occupiedBeds: 126
      },
      wards: [],
      dpjpRows: [],
      dailyBorTrend: [],
      notes: ['TOI belum bisa dihitung.']
    }
  })

  assert.equal(result.summary.bor, 84.2)
  assert.equal(result.summary.toi, null)
  assert.deepEqual(result.notes, ['TOI belum bisa dihitung.'])
})

test('normalizeBorLosToiReportResponse throws when payload is invalid', () => {
  assert.throws(
    () => normalizeBorLosToiReportResponse({ success: true }),
    /Invalid inpatient BOR LOS TOI report response/
  )
})
