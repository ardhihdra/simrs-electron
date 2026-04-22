import { App, Button, Card, Typography } from 'antd'
import { useState } from 'react'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import type { KioskaNonMedicQueueTarget } from '../kioska-global-types'

const penunjangTypeData: Array<{
  label: string
  value: KioskaNonMedicQueueTarget
  description: string
}> = [
  {
    label: 'Laboratory',
    value: 'laboratory',
    description: 'Ambil nomor antrian untuk layanan laboratorium.'
  },
  {
    label: 'Radiology',
    value: 'radiology',
    description: 'Ambil nomor antrian untuk layanan radiologi.'
  }
]

export function StepSelectPenunjangType() {
  const { message } = App.useApp()
  const { goTo, setPublicQueueTarget } = useKioskaGlobalFlow()
  const [loadingType, setLoadingType] = useState<KioskaNonMedicQueueTarget | null>(null)

  const handleSelect = async (target: KioskaNonMedicQueueTarget) => {
    try {
      setLoadingType(target)
      setPublicQueueTarget(target)
      goTo('payment_method')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Gagal memilih layanan penunjang.')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="flex h-full flex-col gap-8">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Pilih Pemeriksaan Penunjang
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Pilih layanan penunjang untuk melanjutkan ke pengambilan nomor antrian.
        </Typography.Text>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {penunjangTypeData.map((item) => (
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
