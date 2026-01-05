import { Button, Form, Input, Radio, Switch, InputNumber } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'

type CategoryType = 'MEDICAL' | 'NON_MEDICAL'

interface AssetCategoryPayload {
  name: string
  type: CategoryType
  requiresCalibration: boolean
  depreciationYears?: number | null
}

export function AssetCategoryForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { record?: AssetCategoryPayload & { id?: number } } | null
  const [form] = Form.useForm<AssetCategoryPayload>()
  const createMutation = useMutation({
    mutationKey: ['assetCategory', 'create'],
    mutationFn: (payload: AssetCategoryPayload) => {
      const fn = window.api?.query?.assetCategory?.create
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetCategory', 'list'] })
      navigate('/dashboard/asset/category')
    }
  })
  const updateMutation = useMutation({
    mutationKey: ['assetCategory', 'update'],
    mutationFn: (payload: AssetCategoryPayload & { id: number }) => {
      const fn = window.api?.query?.assetCategory?.update
      if (!fn) throw new Error('API assetCategory tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetCategory', 'list'] })
      navigate('/dashboard/asset/category')
    }
  })

  const isEdit = !!state?.record?.id
  if (isEdit) {
    form.setFieldsValue({
      name: state?.record?.name,
      type: state?.record?.type,
      requiresCalibration: state?.record?.requiresCalibration,
      depreciationYears: state?.record?.depreciationYears ?? null
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{isEdit ? 'Edit Kategori Aset' : 'Tambah Kategori Aset'}</h2>
      <Form form={form} layout="vertical" onFinish={(values) => {
        if (isEdit && state?.record?.id) {
          updateMutation.mutate({ ...values, id: state.record.id })
        } else {
          createMutation.mutate(values)
        }
      }}>
        <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="Tipe" rules={[{ required: true }]}> 
          <Radio.Group>
            <Radio value="MEDICAL">Medis</Radio>
            <Radio value="NON_MEDICAL">Non-Medis</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="requiresCalibration" label="Perlu Kalibrasi" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="depreciationYears" label="Umur Depresiasi (tahun)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/category')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetCategoryForm
