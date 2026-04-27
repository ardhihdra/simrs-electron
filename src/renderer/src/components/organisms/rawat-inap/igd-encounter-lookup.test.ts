import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildIgdEncounterLookupQuery,
  normalizeIgdEncounterLookupRows
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
          medicalRecordNumber: 'RM-001'
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
  assert.equal(rows[0]?.practitionerName, 'dr. Sari')
  assert.equal(rows[0]?.queueNumber, 'IGD-001')
  assert.equal(rows[0]?.serviceUnitName, 'IGD')
})
