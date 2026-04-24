import { Modal } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

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

import {
  IGD_BED_ZONE_DESCRIPTIONS,
  IGD_BED_ZONE_ORDER,
  getZoneTriageRangeLabel
} from './igd.bed-zoning'
import {
  type IgdDashboard,
  type IgdDashboardBed,
  type IgdDashboardBedZone,
  type IgdDashboardPatient
} from './igd.data'

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
  if (level === 1) return 'danger'
  if (level === 2) return 'warning'
  if (level === 3) return 'info'
  return 'success'
}

const getZoneRangeTone = (zone: IgdDashboardBedZone): DesktopBadgeTone => {
  if (zone === 'Resusitasi') return 'danger'
  if (zone === 'Observasi') return 'warning'
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
          <DesktopBadge tone={getTriageTone(patient.triageLevel)}>
            L{patient.triageLevel}
          </DesktopBadge>
        ) : null}
      </div>
      <div className="igd-bed-card-body">
        <div className="igd-bed-card-name">
          {patient?.name ?? (bed.status === 'cleaning' ? 'Cleaning' : 'Kosong')}
        </div>
        <div className="igd-bed-card-meta">
          {patient
            ? patient.medicalRecordNumber || patient.registrationNumber
            : bed.status === 'cleaning'
              ? 'Proses pembersihan...'
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
          <div className="igd-bed-card-actions">
            <DesktopButton emphasis="toolbar" size="small" onClick={onInspect}>
              Periksa
            </DesktopButton>
            <DesktopButton emphasis="toolbar" size="small" onClick={onMove}>
              Pindah
            </DesktopButton>
          </div>
        ) : bed.status === 'available' ? (
          <div className="igd-bed-card-actions">
            <DesktopButton emphasis="primary" size="small" onClick={onAssign} disabled={!canAssign}>
              Assign Pasien
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
        subtitle="Snapshot bed IGD mengikuti dashboard backend dan level triase pasien aktif."
        status={isLoading ? 'Memuat data' : 'Terhubung backend'}
        metadata={
          <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
            <DesktopBadge tone="success">{availableCount} bed tersedia</DesktopBadge>
          </div>
        }
        actions={
          <>
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
        <DesktopCard title="Memuat peta bed IGD" subtitle="Mengambil snapshot bed dari backend.">
          <DesktopNoticePanel
            title="Memuat peta bed IGD"
            description="Data bed dan pasien aktif sedang disinkronkan."
          />
        </DesktopCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <DesktopCard title="Gagal memuat peta bed" subtitle="Coba ulangi sinkronisasi bed IGD.">
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Gagal memuat peta bed"
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
        title={assignModalBedCode ? `Assign Pasien ke ${assignModalBedCode}` : 'Assign Pasien'}
        open={!!assignModalBedCode}
        getContainer={false}
        onCancel={() => {
          setAssignModalBedCode(null)
          setAssignModalPatientId('')
        }}
        onOk={() => void handleAssignConfirm()}
        okText="Assign"
        okButtonProps={{
          disabled: !assignModalPatientId || !onAssignBed || assignablePatientOptions.length === 0,
          loading: !!actionLoading?.assign
        }}
      >
        {assignablePatientOptions.length === 0 ? (
          <DesktopNoticePanel
            title="Tidak ada pasien tanpa bed"
            description="Semua pasien aktif saat ini sudah memiliki bed atau belum ada pasien aktif yang dapat di-assign."
          />
        ) : (
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Pilih pasien untuk di-assign"
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
        title={moveModalBedCode ? `Pindah Pasien dari ${moveModalBedCode}` : 'Pindah Bed'}
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
            Release
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
            title="Tidak ada bed tujuan yang tersedia"
            description="Semua bed kosong sedang tidak tersedia untuk dijadikan tujuan pindah."
          />
        ) : (
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title={
                moveModalPatient
                  ? `Pindah atau release ${moveModalPatient.name}`
                  : 'Pilih aksi untuk pasien di bed ini'
              }
              description={`Pasien saat ini berada di ${moveModalBedCode ?? '-'}. Anda bisa memilih bed tujuan atau release pasien dari bed aktif.`}
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
        title={inspectModalBed ? `Periksa ${inspectModalBed.code}` : 'Periksa Bed'}
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
          title="Pindah ke halaman pemeriksaan"
          description="Placeholder sementara untuk alur buka halaman pemeriksaan dari peta bed IGD."
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
              title="Form siap, submit backend belum tersedia"
              description="Modal pembuatan bed baru sudah tersedia, tetapi submit ke backend room master belum diaktifkan pada route ini."
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
