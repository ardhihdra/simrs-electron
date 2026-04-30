import React from 'react'

import {
  DesktopDispositionWorkflow,
  type DesktopDispositionBannerMeta,
  type DesktopDispositionConfirmPayload,
  type DesktopDispositionOption,
  type DesktopDispositionType
} from '../../components/design-system/organisms/DesktopDispositionWorkflow'
import { type IgdDashboardPatient } from './igd.data'
import { getIgdTriageLevelMeta, isIgdTriageLevel } from './igd.triage-level'

export type IgdDispositionType = DesktopDispositionType
export type IgdDispositionConfirmPayload = DesktopDispositionConfirmPayload

type IgdDisposisiPageProps = {
  patient: IgdDashboardPatient
  onBack: () => void
  onConfirm: (payload: IgdDispositionConfirmPayload) => void | Promise<void>
  isSubmitting?: boolean
  renderReferralForm?: (args: {
    type: Extract<IgdDispositionType, 'rujuk-i' | 'rujuk-e'>
  }) => React.ReactElement | null
}

const TRIAGE_FALLBACK_META: DesktopDispositionBannerMeta = {
  label: 'L-',
  name: 'Belum triase',
  colorName: 'Menunggu penilaian',
  badgeTone: 'neutral',
  background: 'var(--surface-2)',
  borderColor: 'var(--border-strong)',
  color: 'var(--text-3)'
}

const DISPOSITION_OPTIONS: DesktopDispositionOption[] = [
  {
    key: 'pulang',
    label: 'Pulang',
    subtitle: 'Pasien diizinkan pulang',
    dischargeDisposition: 'CURED',
    color: 'var(--ok)',
    softColor: 'var(--ok-soft)',
    tone: 'success'
  },
  {
    key: 'ranap',
    label: 'Rawat Inap',
    subtitle: 'Transfer ke bangsal rawat inap',
    dischargeDisposition: 'REFERRED',
    color: 'var(--accent)',
    softColor: 'var(--accent-soft)',
    tone: 'accent'
  },
  {
    key: 'rujuk-i',
    label: 'Rujuk Internal',
    subtitle: 'Pindah ke poli/divisi dalam RS',
    dischargeDisposition: 'REFERRED',
    color: 'var(--info)',
    softColor: 'var(--info-soft)',
    tone: 'info'
  },
  {
    key: 'rujuk-e',
    label: 'Rujuk Eksternal',
    subtitle: 'Ke RS / faskes lain',
    dischargeDisposition: 'REFERRED',
    color: 'var(--violet)',
    softColor: 'var(--violet-soft)',
    tone: 'violet'
  },
  {
    key: 'meninggal',
    label: 'Meninggal',
    subtitle: 'Dinyatakan meninggal dunia',
    dischargeDisposition: 'DECEASED',
    color: 'var(--text-3)',
    softColor: 'var(--surface-2)',
    tone: 'neutral'
  },
  {
    key: 'paksa',
    label: 'Pulang Paksa',
    subtitle: 'Atas permintaan sendiri (APS)',
    dischargeDisposition: 'AGAINST_ADVICE',
    color: 'var(--warn)',
    softColor: 'var(--warn-soft)',
    tone: 'warning'
  }
]

const getTriageMeta = (level: unknown) => {
  if (isIgdTriageLevel(level)) {
    const meta = getIgdTriageLevelMeta(level)

    return {
      label: meta.label,
      name: meta.name,
      colorName: meta.colorName,
      badgeTone: meta.badgeTone,
      background: meta.background,
      borderColor: meta.borderColor,
      color: meta.foreground
    } satisfies DesktopDispositionBannerMeta
  }

  return TRIAGE_FALLBACK_META
}

export function IgdDisposisiPage({
  patient,
  onBack,
  onConfirm,
  isSubmitting = false,
  renderReferralForm
}: IgdDisposisiPageProps) {
  const triageMeta = getTriageMeta(patient.triageLevel)

  return (
    <div className="igd-parity-scope">
      <DesktopDispositionWorkflow
        patient={{
          name: patient.name,
          registrationNumber: patient.registrationNumber,
          ageLabel: patient.ageLabel,
          paymentLabel: patient.paymentLabel,
          statusLabel: 'Encounter IGD'
        }}
        bannerMeta={triageMeta}
        summaryItems={[
          { label: 'No. Reg', value: patient.registrationNumber, mono: true },
          {
            label: 'No. RM',
            value: patient.medicalRecordNumber || patient.tempCode || '-',
            mono: true
          },
          { label: 'Umur', value: patient.ageLabel },
          { label: 'Jenis Kelamin', value: patient.genderLabel },
          { label: 'Penjamin', value: patient.paymentLabel },
          { label: 'Waktu Tiba', value: patient.arrivalTime, mono: true },
          { label: 'Dokter IGD', value: patient.doctorName || 'Belum dipilih' },
          { label: 'Triase', value: `${triageMeta.label} - ${triageMeta.name}` }
        ]}
        options={DISPOSITION_OPTIONS}
        onBack={onBack}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
        backendNote="Detail field mockup seperti instruksi DPJP, obat pulang, penyebab kematian, dan data klinis tambahan sebagian besar masih UI; yang dikirim dari disposisi umum baru dischargeDisposition dan dischargeNote."
        renderReferralForm={renderReferralForm}
      />
    </div>
  )
}
