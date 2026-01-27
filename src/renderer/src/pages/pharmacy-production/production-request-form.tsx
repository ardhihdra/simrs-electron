import { useEffect, useMemo } from 'react'
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
  items?: {
    rawMaterialId: number
    qty: number
  }[] | null
}

type ProductionFormulaListResponse = {
  success: boolean
  result?: ProductionFormulaOption[]
  message?: string
}

interface RawMaterialForStock {
  id?: number
  name: string
  stock?: number
}

type RawMaterialListResponseForForm = {
  success: boolean
  result?: RawMaterialForStock[]
  message?: string
}

interface RequiredMaterialRow {
  key: number
  name: string
  required: number
  stock: number
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
  const rawMaterialApi = (window.api?.query as { rawMaterial?: { list: () => Promise<RawMaterialListResponseForForm> } })
    .rawMaterial

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

  const { data: rawMaterialsData } = useQuery({
    queryKey: ['rawMaterial', 'list-for-production-request'],
    queryFn: () => {
      const fn = rawMaterialApi?.list
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
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
      console.log('[UI][ProductionRequestForm] update payload', data)
      const result = fn(data)
      result
        .then((res) => {
          console.log('[UI][ProductionRequestForm] update result', res)
        })
        .catch((error) => {
          console.log('[UI][ProductionRequestForm] update error', error)
        })
      return result
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
  const selectedFormulaId = Form.useWatch('productionFormulaId', form)
  const plannedQty = Form.useWatch('qtyPlanned', form)

  const formulaOptions = (formulasData?.result ?? [])
    .filter((f) =>
      typeof selectedMedicineId === 'number' ? f.finishedGoodMedicineId === selectedMedicineId : true
    )
    .map((f) => ({
      label: `${f.version}`,
      value: f.id
    }))

  const requiredMaterials: RequiredMaterialRow[] = useMemo(() => {
    const currentFormulaId = typeof selectedFormulaId === 'number' ? selectedFormulaId : undefined
    const qty = typeof plannedQty === 'number' && plannedQty > 0 ? plannedQty : undefined

    if (!currentFormulaId || !qty) {
      return []
    }

    const formulas = Array.isArray(formulasData?.result) ? formulasData.result : []
    const rawMaterials = Array.isArray(rawMaterialsData?.result) ? rawMaterialsData.result : []

    const formula = formulas.find((f) => f.id === currentFormulaId)
    const items = Array.isArray(formula?.items) ? formula.items : []

    if (!items.length) {
      return []
    }

    return items.map((item, index) => {
      const material = rawMaterials.find((rm) => rm.id === item.rawMaterialId)
      const stockValue = typeof material?.stock === 'number' ? material.stock : 0
      const requiredQty = item.qty * qty

      return {
        key: index,
        name: material?.name ?? `ID ${item.rawMaterialId}`,
        required: requiredQty,
        stock: stockValue
      }
    })
  }, [selectedFormulaId, plannedQty, formulasData?.result, rawMaterialsData?.result])

  const onFinish = (values: FormData) => {
    console.log('[UI][ProductionRequestForm] onFinish values', values)
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

    console.log('[UI][ProductionRequestForm] payload', payload)

    if (isEdit && id) {
      updateMutation.mutate({ ...payload, id: Number(id) })
    } else {
      console.log('[UI][ProductionRequestForm] create payload', payload)
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

          {requiredMaterials.length > 0 && (
            <div className="mb-4 border rounded-md p-3 bg-gray-50">
              <div className="font-semibold mb-2">Kebutuhan Bahan Baku (berdasarkan formula & qty)</div>
              <div className="space-y-1 text-sm">
                {requiredMaterials.map((row) => {
                  const isEnough = row.stock >= row.required
                  return (
                    <div key={row.key} className={isEnough ? 'text-gray-800' : 'text-red-600'}>
                      {row.name}: butuh {row.required}, stok {row.stock}{' '}
                      {!isEnough && '(stok tidak cukup)'}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
