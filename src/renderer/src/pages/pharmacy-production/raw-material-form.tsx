import { Button, Form, Input, Select, Switch, InputNumber, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

type MaterialType = 'active' | 'excipient' | 'solvent'

interface FormData {
  name: string
  materialType: MaterialType
  internalCode?: string | null
  casCode?: string | null
  rawMaterialCategoryId?: number | null
  supplierId?: number | null
  status?: boolean
  description?: string | null
  defaultUom?: string | null
  grade?: string | null
  storageTempMin?: number | null
  storageTempMax?: number | null
  storageHumidityMax?: number | null
  isLightSensitive?: boolean
  isControlledSubstance?: boolean
  molecularWeight?: number | null
  density?: number | null
  hazardClass?: string | null
  msdsUrl?: string | null
}

type RawMaterialApi = {
  read: (args: { id: number }) => Promise<{ success: boolean; result?: FormData & { id?: number } & { category?: { name: string } | null; defaultSupplier?: { nama: string } | null }; message?: string }>
  create: (data: FormData) => Promise<{ success: boolean; result?: { id?: number } & FormData; message?: string }>
  update: (data: FormData & { id: number }) => Promise<{ success: boolean; result?: { id?: number } & FormData; message?: string }>
}

interface RawMaterialCategoryAttributes {
  id?: number
  name: string
  status?: boolean
}

interface SupplierAttributes {
  id?: number
  nama: string
  kode: string
  noHp: string
  alamat?: string | null
  note?: string | null
}

const materialTypeOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Eksipien', value: 'excipient' },
  { label: 'Solvent', value: 'solvent' }
]

export function RawMaterialForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)
  const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
  const categoryApi = (window.api?.query as { rawMaterialCategory?: { list: () => Promise<{ success: boolean; result?: RawMaterialCategoryAttributes[] }> } }).rawMaterialCategory
  const supplierApi = (window.api?.query as { suplier?: { list: () => Promise<{ success: boolean; result?: SupplierAttributes[] }> } }).suplier

  const { data: detailData } = useQuery({
    queryKey: ['rawMaterial', 'detail', id],
    queryFn: () => {
      const fn = api?.read
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['rawMaterialCategory', 'list'],
    queryFn: () => {
      const fn = categoryApi?.list
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn()
    }
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suplier', 'list'],
    queryFn: () => {
      const fn = supplierApi?.list
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn()
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const d = detailData.result
      form.setFieldsValue({
        name: d.name,
        materialType: d.materialType,
        internalCode: d.internalCode ?? '',
        casCode: d.casCode ?? '',
        rawMaterialCategoryId: d.rawMaterialCategoryId ?? null,
        supplierId: d.supplierId ?? null,
        status: d.status ?? true,
        description: d.description ?? '',
        defaultUom: d.defaultUom ?? '',
        grade: d.grade ?? '',
        storageTempMin: d.storageTempMin ?? null,
        storageTempMax: d.storageTempMax ?? null,
        storageHumidityMax: d.storageHumidityMax ?? null,
        isLightSensitive: d.isLightSensitive ?? false,
        isControlledSubstance: d.isControlledSubstance ?? false,
        molecularWeight: d.molecularWeight ?? null,
        density: d.density ?? null,
        hazardClass: d.hazardClass ?? '',
        msdsUrl: d.msdsUrl ?? ''
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['rawMaterial', 'create'],
    mutationFn: (data: FormData) => {
      const fn = api?.create
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['rawMaterial', 'list'] })
      navigate('/dashboard/farmasi/raw-materials', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      message.error(msg || 'Gagal menyimpan data')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['rawMaterial', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['rawMaterial', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['rawMaterial', 'detail', id] })
      navigate('/dashboard/farmasi/raw-materials', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      message.error(msg || 'Gagal mengupdate data')
    }
  })

  const onFinish = (values: FormData) => {
    const payload: FormData = {
      ...values,
      internalCode: values.internalCode?.trim() || null,
      casCode: values.casCode?.trim() || null,
      description: values.description?.trim() || null,
      status: values.status ?? true,
      defaultUom: values.defaultUom?.trim() || null,
      grade: values.grade?.trim() || null,
      storageTempMin: typeof values.storageTempMin === 'number' ? values.storageTempMin : null,
      storageTempMax: typeof values.storageTempMax === 'number' ? values.storageTempMax : null,
      storageHumidityMax: typeof values.storageHumidityMax === 'number' ? values.storageHumidityMax : null,
      isLightSensitive: values.isLightSensitive ?? false,
      isControlledSubstance: values.isControlledSubstance ?? false,
      molecularWeight: typeof values.molecularWeight === 'number' ? values.molecularWeight : null,
      density: typeof values.density === 'number' ? values.density : null,
      hazardClass: values.hazardClass?.trim() || null,
      msdsUrl: values.msdsUrl?.trim() || null
    }
    if (isEdit) updateMutation.mutate({ ...payload, id: Number(id) })
    else createMutation.mutate(payload)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{isEdit ? 'Edit Bahan Baku' : 'Bahan Baku Baru'}</h2>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ materialType: 'excipient', status: true }}>
        <Form.Item 
          label="Nama" 
          name="name" 
          rules={[
            { required: true, message: 'Nama harus diisi' },
            { min: 2, message: 'Nama terlalu pendek' },
            { max: 120, message: 'Nama terlalu panjang' }
          ]}
        >
          <Input placeholder="Contoh: Lactose Monohydrate" />
        </Form.Item>
        <Form.Item 
          label="Jenis Material" 
          name="materialType"
          rules={[{ required: true, message: 'Jenis material harus dipilih' }]}
        >
          <Select options={materialTypeOptions} />
        </Form.Item>
          <Form.Item label="Kategori" name="rawMaterialCategoryId">
            <Select
              allowClear
              placeholder="Pilih kategori"
              options={(categoriesData?.result as RawMaterialCategoryAttributes[] | undefined)?.map((c) => ({ label: c.name, value: c.id })) || []}
            />
          </Form.Item>
          <Form.Item label="Supplier" name="supplierId">
            <Select
              allowClear
              placeholder="Pilih supplier"
              options={(suppliersData?.result as SupplierAttributes[] | undefined)?.map((s) => ({ label: s.nama, value: s.id })) || []}
            />
          </Form.Item>
          <Form.Item 
            label="Kode Internal" 
            name="internalCode"
            rules={[
              { max: 50, message: 'Maksimal 50 karakter' },
              { pattern: /^[A-Za-z0-9_-]*$/, message: 'Hanya huruf, angka, _ dan -' }
            ]}
          >
            <Input placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="CAS" 
            name="casCode"
            rules={[{ pattern: /^\d{2,7}-\d{2}-\d$/, message: 'Format CAS: 000000-00-0' }]}
          >
            <Input placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="Satuan Default (UOM)" 
            name="defaultUom"
            rules={[
              { max: 10, message: 'Maksimal 10 karakter' },
              { pattern: /^[A-Za-z]*$/, message: 'Gunakan huruf saja, contoh: kg, g, L' }
            ]}
          >
            <Input placeholder="Opsional, contoh: kg, g, L" />
          </Form.Item>
          <Form.Item 
            label="Grade" 
            name="grade"
            rules={[{ max: 50, message: 'Maksimal 50 karakter' }]}
          >
            <Input placeholder="Opsional, contoh: USP, EP" />
          </Form.Item>
          <Form.Item 
            label="Suhu Simpan Min (°C)" 
            name="storageTempMin"
            rules={[{
              validator: (_, v) => {
                if (v === null || v === undefined) return Promise.resolve()
                if (typeof v !== 'number') return Promise.reject(new Error('Harus angka'))
                if (v < -100 || v > 200) return Promise.reject(new Error('Rentang -100 hingga 200'))
                return Promise.resolve()
              }
            }]}
          >
            <InputNumber className="w-full" placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="Suhu Simpan Max (°C)" 
            name="storageTempMax"
            dependencies={["storageTempMin"]}
            rules={[{
              validator: (_, v) => {
                if (v === null || v === undefined) return Promise.resolve()
                if (typeof v !== 'number') return Promise.reject(new Error('Harus angka'))
                if (v < -100 || v > 200) return Promise.reject(new Error('Rentang -100 hingga 200'))
                const min = form.getFieldValue('storageTempMin')
                if (typeof min === 'number' && v < min) return Promise.reject(new Error('Max harus ≥ Min'))
                return Promise.resolve()
              }
            }]}
          >
            <InputNumber className="w-full" placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="Kelembaban Max (%)" 
            name="storageHumidityMax"
            rules={[{
              validator: (_, v) => {
                if (v === null || v === undefined) return Promise.resolve()
                if (typeof v !== 'number') return Promise.reject(new Error('Harus angka'))
                if (v < 0 || v > 100) return Promise.reject(new Error('Rentang 0 hingga 100'))
                return Promise.resolve()
              }
            }]}
          >
            <InputNumber className="w-full" placeholder="Opsional" />
          </Form.Item>
          <Form.Item label="Sensitif Cahaya" name="isLightSensitive" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Bahan Terkontrol" name="isControlledSubstance" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item 
            label="Berat Molekul" 
            name="molecularWeight"
            rules={[{
              validator: (_, v) => {
                if (v === null || v === undefined) return Promise.resolve()
                if (typeof v !== 'number') return Promise.reject(new Error('Harus angka'))
                if (v < 0) return Promise.reject(new Error('Tidak boleh negatif'))
                return Promise.resolve()
              }
            }]}
          >
            <InputNumber className="w-full" placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="Densitas" 
            name="density"
            rules={[{
              validator: (_, v) => {
                if (v === null || v === undefined) return Promise.resolve()
                if (typeof v !== 'number') return Promise.reject(new Error('Harus angka'))
                if (v < 0) return Promise.reject(new Error('Tidak boleh negatif'))
                return Promise.resolve()
              }
            }]}
          >
            <InputNumber className="w-full" placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="Kelas Bahaya" 
            name="hazardClass"
            rules={[{ max: 50, message: 'Maksimal 50 karakter' }]}
          >
            <Input placeholder="Opsional" />
          </Form.Item>
          <Form.Item 
            label="MSDS URL" 
            name="msdsUrl"
            rules={[{ type: 'url', message: 'URL tidak valid' }]}
          >
            <Input placeholder="Opsional" />
          </Form.Item>
          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item 
            label="Deskripsi" 
            name="description"
            rules={[{ max: 500, message: 'Maksimal 500 karakter' }]}
          >
            <Input.TextArea rows={3} placeholder="Opsional" />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>{isEdit ? 'Update' : 'Simpan'}</Button>
              <Button onClick={() => navigate('/dashboard/farmasi/raw-materials')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default RawMaterialForm
