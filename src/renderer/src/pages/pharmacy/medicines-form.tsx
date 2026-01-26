import { Button, Form, Input, InputNumber, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo } from 'react'
import { queryClient } from '@renderer/query-client'

interface FormData {
  name: string
  medicineCategoryId: number
  medicineBrandId: number
  saltComposition?: string | null
  buyingPrice: number
  sellingPrice: number
  sideEffects?: string | null
  description?: string | null
}

export function MedicinesForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['medicine', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicine?.getById
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['medicineCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicineCategory?.list
      if (!fn) throw new Error('API kategori obat tidak tersedia.')
      return fn()
    }
  })
  const { data: brandData, isLoading: brandLoading } = useQuery({
    queryKey: ['medicineBrand', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicineBrand?.list
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn()
    }
  })

  const catOptions = useMemo(() => ((catData?.result || []) as { id: number; name: string }[]).map((c) => ({ label: c.name, value: c.id })), [catData?.result])
  const brandOptions = useMemo(() => ((brandData?.result || []) as { id: number; name: string }[]).map((b) => ({ label: b.name, value: b.id })), [brandData?.result])

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const d = detailData.result as FormData & { id: number }
      form.setFieldsValue({
        name: d.name,
        medicineCategoryId: d.medicineCategoryId,
        medicineBrandId: d.medicineBrandId,
        saltComposition: d.saltComposition ?? '',
        buyingPrice: d.buyingPrice,
        sellingPrice: d.sellingPrice,
        sideEffects: d.sideEffects ?? '',
        description: d.description ?? ''
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicine', 'create'],
    mutationFn: (data: FormData) => {
      const fn = window.api?.query?.medicine?.create
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine', 'list'] })
      navigate('/dashboard/pharmacy/medicines')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicine', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = window.api?.query?.medicine?.update
      if (!fn) throw new Error('API obat tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicine', 'detail', id] })
      navigate('/dashboard/pharmacy/medicines')
    }
  })

  const onFinish = (values: FormData) => {
    const payload = {
      ...values,
      saltComposition: values.saltComposition?.trim() || null,
      sideEffects: values.sideEffects?.trim() || null,
      description: values.description?.trim() || null
    }
    if (isEdit) updateMutation.mutate({ ...payload, id: Number(id) })
    else createMutation.mutate(payload)
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-[#141414] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{isEdit ? 'Edit Medicine' : 'New Medicine'}</h2>
          <Button onClick={() => navigate('/dashboard/pharmacy/medicines')}>Back</Button>
        </div>
        
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {/* Left Column */}
            <div className="space-y-2">
              <Form.Item label="Medicine" name="name" rules={[{ required: true, message: 'Nama obat harus diisi' }]}>
                <Input placeholder="Contoh: Promag" />
              </Form.Item>
              
              <Form.Item label="Brand" name="medicineBrandId" rules={[{ required: true, message: 'Brand harus dipilih' }]}>
                <Select options={brandOptions} placeholder="Pilih brand" showSearch optionFilterProp="label" loading={brandLoading} />
              </Form.Item>
              
              <Form.Item label="Buying Price" name="buyingPrice" rules={[{ required: true, message: 'Harga beli harus diisi' }]}>
                <InputNumber<number>
                  min={0} 
                  className="w-full" 
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                />
              </Form.Item>
              
              <Form.Item label="Side Effects" name="sideEffects">
                <Input.TextArea rows={4} placeholder="Efek samping obat..." />
              </Form.Item>
            </div>

            {/* Right Column */}
            <div className="space-y-2">
              <Form.Item label="Category" name="medicineCategoryId" rules={[{ required: true, message: 'Kategori harus dipilih' }]}>
                <Select options={catOptions} placeholder="Pilih kategori" showSearch optionFilterProp="label" loading={catLoading} />
              </Form.Item>
              
              <Form.Item label="Salt Composition" name="saltComposition" rules={[{ required: true, message: 'Komposisi harus diisi' }]}>
                <Input placeholder="Contoh: MgCl2" />
              </Form.Item>
              
              <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true, message: 'Harga jual harus diisi' }]}>
                <InputNumber<number>
                  min={0} 
                  className="w-full"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                />
              </Form.Item>
              
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} placeholder="Deskripsi obat..." />
              </Form.Item>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} className="px-6 bg-orange-600 hover:bg-orange-500 border-none">
              Save
            </Button>
            <Button onClick={() => navigate('/dashboard/pharmacy/medicines')} className="px-6">
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default MedicinesForm

