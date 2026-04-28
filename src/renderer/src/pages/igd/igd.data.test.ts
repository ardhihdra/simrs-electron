import assert from 'node:assert/strict'
import test from 'node:test'

import type { PatientAttributes } from 'simrs-types'

import {
  buildIgdRegistrationCommand,
  createIgdDashboardFixture,
  type IgdRegistrationDraft,
  type IgdRegistrationMode
} from './igd.data'

const createDraft = (): IgdRegistrationDraft => ({
  name: 'Sutrisno Hadi',
  nik: '3201010101010001',
  birthDate: '1988-04-21',
  gender: 'L',
  phone: '081234567890',
  estimatedAge: '~50',
  arrivalDateTime: '2026-04-22T10:25',
  arrivalSource: 'Datang sendiri',
  paymentMethod: 'BPJS',
  mitraId: '77',
  complaint: 'Nyeri dada hebat',
  guarantorName: 'Sri Wahyuni',
  guarantorRelationship: 'Suami/Istri',
  guarantorNik: '3201010101010099',
  guarantorPhone: '081200000999'
})

test('createIgdDashboardFixture provides active patients and bed snapshot', () => {
  const fixture = createIgdDashboardFixture()

  assert.equal(fixture.summary.totalActive > 0, true)
  assert.equal(fixture.patients.length > 0, true)
  assert.equal(fixture.beds.length > 0, true)
  assert.equal(fixture.patients[0]?.encounterCode?.startsWith('ENC-'), true)
  assert.equal(fixture.patients[0]?.unitLabel, 'IGD')
  assert.equal(typeof fixture.patients[0]?.genderLabel, 'string')
})

test('buildIgdRegistrationCommand maps existing patient mode to patientId payload', () => {
  const selectedPatient = {
    id: 'patient-existing-1',
    medicalRecordNumber: 'MRN-001',
    name: 'Sutrisno Hadi',
    relatedPerson: [
      {
        name: 'Budi',
        phone: '082222222222',
        relationship: 'Anak'
      },
      {
        name: 'Sri Wahyuni',
        phone: '081200000999',
        relationship: 'Suami/Istri',
        isGuarantor: true
      }
    ]
  } as unknown as PatientAttributes

  const payload = buildIgdRegistrationCommand({
    mode: 'existing',
    draft: createDraft(),
    selectedPatient,
    guarantorSource: 'existing:1',
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.equal(payload.patientType, 'existing')
  assert.equal(payload.patientId, 'patient-existing-1')
  assert.equal(payload.patientData, undefined)
  assert.equal(payload.mitraId, 77)
  assert.deepEqual(payload.guarantor, {
    name: 'Sri Wahyuni',
    phone: '081200000999',
    relationship: 'Suami/Istri'
  })
})

test('buildIgdRegistrationCommand maps new patient mode to create-patient payload', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'baru',
    draft: createDraft(),
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.equal(payload.patientType, 'new')
  assert.equal(payload.patientData?.name, 'Sutrisno Hadi')
  assert.equal(payload.patientData?.gender, 'male')
  assert.equal(payload.patientData?.birthDate, '1988-04-21')
  assert.equal(payload.patientData?.needEmr, true)
  assert.equal(payload.mitraId, 77)
  assert.equal(payload.guarantor?.name, 'Sri Wahyuni')
  assert.deepEqual(payload.patientData?.relatedPerson, [
    {
      name: 'Sri Wahyuni',
      phone: '081200000999',
      relationship: 'Suami/Istri',
      isGuarantor: true
    }
  ])
  assert.equal(payload.quickTriage, undefined)
})

test('buildIgdRegistrationCommand maps temporary patient mode to minimal payload', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'temporary',
    draft: {
      ...createDraft(),
      name: '',
      gender: '?',
      estimatedAge: '~45'
    },
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.equal(payload.patientType, 'temporary')
  assert.equal(payload.patientData?.name, '')
  assert.equal(payload.patientData?.gender, '?')
  assert.equal(payload.patientData?.estimatedAge, '~45')
  assert.equal(payload.patientData?.birthDate, undefined)
  assert.equal(payload.mitraId, 77)
})

test('buildIgdRegistrationCommand rejects existing mode without selected patient', () => {
  assert.throws(
    () =>
      buildIgdRegistrationCommand({
        mode: 'existing' as IgdRegistrationMode,
        draft: createDraft(),
        intent: 'daftar',
        quickCondition: 'l0-critical'
      }),
    /Pilih pasien terlebih dahulu/
  )
})

test('buildIgdRegistrationCommand keeps manual guarantor input when existing patient chooses create new', () => {
  const selectedPatient = {
    id: 'patient-existing-2',
    medicalRecordNumber: 'MRN-002',
    name: 'Wahyu Handayani',
    relatedPerson: [
      {
        name: 'Ibu Wahyu',
        phone: '081299999999',
        relationship: 'Orang Tua',
        isGuarantor: true
      }
    ]
  } as unknown as PatientAttributes

  const payload = buildIgdRegistrationCommand({
    mode: 'existing',
    draft: {
      ...createDraft(),
      guarantorName: 'Penanggung Jawab Baru',
      guarantorRelationship: 'Saudara',
      guarantorPhone: '081211111111'
    },
    selectedPatient,
    guarantorSource: 'new',
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.deepEqual(payload.guarantor, {
    name: 'Penanggung Jawab Baru',
    relationship: 'Saudara',
    nik: '3201010101010099',
    phone: '081211111111'
  })
})

test('buildIgdRegistrationCommand includes quick triage when intent is triase', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'baru',
    draft: createDraft(),
    intent: 'triase',
    quickCondition: 'l1-shock'
  })

  assert.deepEqual(payload.quickTriage, {
    level: 1,
    conditionKey: 'l1-shock',
    effectiveDateTime: '2026-04-22T10:25'
  })
})

test('buildIgdRegistrationCommand omits quick triage when intent is daftar', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'baru',
    draft: createDraft(),
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.equal(payload.quickTriage, undefined)
})

test('buildIgdRegistrationCommand omits mitraId for Umum payment even when stale draft value exists', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'baru',
    draft: {
      ...createDraft(),
      paymentMethod: 'Umum',
      mitraId: '77'
    },
    intent: 'daftar',
    quickCondition: 'l0-critical'
  })

  assert.equal('mitraId' in payload, false)
})
