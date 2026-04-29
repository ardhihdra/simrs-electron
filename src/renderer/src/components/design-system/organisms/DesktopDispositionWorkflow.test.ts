import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  buildDispositionConfirmPayload,
  buildDispositionBillingSummary,
  buildDispositionMedicationRows,
  DesktopDispositionWorkflow
} from './DesktopDispositionWorkflow'

test('buildDispositionMedicationRows maps medication dispense rows for discharge medicine', () => {
  const rows = buildDispositionMedicationRows([
    {
      status: 'completed',
      patientId: 'patient-1',
      quantity: { value: 30, unit: 'tab' },
      medication: { name: 'Amlodipine 10mg' },
      dosageInstruction: [{ text: '1x1 pagi selama 30 hari' }]
    },
    {
      status: 'preparation',
      patientId: 'patient-1',
      quantity: { value: 10, unit: 'kapsul' },
      authorizingPrescription: {
        item: { nama: 'Omeprazole 20mg' },
        dosageInstruction: [{ text: '2x1 ac' }]
      }
    }
  ])

  assert.deepEqual(rows, [
    {
      drug: 'Amlodipine 10mg',
      instruction: '1x1 pagi selama 30 hari',
      quantityLabel: '30 tab'
    },
    {
      drug: 'Omeprazole 20mg',
      instruction: '2x1 ac',
      quantityLabel: '10 kapsul'
    }
  ])
})

test('buildDispositionBillingSummary flattens encounter invoice categories and totals', () => {
  const summary = buildDispositionBillingSummary({
    encounterId: 'enc-1',
    encounterCode: 'ENC-001',
    patientId: 'patient-1',
    total: 450000,
    penjamin: 'BPJS',
    tindakanItems: [
      {
        category: 'tindakan',
        description: 'Visite DPJP',
        qty: 1,
        unitPrice: 150000,
        subtotal: 150000
      }
    ],
    obatItems: [
      {
        category: 'obat',
        description: 'Amlodipine 10mg x 30 tab',
        qty: 30,
        unitPrice: 10000,
        subtotal: 300000
      }
    ]
  })

  assert.deepEqual(summary, {
    rows: [
      {
        category: 'Tindakan Medis',
        item: 'Visite DPJP',
        qtyLabel: '1',
        tariff: 150000,
        total: 150000
      },
      {
        category: 'Obat',
        item: 'Amlodipine 10mg x 30 tab',
        qtyLabel: '30',
        tariff: 10000,
        total: 300000
      }
    ],
    total: 450000,
    guarantorLabel: 'BPJS'
  })
})

test('buildDispositionConfirmPayload maps discharge status to backend discharge disposition', () => {
  assert.deepEqual(
    buildDispositionConfirmPayload({
      dischargeStatus: 'sembuh',
      note: 'boleh pulang'
    }),
    {
      type: 'pulang',
      dischargeStatus: 'sembuh',
      dischargeDisposition: 'CURED',
      note: 'boleh pulang'
    }
  )

  assert.deepEqual(
    buildDispositionConfirmPayload({
      dischargeStatus: 'meninggal',
      note: ''
    }),
    {
      type: 'meninggal',
      dischargeStatus: 'meninggal',
      dischargeDisposition: 'DECEASED',
      note: ''
    }
  )
})

test('DesktopDispositionWorkflow discharge screen uses status keluar without jenis disposisi grid', () => {
  const markup = renderToStaticMarkup(
    React.createElement(DesktopDispositionWorkflow, {
      patient: {
        name: 'Budi Santoso',
        registrationNumber: 'enc-1',
        ageLabel: '54 L',
        paymentLabel: 'BPJS'
      },
      bannerMeta: {
        label: 'RI',
        name: 'Rawat Inap',
        colorName: 'Bangsal',
        badgeTone: 'neutral',
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text)'
      },
      summaryItems: [],
      options: [],
      defaultDisposition: 'rujuk-e',
      onBack: () => undefined,
      onConfirm: () => undefined,
      renderReferralForm: () => React.createElement('div', null, 'FORM RUJUKAN EXISTING')
    })
  )

  assert.equal(markup.includes('Status Keluar'), true)
  assert.equal(markup.includes('Jenis Disposisi'), false)
  assert.equal(markup.includes('FORM RUJUKAN EXISTING'), true)
  assert.equal(markup.includes('Kirim Resep Pulang ke Farmasi'), false)
})

test('DesktopDispositionWorkflow renders existing referral form when discharge status is rujuk', () => {
  const markup = renderToStaticMarkup(
    React.createElement(DesktopDispositionWorkflow, {
      patient: {
        name: 'Budi Santoso',
        registrationNumber: 'enc-1',
        ageLabel: '54 L',
        paymentLabel: 'BPJS'
      },
      bannerMeta: {
        label: 'RI',
        name: 'Rawat Inap',
        colorName: 'Bangsal',
        badgeTone: 'neutral',
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text)'
      },
      summaryItems: [],
      options: [],
      defaultDischargeStatus: 'rujuk',
      onBack: () => undefined,
      onConfirm: () => undefined,
      renderReferralForm: () => React.createElement('div', null, 'FORM RUJUKAN EXISTING')
    })
  )

  assert.equal(markup.includes('Status Keluar'), true)
  assert.equal(markup.includes('Form Rujukan'), true)
  assert.equal(markup.includes('FORM RUJUKAN EXISTING'), true)
})

test('DesktopDispositionWorkflow shows discharge medication as display-only data', () => {
  const markup = renderToStaticMarkup(
    React.createElement(DesktopDispositionWorkflow, {
      patient: {
        name: 'Budi Santoso',
        registrationNumber: 'enc-1',
        ageLabel: '54 L',
        paymentLabel: 'BPJS'
      },
      bannerMeta: {
        label: 'RI',
        name: 'Rawat Inap',
        colorName: 'Bangsal',
        badgeTone: 'neutral',
        background: 'var(--surface-2)',
        borderColor: 'var(--border)',
        color: 'var(--text)'
      },
      summaryItems: [],
      options: [],
      dischargeMedications: [
        {
          status: 'completed',
          medication: { name: 'Amlodipine 10mg' },
          dosageInstruction: [{ text: '1x1 pagi' }],
          quantity: { value: 10, unit: 'tab' }
        }
      ],
      onBack: () => undefined,
      onConfirm: () => undefined
    })
  )

  assert.equal(markup.includes('Obat Pulang'), true)
  assert.equal(markup.includes('Amlodipine 10mg'), true)
  assert.equal(markup.includes('Kirim Resep Pulang ke Farmasi'), false)
})
