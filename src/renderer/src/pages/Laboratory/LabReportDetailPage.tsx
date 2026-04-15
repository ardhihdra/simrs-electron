import { ArrowLeftOutlined, EyeOutlined, FileImageOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Button, Card, Descriptions, Empty, Spin, Table, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router'

const { Title, Text, Paragraph } = Typography

interface LabObservationReport {
  id: string
  observationCodeId: string
  value: string
  unit?: string
  referenceRange?: string
  interpretation?: string
  status: string
  observedAt?: string | null
  finalizedAt?: string | null
}

interface LabServiceRequestReport {
  id: string
  testCodeId: string
  priority: string
  status: string
  testDisplay?: string
  requestedAt?: string | null
  performers?: Array<{
    reference: string
    display: string
  }>
  performerTypes?: Array<{
    system: string
    code: string
    display: string
  }>
  specimens: unknown[]
  observations: LabObservationReport[]
}

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

interface LabReportResponse {
  encounterId: string
  patientId: string
  patient?: {
    name?: string
    medicalRecordNumber?: string
    mrn?: string
  }
  queueTicket?: {
    number?: string
    date?: string
    status?: string
  }
  serviceRequests?: LabServiceRequestReport[]
  imagingStudies?: ImagingStudyReport[]
}

function getInterpretationColor(value?: string): string {
  if (!value) return 'default'
  if (value === 'NORMAL') return 'green'
  if (value === 'HIGH') return 'volcano'
  if (value === 'LOW') return 'blue'
  if (value === 'CRITICAL' || value === 'CRITICAL_HIGH' || value === 'CRITICAL_LOW') return 'red'
  if (value === 'ABNORMAL') return 'orange'
  return 'default'
}

function getStatusColor(value?: string): string {
  if (!value) return 'default'
  if (value === 'COMPLETED' || value === 'FINAL') return 'green'
  if (value === 'REQUESTED' || value === 'PRELIMINARY') return 'gold'
  if (value === 'IN_PROGRESS') return 'blue'
  if (value === 'CANCELLED') return 'red'
  return 'default'
}

export default function LabReportDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data, isLoading } = client.laboratoryManagement.getReport.useQuery(
    { encounterId: id! },
    {
      enabled: !!id,
      queryKey: ['laboratoryManagement.getReport', { encounterId: id! }]
    }
  )

  const report = (data?.result || data) as LabReportResponse | undefined

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    )
  }

  if (!report) {
    return <div>Report not found</div>
  }

  const serviceRequests = Array.isArray(report.serviceRequests) ? report.serviceRequests : []
  const imagingStudies = Array.isArray(report.imagingStudies) ? report.imagingStudies : []
  const observationRows = serviceRequests.flatMap((request) =>
    (request.observations || []).map((observation) => ({
      key: observation.id,
      serviceRequestId: request.id,
      testCodeId: request.testCodeId,
      requestStatus: request.status,
      requestPriority: request.priority,
      ...observation
    }))
  )
  const serviceRequestAuditRows = serviceRequests.map((request) => ({
    key: request.id,
    testDisplay: request.testDisplay || request.testCodeId,
    requestedAt: request.requestedAt,
    performers: Array.isArray(request.performers) ? request.performers : [],
    performerTypes: Array.isArray(request.performerTypes) ? request.performerTypes : [],
    status: request.status
  }))

  const observationColumns = [
    {
      title: 'Kode Observasi',
      dataIndex: 'observationCodeId',
      key: 'observationCodeId',
      render: (value: string) => <strong>{value}</strong>
    },
    {
      title: 'Hasil',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => <strong>{value}</strong>
    },
    {
      title: 'Satuan',
      dataIndex: 'unit',
      key: 'unit',
      render: (value?: string) => value || '-'
    },
    {
      title: 'Nilai Rujukan',
      dataIndex: 'referenceRange',
      key: 'referenceRange',
      render: (value?: string) => value || '-'
    },
    {
      title: 'Interpretasi',
      dataIndex: 'interpretation',
      key: 'interpretation',
      render: (value?: string) =>
        value ? <Tag color={getInterpretationColor(value)}>{value}</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={getStatusColor(value)}>{value}</Tag>
    },
    {
      title: 'Waktu Hasil',
      dataIndex: 'observedAt',
      key: 'observedAt',
      render: (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-')
    }
  ]

  const serviceRequestColumns = [
    {
      title: 'Pemeriksaan',
      dataIndex: 'testDisplay',
      key: 'testDisplay',
      render: (value: string) => <strong>{value}</strong>
    },
    {
      title: 'Performer',
      dataIndex: 'performers',
      key: 'performers',
      render: (performers: LabServiceRequestReport['performers']) =>
        performers && performers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {performers.map((performer) => (
              <Tag key={performer.reference} color="blue">
                {performer.display}
              </Tag>
            ))}
          </div>
        ) : (
          '-'
        )
    },
    {
      title: 'Tipe Performer',
      dataIndex: 'performerTypes',
      key: 'performerTypes',
      render: (performerTypes: LabServiceRequestReport['performerTypes']) =>
        performerTypes && performerTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {performerTypes.map((performerType) => (
              <Tag key={performerType.code} color="purple">
                {performerType.display}
              </Tag>
            ))}
          </div>
        ) : (
          '-'
        )
    },
    {
      title: 'Waktu Update',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (value?: string | null) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={getStatusColor(value)}>{value}</Tag>
    }
  ]

  const patientName = report.patient?.name || '-'
  const medicalRecordNumber = report.patient?.medicalRecordNumber || report.patient?.mrn || '-'
  return (
    <div className="p-4">
      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Title level={3}>Diagnostic Result Report</Title>

      <Card title="Report Information" className="mb-4">
        <Descriptions column={2}>
          <Descriptions.Item label="Patient Name">{patientName}</Descriptions.Item>
          <Descriptions.Item label="Medical Record Number">{medicalRecordNumber}</Descriptions.Item>
          <Descriptions.Item label="Jumlah Service Request">
            {serviceRequests.length}
          </Descriptions.Item>
          <Descriptions.Item label="Jumlah Imaging Study">
            {imagingStudies.length}
          </Descriptions.Item>
          {report.queueTicket?.number ? (
            <Descriptions.Item label="Nomor Antrian">{report.queueTicket.number}</Descriptions.Item>
          ) : null}
          {report.queueTicket?.status ? (
            <Descriptions.Item label="Status Antrian">
              <Tag color={getStatusColor(report.queueTicket.status)}>
                {report.queueTicket.status}
              </Tag>
            </Descriptions.Item>
          ) : null}
        </Descriptions>
      </Card>

      {serviceRequestAuditRows.length > 0 && (
        <Card title="Service Request Audit" className="my-4!">
          <Table
            dataSource={serviceRequestAuditRows}
            columns={serviceRequestColumns}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {observationRows.length > 0 && (
        <div className="my-4">
          <Card title="Laboratory Results" className="mb-4">
            <Table
              dataSource={observationRows}
              columns={observationColumns}
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: 1200 }}
            />
          </Card>
        </div>
      )}

      {imagingStudies.length > 0 && (
        <div className="my-4">
          <Card title="Radiology / Imaging Results" className="mb-4">
            {imagingStudies.map((study) => (
              <Card
                key={study.id}
                type="inner"
                className="mb-3"
                title={
                  <span>
                    <FileImageOutlined className="mr-2" />
                    {study.modalityCode} - {dayjs(study.started).format('YYYY-MM-DD')}
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
                  <Descriptions.Item label="Study Date">
                    {dayjs(study.started).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Study Instance UID" span={2}>
                    <Text copyable code>
                      {study.studyInstanceUID}
                    </Text>
                    <Button
                      onClick={() =>
                        (client.window as any).create({
                          url: `http://localhost:3000/viewer?StudyInstanceUIDs=${study.studyInstanceUID}`,
                          title: study.modalityCode
                        })
                      }
                      size="small"
                      icon={<EyeOutlined />}
                      className="ml-2"
                    />
                  </Descriptions.Item>
                </Descriptions>
                {study.diagnosticReport ? (
                  <div className="mt-4">
                    <Title level={5}>Findings</Title>
                    <Paragraph
                      style={{
                        whiteSpace: 'pre-wrap',
                        background: '#f9f9f9',
                        padding: 12,
                        borderRadius: 6
                      }}
                    >
                      {study.diagnosticReport.conclusion || 'No findings recorded.'}
                    </Paragraph>
                    <Text type="secondary">
                      Report issued:{' '}
                      {dayjs(study.diagnosticReport.issued).format('YYYY-MM-DD HH:mm')}
                      {' · '}Status:{' '}
                      <Tag color={study.diagnosticReport.status === 'final' ? 'green' : 'blue'}>
                        {study.diagnosticReport.status}
                      </Tag>
                    </Text>
                  </div>
                ) : (
                  <Empty description="No diagnostic report linked" className="mt-4" />
                )}
              </Card>
            ))}
          </Card>
        </div>
      )}

      {observationRows.length === 0 && imagingStudies.length === 0 && (
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
