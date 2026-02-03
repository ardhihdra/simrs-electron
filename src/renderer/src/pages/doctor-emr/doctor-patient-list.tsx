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
  poli: {
    name: string
  }
  status: string
  hasObservations: boolean
  visitDate: string
}

const PatientList = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<PatientListTableData[]>([])

  // Filter States
  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null) // Default to All Time
  const [activeStatus, setActiveStatus] = useState<string>('all')

  const loadPatients = async () => {
    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')

      // Prepare query params
      const params: any = {}

      if (searchText) params.q = searchText
      if (selectedPoli) params.serviceType = selectedPoli
      if (activeStatus && activeStatus !== 'all') {
        params.status = activeStatus.toUpperCase().replace(/-/g, '_')
      }

      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }

      params.sortBy = 'visitDate'
      params.sortOrder = 'DESC'

      const response = await fn(params)

      if (response.success && Array.isArray(response.result)) {
        const encounters = response.result as any[]

        const tableData: PatientListTableData[] = encounters.map((enc: any) => {
          const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
          const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

          return {
            key: enc.id,
            id: enc.id,
            encounterId: enc.id,
            queueNumber: parseInt(enc.encounterCode?.split('-')?.[1] || '0'),
            patient: {
              id: enc.patient?.id || '',
              name: enc.patient?.name || 'Unknown',
              medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
              gender: enc.patient?.gender || 'male',
              age: age,
              birthDate: enc.patient?.birthDate || '',
              nik: enc.patient?.nik || ''
            },
            poli: {
              name: enc.serviceType || '-'
            },
            status: enc.status || 'unknown',
            hasObservations: true,
            visitDate: enc.visitDate || new Date().toISOString()
          }
        })

        setPatients(tableData)
      } else {
        message.error('Gagal memuat data pasien')
      }
    } catch (error) {
      console.error('Error loading patients:', error)
      message.error('Gagal memuat data pasien')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initial load only, manual refresh for filters to avoid too many requests or add debounce later

  // Refresh when filters change (optional: can be manual trigger)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchText, selectedPoli, activeStatus, dateRange])

  const handleViewRecord = (record: PatientListTableData) => {
    navigate(`/dashboard/doctor/${record.encounterId}`)
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'arrived':
        return <Tag color="blue">Tiba</Tag>
      case 'triaged':
        return <Tag color="processing">Di Perawat</Tag>
      case 'in-progress':
        return <Tag color="orange">Sedang Diperiksa</Tag>
      case 'finished':
        return <Tag color="success">Selesai</Tag>
      case 'cancelled':
        return <Tag color="error">Batal</Tag>
      case 'on-hold':
        return <Tag color="default">Ditunda</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const columns: ColumnsType<PatientListTableData> = [
    {
      title: 'No. Antrian',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 100,
      align: 'center',
      render: (num: number) => <div className="text-xl font-bold text-blue-600">{num}</div>
    },
    {
      title: 'Waktu',
      dataIndex: 'visitDate',
      key: 'visitDate',
      width: 120,
      render: (date: string) => dayjs(date).format('HH:mm')
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
    { key: 'triaged', label: 'Menunggu Dokter' },
    { key: 'in-progress', label: 'Sedang Diperiksa' },
    { key: 'finished', label: 'Selesai' }
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
              onClick={() => loadPatients()}
              loading={loading}
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
        <Spin spinning={loading}>
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
