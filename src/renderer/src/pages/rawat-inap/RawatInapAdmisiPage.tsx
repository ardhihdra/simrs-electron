import {
  ArrowLeftOutlined,
  CheckOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  RightOutlined,
  SearchOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import React, { useState, type ReactNode } from 'react'

import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'

void React

type AdmissionSource = 'rajal' | 'igd' | 'rujukan'

type RawatInapAdmisiPageProps = {
  onBack?: () => void
  onCancel?: () => void
  onSubmit?: () => void
}

const ADMISSION_SOURCES: Array<{
  key: AdmissionSource
  icon: ReactNode
  label: string
  subtitle: string
}> = [
  {
    key: 'rajal',
    icon: <MedicineBoxOutlined />,
    label: 'Rawat Jalan',
    subtitle: 'Rujukan dari poli / dokter'
  },
  {
    key: 'igd',
    icon: <HeartOutlined />,
    label: 'IGD',
    subtitle: 'Transfer dari instalasi gawat darurat'
  },
  {
    key: 'rujukan',
    icon: <RightOutlined />,
    label: 'Rujukan Luar',
    subtitle: 'RS / puskesmas eksternal'
  }
]

const INPUT_CLASSNAME =
  'h-[32px] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[10px] text-[12px] text-[var(--ds-color-text)] outline-none transition-colors focus:border-[var(--ds-color-accent)] focus:shadow-[0_0_0_3px_var(--ds-color-accent-soft)]'

function AdmissionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
      <div className="flex min-h-[42px] items-center border-b border-[var(--ds-color-border)] px-[14px]">
        <h3 className="m-0 text-[13px] font-semibold text-[var(--ds-color-text)]">{title}</h3>
      </div>
      <div className="p-[14px]">{children}</div>
    </section>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-[6px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--ds-color-text-subtle)]">
      {children}
    </label>
  )
}

function TextInput({
  defaultValue,
  className = '',
  type = 'text'
}: {
  defaultValue: string
  className?: string
  type?: string
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      className={`${INPUT_CLASSNAME} ${className}`.trim()}
    />
  )
}

function SelectBox({
  className = '',
  children
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <select className={`${INPUT_CLASSNAME} ${className}`.trim()}>
      {children}
    </select>
  )
}

export function RawatInapAdmisiPage({
  onBack,
  onCancel,
  onSubmit
}: RawatInapAdmisiPageProps) {
  const [source, setSource] = useState<AdmissionSource>('rajal')

  return (
    <div className="rawat-inap-admisi-page flex flex-col gap-[14px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <DesktopButton
            emphasis="ghost"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="mb-[6px]"
          >
            Peta Bed
          </DesktopButton>
          <h1 className="m-0 text-[22px] font-bold tracking-[0] text-[var(--ds-color-text)]">
            Admisi Baru — Rawat Inap
          </h1>
          <div className="mt-[3px] text-[13px] text-[var(--ds-color-text-muted)]">
            Registrasi pasien masuk rawat inap · verifikasi BPJS & SEP · assign kamar
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <DesktopButton emphasis="ghost" onClick={onCancel}>
            Batal
          </DesktopButton>
          <DesktopButton emphasis="primary" icon={<CheckOutlined />} onClick={onSubmit}>
            Simpan & Proses Admisi
          </DesktopButton>
        </div>
      </div>

      <div className="grid items-start gap-[14px]" style={{ gridTemplateColumns: '200px minmax(0, 1fr)' }}>
        <section className="overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
          <div className="border-b border-[var(--ds-color-border)] px-[14px] py-[10px]">
            <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
              Sumber Masuk
            </h3>
          </div>
          <div className="flex flex-col gap-[4px] p-[8px_10px]">
            {ADMISSION_SOURCES.map((item) => {
              const selected = source === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSource(item.key)}
                  className="flex cursor-pointer flex-col gap-[3px] rounded-[var(--ds-radius-md)] px-[12px] py-[10px] text-left transition-colors"
                  style={{
                    background: selected
                      ? 'var(--ds-color-accent-soft)'
                      : 'var(--ds-color-surface-muted)',
                    border: `1px solid ${
                      selected ? 'var(--ds-color-accent)' : 'var(--ds-color-border)'
                    }`,
                    color: selected ? 'var(--ds-color-accent)' : 'var(--ds-color-text)'
                  }}
                >
                  <span className="flex items-center gap-[8px] text-[12.5px] font-semibold">
                    <span className="text-[13px]">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-[10.5px] leading-[1.3] opacity-75">{item.subtitle}</span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex flex-col gap-[14px]">
          <AdmissionCard title="Data Pasien">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <FieldLabel>No. RM</FieldLabel>
                <div className="flex gap-[6px]">
                  <TextInput defaultValue="02-14-88-21" className="min-w-0 flex-1 font-mono" />
                  <DesktopButton emphasis="toolbar" size="small" icon={<SearchOutlined />} />
                </div>
              </div>
              <div>
                <FieldLabel>Nama Pasien</FieldLabel>
                <TextInput defaultValue="Budi Santoso" className="w-full" />
              </div>
              <div>
                <FieldLabel>Tgl Lahir / Usia</FieldLabel>
                <TextInput defaultValue="12 Mar 1972 / 54 tahun" className="w-full" />
              </div>
              <div className="col-span-3 flex items-center gap-[16px] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] px-[12px] py-[10px] text-[11.5px]">
                <CheckOutlined className="text-[14px] text-[var(--ds-color-success)]" />
                <div className="min-w-0 flex-1">
                  <b className="text-[var(--ds-color-success)]">Pasien ditemukan</b>
                  <span className="ml-[8px] text-[var(--ds-color-text-muted)]">
                    Budi Santoso · L · 54 th · BPJS Aktif · Hak Kelas 1
                  </span>
                </div>
                <DesktopBadge tone="info">No. BPJS: 0001234567890</DesktopBadge>
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Verifikasi BPJS & SEP">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div>
                <FieldLabel>No. Rujukan / SEP Asal</FieldLabel>
                <TextInput defaultValue="0301R0010426V000142" className="w-full font-mono" />
              </div>
              <div>
                <FieldLabel>Poli / Unit Perujuk</FieldLabel>
                <TextInput defaultValue="Poli Penyakit Dalam" className="w-full" />
              </div>
              <div>
                <FieldLabel>Tanggal Masuk</FieldLabel>
                <TextInput type="date" defaultValue="2026-04-22" className="w-full" />
              </div>
              <div className="col-span-3 flex items-center gap-[8px]">
                <DesktopButton
                  emphasis="primary"
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                >
                  Bridging V-Claim — Terbitkan SEP RI
                </DesktopButton>
                <span className="text-[11.5px] text-[var(--ds-color-text-subtle)]">
                  SEP rawat inap akan diterbitkan otomatis setelah verifikasi eligibilitas.
                </span>
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Diagnosis & Indikasi Rawat Inap">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <FieldLabel>Diagnosis Masuk (ICD-10)</FieldLabel>
                <div className="flex gap-[8px]">
                  <TextInput defaultValue="I10" className="w-[80px] font-mono" />
                  <TextInput defaultValue="Essential hypertension" className="min-w-0 flex-1" />
                </div>
              </div>
              <div>
                <FieldLabel>DPJP</FieldLabel>
                <SelectBox className="w-full">
                  <option>dr. Andi Wijaya, Sp.PD</option>
                  <option>dr. Sari Dewi, Sp.PD</option>
                </SelectBox>
              </div>
              <div className="col-span-2">
                <FieldLabel>Indikasi Rawat Inap</FieldLabel>
                <textarea
                  rows={3}
                  defaultValue="Hipertensi tidak terkontrol, TD 158/96 mmHg meski sudah mendapat terapi rawat jalan. Diperlukan monitoring ketat dan titrasi obat antihipertensi."
                  className={`${INPUT_CLASSNAME} h-auto w-full resize-y py-[8px] leading-[1.6]`}
                />
              </div>
            </div>
          </AdmissionCard>

          <AdmissionCard title="Penempatan Kamar">
            <div className="grid gap-[12px]" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <FieldLabel>Kelas Kamar</FieldLabel>
                <div className="inline-flex rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] p-[2px]">
                  {['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="h-[28px] rounded-[calc(var(--ds-radius-md)-2px)] border-none px-[12px] text-[12px] font-semibold text-[var(--ds-color-text-muted)]"
                      style={
                        label === 'Kelas 1'
                          ? {
                              background: 'var(--ds-color-surface)',
                              color: 'var(--ds-color-text)',
                              boxShadow: 'var(--ds-shadow-xs)'
                            }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Bangsal & Bed</FieldLabel>
                <div className="flex gap-[8px]">
                  <SelectBox className="min-w-0 flex-1">
                    <option>Melati (4 kosong)</option>
                    <option>Anggrek (5 kosong)</option>
                  </SelectBox>
                  <SelectBox className="w-[100px]">
                    <option>308B</option>
                    <option>312A</option>
                    <option>312B</option>
                  </SelectBox>
                </div>
              </div>
              <div className="col-span-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] px-[12px] py-[10px] text-[11.5px]">
                <b className="text-[var(--ds-color-success)]">Bed dipilih: Melati 308B</b>
                <span className="ml-[8px] text-[var(--ds-color-text-muted)]">
                  Lantai 3 · Kelas 1 · Status: Kosong & siap
                </span>
              </div>
            </div>
          </AdmissionCard>
        </div>
      </div>
    </div>
  )
}
