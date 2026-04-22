import assert from 'node:assert/strict'
import test from 'node:test'

import { buildConfirmQueueSelectedPatient } from './confirm-queue-patient'

test('builds selected patient from queue patient detail when available', () => {
  const result = buildConfirmQueueSelectedPatient({
    patientId: 'patient-1',
    patient: {
      id: 'patient-1',
      name: 'Budi Santoso',
      nik: '1234567890123456',
      birthDate: '1990-05-10',
      medicalRecordNumber: 'RM-001',
      address: 'Jl. Mawar 10'
    }
  })

  assert.deepEqual(result, {
    id: 'patient-1',
    name: 'Budi Santoso',
    nik: '1234567890123456',
    birthDate: '1990-05-10',
    medicalRecordNumber: 'RM-001',
    address: 'Jl. Mawar 10'
  })
})

test('falls back to queue level fields when patient object is incomplete', () => {
  const result = buildConfirmQueueSelectedPatient({
    patientId: 'patient-2',
    patientName: 'Siti Aminah',
    patientNik: '1111222233334444',
    patientBirthDate: '1995-01-15',
    patientMedicalRecordNumber: 'RM-002',
    patientAddress: 'Jl. Melati 8'
  })

  assert.deepEqual(result, {
    id: 'patient-2',
    name: 'Siti Aminah',
    nik: '1111222233334444',
    birthDate: '1995-01-15',
    medicalRecordNumber: 'RM-002',
    address: 'Jl. Melati 8'
  })
})

test('returns minimal fallback when only patient id exists', () => {
  const result = buildConfirmQueueSelectedPatient({
    patientId: 'patient-3'
  })

  assert.deepEqual(result, {
    id: 'patient-3',
    name: 'Pasien terpilih',
    nik: '-',
    medicalRecordNumber: '-',
    address: 'Alamat belum tersedia'
  })
})

test('returns undefined when queue has no patient id', () => {
  assert.equal(buildConfirmQueueSelectedPatient({}), undefined)
})
