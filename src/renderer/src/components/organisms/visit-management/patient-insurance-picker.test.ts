import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPatientInsuranceLabel,
  filterPatientInsuranceRows,
  normalizePatientInsuranceRows
} from './patient-insurance-picker'

test('normalizePatientInsuranceRows reads rows from createCrudRoutes listAll shape', () => {
  const result = normalizePatientInsuranceRows({
    data: {
      data: [
        {
          id: 11,
          patientId: 'patient-1',
          mitraId: 7,
          mitraCodeNumber: 'BPJS-001',
          mitraCodeExpiredDate: '2027-02-01'
        }
      ]
    }
  })

  assert.deepEqual(result, [
    {
      id: 11,
      patientId: 'patient-1',
      mitraId: 7,
      mitraCodeNumber: 'BPJS-001',
      mitraCodeExpiredDate: '2027-02-01',
      isActive: undefined
    }
  ])
})

test('normalizePatientInsuranceRows reads rows from direct success-data array shape', () => {
  const result = normalizePatientInsuranceRows({
    success: true,
    data: [
      {
        id: 21,
        patientId: 'patient-2',
        mitraId: 9,
        mitraCodeNumber: 'CARD-21',
        mitraCodeExpiredDate: '2026-12-31T00:00:00.000Z',
        isActive: true
      }
    ]
  } as any)

  assert.deepEqual(result, [
    {
      id: 21,
      patientId: 'patient-2',
      mitraId: 9,
      mitraCodeNumber: 'CARD-21',
      mitraCodeExpiredDate: '2026-12-31T00:00:00.000Z',
      isActive: true
    }
  ])
})

test('filterPatientInsuranceRows prefers the selected mitra when present', () => {
  const rows = [
    { id: 1, mitraId: 3, mitraCodeNumber: 'A' },
    { id: 2, mitraId: 4, mitraCodeNumber: 'B' }
  ]

  assert.deepEqual(filterPatientInsuranceRows(rows, [3, 4], 4), [
    { id: 2, mitraId: 4, mitraCodeNumber: 'B' }
  ])
})

test('buildPatientInsuranceLabel shows mitra, number, and expiry in one line', () => {
  const label = buildPatientInsuranceLabel(
    {
      id: 1,
      mitraId: 99,
      mitraCodeNumber: '000123456789',
      mitraCodeExpiredDate: '2027-02-01'
    },
    {
      99: 'BPJS Kesehatan'
    }
  )

  assert.equal(label, 'BPJS Kesehatan - Nomor: 000123456789 - Exp: 01 Feb 2027')
})
