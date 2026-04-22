import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
  ProfileOutlined,
  SearchOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { PatientInfoCardData } from '@renderer/components/molecules/PatientInfoCard'
import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import GenericTable from '@renderer/components/organisms/GenericTable'
import CreateAncillaryModal from '@renderer/components/organisms/laboratory-management/CreateAncillaryModal'
import CreateServiceRequestForm from '@renderer/components/organisms/laboratory-management/CreateServiceRequestForm'
import PatientInfoModal from '@renderer/components/organisms/laboratory-management/PatientInfoModal'
import ReferralInfoModal from '@renderer/components/organisms/laboratory-management/ReferralInfoModal'
import { TableHeader } from '@renderer/components/TableHeader'
import { useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { useCreateServiceRequest } from '@renderer/hooks/query/use-service-request'
import { client } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Dropdown, Form, Input, Modal, Select, Space, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
  getAncillarySectionConfig,
  getAncillarySectionConfigByCategory,
  type AncillaryCategory,
  type AncillarySection
} from '../section-config'
import { buildAncillaryQueuePatientInfoCardData, type ReferralInfoSource } from '../table-info'
import {
  filterAndSortQueueEncounters,
  findNextEncounterToServe,
  normalizeEncounterStatus,
  type EncounterStatusFilter
} from './queue-helpers'

interface EncounterRow {
  id: string
  patientId?: string
  practitionerId?: number
  patientName?: string
  patientMrNo?: string
  patient?: {
    name?: string
    mrn?: string
    medicalRecordNumber?: string
    nik?: string
    birthDate?: string
    gender?: string
    address?: string
    religion?: string
  }
  partOfId?: string
  partOf?: {
    poli?: {
      name?: string
    }
    queueTicket?: {
      poli?: {
        name?: string
      }
    }
    referrals?: ReferralInfoSource[]
  }
  referrals?: ReferralInfoSource[]
  queueTicket?: {
    paymentMethod?: string
    serviceUnit?: {
      display?: string
    }
    practitioner?: {
      namaLengkap?: string
      name?: string
    }
    poli?: {
      name?: string
    }
  }
  practitioner?: {
    namaLengkap?: string
    fullName?: string
    display?: string
    name?: string
  } | null
  doctorName?: string
  poli?: {
    name?: string
  }
  serviceUnitName?: string
  category?: string
  status?: string
  startTime?: string
  endTime?: string
  serviceRequestId?: string | number
  visitDate?: string
  createdAt?: string
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

export default function LaboratoryQueue({ fixedCategory, section }: LaboratoryQueueProps = {}) {
  const { message } = App.useApp()

  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false)
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterRow | null>(null)
  const [nextEncounterModal, setNextEncounterModal] = useState<EncounterRow | null>(null)
  const [patientInfo, setPatientInfo] = useState<PatientInfoCardData | null>(null)
  const [referralInfo, setReferralInfo] = useState<{
    encounterId?: string
    sourcePoliName?: string
  } | null>(null)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [isServingEncounter, setIsServingEncounter] = useState(false)
  const [statusFilter, setStatusFilter] = useState<EncounterStatusFilter>('ALL')
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
      category: activeCategory,
      sortBy: 'createdAt',
      sortOrder: 'asc',
      items: '100',
      include:
        'patient,poli,queueTicket.poli,queueTicket.practitioner,referrals.referringPractitioner,referrals.sourceLocation,partOf.poli,partOf.queueTicket.poli,partOf.referrals.referringPractitioner,partOf.referrals.sourceLocation'
    }
  })

  const filteredData = useMemo<EncounterRow[]>(() => {
    const data = encountersData ? normalizeList<EncounterRow>(encountersData || []) : []
    return filterAndSortQueueEncounters(data, { searchText, statusFilter })
  }, [encountersData, searchText, statusFilter])

  const nextEncounterToServe = useMemo(() => findNextEncounterToServe(filteredData), [filteredData])

  const columns: ColumnsType<EncounterRow> = [
    {
      title: 'Pasien',
      key: 'patient',
      render: (_, record: any) => (
        <div>
          <div className="font-medium text-blue-600">
            {record.patientName || record.patient?.name || 'Unknown Patient'}
          </div>
          <div className="text-xs text-gray-500">
            {record.patient?.medicalRecordNumber ||
              record.patientMrNo ||
              record.patient?.mrn ||
              '-'}
          </div>
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
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderEncounterStatusTag(status)
    }
  ]

  const getPatientInfo = (record: EncounterRow): PatientInfoCardData => {
    return buildAncillaryQueuePatientInfoCardData(record)
  }

  const getReferralSourcePoliName = (record: EncounterRow): string | undefined => {
    return (
      record.poli?.name ||
      record.queueTicket?.poli?.name ||
      record.partOf?.poli?.name ||
      record.partOf?.queueTicket?.poli?.name ||
      undefined
    )
  }

  const onSearch = (values: {
    patientName?: string
    category?: QueueCategoryFilter
    status?: EncounterStatusFilter
  }) => {
    setSearchText(values.patientName || '')
    setQueueCategory(fixedCategory || values.category || 'LABORATORY')
    setStatusFilter(values.status || 'ALL')
  }

  const handleResetFilters = () => {
    setSearchText('')
    setQueueCategory(fixedCategory || 'LABORATORY')
    setStatusFilter('ALL')
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

  const handleServeAndOpenServiceRequest = async (record: EncounterRow) => {
    const served = await handleServeEncounter(record)
    if (!served) return

    handleOpenServiceRequestModal(record)
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
      return false
    }

    if (currentStatus === 'FINISHED' || currentStatus === 'CANCELLED') {
      message.warning('Encounter dengan status FINISHED/CANCELLED tidak dapat dilayani')
      return false
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
      return true
    } catch (error: any) {
      message.error(error?.message || 'Gagal melayani encounter')
      return false
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
    refetch()
    setIsModalOpen(false)
  }

  return (
    <div className="p-4">
      <TableHeader
        title={sectionConfig.queueTitle}
        icon={ProfileOutlined}
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
        action={
          <Button
            onClick={() => setNextEncounterModal(nextEncounterToServe)}
            disabled={!nextEncounterToServe || isServingEncounter}
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff'
            }}
          >
            Pasien Selanjutnya
          </Button>
        }
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
        <Form.Item initialValue="ALL" name="status" style={{ minWidth: 220 }} label="Status">
          <Select
            size="large"
            options={[
              { value: 'ALL', label: 'Semua Status' },
              { value: 'PLANNED', label: 'PLANNED' },
              { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
              { value: 'FINISHED', label: 'FINISHED' },
              { value: 'CANCELLED', label: 'CANCELLED' }
            ]}
          />
        </Form.Item>
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
            render: (record) => {
              const sourcePoliName = getReferralSourcePoliName(record)
              const menuItems = [
                {
                  key: 'serve',
                  label: 'Layani',
                  disabled: normalizeEncounterStatus(record.status) !== 'PLANNED',
                  onClick: () => handleServeAndOpenServiceRequest(record)
                },
                {
                  key: 'finish',
                  label: 'Selesai',
                  disabled: !['PLANNED', 'IN_PROGRESS'].includes(
                    String(normalizeEncounterStatus(record.status) || '')
                  ),
                  onClick: () => handleFinishEncounter(record)
                },
                {
                  key: 'status',
                  label: 'Ubah Status',
                  onClick: () => handleOpenStatusModal(record)
                },
                {
                  key: 'service-request',
                  label: 'Buat Service Request',
                  onClick: () => handleOpenServiceRequestModal(record)
                }
              ]

              return (
                <Space size="small">
                  <Tooltip title="Info Pasien">
                    <Button
                      size="small"
                      icon={<ProfileOutlined />}
                      onClick={() => setPatientInfo(getPatientInfo(record))}
                    />
                  </Tooltip>
                  {sourcePoliName ? (
                    <Tooltip title="Info Rujukan">
                      <Button
                        size="small"
                        icon={<ApartmentOutlined />}
                        onClick={() =>
                          setReferralInfo({
                            encounterId: String(record.partOfId || ''),
                            sourcePoliName
                          })
                        }
                      />
                    </Tooltip>
                  ) : null}
                  <Dropdown
                    menu={{
                      items: menuItems.map((item) => ({
                        key: item.key,
                        label: item.label,
                        disabled: item.disabled,
                        onClick: item.onClick
                      }))
                    }}
                    trigger={['click']}
                  >
                    <Button size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                </Space>
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
      <Modal
        title="Layani Pasien Selanjutnya"
        open={!!nextEncounterModal}
        onCancel={() => setNextEncounterModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setNextEncounterModal(null)}>
            Cancel
          </Button>,
          <Button
            key="serve"
            type="primary"
            loading={isServingEncounter}
            onClick={async () => {
              if (!nextEncounterModal) return

              const encounterToServe = nextEncounterModal
              setNextEncounterModal(null)
              await handleServeAndOpenServiceRequest(encounterToServe)
            }}
          >
            Layani
          </Button>
        ]}
        width={720}
        centered
        styles={{
          body: {
            padding: 0
          }
        }}
      >
        {nextEncounterModal ? (
          <PatientInfoCard
            patientData={getPatientInfo(nextEncounterModal)}
            sections={{ showAllergies: false }}
          />
        ) : null}
      </Modal>
      <ReferralInfoModal
        open={!!referralInfo}
        onClose={() => setReferralInfo(null)}
        encounterId={referralInfo?.encounterId}
        sourcePoliName={referralInfo?.sourcePoliName}
      />

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
        width={800}
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
        <CreateServiceRequestForm
          form={serviceRequestForm}
          fixedCategory={mapEncounterCategoryToServiceRequest(selectedEncounter?.category)}
        />
      </Modal>
    </div>
  )
}
