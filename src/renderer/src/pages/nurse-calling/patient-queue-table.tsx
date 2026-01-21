import { useState, useEffect } from 'react'
import { Table, Button, Tag, Select, Space, Card, App, Spin } from 'antd'
import { PhoneOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { PatientQueue, PatientStatus, Poli } from '../../types/nurse.types'
import { getPatientQueue, getPolis, callPatient } from '../../services/nurse.service'

const { Option } = Select

interface PatientQueueTableData extends PatientQueue {
  key: string
}

const PatientQueueTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [calling, setCalling] = useState<string | null>(null)
  const [patientQueue, setPatientQueue] = useState<PatientQueueTableData[]>([])
  const [polis, setPolis] = useState<Poli[]>([])
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)

  const loadQueue = async (poliId?: string) => {
    setLoading(true)
    try {
      const queue = await getPatientQueue(poliId)
      const tableData: PatientQueueTableData[] = queue.map((q) => ({
        ...q,
        key: q.id
      }))
      setPatientQueue(tableData)
    } catch (error) {
      message.error('Gagal memuat data antrian')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadPolis = async () => {
    try {
      const data = await getPolis()
      setPolis(data)
    } catch (error) {
      console.error('Error loading polis:', error)
    }
  }

  useEffect(() => {
    loadQueue()
    loadPolis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCallPatient = async (record: PatientQueueTableData) => {
    setCalling(record.id)
    try {
      const response = await callPatient({
        queueId: record.id,
        encounterId: record.encounterId!
      })

      if (response.success) {
        message.success(response.message)
        // Navigate to medical record form
        navigate(`/dashboard/nurse-calling/medical-record/${record.encounterId}`)
      } else {
        message.error(response.message)
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
    loadQueue(value)
  }

  const handleRefresh = () => {
    loadQueue(selectedPoli)
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
        <Spin spinning={loading}>
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
