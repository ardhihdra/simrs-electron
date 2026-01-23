import { useState, useEffect } from 'react'
import { Table, Button, Tag, Select, Space, Card, App, Spin } from 'antd'
import { PhoneOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { PatientQueue, PatientStatus, Poli, Gender } from '../../types/nurse.types'
import { getPolis } from '../../services/nurse.service'

const { Option } = Select

interface PatientQueueTableData extends PatientQueue {
  key: string
}

function mapEncounterStatusToPatientStatus(status: string): PatientStatus {
  const s = status?.toLowerCase()
  if (s === 'arrived') return PatientStatus.WAITING
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
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)

  const {
    data: encounterData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['encounter', 'list', selectedPoli],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')
      return fn({ serviceType: selectedPoli })
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
        queueNumber: parseInt(enc.encounterCode?.split('-')?.[1] || (index + 1).toString()),
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
          id: '1',
          code: 'POL',
          name: enc.serviceType || '-'
        },
        doctor: {
          id: 'doc1',
          name: 'Dr. Umum',
          specialization: 'General',
          sipNumber: '123'
        },
        status: mapEncounterStatusToPatientStatus(enc.status),
        registrationDate: enc.visitDate
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
        status: 'in-progress',
        patientId: record.patient.id,
        visitDate: record.registrationDate,
        serviceType: record.poli.name
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

  const handlePoliChange = (value: string) => {
    setSelectedPoli(value)
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

  return (
    <div>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Pemanggilan Pasien</span>
            <Space>
              <Select
                placeholder="Filter by Poli"
                style={{ width: 200 }}
                allowClear
                onChange={handlePoliChange}
                value={selectedPoli}
              >
                {polis.map((poli) => (
                  <Option key={poli.id} value={poli.id}>
                    {poli.name}
                  </Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                Refresh
              </Button>
            </Space>
          </div>
        }
      >
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={patientQueue}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} pasien`,
              showSizeChanger: true
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default PatientQueueTable
