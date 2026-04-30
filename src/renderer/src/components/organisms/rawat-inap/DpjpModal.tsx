/**
 * purpose: Render modal for assigning or changing primary and additional DPJP on inpatient encounters.
 * main callers: `RawatInapPasienPage` summary actions in rawat inap workflow.
 * key dependencies: Ant Design modal/form controls with desktop token theme, encounter RPC mutations, practitioner list query.
 * main/public functions: `DpjpModal`.
 * side effects: Reads current DPJP, assigns/removes encounter DPJP participants, resets local form state, and triggers success/error toasts.
 */
import {
  AlertOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons'
import { App, Modal, Select, Spin, theme } from 'antd'
import { useEffect, useState, type CSSProperties } from 'react'
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
  const { token } = theme.useToken()
  const labelStyle: CSSProperties = {
    marginBottom: 6,
    display: 'block',
    fontSize: 10.5,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: token.colorTextTertiary
  }
  const inputStyle: CSSProperties = {
    width: '100%',
    borderRadius: token.borderRadius,
    border: `1px solid ${token.colorBorder}`,
    background: token.colorBgContainer,
    color: token.colorText,
    padding: '7px 10px',
    fontSize: 12.5,
    outline: 'none',
    boxSizing: 'border-box'
  }

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
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: token.colorText }}>
          <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Tetapkan / Ganti DPJP</span>
        </div>
      }
      footer={null}
      width={620}
      destroyOnClose
      styles={{
        header: {
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          paddingBottom: 10,
          marginBottom: 0
        },
        body: {
          paddingTop: 16
        }
      }}
    >
      <Spin spinning={dpjpQuery.isLoading || saving}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>

          {/* ── Patient banner ─────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700,
              }}
            >
              {initials(patientInfo.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: token.colorText }}>
                {patientInfo.name}
              </div>
              <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
                {patientInfo.medicalRecordNumber ?? '-'} · {patientInfo.ageLabel ?? '-'} ·{' '}
                {patientInfo.wardName ?? '-'}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.04em', color: token.colorTextTertiary,
                }}
              >
                DPJP Saat Ini
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: token.colorPrimary }}>
                {originalUtama?.staffName ?? '—'}
              </div>
            </div>
          </div>

          {/* ── DPJP Utama ─────────────────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>
              DPJP Utama{' '}
              <span style={{ color: token.colorError, fontWeight: 400 }}>*</span>
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
                  background: token.colorPrimaryBg,
                  border: `1px solid ${token.colorPrimaryBorder}`,
                  borderRadius: token.borderRadius,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 11.5,
                }}
              >
                <UserOutlined style={{ color: token.colorPrimary, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: token.colorPrimary }}>
                  {selectedUtamaName}
                </span>
              </div>
            )}
          </div>

          {/* ── DPJP Konsultan ─────────────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>
              DPJP Konsultan{' '}
              <span
                style={{
                  fontSize: 10, fontWeight: 400, textTransform: 'none',
                  letterSpacing: 0, color: token.colorTextTertiary,
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
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                      borderRadius: token.borderRadius,
                      fontSize: 12,
                    }}
                  >
                    <MedicineBoxOutlined style={{ color: token.colorTextTertiary, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 600, color: token.colorText }}>
                      {k.staffName}
                    </span>
                    <button
                      onClick={() => removeTambahan(k.staffId)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: token.colorTextTertiary, padding: '0 2px',
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
                  color: token.colorTextTertiary, pointerEvents: 'none',
                  display: 'flex',
                }}
              >
                <SearchOutlined style={{ fontSize: 12 }} />
              </span>
              <input
                value={konsSearch}
                onChange={(e) => setKonsSearch(e.target.value)}
                placeholder="Cari dokter konsultan…"
                style={{ ...inputStyle, paddingLeft: 28 }}
              />
            </div>

            {konsSearch.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadius,
                  overflow: 'hidden',
                  background: token.colorBgContainer,
                }}
              >
                {konsSuggestions.length === 0 ? (
                  <div style={{ padding: '8px 12px', fontSize: 11.5, color: token.colorTextSecondary }}>
                    Tidak ada dokter yang cocok.
                  </div>
                ) : (
                  konsSuggestions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addTambahan(d.id, d.namaLengkap)}
                      style={{
                        width: '100%', padding: '8px 12px', textAlign: 'left',
                        background: token.colorBgContainer, border: 'none',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        cursor: 'pointer',
                        display: 'flex', gap: 8, alignItems: 'center', fontSize: 12,
                      }}
                    >
                      <PlusOutlined style={{ color: token.colorTextTertiary, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: token.colorText }}>
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
              <label style={labelStyle}>Berlaku Dari</label>
              <input
                type="date"
                value={berlakuDari}
                onChange={(e) => setBerlakuDari(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Alasan{' '}
                {isChanging ? (
                  <span style={{ color: token.colorError, fontWeight: 400 }}>*</span>
                ) : (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 400, textTransform: 'none',
                      letterSpacing: 0, color: token.colorTextTertiary,
                    }}
                  >
                    (opsional)
                  </span>
                )}
              </label>
              <Select
                value={alasan}
                onChange={(val) => setAlasan(String(val || ''))}
                className="w-full"
                placeholder="— Pilih alasan —"
                options={ALASAN_OPTIONS}
                allowClear
                style={{ fontSize: 12.5 }}
              />
            </div>
          </div>

          {/* ── Keterangan tambahan (only when Lainnya) ────────────────────── */}
          {alasan === 'Lainnya' && (
            <div>
              <label style={labelStyle}>Keterangan Tambahan</label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan keterangan…"
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              />
            </div>
          )}

          {/* ── Change warning ─────────────────────────────────────────────── */}
          {isChanging && (
            <div
              style={{
                padding: '8px 12px',
                background: token.colorWarningBg,
                border: `1px solid ${token.colorWarning}`,
                borderRadius: token.borderRadius,
                fontSize: 11.5,
                color: token.colorWarning,
                display: 'flex', gap: 8, alignItems: 'center',
              }}
            >
              <AlertOutlined />
              <span>
                Pergantian DPJP dari <b>{originalUtama?.staffName}</b> ke{' '}
                <b>{selectedUtamaName}</b> akan dicatat dalam log perubahan.
              </span>
            </div>
          )}

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex', gap: 8, justifyContent: 'flex-end',
              paddingTop: 12,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
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
