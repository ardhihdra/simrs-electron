import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { IgdBedMapPage } from './IgdBedMapPage.tsx'
import { IgdDaftarPage } from './IgdDaftarPage.tsx'
import { buildIgdReferralPatientData } from './IgdReferralDispositionModal.tsx'
import { IgdRegistrasiPage } from './IgdRegistrasiPage.tsx'
import { IgdTriasePage } from './IgdTriasePage.tsx'
import { createIgdDashboardFixture } from './igd.data.ts'
import { buildIgdTableActions } from './igd.disposition.ts'

test('IGD daftar page renders summary, patient list, and detail panel', () => {
  const markup = renderToStaticMarkup(<IgdDaftarPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('igd-parity-scope'), true)
  assert.equal(markup.includes('igd-daftar-grid'), true)
  assert.equal(markup.includes('igd-detail-stack'), true)
  assert.equal(markup.includes('desktop-compact-stat-strip'), true)
  assert.equal(markup.includes('Daftar Pasien IGD'), true)
  assert.equal(markup.includes('Pasien Aktif'), true)
  assert.equal(markup.includes('AVG. Response'), true)
  assert.equal(markup.includes('Total Hari Ini'), true)
  assert.equal(markup.includes('SATUSEHAT'), true)
  assert.equal(markup.includes('EMR Aktif'), true)
  assert.equal(markup.includes('Detail Pasien'), true)
  assert.equal(markup.includes('desktop-generic-table'), true)
  assert.equal(markup.includes('igd-patient-table'), true)
  assert.equal(markup.includes('igd-row-priority-1'), true)
  assert.equal(markup.includes('igd-row-priority-2'), true)
  assert.equal(markup.includes('igd-row-active-default'), true)
  assert.equal(markup.includes('igd-row-priority-3'), false)
  assert.equal(markup.includes('igd-row-priority-5'), false)
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
  assert.equal(markup.includes('RESUSITASI'), true)
  assert.equal(markup.includes('Keluhan Utama'), true)
  assert.equal(markup.includes('Vital Sign'), true)
  assert.equal(markup.includes('Time Tracking'), true)
  assert.equal(markup.includes('Tiba'), true)
  assert.equal(markup.includes('Triase awal'), true)
  assert.equal(markup.includes('Dokter datang / assign'), true)
  assert.equal(markup.includes('Bed release'), true)
})

test('IGD daftar page keeps replace-patient flow outside inline detail layout', () => {
  const markup = renderToStaticMarkup(<IgdDaftarPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('Ubah Pasien'), true)
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

  assert.equal(loadingMarkup.includes('Memuat dashboard IGD'), true)
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
  } as any

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
  assert.equal(markup.includes('Level 3 — Urgen'), true)
  assert.equal(markup.includes('Warna Kuning · Butuh evaluasi cepat'), true)
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
  const markup = renderToStaticMarkup(<IgdBedMapPage dashboard={createIgdDashboardFixture()} />)

  assert.equal(markup.includes('Peta Bed IGD'), true)
  assert.equal(markup.includes('TOTAL BED IGD'), true)
  assert.equal(markup.includes('12'), true)
  assert.equal(markup.includes('Terisi'), true)
  assert.equal(markup.includes('Kosong'), true)
  assert.equal(markup.includes('Cleaning'), true)
  assert.equal(markup.includes('Zona Resusitasi'), true)
  assert.equal(markup.includes('3 kosong dari 4'), true)
  assert.equal(markup.includes('L1-L2'), true)
  assert.equal(markup.includes('R-01'), true)
  assert.equal(markup.includes('Periksa'), true)
  assert.equal(markup.includes('Pindah'), true)
  assert.equal(markup.includes('Cleaning'), true)
  assert.equal(markup.includes('Assign Pasien'), true)
  assert.equal(markup.includes('Tambah Bed'), true)
  assert.equal(markup.includes('igd-bed-card--occupied'), true)
  assert.equal(markup.includes('igd-bed-card--level-1'), false)
  assert.equal(markup.includes('igd-bed-zone-panel'), true)
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
  const source = fs.readFileSync(new URL('./IgdReferralDispositionModal.tsx', import.meta.url), 'utf8')

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
    ['Bed', 'Disposisi', 'Ubah Pasien']
  )
  assert.deepEqual(
    triaseActions.map((action) => action.label),
    ['Triase', 'Disposisi']
  )
})
