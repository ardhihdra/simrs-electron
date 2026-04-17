import { MedicineBoxOutlined } from '@ant-design/icons'
import { Visibility } from '@renderer/components/atoms/Visibility'
import { Alert, App, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { fetchKioskaPolis } from '../public-client'
import type { KioskaPoliOption } from '../shared'

type Props = {
  onSelect: (poli: KioskaPoliOption) => void
}

export const KioskSelectPoli = ({ onSelect }: Props) => {
  const { message } = App.useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [polis, setPolis] = useState<KioskaPoliOption[]>([])
  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        setIsLoading(true)
        const result = await fetchKioskaPolis()
        if (cancelled) return
        setPolis(result)
      } catch (error: any) {
        if (cancelled) return
        message.error(error?.message || 'Gagal memuat daftar poli kioska')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [message])

  return (
    <div className="h-full">
      <Visibility visible={isLoading}>
        <div className="flex h-full items-center justify-center">
          <Spin size="large" />
        </div>
      </Visibility>
      <Visibility visible={!isLoading}>
        {!polis.length ? (
          <Alert type="warning" showIcon message="Daftar poli belum tersedia." />
        ) : (
          <div className="grid max-h-full grid-cols-2 gap-4 overflow-y-auto pr-1 md:grid-cols-4 xl:grid-cols-5">
            {polis.map((poli) => (
              <div key={poli.id} className="flex flex-col gap-2" onClick={() => onSelect(poli)}>
                <div className="text-base font-bold flex items-center justify-center aspect-square rounded-xl border bg-white text-center shadow border-zinc-300 hover:border-zinc-500 hover:shadow-lg transition-all duration-300 cursor-pointer active:bg-zinc-300">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MedicineBoxOutlined className="text-2xl" />
                    {poli.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Visibility>
    </div>
  )
}
