import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDoctorFilterOptions,
  buildPublicQueueSummaries,
  getPatientInitials,
  getQueueLabel,
  getSelectedDoctorValue,
  type MonitorQueueTicket
} from './encounter-monitor.helpers.ts'

test('getQueueLabel prefers formatted queue number when available', () => {
  assert.equal(
    getQueueLabel({
      formattedQueueNumber: 'A-017',
      queueNumber: 17,
      poliName: 'Poli Anak'
    }),
    'A-017'
  )

  assert.equal(
    getQueueLabel({
      formattedQueueNumber: 'A-017'
    }),
    'A-017'
  )
})

test('getQueueLabel falls back to numeric queue number and pads it', () => {
  assert.equal(
    getQueueLabel({
      poliName: 'Poli Anak',
      queueNumber: 9
    }),
    '009'
  )

  assert.equal(
    getQueueLabel({
      poliName: 'Poli Mata',
      queueNumber: { value: 24 }
    }),
    '024'
  )
})

test('getQueueLabel extracts digits from formatted queue string when needed', () => {
  assert.equal(
    getQueueLabel({
      formattedQueueNumber: 'POLI-A / 21'
    }),
    'POLI-A / 21'
  )
})

test('getPatientInitials builds initials for public display', () => {
  assert.equal(getPatientInitials('Budi Santoso'), 'BS')
  assert.equal(getPatientInitials('Siti'), 'SI')
  assert.equal(getPatientInitials('  '), '--')
  assert.equal(getPatientInitials(undefined), '--')
})

test('buildPublicQueueSummaries groups tickets and picks active plus next queue', () => {
  const tickets: MonitorQueueTicket[] = [
    {
      id: '1',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      queueNumber: 1,
      status: 'COMPLETED',
      patient: { name: 'Agus Setiawan' }
    },
    {
      id: '2',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      queueNumber: 2,
      status: 'CHECKED_IN',
      patient: { name: 'Budi Santoso' }
    },
    {
      id: '3',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      queueNumber: 3,
      status: 'WAITING',
      patient: { name: 'Cici Amelia' }
    },
    {
      id: '4',
      poliCodeId: 'poli-b',
      poliName: 'Poli Gigi',
      practitionerId: '202',
      doctorName: 'dr. Rahma',
      formattedQueueNumber: 'G-010',
      status: 'RESERVED',
      patient: { name: 'Deni Saputra' }
    }
  ]

  const summaries = buildPublicQueueSummaries(tickets)

  assert.equal(summaries.length, 2)
  assert.deepEqual(summaries[0], {
    key: 'poli-a-101-',
    poli: 'Poli Anak',
    doctor: 'dr. Nabila',
    practitionerId: '101',
    currentQueueLabel: '002',
    nextQueueLabel: '003',
    patientInitials: 'BS',
    remainingCount: 1,
    handledCount: 1,
    isActive: true
  })
  assert.deepEqual(summaries[1], {
    key: 'poli-b-202-',
    poli: 'Poli Gigi',
    doctor: 'dr. Rahma',
    practitionerId: '202',
    currentQueueLabel: '-',
    nextQueueLabel: 'G-010',
    patientInitials: '--',
    remainingCount: 1,
    handledCount: 0,
    isActive: false
  })
})

test('buildPublicQueueSummaries infers handled count from lower queue numbers when needed', () => {
  const summaries = buildPublicQueueSummaries([
    {
      id: '1',
      poliCodeId: 'poli-a',
      practitionerId: '101',
      queueNumber: 1,
      status: 'SKIPPED'
    },
    {
      id: '2',
      poliCodeId: 'poli-a',
      practitionerId: '101',
      queueNumber: 2,
      status: 'IN_PROGRESS'
    },
    {
      id: '3',
      poliCodeId: 'poli-a',
      practitionerId: '101',
      queueNumber: 3,
      status: 'WAITING'
    }
  ])

  assert.equal(summaries[0]?.handledCount, 1)
  assert.equal(summaries[0]?.remainingCount, 1)
})

test('buildPublicQueueSummaries prefers the latest active queue and treats older active queue as handled', () => {
  const summaries = buildPublicQueueSummaries([
    {
      id: '1',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      formattedQueueNumber: 'A-001',
      queueNumber: 1,
      status: 'CALLED',
      patient: { name: 'Agus Setiawan' }
    },
    {
      id: '2',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      formattedQueueNumber: 'A-002',
      queueNumber: 2,
      status: 'IN_PROGRESS',
      patient: { name: 'Budi Santoso' }
    },
    {
      id: '3',
      poliCodeId: 'poli-a',
      poliName: 'Poli Anak',
      practitionerId: '101',
      doctorName: 'dr. Nabila',
      formattedQueueNumber: 'A-003',
      queueNumber: 3,
      status: 'WAITING',
      patient: { name: 'Cici Amelia' }
    }
  ])

  assert.equal(summaries[0]?.currentQueueLabel, 'A-002')
  assert.equal(summaries[0]?.patientInitials, 'BS')
  assert.equal(summaries[0]?.nextQueueLabel, 'A-003')
  assert.equal(summaries[0]?.handledCount, 1)
})

test('buildPublicQueueSummaries omits next queue label when there is no next waiting queue', () => {
  const summaries = buildPublicQueueSummaries([
    {
      id: '1',
      poliCodeId: 'poli-b',
      poliName: 'Poli Gigi',
      practitionerId: '202',
      doctorName: 'dr. Rahma',
      queueNumber: 10,
      status: 'IN_PROGRESS',
      patient: { name: 'Deni Saputra' }
    }
  ])

  assert.equal(summaries[0]?.currentQueueLabel, '010')
  assert.equal(summaries[0]?.nextQueueLabel, undefined)
})

test('getSelectedDoctorValue keeps explicit selection and otherwise defaults to active doctor', () => {
  const summaries = [
    {
      key: '1',
      poli: 'Poli Anak',
      doctor: 'dr. Nabila',
      practitionerId: '101',
      currentQueueLabel: 'A-001',
      nextQueueLabel: 'A-002',
      patientInitials: 'BS',
      remainingCount: 2,
      handledCount: 1,
      isActive: false
    },
    {
      key: '2',
      poli: 'Poli Gigi',
      doctor: 'dr. Rahma',
      practitionerId: '202',
      currentQueueLabel: 'G-010',
      nextQueueLabel: undefined,
      patientInitials: 'DS',
      remainingCount: 0,
      handledCount: 4,
      isActive: true
    }
  ]

  assert.equal(getSelectedDoctorValue('101', summaries), '101')
  assert.equal(getSelectedDoctorValue(undefined, summaries), '202')
  assert.equal(getSelectedDoctorValue(undefined, []), undefined)
})

test('buildDoctorFilterOptions creates stable filter values from summaries', () => {
  const options = buildDoctorFilterOptions([
    {
      key: '1',
      poli: 'Poli Anak',
      doctor: 'dr. Nabila',
      practitionerId: '101',
      currentQueueLabel: 'A-001',
      nextQueueLabel: 'A-002',
      patientInitials: 'BS',
      remainingCount: 2,
      handledCount: 1,
      isActive: true
    },
    {
      key: '2',
      poli: 'Poli Gigi',
      doctor: 'dr. Nabila',
      practitionerId: '101',
      currentQueueLabel: '-',
      nextQueueLabel: 'G-010',
      patientInitials: '--',
      remainingCount: 1,
      handledCount: 0,
      isActive: false
    },
    {
      key: '3',
      poli: 'Poli Mata',
      doctor: 'dr. Sinta',
      currentQueueLabel: '-',
      patientInitials: '--',
      remainingCount: 0,
      handledCount: 0,
      isActive: false
    }
  ])

  assert.deepEqual(options, [
    { value: '101', label: 'dr. Nabila (101)' },
    { value: 'name:dr. Sinta', label: 'dr. Sinta' }
  ])
})
