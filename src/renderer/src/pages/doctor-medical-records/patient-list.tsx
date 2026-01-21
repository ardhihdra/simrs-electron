import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Spin, Select, Space } from 'antd'
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { PatientStatus } from '../../types/nurse.types'
import { getPatientsForDoctor } from '../../services/doctor.service'
import { dummyPolis } from '../../services/dummy-data'

const { Option } = Select

interface PatientListTableData extends PatientWithMedicalRecord {
  key: string
}

const PatientList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<PatientListTableData[]>([])
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)

  const loadPatients = async (poliId?: string) => {
    setLoading(true)
    try {
      const data = await getPatientsForDoctor(undefined, poliId)
      const tableData: PatientListTableData[] = data.map((p) => ({
        ...p,
        key: p.id
      }))
      setPatients(tableData)
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePoliChange = (value: string) => {
    setSelectedPoli(value)
    loadPatients(value)
  }

  const handleViewRecord = (record: PatientListTableData) => {
    navigate(`/dashboard/doctor-medical-records/detail/${record.encounterId}`)
  }

  const getStatusTag = (status: PatientStatus) => {
    switch (status) {
      case PatientStatus.CALLED:
        return <Tag color="orange">Dipanggil</Tag>
      case PatientStatus.EXAMINING:
        return <Tag color="processing">Sedang Diperiksa</Tag>
      case PatientStatus.COMPLETED:
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
            {record.patient.gender === 'MALE' ? 'L' : 'P'}, {record.patient.age} tahun
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
      title: 'Perawat',
      key: 'nurse',
      width: 150,
      render: (_, record) => record.nurseRecord?.nurseName || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PatientStatus) => getStatusTag(status)
    },
    {
      title: 'Rekam Medis',
      key: 'hasRecord',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const hasNurseRecord = !!record.nurseRecord
        return hasNurseRecord ? <Tag color="green">Tersedia</Tag> : <Tag color="red">Belum Ada</Tag>
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
          disabled={!record.nurseRecord}
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
            <Space>
              <Select
                placeholder="Filter by Poli"
                style={{ width: 200 }}
                allowClear
                onChange={handlePoliChange}
                value={selectedPoli}
              >
                {dummyPolis.map((poli) => (
                  <Option key={poli.id} value={poli.id}>
                    {poli.name}
                  </Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => loadPatients(selectedPoli)}>
                Refresh
              </Button>
            </Space>
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
