import { Visibility } from '@renderer/components/atoms/Visibility'
import { Alert, App, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { fetchKioskaPolis } from '../public-client'
import type { KioskaPoliOption } from '../shared'

type Props = {
  onSelect: (poli: KioskaPoliOption) => void
}

function QuotaBadge({ remainingQuota }: { remainingQuota?: number | null }) {
  if (remainingQuota === undefined || remainingQuota === null) {
    return (
      <span className="mt-auto rounded-full bg-slate-100 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-slate-500">
        Kuota belum dapat diketahui
      </span>
    )
  }
  if (remainingQuota === 0) {
    return (
      <span className="mt-auto rounded-full bg-red-100 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-red-600">
        Kuota penuh
      </span>
    )
  }
  if (remainingQuota <= 3) {
    return (
      <span className="mt-auto rounded-full bg-amber-100 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-amber-700">
        Sisa {remainingQuota} kuota
      </span>
    )
  }
  return (
    <span className="mt-auto rounded-full bg-green-100 px-[7px] py-0.5 font-mono text-[10px] font-semibold text-green-700">
      Sisa {remainingQuota} kuota
    </span>
  )
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
        console.log('cek result', result)
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
          <div className="grid max-h-full grid-cols-4 gap-2.5 overflow-y-auto pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb]:bg-[#c1cce0] [&::-webkit-scrollbar]:w-1">
            {polis.map((poli) => (
              <button
                key={poli.id}
                type="button"
                onClick={() => onSelect(poli)}
                className="flex min-h-[90px] cursor-pointer flex-col items-start gap-2 rounded-md border border-[#d7deec] bg-white p-4 text-left transition-colors duration-100 hover:border-[#c1cce0] hover:bg-[#f4f6fb] active:border-[#4f6ef7] active:bg-[#e8edff]"
              >
                <span className="text-[12.5px] font-bold leading-tight text-[#172033]">
                  {poli.name}
                </span>
                {poli.description && (
                  <span className="text-[11px] leading-snug text-[#4e5d7a]">
                    {poli.description}
                  </span>
                )}
                <QuotaBadge remainingQuota={poli.remainingQuota} />
              </button>
            ))}
          </div>
        )}
      </Visibility>
    </div>
  )
}
