import { Button, Form, Input, Select, Switch } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

interface FormData { name: string; status?: boolean; categoryType?: string | null }

export function MedicineCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['medicineCategory', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicineCategory?.getById
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result as { name: string; status?: boolean; categoryType?: string | null }
      form.setFieldsValue({ name: data.name, status: data.status, categoryType: data.categoryType ?? null })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicineCategory', 'create'],
    mutationFn: (data: FormData) => {
      const fn = window.api?.query?.medicineCategory?.create
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineCategory', 'list'] })
      navigate('/dashboard/medicine/medicine-categories')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicineCategory', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = window.api?.query?.medicineCategory?.update
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineCategory', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicineCategory', 'detail', id] })
      navigate('/dashboard/medicine/medicine-categories')
    }
  })

  const onFinish = (values: FormData) => {
    if (isEdit) updateMutation.mutate({ ...values, id: Number(id) })
    else createMutation.mutate(values)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{isEdit ? 'Edit Kategori Item' : 'Kategori Item Baru'}</h2>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: true }}>
          <Form.Item label="Kategori" name="name" rules={[{ required: true, message: 'Nama kategori harus diisi' }]}> 
            <Input placeholder="Contoh: Obat bebas" />
          </Form.Item>
          <Form.Item label="Tipe Kategori" name="categoryType">
            <Select
              allowClear
              placeholder="Pilih tipe kategori (Obat, Non Obat, Alkes, dsb)"
              options={[
                { value: 'obat', label: 'Obat' },
                { value: 'non-obat', label: 'Non Obat' },
                { value: 'alkes', label: 'Alat Kesehatan' },
                { value: 'bmhp', label: 'BMHP' },
                { value: 'reagen', label: 'Reagen' },
                { value: 'umum', label: 'Umum' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>{isEdit ? 'Update' : 'Simpan'}</Button>
              <Button onClick={() => navigate('/dashboard/medicine/medicine-categories')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default MedicineCategoryForm
