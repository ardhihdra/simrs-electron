import { App, Button, Card, Typography } from 'antd'
import { useState } from 'react'

import { fetchKioskaRegistrationLocation } from '../../public-client'
import { useKioskaGlobalFlow } from '../kioska-global-context'
import type { AntrianType } from '../kioska-global-types'

const antrianTypeData: { label: string; value: AntrianType; description: string }[] = [
  {
    label: 'Rawat Jalan',
    value: 'rawat_jalan',
    description: 'Ambil nomor antrian untuk kunjungan poliklinik.'
  },
  {
    label: 'Rawat Inap',
    value: 'rawat_inap',
    description: 'Belum tersedia pada kioska global.'
  },
  {
    label: 'Pemeriksaan Penunjang',
    value: 'penunjang',
    description: 'Belum tersedia pada kioska global.'
  },
  {
    label: 'Check-in',
    value: 'checkin',
    description: 'Masukkan kode antrian untuk mengaktifkan kunjungan.'
  }
]

export function StepSelectAntrianType() {
  const { message } = App.useApp()
  const { goTo, selectAntrianType, setRawatJalanLocation } = useKioskaGlobalFlow()
  const [loadingType, setLoadingType] = useState<AntrianType | null>(null)

  const handleSelect = async (type: AntrianType) => {
    if (type === 'rawat_jalan') {
      try {
        setLoadingType(type)
        const location = await fetchKioskaRegistrationLocation()

        selectAntrianType(type)
        setRawatJalanLocation(location)
        goTo('has_mrn')
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : 'Lokasi kerja pendaftaran belum tersedia untuk kioska.'
        )
      } finally {
        setLoadingType(null)
      }
      return
    }

    if (type === 'checkin') {
      selectAntrianType(type)
      goTo('input_kode_antrian')
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

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
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
