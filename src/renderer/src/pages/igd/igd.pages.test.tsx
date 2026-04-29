/**
 * purpose: SSR smoke test untuk halaman IGD (daftar, registrasi, triase, bed map, dan utilitas disposisi) agar struktur render utama tetap stabil.
 * main callers: Runner `node:test` via `tsx --test`.
 * key dependencies: `react-dom/server`, halaman IGD, `QueryClientProvider` untuk komponen yang memakai React Query.
 * main/public functions: Kumpulan `test(...)` assertions untuk halaman IGD.
 * side effects: Read-only render SSR dan pembacaan file CSS/source untuk assertion statik.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PatientAttributes } from 'simrs-types'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { IgdBedMapPage } from './IgdBedMapPage.tsx'
import { IgdDaftarPage } from './IgdDaftarPage.tsx'
import { buildIgdReferralPatientData } from './IgdReferralDispositionModal.tsx'
import { IgdRegistrasiPage } from './IgdRegistrasiPage.tsx'
import { IgdPatientInfoPanel } from './IgdPatientInfoPanel.tsx'
import { IgdTriasePage } from './IgdTriasePage.tsx'
import { IgdTriaseFormCard } from './IgdTriaseFormCard.tsx'
import { createIgdDashboardFixture } from './igd.data.ts'
import { buildIgdTableActions } from './igd.disposition.ts'

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
  assert.equal(markup.includes('No. Rawat'), true)
  assert.equal(markup.includes('Waktu Masuk'), true)
  assert.equal(markup.includes('Dokter Dituju'), true)
  assert.equal(markup.includes('Rekam Medis'), true)
  assert.equal(markup.includes('Nama Pasien'), true)
  assert.equal(markup.includes('Umur'), true)
  assert.equal(markup.includes('Jenis Kelamin'), true)
  assert.equal(markup.includes('Unit'), true)
  assert.equal(markup.includes('Bed IGD'), true)
  assert.equal(markup.includes('Penanggung Jawab Pasien'), true)
  assert.equal(markup.includes('Siti Aminah'), true)
  assert.equal(markup.includes('Biaya Sementara'), true)
  assert.equal(markup.includes('Pasien &amp; Keluhan'), false)
  assert.equal(markup.includes('Bed / Elapsed'), false)
  assert.equal(markup.includes('IGD-2604-001'), true)
  assert.equal(markup.includes('ENC-20260423-000001'), true)
  assert.equal(markup.includes('TIDAK DIKENAL'), true)
  assert.equal(markup.includes('Laki-laki'), true)
  assert.equal(markup.includes('IGD'), true)
  assert.equal(markup.includes('Rp725.000'), true)
  assert.equal(markup.includes('KRITIS'), true)
  assert.equal(markup.includes('Keluhan Utama'), true)
  assert.equal(markup.includes('Tanda Vital'), true)
  assert.equal(markup.includes('Riwayat Waktu'), true)
  assert.equal(markup.includes('TD'), true)
  assert.equal(markup.includes('90/60'), true)
  assert.equal(markup.includes('mmHg'), true)
  assert.equal(markup.includes('112'), true)
  assert.equal(markup.includes('/mnt'), true)
  assert.equal(markup.includes('GCS'), true)
  assert.equal(markup.includes('Somnolen'), true)
  assert.equal(markup.includes('data-vital-key="pulse-rate" data-vital-tone="danger"'), true)
  assert.equal(markup.includes('data-vital-key="oxygen-saturation" data-vital-tone="danger"'), true)
  assert.equal(markup.includes('data-vital-key="respiratory-rate" data-vital-tone="warning"'), true)
  assert.equal(markup.includes('data-vital-key="temperature" data-vital-tone="neutral"'), true)
  assert.equal(markup.includes('Vital sign belum tersedia'), false)
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
  assert.equal(markup.includes('patient-lookup-selector-slot'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
  assert.equal(markup.includes('desktop-card'), true)
  assert.equal(markup.includes('Level 2 - Semi Urgent'), true)
  assert.equal(markup.includes('Warna Hijau - Butuh evaluasi cepat'), true)
})

test('IGD triase page renders triage and info umum sections with save action', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })
  queryClient.setQueryData(['master-igd-triage-level', 'list-active'], [])
  queryClient.setQueryData(['master-igd-triage-criteria', 'list-active'], [])
  const dashboard = createIgdDashboardFixture()
  const preselectedPatientId = dashboard.patients[1]?.id

  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <IgdTriasePage dashboard={dashboard} initialSelectedPatientId={preselectedPatientId} />
    </QueryClientProvider>
  )

  assert.equal(markup.includes('Daftar Pasien IGD'), true)
  assert.equal(markup.includes('Terhubung backend'), true)
  assert.equal(markup.includes('Pasien Aktif'), true)
  assert.equal(markup.includes('AVG. Response'), true)
  assert.equal(markup.includes('SATUSEHAT'), true)
  assert.equal(markup.includes('EMR Aktif'), true)
  assert.equal(markup.includes('Detail Pasien'), true)
  assert.equal(markup.includes('Vital Sign'), true)
  assert.equal(markup.includes('Time Tracking'), true)
  assert.equal(markup.includes('Triase'), true)
  assert.equal(markup.includes('Triase Cepat'), false)
  assert.equal(markup.includes('Info Umum'), true)
  assert.equal(markup.includes('Kondisi Umum'), true)
  assert.equal(markup.includes('Keluhan Singkat'), true)
  assert.equal(markup.includes('Level 3 — Semi Urgent'), false)
  assert.equal(markup.includes('Warna Hijau · Butuh evaluasi cepat'), false)
  assert.equal(markup.includes('Pemeriksaan Cepat'), false)
  assert.equal(markup.includes('Primer (L1–2)'), false)
  assert.equal(markup.includes('Sekunder (L3–5)'), false)
  assert.equal(markup.includes('Simpan Triase'), true)
  assert.equal(markup.includes('Kembali ke Daftar'), true)
  assert.equal(markup.includes('Form Triase'), true)
  assert.equal(markup.includes('desktop-segmented-control'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
  assert.equal(markup.includes('IGD-2604-002'), true)
})

test('IGD triase page falls back to first patient when no initial selection is provided', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })
  queryClient.setQueryData(['master-igd-triage-level', 'list-active'], [])
  queryClient.setQueryData(['master-igd-triage-criteria', 'list-active'], [])

  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <IgdTriasePage dashboard={createIgdDashboardFixture()} />
    </QueryClientProvider>
  )

  assert.equal(markup.includes('IGD-2604-001'), true)
})

test('IGD triase umum form renders administratif fields without level override block', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })
  queryClient.setQueryData(['master-igd-triage-level', 'list-active'], [])
  queryClient.setQueryData(['master-igd-triage-criteria', 'list-active'], [])

  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <IgdTriaseFormCard
        activeSection="umum"
        formValues={{}}
        onSectionChange={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
      />
    </QueryClientProvider>
  )

  assert.equal(markup.includes('Transportasi'), true)
  assert.equal(markup.includes('Cara Masuk'), true)
  assert.equal(markup.includes('Macam Kasus'), true)
  assert.equal(markup.includes('Tanggal Asesmen'), true)
  assert.equal(markup.includes('Petugas Pemeriksa'), true)
  assert.equal(markup.includes('Suggested Level (Otomatis)'), false)
  assert.equal(markup.includes('Final Level Triase'), false)
  assert.equal(markup.includes('Kesadaran (GCS)'), false)
  assert.equal(markup.includes('Pemeriksaan Umum + Kesadaran (GCS)'), false)
})

test('IGD patient info panel honors triage level override for display', () => {
  const patient = createIgdDashboardFixture().patients[0]
  assert.ok(patient)

  const markup = renderToStaticMarkup(
    <IgdPatientInfoPanel patient={patient} triageLevelOverride={3} />
  )

  assert.equal(markup.includes('L3'), true)
  assert.equal(markup.includes('SEMI URGENT'), true)
  assert.equal(markup.includes('KRITIS'), false)
})

test('IGD triase form tab renders quick+vital signs and matrix table', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })
  queryClient.setQueryData(
    ['master-igd-triage-level', 'list-active'],
    [
      { id: 100, levelNo: 0, label: 'Meninggal', color: 'hitam' },
      { id: 101, levelNo: 1, label: 'Kritis', color: 'merah' },
      { id: 102, levelNo: 2, label: 'Urgent', color: 'kuning' },
      { id: 103, levelNo: 3, label: 'Semi Urgent', color: 'hijau' },
      { id: 104, levelNo: 4, label: 'Tidak Urgent', color: 'putih' }
    ]
  )
  queryClient.setQueryData(
    ['master-igd-triage-criteria', 'list-active'],
    [
      {
        id: 1,
        triageLevelId: 100,
        criteriaGroup: 'airway',
        criteriaText: 'Tidak ada jalan napas',
        sortOrder: 1
      },
      {
        id: 2,
        triageLevelId: 101,
        criteriaGroup: 'breathing',
        criteriaText: 'Gangguan berat',
        sortOrder: 1
      },
      {
        id: 3,
        triageLevelId: 102,
        criteriaGroup: 'circulation',
        criteriaText: 'Gangguan sedang',
        sortOrder: 1
      },
      {
        id: 4,
        triageLevelId: 103,
        criteriaGroup: 'disability_and_other_dysfunction',
        criteriaText: 'Gangguan ringan',
        sortOrder: 1
      },
      {
        id: 5,
        triageLevelId: 104,
        criteriaGroup: 'nyeri',
        criteriaText: 'Tidak nyeri',
        sortOrder: 1
      }
    ]
  )

  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <IgdTriaseFormCard
        activeSection="utama"
        formValues={{}}
        onSectionChange={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
      />
    </QueryClientProvider>
  )

  assert.equal(markup.includes('Vital Sign + Kesadaran + Kebutuhan Khusus'), true)
  assert.equal(markup.includes('Kondisi Umum'), true)
  assert.equal(markup.includes('Keluhan Singkat'), true)
  assert.equal(markup.includes('Level Triase Awal'), false)
  assert.equal(markup.includes('Kesadaran (GCS)'), true)
  assert.equal(markup.includes('Kebutuhan Khusus'), true)
  assert.equal(markup.includes('Pemeriksaan + Pengkajian'), true)
  assert.equal(markup.includes('Shortcut Pengisian Pemeriksaan + Pengkajian'), false)
  assert.equal(markup.includes('Level Triase Final'), true)
  assert.equal(markup.includes('Belum ada checkbox dipilih.'), true)
  assert.equal(markup.includes('Simpan Triase Final'), true)
  assert.equal(markup.includes('L0'), true)
  assert.equal(markup.includes('L1'), true)
  assert.equal(markup.includes('L2'), true)
  assert.equal(markup.includes('L3'), true)
  assert.equal(markup.includes('L4'), true)
  assert.equal(markup.includes('Airway'), true)
  assert.equal(markup.includes('Breathing'), true)
  assert.equal(markup.includes('Circulation'), true)
  assert.equal(markup.includes('Disability/Disfungsi'), true)
  assert.equal(markup.includes('Nyeri'), true)
})

test('IGD triase utama form shows L0 from final level draft even without selected checkbox', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })
  queryClient.setQueryData(
    ['master-igd-triage-level', 'list-active'],
    [
      { id: 100, levelNo: 0, label: 'Meninggal', color: 'hitam' },
      { id: 101, levelNo: 1, label: 'Kritis', color: 'merah' }
    ]
  )
  queryClient.setQueryData(
    ['master-igd-triage-criteria', 'list-active'],
    [
      {
        id: 1,
        triageLevelId: 100,
        criteriaGroup: 'airway',
        criteriaText: 'Tidak ada jalan napas',
        sortOrder: 1
      }
    ]
  )

  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <IgdTriaseFormCard
        activeSection="utama"
        formValues={{ __finalLevel: '0' }}
        onSectionChange={() => undefined}
        onFieldChange={() => undefined}
        onSave={() => undefined}
      />
    </QueryClientProvider>
  )

  assert.equal(markup.includes('Level Triase Final'), true)
  assert.equal(markup.includes('L0'), true)
  assert.equal(markup.includes('Belum ada checkbox dipilih.'), false)
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

test('IGD patient table hides internal ant measure rows to avoid header gap', () => {
  const css = fs.readFileSync(new URL('../../assets/main.css', import.meta.url), 'utf8')

  assert.equal(css.includes('ant-table-measure-row'), true)
})

test('IGD referral disposition modal avoids CommonJS require in renderer runtime', () => {
  const source = fs.readFileSync(
    new URL('./IgdReferralDispositionModal.tsx', import.meta.url),
    'utf8'
  )

  assert.equal(source.includes('require('), false)
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
