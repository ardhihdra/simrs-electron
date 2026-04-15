import {
  ApartmentOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  ProfileOutlined,
  SyncOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import type { PatientInfoCardData } from '@renderer/components/molecules/PatientInfoCard'
import GenericTable from '@renderer/components/organisms/GenericTable'
import PatientInfoModal from '@renderer/components/organisms/laboratory-management/PatientInfoModal'
import ReferralInfoModal from '@renderer/components/organisms/laboratory-management/ReferralInfoModal'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { App, Button, DatePicker, Form, Select, Space, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  groupServiceRequestsByEncounter,
  normalizeServiceRequests,
  type EncounterGroupRow,
  type NormalizedRequest,
  type ServiceRequestEntity
} from '../requests-data'
import {
  getAncillarySectionConfig,
  getAncillarySectionConfigByCategory,
  type AncillaryCategory,
  type AncillarySection
} from '../section-config'
import { buildPatientInfoCardData } from '../table-info'
import { SampleModal } from './SampleModal'

interface LaboratoryRequestsProps {
  fixedCategory?: AncillaryCategory
  routeBase?: string
  section?: AncillarySection
}

function normalizeList<T>(data: unknown): T[] {
  const raw = data as any
  return (raw?.result || raw?.data || raw || []) as T[]
}

function statusColor(status: string): string {
  if (status === 'ACTIVE' || status === 'REQUESTED') return 'blue'
  if (status === 'ON-HOLD' || status === 'IN_PROGRESS' || status === 'DRAFT') return 'orange'
  if (status === 'COMPLETED') return 'green'
  if (status === 'REVOKED' || status === 'ENTERED_IN_ERROR' || status === 'CANCELLED') return 'red'
  return 'default'
}

function priorityColor(priority: string): string {
  if (priority === 'STAT') return 'red'
  if (priority === 'URGENT' || priority === 'ASAP') return 'orange'
  return 'default'
}

function renderCategoryTag(category: string) {
  if (category === 'RADIOLOGY') {
    return (
      <Tag icon={<CameraOutlined />} color="purple">
        {category}
      </Tag>
    )
  }

  if (category === 'LABORATORY') {
    return (
      <Tag icon={<ExperimentOutlined />} color="orange">
        {category}
      </Tag>
    )
  }

  return (
    <Tag icon={<FileTextOutlined />} color="default">
      {category}
    </Tag>
  )
}

function renderPriorityTag(priority: string) {
  if (priority === 'STAT') {
    return (
      <Tag icon={<ThunderboltOutlined />} color="red">
        {priority}
      </Tag>
    )
  }

  if (priority === 'URGENT' || priority === 'ASAP') {
    return (
      <Tag icon={<ThunderboltOutlined />} color="orange">
        {priority}
      </Tag>
    )
  }

  return (
    <Tag icon={<ClockCircleOutlined />} color={priorityColor(priority)}>
      {priority}
    </Tag>
  )
}

function renderStatusTag(status: string) {
  if (status === 'ACTIVE' || status === 'REQUESTED') {
    return (
      <Tag icon={<ClockCircleOutlined />} color={statusColor(status)}>
        {status}
      </Tag>
    )
  }

  if (status === 'ON-HOLD') {
    return (
      <Tag icon={<PauseCircleOutlined />} color={statusColor(status)}>
        {status}
      </Tag>
    )
  }

  if (status === 'IN_PROGRESS' || status === 'DRAFT') {
    return (
      <Tag icon={<SyncOutlined spin={status === 'IN_PROGRESS'} />} color={statusColor(status)}>
        {status}
      </Tag>
    )
  }

  if (status === 'COMPLETED') {
    return (
      <Tag icon={<CheckCircleOutlined />} color={statusColor(status)}>
        {status}
      </Tag>
    )
  }

  if (status === 'REVOKED' || status === 'ENTERED_IN_ERROR' || status === 'CANCELLED') {
    return (
      <Tag icon={<CloseCircleOutlined />} color={statusColor(status)}>
        {status}
      </Tag>
    )
  }

  return (
    <Tag icon={<FileTextOutlined />} color={statusColor(status)}>
      {status}
    </Tag>
  )
}

function canCollectSpecimen(record: NormalizedRequest): boolean {
  if (record.test.category !== 'LABORATORY') {
    return false
  }

  return record.status === 'ACTIVE' || record.status === 'REQUESTED'
}

function canInputResult(record: NormalizedRequest): boolean {
  return (
    record.status === 'ACTIVE' ||
    record.status === 'REQUESTED' ||
    record.status === 'ON-HOLD' ||
    record.status === 'IN_PROGRESS'
  )
}

function isEncounterInProgress(record: NormalizedRequest): boolean {
  return record.encounterStatus === 'IN_PROGRESS'
}

export default function LaboratoryRequests({
  fixedCategory = 'LABORATORY',
  routeBase,
  section
}: LaboratoryRequestsProps = {}) {
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const sectionConfig = section
    ? getAncillarySectionConfig(section)
    : getAncillarySectionConfigByCategory(fixedCategory)
  const activeRouteBase = routeBase || sectionConfig.routeBase
  const [searchParams, setSearchParams] = useState({
    fromDate: dayjs().startOf('day').toISOString(),
    toDate: dayjs().endOf('day').toISOString(),
    status: undefined as string | undefined
  })
  const [patientInfo, setPatientInfo] = useState<PatientInfoCardData | null>(null)
  const [referralInfo, setReferralInfo] = useState<{
    encounterId?: string
    sourcePoliName?: string
  } | null>(null)
  const [sampleId, setSampleId] = useState<string | null>(null)

  const requestQueryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '300',
      startDate: searchParams.fromDate,
      endDate: searchParams.toDate,
      include:
        'patient,categories,codes,encounter.poli,encounter.queueTicket.poli,encounter.partOf.poli,encounter.partOf.queueTicket.poli'
    }

    if (searchParams.status) {
      params.status = searchParams.status
    }

    return params
  }, [searchParams.fromDate, searchParams.toDate, searchParams.status])

  const {
    data: requestData,
    isLoading,
    isRefetching,
    refetch
  } = client.query.entity.useQuery(
    {
      model: 'serviceRequest',
      method: 'get',
      params: requestQueryParams
    },
    {
      enabled: !!searchParams.fromDate && !!searchParams.toDate,
      queryKey: ['laboratory-management-requests-v2', requestQueryParams]
    } as any
  )

  const normalizedRequests = useMemo<NormalizedRequest[]>(() => {
    const rows = normalizeList<ServiceRequestEntity>(requestData)
    return normalizeServiceRequests(rows, fixedCategory)
  }, [fixedCategory, requestData])

  const encounterGroups = useMemo<EncounterGroupRow[]>(() => {
    return groupServiceRequestsByEncounter(normalizedRequests)
  }, [normalizedRequests])

  const handleAction = (record: NormalizedRequest, action: 'specimen' | 'result') => {
    if (!isEncounterInProgress(record)) {
      modal.warning({
        title: 'Encounter belum dilayani',
        content: 'Encounter harus dilayani dulu sebelum input hasil.',
        okText: 'Mengerti'
      })
      return
    }

    if (action === 'specimen') {
      navigate(`${activeRouteBase}/requests/specimen`, {
        state: { requestId: record.id, sectionRouteBase: activeRouteBase, ...record }
      })
      return
    }

    navigate(`${activeRouteBase}/results/entry`, {
      state: { requestId: record.id, sectionRouteBase: activeRouteBase, ...record }
    })
  }

  const encounterColumns: ColumnsType<EncounterGroupRow> = [
    {
      title: 'Pasien',
      dataIndex: 'patient',
      key: 'patient',
      render: (patient: EncounterGroupRow['patient']) => (
        <div>
          <span className="text-gray-500 text-xs">{patient?.mrn || '-'} - </span>
          <span className="font-bold">{patient?.name || 'Unknown Patient'}</span>
        </div>
      )
    },
    {
      title: 'Jumlah Permintaan',
      key: 'count',
      render: (_, record) => record.requests.length
    },
    {
      title: 'Selesai',
      key: 'completed',
      render: (_, record) => {
        const completedCount = record.requests.filter(
          (request) => request.status === 'COMPLETED'
        ).length
        const totalCount = record.requests.length
        const allCompleted = totalCount > 0 && completedCount === totalCount

        return (
          <Tag color={allCompleted ? 'green' : 'default'}>
            {completedCount} / {totalCount}
          </Tag>
        )
      }
    }
  ]

  const requestColumns: ColumnsType<NormalizedRequest> = [
    {
      title: 'Tgl. Order',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 150,
      render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Pemeriksaan',
      dataIndex: 'test',
      key: 'test',
      render: (test: NormalizedRequest['test']) => (
        <span className="font-medium">{test?.display || '-'}</span>
      )
    },
    {
      title: 'Kategori',
      dataIndex: ['test', 'category'],
      key: 'category',
      width: 120,
      render: (category: string) => renderCategoryTag(category)
    },
    {
      title: 'Prioritas',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => renderPriorityTag(priority)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => renderStatusTag(status)
    }
  ]

  const onSearch = (values: { date?: dayjs.Dayjs; status?: string }) => {
    const date = values.date ? dayjs(values.date) : dayjs()
    setSearchParams({
      fromDate: date.startOf('day').toISOString(),
      toDate: date.endOf('day').toISOString(),
      status: values.status
    })
  }
  console.log(encounterGroups)
  return (
    <div className="p-4">
      <TableHeader
        title={sectionConfig.requestsTitle}
        subtitle={sectionConfig.requestsSubtitle}
        onSearch={onSearch}
        onRefresh={() => {
          refetch()
        }}
        loading={isLoading || isRefetching}
        action={
          <ExportButton
            data={encounterGroups as any}
            fileName={`service-request-${sectionConfig.section}`}
            title={sectionConfig.requestsExportTitle}
            columns={[
              { key: 'queueNumber', label: 'No. Antrian' },
              { key: 'patient.mrn', label: 'MRN' },
              { key: 'patient.name', label: 'Nama Pasien' },
              {
                key: 'requests',
                label: 'Jumlah Permintaan',
                render: (value) => `${(value as unknown[]).length}`
              },
              {
                key: 'requests',
                label: 'Selesai',
                render: (value) => {
                  const requests = value as { status: string }[]
                  const done = requests.filter((request) => request.status === 'COMPLETED').length
                  return `${done} / ${requests.length}`
                }
              }
            ]}
            nestedTable={{
              getChildren: (parent) => parent.requests as Record<string, unknown>[],
              columns: [
                {
                  key: 'requestedAt',
                  label: 'Tgl. Order',
                  render: (value) =>
                    value ? dayjs(value as string).format('DD/MM/YYYY HH:mm') : '-'
                },
                { key: 'test.display', label: 'Pemeriksaan' },
                { key: 'test.category', label: 'Kategori' },
                { key: 'priority', label: 'Prioritas' },
                { key: 'status', label: 'Status' }
              ]
            }}
          />
        }
      >
        <Form.Item name="date" label="Tanggal" initialValue={dayjs()} style={{ width: '100%' }}>
          <DatePicker allowClear={false} style={{ width: '100%' }} size="large" />
        </Form.Item>

        <Form.Item name="status" label="Status" style={{ width: '100%' }}>
          <Select placeholder="Semua Status" allowClear style={{ width: '100%' }} size="large">
            <Select.Option value="draft">Draft</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="on-hold">On Hold</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="revoked">Revoked</Select.Option>
            <Select.Option value="entered-in-error">Entered In Error</Select.Option>
            <Select.Option value="unknown">Unknown</Select.Option>
          </Select>
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={encounterColumns}
          dataSource={encounterGroups}
          rowKey="id"
          loading={isLoading || isRefetching}
          action={{
            title: 'Info',
            width: 120,
            render: (record) => (
              <div className="flex gap-2 justify-center">
                <Space size="small">
                  <Tooltip title="Info Pasien">
                    <Button
                      size="small"
                      icon={<ProfileOutlined />}
                      onClick={() =>
                        setPatientInfo(
                          buildPatientInfoCardData({
                            ...record.patient,
                            poliName: record.sourcePoliName,
                            visitDate: record.requests[0]?.requestedAt,
                            status: record.requests[0]?.encounterStatus
                          })
                        )
                      }
                    />
                  </Tooltip>
                  {record.sourcePoliName ? (
                    <Tooltip title="Info Rujukan">
                      <Button
                        size="small"
                        icon={<ApartmentOutlined />}
                        onClick={() =>
                          setReferralInfo({
                            encounterId: record?.encounter?.encounter?.partOfId,
                            sourcePoliName: record.sourcePoliName
                          })
                        }
                      />
                    </Tooltip>
                  ) : null}
                </Space>
                <Space size="small">
                  <Tooltip title="Lihat Sample">
                    <Button
                      size="small"
                      icon={<ProfileOutlined />}
                      onClick={() => {
                        setSampleId(record.id)
                      }}
                    />
                  </Tooltip>
                </Space>
              </div>
            )
          }}
          tableProps={{
            expandable: {
              expandedRowRender: (record: EncounterGroupRow) => (
                <div className="p-2 bg-gray-50">
                  <GenericTable
                    columns={requestColumns}
                    dataSource={record.requests}
                    rowKey="id"
                    action={{
                      title: 'Aksi',
                      width: 180,
                      items: (record: NormalizedRequest) => {
                        const actions: any[] = []

                        if (canInputResult(record)) {
                          actions.push({
                            label: 'Ambil Sampel',
                            icon: <ExperimentOutlined />,
                            tooltip: isEncounterInProgress(record)
                              ? undefined
                              : 'Encounter harus dilayani dulu sebelum input hasil',
                            onClick: () => handleAction(record, 'specimen')
                          })
                        }

                        if (canInputResult(record)) {
                          actions.push({
                            label: 'Input Hasil',
                            icon: <FileTextOutlined />,
                            type: 'primary',
                            tooltip: isEncounterInProgress(record)
                              ? undefined
                              : 'Encounter harus dilayani dulu sebelum input hasil',
                            onClick: () => handleAction(record, 'result')
                          })
                        }

                        return actions
                      }
                    }}
                  />
                </div>
              )
            }
          }}
        />
      </div>
      <PatientInfoModal
        open={!!patientInfo}
        onClose={() => setPatientInfo(null)}
        patientData={patientInfo}
      />
      <ReferralInfoModal
        open={!!referralInfo}
        onClose={() => setReferralInfo(null)}
        encounterId={referralInfo?.encounterId}
        sourcePoliName={referralInfo?.sourcePoliName}
      />

      <SampleModal id={sampleId} onClose={() => setSampleId(null)} />
    </div>
  )
}
