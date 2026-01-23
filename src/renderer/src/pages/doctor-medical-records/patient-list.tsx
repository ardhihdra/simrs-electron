import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Spin, App } from 'antd'
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'

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
}

const PatientList = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<PatientListTableData[]>([])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')

      // Fetch encounters with status 'triaged' (after nurse examination)
      const response = await fn({ status: 'triaged' })

      if (response.success && response.result) {
        const encounters = response.result as any[]

        // Map encounters to table data
        const tableData: PatientListTableData[] = encounters.map((enc: any) => {
          // Calculate age
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
              name: enc.serviceType ? String(enc.serviceType) : '-'
            },
            status: enc.status || 'triaged',
            hasObservations: true // If status is triaged, observations should exist
          }
        })

        setPatients(tableData)
      } else {
        message.error('Gagal memuat data pasien')
      }
    } catch (error) {
      message.error('Gagal memuat data pasien')
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleViewRecord = (record: PatientListTableData) => {
    navigate(`/dashboard/doctor-consultation/${record.encounterId}`)
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'arrived':
        return <Tag color="blue">Tiba</Tag>
      case 'triaged':
        return <Tag color="processing">Sudah Diperiksa Perawat</Tag>
      case 'in-progress':
        return <Tag color="orange">Sedang Ditangani Dokter</Tag>
      case 'finished':
        return <Tag color="success">Selesai</Tag>
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
            {record.patient.gender === 'male' ? 'L' : 'P'}, {record.patient.age} tahun
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
      title: 'Rekam Medis',
      key: 'hasRecord',
      width: 120,
      align: 'center',
      render: (_, record) => {
        return record.hasObservations ? (
          <Tag color="green">Tersedia</Tag>
        ) : (
          <Tag color="red">Belum Ada</Tag>
        )
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewRecord(record)}
          disabled={!record.hasObservations}
        >
          Lihat
        </Button>
      )
    }
  ]

  return (
    <div>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Daftar Pasien</span>
            <Button icon={<ReloadOutlined />} onClick={() => loadPatients()}>
              Refresh
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={patients}
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

export default PatientList
