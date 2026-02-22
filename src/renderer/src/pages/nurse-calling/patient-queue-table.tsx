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
import { PatientQueue, Poli, Gender } from '../../types/nurse.types'
import { getPolis } from '../../services/nurse.service'
import { EncounterStatus, EncounterType, ArrivalType } from '@shared/encounter'

const { Option } = Select
const { RangePicker } = DatePicker

interface PatientQueueTableData extends PatientQueue {
  key: string
  encounterType?: string
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

  const columns: ColumnsType<PatientQueueTableData> = [
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
          <div className="text-xs ">
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
      width: 150,
      render: (text: string) => {
        if (!text) return '-'
        if (text === 'RAWAT_INAP') return 'Rawat Inap'
        if (text === 'RAWAT_JALAN') return 'Rawat Jalan'
        if (text === 'IGD') return 'IGD'
        return text
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase())
          .replace(/\bIgd\b/i, 'IGD')
      }
    },
    {
      title: 'Jenis',
      dataIndex: 'encounterType',
      key: 'encounterType',
      width: 120,
      render: (type: string) => {
        let label = type || '-'
        let color = 'default'

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
      width: 150,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        return (
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={() => handleCallPatient(record)}
            loading={calling === record.id}
            size="small"
          >
            Panggil
          </Button>
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
      <Card bodyStyle={{ padding: '24px' }} className="border-none">
        <div className="flex flex-col gap-6">
          {/* Header Manual */}
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold  mb-0">Antrian & Pemanggilan Pasien</h1>
              <p className="text-sm  m-0">
                Manajemen antrian dan proses pemanggilan pasien ke ruang periksa
              </p>
            </div>

            <Space size="large" align="center">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider font-bold">
                  Terakhir Sinkron
                </span>
                <span className="text-xs font-mono text-gray-600">
                  {dayjs().format('HH:mm:ss')}
                </span>
              </div>
              <Button
                type="primary"
                ghost
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={isLoading}
                className="h-10 rounded-lg px-6 font-medium border-blue-200 hover:bg-blue-50 transition-all"
              >
                Refresh Antrian
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 16]} align="bottom">
            <Col xs={24} md={8}>
              <div className="text-xs font-bold  mb-1.5 uppercase tracking-tight">Cari Pasien</div>
              <Input
                placeholder="Nama Pasien / No. Rekam Medis"
                prefix={<SearchOutlined className="text-gray-400" />}
                size="large"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="rounded-lg"
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold  mb-1.5 uppercase tracking-tight">
                Unit Pelayanan (Poli)
              </div>
              <Select
                placeholder="-- Semua Unit Pelayanan --"
                className="w-full rounded-lg"
                size="large"
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
              <div className="text-xs font-bold  mb-1.5 uppercase tracking-tight">
                Periode Kunjungan
              </div>
              <RangePicker
                className="w-full rounded-lg"
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
