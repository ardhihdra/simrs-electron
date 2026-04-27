import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage.tsx'
import { RawatInapBedMapPage } from './RawatInapBedMapPage.tsx'
import { RawatInapTransferPage } from './RawatInapTransferPage.tsx'
import { createRawatInapInitialState, createRawatInapStateFromBedMapSnapshot } from './rawat-inap.state.ts'

void React

test('Rawat Inap admisi page renders the mockup sections and static form values', () => {
  const markup = renderToStaticMarkup(<RawatInapAdmisiPage />)

  assert.equal(markup.includes('Admisi Baru — Rawat Inap'), true)
  assert.equal(markup.includes('Sumber Masuk'), true)
  assert.equal(markup.includes('Rawat Jalan'), true)
  assert.equal(markup.includes('Data Pasien'), true)
  assert.equal(markup.includes('Pilih Pasien'), true)
  assert.equal(markup.includes('02-14-88-21'), true)
  assert.equal(markup.includes('Verifikasi BPJS &amp; SEP'), true)
  assert.equal(markup.includes('Diagnosis &amp; Indikasi Rawat Inap'), true)
  assert.equal(markup.includes('Essential hypertension'), false)
  assert.equal(markup.includes('Hipertensi tidak terkontrol'), false)
  assert.equal(markup.includes('dr. Andi Wijaya'), false)
  assert.equal(markup.includes('Penempatan Kamar'), true)
  assert.equal(markup.includes('Simpan &amp; Proses Admisi'), true)
})

test('Rawat Inap admisi page hides BPJS verification for cash guarantor', () => {
  const markup = renderToStaticMarkup(
    <RawatInapAdmisiPage initialForm={{ paymentMethod: 'cash' }} />
  )

  assert.equal(markup.includes('Penjamin'), true)
  assert.equal(markup.includes('Umum / Tunai'), true)
  assert.equal(markup.includes('Verifikasi BPJS &amp; SEP'), false)
})

test('Rawat Inap admisi page uses IGD encounter selector for IGD source', () => {
  const markup = renderToStaticMarkup(<RawatInapAdmisiPage initialForm={{ source: 'igd' }} />)

  assert.equal(markup.includes('Encounter IGD Asal'), true)
  assert.equal(markup.includes('Pilih Encounter'), true)
})

test('Rawat Inap admisi page uses Rawat Jalan encounter selector for Rawat Jalan source', () => {
  const markup = renderToStaticMarkup(<RawatInapAdmisiPage initialForm={{ source: 'rajal' }} />)

  assert.equal(markup.includes('Encounter Rawat Jalan Asal'), true)
  assert.equal(markup.includes('Pilih Encounter'), true)
})

test('Rawat Inap admisi page filters placement beds by selected room class', () => {
  const markup = renderToStaticMarkup(
    <RawatInapAdmisiPage
      initialForm={{ selectedClassOfCareCodeId: 'KELAS_2' }}
      bedMapSnapshot={{
        generatedAt: '2026-04-27T09:00:00.000Z',
        summary: {
          totalRooms: 2,
          totalBeds: 2,
          occupiedBeds: 0,
          availableBeds: 2,
          cleaningBeds: 0
        },
        wards: [
          {
            roomId: 'room-vip-101',
            roomName: 'VIP 101',
            floor: '1',
            classLabel: 'VIP',
            capacity: 1,
            occupancy: { occupied: 0, total: 1, percentage: 0 },
            beds: [
              {
                bedId: 'bed-vip-101-a',
                bedName: '101-A',
                status: 'TERSEDIA',
                roomId: 'room-vip-101',
                roomName: 'VIP 101',
                patient: null
              }
            ]
          },
          {
            roomId: 'room-melati-201',
            roomName: 'Melati 201',
            floor: '2',
            classLabel: 'Kelas 2',
            capacity: 1,
            occupancy: { occupied: 0, total: 1, percentage: 0 },
            beds: [
              {
                bedId: 'bed-melati-201-a',
                bedName: '201-A',
                status: 'TERSEDIA',
                roomId: 'room-melati-201',
                roomName: 'Melati 201',
                patient: null
              }
            ]
          }
        ]
      }}
    />
  )

  assert.equal(markup.includes('Melati 201 - 201-A'), true)
  assert.equal(markup.includes('VIP 101 - 101-A'), false)
})

test('Rawat Inap bed map page renders ward sidebar, bed grid, and detail panel', () => {
  const markup = renderToStaticMarkup(<RawatInapBedMapPage state={createRawatInapInitialState()} />)

  assert.equal(markup.includes('Rawat Inap — Peta Bed'), true)
  assert.equal(markup.includes('Fullscreen'), true)
  assert.equal(markup.includes('rawat-inap-bed-map-layout'), true)
  assert.equal(markup.includes('Bangsal'), true)
  assert.equal(markup.includes('Detail Bed'), true)
})

test('Rawat Inap bed map fullscreen mode keeps only fullscreen action in the header', () => {
  const markup = renderToStaticMarkup(
    <RawatInapBedMapPage state={createRawatInapInitialState()} isFullscreenMode />
  )

  assert.equal(markup.includes('rawat-inap-bed-map-fullscreen'), true)
  assert.equal(markup.includes('Keluar Fullscreen'), true)
  assert.equal(markup.includes('Statistik BOR'), false)
  assert.equal(markup.includes('Daftar Pasien'), false)
  assert.equal(markup.includes('Admisi Baru'), false)
  assert.equal(markup.includes('Detail Bed'), false)
})

test('Rawat Inap transfer page renders source and destination cards', () => {
  const markup = renderToStaticMarkup(<RawatInapTransferPage state={createRawatInapInitialState()} />)

  assert.equal(markup.includes('Transfer Antar Bangsal / Kamar'), true)
  assert.equal(markup.includes('Dari (Kamar Saat Ini)'), true)
  assert.equal(markup.includes('Ke (Tujuan Transfer)'), true)
})

test('Rawat Inap bed map page renders backend-mapped patient detail', () => {
  const state = createRawatInapStateFromBedMapSnapshot({
    generatedAt: '2026-04-24T09:00:00.000Z',
    summary: {
      totalRooms: 1,
      totalBeds: 1,
      occupiedBeds: 1,
      availableBeds: 0,
      cleaningBeds: 0
    },
    wards: [
      {
        roomId: 'room-melati',
        roomName: 'Melati',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 1,
        occupancy: {
          occupied: 1,
          total: 1,
          percentage: 100
        },
        beds: [
          {
            bedId: 'bed-1',
            bedName: '302-A',
            status: 'TERISI',
            roomId: 'room-melati',
            roomName: 'Melati',
            patient: {
              encounterId: 'enc-1',
              patientId: 'patient-1',
              medicalRecordNumber: 'RM-001',
              patientName: 'Hasan Basri',
              gender: 'male',
              ageLabel: '45 th',
              dpjpName: 'dr. Andi, Sp.PD',
              diagnosisSummary: 'Pneumonia komunitas',
              admissionDateTime: '2026-04-22T08:00:00.000Z',
              lengthOfStayLabel: '2 hari',
              paymentLabel: 'BPJS - BPJS Kesehatan',
              vitalSigns: {
                systolicBp: '118',
                diastolicBp: '78',
                heartRate: '82',
                respiratoryRate: null,
                temperature: '36.7',
                oxygenSaturation: '98'
              }
            }
          }
        ]
      }
    ]
  })
  const markup = renderToStaticMarkup(<RawatInapBedMapPage state={state} />)

  assert.equal(markup.includes('Hasan Basri'), true)
  assert.equal(markup.includes('Pneumonia komunitas'), true)
  assert.equal(markup.includes('BPJS - BPJS Kesehatan'), true)
})

test('Rawat Inap bed map page renders multiple rooms under one prefix bangsal', () => {
  const state = createRawatInapStateFromBedMapSnapshot({
    generatedAt: '2026-04-27T09:00:00.000Z',
    summary: {
      totalRooms: 2,
      totalBeds: 2,
      occupiedBeds: 0,
      availableBeds: 2,
      cleaningBeds: 0
    },
    wards: [
      {
        roomId: 'room-melati-302',
        roomName: 'Melati 302',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-melati-302-a',
            bedName: '302-A',
            status: 'TERSEDIA',
            roomId: 'room-melati-302',
            roomName: 'Melati 302',
            patient: null
          }
        ]
      },
      {
        roomId: 'room-melati-303',
        roomName: 'Melati 303',
        floor: '3',
        classLabel: 'Kelas 1',
        capacity: 1,
        occupancy: { occupied: 0, total: 1, percentage: 0 },
        beds: [
          {
            bedId: 'bed-melati-303-a',
            bedName: '303-A',
            status: 'TERSEDIA',
            roomId: 'room-melati-303',
            roomName: 'Melati 303',
            patient: null
          }
        ]
      }
    ]
  })
  const markup = renderToStaticMarkup(<RawatInapBedMapPage state={state} />)

  assert.equal(markup.includes('Bangsal Melati'), true)
  assert.equal(markup.includes('2 kamar'), true)
  assert.equal(markup.includes('R. 302'), true)
  assert.equal(markup.includes('R. 303'), true)
})
