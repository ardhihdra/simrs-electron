import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Card } from 'antd'
import {
  VerifikasiOKTable,
  VerifikasiOkRow,
  VerifikasiOkSifat,
  VerifikasiOkStatus
} from '../../../components/organisms/OK/VerifikasiOKTable'
import { useOkRequestList } from '@renderer/hooks/query/use-ok-request'

interface BackendOkRequest {
  id: number
  kode?: string | null
  encounterId?: string | null
  sourceUnit?: string | null
  surgeonId?: number | null
  operatingRoomId?: number | null
  requestedAt?: string | null
  scheduledAt?: string | null
  estimatedDurationMinutes?: number | null
  priority?: string | null
  status?: string | null
  mainDiagnosis?: string | null
  plannedProcedureSummary?: string | null
}

const mapPriorityToSifat = (priority?: string | null): VerifikasiOkSifat => {
  switch (priority) {
    case 'emergency':
      return 'cyto'
    case 'urgent':
      return 'segera'
    default:
      return 'efektif'
  }
}

const mapStatusToQueueStatus = (status?: string | null): VerifikasiOkStatus => {
  switch (status) {
    case 'verified':
    case 'done':
      return 'disetujui'
    case 'rejected':
    case 'cancelled':
      return 'ditolak'
    case 'in_progress':
      return 'diproses'
    default:
      return 'menunggu'
  }
}

const formatDate = (dateValue?: string | null): string => {
  if (!dateValue) return '-'
  const parsed = dayjs(dateValue)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '-'
}

const formatTimeRange = (dateValue?: string | null, durationMinutes?: number | null): string => {
  if (!dateValue) return '-'
  const start = dayjs(dateValue)
  if (!start.isValid()) return '-'

  if (durationMinutes && durationMinutes > 0) {
    const end = start.add(durationMinutes, 'minute')
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }

  return start.format('HH:mm')
}

const buildNomorAntrian = (item: BackendOkRequest): string => {
  if (item.kode && item.kode.trim().length > 0) return item.kode
  return `OK-${String(item.id).padStart(6, '0')}`
}

const AntrianVerifikasiPage = () => {
  const { data, isLoading, isFetching, error, refetch } = useOkRequestList()

  const rows = useMemo<VerifikasiOkRow[]>(() => {
    const source = Array.isArray(data) ? (data as BackendOkRequest[]) : []

    return source.map((item) => {
      const rencanaAt = item.scheduledAt || item.requestedAt
      const tindakan = item.plannedProcedureSummary || item.mainDiagnosis || '-'

      return {
        id: item.id,
        nomorAntrian: buildNomorAntrian(item),
        namaPasien: '-',
        noRM: item.encounterId ? `Encounter: ${item.encounterId}` : '-',
        tindakan,
        spesialis: item.sourceUnit ? `Unit ${item.sourceUnit.toUpperCase()}` : '-',
        kelas: '-',
        sifat: mapPriorityToSifat(item.priority),
        tanggalRencana: formatDate(rencanaAt),
        jamRencana: formatTimeRange(rencanaAt, item.estimatedDurationMinutes),
        dokterOperator: item.surgeonId ? `ID ${item.surgeonId}` : '-',
        ruangOK: item.operatingRoomId ? `Ruang #${item.operatingRoomId}` : '-',
        status: mapStatusToQueueStatus(item.status)
      }
    })
  }, [data])

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Gagal memuat data verifikasi OK' : null

  return (
    <div className="p-2">
      <Card className="shadow-none border-gray-100">
        <VerifikasiOKTable
          rows={rows}
          loading={isLoading || isFetching}
          errorMessage={errorMessage}
          onRetry={() => {
            void refetch()
          }}
        />
      </Card>
    </div>
  )
}

export default AntrianVerifikasiPage
