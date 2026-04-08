import { useMemo, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  Table,
  Button,
  Tag,
  Select,
  Space,
  Card,
  App,
  Spin,
  Input,
  DatePicker,
  Row,
  Col,
  Badge,
  theme
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  MedicineBoxOutlined,
  SoundOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { PatientQueue, Gender } from '../../types/nurse.types'

const { Option } = Select

interface PatientQueueTableData extends Omit<PatientQueue, 'status'> {
  no: number
  key: string
  status: string
  queueId: string
  formattedQueueNumber?: string
  triageUpdatedAt?: string
  encounterType?: string
}

type QueueRow = {
  queueId?: string
  id?: string
  queueNumber?: number | string
  formattedQueueNumber?: string
  queueDate?: string
  createdAt?: string
  updatedAt?: string
  patientId?: string
  patientName?: string
  patientBirthDate?: string | Date
  patientMedicalRecordNumber?: string
  doctorName?: string
  poliCodeId?: number | string
  poliName?: string
  status?: string
  encounterId?: string
}

type ScopedPoli = {
  id: string
  name: string
  code: string
  lokasiKerjaId?: number
}

const NURSE_VISIBLE_STATUSES = ['TRIAGE'] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  all: { label: 'Semua', color: '', dotColor: '#6b7280' },
  TRIAGE: { label: 'Pemeriksaan Awal', color: 'gold', dotColor: '#f59e0b' }
}

const normalizePoliCode = (value: string | number) => String(value).trim().toLowerCase()
const decodePoliCode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const parseQueueNumber = (value?: number | string) => {
  const parsed = Number.parseInt(String(value ?? '0'), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseTimestamp = (value?: string) => {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : 0
}

const PatientQueueTable = () => {
  const { message, modal } = App.useApp()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { poliCode: rawPoliCode } = useParams<{ poliCode?: string }>()
  const { session } = useModuleScopeStore()
  const isAdministrator = session?.hakAksesId === 'administrator'
  const routePoliCode = rawPoliCode ? normalizePoliCode(decodePoliCode(rawPoliCode)) : undefined
  const isPoliLockedFromRoute = Boolean(routePoliCode)

  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)
  const [queueDate, setQueueDate] = useState<dayjs.Dayjs>(dayjs())
  const [activeStatus, setActiveStatus] = useState<string>('all')

  const { data: poliData, isLoading: isPoliLoading } = client.visitManagement.poli.useQuery({})
  const scopedPolis = useMemo<ScopedPoli[]>(() => {
    const allPolis = poliData?.result ?? []
    return allPolis
      .map((poli) => ({
        id: String(poli.id),
        name: poli.name,
        code: String(poli.code || poli.id),
        lokasiKerjaId:
          typeof poli.location?.id === 'number'
            ? poli.location.id
            : Number.parseInt(String(poli.location?.id), 10)
      }))
      .filter((poli) => {
        if (isAdministrator) return true
        if (!session) return false
        return poli.lokasiKerjaId === session.lokasiKerjaId
      })
  }, [isAdministrator, poliData?.result, session])
  const scopedPoliIdSet = useMemo(() => new Set(scopedPolis.map((poli) => poli.id)), [scopedPolis])
  const routePoli = useMemo(() => {
    if (!routePoliCode) return undefined
    return scopedPolis.find((poli) => normalizePoliCode(poli.code) === routePoliCode)
  }, [routePoliCode, scopedPolis])

  useEffect(() => {
    if (!routePoliCode) return
    if (isPoliLoading) return

    if (!routePoli) {
      message.error('Poli tidak ditemukan atau tidak sesuai lokasi kerja.')
      navigate('/dashboard/poli', { replace: true })
      return
    }

    if (selectedPoli !== routePoli.id) {
      setSelectedPoli(routePoli.id)
    }
  }, [isPoliLoading, message, navigate, routePoli, routePoliCode, selectedPoli])

  useEffect(() => {
    if (isPoliLockedFromRoute) return
    setSelectedPoli(undefined)
  }, [isPoliLockedFromRoute])

  useEffect(() => {
    if (routePoliCode) return
    if (!selectedPoli) return
    if (!scopedPoliIdSet.has(selectedPoli)) {
      setSelectedPoli(undefined)
    }
  }, [routePoliCode, scopedPoliIdSet, selectedPoli])

  const {
    data: queueData,
    isLoading,
    refetch
  } = client.registration.getQueues.useQuery({
    queueDate: queueDate.format('YYYY-MM-DD'),
    status: [...NURSE_VISIBLE_STATUSES]
  })
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refetch()
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refetch])

  const filteredQueues = useMemo(() => {
    const rows = (queueData?.result || []) as QueueRow[]
    const search = searchText.trim().toLowerCase()

    return rows
      .filter((row) => {
        const queueStatus = String(row.status || '')
        if (
          !NURSE_VISIBLE_STATUSES.includes(queueStatus as (typeof NURSE_VISIBLE_STATUSES)[number])
        ) {
          return false
        }

        const queuePoliId = row.poliCodeId != null ? String(row.poliCodeId) : ''
        if (!queuePoliId || !scopedPoliIdSet.has(queuePoliId)) return false
        if (selectedPoli && queuePoliId !== selectedPoli) return false

        if (!search) return true
        const patientName = String(row.patientName || '').toLowerCase()
        const queueLabel = String(row.formattedQueueNumber || row.queueNumber || '').toLowerCase()
        return patientName.includes(search) || queueLabel.includes(search)
      })
      .filter((row) => (activeStatus === 'all' ? true : row.status === activeStatus))
  }, [activeStatus, queueData?.result, scopedPoliIdSet, searchText, selectedPoli])

  const patientQueue: PatientQueueTableData[] = useMemo(() => {
    const sortedRows = [...filteredQueues].sort(
      (a, b) =>
        parseTimestamp(b.updatedAt || b.createdAt || b.queueDate) -
        parseTimestamp(a.updatedAt || a.createdAt || a.queueDate)
    )

    return sortedRows.map((row, index) => {
      const queueId = String(row.queueId || row.id || '')
      const queueNumber = parseQueueNumber(row.queueNumber)
      const formattedQueueNumber =
        row.formattedQueueNumber ||
        (queueNumber > 0 ? String(queueNumber) : '-')
      const triageUpdatedAt = row.updatedAt || row.createdAt || row.queueDate || queueDate.toISOString()
      const registrationDate = row.queueDate || row.createdAt || queueDate.toISOString()

      return {
        no: index + 1,
        key: queueId || String(index),
        id: queueId || String(index),
        queueId,
        encounterId: row.encounterId,
        queueNumber,
        formattedQueueNumber,
        triageUpdatedAt,
        patient: {
          id: String(row.patientId || ''),
          name: row.patientName || 'Unknown',
          medicalRecordNumber: row.patientMedicalRecordNumber || '-',
          gender: Gender.MALE,
          birthDate: row.patientBirthDate ? String(row.patientBirthDate) : '',
          age: row.patientBirthDate ? dayjs().diff(dayjs(row.patientBirthDate), 'year') : 0,
          phone: '',
          address: '',
          identityNumber: ''
        },
        poli: {
          id: String(row.poliCodeId || ''),
          code: String(row.poliCodeId || ''),
          name: row.poliName || '-'
        },
        doctor: {
          id: '',
          name: row.doctorName || '-',
          specialization: 'General',
          sipNumber: '-'
        },
        status: String(row.status || ''),
        registrationDate,
        encounterType: 'AMB'
      }
    })
  }, [filteredQueues, queueDate])

  const latestTriageQueue = patientQueue[0]

  const handleExaminePatient = (record: PatientQueueTableData) => {
    if (!record.encounterId) {
      message.warning('Encounter belum tersedia untuk pasien ini.')
      return
    }

    window.open(`#/dashboard/nurse-calling/medical-record/${record.encounterId}`, '_blank')
  }

  const handleMoveToPoliQueue = (record: PatientQueueTableData) => {
    if (!record.queueId) {
      message.error('ID Antrian tidak ditemukan')
      return
    }

    modal.confirm({
      title: 'Selesai & Pindahkan ke Antrean Poli?',
      content:
        'Pemeriksaan awal sudah selesai? Status antrian pasien akan dipindah menjadi "Siap Diperiksa" oleh Dokter.',
      okText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await updateStatusMutation.mutateAsync({
            queueId: record.queueId,
            action: 'TRIAGE_DONE'
          })
          message.success('Status antrian berhasil diperbarui')
          refetch()
        } catch (error: any) {
          message.error(error.message || 'Gagal memproses antrian')
        }
      }
    })
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

  const totalTriage = patientQueue.filter((p) => p.status === 'TRIAGE').length
  const latestTriageQueueId = latestTriageQueue?.queueId
  const latestTriageTime = latestTriageQueue?.triageUpdatedAt
    ? dayjs(latestTriageQueue.triageUpdatedAt).format('HH:mm')
    : '-'

  const columns: ColumnsType<PatientQueueTableData> = [
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
      title: 'Antrian',
      dataIndex: 'formattedQueueNumber',
      key: 'queueNumber',
      width: 170,
      render: (queueLabel: string, record) => (
        <div className="flex items-center gap-2">
          <Tag color="blue" bordered={false} className="font-mono font-semibold m-0 w-fit">
            {queueLabel || '-'}
          </Tag>
          {record.queueId === latestTriageQueueId ? (
            <Badge color={token.colorSuccess} text={<span style={{ fontSize: 10 }}>Terbaru</span>} />
          ) : null}
        </div>
      )
    },
    {
      title: 'Pasien',
      key: 'patientInfo',
      width: 240,
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
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Jenis Kelamin',
      key: 'gender',
      width: 120,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.gender === Gender.MALE ? 'Laki-laki' : 'Perempuan'}
        </span>
      )
    },
    {
      title: 'Umur',
      key: 'age',
      width: 80,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.age} th
        </span>
      )
    },
    {
      title: 'Unit / Jenis',
      key: 'unitJenis',
      width: 180,
      render: (_, record) => (
        <div>
          <div
            style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}
            className="truncate"
          >
            {record.poli.name}
          </div>
          <Tag color="blue" bordered={false} className="mt-0.5 text-[10px] font-medium m-0">
            Rawat Jalan
          </Tag>
        </div>
      )
    },
    {
      title: 'Dokter Tujuan',
      key: 'doctor',
      width: 150,
      render: (_, record) => (
        <div
          style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}
          className="truncate"
          title={record.doctor.name}
        >
          {record.doctor.name}
        </div>
      )
    },
    {
      title: 'Tgl Antrian',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 140,
      render: (date: string) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {date ? dayjs(date).format('DD MMM YYYY') : '-'}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 280,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          {record.status === 'TRIAGE' && (
            <>
              <Button
                type="primary"
                icon={<MedicineBoxOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleExaminePatient(record)
                }}
                size="small"
                disabled={updateStatusMutation.isPending}
                style={{ background: '#f97316', borderColor: '#f97316' }}
              >
                Periksa
              </Button>
              <Button
                type="primary"
                icon={<SoundOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveToPoliQueue(record)
                }}
                size="small"
                loading={updateStatusMutation.isPending}
                disabled={updateStatusMutation.isPending}
              >
                Pindahkan ke Poli
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const statusTabItems = Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
    const count =
      key === 'all' ? patientQueue.length : patientQueue.filter((p) => p.status === key).length

    return {
      key,
      label: cfg.label,
      dotColor: cfg.dotColor,
      count
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
                  <UserAddOutlined
                    className="text-white text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Antrian Pemeriksaan Awal
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Menampilkan pasien yang sudah dipanggil ke pemeriksaan awal (triase)
              </p>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  {patientQueue.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Antrian
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
                style={{ background: `${token.colorInfo}33` }}
              >
                <ClockCircleOutlined style={{ color: token.colorInfoBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalTriage}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Pemeriksaan Awal
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
                <MedicineBoxOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Antrian TRIAGE Terbaru
                </div>
                {latestTriageQueue ? (
                  <>
                    <div
                      className="truncate"
                      style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}
                      title={`${latestTriageQueue.formattedQueueNumber || '-'} • ${latestTriageQueue.patient.name} • ${latestTriageQueue.poli.name} • ${latestTriageTime}`}
                    >
                      {latestTriageQueue.formattedQueueNumber || '-'} • {latestTriageQueue.patient.name}
                    </div>
                    <div
                      className="truncate"
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}
                    >
                      {latestTriageQueue.poli.name} • {latestTriageTime}
                    </div>
                  </>
                ) : (
                  <div
                    className="truncate"
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', lineHeight: 1.2 }}
                  >
                    Belum ada antrian TRIAGE
                  </div>
                )}
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
              placeholder="Nama Pasien / Nomor Antrian"
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
            <Select
              placeholder={isPoliLockedFromRoute ? '-- Unit Terkunci --' : '-- Semua Unit --'}
              className="w-full"
              allowClear={!isPoliLockedFromRoute}
              disabled={isPoliLockedFromRoute}
              value={selectedPoli}
              onChange={setSelectedPoli}
            >
              {scopedPolis.map((poli) => (
                <Option key={poli.id} value={poli.id}>
                  {poli.name}
                </Option>
              ))}
            </Select>
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
              Tanggal Antrian
            </div>
            <DatePicker
              className="w-full"
              value={queueDate}
              onChange={(value) => setQueueDate(value || dayjs())}
              format="DD MMM YYYY"
              allowClear={false}
            />
          </Col>
        </Row>

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
                {tab.count > 0 && (
                  <Badge
                    count={tab.count}
                    color={isActive ? '#fff' : tab.dotColor}
                    size="small"
                    style={{ fontSize: 10, color: isActive ? tab.dotColor : '#fff', marginLeft: 4 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading || isPoliLoading}>
          <Table
            columns={columns}
            dataSource={patientQueue}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pasien`,
              showSizeChanger: true
            }}
            scroll={{ x: 1250, y: 'calc(100vh - 460px)' }}
            className="flex-1"
            size="middle"
          />
        </Spin>
      </Card>
    </div>
  )
}

export default PatientQueueTable
