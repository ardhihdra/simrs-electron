import { client } from '@renderer/utils/client'
import { Button, Space, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'

const { Title } = Typography

interface LabEncounter {
  id: string
  startTime: string
  patient?: {
    id: string
    name: string
  }
  status: string
}

export function LabReportPage() {
  const [filters] = useState({ limit: 10, offset: 0 })
  const navigate = useNavigate()

  const { data, isLoading } = client.laboratory.listLabReports.useQuery(filters)

  const columns = [
    {
      title: 'Date',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-')
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (patient: LabEncounter['patient']) => patient?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="green">{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LabEncounter) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => navigate(`/dashboard/laboratory/report/${record.id}`)}
          >
            View Result
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Title level={2}>Laboratory Reports</Title>
      <Table
        dataSource={data?.result || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
    </div>
  )
}
