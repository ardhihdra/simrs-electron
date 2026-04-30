import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildIgdEncounterLookupQuery,
  buildSourceEncounterLookupQuery,
  normalizeIgdEncounterLookupRows,
  normalizeSourceEncounterLookupRows
} from './igd-encounter-lookup'

test('buildIgdEncounterLookupQuery filters IGD encounters by date, doctor, and patient', () => {
  const query = buildIgdEncounterLookupQuery({
    search: 'IGD-001',
    patient: 'Budi',
    practitionerId: '17',
    dateFrom: '2026-04-01',
    dateTo: '2026-04-27'
  })

  assert.deepEqual(query, {
    depth: 1,
    items: 50,
    serviceType: 'EMER',
    startDate: '2026-04-01',
    endDate: '2026-04-27',
    practitionerId: '17',
    q: 'Budi'
  })
})

test('normalizeIgdEncounterLookupRows keeps only IGD rows and extracts patient and doctor labels', () => {
  const rows = normalizeIgdEncounterLookupRows({
    success: true,
    result: [
      {
        id: 'enc-igd-1',
        encounterType: 'EMER',
        status: 'IN_PROGRESS',
        startTime: '2026-04-27T08:00:00.000Z',
        patient: {
          id: 'patient-1',
          name: 'Budi Santoso',
          medicalRecordNumber: 'RM-001',
          gender: 'male',
          birthDate: '1980-05-10'
        },
        queueTicket: {
          formattedQueueNumber: 'IGD-001',
          practitioner: { namaLengkap: 'dr. Sari' },
          serviceUnit: { display: 'IGD' },
          poli: { name: 'IGD' }
        }
      },
      {
        id: 'enc-amb-1',
        encounterType: 'AMB',
        status: 'IN_PROGRESS',
        patient: { name: 'Rawat Jalan' }
      }
    ]
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.id, 'enc-igd-1')
  assert.equal(rows[0]?.patientName, 'Budi Santoso')
  assert.equal(rows[0]?.patientMrNo, 'RM-001')
  assert.equal(rows[0]?.patientGender, 'male')
  assert.equal(rows[0]?.patientBirthDate, '1980-05-10')
  assert.equal(rows[0]?.practitionerName, 'dr. Sari')
  assert.equal(rows[0]?.queueNumber, 'IGD-001')
  assert.equal(rows[0]?.serviceUnitName, 'IGD')
})

test('normalizeSourceEncounterLookupRows extracts diagnosis and guarantor data', () => {
  const rows = normalizeSourceEncounterLookupRows(
    {
      success: true,
      result: [
        {
          id: 'enc-amb-2',
          encounterType: 'AMB',
          status: 'FINISHED',
          patient: {
            id: 'patient-3',
            name: 'Rina Lestari',
            medicalRecordNumber: 'RM-003'
          },
          queueTicket: {
            paymentMethod: 'BPJS',
            mitraId: 12,
            formattedQueueNumber: 'RJ-002'
          },
          reasonCode: [
            {
              coding: [{ code: 'I10', display: 'Essential hypertension' }],
              text: 'Hipertensi'
            }
          ],
          sep: {
            noSep: '0301R0010426V000777',
            noRujukan: 'RJ-777'
          },
          patientInsurance: {
            id: 33,
            mitraCodeNumber: '0009876543210',
            mitraCodeExpiredDate: '2026-12-31'
          }
        }
      ]
    },
    'AMB'
  )

  assert.equal(rows[0]?.diagnosisCode, 'I10')
  assert.equal(rows[0]?.diagnosisText, 'Essential hypertension')
  assert.equal(rows[0]?.paymentMethod, 'BPJS')
  assert.equal(rows[0]?.patientInsuranceId, '33')
  assert.equal(rows[0]?.mitraId, 12)
  assert.equal(rows[0]?.mitraCodeNumber, '0009876543210')
  assert.equal(rows[0]?.mitraCodeExpiredDate, '2026-12-31')
  assert.equal(rows[0]?.noSep, '0301R0010426V000777')
  assert.equal(rows[0]?.noRujukan, 'RJ-777')
})

test('buildSourceEncounterLookupQuery filters Rawat Jalan encounters by date, doctor, and patient', () => {
  const query = buildSourceEncounterLookupQuery({
    encounterType: 'AMB',
    search: 'RJ-001',
    patient: 'Siti',
    practitionerId: '18',
    dateFrom: '2026-04-01',
    dateTo: '2026-04-27'
  })

  assert.deepEqual(query, {
    depth: 1,
    items: 50,
    serviceType: 'AMB',
    startDate: '2026-04-01',
    endDate: '2026-04-27',
    practitionerId: '18',
    q: 'Siti'
  })
})

test('normalizeSourceEncounterLookupRows keeps only Rawat Jalan rows', () => {
  const rows = normalizeSourceEncounterLookupRows(
    {
      success: true,
      result: [
        {
          id: 'enc-igd-1',
          encounterType: 'EMER',
          status: 'IN_PROGRESS',
          patient: { name: 'Pasien IGD' }
        },
        {
          id: 'enc-amb-1',
          encounterType: 'AMB',
          status: 'FINISHED',
          visitDate: '2026-04-27T09:30:00.000Z',
          patient: {
            id: 'patient-2',
            name: 'Siti Aminah',
            medicalRecordNumber: 'RM-002'
          },
          queueTicket: {
            formattedQueueNumber: 'RJ-001',
            practitioner: { namaLengkap: 'dr. Bima' },
            poli: { name: 'Poli Penyakit Dalam' }
          }
        }
      ]
    },
    'AMB'
  )

  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.id, 'enc-amb-1')
  assert.equal(rows[0]?.patientId, 'patient-2')
  assert.equal(rows[0]?.patientName, 'Siti Aminah')
  assert.equal(rows[0]?.patientMrNo, 'RM-002')
  assert.equal(rows[0]?.practitionerName, 'dr. Bima')
  assert.equal(rows[0]?.queueNumber, 'RJ-001')
  assert.equal(rows[0]?.serviceUnitName, 'Poli Penyakit Dalam')
})
