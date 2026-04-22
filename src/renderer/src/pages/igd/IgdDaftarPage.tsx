import type { ColumnsType } from 'antd/es/table'
import React from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
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
import {
  DesktopMetricTile,
  type DesktopMetricTone
} from '../../components/design-system/molecules/DesktopMetricTile'
import { DesktopPropertyGrid } from '../../components/design-system/molecules/DesktopPropertyGrid'
import { DesktopTimelineList } from '../../components/design-system/molecules/DesktopTimelineList'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'

import { IGD_PAGE_PATHS } from './igd.config'
import { useIgdStore, type IgdPatient } from './igd.state'

type IgdDaftarPageProps = {
  onOpenRegistrasi?: () => void
  onOpenTriase?: () => void
  onOpenBedMap?: () => void
}

type IgdStatusVariant =
  | 'menunggu'
  | 'triase-quick'
  | 'triase-lengkap'
  | 'penanganan'
  | 'observasi'
  | 'disposisi'

const CURRENT_IGD_TIME = '10:25 WIB'
const CURRENT_IGD_MINUTES = 10 * 60 + 25

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
  IgdPatient['triageLevel'],
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
  'triase-quick': { label: 'Triase Awal', tone: 'warning', dotStatus: 'warning' },
  'triase-lengkap': { label: 'Triase Lengkap', tone: 'info', dotStatus: 'info' },
  penanganan: { label: 'Penanganan', tone: 'accent', dotStatus: 'accent' },
  observasi: { label: 'Observasi', tone: 'violet', dotStatus: 'info' },
  disposisi: { label: 'Disposisi', tone: 'success', dotStatus: 'success' }
}

const getPatientStatusVariant = (patient: IgdPatient): IgdStatusVariant => {
  if (patient.status === 'triase') {
    return patient.bedCode ? 'triase-lengkap' : 'triase-quick'
  }

  return patient.status
}

const getTriageRowClassName = (patient: IgdPatient, isSelected: boolean) =>
  [
    `igd-row-level-${patient.triageLevel}`,
    patient.triageLevel <= 2 ? `igd-row-priority-${patient.triageLevel}` : '',
    isSelected ? 'igd-row-active-default' : ''
  ]
    .filter(Boolean)
    .join(' ')

const getVitalTone = (metric: string, patient: IgdPatient): DesktopMetricTone => {
  if (!patient.vitalSigns) return 'neutral'
  if (metric === 'pulse') {
    return patient.vitalSigns.pulse < 60 || patient.vitalSigns.pulse > 100 ? 'danger' : 'neutral'
  }
  if (metric === 'oxygenSaturation') {
    return patient.vitalSigns.oxygenSaturation < 95 ? 'danger' : 'neutral'
  }
  if (metric === 'temperature') {
    return patient.vitalSigns.temperature > 38 ? 'warning' : 'neutral'
  }
  if (metric === 'respiratoryRate') {
    return patient.vitalSigns.respiratoryRate < 12 || patient.vitalSigns.respiratoryRate > 20
      ? 'warning'
      : 'neutral'
  }
  if (metric === 'gcs') {
    return patient.vitalSigns.gcs < 14 ? 'danger' : 'neutral'
  }
  return 'neutral'
}

const formatElapsedSinceArrival = (arrivalTime: string) => {
  const [hourText, minuteText] = arrivalTime.split(':')
  const arrivalMinutes = Number(hourText) * 60 + Number(minuteText)
  const diffMinutes = CURRENT_IGD_MINUTES - arrivalMinutes

  if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
    return '0m'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }

  return `${Math.floor(diffMinutes / 60)}j ${diffMinutes % 60}m`
}

const getPrimaryAction = (patient: IgdPatient) => {
  const statusVariant = getPatientStatusVariant(patient)

  if (statusVariant === 'menunggu') {
    return { label: 'Triase', emphasis: 'toolbar' as const, className: 'igd-inline-action' }
  }

  if (statusVariant === 'triase-quick') {
    return {
      label: 'Lengkap',
      emphasis: 'toolbar' as const,
      className: 'igd-inline-action igd-inline-action--warning'
    }
  }

  if (statusVariant === 'triase-lengkap') {
    return { label: 'Tangani', emphasis: 'primary' as const, className: 'igd-inline-action' }
  }

  if (statusVariant === 'penanganan' || statusVariant === 'observasi') {
    return {
      label: 'Disp.',
      emphasis: 'toolbar' as const,
      className: 'igd-inline-action igd-inline-action--success'
    }
  }

  return null
}

export function IgdDaftarPage({
  onOpenRegistrasi,
  onOpenTriase,
  onOpenBedMap
}: IgdDaftarPageProps) {
  const patients = useIgdStore((state) => state.patients)
  const beds = useIgdStore((state) => state.beds)
  const selectedPatientId = useIgdStore((state) => state.selectedPatientId)
  const setSelectedPatient = useIgdStore((state) => state.setSelectedPatient)

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0]
  const criticalCount = patients.filter((patient) => patient.triageLevel <= 2).length
  const selectedLevelMeta = TRIAGE_LEVEL_META[selectedPatient.triageLevel]
  const selectedStatusMeta = STATUS_META[getPatientStatusVariant(selectedPatient)]

  const triageCounts = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((level) =>
        patients.filter((patient) => patient.triageLevel === level).length
      ),
    [patients]
  )

  const columns = useMemo<ColumnsType<IgdPatient>>(
    () => [
      {
        title: 'Level',
        dataIndex: 'triageLevel',
        key: 'triageLevel',
        width: 68,
        render: (level: IgdPatient['triageLevel']) => (
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
        render: (_, patient) => {
          const statusMeta = STATUS_META[getPatientStatusVariant(patient)]

          return (
            <div className="flex items-center">
              <DesktopStatusPill tone={statusMeta.tone}>{statusMeta.label}</DesktopStatusPill>
            </div>
          )
        }
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
        status="Mock aktif"
        metadata={
          <div className="flex flex-wrap items-center gap-[8px]">
            <DesktopStatusDot
              status={criticalCount > 0 ? 'danger' : 'success'}
              label={`${criticalCount} pasien kritis`}
            />
            <DesktopBadge tone="accent">{patients.length} pasien aktif</DesktopBadge>
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

      {criticalCount > 0 ? (
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
        totalActive={String(patients.length)}
        triageLevels={[
          { label: 'L1', value: String(triageCounts[0]), tone: 'danger' },
          { label: 'L2', value: String(triageCounts[1]), tone: 'warning' },
          { label: 'L3', value: String(triageCounts[2]), tone: 'warning' },
          { label: 'L4', value: String(triageCounts[3]), tone: 'success' },
          { label: 'L5', value: String(triageCounts[4]), tone: 'neutral' }
        ]}
        bedAvailable={String(beds.filter((bed) => bed.status === 'available').length)}
        bedTotal={String(beds.length)}
        averageResponse="4.2"
        totalToday="24"
        statusBadges={[
          { label: 'SATUSEHAT', tone: 'success' },
          { label: 'EMR Aktif', tone: 'accent' }
        ]}
      />

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
          <DesktopGenericTable<IgdPatient>
            rowKey="id"
            columns={columns}
            dataSource={patients}
            tableProps={{
              className: 'igd-patient-table',
              scroll: { x: 780 },
              rowClassName: (record) => getTriageRowClassName(record, record.id === selectedPatient?.id),
              onRow: (record) => ({
                onClick: () => setSelectedPatient(record.id)
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
                      setSelectedPatient(record.id)

                      if (record.status === 'menunggu' || record.status === 'triase') {
                        onOpenTriase?.()
                        return
                      }

                      if (record.status === 'penanganan' || record.status === 'observasi') {
                        onOpenBedMap?.()
                      }
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

          <div className="igd-detail-panel">
            <div
              className="igd-detail-panel-header"
              style={{
                background: selectedLevelMeta.background,
                borderBottomColor: selectedLevelMeta.borderColor
              }}
            >
              <DesktopTriageBadge tone={selectedLevelMeta.badgeTone}>
                {selectedLevelMeta.label}
              </DesktopTriageBadge>
              <div className="igd-detail-level-text" style={{ color: selectedLevelMeta.color }}>
                {selectedLevelMeta.name.toUpperCase()} · {selectedLevelMeta.colorName}
              </div>
              <div className="ml-auto">
                <DesktopStatusPill tone={selectedStatusMeta.tone}>{selectedStatusMeta.label}</DesktopStatusPill>
              </div>
            </div>

            <div className="igd-detail-panel-body">
              <div>
                <div className="text-[16px] font-bold text-[var(--ds-color-text)]">{selectedPatient.name}</div>
                <div className="mt-[3px] flex flex-wrap items-center gap-[8px]">
                  <span className="text-[11px] text-[var(--ds-color-text-subtle)]">{selectedPatient.ageLabel}</span>
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
                <div className="text-[13px] text-[var(--ds-color-text)]">{selectedPatient.complaint}</div>
              </div>

              <DesktopPropertyGrid
                items={[
                  { label: 'Sumber', value: selectedPatient.arrivalSource },
                  {
                    label: 'Dokter',
                    value: selectedPatient.doctorName ?? '— belum assign',
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

          {selectedPatient.vitalSigns ? (
            <DesktopCard title="Vital Sign" subtitle={`Triase ${selectedPatient.triageTime ?? '—'}`} compact>
              <div className="grid gap-[8px] md:grid-cols-3">
                <DesktopMetricTile label="TD" value={selectedPatient.vitalSigns.bloodPressure} unit="mmHg" />
                <DesktopMetricTile
                  label="Nadi"
                  value={String(selectedPatient.vitalSigns.pulse)}
                  unit="/mnt"
                  tone={getVitalTone('pulse', selectedPatient)}
                />
                <DesktopMetricTile
                  label="SpO₂"
                  value={String(selectedPatient.vitalSigns.oxygenSaturation)}
                  unit="%"
                  tone={getVitalTone('oxygenSaturation', selectedPatient)}
                />
                <DesktopMetricTile
                  label="Suhu"
                  value={String(selectedPatient.vitalSigns.temperature)}
                  unit="°C"
                  tone={getVitalTone('temperature', selectedPatient)}
                />
                <DesktopMetricTile
                  label="RR"
                  value={String(selectedPatient.vitalSigns.respiratoryRate)}
                  unit="/mnt"
                  tone={getVitalTone('respiratoryRate', selectedPatient)}
                />
                <DesktopMetricTile
                  label="GCS"
                  value={String(selectedPatient.vitalSigns.gcs)}
                  unit="/15"
                  tone={getVitalTone('gcs', selectedPatient)}
                />
              </div>
            </DesktopCard>
          ) : null}

          <DesktopCard title="Time Tracking" subtitle={CURRENT_IGD_TIME} compact>
            <DesktopTimelineList
              items={[
                { label: 'Tiba di IGD', time: selectedPatient.arrivalTime, done: true },
                { label: 'Triase Awal', time: selectedPatient.triageTime ?? 'Belum', done: !!selectedPatient.triageTime },
                { label: 'Dokter Hadir', time: selectedPatient.doctorTime ?? 'Belum', done: !!selectedPatient.doctorTime },
                {
                  label: 'Tindakan',
                  time: selectedPatient.treatmentTime ?? 'Belum',
                  done: !!selectedPatient.treatmentTime && selectedPatient.status === 'penanganan'
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
        </div>
      </div>
    </div>
  )
}

export default function IgdDaftarRoute() {
  const navigate = useNavigate()

  return (
    <IgdDaftarPage
      onOpenRegistrasi={() => navigate(IGD_PAGE_PATHS.registrasi)}
      onOpenTriase={() => navigate(IGD_PAGE_PATHS.triase)}
      onOpenBedMap={() => navigate(IGD_PAGE_PATHS.bedMap)}
    />
  )
}
