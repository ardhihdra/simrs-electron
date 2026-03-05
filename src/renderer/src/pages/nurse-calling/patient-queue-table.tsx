import { useState, useEffect } from 'react'
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
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PatientQueue, Poli, Gender } from '../../types/nurse.types'
import { getPolis } from '../../services/nurse.service'
import { EncounterStatus, EncounterType, ArrivalType } from '@shared/encounter'

const { Option } = Select
const { RangePicker } = DatePicker

interface PatientQueueTableData extends PatientQueue {
  key: string
  encounterType?: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  all: { label: 'Semua', color: '', dotColor: '#6b7280' },
  PLANNED: { label: 'Menunggu', color: 'blue', dotColor: '#3b82f6' },
  IN_PROGRESS: { label: 'Diperiksa', color: 'orange', dotColor: '#f97316' },
  FINISHED: { label: 'Selesai', color: 'green', dotColor: '#22c55e' },
  CANCELLED: { label: 'Dibatalkan', color: 'red', dotColor: '#ef4444' }
}

const PatientQueueTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [calling, setCalling] = useState<string | null>(null)
  const [polis, setPolis] = useState<Poli[]>([])

  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [activeStatus, setActiveStatus] = useState<string>('all')

  const {
    data: encounterData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['encounter', 'list', selectedPoli, searchText, activeStatus, dateRange],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')

      const params: any = {}

      if (searchText) params.q = searchText

      if (activeStatus && activeStatus !== 'all') params.status = activeStatus

      if (selectedPoli) {
        const selectedPoliData = polis.find((p) => p.id === selectedPoli)
        if (selectedPoliData) {
          params.serviceType = selectedPoliData.name
        }
      }

      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }

      params.sortBy = 'updatedAt'
      params.sortOrder = 'DESC'

      return fn(params)
    },
    enabled: polis.length > 0
  })

  const patientQueue: PatientQueueTableData[] = (encounterData?.result || []).map(
    (enc: any, index: number) => {
      const birthDate = enc.patient?.birthDate ? dayjs(enc.patient.birthDate) : null
      const age = birthDate ? dayjs().diff(birthDate, 'year') : 0

      return {
        no: index + 1,
        key: enc.id,
        id: enc.id,
        encounterId: enc.id,
        queueNumber: enc.queueTicket?.queueNumber || 0,
        patient: {
          id: enc.patient?.id || '',
          name: enc.patient?.name || 'Unknown',
          medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
          gender: enc.patient?.gender === 'male' ? Gender.MALE : Gender.FEMALE,
          birthDate: enc.patient?.birthDate || '',
          age: age,
          phone: '',
          address: '',
          identityNumber: enc.patient?.nik || ''
        },
        poli: {
          id: enc.queueTicket?.poli?.id?.toString() || '1',
          code: 'POL',
          name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-'
        },
        doctor: {
          id: enc.queueTicket?.practitioner?.id?.toString() || 'doc1',
          name: enc.queueTicket?.practitioner?.namaLengkap || 'Dr. Umum',
          specialization: 'General',
          sipNumber: enc.queueTicket?.practitioner?.nik || '123'
        },
        status: enc.status || 'unknown',
        registrationDate: enc.startTime || enc.createdAt || enc.visitDate,
        encounterType: enc.encounterType
      }
    }
  )

  const loadPolis = async () => {
    try {
      const data = await getPolis()
      setPolis(data)
    } catch (error) {
      console.error('Error loading polis:', error)
    }
  }

  useEffect(() => {
    loadPolis()
  }, [])

  const handleCallPatient = async (record: PatientQueueTableData) => {
    setCalling(record.id)
    try {
      const fn = window.api?.query?.encounter?.update
      if (!fn) throw new Error('API encounter update tidak tersedia')

      const response = await fn({
        id: record.encounterId!,
        status: EncounterStatus.IN_PROGRESS,
        patientId: record.patient.id,
        visitDate: record.registrationDate,
        serviceType: record.poli.name,
        encounterType: EncounterType.AMB,
        arrivalType: ArrivalType.WALK_IN
      })

      if (response.success) {
        message.success('Pasien berhasil dipanggil')
        refetch()
        window.open(`#/dashboard/nurse-calling/medical-record/${record.encounterId}`, '_blank')
      } else {
        message.error(response.error || 'Gagal memanggil pasien')
      }
    } catch (error) {
      message.error('Gagal memanggil pasien')
      console.error(error)
    } finally {
      setCalling(null)
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

  const totalWaiting = patientQueue.filter((p) => p.status === 'PLANNED').length
  const totalInProgress = patientQueue.filter((p) => p.status === 'IN_PROGRESS').length
  const totalFinished = patientQueue.filter((p) => p.status === 'FINISHED').length

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
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 72,
      align: 'center',
      render: (num: number) => (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
          style={{
            background: token.colorPrimaryBg,
            border: `1px solid ${token.colorPrimaryBorder}`
          }}
        >
          <span style={{ color: token.colorPrimaryText, fontWeight: 700, fontSize: 14 }}>
            {num || '-'}
          </span>
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
              <span style={{ fontSize: 10, color: token.colorTextTertiary }}>
                {record.patient.gender === 'MALE' ? '♂' : '♀'} {record.patient.age}th
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
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 135,
      render: (date: string) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {date ? dayjs(date).format('DD MMM YYYY') : '-'}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {date ? dayjs(date).format('HH:mm') : ''}
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
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleCallPatient(record)
            }}
            loading={calling === record.id}
            size="small"
          >
            Panggil
          </Button>
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
      {/* Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Title Row */}
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
                  Antrian &amp; Pemanggilan Pasien
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen antrian dan proses pemanggilan pasien ke ruang periksa
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

          {/* Stats Row */}
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
                  {totalWaiting}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Menunggu
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
                <PhoneOutlined style={{ color: token.colorWarningBg, fontSize: 16 }} />
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
          </div>
        </div>
      </Card>

      {/* Filter Card */}
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
            <Select
              placeholder="-- Semua Unit --"
              className="w-full"
              allowClear
              value={selectedPoli}
              onChange={setSelectedPoli}
            >
              {polis.map((poli) => (
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

      {/* Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patientQueue}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pasien`,
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

export default PatientQueueTable
