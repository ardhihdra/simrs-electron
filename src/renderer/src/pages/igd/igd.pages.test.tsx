import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import type { PatientAttributes } from 'simrs-types'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { DesktopDispositionWorkflow } from '../../components/design-system/organisms/DesktopDispositionWorkflow.tsx'
import { IgdBedMapPage } from './IgdBedMapPage.tsx'
import { IgdDisposisiPage } from './IgdDisposisiPage.tsx'
import { IgdDaftarPage } from './IgdDaftarPage.tsx'
import { IgdRegistrasiPage } from './IgdRegistrasiPage.tsx'
import { IgdTriasePage } from './IgdTriasePage.tsx'
import { createIgdDashboardFixture } from './igd.data.ts'
import { buildIgdTableActions } from './igd.disposition.ts'
import { buildIgdReferralPatientData } from './igd.referral.ts'
import { type IgdTriageLevel } from './igd.triage-level.ts'

test('IGD daftar page renders summary, patient list, and detail panel', () => {
  const markup = renderToStaticMarkup(<IgdDaftarPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('igd-parity-scope'), true)
  assert.equal(markup.includes('igd-daftar-grid'), true)
  assert.equal(markup.includes('igd-detail-stack'), true)
  assert.equal(markup.includes('desktop-compact-stat-strip'), true)
  assert.equal(markup.includes('Daftar Pasien IGD'), true)
  assert.equal(markup.includes('Data tersambung'), true)
  assert.equal(markup.includes('Laporan'), true)
  assert.equal(markup.includes('Lihat Peta Bed'), true)
  assert.equal(markup.includes('Pasien Aktif'), true)
  assert.equal(markup.includes('AVG. Response'), true)
  assert.equal(markup.includes('Total Hari Ini'), true)
  assert.equal(markup.includes('SATUSEHAT'), true)
  assert.equal(markup.includes('Rekam medis aktif'), true)
  assert.equal(markup.includes('Detail Pasien'), true)
  assert.equal(markup.includes('Ringkasan pasien yang sedang dipilih.'), true)
  assert.equal(markup.includes('desktop-generic-table'), true)
  assert.equal(markup.includes('igd-patient-table'), true)
  assert.equal(markup.includes('igd-row-priority-1'), true)
  assert.equal(markup.includes('igd-row-priority-2'), false)
  assert.equal(markup.includes('igd-row-active-default'), true)
  assert.equal(markup.includes('igd-row-priority-3'), false)
  assert.equal(markup.includes('igd-row-priority-4'), false)
  assert.equal(markup.includes('Nomor Regis'), true)
  assert.equal(markup.includes('No. Rawat'), false)
  assert.equal(markup.includes('Waktu Masuk'), true)
  assert.equal(markup.includes('Dokter Dituju'), true)
  assert.equal(markup.includes('Pasien &amp; Keluhan'), true)
  assert.equal(markup.includes('Rekam Medis'), false)
  assert.equal(markup.includes('Nama Pasien'), false)
  assert.equal(markup.includes('Umur'), false)
  assert.equal(markup.includes('Jenis Kelamin'), false)
  assert.equal(markup.includes('Unit'), true)
  assert.equal(markup.includes('Bed IGD'), true)
  assert.equal(markup.includes('Penanggung Jawab Pasien'), true)
  assert.equal(markup.includes('Siti Aminah'), true)
  assert.equal(markup.includes('Biaya Sementara'), true)
  assert.equal(markup.includes('igd-patient-identity-cell'), true)
  assert.equal(markup.includes('igd-patient-name-line'), true)
  assert.equal(markup.includes('igd-patient-code-line'), true)
  assert.equal(markup.includes('igd-patient-complaint-line'), true)
  assert.equal(markup.includes('igd-doctor-target-text'), true)
  assert.equal(markup.includes('TMP-IGD-001 - ENC-20260423-000001'), true)
  assert.equal(markup.includes('Bed / Elapsed'), false)
  assert.equal(markup.includes('IGD-2604-001'), true)
  assert.equal(markup.includes('ENC-20260423-000001'), true)
  assert.equal(markup.includes('TIDAK DIKENAL'), true)
  assert.equal(markup.includes('Laki-laki'), true)
  assert.equal(markup.includes('IGD'), true)
  assert.equal(markup.includes('Rp725.000'), true)
  assert.equal(markup.includes('RESUSITASI'), true)
  assert.equal(markup.includes('Keluhan Utama'), true)
  assert.equal(markup.includes('Tanda Vital'), true)
  assert.equal(markup.includes('Riwayat Waktu'), true)
  assert.equal(markup.includes('Tiba'), true)
  assert.equal(markup.includes('Triase awal'), true)
  assert.equal(markup.includes('Dokter menangani'), true)
  assert.equal(markup.includes('Keluar dari bed'), true)
  assert.equal(markup.includes('Terhubung backend'), false)
  assert.equal(markup.includes('real-time'), false)
  assert.equal(markup.includes('Vital Sign'), false)
  assert.equal(markup.includes('Time Tracking'), false)
  assert.equal(markup.includes('Dokter datang / assign'), false)
  assert.equal(markup.includes('Bed release'), false)
  assert.equal(markup.includes('Temp'), true)
})

test('IGD daftar page keeps replace-patient flow outside inline detail layout', () => {
  const markup = renderToStaticMarkup(<IgdDaftarPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('Ganti Identitas'), true)
  assert.equal(markup.includes('replace-patient-selector-slot'), false)
  assert.equal(markup.includes('Gunakan Pasien Ini'), false)
  assert.equal(markup.includes('Ganti Identitas Pasien'), false)
})

test('IGD daftar page renders neutral detail when selected patient has no triage level', () => {
  const dashboard = createIgdDashboardFixture()
  dashboard.patients = [
    {
      ...dashboard.patients[0]!,
      triageLevel: undefined as unknown as IgdTriageLevel
    }
  ]

  const markup = renderToStaticMarkup(<IgdDaftarPage dashboard={dashboard} />)

  assert.equal(markup.includes('BELUM TRIASE'), true)
  assert.equal(markup.includes('Menunggu penilaian'), true)
})

test('IGD daftar page renders loading and error shell for backend query states', () => {
  const loadingMarkup = renderToStaticMarkup(
    <IgdDaftarPage dashboard={createIgdDashboardFixture()} isLoading />
  )
  const errorMarkup = renderToStaticMarkup(
    <IgdDaftarPage dashboard={createIgdDashboardFixture()} errorMessage="Gagal memuat dashboard" />
  )

  assert.equal(loadingMarkup.includes('Memuat data IGD'), true)
  assert.equal(errorMarkup.includes('Gagal memuat dashboard'), true)
})

test('IGD registrasi page renders the intake form shell', () => {
  const existingPatient = {
    id: 'patient-existing-1',
    medicalRecordNumber: 'MRN-001',
    name: 'Sutrisno Hadi',
    relatedPerson: [
      {
        name: 'Sri Wahyuni',
        phone: '081200000999',
        relationship: 'Suami/Istri',
        isGuarantor: true
      }
    ]
  } as unknown as PatientAttributes

  const markup = renderToStaticMarkup(
    <IgdRegistrasiPage
      dashboard={createIgdDashboardFixture()}
      lookupSelectorSlot={<div data-testid="patient-lookup-selector-slot" />}
      initialMode="existing"
      selectedExistingPatient={existingPatient}
    />
  )

  assert.equal(markup.includes('igd-parity-scope'), true)
  assert.equal(markup.includes('igd-registrasi-grid'), true)
  assert.equal(markup.includes('Registrasi Pasien IGD'), true)
  assert.equal(markup.includes('A. Identitas Pasien'), true)
  assert.equal(markup.includes('B. Data Kunjungan IGD'), true)
  assert.equal(markup.includes('C. Penanggung Jawab'), true)
  assert.equal(markup.includes('Sumber Penanggung Jawab'), true)
  assert.equal(markup.includes('Buat Baru'), true)
  assert.equal(markup.includes('Triase Cepat'), true)
  assert.equal(markup.includes('Ketersediaan Bed IGD'), true)
  assert.equal(markup.includes('Pasien Sementara'), true)
  assert.equal(markup.includes('Simpan &amp; Langsung Triase'), true)
  assert.equal(markup.includes('patient-lookup-selector-slot'), false)
  assert.equal(markup.includes('igd-existing-patient-summary'), true)
  assert.equal(markup.includes('Ganti Pasien'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
  assert.equal(markup.includes('desktop-card'), true)
  assert.equal(markup.includes('Level 2 - Urgen'), true)
  assert.equal(markup.includes('Warna Kuning - Butuh evaluasi cepat'), true)
})

test('IGD registrasi page renders optional religion for new patient mode', () => {
  const markup = renderToStaticMarkup(<IgdRegistrasiPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('Agama'), true)
  assert.equal(markup.includes('Opsional'), true)
})

test('IGD registrasi page keeps patient lookup selector inside modal only', () => {
  const source = fs.readFileSync(new URL('./IgdRegistrasiPage.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes("from 'antd'"), true)
  assert.equal(source.includes('patientLookupModalOpen'), true)
  assert.equal(source.includes('destroyOnHidden'), true)
  assert.equal(source.includes('<>{lookupSelectorSlot}</>'), true)
  assert.equal(source.includes('data-testid="patient-lookup-inline"'), false)
})

test('IGD registrasi page uses native date inputs for birth date and arrival time', () => {
  const source = fs.readFileSync(new URL('./IgdRegistrasiPage.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('label="Tgl. Lahir"'), true)
  assert.equal(source.includes('type="date"'), true)
  assert.equal(source.includes('label="Waktu Datang"'), true)
  assert.equal(source.includes('type="datetime-local"'), true)
})

test('IGD triase page renders triage sections and save action', () => {
  const markup = renderToStaticMarkup(<IgdTriasePage />)

  assert.equal(markup.includes('Triase IGD'), true)
  assert.equal(markup.includes('Triase Cepat'), true)
  assert.equal(markup.includes('Simpan Triase'), true)
  assert.equal(markup.includes('desktop-segmented-control'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
})

test('IGD bed map page renders zones and bed cards', () => {
  const markup = renderToStaticMarkup(
    <IgdBedMapPage
      dashboard={createIgdDashboardFixture()}
      reportExportGroups={[
        {
          zone: 'Resusitasi',
          totalBeds: '4',
          occupiedBeds: '1',
          availableBeds: '3',
          cleaningBeds: '0',
          details: [
            {
              bedCode: 'R-01',
              status: 'Terisi',
              patientName: 'TIDAK DIKENAL',
              registrationNumber: 'IGD-2604-001',
              triageLevel: 'L0'
            }
          ]
        }
      ]}
    />
  )

  assert.equal(markup.includes('Peta Bed IGD'), true)
  assert.equal(markup.includes('Data tersambung'), true)
  assert.equal(markup.includes('Laporan'), true)
  assert.equal(markup.includes('TOTAL BED IGD'), true)
  assert.equal(markup.includes('14'), true)
  assert.equal(markup.includes('Terisi'), true)
  assert.equal(markup.includes('Kosong'), true)
  assert.equal(markup.includes('Pembersihan'), true)
  assert.equal(markup.includes('Zona Resusitasi'), true)
  assert.equal(markup.includes('3 kosong dari 4'), true)
  assert.equal(markup.includes('Semua level'), true)
  assert.equal(markup.includes('R-01'), true)
  assert.equal(markup.includes('Detail'), true)
  assert.equal(markup.includes('Pindah'), true)
  assert.equal(markup.includes('Tempatkan'), true)
  assert.equal(markup.includes('Tambah Bed'), true)
  assert.equal(markup.includes('igd-bed-card--occupied'), true)
  assert.equal(markup.includes('igd-bed-card--level-1'), false)
  assert.equal(markup.includes('igd-bed-zone-panel'), true)
  assert.equal(markup.includes('igd-bed-card-actions--double'), true)
  assert.equal(markup.includes('Terhubung backend'), false)
  assert.equal(markup.includes('Cleaning'), false)
  assert.equal(markup.includes('Assign Pasien'), false)
})

test('IGD referral disposition maps patient data for ReferralForm', () => {
  const patient = createIgdDashboardFixture().patients[0]!
  const result = buildIgdReferralPatientData(patient)

  assert.deepEqual(result, {
    patient: {
      id: 'patient-temp-1',
      name: 'TIDAK DIKENAL',
      medicalRecordNumber: 'TMP-IGD-001'
    }
  })
})

test('IGD disposisi page renders mockup-style inline disposition workflow', () => {
  const patient = createIgdDashboardFixture().patients[0]!
  const markup = renderToStaticMarkup(
    <IgdDisposisiPage patient={patient} onBack={() => undefined} onConfirm={() => undefined} />
  )

  assert.equal(markup.includes('Proses Pemulangan (Discharge)'), true)
  assert.equal(markup.includes('Jenis Disposisi'), false)
  assert.equal(markup.includes('Status Keluar'), true)
  assert.equal(markup.includes('Obat Pulang'), true)
  assert.equal(markup.includes('Rincian Billing'), true)
  assert.equal(markup.includes('SATUSEHAT &amp; Klaim BPJS'), true)
  assert.equal(markup.includes('Pulang'), true)
  assert.equal(markup.includes('Meninggal'), true)
  assert.equal(markup.includes('Surat &amp; Dokumen'), true)
  assert.equal(markup.includes('Finalisasi &amp; Pulangkan'), true)
})

test('desktop design system exposes reusable disposition workflow', () => {
  const markup = renderToStaticMarkup(
    <DesktopDispositionWorkflow
      patient={{
        name: 'Sutrisno Hadi',
        registrationNumber: 'IGD-2604-002',
        ageLabel: '62 L',
        paymentLabel: 'BPJS',
        statusLabel: 'Encounter'
      }}
      bannerMeta={{
        label: 'L1',
        name: 'Resusitasi',
        colorName: 'MERAH',
        badgeTone: 'danger',
        background: 'var(--danger-soft)',
        borderColor: 'var(--danger)',
        color: 'var(--danger)'
      }}
      summaryItems={[{ label: 'No. Reg', value: 'IGD-2604-002', mono: true }]}
      options={[
        {
          key: 'pulang',
          label: 'Pulang',
          subtitle: 'Pasien diizinkan pulang',
          dischargeDisposition: 'CURED',
          color: 'var(--ok)',
          softColor: 'var(--ok-soft)',
          tone: 'success'
        }
      ]}
      onBack={() => undefined}
      onConfirm={() => undefined}
    />
  )

  assert.equal(markup.includes('Proses Pemulangan (Discharge)'), true)
  assert.equal(markup.includes('Jenis Disposisi'), false)
  assert.equal(markup.includes('Rincian Billing'), true)
})

test('IGD patient table hides internal ant measure rows to avoid header gap', () => {
  const css = fs.readFileSync(new URL('../../assets/main.css', import.meta.url), 'utf8')

  assert.equal(css.includes('ant-table-measure-row'), true)
})

test('IGD patient table renders black triage rows with dark background and left border', () => {
  const css = fs.readFileSync(new URL('../../assets/main.css', import.meta.url), 'utf8')

  assert.equal(css.includes('tr.igd-row-level-0:not(.igd-row-active-default)'), false)
  assert.equal(css.includes('tr.igd-row-level-0'), true)
  assert.equal(css.includes('background: #6b7280 !important'), true)
  assert.equal(css.includes('> td\n    *'), false)
  assert.equal(css.includes('.igd-doctor-target-text'), true)
  assert.equal(css.includes('.igd-temp-tag > span'), true)
  assert.equal(css.includes('box-shadow: inset 3px 0 0 #000000'), true)
})

test('IGD referral disposition modal avoids CommonJS require in renderer runtime', () => {
  const source = fs.readFileSync(
    new URL('./IgdReferralDispositionModal.tsx', import.meta.url),
    'utf8'
  )

  assert.equal(source.includes('require('), false)
})

test('IGD daftar route uses destroyOnHidden for AntD modal cleanup', () => {
  const source = fs.readFileSync(new URL('./IgdDaftarRoute.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('destroyOnClose'), false)
  assert.equal(source.includes('destroyOnHidden'), true)
})

test('IGD daftar route renders disposition as inline page instead of discharge modal', () => {
  const source = fs.readFileSync(new URL('./IgdDaftarRoute.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('DischargeModal'), false)
  assert.equal(source.includes('IgdDisposisiPage'), true)
})

test('IGD table actions include disposition and patient-specific actions', () => {
  const [temporaryPatient, triasePatient] = createIgdDashboardFixture().patients

  const temporaryActions = buildIgdTableActions({
    patient: temporaryPatient!,
    onOpenTriase: () => undefined,
    onOpenBedMap: () => undefined,
    onOpenDisposition: () => undefined,
    onOpenReplacePatient: () => undefined
  })
  const triaseActions = buildIgdTableActions({
    patient: triasePatient!,
    onOpenTriase: () => undefined,
    onOpenBedMap: () => undefined,
    onOpenDisposition: () => undefined
  })

  assert.deepEqual(
    temporaryActions.map((action) => action.label),
    ['Atur Bed', 'Disposisi', 'Ganti Identitas']
  )
  assert.deepEqual(
    triaseActions.map((action) => action.label),
    ['Triase', 'Disposisi']
  )
})
