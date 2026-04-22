import { DesktopBadge, type DesktopBadgeTone } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import {
  DesktopStatusDot,
  type DesktopStatus
} from '../../components/design-system/atoms/DesktopStatusDot'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { IGD_PAGE_PATHS } from './igd.config'
import { type IgdBed, type IgdBedStatus, type IgdBedZone, type IgdPatient, useIgdStore } from './igd.state'

type IgdBedMapPageProps = {
  onBack?: () => void
}

const ZONE_ORDER: IgdBedZone[] = ['Resusitasi', 'Observasi', 'Treatment']

const ZONE_DESCRIPTIONS: Record<IgdBedZone, string> = {
  Resusitasi: 'Zona untuk pasien kritis dan tindakan segera.',
  Observasi: 'Zona monitoring pasien yang perlu observasi lanjutan.',
  Treatment: 'Zona tindakan singkat dan stabilisasi non-resusitasi.'
}

const getBedTone = (status: IgdBedStatus): DesktopBadgeTone => {
  if (status === 'occupied') return 'info'
  if (status === 'cleaning') return 'warning'
  return 'success'
}

const getBedStatusDot = (status: IgdBedStatus): DesktopStatus => {
  if (status === 'occupied') return 'info'
  if (status === 'cleaning') return 'warning'
  return 'success'
}

const getTriageTone = (level: IgdPatient['triageLevel']): DesktopBadgeTone => {
  if (level === 1) return 'danger'
  if (level === 2) return 'warning'
  if (level === 3) return 'info'
  return 'success'
}

function BedCard({
  bed,
  patient,
  assigningPatientId,
  onAssign
}: {
  bed: IgdBed
  patient?: IgdPatient
  assigningPatientId?: number
  onAssign: () => void
}) {
  const canAssign =
    !!assigningPatientId &&
    bed.status !== 'cleaning' &&
    (bed.status === 'available' || bed.patientId === assigningPatientId)

  return (
    <DesktopCard
      title={bed.code}
      subtitle={patient ? patient.registrationNumber : 'Siap untuk assign pasien'}
      compact
      extra={<DesktopBadge tone={getBedTone(bed.status)}>{bed.status}</DesktopBadge>}
    >
      <div className="grid gap-[var(--ds-space-sm)]">
        <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
          <DesktopStatusDot status={getBedStatusDot(bed.status)} label={bed.status} />
          {patient ? <DesktopBadge tone={getTriageTone(patient.triageLevel)}>L{patient.triageLevel}</DesktopBadge> : null}
        </div>
        <div className="text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
          {patient?.name ?? 'Belum terisi'}
        </div>
        <div className="text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
          {patient?.complaint ?? 'Bed siap dipakai untuk pasien berikutnya.'}
        </div>
        <DesktopButton emphasis="primary" onClick={onAssign} disabled={!canAssign}>
          {bed.status === 'occupied' && bed.patientId !== assigningPatientId
            ? 'Bed sedang terpakai'
            : 'Assign ke bed ini'}
        </DesktopButton>
      </div>
    </DesktopCard>
  )
}

export function IgdBedMapPage({ onBack }: IgdBedMapPageProps) {
  const beds = useIgdStore((state) => state.beds)
  const patients = useIgdStore((state) => state.patients)
  const selectedPatientId = useIgdStore((state) => state.selectedPatientId)
  const setSelectedPatient = useIgdStore((state) => state.setSelectedPatient)
  const assignBed = useIgdStore((state) => state.assignBed)
  const [assigningPatientId, setAssigningPatientId] = useState<string>(String(selectedPatientId))

  const patientOptions = useMemo(
    () =>
      patients.map((patient) => ({
        label: `${patient.name} (${patient.registrationNumber})`,
        value: String(patient.id)
      })),
    [patients]
  )

  const activePatient = patients.find((patient) => String(patient.id) === assigningPatientId)

  return (
    <div className="flex flex-col gap-[var(--ds-layout-section-gap)]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Peta Bed IGD"
        subtitle="Zona Resusitasi, Observasi, dan Treatment mengikuti kode bed seed IGD."
        status="Mock aktif"
        metadata={
          <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
            <DesktopBadge tone="success">
              {beds.filter((bed) => bed.status === 'available').length} bed tersedia
            </DesktopBadge>
            <DesktopTag tone="accent">{activePatient?.name ?? 'Pilih pasien untuk assign'}</DesktopTag>
          </div>
        }
        actions={<DesktopButton emphasis="toolbar" onClick={onBack}>Kembali ke Daftar</DesktopButton>}
      />

      <DesktopCard
        title="Assign Bed"
        subtitle="Pilih pasien aktif lebih dulu, lalu klik salah satu bed yang tersedia pada peta di bawah."
      >
        <div className="grid gap-[var(--ds-space-md)] md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
          <DesktopInputField
            label="Pasien untuk assign"
            type="select"
            placeholder="Pilih pasien"
            value={assigningPatientId}
            options={patientOptions}
            onChange={(value) => {
              setAssigningPatientId(value)
              if (value) setSelectedPatient(Number(value))
            }}
          />
          <div className="flex flex-wrap gap-[var(--ds-space-sm)]">
            {activePatient ? (
              <>
                <DesktopBadge tone={getTriageTone(activePatient.triageLevel)}>
                  Level {activePatient.triageLevel}
                </DesktopBadge>
                <DesktopTag tone="neutral">{activePatient.registrationNumber}</DesktopTag>
                <DesktopTag tone="neutral">{activePatient.bedCode ?? 'Belum ada bed'}</DesktopTag>
              </>
            ) : null}
          </div>
        </div>
      </DesktopCard>

      <div className="grid gap-[var(--ds-space-md)]">
        {ZONE_ORDER.map((zone) => (
          <DesktopCard
            key={zone}
            title={`Zona ${zone}`}
            subtitle={ZONE_DESCRIPTIONS[zone]}
            extra={
              <DesktopBadge tone="accent">
                {beds.filter((bed) => bed.zone === zone && bed.status === 'available').length} tersedia
              </DesktopBadge>
            }
          >
            <div className="grid gap-[var(--ds-space-md)] md:grid-cols-2 xl:grid-cols-3">
              {beds
                .filter((bed) => bed.zone === zone)
                .map((bed) => {
                  const patient = patients.find((item) => item.id === bed.patientId)

                  return (
                    <BedCard
                      key={bed.code}
                      bed={bed}
                      patient={patient}
                      assigningPatientId={assigningPatientId ? Number(assigningPatientId) : undefined}
                      onAssign={() => {
                        if (!assigningPatientId) return
                        assignBed({ patientId: Number(assigningPatientId), bedCode: bed.code })
                      }}
                    />
                  )
                })}
            </div>
          </DesktopCard>
        ))}
      </div>
    </div>
  )
}

export default function IgdBedMapRoute() {
  const navigate = useNavigate()

  return <IgdBedMapPage onBack={() => navigate(IGD_PAGE_PATHS.daftar)} />
}
