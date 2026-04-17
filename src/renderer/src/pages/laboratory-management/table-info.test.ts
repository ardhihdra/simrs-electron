import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAncillaryQueuePatientInfoCardData,
  buildPatientInfoCardData,
  buildPatientSummary,
  buildReferralSummary,
  hasReferralSummary
} from './table-info'

test('buildPatientSummary formats requested patient fields including age', () => {
  const summary = buildPatientSummary(
    {
      name: 'Budi Santoso',
      medicalRecordNumber: 'RM-001',
      nik: '3173000000000001',
      birthDate: '1990-04-14',
      address: 'Jl. Melati No. 10'
    },
    '2026-04-14'
  )

  assert.deepEqual(summary, [
    { label: 'Nama', value: 'Budi Santoso' },
    { label: 'No. RM', value: 'RM-001' },
    { label: 'NIK', value: '3173000000000001' },
    { label: 'Umur', value: '36 th' },
    { label: 'Alamat', value: 'Jl. Melati No. 10' }
  ])
})

test('buildPatientInfoCardData maps available ancillary patient fields into PatientInfoCard contract', () => {
  const patientInfoCardData = buildPatientInfoCardData(
    {
      name: 'Budi Santoso',
      medicalRecordNumber: 'RM-001',
      nik: '3173000000000001',
      gender: 'male',
      birthDate: '1990-04-14',
      address: 'Jl. Melati No. 10',
      religion: 'Islam',
      paymentMethod: 'ASURANSI',
      status: 'IN_PROGRESS',
      visitDate: '2026-04-14T08:30:00.000Z',
      poliName: 'Laboratorium',
      doctorName: 'dr. Pengirim',
      allergies: 'Penicillin'
    },
    '2026-04-14'
  )

  assert.deepEqual(patientInfoCardData, {
    patient: {
      medicalRecordNumber: 'RM-001',
      name: 'Budi Santoso',
      nik: '3173000000000001',
      gender: 'male',
      age: 36,
      identityNumber: '3173000000000001',
      address: 'Jl. Melati No. 10',
      religion: 'Islam'
    },
    poli: {
      name: 'Laboratorium'
    },
    doctor: {
      name: 'dr. Pengirim'
    },
    visitDate: '2026-04-14T08:30:00.000Z',
    paymentMethod: 'ASURANSI',
    status: 'IN_PROGRESS',
    allergies: 'Penicillin'
  })
})

test('buildPatientInfoCardData applies safe fallbacks for missing optional ancillary fields', () => {
  const patientInfoCardData = buildPatientInfoCardData({
    name: 'Pasien Tanpa Detail',
    mrn: 'RM-002'
  })

  assert.deepEqual(patientInfoCardData, {
    patient: {
      medicalRecordNumber: 'RM-002',
      name: 'Pasien Tanpa Detail',
      nik: '-',
      gender: null,
      age: null,
      identityNumber: '-',
      address: '-',
      religion: '-'
    },
    poli: {
      name: '-'
    },
    doctor: {
      name: '-'
    },
    visitDate: undefined,
    paymentMethod: 'Umum',
    status: undefined,
    allergies: '-'
  })
})

test('buildAncillaryQueuePatientInfoCardData uses ancillary encounter visit date and practitioner, not referral data', () => {
  const patientInfoCardData = buildAncillaryQueuePatientInfoCardData({
    patientName: 'Siti Aminah',
    patientMrNo: 'RM-100',
    patient: {
      nik: '3173000000009999',
      birthDate: '1995-01-10',
      gender: 'female',
      address: 'Jl. Mawar No. 12',
      religion: 'Islam'
    },
    practitioner: {
      namaLengkap: 'dr. Pemeriksa'
    },
    queueTicket: {
      paymentMethod: 'ASURANSI',
      poli: {
        name: 'Radiologi'
      }
    },
    status: 'PLANNED',
    visitDate: '2026-04-14T09:00:00.000Z',
    startTime: '2026-04-14T10:00:00.000Z'
  })

  assert.equal(patientInfoCardData.visitDate, '2026-04-14T09:00:00.000Z')
  assert.equal(patientInfoCardData.doctor?.name, 'dr. Pemeriksa')
  assert.equal(patientInfoCardData.patient.identityNumber, '3173000000009999')
  assert.equal(patientInfoCardData.poli?.name, 'Radiologi')
})

test('buildAncillaryQueuePatientInfoCardData falls back to start time when visit date is missing', () => {
  const patientInfoCardData = buildAncillaryQueuePatientInfoCardData({
    patientName: 'Bambang',
    queueTicket: {
      practitioner: {
        namaLengkap: 'dr. Jaga'
      }
    },
    startTime: '2026-04-14T07:15:00.000Z'
  })

  assert.equal(patientInfoCardData.visitDate, '2026-04-14T07:15:00.000Z')
  assert.equal(patientInfoCardData.doctor?.name, 'dr. Jaga')
})

test('buildAncillaryQueuePatientInfoCardData falls back to createdAt when visit date and start time are missing', () => {
  const patientInfoCardData = buildAncillaryQueuePatientInfoCardData({
    patientName: 'Citra',
    createdAt: '2026-04-14T06:45:00.000Z'
  })

  assert.equal(patientInfoCardData.visitDate, '2026-04-14T06:45:00.000Z')
})

test('buildAncillaryQueuePatientInfoCardData falls back to category label for ancillary unit name', () => {
  const laboratoryCard = buildAncillaryQueuePatientInfoCardData({
    patientName: 'Dewi',
    category: 'LABORATORY'
  })
  const radiologyCard = buildAncillaryQueuePatientInfoCardData({
    patientName: 'Eko',
    category: 'RADIOLOGY'
  })

  assert.equal(laboratoryCard.poli?.name, 'Laboratory')
  assert.equal(radiologyCard.poli?.name, 'Radiology')
})

test('buildReferralSummary prefers the newest referral and falls back to poli asal from encounter', () => {
  const summary = buildReferralSummary({
    fallbackSourcePoliName: 'Poli Penyakit Dalam',
    referrals: [
      {
        referralDate: '2026-04-10T09:00:00.000Z',
        referringPractitionerName: 'dr. Lama',
        diagnosisText: 'Diagnosis lama'
      },
      {
        referralDate: '2026-04-12T09:00:00.000Z',
        referringPractitioner: { namaLengkap: 'dr. Pengirim' },
        conditionAtTransfer: 'Stabil',
        reasonForReferral: 'Perlu evaluasi lanjutan'
      }
    ]
  })

  assert.deepEqual(summary, [
    { label: 'Poli Asal', value: 'Poli Penyakit Dalam' },
    { label: 'Dokter Pengirim', value: 'dr. Pengirim' },
    { label: 'Keadaan Saat Dikirim', value: 'Stabil' },
    { label: 'Alasan Rujukan', value: 'Perlu evaluasi lanjutan' }
  ])
  assert.equal(
    hasReferralSummary({
      fallbackSourcePoliName: 'Poli Penyakit Dalam',
      referrals: [
        {
          referralDate: '2026-04-12T09:00:00.000Z',
          referringPractitionerName: 'dr. Pengirim'
        }
      ]
    }),
    true
  )
})

test('buildReferralSummary still returns source poli when referral detail rows are missing', () => {
  const summary = buildReferralSummary({
    fallbackSourcePoliName: 'Poli Anak'
  })

  assert.deepEqual(summary, [{ label: 'Poli Asal', value: 'Poli Anak' }])
})

test('buildReferralSummary falls back to keadaanKirim when conditionAtTransfer is empty', () => {
  const summary = buildReferralSummary({
    fallbackSourcePoliName: 'Poli Bedah',
    referrals: [
      {
        createdAt: '2026-04-14T10:00:00.000Z',
        keadaanKirim: 'Observasi ketat'
      }
    ]
  })

  assert.deepEqual(summary, [
    { label: 'Poli Asal', value: 'Poli Bedah' },
    { label: 'Keadaan Saat Dikirim', value: 'Observasi ketat' }
  ])
})
