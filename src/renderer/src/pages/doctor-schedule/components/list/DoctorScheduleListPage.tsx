import { useMemo, useState } from 'react'
import { theme } from 'antd'
import { useNavigate } from 'react-router'
import { client, rpc } from '@renderer/utils/client'
import { DoctorScheduleDataTable, buildDoctorScheduleRangeLabel } from './DoctorScheduleDataTable'
import { DoctorScheduleFilters } from './DoctorScheduleFilters'
import { DoctorScheduleHero } from './DoctorScheduleHero'
import type { DoctorScheduleItem, DoctorScheduleListResult, DoctorScheduleRow } from './types'
import { buildDoctorScheduleListQuery } from './doctorScheduleListPage.helpers'

export default function DoctorScheduleListPage() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [searchDokter, setSearchDokter] = useState('')
  const [searchPoli, setSearchPoli] = useState('')
  const [searchJadwal, setSearchJadwal] = useState('')

  const { data, refetch, isError, isLoading } = client.query.entity.useQuery(
    buildDoctorScheduleListQuery(),
    {
      queryKey: ['doctorSchedule', 'list']
    } as any
  )

  const listResult = data as DoctorScheduleListResult | undefined

  const rows = useMemo(() => {
    const apiResult = listResult?.result || []
    const source: DoctorScheduleItem[] = Array.isArray(apiResult)
      ? apiResult.map((item) => ({
          id: item.id,
          scheduleName: item.namaJadwal?.trim() || `Jadwal #${item.id}`,
          doctorName: item.pegawai?.namaLengkap || '-',
          category: item.kategori || '-',
          poli: item.poli?.name || '-',
          effectiveRange: buildDoctorScheduleRangeLabel(item.berlakuDari, item.berlakuSampai),
          contractId: item.idKontrakKerja,
          locationId: item.idLokasiKerja,
          status: item.status,
          note: item.keterangan?.trim() || '-'
        }))
      : []

    return source
      .map((item, index) => ({ ...item, no: index + 1 }))
      .filter((row) => {
        const matchJadwal = searchJadwal
          ? [row.scheduleName, row.category]
              .join(' ')
              .toLowerCase()
              .includes(searchJadwal.toLowerCase())
          : true
        const matchDokter = searchDokter
          ? String(row.doctorName || '')
              .toLowerCase()
              .includes(searchDokter.toLowerCase())
          : true
        const matchPoli = searchPoli
          ? String(row.poli || '')
              .toLowerCase()
              .includes(searchPoli.toLowerCase())
          : true

        return matchJadwal && matchDokter && matchPoli
      })
  }, [listResult?.result, searchDokter, searchJadwal, searchPoli])

  const handleExport = async () => {
    try {
      const res = await rpc.window.exportCsvUrl({
        entity: 'jadwalpraktekdokter',
        usePagination: false
      })
      if (res?.success && res.url) {
        await rpc.window.create({
          url: res.url,
          title: 'Export CSV Jadwal Dokter',
          iframe: false
        })
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <DoctorScheduleHero
        total={rows.length}
        colorPrimary={token.colorPrimary}
        colorPrimaryActive={token.colorPrimaryActive}
        colorSuccessBg={token.colorSuccessBg}
        onRefresh={() => void refetch()}
        onExport={handleExport}
        onCreate={() => navigate('/dashboard/registration/doctor-schedule/create')}
      />

      <DoctorScheduleFilters
        searchJadwal={searchJadwal}
        searchDokter={searchDokter}
        searchPoli={searchPoli}
        onSearchJadwalChange={setSearchJadwal}
        onSearchDokterChange={setSearchDokter}
        onSearchPoliChange={setSearchPoli}
        colorTextTertiary={token.colorTextTertiary}
      />

      <DoctorScheduleDataTable rows={rows as DoctorScheduleRow[]} loading={isLoading} isError={isError} />
    </div>
  )
}
