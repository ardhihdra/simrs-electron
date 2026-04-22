import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopStatusDot, type DesktopStatus } from '../../components/design-system/atoms/DesktopStatusDot'
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
import { DesktopCompactStatStrip } from '../../components/design-system/molecules/DesktopCompactStatStrip'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopPropertyGrid } from '../../components/design-system/molecules/DesktopPropertyGrid'
import { DesktopTimelineList } from '../../components/design-system/molecules/DesktopTimelineList'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import { type IgdDashboard, type IgdDashboardPatient } from './igd.data'

type IgdDaftarPageProps = {
  dashboard: IgdDashboard
  selectedPatientId?: string
  onSelectPatient?: (patientId: string) => void
  isLoading?: boolean
  errorMessage?: string
  onRetry?: () => void
  onOpenRegistrasi?: () => void
  onOpenTriase?: () => void
  onOpenBedMap?: () => void
}

type IgdStatusVariant = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'

const TRIAGE_LEVEL_META = {
  1: {
    label: 'L1',
    name: 'Resusitasi',
    colorName: 'MERAH',
    badgeTone: 'danger' as DesktopTriageBadgeTone,
    background: 'var(--danger-soft)',
    borderColor: 'var(--danger)',
    color: 'var(--danger)'
  },
  2: {
    label: 'L2',
    name: 'Emergensi',
    colorName: 'MERAH',
    badgeTone: 'warning' as DesktopTriageBadgeTone,
    background: 'oklch(0.96 0.06 50)',
    borderColor: 'oklch(0.52 0.18 35)',
    color: 'oklch(0.52 0.18 35)'
  },
  3: {
    label: 'L3',
    name: 'Urgen',
    colorName: 'KUNING',
    badgeTone: 'warning' as DesktopTriageBadgeTone,
    background: 'var(--warn-soft)',
    borderColor: 'var(--warn)',
    color: 'var(--warn)'
  },
  4: {
    label: 'L4',
    name: 'Semi-Urgen',
    colorName: 'HIJAU',
    badgeTone: 'success' as DesktopTriageBadgeTone,
    background: 'var(--ok-soft)',
    borderColor: 'var(--ok)',
    color: 'var(--ok)'
  },
  5: {
    label: 'L5',
    name: 'Tidak Urgen',
    colorName: 'HIJAU',
    badgeTone: 'neutral' as DesktopTriageBadgeTone,
    background: 'var(--surface-2)',
    borderColor: 'var(--border-strong)',
    color: 'var(--text-3)'
  }
} satisfies Record<
  IgdDashboardPatient['triageLevel'],
  {
    label: string
    name: string
    colorName: string
    badgeTone: DesktopTriageBadgeTone
    background: string
    borderColor: string
    color: string
  }
>

const STATUS_META: Record<
  IgdStatusVariant,
  { label: string; tone: DesktopStatusPillTone; dotStatus: DesktopStatus }
> = {
  menunggu: { label: 'Menunggu', tone: 'neutral', dotStatus: 'neutral' },
  triase: { label: 'Triase', tone: 'warning', dotStatus: 'warning' },
  penanganan: { label: 'Penanganan', tone: 'accent', dotStatus: 'accent' },
  observasi: { label: 'Observasi', tone: 'violet', dotStatus: 'info' },
  disposisi: { label: 'Disposisi', tone: 'success', dotStatus: 'success' }
}

const getTriageRowClassName = (patient: IgdDashboardPatient, isSelected: boolean) =>
  [
    `igd-row-level-${patient.triageLevel}`,
    patient.triageLevel <= 2 ? `igd-row-priority-${patient.triageLevel}` : '',
    isSelected ? 'igd-row-active-default' : ''
  ]
    .filter(Boolean)
    .join(' ')

const parseTimeToMinutes = (value?: string) => {
  if (!value) return null

  const [hourText, minuteText] = value.split(':')
  const hours = Number(hourText)
  const minutes = Number(minuteText)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

const formatElapsedSinceArrival = (arrivalTime?: string) => {
  const arrivalMinutes = parseTimeToMinutes(arrivalTime)
  if (arrivalMinutes === null) {
    return '—'
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const diffMinutes = currentMinutes - arrivalMinutes

  if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
    return '0m'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  return `${Math.floor(diffMinutes / 60)}j ${diffMinutes % 60}m`
}

const getPrimaryAction = (patient: IgdDashboardPatient) => {
  if (patient.status === 'menunggu' || patient.status === 'triase') {
    return { label: 'Triase', emphasis: 'toolbar' as const, className: 'igd-inline-action' }
  }

  if (patient.status === 'penanganan' || patient.status === 'observasi') {
    return { label: 'Bed', emphasis: 'toolbar' as const, className: 'igd-inline-action' }
  }

  return null
}

export function IgdDaftarPage({
  dashboard,
  selectedPatientId,
  onSelectPatient,
  isLoading = false,
  errorMessage,
  onRetry,
  onOpenRegistrasi,
  onOpenTriase,
  onOpenBedMap
}: IgdDaftarPageProps) {
  const patients = dashboard.patients
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null
  const criticalCount = patients.filter((patient) => patient.triageLevel <= 2).length
  const triageCounts = useMemo(
    () => [
      dashboard.summary.triageCounts['1'],
      dashboard.summary.triageCounts['2'],
      dashboard.summary.triageCounts['3'],
      dashboard.summary.triageCounts['4'],
      dashboard.summary.triageCounts['5']
    ],
    [dashboard.summary.triageCounts]
  )

  const columns = useMemo<ColumnsType<IgdDashboardPatient>>(
    () => [
      {
        title: 'Level',
        dataIndex: 'triageLevel',
        key: 'triageLevel',
        width: 68,
        render: (level: IgdDashboardPatient['triageLevel']) => (
          <div className="flex items-center">
            <DesktopTriageBadge tone={TRIAGE_LEVEL_META[level].badgeTone}>
              {TRIAGE_LEVEL_META[level].label}
            </DesktopTriageBadge>
          </div>
        )
      },
      {
        title: 'Pasien & Keluhan',
        key: 'patient',
        render: (_, patient) => (
          <div className="igd-patient-cell">
            <div className="igd-patient-name-row">
              <span className="igd-patient-name">{patient.name}</span>
              {patient.isTemporaryPatient ? <DesktopTag tone="accent">Temp</DesktopTag> : null}
              {patient.paymentLabel === 'BPJS' ? <DesktopTag tone="neutral">BPJS</DesktopTag> : null}
            </div>
            <div className="igd-patient-meta">
              <span className="font-mono">
                {patient.isTemporaryPatient ? patient.tempCode : patient.medicalRecordNumber}
              </span>
              <span>{patient.ageLabel}</span>
              <span className="font-mono">{patient.registrationNumber}</span>
            </div>
            <div className="igd-patient-complaint">{patient.complaint}</div>
          </div>
        )
      },
      {
        title: 'Status',
        key: 'status',
        width: 108,
        render: (_, patient) => (
          <div className="flex items-center">
            <DesktopStatusPill tone={STATUS_META[patient.status].tone}>
              {STATUS_META[patient.status].label}
            </DesktopStatusPill>
          </div>
        )
      },
      {
        title: 'Bed / Elapsed',
        key: 'bedElapsed',
        width: 88,
        render: (_, patient) => (
          <div className="igd-bed-cell">
            {patient.bedCode ? (
              <DesktopTriageBadge tone="neutral" compact>
                {patient.bedCode}
              </DesktopTriageBadge>
            ) : (
              <span className="igd-bed-empty">— assign</span>
            )}
            <span className="igd-elapsed-text">{formatElapsedSinceArrival(patient.arrivalTime)}</span>
          </div>
        )
      }
    ],
    []
  )

  return (
    <div className="igd-parity-scope flex flex-col gap-[16px]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Daftar Pasien IGD"
        subtitle="Ringkasan operasional pasien aktif, prioritas triase, dan utilisasi bed instalasi gawat darurat."
        status={isLoading ? 'Memuat data' : 'Terhubung backend'}
        metadata={
          <div className="flex flex-wrap items-center gap-[8px]">
            <DesktopStatusDot
              status={criticalCount > 0 ? 'danger' : 'success'}
              label={`${criticalCount} pasien kritis`}
            />
            <DesktopBadge tone="accent">{dashboard.summary.totalActive} pasien aktif</DesktopBadge>
          </div>
        }
        actions={
          <>
            <DesktopButton emphasis="toolbar" onClick={onOpenBedMap}>
              Peta Bed
            </DesktopButton>
            <DesktopButton emphasis="secondary" onClick={onOpenTriase}>
              Buka Triase
            </DesktopButton>
            <DesktopButton emphasis="primary" onClick={onOpenRegistrasi}>
              Registrasi Baru
            </DesktopButton>
          </>
        }
      />

      {isLoading ? (
        <DesktopCard title="Memuat dashboard IGD" subtitle="Mengambil pasien aktif dan snapshot bed dari backend.">
          <DesktopNoticePanel
            title="Memuat dashboard IGD"
            description="Data daftar pasien dan registrasi sedang disinkronkan."
          />
        </DesktopCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <DesktopCard title="Gagal memuat dashboard" subtitle="Coba muat ulang koneksi ke backend IGD.">
          <div className="grid gap-[12px]">
            <DesktopNoticePanel title="Gagal memuat dashboard" description={errorMessage} tone="danger" />
            <div>
              <DesktopButton emphasis="primary" onClick={onRetry}>
                Muat Ulang
              </DesktopButton>
            </div>
          </div>
        </DesktopCard>
      ) : null}

      {!isLoading && !errorMessage && criticalCount > 0 ? (
        <DesktopCard
          title="Perhatian Operasional"
          subtitle="Pasien level 1-2 harus diprioritaskan untuk triase dan penempatan bed resusitasi."
          extra={<DesktopBadge tone="danger">{criticalCount} pasien kritis</DesktopBadge>}
          tone="muted"
          compact
        >
          <div className="flex flex-wrap items-center gap-[8px] text-[13px] text-[var(--ds-color-text-muted)]">
            {patients
              .filter((patient) => patient.triageLevel <= 2)
              .map((patient) => (
                <DesktopTag key={patient.id} tone="danger">
                  {patient.name}
                </DesktopTag>
              ))}
          </div>
        </DesktopCard>
      ) : null}

      <DesktopCompactStatStrip
        totalActive={String(dashboard.summary.totalActive)}
        triageLevels={[
          { label: 'L1', value: String(triageCounts[0]), tone: 'danger' },
          { label: 'L2', value: String(triageCounts[1]), tone: 'warning' },
          { label: 'L3', value: String(triageCounts[2]), tone: 'warning' },
          { label: 'L4', value: String(triageCounts[3]), tone: 'success' },
          { label: 'L5', value: String(triageCounts[4]), tone: 'neutral' }
        ]}
        bedAvailable={String(dashboard.summary.bedAvailable)}
        bedTotal={String(dashboard.summary.bedTotal)}
        averageResponse={String(dashboard.summary.averageResponseMinutes)}
        totalToday={String(dashboard.summary.totalToday)}
        statusBadges={[
          { label: 'SATUSEHAT', tone: 'success' },
          { label: 'EMR Aktif', tone: 'accent' }
        ]}
      />

      {!isLoading && !errorMessage ? (
        <div className="igd-daftar-grid">
          <DesktopCard
            title="Daftar Pasien IGD"
            subtitle="Diurutkan level triase · real-time"
            extra={
              <div className="flex items-center gap-[8px]">
                <DesktopBadge tone="accent">{patients.length} baris</DesktopBadge>
                <DesktopButton emphasis="ghost" size="small">
                  Filter
                </DesktopButton>
                <DesktopButton emphasis="primary" size="small" onClick={onOpenRegistrasi}>
                  Pasien Baru
                </DesktopButton>
              </div>
            }
          >
            <DesktopGenericTable<IgdDashboardPatient>
              rowKey="id"
              columns={columns}
              dataSource={patients}
              tableProps={{
                className: 'igd-patient-table',
                scroll: { x: 780 },
                rowClassName: (record) => getTriageRowClassName(record, record.id === selectedPatient?.id),
                onRow: (record) => ({
                  onClick: () => onSelectPatient?.(record.id)
                })
              }}
              action={{
                title: 'Aksi',
                width: 80,
                align: 'left',
                render: (record) => {
                  const action = getPrimaryAction(record)
                  if (!action) return null

                  return (
                    <DesktopButton
                      emphasis={action.emphasis}
                      size="small"
                      className={action.className}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectPatient?.(record.id)

                        if (record.status === 'menunggu' || record.status === 'triase') {
                          onOpenTriase?.()
                          return
                        }

                        onOpenBedMap?.()
                      }}
                    >
                      {action.label}
                    </DesktopButton>
                  )
                }
              }}
            />
          </DesktopCard>

          <div className="igd-detail-stack">
            <div className="px-[2px]">
              <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">Detail Pasien</div>
              <div className="text-[10.5px] text-[var(--ds-color-text-subtle)]">
                Snapshot operasional pasien yang sedang dipilih.
              </div>
            </div>

            {selectedPatient ? (
              <>
                <div className="igd-detail-panel">
                  <div
                    className="igd-detail-panel-header"
                    style={{
                      background: TRIAGE_LEVEL_META[selectedPatient.triageLevel].background,
                      borderBottomColor: TRIAGE_LEVEL_META[selectedPatient.triageLevel].borderColor
                    }}
                  >
                    <DesktopTriageBadge tone={TRIAGE_LEVEL_META[selectedPatient.triageLevel].badgeTone}>
                      {TRIAGE_LEVEL_META[selectedPatient.triageLevel].label}
                    </DesktopTriageBadge>
                    <div
                      className="igd-detail-level-text"
                      style={{ color: TRIAGE_LEVEL_META[selectedPatient.triageLevel].color }}
                    >
                      {TRIAGE_LEVEL_META[selectedPatient.triageLevel].name.toUpperCase()} ·{' '}
                      {TRIAGE_LEVEL_META[selectedPatient.triageLevel].colorName}
                    </div>
                    <div className="ml-auto">
                      <DesktopStatusPill tone={STATUS_META[selectedPatient.status].tone}>
                        {STATUS_META[selectedPatient.status].label}
                      </DesktopStatusPill>
                    </div>
                  </div>

                  <div className="igd-detail-panel-body">
                    <div>
                      <div className="text-[16px] font-bold text-[var(--ds-color-text)]">
                        {selectedPatient.name}
                      </div>
                      <div className="mt-[3px] flex flex-wrap items-center gap-[8px]">
                        <span className="text-[11px] text-[var(--ds-color-text-subtle)]">
                          {selectedPatient.ageLabel}
                        </span>
                        {selectedPatient.isTemporaryPatient ? (
                          <DesktopStatusPill tone="violet">
                            Pasien Sementara · {selectedPatient.tempCode}
                          </DesktopStatusPill>
                        ) : (
                          <span className="font-mono text-[11px] text-[var(--ds-color-text-muted)]">
                            {selectedPatient.medicalRecordNumber}
                          </span>
                        )}
                        <DesktopTag tone="neutral">{selectedPatient.paymentLabel}</DesktopTag>
                      </div>
                    </div>

                    <div className="igd-registry-strip">
                      <span className="text-[11px] text-[var(--ds-color-text-subtle)]">No. Reg</span>
                      <b className="font-mono text-[11px] text-[var(--ds-color-text)]">
                        {selectedPatient.registrationNumber}
                      </b>
                    </div>

                    <div className="grid gap-[3px]">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[var(--ds-color-text-subtle)]">
                        Keluhan Utama
                      </div>
                      <div className="text-[13px] text-[var(--ds-color-text)]">
                        {selectedPatient.complaint}
                      </div>
                    </div>

                    <DesktopPropertyGrid
                      items={[
                        { label: 'Sumber', value: selectedPatient.arrivalSource },
                        {
                          label: 'Dokter',
                          value: selectedPatient.doctorName || '— belum assign',
                          muted: !selectedPatient.doctorName
                        },
                        {
                          label: 'Bed',
                          value: selectedPatient.bedCode ?? '— belum assign',
                          mono: true,
                          muted: !selectedPatient.bedCode
                        },
                        { label: 'Masuk', value: selectedPatient.arrivalTime, mono: true }
                      ]}
                    />
                  </div>
                </div>

                <DesktopCard title="Vital Sign" subtitle={`Triase ${selectedPatient.triageTime ?? '—'}`} compact>
                  <DesktopNoticePanel
                    title="Vital sign belum tersedia"
                    description="Integrasi backend tahap ini baru mencakup registrasi dan dashboard operasional IGD."
                  />
                </DesktopCard>

                <DesktopCard title="Time Tracking" subtitle="Data backend IGD" compact>
                  <DesktopTimelineList
                    items={[
                      { label: 'Tiba di IGD', time: selectedPatient.arrivalTime, done: true },
                      {
                        label: 'Triase Awal',
                        time: selectedPatient.triageTime ?? 'Belum',
                        done: !!selectedPatient.triageTime
                      },
                      {
                        label: 'Dokter',
                        time: selectedPatient.doctorName || 'Belum assign',
                        done: !!selectedPatient.doctorName
                      },
                      {
                        label: 'Bed',
                        time: selectedPatient.bedCode ?? 'Belum assign',
                        done: !!selectedPatient.bedCode
                      },
                      { label: 'Keluar IGD', time: 'Belum', done: false }
                    ]}
                  />
                </DesktopCard>

                <div className="flex flex-col gap-[6px]">
                  <DesktopButton emphasis="toolbar" className="!justify-center" onClick={onOpenTriase}>
                    Form Triase
                  </DesktopButton>
                  {!selectedPatient.bedCode ? (
                    <DesktopButton emphasis="toolbar" className="!justify-center" onClick={onOpenBedMap}>
                      Assign Bed IGD
                    </DesktopButton>
                  ) : null}
                  <DesktopButton emphasis="primary" className="!justify-center">
                    Buka Pemeriksaan
                  </DesktopButton>
                  <DesktopButton
                    emphasis="toolbar"
                    className="!justify-center !border-[var(--ds-color-success)] !bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] !text-[var(--ds-color-success)]"
                  >
                    Disposisi
                  </DesktopButton>
                </div>
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
        </div>
      ) : null}
    </div>
  )
}
