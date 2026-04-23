import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

interface KasirStatsStripProps {
  siapBayarCount: number
  partialCount: number
  dalamProsesCount: number
  lunasCount: number
  totalTagihan: number
  totalPaid: number
  totalRemaining: number
}

const fmt = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

export default function KasirStatsStrip({
  siapBayarCount,
  partialCount,
  dalamProsesCount,
  lunasCount,
  totalTagihan,
  totalPaid,
  totalRemaining
}: KasirStatsStripProps) {
  // We still keep shiftSummary for other potential uses, but use props for totals
  const { data: shiftSummary } = useQuery({
    queryKey: ['cashier-shift-summary'],
    queryFn: () => window.api.query.cashierShift.summary()
  })

  const summary = useMemo(() => {
    return {
      totalRevenue: totalTagihan,
      totalPaid: totalPaid,
      totalRemaining: totalRemaining
    }
  }, [totalTagihan, totalPaid, totalRemaining])

  return (
    <div className="bg-ds-surface border border-ds-border rounded-ds-lg overflow-hidden shadow-sm">
      <div className="p-3 px-4 flex items-center gap-6 flex-wrap">
        <div>
          <span className="text-[10px] text-ds-muted font-bold tracking-wider uppercase block">
            Total Tagihan
          </span>
          <b className="text-[20px] block font-mono text-ds-text">
            {fmt(summary.totalRevenue)}
          </b>
        </div>
        <div>
          <span className="text-[10px] text-green-600 font-bold tracking-wider uppercase block">
            Sudah Dibayar
          </span>
          <b className="text-[20px] block font-mono text-green-600">
            {fmt(summary.totalPaid)}
          </b>
        </div>
        <div>
          <span className="text-[10px] text-red-500 font-bold tracking-wider uppercase block">
            Belum Lunas
          </span>
          <b className="text-[20px] block font-mono text-red-500">
            {fmt(summary.totalRemaining)}
          </b>
        </div>

        <div className="w-[1px] h-10 bg-ds-border mx-1" />

        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-orange-600">
              Siap Bayar
            </span>
            <b className="text-[18px] font-mono text-orange-600">{siapBayarCount}</b>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-violet-600">
              Sebagian
            </span>
            <b className="text-[18px] font-mono text-violet-600">{partialCount}</b>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">
              Proses
            </span>
            <b className="text-[18px] font-mono text-gray-500">{dalamProsesCount}</b>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-green-600">
              Lunas
            </span>
            <b className="text-[18px] font-mono text-green-600">{lunasCount}</b>
          </div>
        </div>

        <div className="ml-auto flex gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-[11px] font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            Sistem Online
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            Kasir Aktif
          </div>
        </div>
      </div>
    </div>
  )
}
