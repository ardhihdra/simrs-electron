import {
  ArrowLeftOutlined,
  CheckOutlined
} from '@ant-design/icons'
import React from 'react'

import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'

import {
  getAvailableBedsForWard,
  getTransferSourceBed,
  getPatientByBedId,
  type RawatInapState,
  type RawatInapTransferReason
} from './rawat-inap.state'

void React

type RawatInapTransferPageProps = {
  state: RawatInapState
  onBack?: () => void
  onCancel?: () => void
  onSubmit?: () => void
  onTransferReasonChange?: (reason: RawatInapTransferReason) => void
  onTargetWardChange?: (wardId: string) => void
  onTargetBedChange?: (bedId: string) => void
  onTransferNoteChange?: (value: string) => void
}

const TRANSFER_REASON_OPTIONS: Array<{ value: RawatInapTransferReason; label: string }> = [
  { value: 'upgrade', label: 'Upgrade Kelas' },
  { value: 'downgrade', label: 'Downgrade' },
  { value: 'icu', label: 'Pindah ke ICU' },
  { value: 'other', label: 'Lainnya' }
]

export function RawatInapTransferPage({
  state,
  onBack,
  onCancel,
  onSubmit,
  onTransferReasonChange,
  onTargetWardChange,
  onTargetBedChange,
  onTransferNoteChange
}: RawatInapTransferPageProps) {
  const sourceBed = getTransferSourceBed(state)
  const patient = getPatientByBedId(state, sourceBed?.id ?? state.selectedBedId)
  const sourceWard = state.wards.find((ward) => ward.id === sourceBed?.wardId)
  const targetWardOptions = state.wards
    .filter((ward) => ward.id !== sourceBed?.wardId)
    .map((ward) => ({
      label: `${ward.name} — ${ward.classLabel} (${getAvailableBedsForWard(state, ward.id).length} kosong)`,
      value: ward.id
    }))
  const targetBedOptions = getAvailableBedsForWard(state, state.transferDraft.targetWardId)

  if (!sourceBed || !patient || !sourceWard) {
    return (
      <DesktopCard title="Transfer Antar Bangsal / Kamar">
        <DesktopNoticePanel
          title="Data pasien transfer belum tersedia"
          description="Pilih pasien dari halaman Peta Bed terlebih dahulu untuk membuka form transfer."
          tone="warning"
        />
      </DesktopCard>
    )
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <DesktopButton
            emphasis="ghost"
            size="small"
            icon={<ArrowLeftOutlined />}
            className="!mb-[6px] !px-0"
            onClick={onBack}
          >
            Daftar Pasien
          </DesktopButton>
          <h1 className="text-[28px] font-semibold text-[var(--ds-color-text)]">
            Transfer Antar Bangsal / Kamar
          </h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            {`${patient.name} · ${patient.rm} · ${sourceBed.roomNo}${sourceBed.bedLabel}`}
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          <DesktopButton emphasis="toolbar" onClick={onCancel}>
            Batal
          </DesktopButton>
          <DesktopButton emphasis="primary" icon={<CheckOutlined />} onClick={onSubmit}>
            Proses Transfer
          </DesktopButton>
        </div>
      </div>

      <div className="grid gap-[16px] md:grid-cols-2">
        <DesktopCard title="Dari (Kamar Saat Ini)">
          <div className="flex flex-col gap-[12px]">
            {[
              ['Bangsal', sourceWard.name],
              ['Kamar', `${sourceBed.roomNo}${sourceBed.bedLabel}`],
              ['Kelas', sourceWard.classLabel],
              ['DPJP', patient.dpjp],
              ['Masuk', patient.masukLabel],
              ['LOS', `${sourceBed.losDays} hari`]
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] px-[10px] py-[8px] text-[12px]"
              >
                <span className="text-[var(--ds-color-text-muted)]">{label}</span>
                <b className="text-[var(--ds-color-text)]">{value}</b>
              </div>
            ))}
          </div>
        </DesktopCard>

        <DesktopCard title="Ke (Tujuan Transfer)">
          <div className="flex flex-col gap-[12px]">
            <div>
              <label className="mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
                Alasan Transfer
              </label>
              <div className="flex flex-wrap gap-[6px]">
                {TRANSFER_REASON_OPTIONS.map((option) => {
                  const isActive = state.transferDraft.transferReason === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onTransferReasonChange?.(option.value)}
                      className="rounded-[var(--ds-radius-md)] px-[10px] py-[7px] text-[12px] font-semibold"
                      style={{
                        border: `1px solid ${isActive ? 'var(--ds-color-accent)' : 'var(--ds-color-border)'}`,
                        background: isActive ? 'var(--ds-color-accent-soft)' : 'var(--ds-color-surface-muted)',
                        color: isActive ? 'var(--ds-color-accent)' : 'var(--ds-color-text)'
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <DesktopInputField
              label="Bangsal Tujuan"
              type="select"
              value={state.transferDraft.targetWardId}
              options={targetWardOptions}
              onChange={onTargetWardChange}
            />

            <div>
              <label className="mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
                Bed Tersedia
              </label>
              <div className="flex flex-wrap gap-[6px]">
                {targetBedOptions.map((bed) => {
                  const isActive = state.transferDraft.targetBedId === bed.id

                  return (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => onTargetBedChange?.(bed.id)}
                      className="rounded-[var(--ds-radius-pill)] px-[10px] py-[5px] text-[11.5px] font-semibold"
                      style={{
                        border: `1px solid ${isActive ? 'var(--ds-color-accent)' : 'var(--ds-color-border)'}`,
                        background: isActive ? 'var(--ds-color-accent-soft)' : 'var(--ds-color-surface)',
                        color: isActive ? 'var(--ds-color-accent)' : 'var(--ds-color-text)'
                      }}
                    >
                      {`${bed.roomNo}${bed.bedLabel}`}
                    </button>
                  )
                })}
              </div>
            </div>

            <DesktopInputField
              label="Catatan Transfer"
              type="textarea"
              rows={3}
              placeholder="Alasan dan kondisi klinis saat transfer..."
              value={state.transferDraft.transferNote}
              onChange={onTransferNoteChange}
            />

            <DesktopNoticePanel
              tone="warning"
              title="Catatan Billing"
              description="Tarif kamar akan berubah mulai tanggal transfer. Riwayat bed tersimpan otomatis untuk BOR dan billing."
            />
          </div>
        </DesktopCard>
      </div>
    </div>
  )
}
