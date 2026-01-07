import { Button, Form, Input } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

interface FormData { name: string; email?: string | null; phone?: string | null }

export function MedicineBrandForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['medicineBrand', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicineBrand?.getById
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result as { name: string; email?: string | null; phone?: string | null }
      form.setFieldsValue({ name: data.name, email: data.email ?? '', phone: data.phone ?? '' })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicineBrand', 'create'],
    mutationFn: (data: FormData) => {
      const fn = window.api?.query?.medicineBrand?.create
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineBrand', 'list'] })
      navigate('/dashboard/pharmacy/medicine-brands')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicineBrand', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = window.api?.query?.medicineBrand?.update
      if (!fn) throw new Error('API merk obat tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineBrand', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicineBrand', 'detail', id] })
      navigate('/dashboard/pharmacy/medicine-brands')
    }
  })

  const onFinish = (values: FormData) => {
    const payload = { ...values, email: values.email?.trim() || null, phone: values.phone?.trim() || null }
    if (isEdit) updateMutation.mutate({ ...payload, id: Number(id) })
    else createMutation.mutate(payload)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{isEdit ? 'Edit Brand' : 'New Brand'}</h2>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Brand" name="name" rules={[{ required: true, message: 'Nama brand harus diisi' }]}>
            <Input placeholder="Contoh: Kalbe Farma" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="opsional" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="opsional" />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>{isEdit ? 'Update' : 'Simpan'}</Button>
              <Button onClick={() => navigate('/dashboard/pharmacy/medicine-brands')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default MedicineBrandForm

