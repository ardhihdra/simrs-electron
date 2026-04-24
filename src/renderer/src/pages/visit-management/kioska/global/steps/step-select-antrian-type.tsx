import { App, Typography } from 'antd'
import { useState } from 'react'
import { useLocation } from 'react-router'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import { getNextStepAfterAntrianType } from '../kioska-global-flow'
import type { AntrianType } from '../kioska-global-types'
import { resolveInitialKioskaRegistrationPaymentMethodFromPath } from '../kioska-queue-submission'

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: 36,
  height: 36
}

const antrianTypeData: {
  label: string
  value: AntrianType
  description: string
  cardBg: string
  borderColor: string
  iconBg: string
  nameColor: string
  icon: React.ReactNode
}[] = [
  {
    label: 'Rawat Jalan',
    value: 'rawat_jalan',
    description: 'Poliklinik · Konsultasi dokter spesialis',
    cardBg: '#eff6ff',
    borderColor: 'oklch(0.75 0.1 250)',
    iconBg: '#3b82f6',
    nameColor: '#1d4ed8',
    icon: (
      <svg {...svgProps}>
        <path d="M4.8 2.3A.3.3 0 104.5 2h-1a.3.3 0 00-.3.3v3.9a3.5 3.5 0 007 0V2.3a.3.3 0 00-.3-.3h-1a.3.3 0 00-.3.3" />
        <path d="M7 6.2V14a6 6 0 006 6v0a6 6 0 006-6v-3.5" />
        <circle cx="19" cy="10" r="2" />
      </svg>
    )
  },
  {
    label: 'Check-in',
    value: 'checkin',
    description: 'Konfirmasi pendaftaran online Anda',
    cardBg: '#f0fdf4',
    borderColor: 'oklch(0.75 0.1 155)',
    iconBg: '#22c55e',
    nameColor: '#15803d',
    icon: (
      <svg {...svgProps}>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    )
  },
  {
    label: 'Laboratorium',
    value: 'penunjang',
    description: 'Antrian pemeriksaan lab',
    cardBg: '#f0f9ff',
    borderColor: 'oklch(0.72 0.1 260)',
    iconBg: '#0ea5e9',
    nameColor: '#0369a1',
    icon: (
      <svg {...svgProps}>
        <path d="M14.5 2v6.5L17 14H7l2.5-5.5V2" />
        <path d="M8.5 2h7" />
        <path d="M7 14a5 5 0 0010 0" />
      </svg>
    )
  },
  {
    label: 'Radiologi',
    value: 'penunjang',
    description: 'Antrian X-Ray, CT-Scan, MRI',
    cardBg: 'oklch(0.96 0.03 300)',
    borderColor: 'oklch(0.72 0.1 300)',
    iconBg: '#8b5cf6',
    nameColor: '#6d28d9',
    icon: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="10" />
        <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
        <line x1="9.69" y1="8" x2="21.17" y2="8" />
        <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
        <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
        <line x1="14.31" y1="16" x2="2.83" y2="16" />
        <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
      </svg>
    )
  },
  {
    label: 'Farmasi',
    value: 'pharmacy',
    description: 'Antrian pengambilan obat',
    cardBg: '#fffbeb',
    borderColor: 'oklch(0.8 0.1 75)',
    iconBg: '#f59e0b',
    nameColor: '#b45309',
    icon: (
      <svg {...svgProps}>
        <path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v4" />
        <circle cx="17" cy="17" r="4" />
        <path d="M17 13v8" />
      </svg>
    )
  },
  {
    label: 'Billing',
    value: 'billing',
    description: 'Antrian informasi tagihan',
    cardBg: 'oklch(0.95 0.04 165)',
    borderColor: 'oklch(0.72 0.12 165)',
    iconBg: 'oklch(0.5 0.15 165)',
    nameColor: 'oklch(0.45 0.15 165)',
    icon: (
      <svg {...svgProps}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )
  },
  {
    label: 'Kasir',
    value: 'cashier',
    description: 'Antrian pembayaran tagihan',
    cardBg: 'oklch(0.95 0.04 20)',
    borderColor: 'oklch(0.72 0.1 20)',
    iconBg: 'oklch(0.6 0.18 20)',
    nameColor: 'oklch(0.52 0.18 20)',
    icon: (
      <svg {...svgProps}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  }
]

function ServiceCard({
  item,
  loadingType,
  onSelect
}: {
  item: (typeof antrianTypeData)[number]
  loadingType: AntrianType | null
  onSelect: (value: AntrianType) => Promise<void>
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3.5 cursor-pointer text-center select-none transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
      style={{
        background: item.cardBg,
        border: `1.5px solid ${item.borderColor}`,
        borderRadius: 16,
        padding: '28px 20px',
        opacity: loadingType !== null && loadingType !== item.value ? 0.4 : 1,
        pointerEvents: loadingType !== null && loadingType !== item.value ? 'none' : undefined
      }}
      onClick={() => void onSelect(item.value)}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 68,
          height: 68,
          borderRadius: 18,
          background: item.iconBg,
          color: 'white',
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.18)'
        }}
      >
        {item.icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: item.nameColor, lineHeight: 1.2 }}>
        {item.label}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.35, marginTop: -6 }}>
        {item.description}
      </div>
    </div>
  )
}

export function StepSelectAntrianType() {
  const { message } = App.useApp()
  const {
    goTo,
    selectAntrianType,
    setPaymentMethod,
    setPublicQueuePaymentMethod,
    setPublicQueueTarget
  } = useKioskaGlobalFlow()
  const [loadingType, setLoadingType] = useState<AntrianType | null>(null)
  const location = useLocation()
  const initialPaymentMethod = resolveInitialKioskaRegistrationPaymentMethodFromPath(
    location.pathname
  )

  const handleSelect = async (type: AntrianType) => {
    if (type === 'rawat_jalan') {
      setLoadingType(type)
      selectAntrianType(type)
      setPublicQueueTarget(null)
      setPublicQueuePaymentMethod(null)
      setPaymentMethod(initialPaymentMethod)
      goTo(getNextStepAfterAntrianType(type))
      setLoadingType(null)
      return
    }

    if (type === 'rawat_inap') {
      setLoadingType(type)
      selectAntrianType(type)
      setPublicQueueTarget('rawat_inap')
      setPublicQueuePaymentMethod(null)
      goTo(getNextStepAfterAntrianType(type))
      setLoadingType(null)
      return
    }

    if (type === 'penunjang') {
      setLoadingType(type)
      selectAntrianType(type)
      setPublicQueueTarget(null)
      setPublicQueuePaymentMethod(null)
      goTo(getNextStepAfterAntrianType(type))
      setLoadingType(null)
      return
    }

    if (type === 'checkin') {
      selectAntrianType(type)
      goTo(getNextStepAfterAntrianType(type))
      return
    }

    if (type === 'billing' || type === 'cashier' || type === 'pharmacy') {
      setLoadingType(type)
      selectAntrianType(type)
      setPublicQueueTarget(type)
      setPublicQueuePaymentMethod(null)
      goTo(getNextStepAfterAntrianType(type))
      setLoadingType(null)
      return
    }

    message.info('Fitur belum tersedia')
  }

  return (
    <div className="flex h-full flex-col px-6">
      <div className="text-center">
        <Typography.Title level={3} className="!mb-1">
          Pilih layanan yang Anda butuhkan
        </Typography.Title>
        <Typography.Text className="text-base" type="secondary">
          Sentuh kartu layanan untuk mengambil nomor antrian
        </Typography.Text>
      </div>

      <div className="flex flex-col gap-3.5 flex-1 mt-6">
        <div className="grid grid-cols-4 gap-3.5 flex-1">
          {antrianTypeData.slice(0, 4).map((item, idx) => (
            <ServiceCard
              key={`row1-${idx}`}
              item={item}
              loadingType={loadingType}
              onSelect={handleSelect}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {antrianTypeData.slice(4).map((item, idx) => (
            <ServiceCard
              key={`row2-${idx}`}
              item={item}
              loadingType={loadingType}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
