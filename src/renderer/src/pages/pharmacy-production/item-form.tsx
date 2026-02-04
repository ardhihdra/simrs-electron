import { Button, Form, Input, Select, message } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { queryClient } from '@renderer/query-client'

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

type ItemFormValues = {
	  nama: string
	  kode: string
	  kodeUnit: string
	  kind?: ItemKind | null
	  minimumStock?: number | null
	  itemCategoryId?: number | null
}

interface ItemCategoryAttributes {
	  id?: number
	  name: string
	  status?: boolean
}

type ItemApi = {
	  read: (args: { id: number }) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
	  create: (data: ItemFormValues) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
	  update: (data: ItemFormValues & { id: number }) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
}

interface UnitListEntry {
  id?: number
  nama?: string
  kode?: string
}

type UnitListResponse = {
  success: boolean
  result?: UnitListEntry[]
  message?: string
}

type ItemCategoryListResponse = {
	  success: boolean
	  result?: ItemCategoryAttributes[]
	  message?: string
}

export function ItemForm() {
  const navigate = useNavigate()
  const { id } = useParams()
	  const [form] = Form.useForm<ItemFormValues>()
  const isEdit = Boolean(id)

	  const api = window.api?.query?.item as ItemApi | undefined
  const unitApi = (window.api?.query as { unit?: { list: () => Promise<UnitListResponse> } }).unit
  const medicineCategoryApi = (window.api?.query as { medicineCategory?: { list: () => Promise<ItemCategoryListResponse> } }).medicineCategory

	  const { data: detailData } = useQuery({
    queryKey: ['item', 'detail', id],
    queryFn: () => {
      const fn = api?.read
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

	  const { data: unitSource } = useQuery<UnitListResponse>({
    queryKey: ['unit', 'list', 'for-item-form'],
    queryFn: () => {
      const fn = unitApi?.list
      if (!fn) throw new Error('API unit tidak tersedia.')
      return fn()
    }
  })

	  const { data: categorySource } = useQuery<ItemCategoryListResponse>({
	   queryKey: ['itemCategory', 'list', 'for-item-form'],
	   queryFn: () => {
	     const fn = medicineCategoryApi?.list
	     if (!fn) throw new Error('API kategori item tidak tersedia.')
	     return fn()
	   }
	 })

	  const unitOptions = useMemo(() => {
	    const entries: UnitListEntry[] = Array.isArray(unitSource?.result) ? unitSource.result : []
	    const map = new Map<string, string>()

	    for (const item of entries) {
	      const rawCode = typeof item.kode === 'string' && item.kode.length > 0 ? item.kode : ''
	      const code = rawCode.trim().toUpperCase()
	      if (!code) continue
	      if (map.has(code)) continue
	      const unitName = item.nama ?? code
	      map.set(code, `${code} - ${unitName}`)
	    }

	    const options = Array.from(map.entries()).map(([value, label]) => ({ value, label }))
	    return options
	  }, [unitSource?.result])

	  const itemCategoryOptions = useMemo(() => {
	    const entries: ItemCategoryAttributes[] = Array.isArray(categorySource?.result)
	      ? categorySource.result
	      : []

	    return entries
	      .filter((cat) => typeof cat.id === 'number' && Boolean(cat.name))
	      .map((cat) => ({ value: cat.id as number, label: cat.name }))
	  }, [categorySource?.result])

	  useEffect(() => {
	    if (isEdit && detailData?.success && detailData.result) {
	      const d = detailData.result as ItemFormValues & { id?: number }
	      form.setFieldsValue({
	        nama: d.nama,
	        kode: d.kode,
	        kodeUnit:
	          typeof d.kodeUnit === 'string' && d.kodeUnit.length > 0
	            ? d.kodeUnit.trim().toUpperCase()
	            : d.kodeUnit,
	        kind: d.kind ?? null,
	        itemCategoryId: d.itemCategoryId ?? null
	      })
	    }
	  }, [isEdit, detailData, form])

	  const createMutation = useMutation({
    mutationKey: ['item', 'create'],
	    mutationFn: (data: ItemFormValues) => {
      const fn = api?.create
      if (!fn) throw new Error('API item tidak tersedia.')
      console.log('[ItemForm] create payload', data)
      return fn(data)
    },
    onSuccess: (result) => {
      console.log('[ItemForm] create success', result)
      if (!result?.success) {
        const msg = result?.message ?? result?.error ?? 'Gagal menyimpan data'
        message.error(msg)
        return
      }

      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
      navigate('/dashboard/farmasi/items', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[ItemForm] create error', msg)
      message.error(msg || 'Gagal menyimpan data')
    }
  })

	  const updateMutation = useMutation({
    mutationKey: ['item', 'update'],
	    mutationFn: (data: ItemFormValues & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API item tidak tersedia.')
      console.log('[ItemForm] update payload', data)
      return fn(data)
    },
    onSuccess: (result) => {
      console.log('[ItemForm] update success', result)
      if (!result?.success) {
        const msg = result?.message ?? result?.error ?? 'Gagal mengupdate data'
        message.error(msg)
        return
      }

      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['item', 'detail', id] })
      navigate('/dashboard/farmasi/items', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[ItemForm] update error', msg)
      message.error(msg || 'Gagal mengupdate data')
    }
  })

	  const onFinish = (values: ItemFormValues) => {
	    const payload: ItemFormValues = {
      ...values,
      nama: values.nama.trim(),
      kode: values.kode.trim().toUpperCase(),
      kodeUnit: values.kodeUnit.trim().toUpperCase(),
      kind: values.kind ?? null,
		    itemCategoryId: typeof values.itemCategoryId === 'number' ? values.itemCategoryId : null
    }

    console.log('[ItemForm] submit', { isEdit, payload })

    if (isEdit) {
      updateMutation.mutate({ ...payload, id: Number(id) })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#141414] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Edit Item' : 'Item Baru'}
          </h2>
          <Button onClick={() => navigate('/dashboard/farmasi/items')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nama Item"
            name="nama"
            rules={[{ required: true, message: 'Nama item harus diisi' }]}
          >
            <Input placeholder="Contoh: Infus Set" />
          </Form.Item>

          <Form.Item
            label="Kode Item"
            name="kode"
            rules={[{ required: true, message: 'Kode item harus diisi' }]}
          >
            <Input placeholder="Kode unik item" />
          </Form.Item>

          <Form.Item
            label="Kode Unit"
            name="kodeUnit"
            rules={[{ required: true, message: 'Kode unit harus diisi' }]}
          >
            <Select
              showSearch
              placeholder="Pilih unit pemilik item"
              options={unitOptions}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item label="Kategori" name="itemCategoryId">
	        <Select
	          allowClear
	          showSearch
	          placeholder="Pilih kategori item"
	          options={itemCategoryOptions}
	          optionFilterProp="label"
	        />
	      </Form.Item>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="px-6 bg-orange-600 hover:bg-orange-500 border-none"
            >
              Simpan
            </Button>
            <Button onClick={() => navigate('/dashboard/farmasi/items')} className="px-6">
              Batal
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default ItemForm
