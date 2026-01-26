import { useEffect } from 'react'
import { Button, DatePicker, Form, Input, InputNumber, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import dayjs, { Dayjs } from 'dayjs'
import { queryClient } from '@renderer/query-client'

type ProductionRequestStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled'

interface ProductionRequestAttributes {
  id?: number
  code: string
  finishedGoodMedicineId: number
  productionFormulaId: number
  qtyPlanned: number
  status: ProductionRequestStatus
  scheduledStartDate?: string | null
  scheduledEndDate?: string | null
  actualStartDate?: string | null
  actualEndDate?: string | null
  notes?: string | null
}

type ProductionRequestDetailResponse = {
  success: boolean
  result?: ProductionRequestAttributes
  message?: string
}

type ProductionRequestApi = {
  getById: (args: { id: number }) => Promise<ProductionRequestDetailResponse>
  create: (data: ProductionRequestAttributes) => Promise<{ success: boolean; result?: ProductionRequestAttributes; message?: string }>
  update: (data: ProductionRequestAttributes & { id: number }) => Promise<{ success: boolean; result?: ProductionRequestAttributes; message?: string }>
}

interface MedicineOption {
  id?: number
  name: string
}

type MedicineListResponse = {
  success: boolean
  result?: MedicineOption[]
  message?: string
}

interface ProductionFormulaOption {
  id?: number
  finishedGoodMedicineId: number
  version: string
}

type ProductionFormulaListResponse = {
  success: boolean
  result?: ProductionFormulaOption[]
  message?: string
}

interface FormData {
  code: string
  finishedGoodMedicineId: number
  productionFormulaId: number
  qtyPlanned: number
  status: ProductionRequestStatus
  scheduledStartDate?: Dayjs
  scheduledEndDate?: Dayjs
  notes?: string | null
}

const statusOptions: { label: string; value: ProductionRequestStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Disetujui', value: 'approved' },
  { label: 'Sedang Diproduksi', value: 'in_progress' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' }
]

function generateCode() {
  const now = dayjs()
  return `PR-${now.format('YYYYMMDD-HHmmss')}`
}

export function ProductionRequestForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = typeof id === 'string'

  const api = (window.api?.query as { productionRequest?: ProductionRequestApi }).productionRequest
  const medicineApi = (window.api?.query as { medicine?: { list: () => Promise<MedicineListResponse> } }).medicine
  const formulaApi = (window.api?.query as { productionFormula?: { list: () => Promise<ProductionFormulaListResponse> } })
    .productionFormula

  const { data: detailData } = useQuery({
    queryKey: ['productionRequest', 'detail', id],
    queryFn: () => {
      const fn = api?.getById
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: medicinesData } = useQuery({
    queryKey: ['medicine', 'list-for-production-request'],
    queryFn: () => {
      const fn = medicineApi?.list
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn()
    }
  })

  const { data: formulasData } = useQuery({
    queryKey: ['productionFormula', 'list-for-production-request'],
    queryFn: () => {
      const fn = formulaApi?.list
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn()
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const d = detailData.result
      form.setFieldsValue({
        code: d.code,
        finishedGoodMedicineId: d.finishedGoodMedicineId,
        productionFormulaId: d.productionFormulaId,
        qtyPlanned: d.qtyPlanned,
        status: d.status,
        scheduledStartDate: d.scheduledStartDate ? dayjs(d.scheduledStartDate) : undefined,
        scheduledEndDate: d.scheduledEndDate ? dayjs(d.scheduledEndDate) : undefined,
        notes: d.notes ?? null
      })
    } else if (!isEdit) {
      form.setFieldsValue({
        code: generateCode(),
        status: 'draft'
      } as Partial<FormData>)
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['productionRequest', 'create'],
    mutationFn: (data: ProductionRequestAttributes) => {
      const fn = api?.create
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionRequest', 'list'] })
      navigate('/dashboard/farmasi/production-requests', { replace: true })
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['productionRequest', 'update'],
    mutationFn: (data: ProductionRequestAttributes & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API permintaan produksi tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionRequest', 'list'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['productionRequest', 'detail', id] })
      }
      navigate('/dashboard/farmasi/production-requests', { replace: true })
    }
  })

  const medicineOptions = (medicinesData?.result ?? []).map((m) => ({
    label: m.name,
    value: m.id
  }))

  const selectedMedicineId = Form.useWatch('finishedGoodMedicineId', form)

  const formulaOptions = (formulasData?.result ?? [])
    .filter((f) =>
      typeof selectedMedicineId === 'number' ? f.finishedGoodMedicineId === selectedMedicineId : true
    )
    .map((f) => ({
      label: `${f.version}`,
      value: f.id
    }))

  const onFinish = (values: FormData) => {
    const payload: ProductionRequestAttributes = {
      code: values.code.trim() || generateCode(),
      finishedGoodMedicineId: values.finishedGoodMedicineId,
      productionFormulaId: values.productionFormulaId,
      qtyPlanned: values.qtyPlanned,
      status: values.status,
      scheduledStartDate: values.scheduledStartDate
        ? values.scheduledStartDate.startOf('day').toISOString()
        : null,
      scheduledEndDate: values.scheduledEndDate
        ? values.scheduledEndDate.endOf('day').toISOString()
        : null,
      actualStartDate: null,
      actualEndDate: null,
      notes: values.notes?.trim() || null
    }

    if (isEdit && id) {
      updateMutation.mutate({ ...payload, id: Number(id) })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEdit ? 'Edit Permintaan Produksi' : 'Permintaan Produksi Baru'}
        </h2>
        <Form<FormData> form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Kode Permintaan"
            name="code"
            rules={[{ required: true, message: 'Kode permintaan harus diisi' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Obat Jadi"
            name="finishedGoodMedicineId"
            rules={[{ required: true, message: 'Obat jadi harus dipilih' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Pilih obat jadi"
              options={medicineOptions}
            />
          </Form.Item>

          <Form.Item
            label="Formula Produksi"
            name="productionFormulaId"
            rules={[{ required: true, message: 'Formula harus dipilih' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Pilih formula"
              options={formulaOptions}
            />
          </Form.Item>

          <Form.Item
            label="Qty Rencana Produksi"
            name="qtyPlanned"
            rules={[{ required: true, message: 'Qty rencana harus diisi' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item label="Jadwal Mulai" name="scheduledStartDate">
            <DatePicker className="w-full" format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item label="Jadwal Selesai" name="scheduledEndDate">
            <DatePicker className="w-full" format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item label="Catatan" name="notes">
            <Input.TextArea rows={3} placeholder="Opsional" />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => navigate('/dashboard/farmasi/production-requests')}>
                Batal
              </Button>
              <Button type="primary" htmlType="submit">
                Simpan
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default ProductionRequestForm

