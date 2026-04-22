import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { IgdBedMapPage } from './IgdBedMapPage.tsx'
import { IgdDaftarPage } from './IgdDaftarPage.tsx'
import { IgdRegistrasiPage } from './IgdRegistrasiPage.tsx'
import { IgdTriasePage } from './IgdTriasePage.tsx'

test('IGD daftar page renders summary, patient list, and detail panel', () => {
  const markup = renderToStaticMarkup(<IgdDaftarPage />)

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
  assert.equal(markup.includes('Level'), true)
  assert.equal(markup.includes('Pasien &amp; Keluhan'), true)
  assert.equal(markup.includes('Bed / Elapsed'), true)
  assert.equal(markup.includes('RESUSITASI'), true)
  assert.equal(markup.includes('Keluhan Utama'), true)
  assert.equal(markup.includes('Vital Sign'), true)
  assert.equal(markup.includes('Time Tracking'), true)
  assert.equal(markup.includes('Tiba di IGD'), true)
  assert.equal(markup.includes('Dokter Hadir'), true)
})

test('IGD registrasi page renders the intake form shell', () => {
  const markup = renderToStaticMarkup(<IgdRegistrasiPage />)

  assert.equal(markup.includes('igd-parity-scope'), true)
  assert.equal(markup.includes('igd-registrasi-grid'), true)
  assert.equal(markup.includes('Registrasi Pasien IGD'), true)
  assert.equal(markup.includes('A. Identitas Pasien'), true)
  assert.equal(markup.includes('B. Data Kunjungan IGD'), true)
  assert.equal(markup.includes('C. Penanggung Jawab'), true)
  assert.equal(markup.includes('Triase Cepat'), true)
  assert.equal(markup.includes('Ketersediaan Bed IGD'), true)
  assert.equal(markup.includes('Pasien Sementara'), true)
  assert.equal(markup.includes('Simpan &amp; Langsung Triase'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
  assert.equal(markup.includes('desktop-card'), true)
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
  const markup = renderToStaticMarkup(<IgdBedMapPage />)

  assert.equal(markup.includes('Peta Bed IGD'), true)
  assert.equal(markup.includes('Zona Resusitasi'), true)
  assert.equal(markup.includes('R-01'), true)
  assert.equal(markup.includes('desktop-input-field'), true)
  assert.equal(markup.includes('desktop-card'), true)
})

test('IGD patient table hides internal ant measure rows to avoid header gap', () => {
  const css = fs.readFileSync(new URL('../../assets/main.css', import.meta.url), 'utf8')

  assert.equal(css.includes('ant-table-measure-row'), true)
})
