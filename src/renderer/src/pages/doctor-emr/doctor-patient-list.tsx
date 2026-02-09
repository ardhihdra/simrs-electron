import { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Tag,
  Button,
  Spin,
  App,
  Input,
  Select,
  DatePicker,
  Space,
  Row,
  Col,
  Tabs
} from 'antd'
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface PatientListTableData {
  key: string
  id: string
  encounterId: string
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
    poli?: {
      id: number
      name: string
      location: string
    }
    practitioner?: {
      id: number
      namaLengkap: string
      nik: string
    }
  }
  poli: {
    name: string
  }
  status: string
  hasObservations: boolean
}

const PatientList = () => {
  const navigate = useNavigate()
  const [polis, setPolis] = useState<any[]>([])
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
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')

      const params: any = {}

      if (searchText) params.q = searchText

      if (activeStatus && activeStatus !== 'all') params.status = activeStatus

      if (selectedPoli) {
        const selectedPoliData = polis.find(p => p.id === selectedPoli || p.name === selectedPoli)
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

  const patients: PatientListTableData[] = (encounterData?.result || []).map((enc: any, index: number) => {
    const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
    const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

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
        gender: enc.patient?.gender || 'male',
        age: age,
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
      poli: {
        name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-'
      },
      status: enc.status || 'unknown',
      hasObservations: true,
      visitDate: enc.startTime || enc.createdAt || new Date().toISOString()
    }
  })

  const loadPolis = async () => {
    try {
      const fn = window.api?.query?.poli?.list
      if (fn) {
        const response = await fn()
        if (response.success && response.result) {
          setPolis(response.result)
        }
      }
    } catch (error) {
      console.error('Error loading polis:', error)
    }
  }

  useEffect(() => {
    loadPolis()
  }, [])

  const handleViewRecord = (record: PatientListTableData) => {
    navigate(`/dashboard/doctor/${record.encounterId}`)
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

  const columns: ColumnsType<PatientListTableData> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 100,
      align: 'center',
      render: (num: number) => <div className="text-xl font-bold text-blue-600">{num}</div>
    },
    {
      title: 'No. Rekam Medis',
      dataIndex: ['patient', 'medicalRecordNumber'],
      key: 'medicalRecordNumber',
      width: 150
    },
    {
      title: 'Nama Pasien',
      dataIndex: ['patient', 'name'],
      key: 'patientName',
      width: 250,
      render: (name: string, record) => (
        <div>
          <div className="font-medium text-base">{name}</div>
          <div className="text-xs text-gray-500">
            {record.patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}, {record.patient.age}{' '}
            tahun
          </div>
        </div>
      )
    },
    {
      title: 'Poli',
      dataIndex: ['poli', 'name'],
      key: 'poli',
      width: 150
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
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewRecord(record)}
          size="small"
        >
          Periksa
        </Button>
      )
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
      {/* Filters Card */}
      <Card
        bodyStyle={{ padding: '16px' }}
        title="Daftar Pasien Rawat Jalan"
        extra={
          <Space>
            <span className="text-gray-400 text-xs italic mr-2">
              Updated: {dayjs().format('HH:mm')}
            </span>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
            />
          </Space>
        }
      >
        <div className="flex flex-col gap-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Input
                placeholder="Cari Nama / No RM..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="Pilih Poli"
                className="w-full"
                allowClear
                value={selectedPoli}
                onChange={setSelectedPoli}
              >
                <Option value="Poli Umum">Poli Umum</Option>
                <Option value="Poli Gigi">Poli Gigi</Option>
                <Option value="Poli Anak">Poli Anak</Option>
                <Option value="Poli Kandungan">Poli Kandungan</Option>
                <Option value="Poli Penyakit Dalam">Poli Penyakit Dalam</Option>
                <Option value="IGD">IGD</Option>
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <RangePicker
                className="w-full"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                format="DD/MM/YYYY"
              />
            </Col>
          </Row>

          <Tabs
            activeKey={activeStatus}
            onChange={setActiveStatus}
            items={statusTabs}
            type="card"
            className="mb-[-17px]" // pull tabs closer to table if needed
          />
        </div>
      </Card>

      {/* Main Table */}
      <Card bodyStyle={{ padding: '0' }} className="flex-1 overflow-hidden flex flex-col">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patients}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pasien`,
              showSizeChanger: true
            }}
            scroll={{ x: 1000, y: 'calc(100vh - 350px)' }}
            className="flex-1"
          />
        </Spin>
      </Card>
    </div>
  )
}

export default PatientList
