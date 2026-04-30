import { App, Spin } from 'antd'
import { useState } from 'react'

import {
  fetchKioskaRegistrationLocation,
  type KioskaRegistrationPaymentMethod
} from '../../public-client'
import { useKioskaGlobalFlow } from '../kioska-global-context'
import { resolveKioskaRegistrationServiceTypeFromPaymentMethod } from '../kioska-queue-submission'

type CardOption = {
  id: string
  value: KioskaRegistrationPaymentMethod
  label: string
  description: string
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}

const cardOptions: CardOption[] = [
  {
    id: 'umum',
    value: 'CASH',
    label: 'Umum',
    description: 'Biaya ditanggung sendiri tanpa asuransi',
    iconBg: 'var(--ds-color-surface-muted)',
    iconColor: 'var(--ds-color-text-muted)',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
  {
    id: 'bpjs',
    value: 'ASURANSI',
    label: 'BPJS Kesehatan',
    description: 'Jaminan Kesehatan Nasional — siapkan kartu BPJS',
    iconBg: 'oklch(0.95 0.04 155)',
    iconColor: 'var(--ds-color-success)',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    )
  },
  {
    id: 'asuransi',
    value: 'ASURANSI',
    label: 'Asuransi Swasta',
    description: 'Asuransi Inhealth, Allianz, AXA, dan lainnya',
    iconBg: 'oklch(0.95 0.04 300)',
    iconColor: 'oklch(0.55 0.14 300)',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    )
  }
]

export function StepSelectPaymentMethod() {
  const { message } = App.useApp()
  const { goTo, setPaymentMethod, setPublicQueuePaymentMethod, setRawatJalanLocation, state } =
    useKioskaGlobalFlow()
  const [loadingCard, setLoadingCard] = useState<string | null>(null)

  const handleSelect = async (cardId: string, paymentMethod: KioskaRegistrationPaymentMethod) => {
    if (state.antrianType === 'rawat_inap' || state.antrianType === 'penunjang') {
      setPublicQueuePaymentMethod(paymentMethod)
      goTo('non_medic_kiosk')
      return
    }

    try {
      setLoadingCard(cardId)
      const serviceTypeCode = resolveKioskaRegistrationServiceTypeFromPaymentMethod(paymentMethod)
      const workLocation = await fetchKioskaRegistrationLocation({
        serviceTypeCode,
        lokasiKerjaCode: 'RJ'
      })

      setPaymentMethod(paymentMethod)
      setRawatJalanLocation(workLocation)
      goTo('has_mrn')
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : 'Lokasi kerja pendaftaran belum tersedia untuk metode pembayaran ini.'
      )
    } finally {
      setLoadingCard(null)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-10 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: 'var(--ds-color-text)'
            }}
          >
            Penjamin pasien
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ds-color-text-muted)'
            }}
          >
            Pilih jenis penjamin untuk kunjungan hari ini
          </div>
        </div>

        <div className="flex w-full justify-center gap-4">
          {cardOptions.map((card) => {
            const isSelected =
              card.id === 'umum'
                ? state.rawatJalan.paymentMethod === 'CASH'
                : state.rawatJalan.paymentMethod === 'ASURANSI' && loadingCard === card.id
            const isLoading = loadingCard === card.id
            const isDisabled = loadingCard !== null && loadingCard !== card.id

            return (
              <button
                key={card.id}
                disabled={isDisabled || isLoading}
                onClick={() => void handleSelect(card.id, card.value)}
                style={{
                  flex: 1,
                  maxWidth: 240,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  padding: '28px 20px',
                  borderRadius: 12,
                  border: `2px solid var(--ds-color-border)`,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.1s, box-shadow 0.1s, border-color 0.15s',
                  opacity: isDisabled ? 0.5 : 1,
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 1px 2px rgba(15,23,42,0.08), 0 1px 1px rgba(15,23,42,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}
                onMouseDown={(e) => {
                  if (!isDisabled) e.currentTarget.style.transform = 'scale(0.97)'
                }}
                onMouseUp={(e) => {
                  if (!isDisabled) e.currentTarget.style.transform = ''
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    background: card.iconBg,
                    color: card.iconColor,
                    flexShrink: 0
                  }}
                >
                  {isLoading ? (
                    <Spin size="small" />
                  ) : (
                    <div style={{ width: 30, height: 30 }}>{card.icon}</div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--ds-color-text)'
                  }}
                >
                  {card.label}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ds-color-text-subtle)',
                    lineHeight: 1.4
                  }}
                >
                  {card.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
