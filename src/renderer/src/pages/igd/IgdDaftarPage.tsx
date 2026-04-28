/**
 * purpose: Halaman daftar pasien IGD dengan ringkasan operasional, tabel pasien aktif, dan panel informasi pasien melalui komponen shared.
 * main callers: `IgdDaftarRoute`.
 * key dependencies: Komponen design-system desktop, `buildIgdTableActions`, `IgdPatientInfoPanel`, dan tipe `IgdDashboard`.
 * main/public functions: `IgdDaftarPage`.
 * side effects: Tidak ada side effect langsung; meneruskan event aksi pengguna (termasuk buka pemeriksaan dokter) lewat callback props.
 */
import type { ColumnsType } from 'antd/es/table'
import React, { useMemo } from 'react'
import type { DesktopTriageBadgeTone } from '../../components/design-system/atoms/DesktopTriageBadge'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopStatusDot } from '../../components/design-system/atoms/DesktopStatusDot'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopTriageBadge } from '../../components/design-system/atoms/DesktopTriageBadge'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopCompactStatStrip } from '../../components/design-system/molecules/DesktopCompactStatStrip'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import { IgdPatientInfoPanel } from './IgdPatientInfoPanel'
import { type IgdDashboard, type IgdDashboardPatient } from './igd.data'
import { buildIgdTableActions } from './igd.disposition'

type IgdDaftarPageProps = {
  dashboard: IgdDashboard
  selectedPatientId?: string
  onSelectPatient?: (patientId: string) => void
  isLoading?: boolean
  errorMessage?: string
  onRetry?: () => void
  onOpenRegistrasi?: () => void
  onOpenTriase?: (patientId?: string) => void
  onOpenBedMap?: () => void
  onOpenReplacePatient?: () => void
  onOpenDisposition?: (patient: IgdDashboardPatient) => void
  onOpenExamination?: (patient: IgdDashboardPatient) => void
}

const getTriageRowClassName = (patient: IgdDashboardPatient, isSelected: boolean) => {
  const priorityClass =
    patient.triageLevel <= 1 ? 'igd-row-priority-1' : patient.triageLevel === 2 ? 'igd-row-priority-2' : ''

  return [
    `igd-row-level-${patient.triageLevel}`,
    priorityClass,
    isSelected ? 'igd-row-active-default' : ''
  ]
    .filter(Boolean)
    .join(' ')
}

const resolveTriageTone = (levelNo: number): DesktopTriageBadgeTone => {
  if (levelNo <= 1) return 'danger'
  if (levelNo === 2) return 'warning'
  if (levelNo === 3) return 'success'
  return 'neutral'
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  })
    .format(value)
    .replace(/\s/g, '')
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
  onOpenBedMap,
  onOpenReplacePatient,
  onOpenDisposition,
  onOpenExamination
}: IgdDaftarPageProps) {
  const patients = dashboard.patients
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null
  const criticalCount = patients.filter((patient) => patient.triageLevel <= 2).length
  const activeTriageLevels = useMemo(() => {
    const fromSummary = (dashboard.summary.activeTriageLevels ?? [])
      .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
      .sort((left, right) => left - right)
    if (fromSummary.length > 0) return fromSummary

    const fromCounts = Object.keys(dashboard.summary.triageCounts)
      .map((raw) => Number.parseInt(raw, 10))
      .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
      .sort((left, right) => left - right)
    if (fromCounts.length > 0) return fromCounts

    return [0, 1, 2, 3, 4]
  }, [dashboard.summary.activeTriageLevels, dashboard.summary.triageCounts])
  const triageLevels = useMemo(
    () =>
      activeTriageLevels.map((levelNo) => ({
        label: `L${levelNo}`,
        value: String(dashboard.summary.triageCounts[String(levelNo)] ?? 0),
        tone: resolveTriageTone(levelNo)
      })),
    [activeTriageLevels, dashboard.summary.triageCounts]
  )

  const columns = useMemo<ColumnsType<IgdDashboardPatient>>(
    () => [
      {
        title: 'Nomor Regis',
        dataIndex: 'registrationNumber',
        key: 'registrationNumber',
        width: 132,
        render: (value: string) => <span className="font-mono text-[12px]">{value}</span>
      },
      {
        title: 'No. Rawat',
        dataIndex: 'encounterCode',
        key: 'encounterCode',
        width: 164,
        render: (value: string) => <span className="font-mono text-[12px]">{value}</span>
      },
      {
        title: 'Waktu Masuk',
        dataIndex: 'arrivalTime',
        key: 'arrivalTime',
        width: 92,
        render: (value: string) => <span className="font-mono text-[12px]">{value}</span>
      },
      {
        title: 'Dokter Dituju',
        dataIndex: 'doctorTargetName',
        key: 'doctorTargetName',
        width: 148,
        render: (_, patient) => (
          <span className="text-[12px] text-[var(--ds-color-text)]">
            {patient.doctorTargetName || '—'}
          </span>
        )
      },
      {
        title: 'Rekam Medis',
        key: 'medicalRecord',
        width: 132,
        render: (_, patient) => (
          <span className="font-mono text-[12px]">
            {patient.isTemporaryPatient ? patient.tempCode || '—' : patient.medicalRecordNumber || '—'}
          </span>
        )
      },
      {
        title: 'Nama Pasien',
        key: 'name',
        width: 176,
        render: (_, patient) => (
          <div className="flex items-center gap-[6px]">
            <span className="text-[12px] font-semibold text-[var(--ds-color-text)]">{patient.name}</span>
            {patient.isTemporaryPatient ? <DesktopTag tone="accent">Temp</DesktopTag> : null}
          </div>
        )
      },
      {
        title: 'Umur',
        dataIndex: 'ageLabel',
        key: 'ageLabel',
        width: 72
      },
      {
        title: 'Jenis Kelamin',
        dataIndex: 'genderLabel',
        key: 'genderLabel',
        width: 108
      },
      {
        title: 'Unit',
        dataIndex: 'unitLabel',
        key: 'unitLabel',
        width: 72
      },
      {
        title: 'Bed IGD',
        key: 'bedCode',
        width: 88,
        render: (_, patient) =>
          patient.bedCode ? (
            <DesktopTriageBadge tone="neutral" compact>
              {patient.bedCode}
            </DesktopTriageBadge>
          ) : (
            <span className="igd-bed-empty">—</span>
          )
      },
      {
        title: 'Penanggung Jawab Pasien',
        key: 'guarantorName',
        width: 164,
        render: (_, patient) => <span className="text-[12px]">{patient.guarantorName || '—'}</span>
      },
      {
        title: 'Biaya Sementara',
        key: 'estimatedCost',
        width: 124,
        render: (_, patient) => (
          <span className="font-mono text-[12px]">{formatCurrency(patient.estimatedCost)}</span>
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
            <DesktopButton
              emphasis="secondary"
              onClick={() => onOpenTriase?.(selectedPatient?.id)}
            >
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
        triageLevels={triageLevels}
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
                scroll: { x: 1560 },
                rowClassName: (record) => getTriageRowClassName(record, record.id === selectedPatient?.id),
                onRow: (record) => ({
                  onClick: () => onSelectPatient?.(record.id)
                })
              }}
              action={{
                title: 'Aksi',
                width: 80,
                align: 'left',
                items: (record) =>
                  buildIgdTableActions({
                    patient: record,
                    onOpenTriase: (patient) => {
                      onSelectPatient?.(patient.id)
                      onOpenTriase?.(patient.id)
                    },
                    onOpenBedMap: (patient) => {
                      onSelectPatient?.(patient.id)
                      onOpenBedMap?.()
                    },
                    onOpenDisposition: (patient) => {
                      onSelectPatient?.(patient.id)
                      onOpenDisposition?.(patient)
                    },
                    onOpenReplacePatient: (patient) => {
                      onSelectPatient?.(patient.id)
                      onOpenReplacePatient?.()
                    }
                  })
              }}
            />
          </DesktopCard>

          <IgdPatientInfoPanel
            patient={selectedPatient}
            actions={
              selectedPatient ? (
                <>
                  {selectedPatient.isTemporaryPatient ? (
                    <DesktopButton
                      emphasis="toolbar"
                      className="!justify-center"
                      onClick={onOpenReplacePatient}
                    >
                      Ubah Pasien
                    </DesktopButton>
                  ) : null}
                  <DesktopButton
                    emphasis="toolbar"
                    className="!justify-center"
                    onClick={() => onOpenTriase?.(selectedPatient.id)}
                  >
                    Form Triase
                  </DesktopButton>
                  {!selectedPatient.bedCode ? (
                    <DesktopButton emphasis="toolbar" className="!justify-center" onClick={onOpenBedMap}>
                      Assign Bed IGD
                    </DesktopButton>
                  ) : null}
                  <DesktopButton
                    emphasis="primary"
                    className="!justify-center"
                    onClick={() => onOpenExamination?.(selectedPatient)}
                  >
                    Buka Pemeriksaan
                  </DesktopButton>
                  <DesktopButton
                    emphasis="toolbar"
                    className="!justify-center !border-[var(--ds-color-success)] !bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] !text-[var(--ds-color-success)]"
                    onClick={() => onOpenDisposition?.(selectedPatient)}
                  >
                    Disposisi
                  </DesktopButton>
                </>
              ) : undefined
            }
          />
        </div>
      ) : null}
    </div>
  )
}
