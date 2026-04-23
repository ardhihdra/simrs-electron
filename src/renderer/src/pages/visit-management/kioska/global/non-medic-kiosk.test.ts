import assert from 'node:assert/strict'
import test from 'node:test'

import { buildNonMedicKioskPageProps } from './non-medic-kiosk.ts'

test('rawat inap kiosk uses RI location and REGISTRASI for UMUM', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('rawat_inap', 'CASH'), {
    title: 'KIOSK Pendaftaran',
    description: 'Halaman untuk pengambilan nomor antrean pendaftaran.',
    serviceTypeCode: 'REGISTRASI',
    serviceLabel: 'Pendaftaran',
    payload: {
      LokasiKerjaCode: 'RI'
    }
  })
})

test('laboratory kiosk uses REGISTRASI_ASURANSI and LAB location for ASURANSI', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('laboratory', 'ASURANSI'), {
    title: 'KIOSK Pendaftaran Asuransi',
    description: 'Halaman untuk pengambilan nomor antrean pendaftaran asuransi.',
    serviceTypeCode: 'REGISTRASI_ASURANSI',
    serviceLabel: 'Pendaftaran Asuransi',
    payload: {
      LokasiKerjaCode: 'LAB'
    }
  })
})

test('radiology kiosk uses RAD location for UMUM flow', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('radiology', 'CASH').payload, {
    LokasiKerjaCode: 'RAD'
  })
})

test('billing kiosk follows billing reference config', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('billing'), {
    title: 'KIOSK Billing',
    description: 'Halaman untuk pengambilan nomor antrean billing.',
    serviceTypeCode: 'BILLING',
    serviceLabel: 'Billing',
    payload: {
      LokasiKerjaCode: 'ADM'
    }
  })
})

test('cashier kiosk follows cashier reference config', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('cashier'), {
    title: 'KIOSK Kasir',
    description: 'Halaman untuk pengambilan nomor antrean kasir.',
    serviceTypeCode: 'CASHIER',
    serviceLabel: 'Kasir',
    payload: {
      LokasiKerjaCode: 'KASIR'
    }
  })
})

test('pharmacy kiosk follows pharmacy reference config', () => {
  assert.deepEqual(buildNonMedicKioskPageProps('pharmacy'), {
    title: 'KIOSK Farmasi',
    description: 'Halaman untuk pengambilan nomor antrean farmasi.',
    serviceTypeCode: 'PHARMACY',
    serviceLabel: 'Farmasi',
    payload: {
      LokasiKerjaCode: 'FARM'
    }
  })
})
