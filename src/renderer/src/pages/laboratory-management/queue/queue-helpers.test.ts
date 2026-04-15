import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterAndSortQueueEncounters,
  findNextEncounterToServe,
  normalizeEncounterStatus
} from './queue-helpers'

test('normalizeEncounterStatus only accepts supported encounter statuses', () => {
  assert.equal(normalizeEncounterStatus('planned'), 'PLANNED')
  assert.equal(normalizeEncounterStatus('in_progress'), 'IN_PROGRESS')
  assert.equal(normalizeEncounterStatus('unknown'), undefined)
})

test('filterAndSortQueueEncounters filters by status and keeps oldest encounter first', () => {
  const encounters = [
    {
      patientName: 'Pasien Baru',
      status: 'PLANNED',
      createdAt: '2026-04-15T09:00:00.000Z'
    },
    {
      patientName: 'Pasien Lama',
      status: 'PLANNED',
      createdAt: '2026-04-15T07:00:00.000Z'
    },
    {
      patientName: 'Sedang Dilayani',
      status: 'IN_PROGRESS',
      createdAt: '2026-04-15T06:00:00.000Z'
    }
  ]

  const result = filterAndSortQueueEncounters(encounters, { statusFilter: 'PLANNED' })

  assert.deepEqual(
    result.map((item) => item.patientName),
    ['Pasien Lama', 'Pasien Baru']
  )
})

test('findNextEncounterToServe returns the oldest planned encounter', () => {
  const encounters = [
    {
      patientName: 'Sudah Jalan',
      status: 'IN_PROGRESS',
      createdAt: '2026-04-15T06:00:00.000Z'
    },
    {
      patientName: 'Pasien Kedua',
      status: 'PLANNED',
      createdAt: '2026-04-15T08:00:00.000Z'
    },
    {
      patientName: 'Pasien Pertama',
      status: 'PLANNED',
      createdAt: '2026-04-15T07:00:00.000Z'
    }
  ]

  assert.equal(findNextEncounterToServe(encounters)?.patientName, 'Pasien Pertama')
})
