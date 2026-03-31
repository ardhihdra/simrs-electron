import {
  useServiceRequestByEncounter,
  useCreateServiceRequest
} from '../../hooks/query/use-service-request'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import GenericTable from '@renderer/components/organisms/GenericTable'
import CreateServiceRequestForm from '@renderer/components/organisms/laboratory-management/CreateServiceRequestForm'
import { Alert, Button, Form, Spin, Tag } from 'antd'
import { useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

interface LabRadOrderFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

interface ServiceRequestRow {
  id?: number
  identifier?: string
  categories?: { code?: string; display?: string }[]
  codes?: { code?: string; display?: string }[]
  priority?: string
  status?: string
  patientInstruction?: string
  createdAt?: string
}

const columns: ColumnsType<ServiceRequestRow> = [
  {
    title: 'Kategori',
    key: 'category',
    render: (_, record) => {
      const code = record.categories?.[0]?.code
      return <Tag color={code === 'laboratory' ? 'blue' : 'green'}>{code ?? '-'}</Tag>
    }
  },
  {
    title: 'Nama Pemeriksaan',
    key: 'display',
    render: (_, record) => record.codes?.[0]?.display ?? '-'
  },
  {
    title: 'Kode',
    key: 'code',
    render: (_, record) => record.codes?.[0]?.code ?? '-'
  },
  {
    title: 'Prioritas',
    key: 'priority',
    render: (_, record) => {
      const priority = record.priority
      const colors: Record<string, string> = {
        routine: 'default',
        urgent: 'orange',
        asap: 'red',
        stat: 'red'
      }
      return <Tag color={colors[priority ?? ''] ?? 'default'}>{priority?.toUpperCase() ?? '-'}</Tag>
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      const status = record.status
      const colors: Record<string, string> = {
        active: 'processing',
        completed: 'success',
        'on-hold': 'warning',
        cancelled: 'error'
      }
      return <Tag color={colors[status ?? ''] ?? 'default'}>{status ?? '-'}</Tag>
    }
  },
  {
    title: 'Instruksi Pasien',
    dataIndex: 'patientInstruction',
    key: 'patientInstruction',
    render: (val?: string) => val ?? '-'
  },
  {
    title: 'Waktu Order',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (val?: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
  }
]

export const LabRadOrderForm = ({ encounterId, patientData }: LabRadOrderFormProps) => {
  const [form] = Form.useForm()
  const [showForm, setShowForm] = useState(false)

  const { data: serviceRequestData, isLoading, isError } = useServiceRequestByEncounter(encounterId)
  const { createServiceRequest, isSubmitting } = useCreateServiceRequest({
    encounterId,
    patientId: patientData.patient.id,
    practitionerId: 1 // TODO: get from auth context — codebase-wide known limitation
  })

  const existingOrders: ServiceRequestRow[] = serviceRequestData?.result ?? []

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await createServiceRequest(values)
      form.resetFields()
      setShowForm(false)
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'errorFields' in error) return
      console.error('Error creating service request:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Pemeriksaan yang Sudah Diorder</span>
          {!showForm && (
            <Button type="primary" onClick={() => setShowForm(true)}>
              Tambah Penunjang Medis
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : isError ? (
          <Alert type="error" message="Gagal memuat data pemeriksaan" />
        ) : !showForm ? (
          <GenericTable<ServiceRequestRow>
            columns={columns}
            dataSource={existingOrders}
            rowKey={(record) =>
              String(record.id ?? record.identifier ?? record.codes?.[0]?.code ?? 'unknown')
            }
            tableProps={{ locale: { emptyText: 'Belum ada pemeriksaan yang diorder' } }}
          />
        ) : (
          <></>
        )}
      </div>

      {showForm && (
        <div>
          <div className="font-medium mb-2">Tambah Penunjang Medis</div>
          <CreateServiceRequestForm form={form} />
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={handleCancel}>Batal</Button>
            <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
              Simpan Penunjang Medis
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
