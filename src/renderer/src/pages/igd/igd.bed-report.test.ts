import assert from 'node:assert/strict'
import test from 'node:test'

import { createIgdDashboardFixture } from './igd.data'
import {
  buildIgdBedReportExportFileName,
  buildIgdBedReportExportGroups,
  buildIgdBedReportExportTitle
} from './igd.bed-report'

test('buildIgdBedReportExportGroups summarizes bed availability per zone', () => {
  const groups = buildIgdBedReportExportGroups(createIgdDashboardFixture())

  assert.equal(groups.length, 4)
  assert.deepEqual(groups[0], {
    zone: 'Resusitasi',
    totalBeds: '4',
    occupiedBeds: '1',
    availableBeds: '3',
    cleaningBeds: '0',
    details: [
      {
        bedCode: 'R-01',
        status: 'Terisi',
        patientName: 'TIDAK DIKENAL',
        registrationNumber: 'IGD-2604-001',
        triageLevel: 'L0'
      },
      {
        bedCode: 'R-02',
        status: 'Kosong',
        patientName: '-',
        registrationNumber: '-',
        triageLevel: '-'
      },
      {
        bedCode: 'R-03',
        status: 'Kosong',
        patientName: '-',
        registrationNumber: '-',
        triageLevel: '-'
      },
      {
        bedCode: 'R-04',
        status: 'Kosong',
        patientName: '-',
        registrationNumber: '-',
        triageLevel: '-'
      }
    ]
  })
  assert.equal(groups[1]?.cleaningBeds, '1')
  assert.equal(groups[1]?.details[0]?.patientName, 'Sutrisno Hadi')
})

test('buildIgdBedReportExportTitle and file name use bed wording', () => {
  const dashboard = createIgdDashboardFixture()

  assert.equal(
    buildIgdBedReportExportTitle(dashboard, '2026-04-24'),
    'Laporan Bed IGD\nTanggal 24/04/2026\nTotal Bed 14'
  )
  assert.equal(buildIgdBedReportExportFileName('2026-04-24'), 'laporan-bed-igd-2026-04-24')
})
