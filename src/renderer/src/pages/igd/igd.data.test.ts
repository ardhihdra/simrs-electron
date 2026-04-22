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
    name: 'Sutrisno Hadi'
  } as PatientAttributes

  const payload = buildIgdRegistrationCommand({
    mode: 'existing',
    draft: createDraft(),
    selectedPatient
  })

  assert.equal(payload.patientType, 'existing')
  assert.equal(payload.patientId, 'patient-existing-1')
  assert.equal(payload.patientData, undefined)
})

test('buildIgdRegistrationCommand maps new patient mode to create-patient payload', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'baru',
    draft: createDraft()
  })

  assert.equal(payload.patientType, 'new')
  assert.equal(payload.patientData?.name, 'Sutrisno Hadi')
  assert.equal(payload.patientData?.gender, 'male')
  assert.equal(payload.patientData?.birthDate, '1988-04-21')
  assert.equal(payload.patientData?.needEmr, true)
  assert.equal(payload.guarantor?.name, 'Sri Wahyuni')
})

test('buildIgdRegistrationCommand maps temporary patient mode to minimal payload', () => {
  const payload = buildIgdRegistrationCommand({
    mode: 'temporary',
    draft: {
      ...createDraft(),
      name: '',
      gender: '?',
      estimatedAge: '~45'
    }
  })

  assert.equal(payload.patientType, 'temporary')
  assert.equal(payload.patientData?.name, '')
  assert.equal(payload.patientData?.gender, '?')
  assert.equal(payload.patientData?.estimatedAge, '~45')
  assert.equal(payload.patientData?.birthDate, undefined)
})

test('buildIgdRegistrationCommand rejects existing mode without selected patient', () => {
  assert.throws(
    () =>
      buildIgdRegistrationCommand({
        mode: 'existing' as IgdRegistrationMode,
        draft: createDraft()
      }),
    /Pilih pasien terlebih dahulu/
  )
})
