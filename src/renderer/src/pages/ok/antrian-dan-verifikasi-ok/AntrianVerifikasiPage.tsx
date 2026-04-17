import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Alert, Badge, Button, Card, theme } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TeamOutlined
} from '@ant-design/icons'
import {
  VerifikasiOKTable,
  VerifikasiOkRow,
  VerifikasiOkSifat,
  VerifikasiOkStatus
} from '../../../components/organisms/OK/VerifikasiOKTable'
import { useOkRequestList } from '@renderer/hooks/query/use-ok-request'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import { getKelasTarifLabel, normalizeKelasTarifValue } from '@renderer/utils/tarif-kelas'

type OkRequestListApiResponse = Awaited<
  ReturnType<NonNullable<Window['api']['query']['okRequest']['list']>>
>
type OkRequestListItem = NonNullable<OkRequestListApiResponse['result']>[number]

type EncounterReadApiResponse = Awaited<
  ReturnType<NonNullable<Window['api']['query']['encounter']['read']>>
>
type EncounterReadResult = NonNullable<EncounterReadApiResponse['result']>

interface EncounterEnrichmentItem {
  namaPasien: string
  noRM: string
  kelas: string
}

interface EncounterEnrichmentData {
  byEncounterId: Record<string, EncounterEnrichmentItem>
  failedIds: string[]
}

const mapPriorityToSifat = (priority?: OkRequestListItem['priority']): VerifikasiOkSifat => {
  switch (priority) {
    case 'emergency':
      return 'cyto'
    case 'urgent':
      return 'segera'
    default:
      return 'efektif'
  }
}

const mapStatusToQueueStatus = (status?: OkRequestListItem['status']): VerifikasiOkStatus => {
  switch (status) {
    case 'verified':
      return 'disetujui'
    case 'done':
      return 'selesai'
    case 'rejected':
      return 'ditolak'
    case 'cancelled':
      return 'dibatalkan'
    case 'in_progress':
      return 'diproses'
    default:
      return 'menunggu'
  }
}

const formatDate = (dateValue?: string | Date | null): string => {
  if (!dateValue) return '-'
  const parsed = dayjs(dateValue)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '-'
}

const formatTimeRange = (
  dateValue?: string | Date | null,
  durationMinutes?: number | null
): string => {
  if (!dateValue) return '-'
  const start = dayjs(dateValue)
  if (!start.isValid()) return '-'

  if (durationMinutes && durationMinutes > 0) {
    const end = start.add(durationMinutes, 'minute')
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }

  return start.format('HH:mm')
}

const buildNomorAntrian = (item: OkRequestListItem): string => {
  if (item.kode && item.kode.trim().length > 0) return item.kode
  return `OK-${String(item.id).padStart(6, '0')}`
}

const normalizeKelas = (kelas: unknown): string => normalizeKelasTarifValue(kelas)

const mapPaymentMethodToTarifKelas = (paymentMethod: unknown): string => {
  const normalized = String(paymentMethod || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'cash':
    case 'bpjs':
    case 'asuransi':
    case 'company':
    case 'general':
    case 'umum':
      return 'UMUM'
    default:
      return normalizeKelas(paymentMethod) || 'UMUM'
  }
}

const getKelasLabel = getKelasTarifLabel

const AntrianVerifikasiPage = () => {
  const { token } = theme.useToken()
  const { data, isLoading, isFetching, error, refetch } = useOkRequestList()
  const { data: performers } = usePerformers(['doctor'])
  const {
    data: operatingRooms,
    isError: isOperatingRoomError,
    error: operatingRoomError
  } = useOperatingRoomList()

  const source = useMemo<OkRequestListItem[]>(() => {
    return Array.isArray(data) ? data : []
  }, [data])

  const encounterIds = useMemo(() => {
    return Array.from(
      new Set(
        source
          .map((item) => String(item.encounterId || '').trim())
          .filter((id) => id.length > 0)
      )
    ).sort()
  }, [source])

  const performerMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(performers || []).forEach((item) => {
      if (typeof item.id === 'number') map.set(item.id, item.name)
    })
    return map
  }, [performers])

  const operatingRoomMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(operatingRooms || []).forEach((room) => {
      const roomId = Number(room?.id)
      if (!Number.isFinite(roomId) || roomId <= 0) return
      const roomName = String(room?.nama || '').trim()
      const roomClass = String(room?.kelas || '').trim()
      const label = roomName
        ? `${roomName}${roomClass ? ` (${roomClass})` : ''}`
        : `Ruang #${roomId}`
      map.set(roomId, label)
    })
    return map
  }, [operatingRooms])

  const {
    data: encounterEnrichment,
    isLoading: isEncounterEnrichmentLoading,
    isFetching: isEncounterEnrichmentFetching
  } = useQuery<EncounterEnrichmentData>({
    queryKey: ['ok-request', 'verifikasi', 'encounter-enrichment', encounterIds],
    enabled: encounterIds.length > 0,
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.read
      if (!fn) {
        throw new Error('API encounter tidak tersedia')
      }

      const settled = await Promise.allSettled(
        encounterIds.map(async (encounterId) => {
          const response = await fn({ id: encounterId })
          if (!response?.success) {
            const responseMessage = (response as { message?: unknown } | undefined)?.message
            throw new Error(
              String(response?.error || responseMessage || `Gagal memuat encounter ${encounterId}`)
            )
          }
          return { encounterId, result: response.result || null }
        })
      )

      const byEncounterId: Record<string, EncounterEnrichmentItem> = {}
      const failedIds: string[] = []

      settled.forEach((entry, index) => {
        const encounterId = encounterIds[index]
        if (!encounterId) return
        if (entry.status !== 'fulfilled') {
          failedIds.push(encounterId)
          return
        }

        const result = entry.value.result
        byEncounterId[encounterId] = {
          namaPasien: String(result?.patient?.name || '-').trim() || '-',
          noRM: String(result?.patient?.medicalRecordNumber || '-').trim() || '-',
          kelas: getKelasLabel(mapPaymentMethodToTarifKelas(result?.queueTicket?.paymentMethod))
        }
      })

      return {
        byEncounterId,
        failedIds
      }
    }
  })

  const rows = useMemo<VerifikasiOkRow[]>(() => {
    return source.map((item) => {
      const rencanaAt = item.scheduledAt || item.requestedAt
      const encounterId = String(item.encounterId || '').trim()
      const encounterMeta = encounterId ? encounterEnrichment?.byEncounterId?.[encounterId] : undefined

      return {
        id: item.id,
        nomorAntrian: buildNomorAntrian(item),
        namaPasien: encounterMeta?.namaPasien || '-',
        noRM: encounterMeta?.noRM || '-',
        kelas: encounterMeta?.kelas || '-',
        sifat: mapPriorityToSifat(item.priority),
        tanggalRencana: formatDate(rencanaAt),
        jamRencana: formatTimeRange(rencanaAt, item.estimatedDurationMinutes),
        dpjp: item.dpjpId ? performerMap.get(item.dpjpId) || `ID ${item.dpjpId}` : '-',
        ruangOK: item.operatingRoomId
          ? operatingRoomMap.get(Number(item.operatingRoomId)) || `Ruang #${item.operatingRoomId}`
          : '-',
        status: mapStatusToQueueStatus(item.status)
      }
    })
  }, [encounterEnrichment?.byEncounterId, operatingRoomMap, performerMap, source])

  const errorMessage =
    error instanceof Error ? error.message : error ? 'Gagal memuat data verifikasi OK' : null

  const warningMessage = useMemo(() => {
    const messages: string[] = []

    const failedEncounterCount = encounterEnrichment?.failedIds?.length || 0
    if (failedEncounterCount > 0) {
      messages.push(
        `${failedEncounterCount} data kunjungan gagal dimuat, sebagian kolom pasien/kelas ditampilkan '-' sementara.`
      )
    }

    if (isOperatingRoomError) {
      const roomErrorText =
        operatingRoomError instanceof Error
          ? operatingRoomError.message
          : 'Daftar ruang OK gagal dimuat'
      messages.push(`${roomErrorText}. Nama ruang mungkin belum lengkap.`)
    }

    return messages.length > 0 ? messages.join(' ') : null
  }, [encounterEnrichment?.failedIds?.length, isOperatingRoomError, operatingRoomError])

  const totalRows = rows.length
  const menungguCount = rows.filter((item) => item.status === 'menunggu').length
  const disetujuiCount = rows.filter((item) => item.status === 'disetujui').length
  const isTableLoading =
    isLoading || isFetching || isEncounterEnrichmentLoading || isEncounterEnrichmentFetching

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Antrian Verifikasi OK
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Daftar pengajuan operasi yang menunggu proses verifikasi dan persetujuan.
              </p>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                void refetch()
              }}
              loading={isLoading || isFetching}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalRows}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Pengajuan
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorWarning}33` }}
              >
                <ClockCircleOutlined style={{ color: token.colorWarningBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {menungguCount}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Menunggu Verifikasi
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <CheckCircleOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {disetujuiCount}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Disetujui
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: 13, color: token.colorTextSecondary, fontWeight: 600 }}>
            Daftar Antrian
          </span>
          <Badge
            count={totalRows}
            color={token.colorPrimary}
            size="small"
            style={{ fontSize: 10 }}
          />
        </div>

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            className="mb-3"
            message={errorMessage}
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  void refetch()
                }}
              >
                Muat Ulang
              </Button>
            }
          />
        )}

        {warningMessage && (
          <Alert type="warning" showIcon className="mb-3" message={warningMessage} />
        )}

        <VerifikasiOKTable rows={rows} loading={isTableLoading} />
      </Card>
    </div>
  )
}

export default AntrianVerifikasiPage
