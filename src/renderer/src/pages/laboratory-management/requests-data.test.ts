import assert from 'node:assert/strict'
import test from 'node:test'
import { groupServiceRequestsByEncounter, normalizeServiceRequests } from './requests-data'

test('normalizeServiceRequests keeps patient and parent referral details for ancillary encounters', () => {
  const normalized = normalizeServiceRequests(
    [
      {
        id: 101,
        subjectId: 'patient-1',
        encounterId: 'enc-1',
        status: 'active',
        priority: 'routine',
        autheredOn: '2026-04-14T07:00:00.000Z',
        patient: {
          id: 'patient-1',
          name: 'Siti Aminah',
          medicalRecordNumber: 'RM-7788',
          nik: '3173000000000009',
          birthDate: '1992-04-14',
          address: 'Jl. Kenanga No. 5'
        },
        encounter: {
          id: 'enc-1',
          status: 'in_progress',
          queueTicket: {
            formattedQueueNumber: 'A-12'
          },
          partOf: {
            poli: {
              name: 'Poli Anak'
            },
            referrals: [
              {
                referralDate: '2026-04-14T06:00:00.000Z',
                referringPractitioner: {
                  namaLengkap: 'dr. Rujukan'
                },
                diagnosisText: 'Demam',
                conditionAtTransfer: 'Stabil',
                reasonForReferral: 'Butuh pemeriksaan lab'
              }
            ]
          }
        },
        categories: [{ code: 'LABORATORY' }],
        codes: [{ code: 'HB', display: 'Hemoglobin' }]
      }
    ],
    'LABORATORY'
  )

  assert.equal(normalized.length, 1)
  assert.deepEqual(normalized[0].patient, {
    name: 'Siti Aminah',
    mrn: 'RM-7788',
    medicalRecordNumber: 'RM-7788',
    nik: '3173000000000009',
    birthDate: '1992-04-14',
    address: 'Jl. Kenanga No. 5'
  })
  assert.equal(normalized[0].sourcePoliName, 'Poli Anak')
  assert.deepEqual(normalized[0].referrals, [
    {
      referralDate: '2026-04-14T06:00:00.000Z',
      createdAt: undefined,
      referringPractitionerName: 'dr. Rujukan',
      diagnosisText: 'Demam',
      conditionAtTransfer: 'Stabil',
      reasonForReferral: 'Butuh pemeriksaan lab'
    }
  ])
})

test('groupServiceRequestsByEncounter carries patient and referral summaries to the encounter row', () => {
  const groups = groupServiceRequestsByEncounter([
    {
      id: '101',
      patientId: 'patient-1',
      encounterId: 'enc-1',
      patient: {
        name: 'Siti Aminah',
        mrn: 'RM-7788',
        medicalRecordNumber: 'RM-7788',
        nik: '3173000000000009',
        birthDate: '1992-04-14',
        address: 'Jl. Kenanga No. 5'
      },
      queueTicket: {
        number: 'A-12'
      },
      requestedAt: '2026-04-14T07:00:00.000Z',
      test: {
        code: 'HB',
        display: 'Hemoglobin',
        name: 'Hemoglobin',
        category: 'LABORATORY'
      },
      testDisplay: 'Hemoglobin',
      testCodeId: 'HB',
      priority: 'ROUTINE',
      status: 'ACTIVE',
      statusRaw: 'active',
      encounterStatus: 'IN_PROGRESS',
      referrals: [
        {
          referralDate: '2026-04-14T06:00:00.000Z',
          referringPractitionerName: 'dr. Rujukan'
        }
      ],
      sourcePoliName: 'Poli Anak'
    }
  ])

  assert.equal(groups.length, 1)
  assert.equal(groups[0].queueNumber, 'A-12')
  assert.equal(groups[0].sourcePoliName, 'Poli Anak')
  assert.equal(groups[0].referrals?.[0]?.referringPractitionerName, 'dr. Rujukan')
  assert.equal(groups[0].patient.address, 'Jl. Kenanga No. 5')
})
