import { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Tag,
  Button,
  Spin,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Tabs,
  message,
  Popconfirm,
  App
} from 'antd'
import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  CloudSyncOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { getPolis } from '@renderer/services/nurse.service'
import logoUrl from '@renderer/assets/logo.png'

const { RangePicker } = DatePicker
const { Option } = Select

interface FhirFailedLogDetail {
  internalResourceId: string
  status: string
  attemptCount: number
  lastAttemptAt?: string | null
  errorMessage?: string | null
}

interface ResourceLogSummary {
  success: number
  failed: number
  retry: number
  pending: number
  lastFailedLog: FhirFailedLogDetail | null
}

interface ResourceSyncCount {
  total: number
  synced: number
  needsResync: number
  logSummary: ResourceLogSummary | null
}

interface SatuSehatSyncStatus {
  encounterSynced: boolean
  allSynced: boolean
  hasPendingResync: boolean
  encounterLog: FhirFailedLogDetail | null
  resources: {
    observation: ResourceSyncCount
    condition: ResourceSyncCount
    procedure: ResourceSyncCount
    allergyIntolerance: ResourceSyncCount
    composition: ResourceSyncCount
  }
}

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

const resourceLabel: Record<string, string> = {
  observation: 'Observasi',
  condition: 'Diagnosis',
  procedure: 'Prosedur',
  allergyIntolerance: 'Alergi',
  composition: 'Catatan'
}

const getSyncSummary = (syncStatus: SatuSehatSyncStatus | null | undefined) => {
  if (!syncStatus) return { totalResources: 0, totalSynced: 0, pct: 0 }
  const res = syncStatus.resources
  const keys = Object.keys(res) as (keyof typeof res)[]
  let totalResources = 1
  let totalSynced = syncStatus.encounterSynced ? 1 : 0
  for (const k of keys) {
    if (res[k].total > 0) {
      totalResources += res[k].total
      totalSynced += res[k].synced
    }
  }
  const pct = totalResources === 0 ? 0 : Math.round((totalSynced / totalResources) * 100)
  return { totalResources, totalSynced, pct }
}

const SyncPopoverContent = ({ s }: { s: SatuSehatSyncStatus }) => {
  const resources = s?.resources || {
    observation: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    condition: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    procedure: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    allergyIntolerance: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    composition: { total: 0, synced: 0, needsResync: 0, logSummary: null }
  }

  return (
    <div className="text-sm mt-3">
      <div className="flex items-center justify-between p-3 mb-4 bg-gray-50 border border-white/10 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              s?.encounterSynced
                ? 'bg-green-500'
                : s?.encounterLog?.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
            }`}
          />
          <span className="font-semibold text-gray-700">Data Kunjungan Dasar</span>
        </div>
        <Tag
          color={
            s?.encounterSynced
              ? 'success'
              : s?.encounterLog?.status === 'failed'
                ? 'error'
                : 'default'
          }
          bordered={false}
          className="m-0 font-medium"
        >
          {s?.encounterSynced
            ? 'Terkirim'
            : s?.encounterLog?.status === 'failed'
              ? 'Gagal'
              : 'Belum Dikirim'}
        </Tag>
      </div>
      {s?.encounterLog?.errorMessage && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Error Kunjungan</div>
          <div className="text-xs text-red-600 font-mono wrap-break-word">
            {s.encounterLog.errorMessage}
          </div>
          {s.encounterLog.lastAttemptAt && (
            <div className="text-[10px] text-red-400 mt-1">
              Percobaan ke-{s.encounterLog.attemptCount} ·{' '}
              {new Date(s.encounterLog.lastAttemptAt).toLocaleString('id-ID')}
            </div>
          )}
        </div>
      )}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
        Rincian Resource Klinis
      </div>
      <div className="grid gap-2">
        {(Object.keys(resourceLabel) as (keyof typeof resourceLabel)[]).map((k) => {
          const r = (resources as any)[k] as ResourceSyncCount | undefined
          if (!r) return null

          const isAllSynced = r.total > 0 && r.synced === r.total
          const hasFailed = (r.logSummary?.failed ?? 0) > 0 || (r.logSummary?.retry ?? 0) > 0
          const isPartial = r.synced > 0 && r.synced < r.total
          const hasResync = (r.needsResync ?? 0) > 0

          let bgColor = 'bg-gray-50'
          let textColor = 'text-gray-500'
          let statusBadge = (
            <span className="text-gray-400 border border-white/10 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm">
              Tidak Ada (0/0)
            </span>
          )

          if (isAllSynced && hasResync) {
            bgColor = 'bg-orange-50 border-orange-100'
            textColor = 'text-orange-700'
            statusBadge = (
              <span className="text-orange-700 bg-white border border-orange-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                Perlu Resync ({r.needsResync})
              </span>
            )
          } else if (isAllSynced) {
            bgColor = 'bg-green-50 border-green-100'
            textColor = 'text-green-700'
            statusBadge = (
              <span className="text-green-700 bg-white border border-green-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                Lengkap ({r.synced}/{r.total})
              </span>
            )
          } else if (hasFailed) {
            bgColor = 'bg-red-50 border-red-100'
            textColor = 'text-red-700'
            const failedCount = (r.logSummary?.failed ?? 0) + (r.logSummary?.retry ?? 0)
            statusBadge = (
              <span className="text-red-700 bg-white border border-red-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                {r.synced}/{r.total} · {failedCount} Gagal
              </span>
            )
          } else if (isPartial) {
            bgColor = 'bg-amber-50 border-amber-100'
            textColor = 'text-amber-700'
            statusBadge = (
              <span className="text-amber-700 bg-white border border-amber-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                Proses ({r.synced}/{r.total})
              </span>
            )
          } else if (r.total > 0 && r.synced === 0) {
            bgColor = 'bg-red-50 border-red-100'
            textColor = 'text-red-700'
            statusBadge = (
              <span className="text-red-700 bg-white border border-red-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm">
                Belum ({r.synced}/{r.total})
              </span>
            )
          }

          const errorDetail = r.logSummary?.lastFailedLog

          return (
            <div
              key={k}
              className={`border border-white/20 rounded-lg transition-colors ${bgColor}`}
            >
              <div className={`flex justify-between items-center p-2.5 ${bgColor}`}>
                <span className={`font-medium ${textColor}`}>{resourceLabel[k]}</span>
                {statusBadge}
              </div>
              {errorDetail?.errorMessage && (
                <div className="px-3 pb-2.5 pt-1">
                  <div className="text-[10px] text-red-400 font-mono wrap-break-word bg-red-50 border border-red-100 rounded px-2 py-1">
                    {errorDetail.errorMessage}
                  </div>
                  {errorDetail.lastAttemptAt && (
                    <div className="text-[9px] text-red-400 mt-0.5">
                      Percobaan ke-{errorDetail.attemptCount} ·{' '}
                      {new Date(errorDetail.lastAttemptAt).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PatientList = () => {
  const navigate = useNavigate()
  const { modal: appModal } = App.useApp()
  const [polis, setPolis] = useState<any[]>([])
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
      if (selectedPoli) {
        const selectedPoliData = polis.find((p) => p.id === selectedPoli || p.name === selectedPoli)
        if (selectedPoliData) params.serviceType = selectedPoliData.name
      }
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

  const loadPolis = async () => {
    try {
      setPolis(await getPolis())
    } catch (e) {
      console.error('Error loading polis:', e)
    }
  }
  useEffect(() => {
    loadPolis()
  }, [])

  const handleViewRecord = (record: PatientListTableData) =>
    navigate(`/dashboard/doctor/${record.encounterId}`)

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
    switch (status) {
      case 'PLANNED':
        return <Tag color="blue">Menunggu</Tag>
      case 'IN_PROGRESS':
        return <Tag color="orange">Sedang Diperiksa</Tag>
      case 'FINISHED':
        return <Tag color="success">Selesai</Tag>
      case 'CANCELLED':
        return <Tag color="error">Dibatalkan</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const totalSynced = patients.filter(
    (p) => p.satuSehatSyncStatus?.encounterSynced || !!p.fhirId
  ).length
  const totalNotSynced = patients.length - totalSynced

  const columns: ColumnsType<PatientListTableData> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center',
      render: (num: number) => <span className="text-sm font-semibold text-gray-400">{num}</span>
    },
    {
      title: 'SatuSehat',
      dataIndex: 'fhirId',
      key: 'satuSehatStatus',
      width: 100,
      align: 'center',
      render: (_: string, record) => {
        const s = record.satuSehatSyncStatus
        const isSynced = s?.encounterSynced || !!record.fhirId

        if (!isSynced) {
          return (
            <Tag color="default" style={{ fontSize: 11 }}>
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

        let tagContent
        if (hasPendingResync) {
          tagContent = (
            <Tag
              color="orange"
              style={{ fontSize: 11 }}
              className="cursor-pointer hover:opacity-80 transition-opacity m-0"
              title="Ada data yang diubah setelah sync — perlu dikirim ulang ke SatuSehat"
            >
              Perlu Resync
            </Tag>
          )
        } else if (hasPartial) {
          tagContent = (
            <Tag
              color="warning"
              style={{ fontSize: 11 }}
              className="cursor-pointer hover:opacity-80 transition-opacity m-0"
            >
              Terkirim*
            </Tag>
          )
        } else {
          tagContent = (
            <Tag
              color="success"
              style={{ fontSize: 11 }}
              className="cursor-pointer hover:opacity-80 transition-opacity m-0"
            >
              Terkirim
            </Tag>
          )
        }

        return (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenSyncDetail(s ?? null, record.fhirId)
            }}
            className="inline-block"
            style={{ pointerEvents: 'auto' }}
          >
            {tagContent}
          </div>
        )
      }
    },
    {
      title: 'No. Rekam Medis',
      dataIndex: ['patient', 'medicalRecordNumber'],
      key: 'medicalRecordNumber',
      width: 140,
      render: (mrn: string) => <span className="font-mono text-xs text-gray-500">{mrn || '-'}</span>
    },
    {
      title: 'Nama Pasien',
      dataIndex: ['patient', 'name'],
      key: 'patientName',
      width: 210,
      render: (name: string, record) => (
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-gray-400">
            {record.patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'} · {record.patient.age}{' '}
            tahun
          </div>
        </div>
      )
    },
    {
      title: 'Poli',
      dataIndex: ['poli', 'name'],
      key: 'poli',
      width: 140,
      render: (text: string) => {
        if (!text) return '-'
        if (text === 'RAWAT_INAP') return 'Rawat Inap'
        if (text === 'RAWAT_JALAN') return 'Rawat Jalan'
        if (text === 'IGD') return 'IGD'
        return text
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
      }
    },
    {
      title: 'Jenis',
      dataIndex: 'encounterType',
      key: 'encounterType',
      width: 110,
      render: (type: string) => {
        let label = type || '-',
          color = 'default'
        switch (type) {
          case 'EMER':
            label = 'IGD'
            color = 'red'
            break
          case 'AMB':
            label = 'Rawat Jalan'
            color = 'blue'
            break
          case 'IMP':
            label = 'Rawat Inap'
            color = 'green'
            break
        }
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const isSyncing = syncingRows[record.encounterId]
        const s = record.satuSehatSyncStatus
        const isSynced = s?.encounterSynced || !!record.fhirId
        const hasPendingResync = s?.hasPendingResync ?? false

        let syncLabel = 'Sync SatuSehat'
        let syncStyle: React.CSSProperties = {
          background: '#16a34a',
          borderColor: '#16a34a',
          color: '#fff'
        }

        const isFullyCompleted = s
          ? !Object.values(s.resources).some(
              (r) => r.total > 0 && (r.synced < r.total || (r.logSummary?.failed ?? 0) > 0)
            )
          : !!record.fhirId

        if (isSynced && hasPendingResync) {
          syncLabel = 'Kirim Pembaruan'
          syncStyle = { borderColor: '#16a34a', color: '#16a34a' }
        } else if (isSynced && isFullyCompleted) {
          syncLabel = 'Sync Ulang'
          syncStyle = { borderColor: '#22c55e', color: '#22c55e' }
        } else if (isSynced && !isFullyCompleted) {
          syncLabel = 'Lengkapi Sync'
          syncStyle = { borderColor: '#15803d', color: '#15803d' }
        }

        return (
          <Space
            direction="vertical"
            size={4}
            className="w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecord(record)}
              size="small"
              block
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
                    className="w-[14px] h-[14px] object-contain relative -top-0.5 inline-block mr-1.5"
                  />
                )
              }
              onClick={(e) => {
                e.stopPropagation()
                doSync(record)
              }}
              size="small"
              loading={isSyncing}
              block
              style={syncStyle}
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

  const statusTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'PLANNED', label: 'Menunggu' },
    { key: 'IN_PROGRESS', label: 'Sedang Diperiksa' },
    { key: 'FINISHED', label: 'Selesai' },
    { key: 'CANCELLED', label: 'Dibatalkan' }
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-0">Daftar Antrian & Kunjungan Pasien</h1>
              <p className="text-sm text-gray-400 m-0">
                Manajemen pelayanan pasien Rawat Jalan, Inap, dan IGD
              </p>
            </div>
            <Space size="middle" align="center">
              <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
                Refresh
              </Button>
              <Popconfirm
                title="Sinkronisasi Semua Encounter"
                description="Apakah Anda yakin ingin menyinkronkan semua data kunjungan ke antrean SatuSehat?"
                onConfirm={handleBulkSyncSatusehat}
                okText="Ya, Sinkronisasi"
                cancelText="Batal"
              >
                <Button
                  type="primary"
                  icon={<CloudSyncOutlined />}
                  loading={isBulkSyncing}
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                >
                  Sync Semua ke SatuSehat{totalNotSynced > 0 ? ` (${totalNotSynced})` : ''}
                </Button>
              </Popconfirm>
            </Space>
          </div>

          {/* <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <CheckCircleFilled style={{ color: '#22c55e', fontSize: 15 }} />
              <div>
                <div className="text-[11px] text-gray-500 leading-none">Terkirim ke SatuSehat</div>
                <div className="text-xl font-bold text-green-600 leading-tight">{totalSynced}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <CloseCircleFilled style={{ color: '#9ca3af', fontSize: 15 }} />
              <div>
                <div className="text-[11px] text-gray-500 leading-none">Belum Dikirim</div>
                <div className="text-xl font-bold text-gray-500 leading-tight">
                  {totalNotSynced}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div>
                <div className="text-[11px] text-gray-500 leading-none">Total Kunjungan</div>
                <div className="text-xl font-bold text-gray-700 leading-tight">
                  {patients.length}
                </div>
              </div>
            </div>
          </div> */}

          <Row gutter={[16, 12]} align="bottom">
            <Col xs={24} md={8}>
              <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">
                Cari Pasien
              </div>
              <Input
                placeholder="Nama Pasien / No. Rekam Medis"
                prefix={<SearchOutlined className="text-gray-400" />}
                size="large"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">
                Unit Pelayanan
              </div>
              <Select
                placeholder="-- Semua Unit Pelayanan --"
                className="w-full"
                size="large"
                allowClear
                value={selectedPoli}
                onChange={setSelectedPoli}
              >
                {polis.map((p) => (
                  <Option key={p.id} value={p.name}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-tight">
                Periode Kunjungan
              </div>
              <RangePicker
                className="w-full"
                size="large"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                format="DD MMM YYYY"
              />
            </Col>
          </Row>

          <Tabs
            activeKey={activeStatus}
            onChange={setActiveStatus}
            items={statusTabs}
            type="card"
            className="mb-[-17px]"
          />
        </div>
      </Card>

      <Card bodyStyle={{ padding: '0' }} className="flex-1 overflow-hidden flex flex-col">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patients}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} kunjungan`,
              showSizeChanger: true
            }}
            scroll={{ x: 1050, y: 'calc(100vh - 420px)' }}
            className="flex-1"
          />
        </Spin>
      </Card>
    </div>
  )
}

export default PatientList
