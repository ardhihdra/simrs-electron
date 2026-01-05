import { Button, Form, Input, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'

interface AssetMasterPayload {
  categoryId: number
  name: string
  brand?: string | null
  model?: string | null
  spec?: string | null
}

export function AssetMasterForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { record?: (AssetMasterPayload & { id?: number }) } | null
  const [form] = Form.useForm<AssetMasterPayload>()
  const { data: categories } = useQuery({
    queryKey: ['assetCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetCategory?.list
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn()
    }
  })
  const createMutation = useMutation({
    mutationKey: ['assetMaster', 'create'],
    mutationFn: (payload: AssetMasterPayload) => {
      const fn = window.api?.query?.assetMaster?.create
      if (!fn) throw new Error('API assetMaster tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetMaster', 'list'] })
      navigate('/dashboard/asset/master')
    }
  })
  const updateMutation = useMutation({
    mutationKey: ['assetMaster', 'update'],
    mutationFn: (payload: AssetMasterPayload & { id: number }) => {
      const fn = window.api?.query?.assetMaster?.update
      if (!fn) throw new Error('API assetMaster tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetMaster', 'list'] })
      navigate('/dashboard/asset/master')
    }
  })

  interface CategoryOptionSource { id: number; name: string }
  const options = ((categories?.result as CategoryOptionSource[]) || []).map((c) => ({ label: c.name, value: c.id }))

  const isEdit = !!state?.record?.id
  if (isEdit) {
    form.setFieldsValue({
      categoryId: state?.record?.categoryId,
      name: state?.record?.name,
      brand: state?.record?.brand ?? null,
      model: state?.record?.model ?? null,
      spec: state?.record?.spec ?? null
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Master Aset' : 'Tambah Master Aset'}</h2>
      <Form form={form} layout="vertical" onFinish={(values) => {
        if (isEdit && state?.record?.id) {
          updateMutation.mutate({ ...values, id: state.record.id })
        } else {
          createMutation.mutate(values)
        }
      }}>
        <Form.Item name="categoryId" label="Kategori" rules={[{ required: true }]}> 
          <Select options={options} showSearch />
        </Form.Item>
        <Form.Item name="name" label="Nama" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="brand" label="Merk"> 
          <Input />
        </Form.Item>
        <Form.Item name="model" label="Model"> 
          <Input />
        </Form.Item>
        <Form.Item name="spec" label="Spesifikasi"> 
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/master')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetMasterForm
