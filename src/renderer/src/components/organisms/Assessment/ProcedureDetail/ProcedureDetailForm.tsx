import {
  CheckCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import {
  useCreateMedicationDispense,
  useMedicationDispenseByEncounter
} from '@renderer/hooks/query/use-medication-dispense'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { MedicationDispenseStatus } from 'simrs-types'

const { TextArea } = Input

interface ProcedureDetailFormProps {
  encounterId: string
  patientData: any
}

interface ItemAttributes {
  id?: number
  nama?: string
  kode?: string
  kodeUnit?: string
  unit?: {
    id?: number
    kode?: string
    nama?: string
  } | null
  itemCategoryId?: number | null
  category?: {
    id?: number
    name?: string | null
    categoryType?: string | null
  } | null
  stock?: number
}

type ItemListResponse = {
  success: boolean
  result?: ItemAttributes[]
  message?: string
}

const ROUTE_OPTIONS = [
  { label: 'IV (Intravena)', value: 'IV' },
  { label: 'IM (Intramuskular)', value: 'IM' },
  { label: 'SC (Subkutan)', value: 'SC' },
  { label: 'Oral', value: 'Oral' },
  { label: 'Topikal', value: 'Topikal' },
  { label: 'Inhalasi', value: 'Inhalasi' }
]

export const ProcedureDetailForm = ({ encounterId, patientData }: ProcedureDetailFormProps) => {
  const { message } = App.useApp()
  const [modalForm] = Form.useForm()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [items, setItems] = useState<ItemAttributes[]>([])
  const [itemCategories, setItemCategories] = useState<any[]>([])

  const patientId = patientData?.patient?.id || patientData?.id || ''

  const { data: performers = [], isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])

  const { data: procedureRes, isLoading: isLoadingList } = useMedicationDispenseByEncounter(
    patientId,
    encounterId
  )

  const procedureList = procedureRes?.data || []

  const createMutation = useCreateMedicationDispense()
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: number
      status: MedicationDispenseStatus
      whenHandedOver?: string
    }) => {
      const fn = window.api?.query?.medicationDispense?.update
      if (!fn) throw new Error('API update procedure detail tidak tersedia')
      const res = await fn(payload as any)
      if (!res.success) throw new Error(res.error || 'Gagal update tindakan')
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['medication-dispense', 'by-encounter', encounterId]
      })
      message.success('Status tindakan berhasil diupdate')
    },
    onError: (error: any) => {
      message.error(error?.message || 'Gagal update status tindakan')
    }
  })

  useEffect(() => {
    if (encounterId) {
      loadItems()
      loadItemCategories()
    }
  }, [encounterId])

  const loadItems = async () => {
    try {
      const api = (window.api?.query as { item?: { list: () => Promise<ItemListResponse> } }).item
      if (api?.list) {
        const response = await api.list()
        if (response.success && response.result) {
          setItems(response.result)
        }
      }
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  const loadItemCategories = async () => {
    try {
      const fn = (window.api?.query as any)?.medicineCategory?.list
      if (fn) {
        const response = await fn()
        if (response.success && response.result) {
          setItemCategories(response.result)
        }
      }
    } catch (error) {
      console.error('Error loading item categories:', error)
    }
  }

  const itemOptions = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(items) ? items : []

    return source
      .filter((item) => typeof item.id === 'number')
      .map((item) => {
        const unitCodeRaw = typeof item.kodeUnit === 'string' ? item.kodeUnit : item.unit?.kode
        const unitCode = unitCodeRaw ? unitCodeRaw.trim().toUpperCase() : ''
        const unitName = item.unit?.nama ?? unitCode
        const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
        const name = item.nama ?? code
        const displayName = name || code || String(item.id)
        const label = unitName ? `${displayName} (${unitName})` : displayName

        return {
          value: item.id as number,
          label,
          unitCode,
          rawData: item
        }
      })
      .filter((entry) => entry.unitCode.length > 0)
  }, [items])

  const performerOptions = performers.map((p: any) => ({
    id: p.id,
    name: p.name || p.namaLengkap
  }))

  const handleSubmit = async (values: any) => {
    try {
      const selectedItem = itemOptions.find((opt) => opt.value === values.itemId)
      const uom = values.uom || selectedItem?.unitCode || undefined

      await createMutation.mutateAsync({
        encounterId,
        patientId,
        itemId: values.itemId,
        status: 'in-progress',
        quantity: {
          value: Number(values.quantity),
          unit: uom
        },
        dosageInstruction: values.route ? [{ text: values.route }] : [],
        note: values.notes || null,
        performerId: values.performerId ? Number(values.performerId) : null
      })

      message.success('Detail tindakan berhasil disimpan')
      modalForm.resetFields()
      setIsModalOpen(false)
    } catch (err: any) {
      message.error(err?.message || 'Gagal menyimpan detail tindakan')
    }
  }

  const handleDelete = (id: number) => {
    updateMutation.mutate({ id, status: MedicationDispenseStatus.ENTERED_IN_ERROR })
  }

  const handleComplete = (id: number) => {
    updateMutation.mutate({
      id,
      status: MedicationDispenseStatus.COMPLETED,
      whenHandedOver: new Date().toISOString()
    })
  }

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tgl / Jam',
      dataIndex: 'whenPrepared',
      key: 'whenPrepared',
      width: 140,
      render: (date: string, record: any) => {
        const displayDate = date || record.createdAt || new Date()
        return (
          <div className="flex flex-col">
            <span className="font-semibold">{dayjs(displayDate).format('DD/MM/YYYY')}</span>
            <span className="text-gray-500 text-xs">{dayjs(displayDate).format('HH:mm')}</span>
          </div>
        )
      }
    },
    {
      title: 'Item / Tindakan',
      key: 'detail',
      render: (_: any, record: any) => {
        const routeText = record.dosageInstruction?.[0]?.text
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="font-semibold">
                {record.medication?.name || record.medication?.nama || `Item ${record.itemId}`}
              </span>
            </div>
            <div className="flex flex-wrap text-gray-600 text-xs mt-1 gap-x-4 gap-y-1">
              <span>
                <span className="text-gray-400">Jml:</span> {Number(record.quantity?.value || 0)}{' '}
                {record.quantity?.unit || record.medication?.uom || ''}
              </span>
              {routeText && (
                <span>
                  <span className="text-gray-400">Rute:</span> {routeText}
                </span>
              )}
            </div>
            {record.note && (
              <div className="mt-1 bg-gray-50 border border-gray-100 p-2 rounded text-xs italic text-gray-500">
                {record.note}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Pelaksana',
      key: 'performer',
      width: 160,
      render: (_: any, record: any) => {
        const found = performers.find((p: any) => p.id === record.performerId)
        const name = record.performer?.name || record.performer?.namaLengkap || found?.name || '-'
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{name}</span>
            {record.status === 'completed' && (
              <Tag color="green" className="text-[10px] w-fit">
                Selesai
              </Tag>
            )}
          </div>
        )
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => {
        if (record.status === 'entered-in-error' || record.status === 'cancelled') {
          return <span className="text-red-500 text-xs italic">Dibatalkan</span>
        }

        return (
          <Space size="small">
            {record.status !== 'completed' && (
              <Popconfirm
                title="Selesaikan tindakan ini?"
                okText="Ya, Selesai"
                cancelText="Batal"
                onConfirm={() => handleComplete(record.id)}
              >
                <Tooltip title="Tandai Selesai / Diserahkan">
                  <Button
                    type="text"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    icon={<CheckCircleOutlined />}
                    loading={updateMutation.isPending}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            <Popconfirm
              title="Batalkan detail tindakan ini? Stok obat otomatis kembali."
              okText="Ya, Batalkan"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Batalkan (Void/Return)">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={updateMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* History Table Card */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            Detail Tindakan & Terapi
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Catat Tindakan Baru
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Spin spinning={isLoadingList}>
          <Table
            columns={columns}
            dataSource={procedureList as any[]}
            rowKey="id"
            pagination={false}
            className="border-none"
            locale={{ emptyText: 'Belum ada detail tindakan yang dicatat' }}
          />
        </Spin>
      </Card>

      <Modal
        title="Catat Detail Tindakan / Terapi"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          modalForm.resetFields()
        }}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={createMutation.isPending}
            onClick={() => modalForm.submit()}
          >
            Simpan
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSubmit}
          className="flex! flex-col! gap-4!"
          initialValues={{ quantity: 1, assessment_date: dayjs() }}
        >
          <AssessmentHeader performers={performerOptions} loading={isLoadingPerformers} />

          <Form.Item
            name="itemId"
            label={<span className="font-bold">Nama Item / Tindakan</span>}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <Select
              options={itemOptions}
              placeholder="Pilih Item (Obat/Barang)"
              showSearch
              optionFilterProp="label"
              onChange={(_val, option: any) => {
                // Auto-fill UOM if available
                if (option?.unitCode) {
                  modalForm.setFieldValue('uom', option.unitCode)
                }
              }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label={<span className="font-bold">Jumlah</span>}
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <InputNumber min={0.1} step={0.5} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="uom" label={<span className="font-bold">Satuan</span>}>
                <Input placeholder="Cth: Ampul, Vial, Fls" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="route" label={<span className="font-bold">Route Pemberian</span>}>
                <Select options={ROUTE_OPTIONS} placeholder="Pilih Route" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label={<span className="font-bold">Catatan</span>}>
            <TextArea rows={3} placeholder="Catatan tambahan tindakan..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProcedureDetailForm
