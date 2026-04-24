import {
  BarChartOutlined,
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined
} from '@ant-design/icons'
import React from 'react'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'

import {
  getBedById,
  getPatientByBedId,
  getRoomsForWard,
  getWardOccupancy,
  type RawatInapBed,
  type RawatInapState
} from './rawat-inap.state'

void React

type RawatInapBedMapPageProps = {
  state: RawatInapState
  onSelectWard?: (wardId: string) => void
  onSelectBed?: (bedId: string) => void
  onOpenTransfer?: () => void
  onOpenCppt?: () => void
  onOpenDischarge?: () => void
}

const getBedStatusColors = (status: RawatInapBed['status']) => {
  if (status === 'occupied') {
    return {
      background: 'color-mix(in srgb, var(--ds-color-info) 12%, white)',
      border: 'var(--ds-color-info)',
      text: 'var(--ds-color-info)',
      label: 'Terisi'
    }
  }

  if (status === 'cleaning') {
    return {
      background: 'color-mix(in srgb, var(--ds-color-warning) 14%, white)',
      border: 'var(--ds-color-warning)',
      text: 'var(--ds-color-warning)',
      label: 'Cleaning'
    }
  }

  return {
    background: 'color-mix(in srgb, var(--ds-color-success) 12%, white)',
    border: 'var(--ds-color-success)',
    text: 'var(--ds-color-success)',
    label: 'Kosong'
  }
}

export function RawatInapBedMapPage({
  state,
  onSelectWard,
  onSelectBed,
  onOpenTransfer,
  onOpenCppt,
  onOpenDischarge
}: RawatInapBedMapPageProps) {
  const activeWard = state.wards.find((ward) => ward.id === state.activeWardId) ?? state.wards[0]
  const selectedBed = getBedById(state, state.selectedBedId)
  const selectedPatient = getPatientByBedId(state, state.selectedBedId)
  const rooms = activeWard ? getRoomsForWard(state, activeWard.id) : []
  const totalBeds = state.beds.length
  const occupiedBeds = state.beds.filter((bed) => bed.status === 'occupied').length
  const availableBeds = state.beds.filter((bed) => bed.status === 'available').length
  const cleaningBeds = state.beds.filter((bed) => bed.status === 'cleaning').length

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold text-[var(--ds-color-text)]">
            Rawat Inap — Peta Bed
          </h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            {`${state.wards.length} bangsal · ${totalBeds} tempat tidur · BOR 84.2% · diperbarui real-time`}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <DesktopButton emphasis="toolbar" icon={<BarChartOutlined />}>
            Statistik BOR
          </DesktopButton>
          <DesktopButton emphasis="toolbar" icon={<TeamOutlined />}>
            Daftar Pasien
          </DesktopButton>
          <DesktopButton emphasis="primary" icon={<PlusOutlined />}>
            Admisi Baru
          </DesktopButton>
        </div>
      </div>

      <div className="grid gap-[12px] md:grid-cols-4">
        {state.wards.map((ward) => {
          const { occupiedBeds: wardOccupiedBeds, totalBeds: wardTotalBeds } = getWardOccupancy(state, ward.id)
          const percentage = wardTotalBeds ? Math.round((wardOccupiedBeds / wardTotalBeds) * 100) : 0

          return (
            <div
              key={ward.id}
              className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[14px] py-[12px] shadow-[var(--ds-shadow-xs)]"
            >
              <div className="flex items-center justify-between gap-[8px]">
                <div>
                  <div className="text-[12px] font-semibold text-[var(--ds-color-text)]">{ward.name}</div>
                  <div className="text-[11px] text-[var(--ds-color-text-muted)]">{ward.classLabel}</div>
                </div>
                <DesktopBadge tone={percentage >= 85 ? 'warning' : 'accent'}>
                  {`${wardOccupiedBeds}/${wardTotalBeds}`}
                </DesktopBadge>
              </div>
              <div className="mt-[10px] h-[5px] overflow-hidden rounded-[999px] bg-[var(--ds-color-surface-muted)]">
                <div
                  style={{ width: `${percentage}%` }}
                  className="h-full rounded-[999px] bg-[var(--ds-color-accent)]"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[16px] py-[12px] shadow-[var(--ds-shadow-xs)]">
        <div className="flex flex-wrap items-center gap-[18px]">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
              Total Bed Rawat Inap
            </div>
            <div className="font-mono text-[26px] leading-none text-[var(--ds-color-text)]">
              {totalBeds}
            </div>
          </div>
          <div className="h-[40px] w-px bg-[var(--ds-color-border)]" />
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
              Terisi
            </div>
            <div className="font-mono text-[18px] leading-none text-[var(--ds-color-info)]">
              {occupiedBeds}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
              Kosong
            </div>
            <div className="font-mono text-[18px] leading-none text-[var(--ds-color-success)]">
              {availableBeds}
            </div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
              Cleaning
            </div>
            <div className="font-mono text-[18px] leading-none text-[var(--ds-color-warning)]">
              {cleaningBeds}
            </div>
          </div>
        </div>
      </div>

      <div
        className="rawat-inap-bed-map-layout grid gap-[16px]"
        style={{ gridTemplateColumns: '180px minmax(0, 1fr) 320px' }}
      >
        <DesktopCard title="Bangsal" compact>
          <div className="flex flex-col gap-[4px]">
            {state.wards.map((ward) => {
              const { occupiedBeds: wardOccupiedBeds, totalBeds: wardTotalBeds } = getWardOccupancy(state, ward.id)
              const isActive = ward.id === state.activeWardId
              const percentage = wardTotalBeds ? Math.round((wardOccupiedBeds / wardTotalBeds) * 100) : 0

              return (
                <button
                  key={ward.id}
                  type="button"
                  onClick={() => onSelectWard?.(ward.id)}
                  className="w-full rounded-[var(--ds-radius-md)] px-[10px] py-[10px] text-left transition-colors"
                  style={{
                    border: 'none',
                    background: isActive ? 'var(--ds-color-accent-soft)' : 'transparent',
                    color: isActive ? 'var(--ds-color-accent)' : 'var(--ds-color-text)'
                  }}
                >
                  <div className="flex items-center justify-between gap-[8px]">
                    <b className="text-[13px]">{ward.name}</b>
                    <span className="font-mono text-[11px] opacity-80">
                      {`${wardOccupiedBeds}/${wardTotalBeds}`}
                    </span>
                  </div>
                  <div className="mt-[2px] text-[10.5px] opacity-80">{ward.classLabel}</div>
                  <div className="mt-[8px] h-[3px] overflow-hidden rounded-[999px] bg-[var(--ds-color-surface-muted)]">
                    <div
                      className="h-full rounded-[999px]"
                      style={{
                        width: `${percentage}%`,
                        background:
                          isActive || percentage <= 85
                            ? 'var(--ds-color-accent)'
                            : 'var(--ds-color-warning)'
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </DesktopCard>

        <DesktopCard
          title={`Bangsal ${activeWard?.name ?? '-'} — ${activeWard?.classLabel ?? '-'}`}
          subtitle={`${activeWard?.floorLabel ?? '-'} · ${rooms.length} kamar · ${getWardOccupancy(state, activeWard?.id ?? '').totalBeds} bed`}
          extra={
            <div className="flex items-center overflow-hidden rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)]">
              <button
                type="button"
                className="border-none px-[14px] py-[7px] text-[12px] font-semibold"
                style={{ background: 'var(--ds-color-accent-soft)', color: 'var(--ds-color-accent)' }}
              >
                Grid
              </button>
              <button
                type="button"
                className="border-none bg-[var(--ds-color-surface)] px-[14px] py-[7px] text-[12px] font-semibold text-[var(--ds-color-text-muted)]"
              >
                Daftar
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-[10px]">
            {rooms.map((room) => (
              <div
                key={room.roomNo}
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[10px]"
              >
                <div className="mb-[8px] flex items-center justify-between gap-[8px]">
                  <span className="font-mono text-[11px] font-semibold text-[var(--ds-color-text-muted)]">
                    {`R. ${room.roomNo}`}
                  </span>
                  <span className="text-[9.5px] text-[var(--ds-color-text-subtle)]">
                    {`${room.beds.length} BED`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-[6px]">
                  {room.beds.map((bed) => {
                    const colors = getBedStatusColors(bed.status)
                    const patient = getPatientByBedId(state, bed.id)
                    const isSelected = bed.id === state.selectedBedId

                    return (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={() => onSelectBed?.(bed.id)}
                        className="min-h-[68px] rounded-[var(--ds-radius-md)] px-[8px] py-[8px] text-left"
                        style={{
                          background: colors.background,
                          border: `${isSelected ? 2 : 1}px solid ${isSelected ? 'var(--ds-color-text)' : colors.border}`,
                          cursor: 'pointer'
                        }}
                      >
                        <div className="flex items-center justify-between gap-[6px]">
                          <b
                            className="font-mono text-[11px]"
                            style={{ color: colors.text }}
                          >{`${bed.roomNo}${bed.bedLabel}`}</b>
                          {bed.losDays > 0 ? (
                            <span className="font-mono text-[9.5px]" style={{ color: colors.text }}>
                              {`d${bed.losDays}`}
                            </span>
                          ) : null}
                        </div>
                        {patient ? (
                          <>
                            <div className="mt-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-medium text-[var(--ds-color-text)]">
                              {patient.name}
                            </div>
                            <div className="font-mono text-[9.5px]" style={{ color: colors.text }}>
                              {patient.diagnosis}
                            </div>
                          </>
                        ) : (
                          <div className="mt-[6px] text-[10.5px] italic" style={{ color: colors.text }}>
                            {colors.label}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </DesktopCard>

        {!selectedBed ? (
          <DesktopCard title="Detail Bed">
            <DesktopNoticePanel
              title="Pilih bed untuk melihat detail"
              description="Panel ini akan menampilkan identitas pasien, ringkasan rawat, dan aksi operasional."
            />
          </DesktopCard>
        ) : (
          <DesktopCard
            title="Detail Bed"
            extra={<DesktopTag>{`${selectedBed.roomNo}${selectedBed.bedLabel}`}</DesktopTag>}
          >
            {selectedPatient ? (
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center gap-[12px] border-b border-[var(--ds-color-border)] pb-[12px]">
                  <div className="grid h-[44px] w-[44px] place-items-center rounded-[999px] bg-[var(--ds-color-accent-soft)] text-[14px] font-semibold text-[var(--ds-color-accent)]">
                    {selectedPatient.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-[var(--ds-color-text)]">
                      {selectedPatient.name}
                    </div>
                    <div className="text-[11px] text-[var(--ds-color-text-muted)]">
                      <span className="font-mono">{selectedPatient.rm}</span>
                    </div>
                  </div>
                  <DesktopBadge tone="info">{selectedPatient.payor}</DesktopBadge>
                </div>

                <div className="grid grid-cols-2 gap-[10px] border-b border-[var(--ds-color-border)] py-[12px] text-[11.5px]">
                  {[
                    ['Diagnosa', selectedPatient.diagnosis],
                    ['LOS', `${selectedBed.losDays} hari`],
                    ['DPJP', selectedPatient.dpjp],
                    ['Kelas Rawat', activeWard?.classLabel ?? '-'],
                    ['Masuk', selectedPatient.masukLabel],
                    ['Est. pulang', selectedPatient.estimatedDischargeLabel],
                    ['No. SEP', selectedPatient.sepNumber],
                    ['INA-CBG', selectedPatient.inaCbg]
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
                        {label}
                      </div>
                      <div className="text-[12px] font-medium text-[var(--ds-color-text)]">{value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-[8px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
                    Vital Sign Terakhir
                  </div>
                  <div className="grid grid-cols-4 gap-[6px]">
                    {selectedPatient.vitalSignSummary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[8px] py-[6px] text-center"
                      >
                        <div className="text-[9.5px] font-semibold text-[var(--ds-color-text-subtle)]">
                          {item.label}
                        </div>
                        <div
                          className="font-mono text-[14px] font-semibold"
                          style={{
                            color:
                              item.tone === 'warning'
                                ? 'var(--ds-color-warning)'
                                : 'var(--ds-color-text)'
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-[6px] text-right font-mono text-[10.5px] text-[var(--ds-color-text-muted)]">
                    06:00 · Ns. Rina
                  </div>
                </div>

                <div className="mt-[6px] flex gap-[6px]">
                  <DesktopButton emphasis="toolbar" size="small" className="!flex-1" icon={<EditOutlined />} onClick={onOpenCppt}>
                    CPPT
                  </DesktopButton>
                  <DesktopButton emphasis="toolbar" size="small" className="!flex-1" onClick={onOpenTransfer}>
                    Transfer
                  </DesktopButton>
                  <DesktopButton emphasis="primary" size="small" className="!flex-1" icon={<CheckOutlined />} onClick={onOpenDischarge}>
                    Pulang
                  </DesktopButton>
                </div>
              </div>
            ) : (
              <DesktopNoticePanel
                title="Bed belum terisi pasien"
                description="Pilih bed terisi untuk membuka detail pasien dan aksi operasional."
              />
            )}
          </DesktopCard>
        )}
      </div>
    </div>
  )
}
