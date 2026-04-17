import {
  DashboardOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useOkRequestEncounterLookup, useOkRequestList } from '@renderer/hooks/query/use-ok-request'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import OkRoomOperationChart from '@renderer/components/organisms/OK/charts/ok-room-operation-chart'
import OkStatusDistributionChart from '@renderer/components/organisms/OK/charts/ok-status-distribution-chart'
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Empty,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  theme
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'

const REFRESH_INTERVAL_MS = 15_000

const OK_STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'Menunggu Verifikasi', color: 'orange' },
  verified: { label: 'Menunggu Operasi', color: 'gold' },
  in_progress: { label: 'Berjalan', color: 'blue' },
  done: { label: 'Selesai', color: 'green' },
  rejected: { label: 'Ditolak', color: 'red' },
  cancelled: { label: 'Dibatalkan', color: 'red' }
}

const ROOM_STATUS_META: Record<string, { label: string; color: string }> = {
  available: { label: 'Tersedia', color: 'green' },
  in_use: { label: 'Dipakai', color: 'blue' },
  cleaning: { label: 'Pembersihan', color: 'orange' },
  maintenance: { label: 'Maintenance', color: 'red' },
  inactive: { label: 'Nonaktif', color: 'default' }
}

const STATUS_CHART_ORDER = ['draft', 'verified', 'in_progress', 'done', 'rejected', 'cancelled']

type OkRequestListApiResponse = Awaited<
  ReturnType<NonNullable<Window['api']['query']['okRequest']['list']>>
>
type OkRequestListItem = NonNullable<OkRequestListApiResponse['result']>[number]

type OperatingRoomListApiResponse = Awaited<
  ReturnType<NonNullable<Window['api']['query']['operatingRoom']['list']>>
>
type OperatingRoomItem = NonNullable<OperatingRoomListApiResponse['result']>[number]

type ScheduleTableRow = {
  key: number
  jam: string
  ruangOk: string
  pasien: string
  dokter: string
  status: string
  cancellationNote: string
  scheduledAtValue: number
}

const formatTimeRange = (
  scheduledAt?: string | Date | null,
  durationMinutes?: number | null
): string => {
  if (!scheduledAt) return '-'

  const start = dayjs(scheduledAt)
  if (!start.isValid()) return '-'

  if (durationMinutes && durationMinutes > 0) {
    const end = start.add(durationMinutes, 'minute')
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }

  return start.format('HH:mm')
}

const normalizeRoomLabel = (room?: OperatingRoomItem): string => {
  const roomName = String(room?.nama || '').trim()
  const roomClass = String(room?.kelas || '').trim()

  if (!roomName) return '-'
  return roomClass ? `${roomName} (${roomClass})` : roomName
}

const isSameDay = (value: string | Date | null | undefined, target: Dayjs): boolean => {
  if (!value) return false
  const parsed = dayjs(value)
  return parsed.isValid() && parsed.isSame(target, 'day')
}

const isPositiveId = (value: unknown): value is number => {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized > 0
}

const OKDashboardPage = () => {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const monitorRef = useRef<HTMLDivElement | null>(null)

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [selectedOperatingRoomId, setSelectedOperatingRoomId] = useState<number | undefined>(
    undefined
  )
  const [isFullscreen, setIsFullscreen] = useState(false)

  const okRequestQuery = useOkRequestList()
  const operatingRoomQuery = useOperatingRoomList()
  const doctorQuery = usePerformers(['doctor'])

  const refetchOkRequest = okRequestQuery.refetch
  const refetchOperatingRooms = operatingRoomQuery.refetch
  const refetchDoctors = doctorQuery.refetch

  useEffect(() => {
    const timerId = window.setInterval(() => {
      void refetchOkRequest()
      void refetchOperatingRooms()
      void refetchDoctors()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [refetchDoctors, refetchOkRequest, refetchOperatingRooms])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  const okRequests = useMemo<OkRequestListItem[]>(() => {
    return Array.isArray(okRequestQuery.data) ? okRequestQuery.data : []
  }, [okRequestQuery.data])

  const operatingRooms = useMemo<OperatingRoomItem[]>(() => {
    return Array.isArray(operatingRoomQuery.data) ? operatingRoomQuery.data : []
  }, [operatingRoomQuery.data])

  const doctors = useMemo(() => {
    return Array.isArray(doctorQuery.data) ? doctorQuery.data : []
  }, [doctorQuery.data])

  const operatingRoomMap = useMemo(() => {
    const map = new Map<number, string>()

    operatingRooms.forEach((room) => {
      const roomId = Number(room?.id)
      if (!Number.isFinite(roomId) || roomId <= 0) return

      const label = normalizeRoomLabel(room)
      map.set(roomId, label || `Ruang #${roomId}`)
    })

    return map
  }, [operatingRooms])

  const doctorMap = useMemo(() => {
    const map = new Map<number, string>()
    doctors.forEach((doctor) => {
      const id = Number(doctor.id)
      if (!Number.isFinite(id) || id <= 0) return
      map.set(id, doctor.name)
    })
    return map
  }, [doctors])

  const scheduledRequests = useMemo(() => {
    return okRequests.filter((item) => {
      if (!item.scheduledAt) return false
      return dayjs(item.scheduledAt).isValid()
    })
  }, [okRequests])

  const today = dayjs()
  const todayScheduledRequests = useMemo(
    () => scheduledRequests.filter((item) => isSameDay(item.scheduledAt, today)),
    [scheduledRequests, today]
  )

  const dateFilteredRequests = useMemo(
    () => scheduledRequests.filter((item) => isSameDay(item.scheduledAt, selectedDate)),
    [scheduledRequests, selectedDate]
  )

  const filteredRequests = useMemo(() => {
    return dateFilteredRequests.filter((item) => {
      if (!selectedOperatingRoomId) return true
      return Number(item.operatingRoomId) === selectedOperatingRoomId
    })
  }, [dateFilteredRequests, selectedOperatingRoomId])

  const encounterIds = useMemo(() => {
    return Array.from(
      new Set(
        filteredRequests
          .map((item) => String(item.encounterId || '').trim())
          .filter((encounterId) => encounterId.length > 0)
      )
    ).sort()
  }, [filteredRequests])

  const encounterLookupQuery = useOkRequestEncounterLookup(encounterIds, REFRESH_INTERVAL_MS)

  const tableRows = useMemo<ScheduleTableRow[]>(() => {
    const encounterMap = encounterLookupQuery.data?.byEncounterId ?? {}

    return filteredRequests
      .map((item) => {
        const roomId = Number(item.operatingRoomId)
        const scheduledAt = dayjs(item.scheduledAt)

        return {
          key: item.id,
          jam: formatTimeRange(item.scheduledAt, item.estimatedDurationMinutes),
          ruangOk:
            isPositiveId(roomId) && operatingRoomMap.has(roomId)
              ? (operatingRoomMap.get(roomId) as string)
              : '-',
          pasien: encounterMap[String(item.encounterId || '').trim()]?.pasien || '-',
          dokter: item.dpjpId ? doctorMap.get(Number(item.dpjpId)) || `ID ${item.dpjpId}` : '-',
          status: String(item.status || '').toLowerCase(),
          cancellationNote:
            String(item.status || '').toLowerCase() === 'cancelled'
              ? String(item.notes || '').trim()
              : '',
          scheduledAtValue: scheduledAt.isValid() ? scheduledAt.valueOf() : 0
        }
      })
      .sort((left, right) => left.scheduledAtValue - right.scheduledAtValue)
  }, [doctorMap, encounterLookupQuery.data?.byEncounterId, filteredRequests, operatingRoomMap])

  const operasiHariIniCount = todayScheduledRequests.length
  const operasiBerjalanCount = todayScheduledRequests.filter(
    (item) => String(item.status || '').toLowerCase() === 'in_progress'
  ).length
  const menungguOperasiCount = todayScheduledRequests.filter((item) => {
    const status = String(item.status || '').toLowerCase()
    return status === 'draft' || status === 'verified'
  }).length
  const operasiSelesaiCount = todayScheduledRequests.filter(
    (item) => String(item.status || '').toLowerCase() === 'done'
  ).length

  const roomOptions = useMemo(() => {
    return operatingRooms
      .map((room) => {
        const id = Number(room.id)
        if (!Number.isFinite(id) || id <= 0) return null

        return {
          value: id,
          label: normalizeRoomLabel(room) || `Ruang #${id}`
        }
      })
      .filter((option): option is { value: number; label: string } => option !== null)
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [operatingRooms])

  const statusBarData = useMemo(() => {
    const grouped = filteredRequests.reduce<Record<string, number>>((acc, item) => {
      const status = String(item.status || '').toLowerCase() || 'unknown'
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([status, total]) => ({
        statusKey: status,
        status: OK_STATUS_META[status]?.label || status,
        total
      }))
      .sort((left, right) => {
        const leftIndex = STATUS_CHART_ORDER.indexOf(left.statusKey)
        const rightIndex = STATUS_CHART_ORDER.indexOf(right.statusKey)

        if (leftIndex === -1 && rightIndex === -1) return left.status.localeCompare(right.status)
        if (leftIndex === -1) return 1
        if (rightIndex === -1) return -1
        return leftIndex - rightIndex
      })
  }, [filteredRequests])

  const roomBarData = useMemo(() => {
    const counter = new Map<string, number>()

    operatingRooms.forEach((room) => {
      counter.set(normalizeRoomLabel(room), 0)
    })

    filteredRequests.forEach((item) => {
      const roomId = Number(item.operatingRoomId)
      const roomLabel =
        isPositiveId(roomId) && operatingRoomMap.has(roomId)
          ? (operatingRoomMap.get(roomId) as string)
          : 'Belum ditentukan'

      counter.set(roomLabel, (counter.get(roomLabel) ?? 0) + 1)
    })

    return Array.from(counter.entries())
      .map(([room, total]) => ({ room, total }))
      .filter((item) => item.total > 0)
      .sort((left, right) => right.total - left.total)
  }, [filteredRequests, operatingRoomMap, operatingRooms])

  const dashboardCardStyle = useMemo(
    () => ({
      background: token.colorBgContainer,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG
    }),
    [token]
  )

  const dashboardCardBodyStyle = useMemo(
    () => ({
      padding: token.padding,
      background: token.colorBgContainer
    }),
    [token]
  )

  const tableColumns: ColumnsType<ScheduleTableRow> = [
    {
      title: 'Jam',
      dataIndex: 'jam',
      key: 'jam',
      width: 150
    },
    {
      title: 'Ruang OK',
      dataIndex: 'ruangOk',
      key: 'ruangOk',
      width: 210
    },
    {
      title: 'Pasien',
      dataIndex: 'pasien',
      key: 'pasien'
    },
    {
      title: 'Dokter',
      dataIndex: 'dokter',
      key: 'dokter',
      width: 220
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (value: string, record: ScheduleTableRow) => {
        const meta = OK_STATUS_META[value] || { label: value || '-', color: 'default' }
        return (
          <div className="space-y-1">
            <Tag color={meta.color} bordered={false} className="rounded-md font-medium text-[11px]">
              {meta.label}
            </Tag>
            {value === 'cancelled' && (
              <Typography.Text
                type="secondary"
                className="block text-[11px] leading-tight"
                title={record.cancellationNote || 'Tidak ada catatan pembatalan'}
              >
                Catatan: {record.cancellationNote || '-'}
              </Typography.Text>
            )}
          </div>
        )
      }
    }
  ]

  const dashboardErrorMessage = [okRequestQuery.error, operatingRoomQuery.error]
    .filter(Boolean)
    .map((error) => (error instanceof Error ? error.message : String(error)))
    .join(' ')

  const encounterWarning = encounterLookupQuery.data?.failedIds?.length
    ? `${encounterLookupQuery.data.failedIds.length} data pasien belum termuat sempurna.`
    : ''

  const isLoading = okRequestQuery.isLoading || operatingRoomQuery.isLoading || doctorQuery.isLoading
  const isRefreshing =
    okRequestQuery.isFetching || operatingRoomQuery.isFetching || doctorQuery.isFetching

  const latestUpdateAt = Math.max(
    okRequestQuery.dataUpdatedAt || 0,
    operatingRoomQuery.dataUpdatedAt || 0,
    doctorQuery.dataUpdatedAt || 0,
    encounterLookupQuery.dataUpdatedAt || 0
  )

  const handleManualRefresh = async () => {
    await Promise.allSettled([
      okRequestQuery.refetch(),
      operatingRoomQuery.refetch(),
      doctorQuery.refetch(),
      encounterLookupQuery.refetch()
    ])
    message.success('Data dashboard OK diperbarui')
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await monitorRef.current?.requestFullscreen()
        return
      }
      await document.exitFullscreen()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Gagal mengubah mode fullscreen')
    }
  }

  return (
    <div
      ref={monitorRef}
      className="h-full overflow-y-auto p-4 flex flex-col gap-4"
      style={{
        background: `linear-gradient(180deg, ${token.colorPrimaryBg} 0%, ${token.colorBgLayout} 24%, ${token.colorBgLayout} 100%)`
      }}
    >
      <Card
        variant="borderless"
        style={{
          ...dashboardCardStyle,
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
          borderColor: 'transparent'
        }}
        styles={{
          body: {
            padding: token.paddingLG,
            borderRadius: token.borderRadiusLG
          }
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <DashboardOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <Typography.Text
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.72)' }}
                >
                  Monitor Ruang Operasi
                </Typography.Text>
                <Typography.Title level={4} className="!mb-0" style={{ color: '#fff' }}>
                  Dashboard Monitor OK
                </Typography.Title>
              </div>
            </div>
            <Space size={8} wrap className="ml-12">
              <Typography.Text className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Auto-refresh setiap 15 detik
              </Typography.Text>
              <Typography.Text className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Last update: {latestUpdateAt ? dayjs(latestUpdateAt).format('DD/MM/YYYY HH:mm:ss') : '-'}
              </Typography.Text>
            </Space>
          </div>

          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={isRefreshing}
              onClick={handleManualRefresh}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Refresh
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </Space>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <Card variant="borderless" style={dashboardCardStyle} styles={{ body: dashboardCardBodyStyle }}>
          <Statistic
            title="Total Ruang OK"
            value={operatingRooms.length}
            loading={isLoading}
            valueStyle={{ color: token.colorTextHeading }}
          />
        </Card>
        <Card variant="borderless" style={dashboardCardStyle} styles={{ body: dashboardCardBodyStyle }}>
          <Statistic
            title="Operasi Hari Ini (Terjadwal)"
            value={operasiHariIniCount}
            loading={isLoading}
            valueStyle={{ color: token.colorTextHeading }}
          />
        </Card>
        <Card variant="borderless" style={dashboardCardStyle} styles={{ body: dashboardCardBodyStyle }}>
          <Statistic
            title="Operasi Berjalan"
            value={operasiBerjalanCount}
            loading={isLoading}
            valueStyle={{ color: token.colorInfo }}
          />
        </Card>
        <Card variant="borderless" style={dashboardCardStyle} styles={{ body: dashboardCardBodyStyle }}>
          <Statistic
            title="Menunggu Operasi"
            value={menungguOperasiCount}
            loading={isLoading}
            valueStyle={{ color: token.colorWarning }}
          />
        </Card>
        <Card variant="borderless" style={dashboardCardStyle} styles={{ body: dashboardCardBodyStyle }}>
          <Statistic
            title="Operasi Selesai"
            value={operasiSelesaiCount}
            loading={isLoading}
            valueStyle={{ color: token.colorSuccess }}
          />
        </Card>
      </div>

      <Card
        variant="borderless"
        style={dashboardCardStyle}
        styles={{ body: dashboardCardBodyStyle }}
        title="Filter Jadwal Operasi"
        extra={
          <Typography.Text type="secondary">
            Tanggal default hari ini
          </Typography.Text>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DatePicker
            className="w-full"
            value={selectedDate}
            format="DD/MM/YYYY"
            allowClear={false}
            onChange={(value) => {
              setSelectedDate(value || dayjs())
            }}
          />
          <Select
            allowClear
            placeholder="Semua ruang OK"
            options={roomOptions}
            value={selectedOperatingRoomId}
            onChange={(value) => {
              setSelectedOperatingRoomId(typeof value === 'number' ? value : undefined)
            }}
          />
        </div>
      </Card>

      {dashboardErrorMessage && (
        <Alert
          type="error"
          showIcon
          message="Gagal memuat data dashboard OK"
          description={dashboardErrorMessage}
        />
      )}

      {encounterWarning && <Alert type="warning" showIcon message={encounterWarning} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card
          className="xl:col-span-2"
          variant="borderless"
          title="Jadwal Operasi"
          style={dashboardCardStyle}
          styles={{ body: dashboardCardBodyStyle }}
        >
          <Table
            rowKey="key"
            columns={tableColumns}
            dataSource={tableRows}
            loading={isLoading || encounterLookupQuery.isLoading}
            locale={{
              emptyText: (
                <Empty
                  description="Tidak ada jadwal operasi pada filter terpilih"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            }}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} jadwal`
            }}
            scroll={{ x: 900 }}
          />
        </Card>

        <Card
          variant="borderless"
          title="Status Ruang OK"
          style={dashboardCardStyle}
          styles={{ body: dashboardCardBodyStyle }}
        >
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {operatingRooms.length > 0 ? (
              operatingRooms.map((room) => {
                const statusKey = String(room.status || '').toLowerCase()
                const statusMeta = ROOM_STATUS_META[statusKey] || {
                  label: statusKey || '-',
                  color: 'default'
                }

                return (
                  <div
                    key={room.id}
                    className="rounded-lg p-3 flex items-center justify-between"
                    style={{
                      background: token.colorBgContainer,
                      border: `1px solid ${token.colorBorderSecondary}`
                    }}
                  >
                    <div>
                      <div className="font-medium" style={{ color: token.colorText }}>
                        {normalizeRoomLabel(room)}
                      </div>
                      <Typography.Text type="secondary" className="text-xs">
                        Kode: {room.kode || '-'}
                      </Typography.Text>
                    </div>
                    <Tag color={statusMeta.color} bordered={false} className="rounded-md text-[11px]">
                      {statusMeta.label}
                    </Tag>
                  </div>
                )
              })
            ) : (
              <Empty
                description="Belum ada data ruang OK"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {statusBarData.length > 0 ? (
          <OkStatusDistributionChart data={statusBarData} />
        ) : (
          <Card title="Statistik Operasi - Distribusi Status" size="small" variant="outlined">
            <Empty
              description="Tidak ada data statistik status"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}

        {roomBarData.length > 0 ? (
          <OkRoomOperationChart data={roomBarData} />
        ) : (
          <Card title="Statistik Operasi - Jumlah per Ruang" size="small" variant="outlined">
            <Empty
              description="Tidak ada data statistik ruang"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </div>
    </div>
  )
}

export default OKDashboardPage
