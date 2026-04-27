import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRawatInapAdmissionCommand,
  createRawatInapAdmissionBedOptions,
  createDefaultRawatInapAdmissionForm
} from './rawat-inap.admisi'

test('createDefaultRawatInapAdmissionForm does not prefill clinical dummy values', () => {
  const form = createDefaultRawatInapAdmissionForm()

  assert.equal(form.practitionerId, '')
  assert.equal(form.diagnosisCode, '')
  assert.equal(form.diagnosisText, '')
  assert.equal(form.indication, '')
})

test('buildRawatInapAdmissionCommand maps form state to backend command', () => {
  const form = {
    ...createDefaultRawatInapAdmissionForm(),
    patientId: 'patient-1',
    source: 'igd' as const,
    sourceEncounterId: 'igd-encounter-1',
    serviceUnitId: 'service-ri-1',
    practitionerId: '17',
    admissionDate: '2026-04-22',
    paymentMethod: 'bpjs' as const,
    patientInsuranceId: '33',
    noKartu: '0001234567890',
    noRujukan: '0301R0010426V000142',
    diagnosisCode: 'I10',
    diagnosisText: 'Essential hypertension',
    indication: 'Perlu rawat inap',
    selectedBedId: 'bed-1'
  }

  const command = buildRawatInapAdmissionCommand(form, [
    {
      bedId: 'bed-1',
      bedName: '302-A',
      roomId: 'room-melati-302',
      roomName: 'Melati 302',
      classOfCareCodeId: 'KELAS_1'
    }
  ])

  assert.deepEqual(command, {
    patientId: 'patient-1',
    source: 'igd',
    sourceEncounterId: 'igd-encounter-1',
    serviceUnitId: 'service-ri-1',
    practitionerId: 17,
    paymentMethod: 'bpjs',
    patientInsuranceId: 33,
    admissionDateTime: '2026-04-22T00:00:00.000Z',
    diagnosis: {
      code: 'I10',
      text: 'Essential hypertension'
    },
    indication: 'Perlu rawat inap',
    sep: {
      noKartu: '0001234567890',
      noRujukan: '0301R0010426V000142',
      kelasRawatHak: 'KELAS_1'
    },
    placement: {
      roomCodeId: 'room-melati-302',
      bedCodeId: 'bed-1',
      classOfCareCodeId: 'KELAS_1'
    }
  })
})

test('buildRawatInapAdmissionCommand requires source encounter for IGD', () => {
  const form = {
    ...createDefaultRawatInapAdmissionForm(),
    patientId: 'patient-1',
    source: 'igd' as const,
    sourceEncounterId: '',
    selectedBedId: 'bed-1'
  }

  assert.throws(
    () =>
      buildRawatInapAdmissionCommand(form, [
        {
          bedId: 'bed-1',
          bedName: '302-A',
          roomId: 'room-melati-302',
          roomName: 'Melati 302',
          classOfCareCodeId: 'KELAS_1'
        }
      ]),
    /Encounter asal IGD wajib diisi/
  )
})

test('buildRawatInapAdmissionCommand omits SEP for non-BPJS guarantor', () => {
  const form = {
    ...createDefaultRawatInapAdmissionForm(),
    patientId: 'patient-1',
    paymentMethod: 'cash' as const,
    patientInsuranceId: '',
    noKartu: '',
    diagnosisCode: 'J18.9',
    diagnosisText: 'Pneumonia, unspecified',
    indication: 'Perlu observasi rawat inap',
    selectedBedId: 'bed-1'
  }

  const command = buildRawatInapAdmissionCommand(form, [
    {
      bedId: 'bed-1',
      bedName: '302-A',
      roomId: 'room-melati-302',
      roomName: 'Melati 302',
      classOfCareCodeId: 'KELAS_1'
    }
  ])

  assert.equal(command.paymentMethod, 'cash')
  assert.equal(command.patientInsuranceId, undefined)
  assert.equal(command.sep, undefined)
})

test('createRawatInapAdmissionBedOptions excludes IGD rooms from target placement', () => {
  const options = createRawatInapAdmissionBedOptions({
    generatedAt: '2026-04-27T09:00:00.000Z',
    summary: {
      totalRooms: 2,
      totalBeds: 2,
      occupiedBeds: 0,
      availableBeds: 2,
      cleaningBeds: 0
    },
    wards: [
      {
        roomId: 'room-igd-resus',
        roomName: 'IGD-RESUS',
        floor: '1',
        classLabel: 'IGD_RESUS',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-igd-1',
            bedName: 'R-01',
            status: 'TERSEDIA',
            roomId: 'room-igd-resus',
            roomName: 'IGD-RESUS',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-melati-302',
        roomName: 'Melati 302',
        floor: '3',
        classLabel: 'KELAS_1',
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

  assert.deepEqual(
    options.map((option) => option.bedId),
    ['bed-melati-302-a']
  )
})
