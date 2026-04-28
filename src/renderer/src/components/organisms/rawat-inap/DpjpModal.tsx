import { App, Modal, Select, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { DesktopButton } from '../../design-system/atoms/DesktopButton'
import { client } from '@renderer/utils/client'
import type { DpjpParticipantItem } from '@main/rpc/procedure/encounter.schemas'

interface PatientInfo {
  name: string
  medicalRecordNumber: string | null
  ageLabel: string | null
  wardName: string | null
}

interface TambahanEntry {
  staffId: number
  staffName: string
}

interface DpjpModalProps {
  open: boolean
  encounterId: string
  patientInfo: PatientInfo
  onClose: () => void
  onSaved: () => void
}

const INP =
  'w-full rounded-[var(--ds-radius)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-secondary)] px-[10px] py-[7px] text-[12.5px] text-[var(--ds-color-text)] outline-none placeholder:text-[var(--ds-color-text-muted)] box-border'

const LBL = 'mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-muted)]'

const ALASAN_OPTIONS = [
  { value: 'Penetapan awal', label: 'Penetapan awal saat admisi' },
  { value: 'Pergantian shift dokter', label: 'Pergantian shift dokter' },
  { value: 'Alih rawat', label: 'Alih rawat / transfer spesialisasi' },
  { value: 'Dokter cuti/berhalangan', label: 'Dokter cuti / berhalangan' },
  { value: 'Permintaan pasien', label: 'Permintaan pasien / keluarga' },
  { value: 'Lainnya', label: 'Lainnya' },
]

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function DpjpModal({ open, encounterId, patientInfo, onClose, onSaved }: DpjpModalProps) {
  const { message: msg } = App.useApp()

  const dpjpQuery = client.encounter.listDpjp.useQuery(encounterId, {
    enabled: open && !!encounterId,
    queryKey: ['encounter', encounterId],
  })
  const practitionerQuery = client.practitioner.list.useQuery({ hakAksesId: 'doctor' })

  const assignMutation = client.encounter.assignDpjp.useMutation()
  const removeMutation = client.encounter.removeDpjp.useMutation()

  const [selectedUtamaId, setSelectedUtamaId] = useState<number | undefined>(undefined)
  const [selectedTambahan, setSelectedTambahan] = useState<TambahanEntry[]>([])
  const [konsSearch, setKonsSearch] = useState('')
  const [berlakuDari, setBerlakuDari] = useState(todayIso)
  const [alasan, setAlasan] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [saving, setSaving] = useState(false)

  const rawList: DpjpParticipantItem[] = Array.isArray(dpjpQuery.data?.result)
    ? (dpjpQuery.data.result as DpjpParticipantItem[])
    : []
  const originalUtama = rawList.find((d) => d.role === 'dpjp_utama')
  const originalTambahan = rawList.filter((d) => d.role === 'dpjp_tambahan')

  useEffect(() => {
    if (!dpjpQuery.isLoading && dpjpQuery.data) {
      setSelectedUtamaId(originalUtama?.staffId)
      setSelectedTambahan(
        originalTambahan.map((d) => ({ staffId: d.staffId, staffName: d.staffName })),
      )
      setBerlakuDari(todayIso())
      setAlasan('')
      setKeterangan('')
      setKonsSearch('')
    }
  }, [dpjpQuery.data, dpjpQuery.isLoading])

  const practitioners = practitionerQuery.data?.result ?? []

  const selectedUtamaName =
    practitioners.find((p) => p.id === selectedUtamaId)?.namaLengkap ?? originalUtama?.staffName

  const konsSuggestions = practitioners.filter(
    (p) =>
      p.id !== selectedUtamaId &&
      !selectedTambahan.find((t) => t.staffId === p.id) &&
      konsSearch !== '' &&
      p.namaLengkap.toLowerCase().includes(konsSearch.toLowerCase()),
  )

  const addTambahan = (staffId: number, staffName: string) => {
    setSelectedTambahan((prev) => [...prev, { staffId, staffName }])
    setKonsSearch('')
  }

  const removeTambahan = (staffId: number) => {
    setSelectedTambahan((prev) => prev.filter((t) => t.staffId !== staffId))
  }

  const utamaChanged = selectedUtamaId !== originalUtama?.staffId
  const isChanging = utamaChanged && !!originalUtama && !!selectedUtamaName
  const canSave = !!selectedUtamaId

  const resolvedNotes = alasan === 'Lainnya' ? keterangan.trim() || 'Lainnya' : alasan || undefined

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const startAtIso = berlakuDari ? new Date(berlakuDari).toISOString() : undefined

      if (utamaChanged && originalUtama) {
        for (const t of originalTambahan) {
          await removeMutation.mutateAsync({ encounterId, participantId: t.id })
        }
        await removeMutation.mutateAsync({ encounterId, participantId: originalUtama.id })
        await assignMutation.mutateAsync({
          encounterId,
          staffId: selectedUtamaId!,
          role: 'dpjp_utama',
          startAt: startAtIso,
          notes: resolvedNotes,
        })
        for (const t of selectedTambahan) {
          await assignMutation.mutateAsync({
            encounterId,
            staffId: t.staffId,
            role: 'dpjp_tambahan',
            startAt: startAtIso,
          })
        }
      } else if (utamaChanged && !originalUtama && selectedUtamaId) {
        await assignMutation.mutateAsync({
          encounterId,
          staffId: selectedUtamaId,
          role: 'dpjp_utama',
          startAt: startAtIso,
          notes: resolvedNotes,
        })
        for (const t of selectedTambahan) {
          await assignMutation.mutateAsync({
            encounterId,
            staffId: t.staffId,
            role: 'dpjp_tambahan',
            startAt: startAtIso,
          })
        }
      } else {
        for (const t of originalTambahan) {
          if (!selectedTambahan.find((s) => s.staffId === t.staffId)) {
            await removeMutation.mutateAsync({ encounterId, participantId: t.id })
          }
        }
        for (const t of selectedTambahan) {
          if (!originalTambahan.find((o) => o.staffId === t.staffId)) {
            await assignMutation.mutateAsync({
              encounterId,
              staffId: t.staffId,
              role: 'dpjp_tambahan',
              startAt: startAtIso,
            })
          }
        }
      }

      void msg.success('DPJP berhasil disimpan')
      onSaved()
      onClose()
    } catch (err) {
      void msg.error(err instanceof Error ? err.message : 'Gagal menyimpan DPJP')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--ds-color-accent)' }}
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tetapkan / Ganti DPJP</span>
        </div>
      }
      footer={null}
      width={560}
      destroyOnClose
    >
      <Spin spinning={dpjpQuery.isLoading || saving}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>

          {/* ── Patient banner ─────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: 'var(--ds-color-surface-secondary)',
              border: '1px solid var(--ds-color-border)',
              borderRadius: 'var(--ds-radius)',
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'color-mix(in srgb, var(--ds-color-accent) 14%, white)',
                color: 'var(--ds-color-accent)',
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700,
              }}
            >
              {initials(patientInfo.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ds-color-text)' }}>
                {patientInfo.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ds-color-text-muted)' }}>
                {patientInfo.medicalRecordNumber ?? '-'} · {patientInfo.ageLabel ?? '-'} ·{' '}
                {patientInfo.wardName ?? '-'}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.04em', color: 'var(--ds-color-text-muted)',
                }}
              >
                DPJP Saat Ini
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ds-color-accent)' }}>
                {originalUtama?.staffName ?? '—'}
              </div>
            </div>
          </div>

          {/* ── DPJP Utama ─────────────────────────────────────────────────── */}
          <div>
            <label className={LBL}>
              DPJP Utama{' '}
              <span style={{ color: 'var(--ds-color-danger)', fontWeight: 400 }}>*</span>
            </label>
            <Select
              showSearch
              filterOption={(input, opt) =>
                ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%', fontSize: 12.5 }}
              placeholder="— Pilih dokter DPJP —"
              value={selectedUtamaId}
              onChange={(val: number) => setSelectedUtamaId(val)}
              options={practitioners.map((p) => ({ value: p.id, label: p.namaLengkap }))}
              loading={practitionerQuery.isLoading}
              status={selectedUtamaId ? undefined : undefined}
            />
            {selectedUtamaId && selectedUtamaName && (
              <div
                style={{
                  marginTop: 6, padding: '6px 10px',
                  background: 'color-mix(in srgb, var(--ds-color-accent) 10%, white)',
                  border: '1px solid var(--ds-color-accent)',
                  borderRadius: 'var(--ds-radius)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 11.5,
                }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ds-color-accent)', flexShrink: 0 }}>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span style={{ fontWeight: 600, color: 'var(--ds-color-accent)' }}>
                  {selectedUtamaName}
                </span>
              </div>
            )}
          </div>

          {/* ── DPJP Konsultan ─────────────────────────────────────────────── */}
          <div>
            <label className={LBL}>
              DPJP Konsultan{' '}
              <span
                style={{
                  fontSize: 10, fontWeight: 400, textTransform: 'none',
                  letterSpacing: 0, color: 'var(--ds-color-text-muted)',
                }}
              >
                (opsional — multidisiplin)
              </span>
            </label>

            {selectedTambahan.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {selectedTambahan.map((k) => (
                  <div
                    key={k.staffId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px',
                      background: 'var(--ds-color-surface-secondary)',
                      border: '1px solid var(--ds-color-border)',
                      borderRadius: 'var(--ds-radius)',
                      fontSize: 12,
                    }}
                  >
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--ds-color-text-muted)', flexShrink: 0 }}>
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--ds-color-text)' }}>
                      {k.staffName}
                    </span>
                    <button
                      onClick={() => removeTambahan(k.staffId)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ds-color-text-muted)', padding: '0 2px',
                        fontSize: 16, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute', left: 9, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ds-color-text-muted)', pointerEvents: 'none',
                  display: 'flex',
                }}
              >
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                value={konsSearch}
                onChange={(e) => setKonsSearch(e.target.value)}
                placeholder="Cari dokter konsultan…"
                className={INP}
                style={{ paddingLeft: 28 }}
              />
            </div>

            {konsSearch.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  border: '1px solid var(--ds-color-border)',
                  borderRadius: 'var(--ds-radius)',
                  overflow: 'hidden',
                  background: 'var(--ds-color-surface)',
                }}
              >
                {konsSuggestions.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 11.5, color: 'var(--ds-color-text-muted)' }}>
                    Tidak ada dokter yang cocok.
                  </div>
                ) : (
                  konsSuggestions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addTambahan(d.id, d.namaLengkap)}
                      style={{
                        width: '100%', padding: '8px 12px', textAlign: 'left',
                        background: 'none', border: 'none',
                        borderBottom: '1px solid var(--ds-color-border)',
                        cursor: 'pointer',
                        display: 'flex', gap: 8, alignItems: 'center', fontSize: 12,
                      }}
                    >
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--ds-color-text-muted)', flexShrink: 0 }}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span style={{ fontWeight: 600, color: 'var(--ds-color-text)' }}>
                        {d.namaLengkap}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Berlaku Dari + Alasan ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className={LBL}>Berlaku Dari</label>
              <input
                type="date"
                value={berlakuDari}
                onChange={(e) => setBerlakuDari(e.target.value)}
                className={INP}
              />
            </div>
            <div>
              <label className={LBL}>
                Alasan{' '}
                {isChanging ? (
                  <span style={{ color: 'var(--ds-color-danger)', fontWeight: 400 }}>*</span>
                ) : (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 400, textTransform: 'none',
                      letterSpacing: 0, color: 'var(--ds-color-text-muted)',
                    }}
                  >
                    (opsional)
                  </span>
                )}
              </label>
              <select
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className={INP}
              >
                <option value="">— Pilih alasan —</option>
                {ALASAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Keterangan tambahan (only when Lainnya) ────────────────────── */}
          {alasan === 'Lainnya' && (
            <div>
              <label className={LBL}>Keterangan Tambahan</label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan keterangan…"
                className={INP}
                style={{ minHeight: 60, resize: 'vertical' }}
              />
            </div>
          )}

          {/* ── Change warning ─────────────────────────────────────────────── */}
          {isChanging && (
            <div
              style={{
                padding: '8px 12px',
                background: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
                border: '1px solid var(--ds-color-warning)',
                borderRadius: 'var(--ds-radius)',
                fontSize: 11.5,
                color: 'var(--ds-color-warning)',
                display: 'flex', gap: 8, alignItems: 'center',
              }}
            >
              <span>⚠</span>
              <span>
                Pergantian DPJP dari <b>{originalUtama?.staffName}</b> →{' '}
                <b>{selectedUtamaName}</b> akan dicatat dalam log perubahan.
              </span>
            </div>
          )}

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex', gap: 8, justifyContent: 'flex-end',
              paddingTop: 12,
              borderTop: '1px solid var(--ds-color-border)',
            }}
          >
            <DesktopButton emphasis="toolbar" onClick={onClose} disabled={saving}>
              Batal
            </DesktopButton>
            <DesktopButton
              emphasis="primary"
              onClick={() => void handleSave()}
              disabled={!canSave || saving}
              loading={saving}
            >
              Simpan DPJP
            </DesktopButton>
          </div>
        </div>
      </Spin>
    </Modal>
  )
}
