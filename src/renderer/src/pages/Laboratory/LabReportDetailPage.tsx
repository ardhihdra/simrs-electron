import { ArrowLeftOutlined, FileImageOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Empty, Spin, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router'
import { client } from '@renderer/utils/client'

const { Title, Text, Paragraph } = Typography

interface ImagingStudyReport {
  id: string
  modalityCode: string
  started: string
  studyInstanceUID: string
  pacsStudyUid: string
  pacsEndpoint?: string
  reportStatus: string
  diagnosticReport?: {
    id: number
    status: string
    conclusion: string
    issued: string
    categoryDisplay?: string
  }
}

export default function LabReportDetailPage() {
  const navigate = useNavigate()
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
    encounter.labServiceRequests?.flatMap((req: Record<string, unknown>) => {
      const serviceCode = req.serviceCode as Record<string, string> | undefined
      return ((req.observations as Record<string, unknown>[]) || []).map((obs: Record<string, unknown>) => ({
        key: obs.id as string,
        display: serviceCode?.display,
        systemUri: serviceCode?.systemUri,
        code: serviceCode?.code,
        value: obs.value as string,
        unit: obs.unit as string,
        referenceRange: obs.referenceRange as string,
        interpretation: obs.interpretation as string,
      }))
    }) || []

  // Imaging studies from the unified endpoint
  const imagingStudies: ImagingStudyReport[] = encounter.imagingStudies || []

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string, row: { systemUri?: string }) => <strong>{row.systemUri}/{text}</strong>
    },
    {
      title: 'Test Name',
      dataIndex: 'display',
      key: 'display'
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

  console.log("encounter",encounter)
  return (
    <div className="p-4">
      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
      </div>

      <Title level={3}>Diagnostic Result Report</Title>

      <Card title="Patient Information" className="mb-4">
        <Descriptions column={2}>
          <Descriptions.Item label="Patient Name">{encounter.patient?.name}</Descriptions.Item>
          <Descriptions.Item label="Medical Record Number">{encounter.patient?.medicalRecordNumber}</Descriptions.Item>
          <Descriptions.Item label="Encounter Date">
            {dayjs(encounter.startTime).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green">{encounter.status}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Lab Results Section */}
      {observations.length > 0 && (
        <Card title="Laboratory Results" className="mb-4">
          <Table
            dataSource={observations}
            columns={columns}
            pagination={false}
            bordered
            size="middle"
          />
        </Card>
      )}

      {/* Imaging / Radiology Results Section */}
      {imagingStudies.length > 0 && (
        <Card title="Radiology / Imaging Results" className="mb-4">
          {imagingStudies.map((study) => (
            <Card
              key={study.id}
              type="inner"
              className="mb-3"
              title={
                <span>
                  <FileImageOutlined className="mr-2" />
                  {study.modalityCode} — {dayjs(study.started).format('YYYY-MM-DD')}
                </span>
              }
              extra={
                <Tag color={study.reportStatus === 'FINAL' ? 'green' : 'orange'}>
                  {study.reportStatus}
                </Tag>
              }
            >
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Modality">{study.modalityCode}</Descriptions.Item>
                <Descriptions.Item label="Study Date">{dayjs(study.started).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                <Descriptions.Item label="Study Instance UID" span={2}>
                  <Text copyable code>{study.studyInstanceUID}</Text>
                </Descriptions.Item>
              </Descriptions>

              {study.diagnosticReport ? (
                <div className="mt-4">
                  <Title level={5}>Findings</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
                    {study.diagnosticReport.conclusion || 'No findings recorded.'}
                  </Paragraph>
                  <Text type="secondary">
                    Report issued: {dayjs(study.diagnosticReport.issued).format('YYYY-MM-DD HH:mm')}
                    {' · '}Status: <Tag color={study.diagnosticReport.status === 'final' ? 'green' : 'blue'}>{study.diagnosticReport.status}</Tag>
                  </Text>
                </div>
              ) : (
                <Empty description="No diagnostic report linked" className="mt-4" />
              )}
            </Card>
          ))}
        </Card>
      )}

      {observations.length === 0 && imagingStudies.length === 0 && (
        <Card>
          <Empty description="No results available for this encounter" />
        </Card>
      )}

      <div className="mt-4 text-gray-500 text-sm">
        <p>Report generated at: {dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
      </div>
    </div>
  )
}
