import { SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { useCreateServiceRequest } from '@renderer/hooks/query/use-service-request'
import { App, Button, Form, Input, Modal, Select, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import CreateAncillaryModal from '@renderer/components/organisms/laboratory-management/CreateAncillaryModal'
import CreateServiceRequestForm from '@renderer/components/organisms/laboratory-management/CreateServiceRequestForm'

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
  serviceUnitName?: string
  category?: string
  status?: string
  startTime?: string
  endTime?: string
  serviceRequestId?: string | number
}

type EncounterStatusValue = 'PLANNED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'

function normalizeList<T>(data: unknown): T[] {
  const raw = data as { result?: T[]; data?: T[] } | T[]
  return ((raw as { result?: T[]; data?: T[] })?.result ?? (raw as { data?: T[] })?.data ?? (raw as T[]) ?? [])
}

function mapEncounterCategoryToServiceRequest(category?: string): 'laboratory' | 'imaging' {
  return category === 'RADIOLOGY' ? 'imaging' : 'laboratory'
}

export default function LaboratoryQueue() {
  const { message } = App.useApp()

  const [searchText, setSearchText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isServiceRequestModalOpen, setIsServiceRequestModalOpen] = useState(false)
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterRow | null>(null)
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)
  const [statusForm] = Form.useForm()
  const [serviceRequestForm] = Form.useForm()

  const { createServiceRequest, isSubmitting: isSubmittingServiceRequest } = useCreateServiceRequest({
    encounterId: String(selectedEncounter?.id ?? ''),
    patientId: String(selectedEncounter?.patientId ?? ''),
    practitionerId: selectedEncounter?.practitionerId,
  })
  const selectedStatus = Form.useWatch('status', statusForm) as EncounterStatusValue | undefined

  const {
    data: encountersData,
    isLoading,
    isRefetching,
    refetch
  } = client.query.entity.useQuery({
    model: 'encounter',
    method: 'get',
    params: {
      category: 'LABORATORY'
    }
  })

  const filteredData = useMemo<EncounterRow[]>(() => {
    const data = normalizeList<EncounterRow>(encountersData)
    if (!searchText) return data

    return data.filter(
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
      render: (_, record) => (
        <div>
          <div className="font-medium text-blue-600">
            {record.patientName || record.patient?.name || 'Unknown Patient'}
          </div>
          <div className="text-xs text-gray-500">
            {record.patientMrNo || record.patient?.mrn || record.patientId}
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
      title: 'Waktu Mulai',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Unit Asal',
      key: 'unit',
      render: (_, record) =>
        record.queueTicket?.serviceUnit?.display || record.serviceUnitName || '-'
    },
    {
      title: 'Poli Asal',
      key: 'poli',
      render: (_, record) => record.queueTicket?.poli?.name || '-'
    },
    {
      title: 'Service Request',
      key: 'serviceRequestId',
      render: (_, record) => (record.serviceRequestId ? `SR#${record.serviceRequestId}` : '-')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status?.toUpperCase()}</Tag>
    }
  ]

  const onSearch = (values: { patientName?: string }) => {
    setSearchText(values.patientName || '')
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
      code: undefined,
      display: undefined,
      patientInstruction: undefined
    })
    setIsServiceRequestModalOpen(true)
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

      const result = await rpc.query.entity({
        model: 'encounter',
        path: String(selectedEncounter.id),
        method: 'put',
        body: payload
      })

      if (!result?.success) {
        throw new Error(result?.message || 'Gagal mengubah status encounter')
      }

      message.success('Status encounter berhasil diperbarui')
      closeStatusModal()
      await refetch()
    } catch (error: any) {
      if (error?.errorFields) return
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
      message.success('Service request baru berhasil dibuat')
      closeServiceRequestModal()
      await refetch()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || 'Gagal membuat service request')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="p-4">
      <TableHeader
        title="Management Penunjang (Lab & Rad)"
        subtitle="Daftar encounter aktif dan pembuatan encounter penunjang"
        onSearch={onSearch}
        onRefresh={() => {
          refetch()
        }}
        onCreate={() => {
          setIsModalOpen(true)
        }}
        createLabel="Registrasi Penunjang Baru"
        loading={isLoading || isRefetching}
      >
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
          loading={isLoading || isRefetching}
          action={{
            items: (record) => [
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

      <CreateAncillaryModal open={isModalOpen} onClose={handleCloseModal} />

      <Modal
        title={`Ubah Status Encounter${selectedEncounter?.id ? ` - ${selectedEncounter.id}` : ''}`}
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
        title={`Buat Service Request Baru${selectedEncounter?.id ? ` - ${selectedEncounter.id}` : ''}`}
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
