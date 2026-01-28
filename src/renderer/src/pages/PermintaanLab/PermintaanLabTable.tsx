import GenericTable from '@renderer/components/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { Col, Form, Input, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

// Define interface locally for now based on the model
interface LabServiceRequest {
  id: string
  encounterId: string
  patientId: string
  serviceCodeId: string
  priority: 'ROUTINE' | 'URGENT' | 'ASAP' | 'STAT'
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  requestedAt: string
  patient?: {
    name: string
    medicalRecordNumber: string
    gender: string
  }
  serviceCode?: {
    code: string
    name: string
    display?: string
  }
}

interface PermintaanLabTableProps {
  data: LabServiceRequest[]
  isLoading: boolean
}

export function PermintaanLabTable({ data, isLoading }: PermintaanLabTableProps) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ name: '', medicalRecordNumber: '' })

  const columns: ColumnsType<LabServiceRequest> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Waktu Request',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (value) => (value ? new Date(value).toLocaleString() : '-')
    },
    {
      title: 'MRN',
      dataIndex: ['patient', 'medicalRecordNumber'],
      key: 'medicalRecordNumber'
    },
    {
      title: 'Nama Pasien',
      dataIndex: ['patient', 'name'],
      key: 'name'
    },
    {
      title: 'Pemeriksaan',
      dataIndex: ['serviceCode', 'name'],
      key: 'testName',
      render: (value, record) =>
        record.serviceCode?.display ||
        value ||
        record.serviceCode?.code ||
        record.serviceCodeId ||
        '-'
    },
    {
      title: 'Prioritas',
      dataIndex: 'priority',
      key: 'priority',
      render: (value) => {
        let color = 'default'
        if (value === 'STAT') color = 'blue'
        if (value === 'URGENT') color = 'red'
        if (value === 'ROUTINE') color = 'green'
        return <Tag color={color}>{value}</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        let color = 'default'
        if (value === 'REQUESTED') color = 'blue'
        if (value === 'IN_PROGRESS') color = 'orange'
        if (value === 'COMPLETED') color = 'green'
        if (value === 'CANCELLED') color = 'red'
        return <Tag color={color}>{value}</Tag>
      }
    }
  ]

  const filteredData = useMemo(() => {
    const rawData = data || []
    return rawData.filter((item) => {
      const patientName = item.patient?.name || ''
      const patientMrn = item.patient?.medicalRecordNumber || ''

      const filterName = filter.name || ''
      const filterMrn = filter.medicalRecordNumber || ''

      const matchName = patientName.toLowerCase().includes(filterName.toLowerCase())
      const matchMrn = patientMrn.toLowerCase().includes(filterMrn.toLowerCase())

      if (filterName && !matchName) return false
      if (filterMrn && !matchMrn) return false
      return true
    })
  }, [data, filter])

  return (
    <div>
      <TableHeader
        title="Daftar Permintaan Laboratorium"
        onSearch={(values) => setFilter(values)}
        onReset={() => setFilter({ name: '', medicalRecordNumber: '' })}
        loading={isLoading}
      >
        <Col span={12}>
          <Form.Item name="name" label="Nama Pasien">
            <Input placeholder="Cari Nama Pasien" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="medicalRecordNumber" label="MRN">
            <Input placeholder="Cari MRN" allowClear />
          </Form.Item>
        </Col>
      </TableHeader>
      <div className="mt-4">
        <GenericTable
          loading={isLoading}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          action={{
            items(record) {
              return [
                {
                  key: 'input-result',
                  label: 'Input Hasil',
                  onClick: () => navigate(`/dashboard/laboratory/result/${record.encounterId}`)
                },
                {
                  key: 'ambil-specimen',
                  label: 'Ambil Specimen',
                  onClick: () => navigate(`/dashboard/laboratory/specimen/${record.encounterId}`)
                }
              ]
            }
          }}
        />
      </div>
    </div>
  )
}
