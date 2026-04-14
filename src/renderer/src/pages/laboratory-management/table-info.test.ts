import assert from 'node:assert/strict'
import test from 'node:test'
import {
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
