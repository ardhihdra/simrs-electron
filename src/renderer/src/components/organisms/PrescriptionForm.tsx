import { useState, useEffect, useMemo } from 'react'
import { Form, Button, App, Tabs, Space, Card } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { CompoundPrescriptionForm } from './CompoundPrescriptionForm'
import { ItemPrescriptionForm } from './ItemPrescriptionForm'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { PatientWithMedicalRecord } from '@renderer/types/doctor.types'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { HistoryOutlined } from '@ant-design/icons'
import { Table, Modal, Tag, Typography } from 'antd'
import { useMedicationRequestByEncounter } from '@renderer/hooks/query/use-medication-request'

const { Text } = Typography

enum MedicationRequestStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  STOPPED = 'stopped',
  DRAFT = 'draft',
  UNKNOWN = 'unknown'
}

enum MedicationRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option'
}

enum MedicationRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat'
}

const { TabPane } = Tabs

interface PrescriptionFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

interface RawMaterialAttributes {
  id?: number
  name: string
}

interface RawMaterialApi {
  list: () => Promise<{ success: boolean; result?: RawMaterialAttributes[]; message?: string }>
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

export const PrescriptionForm = ({ encounterId, patientData }: PrescriptionFormProps) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const {
    data: medicationHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory
  } = useMedicationRequestByEncounter(encounterId)

  const [items, setItems] = useState<ItemAttributes[]>([])
  const [itemCategories, setItemCategories] = useState<any[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterialAttributes[]>([])
  const [rawMaterialLoading, setRawMaterialLoading] = useState(false)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  useEffect(() => {
    loadRawMaterials()
    loadItems()
    loadItemCategories()
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

  const loadRawMaterials = async () => {
    setRawMaterialLoading(true)
    try {
      const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
      if (api?.list) {
        const response = await api.list()
        if (response.success && response.result) {
          setRawMaterials(response.result)
        }
      }
    } catch (error) {
      console.error('Error loading raw materials:', error)
    } finally {
      setRawMaterialLoading(false)
    }
  }

  const itemCategoryMap = useMemo(() => {
    const categories = (itemCategories || []) as any[]
    const map = new Map<number, string>()
    categories.forEach((c) => {
      if (typeof c.id === 'number' && typeof c.categoryType === 'string') {
        map.set(c.id, c.categoryType.toLowerCase())
      }
    })
    return map
  }, [itemCategories])

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
        const categoryId =
          typeof item.itemCategoryId === 'number'
            ? item.itemCategoryId
            : typeof item.category?.id === 'number'
              ? item.category.id
              : null

        let categoryType = ''
        if (categoryId && itemCategoryMap.has(categoryId)) {
          categoryType = itemCategoryMap.get(categoryId) || ''
        } else {
          const rawCategoryType =
            typeof item.category?.categoryType === 'string' ? item.category.categoryType : undefined
          categoryType = rawCategoryType ? rawCategoryType.trim().toLowerCase() : ''
        }

        return {
          value: item.id as number,
          label,
          unitCode,
          categoryId,
          categoryType
        }
      })
      .filter((entry) => entry.unitCode.length > 0)
  }, [items, itemCategoryMap])

  const rawMaterialOptions = useMemo(() => {
    return rawMaterials
      .filter((rm) => typeof rm.id === 'number')
      .map((rm) => ({
        label: rm.name,
        value: rm.id as number
      }))
  }, [rawMaterials])

  const handleSubmitPrescription = async () => {
    const values = form.getFieldsValue()
    const compoundList = values.compounds || []
    const itemList = values.items || []

    if (itemList.length === 0 && compoundList.length === 0) {
      message.error('Resep kosong. Tambahkan minimal 1 item atau racikan.')
      return
    }

    if (!encounterId || !patientData) return

    setSubmitting(true)
    try {
      const api = (window.api?.query as any)?.medicationRequest
      if (!api?.create) {
        throw new Error('API MedicationRequest tidak tersedia.')
      }

      const promises: Promise<any>[] = []
      const commonPayload = {
        status: MedicationRequestStatus.ACTIVE,
        intent: MedicationRequestIntent.ORDER,
        priority: MedicationRequestPriority.ROUTINE,
        patientId: patientData.patient.id,
        encounterId: encounterId,
        requesterId: values.performerId || 1,
        authoredOn: values.assessment_date ? values.assessment_date.toDate() : new Date(),
        groupIdentifier: {
          system: 'http://sys-ids/prescription-group',
          value: `RX-${Date.now()}`
        }
      }

      for (const item of itemList) {
        const selectedOption = itemOptions.find((opt) => opt.value === item.itemId)
        const unit = selectedOption?.unitCode || undefined

        const payload = {
          ...commonPayload,
          itemId: item.itemId,
          note: item.note,
          dosageInstruction: item.instruction ? [{ text: item.instruction }] : [],
          dispenseRequest: {
            quantity: {
              value: item.quantity,
              unit: unit
            }
          }
        }
        promises.push(api.create(payload))
      }

      for (const comp of compoundList) {
        if (!comp.name) continue

        const ingredients = (comp.items || []).map((ing: any) => {
          let name = ''
          if (ing.sourceType === 'substance') {
            const foundPool = rawMaterials.find((r) => r.id === ing.rawMaterialId)
            if (foundPool) name = foundPool.name
          } else {
            const foundPool = items.find((i) => i.id === ing.itemId)
            if (foundPool) name = foundPool.nama || ''
          }

          return {
            resourceType: 'Ingredient',
            itemId: ing.sourceType !== 'substance' ? ing.itemId : null,
            quantity: ing.quantity,
            unit: ing.unit,
            note: ing.note,
            name: name
          }
        })

        const payload = {
          ...commonPayload,
          note: `[Racikan: ${comp.name}]`,
          category: [{ text: 'racikan', code: 'compound' }],
          dosageInstruction: comp.dosageInstruction ? [{ text: comp.dosageInstruction }] : [],
          dispenseRequest: {
            quantity: {
              value: comp.quantity,
              unit: comp.quantityUnit
            }
          },
          supportingInformation: ingredients
        }
        promises.push(api.create(payload))
      }

      await Promise.all(promises)
      await refetchHistory()

      modal.success({
        title: 'Resep Berhasil Dibuat!',
        content: 'Resep telah berhasil disimpan ke database.'
      })
      form.resetFields()
    } catch (error: any) {
      message.error(error.message || 'Gagal membuat resep')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const historyColumns = [
    {
      title: 'Waktu',
      dataIndex: 'authoredOn',
      key: 'authoredOn',
      width: 140,
      render: (v) => dayjs(v).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Item / Racikan',
      key: 'item',
      render: (_, record: any) => {
        const isCompound = record.category?.some((c: any) => c.code === 'compound')
        if (isCompound) {
          return (
            <Space direction="vertical" size={0}>
              <Text strong>
                {record.note?.replace('[Racikan: ', '').replace(']', '') || 'Racikan'}
              </Text>
              <div className="flex flex-wrap gap-1">
                {record.supportingInformation?.map((ing: any, idx: number) => (
                  <Tag key={idx} color="orange" className="text-[10px]">
                    {ing.name || `Item ${ing.itemId}`} ({ing.quantity} {ing.unit})
                  </Tag>
                ))}
              </div>
            </Space>
          )
        }
        return <Text>{record.item?.nama || `Item ${record.itemId}`}</Text>
      }
    },
    {
      title: 'Dosis',
      key: 'dosage',
      render: (_, record: any) => record.dosageInstruction?.[0]?.text || '-'
    },
    {
      title: 'Jumlah',
      key: 'qty',
      width: 100,
      render: (_, record: any) =>
        `${record.dispenseRequest?.quantity?.value || 0} ${record.dispenseRequest?.quantity?.unit || ''}`
    },
    {
      title: 'Dokter',
      dataIndex: ['requester', 'namaLengkap'],
      key: 'doctor'
    },
    {
      title: 'Catatan',
      dataIndex: 'note',
      key: 'nonCompoundNote',
      render: (v, record: any) => {
        const isCompound = record.category?.some((c: any) => c.code === 'compound')
        return isCompound ? '-' : v
      }
    }
  ]

  return (
    <div className="flex justify-center p-4">
      <Card
        className="w-full max-w-6xl rounded-xl"
        title="Buat Resep Obat"
        extra={
          <Space>
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalOpen(true)}>
              Riwayat ({medicationHistory?.result?.length || 0})
            </Button>
            <Button onClick={() => navigate('/dashboard/doctor')}>Kembali</Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPrescription}
          initialValues={{ assessment_date: dayjs() }}
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Tabs defaultActiveKey="1" type="card" className="mt-4">
            <TabPane tab="Obat & Barang" key="1">
              <ItemPrescriptionForm itemOptions={itemOptions} loading={rawMaterialLoading} />
            </TabPane>
            <TabPane tab="Racikan" key="2">
              <CompoundPrescriptionForm
                form={form}
                itemOptions={itemOptions}
                rawMaterialOptions={rawMaterialOptions}
                loading={rawMaterialLoading}
              />
            </TabPane>
          </Tabs>

          <div className="flex justify-end mt-6 pt-4">
            <Space>
              <Button onClick={() => navigate('/dashboard/doctor')}>Batal</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={submitting}
                onClick={handleSubmitPrescription}
                size="large"
              >
                Buat Resep
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
      <Modal
        title="Riwayat Resep Pasien"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        width={1000}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        ]}
      >
        <Table
          dataSource={medicationHistory?.result || []}
          columns={historyColumns}
          rowKey="id"
          loading={isLoadingHistory}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Modal>
    </div>
  )
}

export default PrescriptionForm
