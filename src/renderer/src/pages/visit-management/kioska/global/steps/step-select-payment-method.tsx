import { App, Button, Card, Typography } from 'antd'
import { useState } from 'react'

import {
  fetchKioskaRegistrationLocation,
  type KioskaRegistrationPaymentMethod
} from '../../public-client'
import { useKioskaGlobalFlow } from '../kioska-global-context'
import { resolveKioskaRegistrationServiceTypeFromPaymentMethod } from '../kioska-queue-submission'

const paymentMethodOptions: {
  value: KioskaRegistrationPaymentMethod
  label: string
  description: string
}[] = [
  {
    value: 'CASH',
    label: 'CASH',
    description: 'Untuk pasien umum atau pembayaran tunai.'
  },
  {
    value: 'ASURANSI',
    label: 'ASURANSI',
    description: 'Untuk pasien dengan penjaminan asuransi.'
  }
]

export function StepSelectPaymentMethod() {
  const { message } = App.useApp()
  const { goTo, setPaymentMethod, setRawatJalanLocation, state } = useKioskaGlobalFlow()
  const [loadingPaymentMethod, setLoadingPaymentMethod] =
    useState<KioskaRegistrationPaymentMethod | null>(null)

  const handleSelect = async (paymentMethod: KioskaRegistrationPaymentMethod) => {
    try {
      setLoadingPaymentMethod(paymentMethod)
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
      setLoadingPaymentMethod(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Pilih Metode Pembayaran
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Pilih CASH atau ASURANSI sebelum melanjutkan ke proses pendaftaran kioska.
        </Typography.Text>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {paymentMethodOptions.map((item) => {
          const isSelected = state.rawatJalan.paymentMethod === item.value

          return (
            <Card
              key={item.value}
              hoverable
              className={`!h-full !rounded-[28px] ${isSelected ? '!border-blue-500 !shadow-lg' : '!border-slate-200'}`}
              styles={{ body: { height: '100%', padding: 0 } }}
            >
              <Button
                type={isSelected ? 'primary' : 'default'}
                className="!h-full !w-full !rounded-[24px] !px-6 !py-8"
                disabled={loadingPaymentMethod !== null && loadingPaymentMethod !== item.value}
                loading={loadingPaymentMethod === item.value}
                onClick={() => void handleSelect(item.value)}
              >
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="text-2xl font-semibold">{item.label}</span>
                  <span className="max-w-xs text-sm font-normal">{item.description}</span>
                </div>
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
