import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { RawatInapBedMapPage } from './RawatInapBedMapPage.tsx'
import { RawatInapTransferPage } from './RawatInapTransferPage.tsx'
import { createRawatInapInitialState, createRawatInapStateFromBedMapSnapshot } from './rawat-inap.state.ts'

void React

test('Rawat Inap bed map page renders ward sidebar, bed grid, and detail panel', () => {
  const markup = renderToStaticMarkup(<RawatInapBedMapPage state={createRawatInapInitialState()} />)

  assert.equal(markup.includes('Rawat Inap — Peta Bed'), true)
  assert.equal(markup.includes('Fullscreen'), true)
  assert.equal(markup.includes('rawat-inap-bed-map-layout'), true)
  assert.equal(markup.includes('Bangsal'), true)
  assert.equal(markup.includes('Detail Bed'), true)
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
