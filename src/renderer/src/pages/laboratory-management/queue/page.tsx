import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import CreateAncillaryModal from '@renderer/components/organisms/laboratory-management/CreateAncillaryModal'
import CreateServiceRequestForm from '@renderer/components/organisms/laboratory-management/CreateServiceRequestForm'
import { TableHeader } from '@renderer/components/TableHeader'
import { useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { useCreateServiceRequest } from '@renderer/hooks/query/use-service-request'
import { client } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Form, Input, Modal, Select, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
  type AncillaryCategory,
  getAncillarySectionConfig,
  getAncillarySectionConfigByCategory,
  type AncillarySection
} from '../section-config'

interface EncounterRow {
  id: string
  patientId?: string
  practitionerId?: number
  patientName?: string
  patientMrNo?: string
  patient?: {
    name?: string
    mrn?: string
  }
  queueTicket?: {
    serviceUnit?: {
      display?: string
    }
    poli?: {
      name?: string
    }
  }
  poli?: {
    name?: string
  }
  serviceUnitName?: string
  category?: string
  status?: string
  startTime?: string
  endTime?: string
  serviceRequestId?: string | number
}

type EncounterStatusValue = 'PLANNED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'
type QueueCategoryFilter = AncillaryCategory

function normalizeList<T>(data: unknown): T[] {
  const raw = data as { result?: T[]; data?: T[] } | T[]
  return (
    (raw as { result?: T[]; data?: T[] })?.result ??
    (raw as { data?: T[] })?.data ??
    (raw as T[]) ??
    []
  )
}

function mapEncounterCategoryToServiceRequest(category?: string): 'laboratory' | 'radiology' {
  return category === 'RADIOLOGY' ? 'radiology' : 'laboratory'
}

function normalizeEncounterStatus(status?: string): EncounterStatusValue | undefined {
  const normalized = String(status || '').toUpperCase()
  if (
    normalized === 'PLANNED' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'FINISHED' ||
    normalized === 'CANCELLED'
  ) {
    return normalized
  }
  return undefined
}

function renderEncounterStatusTag(status?: string) {
  const normalizedStatus = status?.toUpperCase() ?? '-'

  if (normalizedStatus === 'PLANNED') {
    return (
      <Tag icon={<ClockCircleOutlined />} color="default">
        {normalizedStatus}
      </Tag>
    )
  }

  if (normalizedStatus === 'IN_PROGRESS') {
    return (
      <Tag icon={<SyncOutlined spin />} color="processing">
        {normalizedStatus}
      </Tag>
    )
  }

  if (normalizedStatus === 'FINISHED') {
    return (
      <Tag icon={<CheckCircleOutlined />} color="success">
        {normalizedStatus}
      </Tag>
    )
  }

  if (normalizedStatus === 'CANCELLED') {
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        {normalizedStatus}
      </Tag>
    )
  }

  return (
    <Tag icon={<ClockCircleOutlined />} color="blue">
      {normalizedStatus}
    </Tag>
  )
}

interface LaboratoryQueueProps {
  fixedCategory?: QueueCategoryFilter
  section?: AncillarySection
}

export default function LaboratoryQueue({
  fixedCategory,
  section
}: LaboratoryQueueProps = {}) {
  const { message } = App.useApp()

  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false)
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterRow | null>(null)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [isServingEncounter, setIsServingEncounter] = useState(false)
  const [queueCategory, setQueueCategory] = useState<QueueCategoryFilter>(
    fixedCategory || 'LABORATORY'
  )
  const [statusForm] = Form.useForm()
  const [serviceRequestForm] = Form.useForm()

  const updateEncounter = useUpdateEncounter()
  const { createServiceRequest, isSubmitting: isSubmittingServiceRequest } =
    useCreateServiceRequest({
      encounterId: String(selectedEncounter?.id ?? ''),
      patientId: String(selectedEncounter?.patientId ?? ''),
      practitionerId: selectedEncounter?.practitionerId
    })
  const selectedStatus = Form.useWatch('status', statusForm) as EncounterStatusValue | undefined
  const activeCategory = fixedCategory || queueCategory
  const sectionConfig = section
    ? getAncillarySectionConfig(section)
    : getAncillarySectionConfigByCategory(activeCategory)

  const {
    data: encountersData,
    isLoading,
    isRefetching,
    refetch
  } = client.query.entity.useQuery({
    model: 'encounter',
    method: 'get',
    params: {
      category: activeCategory
    }
  })

  const filteredData = useMemo<EncounterRow[]>(() => {
    const data = encountersData ? normalizeList<EncounterRow>(encountersData) : []
    if (!searchText) return data

    return data?.filter(
      (item) =>
        (item.patientName || item.patient?.name)
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        (item.patientMrNo || item.patient?.mrn || '')
          .toLowerCase()
          .includes(searchText.toLowerCase())
    )
  }, [encountersData, searchText])

  const columns: ColumnsType<EncounterRow> = [
    {
      title: 'Pasien',
      key: 'patient',
      render: (_, record: any) => (
        <div>
          <div className="font-medium text-blue-600">
            {record.patientName || record.patient?.name || 'Unknown Patient'}
          </div>
          <div className="text-xs text-gray-500">{record.patient?.medicalRecordNumber || '-'}</div>
        </div>
      )
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        const colors = {
          CLINICAL: 'cyan',
          LABORATORY: 'orange',
          RADIOLOGY: 'purple'
        }
        return <Tag color={colors[cat] || 'default'}>{cat}</Tag>
      }
    },
    {
      title: 'Poli Asal',
      key: 'poli',
      render: (_, record) => (
        <span>{record.poli?.name || record.queueTicket?.poli?.name || '-'}</span>
      )
    },
    {
      title: 'Waktu Mulai',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Waktu Selesai',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
    },
    // {
    //   title: 'Service Request',
    //   key: 'serviceRequestId',
    //   render: (_, record) => (record.serviceRequestId ? `SR#${record.serviceRequestId}` : '-')
    // },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderEncounterStatusTag(status)
    }
  ]

  const onSearch = (values: { patientName?: string; category?: QueueCategoryFilter }) => {
    setSearchText(values.patientName || '')
    setQueueCategory(fixedCategory || values.category || 'LABORATORY')
  }

  const handleResetFilters = () => {
    setSearchText('')
    setQueueCategory(fixedCategory || 'LABORATORY')
  }

  const closeStatusModal = () => {
    setIsStatusModalOpen(false)
    statusForm.resetFields()
    setSelectedEncounter(null)
  }

  const closeServiceRequestModal = () => {
    setIsServiceRequestModalOpen(false)
    serviceRequestForm.resetFields()
    // setTerminologySearch('')
    setSelectedEncounter(null)
  }

  const handleOpenStatusModal = (record: EncounterRow) => {
    setSelectedEncounter(record)
    statusForm.setFieldsValue({
      status: record.status || 'PLANNED',
      reason: ''
    })
    setIsStatusModalOpen(true)
  }

  const handleOpenServiceRequestModal = (record: EncounterRow) => {
    if (!record.patientId) {
      message.error('Encounter tidak memiliki patientId, tidak bisa membuat service request')
      return
    }

    setSelectedEncounter(record)
    serviceRequestForm.setFieldsValue({
      category: mapEncounterCategoryToServiceRequest(record.category),
      priority: 'routine',
      system: 'http://loinc.org',
      selectedServiceRequestCodes: [],
      patientInstruction: undefined
    })
    setIsServiceRequestModalOpen(true)
  }

  const updateEncounterStatus = async (
    encounterId: string,
    status: EncounterStatusValue,
    extra: Record<string, unknown> = {}
  ) => {
    const result = await updateEncounter.mutateAsync({
      id: encounterId,
      status,
      ...extra
    } as any)

    if (result?.success === false) {
      throw new Error(result?.error || `Gagal mengubah status encounter ke ${status}`)
    }
  }

  const handleServeEncounter = async (record: EncounterRow) => {
    if (!record.id) return

    const currentStatus = normalizeEncounterStatus(record.status)
    if (currentStatus === 'IN_PROGRESS') {
      message.info('Encounter sudah dalam status IN_PROGRESS')
      return
    }

    if (currentStatus === 'FINISHED' || currentStatus === 'CANCELLED') {
      message.warning('Encounter dengan status FINISHED/CANCELLED tidak dapat dilayani')
      return
    }

    try {
      setIsServingEncounter(true)
      const payload: Record<string, unknown> = {}

      if (!record.startTime) {
        payload.startTime = dayjs().toISOString()
      }

      await updateEncounterStatus(String(record.id), 'IN_PROGRESS', payload)

      message.success('Encounter berhasil dilayani (IN_PROGRESS)')
      await refetch()
    } catch (error: any) {
      message.error(error?.message || 'Gagal melayani encounter')
    } finally {
      setIsServingEncounter(false)
    }
  }

  const handleFinishEncounter = async (record: EncounterRow) => {
    if (!record.id) return

    const currentStatus = normalizeEncounterStatus(record.status)
    if (currentStatus === 'FINISHED') {
      message.info('Encounter sudah berstatus FINISHED')
      return
    }

    if (currentStatus === 'CANCELLED') {
      message.warning('Encounter dengan status CANCELLED tidak dapat diselesaikan')
      return
    }

    try {
      setIsServingEncounter(true)
      const now = dayjs().toISOString()
      const payload: Record<string, unknown> = {
        endTime: record.endTime || now
      }

      if (!record.startTime) {
        payload.startTime = now
      }

      await updateEncounterStatus(String(record.id), 'FINISHED', payload)

      message.success('Encounter berhasil diselesaikan (FINISHED)')
      await refetch()
    } catch (error: any) {
      message.error(error?.message || 'Gagal menyelesaikan encounter')
    } finally {
      setIsServingEncounter(false)
    }
  }

  const submitEncounterStatus = async () => {
    if (!selectedEncounter?.id) return

    try {
      const values = await statusForm.validateFields()
      setIsSubmittingStatus(true)

      const payload: Record<string, unknown> = {
        status: values.status as EncounterStatusValue
      }

      if (values.reason) {
        payload.reason = String(values.reason)
      }

      if (values.status === 'FINISHED' && !selectedEncounter.endTime) {
        payload.endTime = dayjs().toISOString()
      }

      await updateEncounterStatus(
        String(selectedEncounter.id),
        values.status as EncounterStatusValue,
        payload
      )

      message.success('Status encounter berhasil diperbarui')
      closeStatusModal()
      await refetch()
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        notifyFormValidationError(
          statusForm,
          message,
          error,
          'Lengkapi data status encounter terlebih dahulu.'
        )
        return
      }
      message.error(error?.message || 'Gagal mengubah status encounter')
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  const submitServiceRequestCreate = async () => {
    if (!selectedEncounter?.id || !selectedEncounter.patientId) return
    try {
      const values = await serviceRequestForm.validateFields()
      await createServiceRequest(values)
      closeServiceRequestModal()
      await refetch()
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        notifyFormValidationError(
          serviceRequestForm,
          message,
          error,
          'Lengkapi data service request terlebih dahulu.'
        )
        return
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  console.log('filterData', filteredData)
  return (
    <div className="p-4">
      <TableHeader
        title={sectionConfig.queueTitle}
        subtitle={sectionConfig.queueSubtitle}
        onSearch={onSearch}
        onReset={handleResetFilters}
        onRefresh={() => {
          refetch()
        }}
        onCreate={() => {
          setIsModalOpen(true)
        }}
        createLabel={sectionConfig.queueCreateLabel}
        loading={isLoading || isRefetching}
      >
        {!fixedCategory ? (
          <Form.Item
            initialValue="LABORATORY"
            name="category"
            style={{ minWidth: 220 }}
            label="Kategori Antrian"
          >
            <Select
              size="large"
              onChange={(value: QueueCategoryFilter) => setQueueCategory(value)}
              options={[
                { value: 'LABORATORY', label: 'Laboratorium' },
                { value: 'RADIOLOGY', label: 'Radiologi' }
              ]}
            />
          </Form.Item>
        ) : null}
        <Form.Item name="patientName" style={{ width: '100%' }} label="Pasien">
          <Input
            placeholder="Cari Nama / No. RM Pasien yang sedang dilayani"
            allowClear
            suffix={<SearchOutlined />}
            size="large"
          />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading || isRefetching || isServingEncounter}
          action={{
            items: (record) => [
              {
                label: 'Layani',
                onClick: () => handleServeEncounter(record),
                disabled: normalizeEncounterStatus(record.status) !== 'PLANNED'
              },
              {
                label: 'Selesai',
                danger: true,
                confirm: {
                  title: 'Selesaikan encounter ini?',
                  description: 'Status encounter akan diubah menjadi FINISHED.',
                  okText: 'Ya, Selesai',
                  cancelText: 'Batal'
                },
                onClick: () => handleFinishEncounter(record),
                disabled: !['PLANNED', 'IN_PROGRESS'].includes(
                  String(normalizeEncounterStatus(record.status) || '')
                )
              },
              {
                label: 'Ubah Status',
                onClick: () => handleOpenStatusModal(record)
              },
              {
                label: 'Buat Service Request',
                onClick: () => handleOpenServiceRequestModal(record)
              }
            ]
          }}
        />
      </div>

      <CreateAncillaryModal
        open={isModalOpen}
        onClose={handleCloseModal}
        fixedCategory={fixedCategory}
      />

      <Modal
        title={`Ubah Status Encounter`}
        open={isStatusModalOpen}
        onCancel={closeStatusModal}
        footer={[
          <Button key="cancel" onClick={closeStatusModal}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmittingStatus}
            onClick={submitEncounterStatus}
          >
            Simpan Status
          </Button>
        ]}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="Status Encounter"
            rules={[{ required: true, message: 'Harap pilih status encounter' }]}
          >
            <Select
              options={[
                { value: 'PLANNED', label: 'PLANNED' },
                { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
                { value: 'FINISHED', label: 'FINISHED' },
                { value: 'CANCELLED', label: 'CANCELLED' }
              ]}
            />
          </Form.Item>

          {selectedStatus === 'CANCELLED' ? (
            <Form.Item name="reason" label="Alasan Cancel (opsional)">
              <Input placeholder="Masukkan alasan pembatalan encounter" />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={`Buat Service Request Baru`}
        open={isServiceRequestModalOpen}
        onCancel={closeServiceRequestModal}
        footer={[
          <Button key="cancel" onClick={closeServiceRequestModal}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmittingServiceRequest}
            onClick={submitServiceRequestCreate}
          >
            Simpan Service Request
          </Button>
        ]}
      >
        <CreateServiceRequestForm form={serviceRequestForm} />
      </Modal>
    </div>
  )
}
