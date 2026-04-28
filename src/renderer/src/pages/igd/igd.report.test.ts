import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildIgdDailyReportExportFileName,
  buildIgdDailyReportExportGroups,
  buildIgdDailyReportExportTitle
} from './igd.report'
import { type IgdDailyReport } from './igd.data'

const report: IgdDailyReport = {
  date: '2026-04-23',
  generatedAt: '2026-04-23T02:00:00.000Z',
  totalPatients: 8,
  shiftTotals: [
    { key: 'morning', label: 'Shift Pagi', startTime: '07:00', endTime: '14:00', totalPatients: 3 },
    { key: 'afternoon', label: 'Shift Siang', startTime: '14:00', endTime: '21:00', totalPatients: 2 },
    { key: 'night', label: 'Shift Malam', startTime: '21:00', endTime: '07:00', totalPatients: 3 }
  ],
  caseTypeSummary: [
    { key: 'trauma', label: 'Trauma', value: 'Placeholder', note: 'Klasifikasi belum diaktifkan' },
    {
      key: 'non-trauma',
      label: 'Non-Trauma',
      value: 'Placeholder',
      note: 'Klasifikasi belum diaktifkan'
    }
  ]
}

test('buildIgdDailyReportExportGroups separates report content by shift', () => {
  const groups = buildIgdDailyReportExportGroups(report)

  assert.equal(groups.length, 3)
  assert.deepEqual(groups[0], {
    shift: 'Shift Pagi',
    timeRange: '07:00-14:00',
    totalPatients: '3',
    details: [
      {
        metric: 'Total Pasien Datang',
        value: '3'
      },
      {
        metric: 'Trauma',
        value: 'Placeholder',
        note: 'Klasifikasi belum diaktifkan'
      },
      {
        metric: 'Non-Trauma',
        value: 'Placeholder',
        note: 'Klasifikasi belum diaktifkan'
      }
    ]
  })
  assert.equal(groups[2]?.details[2]?.metric, 'Non-Trauma')
})

test('buildIgdDailyReportExportTitle and file name use report date', () => {
  assert.equal(
    buildIgdDailyReportExportTitle(report),
    'Laporan Harian IGD\nTanggal 23/04/2026\nTotal Pasien 8'
  )
  assert.equal(buildIgdDailyReportExportFileName(report), 'laporan-igd-2026-04-23')
})
