import type { ColumnsType } from 'antd/es/table'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo } from 'react'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import {
  DesktopStatusDot,
  type DesktopStatus
} from '../../components/design-system/atoms/DesktopStatusDot'
import {
  DesktopStatusPill,
  type DesktopStatusPillTone
} from '../../components/design-system/atoms/DesktopStatusPill'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopTriageBadge } from '../../components/design-system/atoms/DesktopTriageBadge'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopCompactStatStrip } from '../../components/design-system/molecules/DesktopCompactStatStrip'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopPropertyGrid } from '../../components/design-system/molecules/DesktopPropertyGrid'
import { DesktopTimelineList } from '../../components/design-system/molecules/DesktopTimelineList'
import { DesktopGenericTable } from '../../components/design-system/organisms/DesktopGenericTable'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import { ExportButton } from '../../components/molecules/ExportButton'
import { type IgdDashboard, type IgdDashboardPatient } from './igd.data'
import { buildIgdTableActions } from './igd.disposition'
import { type IgdDailyReportExportShiftGroup } from './igd.report'
import { getIgdTriageLevelMeta, IGD_TRIAGE_LEVELS, isIgdTriageLevel } from './igd.triage-level'

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
  onOpenReplacePatient?: () => void
  onOpenDisposition?: (patient: IgdDashboardPatient) => void
  reportExportGroups?: IgdDailyReportExportShiftGroup[]
  reportExportTitle?: string
  reportExportFileName?: string
  isReportLoading?: boolean
}

type IgdStatusVariant = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'
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

const DEFAULT_STATUS_META = {
  label: 'Menunggu',
  tone: 'neutral',
  dotStatus: 'neutral'
} satisfies { label: string; tone: DesktopStatusPillTone; dotStatus: DesktopStatus }

const getStatusMeta = (status: unknown) => {
  if (
    status === 'menunggu' ||
    status === 'triase' ||
    status === 'penanganan' ||
    status === 'observasi' ||
    status === 'disposisi'
  ) {
    return STATUS_META[status]
  }

  return DEFAULT_STATUS_META
}

const getTriageRowClassName = (patient: IgdDashboardPatient, isSelected: boolean) =>
  [
    `igd-row-level-${patient.triageLevel}`,
    getIgdTriageLevelMeta(patient.triageLevel).priority
      ? `igd-row-priority-${patient.triageLevel}`
      : '',
    isSelected ? 'igd-row-active-default' : ''
  ]
    .filter(Boolean)
    .join(' ')

const UNASSESSED_TRIAGE_DETAIL_META = {
  label: '-',
  name: 'Belum Triase',
  colorName: 'Menunggu penilaian',
  badgeTone: 'neutral' as const,
  foreground: 'var(--ds-color-text)',
  background: 'var(--ds-color-surface-muted)',
  borderColor: 'var(--ds-color-border)',
  badgeStyle: {
    backgroundColor: 'var(--ds-color-surface)',
    borderColor: 'var(--ds-color-border-strong)',
    color: 'var(--ds-color-text-muted)'
  }
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
  reportExportGroups = [],
  reportExportTitle = 'Laporan Harian IGD',
  reportExportFileName = 'laporan-igd',
  isReportLoading = false
}: IgdDaftarPageProps) {
  const patients = dashboard.patients
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null
  const selectedPatientTriageMeta = isIgdTriageLevel(selectedPatient?.triageLevel)
    ? getIgdTriageLevelMeta(selectedPatient.triageLevel)
    : UNASSESSED_TRIAGE_DETAIL_META
  const selectedPatientStatusMeta = getStatusMeta(selectedPatient?.status)
  const criticalCount = patients.filter(
    (patient) => getIgdTriageLevelMeta(patient.triageLevel).priority
  ).length
  const triageCounts = useMemo(
    () =>
      IGD_TRIAGE_LEVELS.map(
        (level) =>
          dashboard.summary.triageCounts[
            String(level) as keyof typeof dashboard.summary.triageCounts
          ]
      ),
    [dashboard.summary.triageCounts]
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
            {patient.isTemporaryPatient
              ? patient.tempCode || '—'
              : patient.medicalRecordNumber || '—'}
          </span>
        )
      },
      {
        title: 'Nama Pasien',
        key: 'name',
        width: 176,
        render: (_, patient) => (
          <div className="flex items-center gap-[6px]">
            <span className="text-[12px] font-semibold text-[var(--ds-color-text)]">
              {patient.name}
            </span>
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
        subtitle="Ringkasan pasien aktif, prioritas triase, dan ketersediaan bed IGD."
        status={isLoading ? 'Memuat data' : 'Data tersambung'}
        metadata={
          <div className="flex flex-wrap items-center gap-[8px]">
            <DesktopStatusDot
              status={criticalCount > 0 ? 'danger' : 'success'}
              label={`${criticalCount} pasien perlu prioritas`}
            />
            <DesktopBadge tone="accent">{dashboard.summary.totalActive} pasien aktif</DesktopBadge>
          </div>
        }
        actions={
          <>
            <ExportButton
              data={reportExportGroups}
              fileName={reportExportFileName}
              title={reportExportTitle}
              buttonLabel="Laporan"
              formats={['csv', 'pdf']}
              loading={isReportLoading}
              disabled={isReportLoading || reportExportGroups.length === 0}
              columns={[
                { key: 'shift', label: 'Shift' },
                { key: 'timeRange', label: 'Jam' },
                { key: 'totalPatients', label: 'Total Pasien' }
              ]}
              nestedTable={{
                getChildren: (group) => group.details,
                columns: [
                  { key: 'metric', label: 'Rincian' },
                  { key: 'value', label: 'Nilai' },
                  { key: 'note', label: 'Catatan' }
                ]
              }}
            />
            <DesktopButton emphasis="toolbar" onClick={onOpenBedMap}>
              Lihat Peta Bed
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
        <DesktopCard
          title="Memuat dashboard IGD"
          subtitle="Mengambil pasien aktif dan snapshot bed dari backend."
        >
          <DesktopNoticePanel
            title="Memuat data IGD"
            description="Daftar pasien dan informasi IGD sedang diperbarui."
          />
        </DesktopCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <DesktopCard
          title="Gagal memuat dashboard"
          subtitle="Coba muat ulang koneksi ke backend IGD."
        >
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Gagal memuat dashboard"
              description={errorMessage}
              tone="danger"
            />
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
          title="Perlu Diprioritaskan"
          subtitle="Pasien level 0-1 perlu segera ditriase dan ditempatkan di bed resusitasi."
          extra={<DesktopBadge tone="danger">{criticalCount} pasien kritis</DesktopBadge>}
          tone="muted"
          compact
        >
          <div className="flex flex-wrap items-center gap-[8px] text-[13px] text-[var(--ds-color-text-muted)]">
            {patients
              .filter((patient) => getIgdTriageLevelMeta(patient.triageLevel).priority)
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
        triageLevels={IGD_TRIAGE_LEVELS.map((level, index) => {
          const meta = getIgdTriageLevelMeta(level)
          return {
            label: meta.label,
            value: String(triageCounts[index]),
            tone: meta.badgeTone,
            badgeStyle: meta.badgeStyle
          }
        })}
        bedAvailable={String(dashboard.summary.bedAvailable)}
        bedTotal={String(dashboard.summary.bedTotal)}
        averageResponse={String(dashboard.summary.averageResponseMinutes)}
        totalToday={String(dashboard.summary.totalToday)}
        statusBadges={[
          { label: 'SATUSEHAT', tone: 'success' },
          { label: 'Rekam medis aktif', tone: 'accent' }
        ]}
      />

      {!isLoading && !errorMessage ? (
        <div className="igd-daftar-grid">
          <DesktopCard
            title="Daftar Pasien IGD"
            subtitle="Diurutkan berdasarkan prioritas triase"
            extra={
              <div className="flex items-center gap-[8px]">
                <DesktopBadge tone="accent">{patients.length} pasien</DesktopBadge>
                <DesktopButton emphasis="ghost" size="small">
                  Saring
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
                rowClassName: (record) =>
                  getTriageRowClassName(record, record.id === selectedPatient?.id),
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
                      onOpenTriase?.()
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

          <div className="igd-detail-stack">
            <div className="px-[2px]">
              <div className="text-[12.5px] font-semibold text-[var(--ds-color-text)]">
                Detail Pasien
              </div>
              <div className="text-[10.5px] text-[var(--ds-color-text-subtle)]">
                Ringkasan pasien yang sedang dipilih.
              </div>
            </div>

            {selectedPatient ? (
              <>
                <div className="igd-detail-panel">
                  <div
                    className="igd-detail-panel-header"
                    style={{
                      background: selectedPatientTriageMeta.background,
                      borderBottomColor: selectedPatientTriageMeta.borderColor,
                      color: selectedPatientTriageMeta.foreground
                    }}
                  >
                    <DesktopTriageBadge
                      tone={selectedPatientTriageMeta.badgeTone}
                      style={selectedPatientTriageMeta.badgeStyle}
                    >
                      {selectedPatientTriageMeta.label}
                    </DesktopTriageBadge>
                    <div
                      className="igd-detail-level-text"
                      style={{ color: selectedPatientTriageMeta.foreground }}
                    >
                      {selectedPatientTriageMeta.name.toUpperCase()} ·{' '}
                      {selectedPatientTriageMeta.colorName}
                    </div>
                    <div className="ml-auto">
                      <DesktopStatusPill tone={selectedPatientStatusMeta.tone}>
                        {selectedPatientStatusMeta.label}
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
                      <span className="text-[11px] text-[var(--ds-color-text-subtle)]">
                        No. Reg
                      </span>
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
                          value: selectedPatient.doctorName || 'Belum dipilih',
                          muted: !selectedPatient.doctorName
                        },
                        {
                          label: 'Bed',
                          value: selectedPatient.bedCode ?? 'Belum ditempatkan',
                          mono: true,
                          muted: !selectedPatient.bedCode
                        },
                        { label: 'Masuk', value: selectedPatient.arrivalTime, mono: true }
                      ]}
                    />
                  </div>
                </div>

                <DesktopCard
                  title="Tanda Vital"
                  subtitle={`Triase ${selectedPatient.timeTracking.triageTime ?? selectedPatient.triageTime ?? '—'}`}
                  compact
                >
                  <DesktopNoticePanel
                    title="Tanda vital belum tersedia"
                    description="Data tanda vital belum tampil di halaman ini."
                  />
                </DesktopCard>

                <DesktopCard title="Riwayat Waktu" subtitle="Urutan proses pasien di IGD" compact>
                  <DesktopTimelineList
                    items={[
                      {
                        label: 'Tiba',
                        time:
                          selectedPatient.timeTracking.arrivalTime ?? selectedPatient.arrivalTime,
                        done: true
                      },
                      {
                        label: 'Triase awal',
                        time: selectedPatient.timeTracking.quickTriageTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.quickTriageTime
                      },
                      {
                        label: 'Triase',
                        time: selectedPatient.timeTracking.triageTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.triageTime
                      },
                      {
                        label: 'Dokter menangani',
                        time: selectedPatient.timeTracking.doctorAssignedTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.doctorAssignedTime
                      },
                      {
                        label: 'Masuk bed',
                        time: selectedPatient.timeTracking.bedAssignedTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.bedAssignedTime
                      },
                      {
                        label: 'Keluar dari bed',
                        time: selectedPatient.timeTracking.bedReleasedTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.bedReleasedTime
                      },
                      {
                        label: 'Rujuk',
                        time: selectedPatient.timeTracking.referredTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.referredTime
                      },
                      {
                        label: 'Keluar / cancel',
                        time: selectedPatient.timeTracking.closedTime ?? 'Belum',
                        done: !!selectedPatient.timeTracking.closedTime
                      }
                    ]}
                  />
                </DesktopCard>

                <div className="flex flex-col gap-[6px]">
                  {selectedPatient.isTemporaryPatient ? (
                    <DesktopButton
                      emphasis="toolbar"
                      className="!justify-center"
                      onClick={onOpenReplacePatient}
                    >
                      Ganti Identitas
                    </DesktopButton>
                  ) : null}
                  <DesktopButton
                    emphasis="toolbar"
                    className="!justify-center"
                    onClick={onOpenTriase}
                  >
                    Form Triase
                  </DesktopButton>
                  {!selectedPatient.bedCode ? (
                    <DesktopButton
                      emphasis="toolbar"
                      className="!justify-center"
                      onClick={onOpenBedMap}
                    >
                      Assign Bed IGD
                    </DesktopButton>
                  ) : null}
                  <DesktopButton emphasis="primary" className="!justify-center">
                    Buka Pemeriksaan
                  </DesktopButton>
                  <DesktopButton
                    emphasis="toolbar"
                    className="!justify-center !border-[var(--ds-color-success)] !bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] !text-[var(--ds-color-success)]"
                    onClick={() => onOpenDisposition?.(selectedPatient)}
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
