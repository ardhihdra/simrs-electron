import { App, Button, Card, Typography } from 'antd'
import { useState } from 'react'
import { useLocation } from 'react-router'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import { getNextStepAfterAntrianType } from '../kioska-global-flow'
import type { AntrianType } from '../kioska-global-types'
import { resolveInitialKioskaRegistrationPaymentMethodFromPath } from '../kioska-queue-submission'

const antrianTypeData: { label: string; value: AntrianType; description: string }[] = [
  {
    label: 'Rawat Jalan',
    value: 'rawat_jalan',
    description: 'Ambil nomor antrian untuk kunjungan poliklinik.'
  },
  {
    label: 'Rawat Inap',
    value: 'rawat_inap',
    description: 'Ambil nomor antrian untuk layanan rawat inap.'
  },
  {
    label: 'Pemeriksaan Penunjang',
    value: 'penunjang',
    description: 'Pilih laboratory atau radiology untuk mengambil nomor antrian.'
  },
  {
    label: 'Billing',
    value: 'billing',
    description: 'Ambil nomor antrian untuk layanan billing.'
  },
  {
    label: 'Kasir',
    value: 'cashier',
    description: 'Ambil nomor antrian untuk layanan kasir.'
  },
  {
    label: 'Farmasi',
    value: 'pharmacy',
    description: 'Ambil nomor antrian untuk layanan farmasi.'
  },
  {
    label: 'Check-in',
    value: 'checkin',
    description: 'Masukkan kode antrian untuk mengaktifkan kunjungan.'
  }
]

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
    <div className="flex h-full flex-col gap-8">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Pilih Layanan
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Sentuh salah satu layanan untuk melanjutkan proses antrian.
        </Typography.Text>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-4">
        {antrianTypeData.map((item) => (
          <Card
            key={item.value}
            hoverable
            className="!h-full !rounded-[28px] !border-slate-200"
            styles={{ body: { height: '100%', padding: 0 } }}
          >
            <Button
              type="primary"
              className="!h-full !w-full !rounded-[24px] !border-0 !px-6 !py-8"
              disabled={loadingType !== null && loadingType !== item.value}
              loading={loadingType === item.value}
              onClick={() => void handleSelect(item.value)}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="text-2xl font-semibold">{item.label}</span>
                <span className="max-w-xs text-sm font-normal">{item.description}</span>
              </div>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
