/**
 * purpose: Halaman peta bed IGD dengan ringkasan okupansi, listing bed per zona, dan aksi assign/transfer/release bed.
 * main callers: `IgdBedMapRoute`.
 * key dependencies: Komponen design-system desktop, util zonasi `igd.bed-zoning`, dan tipe dashboard IGD.
 * main/public functions: `IgdBedMapPage`.
 * side effects: Men-trigger callback aksi bed (assign/transfer/release/create) sesuai interaksi pengguna.
 */
import { Modal } from 'antd'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  DesktopBadge,
  type DesktopBadgeTone
} from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopCompactStatStrip } from '../../components/design-system/molecules/DesktopCompactStatStrip'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import { ExportButton } from '../../components/molecules/ExportButton'

import {
  IGD_BED_ZONE_DESCRIPTIONS,
  IGD_BED_ZONE_ORDER,
  getZoneTriageRangeLabel
} from './igd.bed-zoning'
import { type IgdBedReportExportZoneGroup } from './igd.bed-report'
import {
  type IgdDashboard,
  type IgdDashboardBed,
  type IgdDashboardBedZone,
  type IgdDashboardPatient
} from './igd.data'
import { getIgdTriageLevelMeta } from './igd.triage-level'

type SelectOption = {
  label: string
  value: string
}

type IgdBedMapPageProps = {
  dashboard: IgdDashboard
  availableBedOptions?: SelectOption[]
  createBedRoomOptions?: SelectOption[]
  isLoading?: boolean
  errorMessage?: string
  reportExportGroups?: IgdBedReportExportZoneGroup[]
  reportExportTitle?: string
  reportExportFileName?: string
  isReportLoading?: boolean
  actionLoading?: {
    assign?: boolean
    transfer?: boolean
    release?: boolean
    createBed?: boolean
  }
  onRetry?: () => void
  onBack?: () => void
  onAssignBed?: (input: { patientId: string; bedCode: string }) => Promise<void> | void
  onTransferBed?: (input: { sourceBedCode: string; targetBedCode: string }) => Promise<void> | void
  onReleaseBed?: (input: { bedCode: string }) => Promise<void> | void
  onCreateBed?: (input: { bedCodeId: string; roomId: string }) => Promise<void> | void
}

const getTriageTone = (level: IgdDashboardPatient['triageLevel']): DesktopBadgeTone => {
  return getIgdTriageLevelMeta(level).statTone
}

const getZoneRangeTone = (zone: IgdDashboardBedZone): DesktopBadgeTone => {
  if (zone === 'Resusitasi') return 'danger'
  if (zone === 'Observasi') return 'warning'
  if (zone === 'Isolasi') return 'info'
  return 'success'
}

function BedCard({
  bed,
  patient,
  canAssign,
  onAssign,
  onInspect,
  onMove
}: {
  bed: IgdDashboardBed
  patient?: IgdDashboardPatient
  canAssign: boolean
  onAssign: () => void
  onInspect: () => void
  onMove: () => void
}) {
  const cardVariantClassName =
    bed.status === 'occupied'
      ? 'igd-bed-card--occupied'
      : bed.status === 'cleaning'
        ? 'igd-bed-card--cleaning'
        : 'igd-bed-card--available'

  return (
    <article className={`igd-bed-card ${cardVariantClassName}`}>
      <div className="igd-bed-card-header">
        <div className="igd-bed-card-code">{bed.code}</div>
        {patient ? (
          <DesktopBadge
            tone={getTriageTone(patient.triageLevel)}
            style={getIgdTriageLevelMeta(patient.triageLevel).badgeStyle}
          >
            {getIgdTriageLevelMeta(patient.triageLevel).label}
          </DesktopBadge>
        ) : null}
      </div>
      <div className="igd-bed-card-body">
        <div className="igd-bed-card-name">
          {patient?.name ?? (bed.status === 'cleaning' ? 'Pembersihan' : 'Kosong')}
        </div>
        <div className="igd-bed-card-meta">
          {patient
            ? patient.medicalRecordNumber || patient.registrationNumber
            : bed.status === 'cleaning'
              ? 'Bed sedang dibersihkan'
              : 'Siap dipakai untuk pasien berikutnya'}
        </div>
        <div className="igd-bed-card-detail">
          {patient
            ? `Masuk: ${patient.arrivalTime}`
            : bed.status === 'cleaning'
              ? 'Sementara tidak bisa dipakai'
              : 'Bed tersedia'}
        </div>
        {bed.status === 'occupied' ? (
          <div className="igd-bed-card-actions igd-bed-card-actions--double">
            <DesktopButton emphasis="toolbar" size="small" onClick={onInspect}>
              Detail
            </DesktopButton>
            <DesktopButton emphasis="toolbar" size="small" onClick={onMove}>
              Pindah
            </DesktopButton>
          </div>
        ) : bed.status === 'available' ? (
          <div className="igd-bed-card-actions igd-bed-card-actions--single">
            <DesktopButton emphasis="primary" size="small" onClick={onAssign} disabled={!canAssign}>
              Tempatkan
            </DesktopButton>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export function IgdBedMapPage({
  dashboard,
  availableBedOptions = [],
  createBedRoomOptions = [],
  isLoading = false,
  errorMessage,
  reportExportGroups = [],
  reportExportTitle = 'Laporan Bed IGD',
  reportExportFileName = 'laporan-bed-igd',
  isReportLoading = false,
  actionLoading,
  onRetry,
  onBack,
  onAssignBed,
  onTransferBed,
  onReleaseBed,
  onCreateBed
}: IgdBedMapPageProps) {
  const beds = dashboard.beds
  const patients = dashboard.patients
  const [assignModalBedCode, setAssignModalBedCode] = useState<string | null>(null)
  const [assignModalPatientId, setAssignModalPatientId] = useState('')
  const [moveModalBedCode, setMoveModalBedCode] = useState<string | null>(null)
  const [moveModalTargetBedCode, setMoveModalTargetBedCode] = useState('')
  const [inspectModalBedCode, setInspectModalBedCode] = useState<string | null>(null)
  const [createBedVisible, setCreateBedVisible] = useState(false)
  const [newBedCode, setNewBedCode] = useState('')
  const [newBedRoomId, setNewBedRoomId] = useState('')

  const assignablePatientOptions = useMemo(
    () =>
      patients
        .filter((patient) => !patient.bedCode)
        .map((patient) => ({
          label: `${patient.name} (${patient.registrationNumber})`,
          value: patient.id
        })),
    [patients]
  )

  useEffect(() => {
    if (!newBedRoomId && createBedRoomOptions[0]?.value) {
      setNewBedRoomId(createBedRoomOptions[0].value)
    }
  }, [createBedRoomOptions, newBedRoomId])

  const occupiedCount = beds.filter((bed) => bed.status === 'occupied').length
  const cleaningCount = beds.filter((bed) => bed.status === 'cleaning').length
  const availableCount = beds.filter((bed) => bed.status === 'available').length
  const moveModalOptions = availableBedOptions.filter((option) => option.value !== moveModalBedCode)
  const moveModalBed = beds.find((bed) => bed.code === moveModalBedCode)
  const moveModalPatient = patients.find((patient) => patient.id === moveModalBed?.patientId)
  const inspectModalBed = beds.find((bed) => bed.code === inspectModalBedCode)

  const handleAssignConfirm = async () => {
    if (!assignModalBedCode || !assignModalPatientId || !onAssignBed) return
    await onAssignBed({ patientId: assignModalPatientId, bedCode: assignModalBedCode })
    setAssignModalBedCode(null)
    setAssignModalPatientId('')
  }

  const handleTransferConfirm = async () => {
    if (!moveModalBedCode || !moveModalTargetBedCode || !onTransferBed) return
    await onTransferBed({
      sourceBedCode: moveModalBedCode,
      targetBedCode: moveModalTargetBedCode
    })
    setMoveModalBedCode(null)
    setMoveModalTargetBedCode('')
  }

  const handleReleaseFromMove = async () => {
    if (!moveModalBedCode || !onReleaseBed) return
    await onReleaseBed({ bedCode: moveModalBedCode })
    setMoveModalBedCode(null)
    setMoveModalTargetBedCode('')
  }

  const handleCreateBedConfirm = async () => {
    if (!onCreateBed || !newBedCode.trim() || !newBedRoomId) return
    await onCreateBed({ bedCodeId: newBedCode.trim(), roomId: newBedRoomId })
    setCreateBedVisible(false)
    setNewBedCode('')
  }

  return (
    <div className="igd-parity-scope flex flex-col gap-[var(--ds-layout-section-gap)]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Peta Bed IGD"
        subtitle="Lihat kondisi bed IGD dan pasien yang sedang menempati bed."
        status={isLoading ? 'Memuat data' : 'Data tersambung'}
        metadata={
          <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
            <DesktopBadge tone="success">{availableCount} bed tersedia</DesktopBadge>
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
                { key: 'zone', label: 'Zona' },
                { key: 'totalBeds', label: 'Total Bed' },
                { key: 'occupiedBeds', label: 'Terisi' },
                { key: 'availableBeds', label: 'Kosong' },
                { key: 'cleaningBeds', label: 'Pembersihan' }
              ]}
              nestedTable={{
                getChildren: (group) => group.details,
                columns: [
                  { key: 'bedCode', label: 'Kode Bed' },
                  { key: 'status', label: 'Status' },
                  { key: 'patientName', label: 'Pasien' },
                  { key: 'registrationNumber', label: 'Nomor Registrasi' },
                  { key: 'triageLevel', label: 'Triase' }
                ]
              }}
            />
            <DesktopButton emphasis="primary" onClick={() => setCreateBedVisible(true)}>
              Tambah Bed
            </DesktopButton>
            <DesktopButton emphasis="toolbar" onClick={onBack}>
              Kembali ke Daftar
            </DesktopButton>
          </>
        }
      />

      <DesktopCompactStatStrip
        bedSummary={{
          totalBeds: String(beds.length),
          occupiedBeds: String(occupiedCount),
          availableBeds: String(availableCount),
          cleaningBeds: String(cleaningCount)
        }}
      />

      {isLoading ? (
        <DesktopCard title="Memuat data bed IGD" subtitle="Menyiapkan peta bed dan daftar pasien.">
          <DesktopNoticePanel
            title="Memuat data bed IGD"
            description="Data bed dan pasien aktif sedang diperbarui."
          />
        </DesktopCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <DesktopCard
          title="Data bed belum dapat dimuat"
          subtitle="Silakan coba lagi dalam beberapa saat."
        >
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Data bed belum dapat dimuat"
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

      {!isLoading && !errorMessage ? (
        <>
          <div className="grid gap-[var(--ds-space-md)]">
            {IGD_BED_ZONE_ORDER.map((zone) => {
              const zoneBeds = beds.filter((bed) => bed.zone === zone)
              const zoneAvailableCount = zoneBeds.filter((bed) => bed.status === 'available').length

              return (
                <section key={zone} className="igd-bed-zone-panel">
                  <div className="igd-bed-zone-panel-header">
                    <div className="igd-bed-zone-panel-title-row">
                      <h3 className="igd-bed-zone-panel-title">{`Zona ${zone}`}</h3>
                      <span className="igd-bed-zone-panel-count">{`${zoneAvailableCount} kosong dari ${zoneBeds.length}`}</span>
                      <DesktopBadge tone={getZoneRangeTone(zone)}>
                        {getZoneTriageRangeLabel(zone)}
                      </DesktopBadge>
                    </div>
                    <p className="igd-bed-zone-panel-description">
                      {IGD_BED_ZONE_DESCRIPTIONS[zone]}
                    </p>
                  </div>

                  <div className="igd-bed-zone-panel-grid">
                    {zoneBeds.map((bed) => {
                      const patient = patients.find((item) => item.id === bed.patientId)

                      return (
                        <BedCard
                          key={bed.code}
                          bed={bed}
                          patient={patient}
                          canAssign={!!onAssignBed && assignablePatientOptions.length > 0}
                          onAssign={() => {
                            setAssignModalBedCode(bed.code)
                            setAssignModalPatientId(assignablePatientOptions[0]?.value ?? '')
                          }}
                          onInspect={() => {
                            setInspectModalBedCode(bed.code)
                          }}
                          onMove={() => {
                            setMoveModalBedCode(bed.code)
                            setMoveModalTargetBedCode(moveModalOptions[0]?.value ?? '')
                          }}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      ) : null}

      <Modal
        title={
          assignModalBedCode ? `Tempatkan Pasien ke ${assignModalBedCode}` : 'Tempatkan Pasien'
        }
        open={!!assignModalBedCode}
        getContainer={false}
        onCancel={() => {
          setAssignModalBedCode(null)
          setAssignModalPatientId('')
        }}
        onOk={() => void handleAssignConfirm()}
        okText="Tempatkan"
        okButtonProps={{
          disabled: !assignModalPatientId || !onAssignBed || assignablePatientOptions.length === 0,
          loading: !!actionLoading?.assign
        }}
      >
        {assignablePatientOptions.length === 0 ? (
          <DesktopNoticePanel
            title="Tidak ada pasien yang menunggu bed"
            description="Semua pasien aktif saat ini sudah menempati bed atau belum ada pasien yang bisa ditempatkan."
          />
        ) : (
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Pilih pasien yang akan ditempatkan"
              description={`Bed tujuan: ${assignModalBedCode ?? '-'}`}
            />
            <DesktopInputField
              label="Pasien"
              type="select"
              value={assignModalPatientId}
              options={assignablePatientOptions}
              placeholder="Pilih pasien"
              onChange={setAssignModalPatientId}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={moveModalBedCode ? `Pindahkan Pasien dari ${moveModalBedCode}` : 'Pindahkan Pasien'}
        open={!!moveModalBedCode}
        getContainer={false}
        onCancel={() => {
          setMoveModalBedCode(null)
          setMoveModalTargetBedCode('')
        }}
        footer={[
          <DesktopButton
            key="close"
            emphasis="toolbar"
            onClick={() => {
              setMoveModalBedCode(null)
              setMoveModalTargetBedCode('')
            }}
          >
            Tutup
          </DesktopButton>,
          <DesktopButton
            key="release"
            emphasis="danger"
            disabled={!moveModalBedCode || !onReleaseBed}
            loading={!!actionLoading?.release}
            onClick={() => void handleReleaseFromMove()}
          >
            Kosongkan Bed
          </DesktopButton>,
          <DesktopButton
            key="transfer"
            emphasis="primary"
            disabled={!moveModalTargetBedCode || !onTransferBed || moveModalOptions.length === 0}
            loading={!!actionLoading?.transfer}
            onClick={() => void handleTransferConfirm()}
          >
            Pindah
          </DesktopButton>
        ]}
      >
        {moveModalOptions.length === 0 ? (
          <DesktopNoticePanel
            title="Tidak ada bed kosong yang tersedia"
            description="Semua bed kosong saat ini belum bisa dipakai sebagai tujuan pindah."
          />
        ) : (
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title={
                moveModalPatient
                  ? `Pindahkan atau kosongkan bed untuk ${moveModalPatient.name}`
                  : 'Pilih tindakan untuk pasien di bed ini'
              }
              description={`Pasien saat ini berada di ${moveModalBedCode ?? '-'}. Anda bisa memilih bed tujuan atau mengosongkan bed ini.`}
            />
            <DesktopInputField
              label="Bed tujuan"
              type="select"
              value={moveModalTargetBedCode}
              options={moveModalOptions}
              placeholder="Pilih bed tujuan"
              onChange={setMoveModalTargetBedCode}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={inspectModalBed ? `Lihat Pasien di ${inspectModalBed.code}` : 'Lihat Pasien'}
        open={!!inspectModalBedCode}
        getContainer={false}
        onCancel={() => setInspectModalBedCode(null)}
        footer={[
          <DesktopButton
            key="close"
            emphasis="toolbar"
            onClick={() => setInspectModalBedCode(null)}
          >
            Tutup
          </DesktopButton>
        ]}
      >
        <DesktopNoticePanel
          title="Halaman pemeriksaan akan tersedia di sini"
          description="Anda dapat membuka detail pemeriksaan pasien dari peta bed melalui halaman ini."
        />
      </Modal>

      <Modal
        title="Tambah Bed Baru"
        open={createBedVisible}
        getContainer={false}
        onCancel={() => setCreateBedVisible(false)}
        onOk={() => void handleCreateBedConfirm()}
        okText="Simpan Bed"
        okButtonProps={{
          disabled: !newBedCode.trim() || !newBedRoomId || !onCreateBed,
          loading: !!actionLoading?.createBed
        }}
      >
        <div className="grid gap-[12px]">
          {!onCreateBed ? (
            <DesktopNoticePanel
              title="Bed baru belum dapat disimpan"
              description="Penyimpanan bed baru belum tersedia dari halaman ini."
            />
          ) : null}
          <DesktopInputField
            label="Kode Bed"
            value={newBedCode}
            placeholder="Contoh: O-07"
            onChange={(value) => setNewBedCode(value.toUpperCase())}
          />
          <DesktopInputField
            label="Ruangan"
            type="select"
            value={newBedRoomId}
            options={createBedRoomOptions}
            placeholder="Pilih ruangan IGD"
            onChange={setNewBedRoomId}
          />
        </div>
      </Modal>
    </div>
  )
}
