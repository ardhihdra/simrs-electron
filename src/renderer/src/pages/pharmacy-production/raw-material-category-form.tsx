import { Button, Form, Input, Switch } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

interface FormData { name: string; status?: boolean }

type RawMaterialCategoryApi = {
  getById: (args: { id: number }) => Promise<{ success: boolean; result?: { name: string; status?: boolean }; message?: string }>
  create: (data: FormData) => Promise<{ success: boolean; result?: { id?: number; name: string; status?: boolean }; message?: string }>
  update: (data: FormData & { id: number }) => Promise<{ success: boolean; result?: { id?: number; name: string; status?: boolean }; message?: string }>
}

export function RawMaterialCategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)
  const api = (window.api?.query as { rawMaterialCategory?: RawMaterialCategoryApi }).rawMaterialCategory

  const { data: detailData } = useQuery({
    queryKey: ['rawMaterialCategory', 'detail', id],
    queryFn: () => {
      const fn = api?.getById
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result as { name: string; status?: boolean }
      form.setFieldsValue({ name: data.name, status: data.status })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['rawMaterialCategory', 'create'],
    mutationFn: (data: FormData) => {
      const fn = api?.create
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialCategory', 'list'] })
      navigate('/dashboard/farmasi/raw-material-categories')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['rawMaterialCategory', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API kategori bahan baku tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterialCategory', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['rawMaterialCategory', 'detail', id] })
      navigate('/dashboard/farmasi/raw-material-categories')
    }
  })

  const onFinish = (values: FormData) => {
    if (isEdit) updateMutation.mutate({ ...values, id: Number(id) })
    else createMutation.mutate(values)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{isEdit ? 'Edit Kategori' : 'Kategori Baru'}</h2>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: true }}>
          <Form.Item label="Kategori" name="name" rules={[{ required: true, message: 'Nama kategori harus diisi' }]}> 
            <Input placeholder="Contoh: Eksipien" />
          </Form.Item>
          <Form.Item label="Status" name="status" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>{isEdit ? 'Update' : 'Simpan'}</Button>
              <Button onClick={() => navigate('/dashboard/farmasi/raw-material-categories')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default RawMaterialCategoryForm
