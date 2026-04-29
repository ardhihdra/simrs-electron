/**
 * purpose: Halaman daftar pasien IGD dengan ringkasan operasional, tabel pasien aktif, dan panel informasi pasien melalui komponen shared.
 * main callers: `IgdDaftarRoute`.
 * key dependencies: Komponen design-system desktop, `buildIgdTableActions`, `IgdPatientInfoPanel`, dan tipe `IgdDashboard`.
 * main/public functions: `IgdDaftarPage`.
 * side effects: Tidak ada side effect langsung; meneruskan event aksi pengguna (termasuk buka pemeriksaan dokter) lewat callback props.
 */
import type { ColumnsType } from 'antd/es/table'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo } from 'react'

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
import { ExportButton } from '../../components/molecules/ExportButton'
import { type IgdDashboard, type IgdDashboardPatient } from './igd.data'
import { buildIgdTableActions } from './igd.disposition'
import { IgdPatientInfoPanel } from './IgdPatientInfoPanel'
import { type IgdDailyReportExportShiftGroup } from './igd.report'
import { getIgdTriageLevelMeta, IGD_TRIAGE_LEVELS } from './igd.triage-level'

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
  reportExportGroups?: IgdDailyReportExportShiftGroup[]
  reportExportTitle?: string
  reportExportFileName?: string
  isReportLoading?: boolean
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
  onOpenExamination,
  reportExportGroups = [],
  reportExportTitle = 'Laporan Harian IGD',
  reportExportFileName = 'laporan-igd',
  isReportLoading = false
}: IgdDaftarPageProps) {
  const patients = dashboard.patients
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? patients[0] ?? null
  const criticalCount = patients.filter((patient) =>
    getIgdTriageLevelMeta(patient.triageLevel).priority
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
                      Ganti Identitas
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
                    <DesktopButton
                      emphasis="toolbar"
                      className="!justify-center"
                      onClick={onOpenBedMap}
                    >
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
