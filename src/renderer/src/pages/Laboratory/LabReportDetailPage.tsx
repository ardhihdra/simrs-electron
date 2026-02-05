import { client } from '@renderer/utils/client'
import { Card, Descriptions, Spin, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useParams } from 'react-router'

const { Title } = Typography

export default function LabReportDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = client.laboratory.getReport.useQuery(id!, {
    enabled: !!id,
    queryKey: ['laboratory.getReport', id!]
  })

  // The RPC returns encounter.toJSON()
  const encounter = data?.result || data

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    )
  }

  if (!encounter) {
    return <div>Report not found</div>
  }

  // Flatten observations for the table
  const observations =
    encounter.labServiceRequests?.flatMap((req: any) =>
      (req.observations || []).map((obs: any) => ({
        key: obs.id,
        testName: req.testCode?.display || req.testCode?.name || req.testCodeId, // Getting test name from request or code
        observationName: obs.observationCodeId, // Ideally this should be a name, but using ID for now
        value: obs.value,
        unit: obs.unit,
        referenceRange: obs.referenceRange,
        interpretation: obs.interpretation
      }))
    ) || []

  const columns = [
    {
      title: 'Test',
      dataIndex: 'testName',
      key: 'testName'
    },
    {
      title: 'Observation',
      dataIndex: 'observationName',
      key: 'observationName'
    },
    {
      title: 'Result',
      dataIndex: 'value',
      key: 'value',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit'
    },
    {
      title: 'Ref. Range',
      dataIndex: 'referenceRange',
      key: 'referenceRange'
    },
    {
      title: 'Interpretation',
      dataIndex: 'interpretation',
      key: 'interpretation',
      render: (tag: string) => {
        let color = 'default'
        if (tag === 'HIGH' || tag === 'CRITICAL_HIGH') color = 'red'
        if (tag === 'LOW' || tag === 'CRITICAL_LOW') color = 'blue'
        if (tag === 'NORMAL') color = 'green'

        return tag ? <Tag color={color}>{tag}</Tag> : '-'
      }
    }
  ]

  return (
    <div className="p-4">
      <Title level={3}>Laboratory Result Report</Title>

      <Card title="Patient Information" className="mb-4">
        <Descriptions column={2}>
          <Descriptions.Item label="Patient Name">{encounter.patient?.name}</Descriptions.Item>
          <Descriptions.Item label="Patient ID">{encounter.patient?.id}</Descriptions.Item>
          <Descriptions.Item label="Encounter Date">
            {dayjs(encounter.startTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">{encounter.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Results" className="mt-4!">
        <Table
          dataSource={observations}
          columns={columns}
          pagination={false}
          bordered
          size="middle"
        />
      </Card>

      <div className="mt-4 text-gray-500 text-sm">
        <p>Report generated at: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>
    </div>
  )
}
