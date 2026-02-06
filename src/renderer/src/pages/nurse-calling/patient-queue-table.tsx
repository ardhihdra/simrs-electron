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
  Tabs
} from 'antd'
import { PhoneOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PatientQueue, PatientStatus, Poli, Gender } from '../../types/nurse.types'
import { getPolis } from '../../services/nurse.service'
import { EncounterStatus, EncounterType, ArrivalType } from '@shared/encounter'

const { Option } = Select
const { RangePicker } = DatePicker

interface PatientQueueTableData extends PatientQueue {
  key: string
}

function mapEncounterStatusToPatientStatus(status: string): PatientStatus {
  const s = status?.toLowerCase()
  if (s === 'planned') return PatientStatus.WAITING
  if (s === 'arrived' || s === 'planned') return PatientStatus.WAITING
  if (s === 'triaged') return PatientStatus.EXAMINING
  if (s === 'in-progress') return PatientStatus.EXAMINING
  if (s === 'finished') return PatientStatus.COMPLETED
  if (s === 'cancelled') return PatientStatus.CANCELLED
  return PatientStatus.WAITING
}

const PatientQueueTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [calling, setCalling] = useState<string | null>(null)
  const [polis, setPolis] = useState<Poli[]>([])

  // Filter States
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
      if (selectedPoli) params.serviceType = selectedPoli
      if (activeStatus && activeStatus !== 'all') params.status = activeStatus

      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }

      // Default sort for queue
      params.sortBy = 'visitDate'
      params.sortOrder = 'ASC'

      return fn(params)
    }
  })

  // Derive patientQueue from encounterData
  const patientQueue: PatientQueueTableData[] = (encounterData?.result || []).map(
    (enc: any, index: number) => {
      const birthDate = enc.patient?.birthDate ? dayjs(enc.patient.birthDate) : null
      const age = birthDate ? dayjs().diff(birthDate, 'year') : 0

      return {
        key: enc.id,
        id: enc.id,
        encounterId: enc.id,
        queueNumber: enc.queueTicket?.queueNumber || index + 1,
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
        status: mapEncounterStatusToPatientStatus(enc.status),
        registrationDate: enc.startTime || enc.createdAt || enc.visitDate
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
        navigate(`/dashboard/nurse-calling/medical-record/${record.encounterId}`)
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

  const handleRefresh = () => {
    refetch()
  }

  const getStatusTag = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.WAITING:
        return <Tag color="blue">Menunggu</Tag>
      case PatientStatus.CALLED:
        return <Tag color="orange">Dipanggil</Tag>
      case PatientStatus.EXAMINING:
        return <Tag color="processing">Sedang Diperiksa</Tag>
      case PatientStatus.COMPLETED:
        return <Tag color="success">Selesai</Tag>
      case PatientStatus.CANCELLED:
        return <Tag color="error">Dibatalkan</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const columns: ColumnsType<PatientQueueTableData> = [
    {
      title: 'No. Antrian',
      dataIndex: 'queueNumber',
      key: 'queueNumber',
      width: 120,
      align: 'center',
      render: (num: number) => <div className="text-2xl font-bold text-blue-600">{num}</div>
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
      width: 200,
      render: (name: string, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">
            {record.patient.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'}, {record.patient.age}{' '}
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
      title: 'Dokter',
      dataIndex: ['doctor', 'name'],
      key: 'doctor',
      width: 200
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: PatientStatus) => getStatusTag(status)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record) => {
        const isWaiting = record.status === PatientStatus.WAITING
        const isCalling = calling === record.id

        return (
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => handleCallPatient(record)}
            disabled={!isWaiting || isCalling}
            loading={isCalling}
          >
            {isCalling ? 'Memanggil...' : 'Panggil'}
          </Button>
        )
      }
    }
  ]

  const statusTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'arrived', label: 'Menunggu' },
    { key: 'in-progress', label: 'Sedang Diperiksa' },
    { key: 'finished', label: 'Selesai' }
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
        bodyStyle={{ padding: '16px' }}
        title="Pemanggilan Pasien"
        extra={
          <Space>
            <span className="text-gray-400 text-xs italic mr-2">
              Last Updated: {dayjs().format('HH:mm')}
            </span>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
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
                {polis.map((poli) => (
                  <Option key={poli.id} value={poli.id}>
                    {poli.name}
                  </Option>
                ))}
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
            className="mb-[-17px]"
          />
        </div>
      </Card>

      <Card bodyStyle={{ padding: '0' }} className="flex-1 overflow-hidden flex flex-col">
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patientQueue}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pasien`,
              showSizeChanger: true
            }}
            scroll={{ x: 1200, y: 'calc(100vh - 350px)' }}
            className="flex-1"
          />
        </Spin>
      </Card>
    </div>
  )
}

export default PatientQueueTable
