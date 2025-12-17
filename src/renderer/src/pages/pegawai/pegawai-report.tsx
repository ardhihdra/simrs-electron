import { Button } from 'antd'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { KepegawaianAttributes } from '@shared/kepegawaian'

function toCsv(rows: KepegawaianAttributes[]): string {
  const headers = [
    'id',
    'namaLengkap',
    'nik',
    'tanggalLahir',
    'jenisKelamin',
    'email',
    'nomorTelepon',
    'hakAkses',
    'kodeHakAkses',
    'hakAksesId'
  ]
  const escape = (val: unknown): string => {
    const s = val === null || val === undefined ? '' : String(val)
    const needQuote = /[",\n]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needQuote ? `"${escaped}"` : escaped
  }
  const headerLine = headers.join(',')
  const lines = rows.map((r) => [
    escape(r.id),
    escape(r.namaLengkap),
    escape(r.nik),
    escape(r.tanggalLahir instanceof Date ? r.tanggalLahir.toISOString() : r.tanggalLahir),
    escape(r.jenisKelamin),
    escape(r.email),
    escape(r.nomorTelepon),
    escape(r.hakAkses),
    escape(r.kodeHakAkses),
    escape(r.hakAksesId)
  ].join(','))
  return [headerLine, ...lines].join('\n')
}

function PegawaiReport() {
  const { data, refetch } = useQuery({
    queryKey: ['pegawai', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.pegawai?.list
      if (!fn) throw new Error('API pegawai tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const rows: KepegawaianAttributes[] = useMemo(() => {
    return ((data?.data as KepegawaianAttributes[]) || []).map((r) => ({ ...r }))
  }, [data?.data])

  const onExport = () => {
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'laporan-petugas-medis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Lap Data Petugas Medis</h2>
        <div className="flex gap-2">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={onExport}>Export CSV</Button>
        </div>
      </div>
      <div className="text-sm text-gray-600">Total baris: {rows.length}</div>
    </div>
  )
}

export default PegawaiReport
