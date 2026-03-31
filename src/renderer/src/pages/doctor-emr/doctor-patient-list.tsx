import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  DownloadOutlined,
  ExceptionOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  TeamOutlined
} from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import { SelectPoli } from '@renderer/components/molecules/SelectPoli'
import { SatuSehatSyncStatus } from '@renderer/types/satu-sehat'
import { getSyncSummary } from '@renderer/utils/satu-sehat'
import { useQuery } from '@tanstack/react-query'
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  theme
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { SyncPopoverContent } from './components/sync-popover-content'

const { RangePicker } = DatePicker

interface PatientListTableData {
  key: string
  id: string
  encounterId: string
  fhirId: string
  queueNumber: number
  patient: {
    id: string
    name: string
    medicalRecordNumber: string
    gender: 'male' | 'female'
    age: number
    birthDate: string
    nik?: string
  }
  queueTicket?: {
    id: string
    queueNumber: number
    queueDate: string
    status: string
    poli?: { id: number; name: string; location: string }
    practitioner?: { id: number; namaLengkap: string; nik: string }
  }
  poli: { name: string }
  status: string
  hasObservations: boolean
  encounterType?: string
  visitDate: string
  satuSehatSyncStatus?: SatuSehatSyncStatus | null
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; antColor: string; dotColor: string }
> = {
  all: { label: 'Semua', color: '', antColor: 'default', dotColor: '#6b7280' },
  PLANNED: { label: 'Menunggu', color: 'blue', antColor: 'processing', dotColor: '#3b82f6' },
  IN_PROGRESS: {
    label: 'Diperiksa',
    color: 'orange',
    antColor: 'warning',
    dotColor: '#f97316'
  },
  FINISHED: { label: 'Selesai', color: 'green', antColor: 'success', dotColor: '#22c55e' },
  CANCELLED: { label: 'Dibatalkan', color: 'red', antColor: 'error', dotColor: '#ef4444' }
}

export const DoctorPatientList = () => {
  const { modal: appModal } = App.useApp()
  const { token } = theme.useToken()
  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [activeStatus, setActiveStatus] = useState<string>('all')
  const [isBulkSyncing, setIsBulkSyncing] = useState(false)
  const [syncingRows, setSyncingRows] = useState<Record<string, boolean>>({})

  const handleOpenSyncDetail = (status: SatuSehatSyncStatus | null, fhirId: string) => {
    if (!status && !fhirId) return

    const s: SatuSehatSyncStatus = status || {
      encounterSynced: !!fhirId,
      allSynced: true,
      hasPendingResync: false,
      encounterLog: null,
      resources: {
        observation: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        condition: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        procedure: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        allergyIntolerance: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        composition: { total: 0, synced: 0, needsResync: 0, logSummary: null }
      }
    }

    appModal.info({
      icon: null,
      title: <span className="font-bold">Detail Sinkronisasi SatuSehat</span>,
      content: <SyncPopoverContent s={s} />,
      width: 500,
      centered: true,
      okText: 'Tutup',
      maskClosable: true
    })
  }

  const {
    data: encounterData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['encounter', 'list', selectedPoli, searchText, activeStatus, dateRange],
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')
      const params: any = {}
      if (searchText) params.q = searchText
      if (activeStatus && activeStatus !== 'all') params.status = activeStatus
      if (selectedPoli) params.serviceType = selectedPoli
      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      params.sortBy = 'updatedAt'
      params.sortOrder = 'DESC'
      return fn(params)
    }
  })

  const patients: PatientListTableData[] = (encounterData?.result || []).map(
    (enc: any, index: number) => {
      const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
      const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

      let parsedSyncStatus = null
      if (enc.satuSehatSyncStatus) {
        let val = enc.satuSehatSyncStatus
        try {
          while (typeof val === 'string') {
            val = JSON.parse(val)
          }
          parsedSyncStatus = val
        } catch (e) {
          console.error('Failed to parse satuSehatSyncStatus on row', enc.id, e)
        }
      }

      return {
        no: index + 1,
        key: enc.id,
        id: enc.id,
        encounterId: enc.id,
        fhirId: enc.fhirId,
        queueNumber: enc.queueTicket?.queueNumber || 0,
        patient: {
          id: enc.patient?.id || '',
          name: enc.patient?.name || 'Unknown',
          medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
          gender: enc.patient?.gender || 'male',
          age,
          birthDate: enc.patient?.birthDate || '',
          nik: enc.patient?.nik || ''
        },
        queueTicket: enc.queueTicket
          ? {
              id: enc.queueTicket.id,
              queueNumber: enc.queueTicket.queueNumber,
              queueDate: enc.queueTicket.queueDate,
              status: enc.queueTicket.status,
              poli: enc.queueTicket.poli,
              practitioner: enc.queueTicket.practitioner
            }
          : undefined,
        poli: { name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-' },
        status: enc.status || 'unknown',
        hasObservations: true,
        visitDate: enc.startTime || enc.createdAt || new Date().toISOString(),
        encounterType: enc.encounterType,
        satuSehatSyncStatus: parsedSyncStatus
      }
    }
  )

  const handleViewRecord = (record: PatientListTableData) => {
    window.open(`#/dashboard/doctor/${record.encounterId}`, '_blank')
  }

  const handleBulkSyncSatusehat = async () => {
    try {
      setIsBulkSyncing(true)
      const fn = window.api?.query?.encounter?.bulkSyncSatusehat
      if (!fn) throw new Error('API IPC tidak tersedia')
      const result = await fn()
      if (result.success) {
        message.success(result.message || 'Proses sinkronisasi massal telah masuk antrean.')
        refetch()
      } else {
        message.error(result.error || 'Gagal memulai proses sinkronisasi massal.')
      }
    } catch (error: any) {
      message.error(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setIsBulkSyncing(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsBulkSyncing(true)
      const fn = window.api?.query?.encounter?.exportData
      if (!fn) throw new Error('API perantara tidak tersedia')

      const params: any = {}
      if (searchText) params.q = searchText
      if (activeStatus && activeStatus !== 'all') params.status = activeStatus
      if (selectedPoli) params.serviceType = selectedPoli
      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }

      message.loading({ content: 'Menyiapkan file export...', key: 'exportMsg' })
      const result = await fn(params)

      if (result.success && result.base64Data) {
        const byteString = atob(result.base64Data)
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }

        const blob = new Blob([ab], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')

        const dateStr = dateRange
          ? `${dateRange[0].format('DD_MM_YYYY')}_Sd_${dateRange[1].format('DD_MM_YYYY')}`
          : new Date().toISOString().split('T')[0]

        a.href = url
        a.download = `Data_Kunjungan_Pasien_${dateStr}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        message.success({ content: 'File berhasil diunduh.', key: 'exportMsg' })
      } else {
        message.error({ content: result.error || 'Gagal export data kunjungan.', key: 'exportMsg' })
      }
    } catch (error: any) {
      message.error({
        content: error.message || 'Terjadi kesalahan saat mengekspor',
        key: 'exportMsg'
      })
    } finally {
      setIsBulkSyncing(false)
    }
  }

  const doSync = async (record: PatientListTableData) => {
    try {
      setSyncingRows((prev) => ({ ...prev, [record.encounterId]: true }))
      const fn = window.api?.query?.encounter?.syncSatusehat
      if (!fn) throw new Error('API IPC tidak tersedia')
      const result = await fn({ id: record.encounterId })
      if (result.success) {
        message.success(`Kunjungan ${record.patient.name} telah masuk antrean sinkronisasi.`)
        refetch()
      } else {
        message.error(result.error || 'Gagal mengirim antrean sinkronisasi.')
      }
    } catch (error: any) {
      message.error(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setSyncingRows((prev) => ({ ...prev, [record.encounterId]: false }))
    }
  }

  const getStatusTag = (status: string) => {
    const cfg = STATUS_CONFIG[status]
    if (!cfg) return <Tag>{status}</Tag>
    return (
      <Tag color={cfg.color} bordered={false} className="font-medium rounded-md">
        {cfg.label}
      </Tag>
    )
  }

  const totalSynced = patients.filter(
    (p) => p.satuSehatSyncStatus?.encounterSynced || !!p.fhirId
  ).length
  const totalNotSynced = patients.length - totalSynced
  const totalInProgress = patients.filter((p) => p.status === 'IN_PROGRESS').length
  const totalFinished = patients.filter((p) => p.status === 'FINISHED').length

  const columns: ColumnsType<PatientListTableData> = [
    {
      title: '#',
      dataIndex: 'no',
      key: 'no',
      width: 44,
      align: 'center',
      render: (num: number) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>{num}</span>
      )
    },
    {
      title: 'Pasien',
      key: 'patientInfo',
      width: 230,
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token.colorPrimaryBg,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <span style={{ color: token.colorPrimary, fontSize: 12, fontWeight: 700 }}>
              {record.patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div
              style={{ fontWeight: 600, fontSize: 14, color: token.colorText }}
              className="truncate leading-tight"
            >
              {record.patient.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="font-mono rounded"
                style={{
                  fontSize: 10,
                  color: token.colorTextTertiary,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  padding: '1px 6px'
                }}
              >
                {record.patient.medicalRecordNumber || '-'}
              </span>
              <span style={{ fontSize: 10, color: token.colorTextTertiary }}>
                {record.patient.gender === 'male' ? '♂' : '♀'} {record.patient.age}th
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Unit / Jenis',
      key: 'unitJenis',
      width: 160,
      render: (_, record) => {
        const poliName = record.poli.name
        const displayPoli =
          poliName === 'RAWAT_INAP'
            ? 'Rawat Inap'
            : poliName === 'RAWAT_JALAN'
              ? 'Rawat Jalan'
              : poliName === 'IGD'
                ? 'IGD'
                : poliName
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())

        let typeLabel = record.encounterType || '-'
        let typeColor = 'default'
        switch (record.encounterType) {
          case 'EMER':
            typeLabel = 'IGD'
            typeColor = 'red'
            break
          case 'AMB':
            typeLabel = 'Rawat Jalan'
            typeColor = 'blue'
            break
          case 'IMP':
            typeLabel = 'Rawat Inap'
            typeColor = 'green'
            break
        }

        return (
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}
              className="truncate"
            >
              {displayPoli}
            </div>
            <Tag color={typeColor} bordered={false} className="mt-0.5 text-[10px] font-medium m-0">
              {typeLabel}
            </Tag>
          </div>
        )
      }
    },
    {
      title: 'Tgl Kunjungan',
      dataIndex: 'visitDate',
      key: 'visitDate',
      width: 135,
      render: (date: string) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {dayjs(date).format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'SatuSehat',
      dataIndex: 'fhirId',
      key: 'satuSehatStatus',
      width: 110,
      align: 'center',
      render: (_: string, record) => {
        const s = record.satuSehatSyncStatus
        const isSynced = s?.encounterSynced || !!record.fhirId

        if (!isSynced) {
          return (
            <Tag
              color="default"
              bordered={false}
              className="text-[10px] font-medium cursor-default"
            >
              Belum Sync
            </Tag>
          )
        }

        const hasPendingResync = s?.hasPendingResync ?? false
        const hasPartial =
          s &&
          !s.allSynced &&
          Object.values(s.resources).some(
            (r) =>
              r.total > 0 &&
              (r.synced < r.total ||
                (r.logSummary?.failed ?? 0) > 0 ||
                (r.logSummary?.retry ?? 0) > 0)
          )

        let tagColor = 'success'
        let tagText = 'Terkirim'
        if (hasPendingResync) {
          tagColor = 'orange'
          tagText = 'Perlu Resync'
        } else if (hasPartial) {
          tagColor = 'warning'
          tagText = 'Terkirim*'
        }

        return (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenSyncDetail(s ?? null, record.fhirId)
            }}
            className="inline-block cursor-pointer"
          >
            <Tag
              color={tagColor}
              bordered={false}
              className="text-[10px] font-medium hover:opacity-80 transition-opacity m-0"
            >
              {tagText}
            </Tag>
          </div>
        )
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const isSyncing = syncingRows[record.encounterId]
        const s = record.satuSehatSyncStatus
        const isSynced = s?.encounterSynced || !!record.fhirId
        const hasPendingResync = s?.hasPendingResync ?? false

        let syncLabel = 'Sync'
        let syncStyle: React.CSSProperties = {
          background: token.colorSuccess,
          borderColor: token.colorSuccess,
          color: '#fff'
        }

        const isFullyCompleted = s
          ? !Object.values(s.resources).some(
              (r) => r.total > 0 && (r.synced < r.total || (r.logSummary?.failed ?? 0) > 0)
            )
          : !!record.fhirId

        if (isSynced && hasPendingResync) {
          syncLabel = 'Kirim Pembaruan'
          syncStyle = { borderColor: token.colorSuccess, color: token.colorSuccess }
        } else if (isSynced && isFullyCompleted) {
          syncLabel = 'Sync Ulang'
          syncStyle = { borderColor: token.colorSuccessActive, color: token.colorSuccessActive }
        } else if (isSynced && !isFullyCompleted) {
          syncLabel = 'Lengkapi'
          syncStyle = { borderColor: token.colorSuccessActive, color: token.colorSuccessActive }
        }

        return (
          <Space size={6} onClick={(e) => e.stopPropagation()}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecord(record)}
              size="small"
              style={{ background: '#f97316', borderColor: '#f97316' }}
            >
              Periksa
            </Button>
            <Button
              ghost={isSynced}
              icon={
                isSyncing ? (
                  <SyncOutlined spin />
                ) : (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-[13px] h-[13px] object-contain relative -top-0.5 inline-block mr-1"
                  />
                )
              }
              onClick={(e) => {
                e.stopPropagation()
                doSync(record)
              }}
              size="small"
              loading={isSyncing}
              style={syncStyle as any}
              title={
                s && isSynced
                  ? `Encounter: ✅ | ${getSyncSummary(s).totalSynced}/${getSyncSummary(s).totalResources} resource sync`
                  : 'Kirim ke SatuSehat'
              }
            >
              {syncLabel}
            </Button>
          </Space>
        )
      }
    }
  ]

  const statusTabItems = Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
    const count = key === 'all' ? patients.length : patients.filter((p) => p.status === key).length

    return {
      key,
      label: (
        <span className="flex items-center gap-2 px-1">
          {cfg.label}
          {count > 0 && (
            <Badge count={count} color={cfg.dotColor} size="small" style={{ fontSize: 10 }} />
          )}
        </span>
      )
    }
  })

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
                  Daftar Antrian &amp; Kunjungan
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen pelayanan pasien Rawat Jalan, Inap, dan IGD
              </p>
            </div>
            <Space size="small" align="center">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="border-white/30 text-white hover:border-white hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                loading={isBulkSyncing}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Export Excel
              </Button>
              <Popconfirm
                title="Sinkronisasi Semua Encounter"
                description="Apakah Anda yakin ingin menyinkronkan semua data kunjungan ke antrean SatuSehat?"
                onConfirm={handleBulkSyncSatusehat}
                okText="Ya, Sinkronisasi"
                cancelText="Batal"
              >
                <Button
                  icon={<CloudSyncOutlined />}
                  loading={isBulkSyncing}
                  style={{
                    background: token.colorSuccess,
                    borderColor: token.colorSuccessActive,
                    color: '#fff'
                  }}
                >
                  Sync Semua{totalNotSynced > 0 ? ` (${totalNotSynced})` : ''}
                </Button>
              </Popconfirm>
            </Space>
          </div>
          <div className="grid grid-cols-4 gap-3">
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
                  {patients.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Kunjungan
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
                  {totalInProgress}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Sedang Diperiksa
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
                  {totalFinished}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Selesai
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
                <ExceptionOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalSynced}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Sync SatuSehat
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <Row gutter={[16, 12]} align="bottom">
          <Col xs={24} md={8}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Cari Pasien
            </div>
            <Input
              placeholder="Nama Pasien / No. Rekam Medis"
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Unit Pelayanan
            </div>
            <SelectPoli
              valueType="name"
              placeholder="-- Semua Unit --"
              className="w-full"
              allowClear
              value={selectedPoli}
              onChange={setSelectedPoli}
            />
          </Col>
          <Col xs={24} md={8}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Periode Kunjungan
            </div>
            <RangePicker
              className="w-full"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              format="DD MMM YYYY"
            />
          </Col>
        </Row>

        {/* Status Tab Bar */}
        <div
          className="flex gap-1.5 mt-4 pt-4 flex-wrap"
          style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
        >
          {statusTabItems.map((tab) => {
            const isActive = activeStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                style={
                  isActive
                    ? {
                        background: token.colorPrimary,
                        borderColor: token.colorPrimary,
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: token.borderRadiusSM,
                        fontSize: 14,
                        fontWeight: 500,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }
                    : {
                        background: token.colorFillAlter,
                        borderColor: token.colorBorderSecondary,
                        color: token.colorTextSecondary,
                        padding: '6px 12px',
                        borderRadius: token.borderRadiusSM,
                        fontSize: 14,
                        fontWeight: 500,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }
                }
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </Card>
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patients}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} kunjungan`,
              showSizeChanger: true
            }}
            scroll={{ x: 1050, y: 'calc(100vh - 460px)' }}
            className="flex-1"
            size="middle"
          />
        </Spin>
      </Card>
    </div>
  )
}
