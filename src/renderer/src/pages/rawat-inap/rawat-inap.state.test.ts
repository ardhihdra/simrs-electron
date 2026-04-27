import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createRawatInapStateFromBedMapSnapshot,
  createRawatInapInitialState,
  getRoomsForWard,
  getWardOccupancy,
  selectWard,
  submitWardTransfer
} from './rawat-inap.state.ts'

const backendSnapshot = {
  generatedAt: '2026-04-24T09:00:00.000Z',
  summary: {
    totalRooms: 2,
    totalBeds: 3,
    occupiedBeds: 1,
    availableBeds: 1,
    cleaningBeds: 1
  },
  wards: [
    {
      roomId: 'room-melati',
      roomName: 'Melati',
      floor: '3',
      classLabel: 'Kelas 1',
      capacity: 2,
      occupancy: {
        occupied: 1,
        total: 2,
        percentage: 50
      },
      beds: [
        {
          bedId: 'bed-1',
          bedName: '302-A',
          status: 'TERISI',
          roomId: 'room-melati',
          roomName: 'Melati',
          patient: {
            encounterId: 'enc-1',
            patientId: 'patient-1',
            medicalRecordNumber: 'RM-001',
            patientName: 'Hasan Basri',
            gender: 'male',
            ageLabel: '45 th',
            dpjpName: 'dr. Andi, Sp.PD',
            diagnosisSummary: 'Pneumonia komunitas',
            admissionDateTime: '2026-04-22T08:00:00.000Z',
            lengthOfStayLabel: '2 hari',
            paymentLabel: 'BPJS - BPJS Kesehatan',
            vitalSigns: {
              systolicBp: '118',
              diastolicBp: '78',
              heartRate: '82',
              respiratoryRate: null,
              temperature: '36.7',
              oxygenSaturation: '98'
            }
          }
        },
        {
          bedId: 'bed-2',
          bedName: '302-B',
          status: 'TERSEDIA',
          roomId: 'room-melati',
          roomName: 'Melati',
          patient: null
        }
      ]
    },
    {
      roomId: 'room-icu',
      roomName: 'ICU',
      floor: '2',
      classLabel: 'Intensive',
      capacity: 1,
      occupancy: {
        occupied: 0,
        total: 1,
        percentage: 0
      },
      beds: [
        {
          bedId: 'bed-icu-1',
          bedName: 'ICU-01',
          status: 'PEMELIHARAAN',
          roomId: 'room-icu',
          roomName: 'ICU',
          patient: null
        }
      ]
    }
  ]
} as const

test('selectWard updates the active ward and picks a bed in that ward', () => {
  const initialState = createRawatInapInitialState()
  const nextState = selectWard(initialState, { wardId: 'bangsal-mawar' })

  assert.equal(nextState.activeWardId, 'bangsal-mawar')
  assert.equal(nextState.selectedBedId?.startsWith('mawar'), true)
})

test('submitWardTransfer frees the source bed and occupies the target bed', () => {
  const initialState = createRawatInapInitialState()
  const nextState = submitWardTransfer(initialState, {
    sourceBedId: 'melati-302-b',
    targetWardId: 'bangsal-mawar',
    targetBedId: 'mawar-101-a',
    transferReason: 'upgrade',
    transferNote: 'Naik kelas'
  })

  assert.equal(nextState.beds.find((bed) => bed.id === 'melati-302-b')?.status, 'available')
  assert.equal(nextState.beds.find((bed) => bed.id === 'mawar-101-a')?.status, 'occupied')
})

test('createRawatInapStateFromBedMapSnapshot maps backend wards, beds, and patient detail', () => {
  const state = createRawatInapStateFromBedMapSnapshot(backendSnapshot)

  assert.equal(state.activeWardId, 'bangsal-melati')
  assert.equal(state.selectedBedId, 'bed-1')
  assert.equal(state.wards[0]?.name, 'Melati')
  assert.equal(state.beds[0]?.status, 'occupied')
  assert.equal(state.beds[1]?.status, 'available')
  assert.equal(state.beds[2]?.status, 'cleaning')
  assert.equal(state.patients[0]?.name, 'Hasan Basri')
  assert.equal(state.patients[0]?.diagnosis, 'Pneumonia komunitas')
  assert.equal(state.patients[0]?.payor, 'BPJS - BPJS Kesehatan')
  assert.deepEqual(state.patients[0]?.vitalSignSummary, [
    { label: 'TD', value: '118/78' },
    { label: 'HR', value: '82' },
    { label: 'Suhu', value: '36.7' },
    { label: 'SpO2', value: '98' }
  ])
})

test('createRawatInapStateFromBedMapSnapshot groups rooms with the same prefix into one bangsal', () => {
  const state = createRawatInapStateFromBedMapSnapshot({
    generatedAt: '2026-04-27T09:00:00.000Z',
    summary: {
      totalRooms: 3,
      totalBeds: 4,
      occupiedBeds: 1,
      availableBeds: 2,
      cleaningBeds: 1
    },
    wards: [
      {
        roomId: 'room-melati-302',
        roomName: 'Melati 302',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 2,
        occupancy: { occupied: 1, total: 2, percentage: 50 },
        beds: [
          {
            bedId: 'bed-melati-302-a',
            bedName: '302-A',
            status: 'TERISI',
            roomId: 'room-melati-302',
            roomName: 'Melati 302',
            patient: {
              encounterId: 'enc-1',
              patientId: 'patient-1',
              medicalRecordNumber: 'RM-001',
              patientName: 'Hasan Basri',
              gender: 'male',
              ageLabel: '45 th',
              dpjpName: 'dr. Andi, Sp.PD',
              diagnosisSummary: 'Pneumonia komunitas',
              admissionDateTime: '2026-04-22T08:00:00.000Z',
              lengthOfStayLabel: '2 hari',
              paymentLabel: 'BPJS',
              vitalSigns: {
                systolicBp: '118',
                diastolicBp: '78',
                heartRate: '82',
                respiratoryRate: null,
                temperature: '36.7',
                oxygenSaturation: '98'
              }
            }
          },
          {
            bedId: 'bed-melati-302-b',
            bedName: '302-B',
            status: 'TERSEDIA',
            roomId: 'room-melati-302',
            roomName: 'Melati 302',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-melati-303',
        roomName: 'Melati 303',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-melati-303-a',
            bedName: '303-A',
            status: 'TERSEDIA',
            roomId: 'room-melati-303',
            roomName: 'Melati 303',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-icu-01',
        roomName: 'ICU-01',
        floor: '2',
        classLabel: 'Intensive',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-icu-01',
            bedName: 'ICU-01',
            status: 'PEMELIHARAAN',
            roomId: 'room-icu-01',
            roomName: 'ICU-01',
            patient: null
          }
        ]
      }
    ]
  })

  assert.equal(state.wards.length, 2)
  assert.equal(state.wards[0]?.id, 'bangsal-melati')
  assert.equal(state.wards[0]?.name, 'Melati')
  assert.equal(state.wards[0]?.totalBeds, 3)
  assert.deepEqual(getWardOccupancy(state, 'bangsal-melati'), {
    occupiedBeds: 1,
    totalBeds: 3
  })
  assert.deepEqual(
    getRoomsForWard(state, 'bangsal-melati').map((room) => room.roomNo),
    ['302', '303']
  )
  assert.equal(state.beds.find((bed) => bed.id === 'bed-melati-302-a')?.roomId, 'room-melati-302')
  assert.equal(state.wards[1]?.id, 'bangsal-icu')
})

test('createRawatInapStateFromBedMapSnapshot groups all IGD rooms into one bangsal', () => {
  const state = createRawatInapStateFromBedMapSnapshot({
    generatedAt: '2026-04-27T09:00:00.000Z',
    summary: {
      totalRooms: 3,
      totalBeds: 3,
      occupiedBeds: 0,
      availableBeds: 3,
      cleaningBeds: 0
    },
    wards: [
      {
        roomId: 'room-igd-01',
        roomName: 'IGD-01',
        floor: '1',
        classLabel: 'IGD',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-igd-01',
            bedName: 'IGD-01-A',
            status: 'TERSEDIA',
            roomId: 'room-igd-01',
            roomName: 'IGD-01',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-ruang-igd-02',
        roomName: 'Ruang IGD 02',
        floor: '1',
        classLabel: 'IGD',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-igd-02',
            bedName: 'IGD-02-A',
            status: 'TERSEDIA',
            roomId: 'room-ruang-igd-02',
            roomName: 'Ruang IGD 02',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-melati-302',
        roomName: 'Melati 302',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-melati-302-a',
            bedName: '302-A',
            status: 'TERSEDIA',
            roomId: 'room-melati-302',
            roomName: 'Melati 302',
            patient: null
          }
        ]
      }
    ]
  })

  assert.equal(state.wards.length, 2)
  assert.equal(state.wards[0]?.id, 'bangsal-igd')
  assert.equal(state.wards[0]?.name, 'IGD')
  assert.equal(state.wards[0]?.totalBeds, 2)
  assert.deepEqual(getWardOccupancy(state, 'bangsal-igd'), {
    occupiedBeds: 0,
    totalBeds: 2
  })
  assert.deepEqual(
    getRoomsForWard(state, 'bangsal-igd').map((room) => room.roomNo),
    ['IGD-01', 'IGD-02']
  )
  assert.equal(state.beds.find((bed) => bed.id === 'bed-igd-02')?.wardId, 'bangsal-igd')
})
