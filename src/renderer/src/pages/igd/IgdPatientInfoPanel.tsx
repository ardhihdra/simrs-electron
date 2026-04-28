/**
 * purpose: Panel informasi pasien IGD untuk menampilkan ringkasan detail, vital sign, dan timeline secara konsisten lintas halaman daftar dan triase dengan opsi override level triase untuk draft lokal.
 * main callers: `IgdDaftarPage` dan `IgdTriasePage`.
 * key dependencies: Komponen design-system desktop dan tipe `IgdDashboardPatient`.
 * main/public functions: `IgdPatientInfoPanel`.
 * side effects: Tidak ada; komponen presentasional read-only dengan opsi slot aksi.
 */
import React from 'react'

import {
  DesktopStatusPill,
  type DesktopStatusPillTone
} from '../../components/design-system/atoms/DesktopStatusPill'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import {
  DesktopTriageBadge,
  type DesktopTriageBadgeTone
} from '../../components/design-system/atoms/DesktopTriageBadge'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopPropertyGrid } from '../../components/design-system/molecules/DesktopPropertyGrid'
import { DesktopTimelineList } from '../../components/design-system/molecules/DesktopTimelineList'

import { type IgdDashboardPatient } from './igd.data'

type IgdStatusVariant = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'

type VitalTileTone = 'neutral' | 'warning' | 'danger'

type VitalTile = {
  key: string
  label: string
  value: string
  unit: string
  tone: VitalTileTone
}

type IgdPatientInfoPanelProps = {
  patient: IgdDashboardPatient | null
  actions?: React.ReactNode
  triageLevelOverride?: number
}

const resolveTriageLevelMeta = (levelNo: number): {
  label: string
  name: string
  colorName: string
  badgeTone: DesktopTriageBadgeTone
  background: string
  borderColor: string
  color: string
} => {
  if (levelNo === 0) {
    return {
      label: 'L0',
      name: 'Meninggal',
      colorName: 'HITAM',
      badgeTone: 'danger',
      background: '#111827',
      borderColor: '#030712',
      color: '#F9FAFB'
    }
  }
  if (levelNo === 1) {
    return {
      label: 'L1',
      name: 'Kritis',
      colorName: 'MERAH',
      badgeTone: 'danger',
      background: 'var(--danger-soft)',
      borderColor: 'var(--danger)',
      color: 'var(--danger)'
    }
  }
  if (levelNo === 2) {
    return {
      label: 'L2',
      name: 'Urgent',
      colorName: 'KUNING',
      badgeTone: 'warning',
      background: 'var(--warn-soft)',
      borderColor: 'var(--warn)',
      color: 'var(--warn)'
    }
  }
  if (levelNo === 3) {
    return {
      label: 'L3',
      name: 'Semi Urgent',
      colorName: 'HIJAU',
      badgeTone: 'success',
      background: 'var(--ok-soft)',
      borderColor: 'var(--ok)',
      color: 'var(--ok)'
    }
  }
  if (levelNo === 4) {
    return {
      label: 'L4',
      name: 'Tidak Urgent',
      colorName: 'PUTIH',
      badgeTone: 'neutral',
      background: '#F3F4F6',
      borderColor: '#9CA3AF',
      color: '#111827'
    }
  }

  return {
    label: `L${levelNo}`,
    name: 'Level Dinamis',
    colorName: 'NETRAL',
    badgeTone: 'neutral',
    background: 'var(--surface-2)',
    borderColor: 'var(--border-strong)',
    color: 'var(--text-3)'
  }
}

const STATUS_META: Record<IgdStatusVariant, { label: string; tone: DesktopStatusPillTone }> = {
  menunggu: { label: 'Menunggu', tone: 'neutral' },
  triase: { label: 'Triase', tone: 'warning' },
  penanganan: { label: 'Penanganan', tone: 'accent' },
  observasi: { label: 'Observasi', tone: 'violet' },
  disposisi: { label: 'Disposisi', tone: 'success' }
}

const formatVitalValue = (value?: string, unit?: string) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return '—'
  }

  return unit ? `${normalized} ${unit}` : normalized
}

const buildVitalTiles = (vitalSigns?: IgdDashboardPatient['vitalSigns']): VitalTile[] => {
  return [
    {
      key: 'blood-pressure',
      label: 'TD',
      value: formatVitalValue(vitalSigns?.bloodPressure),
      unit: 'mmHg',
      tone: 'neutral'
    },
    {
      key: 'pulse-rate',
      label: 'Nadi',
      value: formatVitalValue(vitalSigns?.pulseRate),
      unit: '/mnt',
      tone: 'danger'
    },
    {
      key: 'oxygen-saturation',
      label: 'SpO₂',
      value: formatVitalValue(vitalSigns?.oxygenSaturation),
      unit: '%',
      tone: 'danger'
    },
    {
      key: 'temperature',
      label: 'Suhu',
      value: formatVitalValue(vitalSigns?.temperature),
      unit: '°C',
      tone: 'neutral'
    },
    {
      key: 'respiratory-rate',
      label: 'RR',
      value: formatVitalValue(vitalSigns?.respiratoryRate),
      unit: '/mnt',
      tone: 'warning'
    },
    {
      key: 'gcs',
      label: 'GCS',
      value: formatVitalValue(vitalSigns?.gcs),
      unit: '',
      tone: 'neutral'
    }
  ]
}

export function IgdPatientInfoPanel({
  patient,
  actions,
  triageLevelOverride
}: IgdPatientInfoPanelProps) {
  const hasPatientVitalSigns = patient
    ? Object.values(patient.vitalSigns ?? {}).some((value) => String(value || '').trim())
    : false
  const patientVitalTiles = buildVitalTiles(patient?.vitalSigns)
  const effectiveTriageLevel = patient ? triageLevelOverride ?? patient.triageLevel : undefined
  const triageMeta = typeof effectiveTriageLevel === 'number'
    ? resolveTriageLevelMeta(effectiveTriageLevel)
    : null

  return (
    <div className="igd-detail-stack">
      <div className="px-[2px]">
        <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">Detail Pasien</div>
        <div className="text-[10.5px] text-[var(--ds-color-text-subtle)]">
          Snapshot operasional pasien yang sedang dipilih.
        </div>
      </div>

      {patient ? (
        <>
          <div className="igd-detail-panel">
            <div
              className="igd-detail-panel-header"
              style={{
                background: triageMeta?.background,
                borderBottomColor: triageMeta?.borderColor
              }}
            >
              <DesktopTriageBadge tone={triageMeta?.badgeTone ?? 'neutral'}>
                {triageMeta?.label ?? `L${effectiveTriageLevel ?? patient.triageLevel}`}
              </DesktopTriageBadge>
              <div
                className="igd-detail-level-text"
                style={{ color: triageMeta?.color }}
              >
                {(triageMeta?.name ?? 'Level').toUpperCase()} · {triageMeta?.colorName ?? 'NETRAL'}
              </div>
              <div className="ml-auto">
                <DesktopStatusPill tone={STATUS_META[patient.status].tone}>
                  {STATUS_META[patient.status].label}
                </DesktopStatusPill>
              </div>
            </div>

            <div className="igd-detail-panel-body">
              <div>
                <div className="text-[16px] font-bold text-[var(--ds-color-text)]">{patient.name}</div>
                <div className="mt-[3px] flex flex-wrap items-center gap-[8px]">
                  <span className="text-[11px] text-[var(--ds-color-text-subtle)]">{patient.ageLabel}</span>
                  {patient.isTemporaryPatient ? (
                    <DesktopStatusPill tone="violet">
                      Pasien Sementara · {patient.tempCode}
                    </DesktopStatusPill>
                  ) : (
                    <span className="font-mono text-[11px] text-[var(--ds-color-text-muted)]">
                      {patient.medicalRecordNumber}
                    </span>
                  )}
                  <DesktopTag tone="neutral">{patient.paymentLabel}</DesktopTag>
                </div>
              </div>

              <div className="igd-registry-strip">
                <span className="text-[11px] text-[var(--ds-color-text-subtle)]">No. Reg</span>
                <b className="font-mono text-[11px] text-[var(--ds-color-text)]">
                  {patient.registrationNumber}
                </b>
              </div>

              <div className="grid gap-[3px]">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ds-color-text-subtle)]">
                  Keluhan Utama
                </div>
                <div className="text-[13px] text-[var(--ds-color-text)]">{patient.complaint}</div>
              </div>

              <DesktopPropertyGrid
                items={[
                  { label: 'Sumber', value: patient.arrivalSource },
                  {
                    label: 'Dokter',
                    value: patient.doctorName || '— belum assign',
                    muted: !patient.doctorName
                  },
                  {
                    label: 'Bed',
                    value: patient.bedCode ?? '— belum assign',
                    mono: true,
                    muted: !patient.bedCode
                  },
                  { label: 'Masuk', value: patient.arrivalTime, mono: true }
                ]}
              />
            </div>
          </div>

          <DesktopCard title="Vital Sign" subtitle={`Triase ${patient.triageTime ?? '—'}`} compact>
            {hasPatientVitalSigns ? (
              <div className="grid grid-cols-3 gap-[8px]">
                {patientVitalTiles.map((item) => {
                  const isDanger = item.tone === 'danger'
                  const isWarning = item.tone === 'warning'

                  return (
                    <div
                      key={item.key}
                      data-vital-key={item.key}
                      data-vital-tone={item.tone}
                      className="rounded-[var(--ds-radius-md)] border"
                      style={{
                        padding: '8px 10px',
                        background: isDanger
                          ? 'color-mix(in srgb, var(--ds-color-danger) 16%, white)'
                          : isWarning
                            ? 'color-mix(in srgb, var(--ds-color-warning) 16%, white)'
                            : 'var(--surface-2)',
                        borderColor: isDanger
                          ? 'var(--ds-color-danger)'
                          : isWarning
                            ? 'var(--ds-color-warning)'
                            : 'var(--ds-color-border)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          lineHeight: 1.2,
                          color: isDanger
                            ? 'var(--ds-color-danger)'
                            : isWarning
                              ? 'var(--ds-color-warning)'
                              : 'var(--text-3)'
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 2,
                          marginTop: 2
                        }}
                      >
                        <b
                          style={{
                            fontSize: '17px',
                            lineHeight: 1.1,
                            fontFamily: 'var(--font-mono)',
                            color: isDanger
                              ? 'var(--ds-color-danger)'
                              : isWarning
                                ? 'var(--ds-color-warning)'
                                : 'var(--ds-color-text)'
                          }}
                        >
                          {item.value}
                        </b>
                        {item.value !== '—' && item.unit ? (
                          <span
                            style={{
                              fontSize: '10px',
                              lineHeight: 1.2,
                              color: 'var(--text-3)'
                            }}
                          >
                            {item.unit}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <DesktopNoticePanel
                title="Vital sign belum tersedia"
                description="Belum ada data observation vital sign untuk pasien ini."
              />
            )}
          </DesktopCard>

          <DesktopCard title="Time Tracking" subtitle="Data backend IGD" compact>
            <DesktopTimelineList
              items={[
                { label: 'Tiba di IGD', time: patient.arrivalTime, done: true },
                {
                  label: 'Triase Awal',
                  time: patient.triageTime ?? 'Belum',
                  done: !!patient.triageTime
                },
                {
                  label: 'Dokter',
                  time: patient.doctorName || 'Belum assign',
                  done: !!patient.doctorName
                },
                {
                  label: 'Bed',
                  time: patient.bedCode ?? 'Belum assign',
                  done: !!patient.bedCode
                },
                { label: 'Keluar IGD', time: 'Belum', done: false }
              ]}
            />
          </DesktopCard>

          {actions ? <div className="flex flex-col gap-[6px]">{actions}</div> : null}
        </>
      ) : (
        <DesktopCard title="Detail Pasien">
          <DesktopNoticePanel
            title="Belum ada pasien aktif"
            description="Dashboard IGD belum memiliki pasien aktif untuk ditampilkan."
          />
        </DesktopCard>
      )}
    </div>
  )
}
