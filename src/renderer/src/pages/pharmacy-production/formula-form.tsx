import { useEffect } from 'react'
import { Button, Form, Input, InputNumber, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { queryClient } from '@renderer/query-client'

type FormulaStatus = 'draft' | 'active' | 'archived'

interface ProductionFormulaItemAttributes {
  rawMaterialId: number
  qty: number
  uom: string
}

interface ProductionFormulaAttributes {
  id?: number
  finishedGoodMedicineId: number
  version: string
  status: FormulaStatus
  notes?: string | null
  items?: ProductionFormulaItemAttributes[] | null
}

type ProductionFormulaDetailResponse = {
  success: boolean
  result?: ProductionFormulaAttributes
  message?: string
}

type ProductionFormulaApi = {
  getById: (args: { id: number }) => Promise<ProductionFormulaDetailResponse>
  create: (data: ProductionFormulaAttributes) => Promise<{ success: boolean; result?: ProductionFormulaAttributes; message?: string }>
  update: (data: ProductionFormulaAttributes & { id: number }) => Promise<{ success: boolean; result?: ProductionFormulaAttributes; message?: string }>
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

interface RawMaterialOption {
  id?: number
  name: string
  defaultUom?: string | null
}

type RawMaterialListResponse = {
  success: boolean
  result?: RawMaterialOption[]
  message?: string
}

interface FormulaItemFormRow {
  rawMaterialId?: number
  qty?: number
  uom?: string
}

interface FormData {
  finishedGoodMedicineId: number
  version: string
  status: FormulaStatus
  notes?: string | null
  items: FormulaItemFormRow[]
}

const statusOptions: { label: string; value: FormulaStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Aktif', value: 'active' },
  { label: 'Arsip', value: 'archived' }
]

export function ProductionFormulaForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = typeof id === 'string'

  const api = (window.api?.query as { productionFormula?: ProductionFormulaApi }).productionFormula
  const medicineApi = (window.api?.query as { medicine?: { list: () => Promise<MedicineListResponse> } }).medicine
  const rawMaterialApi = (window.api?.query as { rawMaterial?: { list: () => Promise<RawMaterialListResponse> } })
    .rawMaterial

  const { data: detailData } = useQuery({
    queryKey: ['productionFormula', 'detail', id],
    queryFn: () => {
      const fn = api?.getById
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: medicinesData } = useQuery({
    queryKey: ['medicine', 'list-for-formula'],
    queryFn: () => {
      const fn = medicineApi?.list
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn()
    }
  })

  const { data: rawMaterialsData } = useQuery({
    queryKey: ['rawMaterial', 'list-for-formula'],
    queryFn: () => {
      const fn = rawMaterialApi?.list
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn()
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const d = detailData.result
      const items: FormulaItemFormRow[] = Array.isArray(d.items)
        ? d.items.map((it) => ({
            rawMaterialId: it.rawMaterialId,
            qty: it.qty,
            uom: it.uom
          }))
        : []

      form.setFieldsValue({
        finishedGoodMedicineId: d.finishedGoodMedicineId,
        version: d.version,
        status: d.status,
        notes: d.notes ?? null,
        items
      })
    } else if (!isEdit) {
      form.setFieldsValue({
        status: 'draft',
        items: []
      } as Partial<FormData>)
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['productionFormula', 'create'],
    mutationFn: (data: ProductionFormulaAttributes) => {
      const fn = api?.create
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionFormula', 'list'] })
      navigate('/dashboard/farmasi/formulas', { replace: true })
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['productionFormula', 'update'],
    mutationFn: (data: ProductionFormulaAttributes & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API formula produksi tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionFormula', 'list'] })
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['productionFormula', 'detail', id] })
      }
      navigate('/dashboard/farmasi/formulas', { replace: true })
    }
  })

  const medicineOptions = (medicinesData?.result ?? []).map((m) => ({
    label: m.name,
    value: m.id
  }))

  const rawMaterialOptions = (rawMaterialsData?.result ?? []).map((r) => ({
    label: r.name,
    value: r.id,
    defaultUom: r.defaultUom ?? undefined
  }))

  const onFinish = (values: FormData) => {
    const normalizedItems: ProductionFormulaItemAttributes[] = (values.items || [])
      .filter((row) => typeof row.rawMaterialId === 'number' && typeof row.qty === 'number')
      .map((row) => ({
        rawMaterialId: row.rawMaterialId as number,
        qty: row.qty as number,
        uom: (row.uom ?? '').trim() || '-'
      }))

    const payload: ProductionFormulaAttributes = {
      finishedGoodMedicineId: values.finishedGoodMedicineId,
      version: values.version.trim(),
      status: values.status,
      notes: values.notes?.trim() || null,
      items: normalizedItems
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
          {isEdit ? 'Edit Formula Produksi' : 'Formula Produksi Baru'}
        </h2>
        <Form<FormData> form={form} layout="vertical" onFinish={onFinish}>
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
            label="Versi Formula"
            name="version"
            rules={[{ required: true, message: 'Versi harus diisi' }]}
          >
            <Input placeholder="Contoh: v1.0" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item label="Catatan" name="notes">
            <Input.TextArea rows={3} placeholder="Opsional" />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Komposisi Bahan</h3>
                  <Button onClick={() => add()} type="dashed">
                    Tambah Bahan
                  </Button>
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <Form.Item
                      {...field}
                      name={[field.name, 'rawMaterialId']}
                      label="Bahan Baku"
                      className="col-span-6"
                      rules={[{ required: true, message: 'Pilih bahan baku' }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Pilih bahan baku"
                        options={rawMaterialOptions.map((opt) => ({ label: opt.label, value: opt.value }))}
                      />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'qty']}
                      label="Qty"
                      className="col-span-3"
                      rules={[{ required: true, message: 'Qty harus diisi' }]}
                    >
                      <InputNumber<number> min={0} className="w-full" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'uom']}
                      label="Satuan"
                      className="col-span-2"
                      rules={[{ required: true, message: 'Satuan harus diisi' }]}
                    >
                      <Input placeholder="mg, ml, dll" />
                    </Form.Item>
                    <div className="col-span-1 flex justify-center">
                      <Button danger onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.List>

          <Form.Item className="mt-4">
            <div className="flex gap-2 justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'Update' : 'Simpan'}
              </Button>
              <Button onClick={() => navigate('/dashboard/farmasi/formulas')}>
                Batal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default ProductionFormulaForm

